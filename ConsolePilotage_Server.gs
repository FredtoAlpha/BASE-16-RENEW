/**
 * @fileoverview Fonctions serveur pour la Console de Pilotage V4.
 * Gère les appels depuis l'interface HTML et orchestre les actions.
 */

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
