// ... (début du fichier ConsolePilotage_Server.gs) ...

/**
 * Ouvre l'Interface V2 pour les swaps manuels après avoir injecté le contexte.
 */
function openInterfaceV2() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const testSheets = ss.getSheets().filter(s => s.getName().endsWith('TEST'));
    if (testSheets.length === 0) throw new Error("Aucun onglet ...TEST trouvé.");

    // 1. Extraire le contexte (données des onglets TEST)
    const context = {
      sheets: testSheets.map(s => s.getName()),
      // On pourrait ajouter plus de données ici : élèves, classes, etc.
    };

    // 2. Stocker le contexte pour que l'Interface V2 puisse le lire
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('JULES_CONTEXT', JSON.stringify(context));

    // 3. Lancer l'Interface V2
    // (en supposant qu'elle a sa propre fonction de lancement)
    if (typeof showInterfaceV2 === "function") {
      showInterfaceV2();
    } else {
      SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('InterfaceV2'));
    }

    return { status: 'success', message: 'Ouverture de l\'Interface V2 avec le contexte actuel...' };

  } catch (e) {
    throw new Error("Impossible d'ouvrir l'Interface V2: " + e.message);
  }
}

/**
 * Fournit le contexte de pont à l'InterfaceV2 et le supprime ensuite.
 * C'est la fonction appelée par l'InterfaceV2 à son initialisation.
 * @returns {Object} Un objet contenant {success: Boolean, context: Object|null}.
 */
/**
 * Copie les onglets ...TEST vers ...DEF.
 * C'est l'action finale et irréversible de la console.
 */
function finalizeProcess() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const testSheets = ss.getSheets().filter(s => s.getName().endsWith('TEST'));

    if (testSheets.length === 0) {
      throw new Error("Aucun onglet ...TEST à finaliser.");
    }

    let finalizedCount = 0;
    testSheets.forEach(sheet => {
      const sheetName = sheet.getName();
      const finalName = sheetName.replace(/TEST$/, 'DEF');

      // Supprimer l'ancien onglet DEF s'il existe
      const oldDefSheet = ss.getSheetByName(finalName);
      if (oldDefSheet) {
        ss.deleteSheet(oldDefSheet);
      }

      // Copier l'onglet TEST vers le nouvel onglet DEF
      const newDefSheet = sheet.copyTo(ss);
      newDefSheet.setName(finalName);

      // Rendre la feuille visible et la protéger (facultatif)
      newDefSheet.showSheet();

      finalizedCount++;
    });

    return { success: true, message: `${finalizedCount} classe(s) ont été finalisées avec succès.` };
  } catch (e) {
    console.error(`Erreur dans finalizeProcess: ${e.message}`);
    return { success: false, error: e.message };
  }
}

function getBridgeContextAndClear() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const contextString = userProperties.getProperty('JULES_CONTEXT');

    if (contextString) {
      // Le contexte a été trouvé, on le supprime pour ne pas le réutiliser.
      userProperties.deleteProperty('JULES_CONTEXT');
      console.log('🌉 Contexte de pont trouvé et supprimé.');
      return { success: true, context: JSON.parse(contextString) };
    } else {
      console.log('🤷 Aucun contexte de pont trouvé.');
      return { success: true, context: null };
    }
  } catch (e) {
    console.error(`Erreur dans getBridgeContextAndClear: ${e.message}`);
    return { success: false, error: e.message };
  }
}
