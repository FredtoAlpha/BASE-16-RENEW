/**
 * @fileoverview Service de diagnostic pour valider la cohérence des données.
 * Vérifie les doublons, les contraintes, les quotas, etc.
 */

const DiagnosticService = {
  /**
   * Lance une suite complète de diagnostics sur les données sources.
   * @returns {Array<Object>} Un tableau d'objets de résultats { message: string, status: 'ok'|'warning'|'error' }.
   */
  runGlobalDiagnostics: function() {
    const results = [];
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Tenter de récupérer les données consolidées. Si ça échoue, c'est une erreur bloquante.
    let allStudents;
    try {
      allStudents = this.getAllStudentsFromSources_();
      results.push({
        message: `${allStudents.length} élèves consolidés depuis les sources.`,
        status: 'ok'
      });
    } catch (e) {
      results.push({ message: `Erreur critique: Impossible de lire les onglets sources. ${e.message}`, status: 'error' });
      return results; // Arrêter ici si les sources ne sont pas lisibles.
    }

    // Diagnostic 1: Vérification des doublons d'ID_ELEVE
    const duplicateCheck = this.checkDuplicateIds_(allStudents);
    results.push(duplicateCheck);

    // Diagnostic 2: Cohérence des effectifs vs quotas de structure
    const structureCheck = this.checkStructureQuotas_(ss, allStudents);
    results.push(...structureCheck);

    // Ajouter d'autres diagnostics ici au besoin...

    return results;
  },

  /**
   * Récupère et consolide tous les élèves depuis les onglets sources.
   * @private
   * @returns {Array<Object>} Tableau d'objets élève.
   */
  getAllStudentsFromSources_: function() {
    // Utilise le service existant pour lire les données en mode 'PREVIOUS' (sources originales)
    const sourceClasses = getElevesDataForMode('PREVIOUS');
    if (!sourceClasses || sourceClasses.length === 0) {
      throw new Error("Aucun onglet source trouvé ou les onglets sont vides.");
    }

    let allStudents = [];
    sourceClasses.forEach(c => {
      if (c.eleves) {
        allStudents = allStudents.concat(c.eleves);
      }
    });
    return allStudents;
  },

  /**
   * Vérifie la présence d'ID_ELEVE en double.
   * @private
   * @param {Array<Object>} students - Le tableau de tous les élèves.
   * @returns {Object} Résultat du diagnostic.
   */
  checkDuplicateIds_: function(students) {
    const idCounts = students.reduce((acc, student) => {
      acc[student.id] = (acc[student.id] || 0) + 1;
      return acc;
    }, {});

    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);

    if (duplicates.length > 0) {
      const dupsStr = duplicates.map(([id, count]) => `${id} (x${count})`).join(', ');
      return {
        message: `Erreur: ${duplicates.length} ID élève en double trouvés: ${dupsStr}.`,
        status: 'error'
      };
    }

    return { message: "Aucun ID élève en double détecté.", status: 'ok' };
  },

  /**
   * Vérifie la cohérence entre les effectifs et les quotas de l'onglet _STRUCTURE.
   * @private
   * @param {Spreadsheet} ss - Le spreadsheet actif.
   * @param {Array<Object>} students - Le tableau de tous les élèves.
   * @returns {Array<Object>} Tableau de résultats de diagnostic.
   */
  checkStructureQuotas_: function(ss, students) {
    const results = [];
    const structureSheet = ss.getSheetByName('_STRUCTURE');
    if (!structureSheet) {
      results.push({ message: "Avertissement: L'onglet _STRUCTURE est introuvable.", status: 'warning' });
      return results;
    }

    const rules = getStructureRules();
    const totalCapacity = Object.values(rules).reduce((sum, rule) => sum + (rule.capacity || 0), 0);
    const totalStudents = students.length;

    if (totalStudents > totalCapacity) {
      results.push({
        message: `Erreur: Le nombre total d'élèves (${totalStudents}) dépasse la capacité totale des classes (${totalCapacity}).`,
        status: 'error'
      });
    } else if (totalStudents < totalCapacity * 0.9) {
       results.push({
        message: `Avertissement: Le nombre d'élèves (${totalStudents}) est très inférieur à la capacité totale (${totalCapacity}).`,
        status: 'warning'
      });
    } else {
       results.push({
        message: "La capacité totale des classes est cohérente avec l'effectif.",
        status: 'ok'
      });
    }

    // Vérification des quotas par option
    const studentOptions = students.reduce((acc, student) => {
      if (student.opt) acc[student.opt] = (acc[student.opt] || 0) + 1;
      if (student.lv2) acc[student.lv2] = (acc[student.lv2] || 0) + 1;
      return acc;
    }, {});

    const totalQuotas = {};
     Object.values(rules).forEach(rule => {
        for(const opt in rule.quotas){
            totalQuotas[opt] = (totalQuotas[opt] || 0) + rule.quotas[opt];
        }
     });

    for(const opt in studentOptions){
        if(totalQuotas[opt] === undefined){
            results.push({message: `Avertissement: L'option "${opt}" présente chez ${studentOptions[opt]} élèves n'a aucun quota défini dans _STRUCTURE.`, status: 'warning'});
        } else if (studentOptions[opt] > totalQuotas[opt]){
            results.push({message: `Erreur: Il y a ${studentOptions[opt]} élèves pour l'option "${opt}" mais seulement ${totalQuotas[opt]} places au total.`, status: 'error'});
        }
    }

    return results;
  }
};
