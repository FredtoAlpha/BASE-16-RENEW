/**
 * ===================================================================
 * WIZARD BACKEND - Fonctions serveur pour l'interface wizard
 * ===================================================================
 *
 * Ce fichier contient toutes les fonctions Apps Script nécessaires
 * pour gérer le wizard multiphase :
 * - Sauvegarde/restauration de session
 * - Modèles de configuration
 * - Import CSV
 * - Intégration avec les fonctions existantes
 *
 * Date : 2025-11-15
 * ===================================================================
 */

// ===================================================================
// MENU & OUVERTURE
// ===================================================================

/**
 * Ouvre l'interface wizard dans une sidebar
 */
function ouvrirWizardInterface() {
  const html = HtmlService.createHtmlOutputFromFile('WizardInterface')
    .setTitle('Assistant de Configuration')
    .setWidth(1200);

  SpreadsheetApp.getUi().showModalDialog(html, 'BASE-16 RENEW - Configuration Complète');
}

// ===================================================================
// SAUVEGARDE & RESTAURATION DE SESSION
// ===================================================================

/**
 * Sauvegarde l'état actuel du wizard
 * @param {Object} state - État du wizard à sauvegarder
 */
function sauvegarderEtatWizard(state) {
  try {
    const userProps = PropertiesService.getUserProperties();
    const timestamp = new Date().getTime();

    // Sauvegarder l'état avec timestamp
    const stateWithTimestamp = {
      ...state,
      timestamp: timestamp,
      savedAt: new Date().toISOString()
    };

    userProps.setProperty('WIZARD_STATE', JSON.stringify(stateWithTimestamp));

    Logger.log(`✅ État wizard sauvegardé (phase ${state.phase})`);
    return { success: true, message: 'Session sauvegardée' };

  } catch (e) {
    Logger.log(`❌ Erreur sauvegarde wizard: ${e}`);
    throw new Error(`Impossible de sauvegarder la session: ${e.message}`);
  }
}

/**
 * Charge l'état sauvegardé du wizard
 * @returns {Object|null} État sauvegardé ou null si aucun
 */
function chargerEtatWizard() {
  try {
    const userProps = PropertiesService.getUserProperties();
    const savedState = userProps.getProperty('WIZARD_STATE');

    if (!savedState) {
      Logger.log('ℹ️ Aucune session wizard sauvegardée');
      return null;
    }

    const state = JSON.parse(savedState);
    Logger.log(`✅ État wizard chargé (phase ${state.phase}, sauvegardé le ${state.savedAt})`);
    return state;

  } catch (e) {
    Logger.log(`❌ Erreur chargement wizard: ${e}`);
    return null;
  }
}

/**
 * Supprime l'état sauvegardé
 */
function supprimerEtatWizard() {
  try {
    PropertiesService.getUserProperties().deleteProperty('WIZARD_STATE');
    Logger.log('✅ Session wizard supprimée');
    return { success: true };
  } catch (e) {
    Logger.log(`❌ Erreur suppression session: ${e}`);
    throw new Error(`Impossible de supprimer la session: ${e.message}`);
  }
}

// ===================================================================
// MODÈLES DE CONFIGURATION
// ===================================================================

/**
 * Sauvegarde un modèle de configuration
 * @param {string} nom - Nom du modèle
 * @param {Object} config - Configuration à sauvegarder
 */
function sauvegarderModeleConfig(nom, config) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let modelesSheet = ss.getSheetByName('_MODELES_CONFIG');

    // Créer l'onglet s'il n'existe pas
    if (!modelesSheet) {
      modelesSheet = ss.insertSheet('_MODELES_CONFIG');
      modelesSheet.hideSheet();

      // En-têtes
      modelesSheet.getRange(1, 1, 1, 3).setValues([
        ['NOM', 'DATE_CREATION', 'CONFIG_JSON']
      ]).setFontWeight('bold').setBackground('#d5dbdb');
    }

    // Chercher si le modèle existe déjà
    const data = modelesSheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nom) {
        rowIndex = i + 1;
        break;
      }
    }

    const configJSON = JSON.stringify(config);
    const dateCreation = new Date().toISOString();

    if (rowIndex > 0) {
      // Mise à jour
      modelesSheet.getRange(rowIndex, 2, 1, 2).setValues([[dateCreation, configJSON]]);
    } else {
      // Nouveau modèle
      const newRow = modelesSheet.getLastRow() + 1;
      modelesSheet.getRange(newRow, 1, 1, 3).setValues([[nom, dateCreation, configJSON]]);
    }

    Logger.log(`✅ Modèle "${nom}" sauvegardé`);
    return { success: true, message: `Modèle "${nom}" sauvegardé` };

  } catch (e) {
    Logger.log(`❌ Erreur sauvegarde modèle: ${e}`);
    throw new Error(`Impossible de sauvegarder le modèle: ${e.message}`);
  }
}

/**
 * Charge un modèle de configuration
 * @param {string} nom - Nom du modèle à charger
 * @returns {Object} Configuration du modèle
 */
function chargerModeleConfig(nom) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const modelesSheet = ss.getSheetByName('_MODELES_CONFIG');

    if (!modelesSheet) {
      throw new Error('Aucun modèle sauvegardé');
    }

    const data = modelesSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nom) {
        const config = JSON.parse(data[i][2]);
        Logger.log(`✅ Modèle "${nom}" chargé`);
        return config;
      }
    }

    throw new Error(`Modèle "${nom}" introuvable`);

  } catch (e) {
    Logger.log(`❌ Erreur chargement modèle: ${e}`);
    throw new Error(`Impossible de charger le modèle: ${e.message}`);
  }
}

/**
 * Liste tous les modèles disponibles
 * @returns {Array} Liste des modèles
 */
function listerModelesConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const modelesSheet = ss.getSheetByName('_MODELES_CONFIG');

    if (!modelesSheet) {
      return [];
    }

    const data = modelesSheet.getDataRange().getValues();
    const modeles = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        modeles.push({
          nom: data[i][0],
          dateCreation: data[i][1],
          // On ne retourne pas la config complète, juste les infos
        });
      }
    }

    return modeles;

  } catch (e) {
    Logger.log(`❌ Erreur liste modèles: ${e}`);
    return [];
  }
}

/**
 * Supprime un modèle
 * @param {string} nom - Nom du modèle à supprimer
 */
function supprimerModeleConfig(nom) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const modelesSheet = ss.getSheetByName('_MODELES_CONFIG');

    if (!modelesSheet) {
      throw new Error('Aucun modèle trouvé');
    }

    const data = modelesSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nom) {
        modelesSheet.deleteRow(i + 1);
        Logger.log(`✅ Modèle "${nom}" supprimé`);
        return { success: true, message: `Modèle "${nom}" supprimé` };
      }
    }

    throw new Error(`Modèle "${nom}" introuvable`);

  } catch (e) {
    Logger.log(`❌ Erreur suppression modèle: ${e}`);
    throw new Error(`Impossible de supprimer le modèle: ${e.message}`);
  }
}

// ===================================================================
// IMPORT CSV
// ===================================================================

/**
 * Import CSV dans un onglet source
 * @param {string} csvContent - Contenu du fichier CSV
 * @param {string} targetSheet - Nom de l'onglet cible
 * @returns {Object} Résultat de l'import
 */
function importCSVVersOnglet(csvContent, targetSheet) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(targetSheet);

    if (!sheet) {
      throw new Error(`Onglet "${targetSheet}" introuvable`);
    }

    // Parser CSV
    const csvData = Utilities.parseCsv(csvContent);

    if (!csvData || csvData.length === 0) {
      throw new Error('Fichier CSV vide');
    }

    // Détecter les colonnes
    const mapping = detecterColonnesCSV(csvData[0]);

    Logger.log(`Mapping détecté: ${JSON.stringify(mapping)}`);

    // Récupérer les en-têtes de l'onglet cible
    const targetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Transformer les données
    const dataTransformee = transformerDonneesCSV(csvData.slice(1), mapping, targetHeaders);

    // Écrire dans l'onglet (à partir de la ligne 2)
    if (dataTransformee.length > 0) {
      sheet.getRange(2, 1, dataTransformee.length, dataTransformee[0].length)
           .setValues(dataTransformee);
    }

    Logger.log(`✅ Import CSV: ${dataTransformee.length} lignes importées dans ${targetSheet}`);

    return {
      success: true,
      lignesImportees: dataTransformee.length,
      colonnesMappees: mapping
    };

  } catch (e) {
    Logger.log(`❌ Erreur import CSV: ${e}`);
    throw new Error(`Erreur lors de l'import: ${e.message}`);
  }
}

/**
 * Détecte automatiquement les colonnes d'un CSV
 * @param {Array} headers - En-têtes du CSV
 * @returns {Object} Mapping colonne CSV -> colonne système
 */
function detecterColonnesCSV(headers) {
  const mapping = {};
  const config = getConfig();
  const aliases = config.COLUMN_ALIASES || {};

  headers.forEach((header, index) => {
    const headerUpper = String(header).trim().toUpperCase();

    // Chercher dans les alias
    for (const [canonicalName, aliasList] of Object.entries(aliases)) {
      if (aliasList && aliasList.map(a => a.toUpperCase()).includes(headerUpper)) {
        mapping[index] = canonicalName;
        break;
      }
    }

    // Si pas trouvé, essayer une correspondance directe
    if (!mapping[index]) {
      mapping[index] = headerUpper;
    }
  });

  return mapping;
}

/**
 * Transforme les données CSV pour correspondre au format de l'onglet cible
 * @param {Array} csvData - Données du CSV
 * @param {Object} mapping - Mapping des colonnes
 * @param {Array} targetHeaders - En-têtes de l'onglet cible
 * @returns {Array} Données transformées
 */
function transformerDonneesCSV(csvData, mapping, targetHeaders) {
  const transformedData = [];

  csvData.forEach(row => {
    // Créer une ligne vide avec la bonne longueur
    const newRow = new Array(targetHeaders.length).fill('');

    // Remplir les colonnes selon le mapping
    for (const [csvIndex, canonicalName] of Object.entries(mapping)) {
      const targetIndex = targetHeaders.indexOf(canonicalName);

      if (targetIndex >= 0 && row[csvIndex] !== undefined) {
        newRow[targetIndex] = row[csvIndex];
      }
    }

    // N'ajouter que les lignes non vides
    if (newRow.some(cell => cell !== '')) {
      transformedData.push(newRow);
    }
  });

  return transformedData;
}

// ===================================================================
// INTÉGRATION AVEC LES FONCTIONS EXISTANTES
// ===================================================================

/**
 * Wrapper pour initialiserSysteme avec retour structuré
 */
function wizard_initialiserSysteme(niveau, nbSources, nbDest, lv2Options, optOptions) {
  try {
    // Appeler la fonction existante
    initialiserSysteme(niveau, nbSources, nbDest, lv2Options, optOptions);

    return {
      success: true,
      message: 'Système initialisé avec succès',
      data: {
        niveau: niveau,
        nbSources: nbSources,
        nbDestinations: nbDest,
        lv2: lv2Options,
        opt: optOptions
      }
    };

  } catch (e) {
    Logger.log(`❌ Erreur initialisation: ${e}`);
    throw new Error(`Erreur lors de l'initialisation: ${e.message}`);
  }
}

/**
 * Wrapper pour genererNomPrenomEtID
 */
function wizard_genererNomPrenomEtID() {
  try {
    genererNomPrenomEtID();

    return {
      success: true,
      message: 'NOM_PRENOM et ID_ELEVE générés avec succès'
    };

  } catch (e) {
    Logger.log(`❌ Erreur génération: ${e}`);
    throw new Error(`Erreur lors de la génération: ${e.message}`);
  }
}

/**
 * Wrapper pour ajouterListesDeroulantes
 */
function wizard_ajouterListesDeroulantes() {
  try {
    ajouterListesDeroulantes();

    return {
      success: true,
      message: 'Listes déroulantes appliquées avec succès'
    };

  } catch (e) {
    Logger.log(`❌ Erreur listes déroulantes: ${e}`);
    throw new Error(`Erreur lors de l'application des listes: ${e.message}`);
  }
}

/**
 * Wrapper pour verifierDonnees
 */
function wizard_verifierDonnees() {
  try {
    const result = verifierDonnees();

    return {
      success: true,
      message: result,
      hasErrors: result.includes('problème')
    };

  } catch (e) {
    Logger.log(`❌ Erreur vérification: ${e}`);
    throw new Error(`Erreur lors de la vérification: ${e.message}`);
  }
}

/**
 * Wrapper pour consoliderDonnees
 */
function wizard_consoliderDonnees() {
  try {
    const result = consoliderDonnees();

    return {
      success: true,
      message: result
    };

  } catch (e) {
    Logger.log(`❌ Erreur consolidation: ${e}`);
    throw new Error(`Erreur lors de la consolidation: ${e.message}`);
  }
}

/**
 * Récupère les informations de structure actuelle
 */
function wizard_getStructureInfo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const structureSheet = ss.getSheetByName('_STRUCTURE');

    if (!structureSheet) {
      return null;
    }

    const data = structureSheet.getDataRange().getValues();
    const sourceSheets = [];
    const testSheets = [];
    const defSheets = [];

    for (let i = 1; i < data.length; i++) {
      const type = data[i][0];
      const nom = data[i][1];

      if (type === 'SOURCE') {
        sourceSheets.push(nom);
      } else if (type === 'TEST') {
        testSheets.push(nom);
      } else if (type === 'DEF') {
        defSheets.push(nom);
      }
    }

    return {
      sources: sourceSheets,
      test: testSheets,
      def: defSheets,
      totalSources: sourceSheets.length,
      totalDestinations: testSheets.length
    };

  } catch (e) {
    Logger.log(`❌ Erreur récupération structure: ${e}`);
    return null;
  }
}

/**
 * Récupère la configuration actuelle depuis _CONFIG
 */
function wizard_getConfig() {
  try {
    return getConfig();
  } catch (e) {
    Logger.log(`❌ Erreur récupération config: ${e}`);
    return CONFIG; // Retourner la config par défaut
  }
}

// ===================================================================
// PROGRESSION TEMPS RÉEL (pour Phase 4)
// ===================================================================

/**
 * Stocke la progression du pipeline LEGACY
 */
function emettreProgression(phase, pourcentage, log) {
  try {
    const startTime = PropertiesService.getUserProperties().getProperty('LEGACY_START_TIME');
    const tempsEcoule = startTime ? (new Date().getTime() - parseInt(startTime)) / 1000 : 0;
    const tempsRestant = pourcentage > 0 ? (tempsEcoule / pourcentage) * (100 - pourcentage) : 0;

    const payload = {
      phase: phase,
      pourcentage: pourcentage,
      tempsEcoule: tempsEcoule,
      tempsRestant: tempsRestant,
      timestamp: new Date().getTime(),
      log: log || null
    };

    PropertiesService.getUserProperties()
      .setProperty('LEGACY_PROGRESS', JSON.stringify(payload));

  } catch (e) {
    Logger.log(`⚠️ Erreur émission progression: ${e}`);
  }
}

/**
 * Récupère la progression actuelle
 */
function getLegacyProgress() {
  try {
    const progress = PropertiesService.getUserProperties()
      .getProperty('LEGACY_PROGRESS');

    return progress ? JSON.parse(progress) : null;
  } catch (e) {
    Logger.log(`⚠️ Erreur lecture progression: ${e}`);
    return null;
  }
}

/**
 * Initialise le tracking de temps pour le pipeline
 */
function initLegacyProgress() {
  PropertiesService.getUserProperties()
    .setProperty('LEGACY_START_TIME', new Date().getTime().toString());
}

/**
 * Nettoie le tracking de progression
 */
function cleanLegacyProgress() {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty('LEGACY_PROGRESS');
  userProps.deleteProperty('LEGACY_START_TIME');
}
