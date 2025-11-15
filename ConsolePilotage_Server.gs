/**
 * @fileoverview Fonctions serveur pour la Console de Pilotage V4.
 * Gère les appels depuis l'interface HTML et orchestre les actions.
 */

/**
 * Affiche la sidebar de la Console de Pilotage.
 * Fonction appelée par le menu.
 */
function showPilotageConsole() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('ConsolePilotage')
      .setWidth(1200)
      .setTitle('🚀 Console de Pilotage V4');
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (error) {
    Logger.log('ERREUR dans showPilotageConsole: ' + error.toString());
    SpreadsheetApp.getUi().alert('Erreur lors de l\'ouverture de la console: ' + error.toString());
  }
}

/**
 * Fonction wrapper pour permettre à la console d'appeler le service de diagnostic.
 * @returns {Array<Object>} Un tableau d'objets de résultats de diagnostic.
 */
function runGlobalDiagnostics() {
  // Assurez-vous que DiagnosticService est disponible
  if (typeof DiagnosticService === 'undefined' || !DiagnosticService.runGlobalDiagnostics) {
    throw new Error("Le service de diagnostic n'est pas disponible.");
  }
  return DiagnosticService.runGlobalDiagnostics();
}

/**
 * Crée un "pont" de contexte pour l'InterfaceV2 en utilisant PropertiesService.
 * Cela permet à l'InterfaceV2 de savoir quels onglets charger (TEST, FIN, etc.).
 * @param {string} mode - Le mode à charger (ex: 'TEST').
 * @param {string} [classe] - Optionnel, la classe spécifique à charger.
 */
function setBridgeContext(mode, classe) {
  try {
    const context = {
      mode: mode || 'TEST',
      classe: classe || null,
      timestamp: new Date().toISOString()
    };
    // Utiliser UserProperties pour un contexte par utilisateur
    PropertiesService.getUserProperties().setProperty('JULES_CONTEXT', JSON.stringify(context));
    Logger.log(`Pont de contexte créé pour le mode ${mode}`);
    return { success: true };
  } catch (e) {
    Logger.log(`Erreur lors de la création du pont de contexte: ${e.toString()}`);
    throw new Error("Impossible de créer le pont de contexte pour l'autre interface.");
  }
}

/**
 * Processus de finalisation : copie les onglets ...TEST vers ...FIN.
 * C'est une action destructrice et irréversible.
 */
function finalizeProcess() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    const testSheets = ss.getSheets().filter(s => s.getName().endsWith('TEST'));
    if (testSheets.length === 0) {
      throw new Error("Aucun onglet ...TEST à finaliser n'a été trouvé.");
    }

    let count = 0;
    testSheets.forEach(sheet => {
      const baseName = sheet.getName().replace(/TEST$/, '');
      const finalName = baseName + 'FIN';

      // Supprimer l'ancien onglet FIN s'il existe
      const oldFinSheet = ss.getSheetByName(finalName);
      if (oldFinSheet) {
        ss.deleteSheet(oldFinSheet);
      }

      // Copier et renommer
      const newSheet = sheet.copyTo(ss);
      newSheet.setName(finalName);

      // Appliquer le formatage final
      // (Supposant qu'une fonction de formatage `formatFinSheet` existe)
      if (typeof formatFinSheet === 'function') {
        const data = newSheet.getDataRange().getValues();
        const header = data[0];
        const rowData = data.slice(1);
        formatFinSheet(newSheet, rowData, header);
      }

      count++;
    });

    Logger.log(`${count} onglets ont été finalisés.`);
    return { success: true, message: `${count} classes ont été finalisées avec succès.` };

  } catch (error) {
    Logger.log(`Erreur de finalisation: ${error.toString()}`);
    throw new Error(`La finalisation a échoué: ${error.message}`);
  }
}

/**
 * Sauvegarde la configuration dans la feuille _CONFIG sans popups.
 * @param {Object} config - Objet de configuration avec tous les paramètres
 * @returns {Object} Résultat de l'opération
 */
function saveConfiguration(config) {
  try {
    Logger.log('saveConfiguration: Début sauvegarde configuration...');
    Logger.log('Configuration reçue: ' + JSON.stringify(config));

    // Mettre à jour chaque paramètre dans _CONFIG via updateConfig
    if (config.niveau) updateConfig('NIVEAU', config.niveau);
    if (config.lv2) updateConfig('LV2', config.lv2);
    if (config.opt) updateConfig('OPT', config.opt);
    if (config.maxSwaps) updateConfig('MAX_SWAPS', config.maxSwaps);
    if (config.parityTolerance) updateConfig('PARITY_TOLERANCE', config.parityTolerance);
    if (config.testSuffix) updateConfig('TEST_SUFFIX', config.testSuffix);
    if (config.defSuffix) updateConfig('DEF_SUFFIX', config.defSuffix);

    Logger.log('Configuration sauvegardée avec succès');
    return { success: true, message: 'Configuration sauvegardée' };

  } catch (error) {
    Logger.log('Erreur saveConfiguration: ' + error.toString());
    throw new Error('Erreur lors de la sauvegarde : ' + error.message);
  }
}

/**
 * Lance l'initialisation du système directement avec les paramètres fournis, sans popups.
 * @param {string} niveau - Niveau scolaire (6°, 5°, 4°, 3°)
 * @param {number} nbSources - Nombre de classes sources
 * @param {number} nbDest - Nombre de classes destinations
 * @param {Array<string>} lv2 - Tableau des LV2
 * @param {Array<string>} opt - Tableau des options
 * @returns {Object} Résultat de l'opération
 */
function initialiserSystemeDirect(niveau, nbSources, nbDest, lv2, opt) {
  try {
    Logger.log('=== initialiserSystemeDirect: Début ===');
    Logger.log(`Niveau: ${niveau}, Sources: ${nbSources}, Dest: ${nbDest}`);
    Logger.log(`LV2: ${JSON.stringify(lv2)}, OPT: ${JSON.stringify(opt)}`);

    // Appeler la fonction d'initialisation existante qui fait le vrai travail
    if (typeof initialiserSysteme === 'function') {
      initialiserSysteme(niveau, nbSources, nbDest, lv2, opt);
      return { success: true, message: 'Système initialisé avec succès' };
    } else {
      throw new Error('La fonction initialiserSysteme n\'est pas disponible');
    }

  } catch (error) {
    Logger.log('Erreur initialiserSystemeDirect: ' + error.toString());
    throw new Error('Erreur lors de l\'initialisation : ' + error.message);
  }
}
