/**
 * ===================================================================
 * 🚀 JULES/INTERCONFIG - CONSOLE DE PILOTAGE (VERSION FINALE CONSOLIDÉE)
 * ===================================================================
 */
function showPilotageConsole() {
  const html = HtmlService.createHtmlOutputFromFile('ConsolePilotage').setWidth(900).setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, 'Console de Pilotage');
}
function setupInitialEnvironment(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (let i = 1; i <= config.nbSources; i++) createSheetIfNotExists(ss, `ECOLE${i}`, ['ID_ELEVE', 'NOM', 'PRENOM', 'SEXE', 'ASSO', 'DISSO', 'LV2', 'OPT', 'COM', 'TRA', 'PART', 'ABS']);
  createSheetIfNotExists(ss, 'CONSOLIDATION', ['ID_ELEVE', 'NOM', 'PRENOM', 'SEXE', 'ASSO', 'DISSO', 'SOURCE_SHEET']);
  const structureHeaders = ['CLASSE_DESTINATION', 'EFFECTIF_CIBLE', 'QUOTA_F', 'QUOTA_G', ...config.lv2.map(l => `QUOTA_${l}`), ...config.options.map(o => `QUOTA_${o}`)];
  createSheetIfNotExists(ss, '_STRUCTURE', structureHeaders);
  const configSheet = createSheetIfNotExists(ss, '_CONFIG');
  configSheet.getRange(1, 1, 5, 2).setValues([
    ['NIVEAU_SCOLAIRE', config.niveau], ['LV2_DISPONIBLES', config.lv2.join(',')],
    ['OPTIONS_DISPONIBLES', config.options.join(',')], ['NB_CLASSES_SOURCES', config.nbSources],
    ['NB_CLASSES_DESTINATIONS', config.nbDestinations]
  ]);
  return { message: `${config.nbSources} onglets sources et de configuration créés.` };
}
function runIdAndNameGeneration() { genererNomPrenomEtID(); return { message: 'Génération des IDs et noms terminée.' }; }
function applyDropdownsToSourceSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet(), config = getConfigFromSheet(), sourceSheets = getSourceSheets(ss, config.NB_CLASSES_SOURCES);
    const rules = {
        sexe: SpreadsheetApp.newDataValidation().requireValueInList(['M', 'F']).build(),
        score: SpreadsheetApp.newDataValidation().requireValueInList(['1', '2', '3', '4']).build(),
        lv2: SpreadsheetApp.newDataValidation().requireValueInList(config.LV2_DISPONIBLES).build(),
        opt: SpreadsheetApp.newDataValidation().requireValueInList(config.OPTIONS_DISPONIBLES).build()
    };
    sourceSheets.forEach(sheet => {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        applyRuleToColumn(sheet, 'SEXE', headers, rules.sexe);
        applyRuleToColumn(sheet, 'LV2', headers, rules.lv2);
        applyRuleToColumn(sheet, 'OPT', headers, rules.opt);
        ['COM', 'TRA', 'PART', 'ABS'].forEach(col => applyRuleToColumn(sheet, col, headers, rules.score));
    });
    return { message: 'Listes déroulantes appliquées.' };
}
function consolidateSourceData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet(), config = getConfigFromSheet(), sourceSheets = getSourceSheets(ss, config.NB_CLASSES_SOURCES);
    const consolidationSheet = ss.getSheetByName('CONSOLIDATION');
    if (consolidationSheet.getLastRow() > 1) consolidationSheet.getRange(2, 1, consolidationSheet.getLastRow() - 1, consolidationSheet.getLastColumn()).clearContent();
    let allData = [];
    sourceSheets.forEach(sheet => {
        if (sheet.getLastRow() > 1) {
            allData = allData.concat(sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(r => {r[6] = sheet.getName(); return r;}));
        }
    });
    if (allData.length > 0) consolidationSheet.getRange(2, 1, allData.length, allData[0].length).setValues(allData);
    return { message: `${allData.length} élèves consolidés.` };
}
function loadConfiguration() { /* ... */ }
function saveConfiguration(classesData) { /* ... */ }
function runPreflightDiagnostics() { /* ... */ }
function executeLegacyPipeline() { /* ... */ }
function openInterfaceV2() { /* ... */ }
function finalizeProcess() { /* ... */ }
function createSheetIfNotExists(ss, name, headers) { let s = ss.getSheetByName(name); if(s) ss.deleteSheet(s); s = ss.insertSheet(name); if(headers) s.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold'); }
function getConfigFromSheet() { /* ... */ }
function getSourceSheets(ss, nb) { /* ... */ }
function applyRuleToColumn(sheet, col, headers, rule) { const i = headers.indexOf(col); if(i > -1) sheet.getRange(2, i + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule); }
