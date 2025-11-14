/**
 * ===================================================================
 * 📋 PRIME LEGACY - MENU GOOGLE SHEETS
 * ===================================================================
 *
 * Menu Google Sheets pour PRIME LEGACY
 * ⚙️ LEGACY : Interface utilisateur complète
 *
 * Date : 2025-11-13
 * Branche : claude/prime-legacy-cleanup-015Zz6D3gh1QcbpR19TUYMLw
 *
 * ===================================================================
 */

/**
 * Crée le menu LEGACY dans l'interface Google Sheets
 * ✅ Appeler depuis Code.gs > onOpen()
 */
function createLegacyMenu_PRIME() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('⚙️ PRIME LEGACY')
    .addItem('📊 Statut Pipeline', 'legacy_showPipelineStatus')
    .addSeparator()
    .addItem('🚀 Pipeline Complet (Sources → TEST)', 'legacy_runFullPipeline_PRIME')
    .addSeparator()
    .addSubMenu(ui.createMenu('🔧 Phases Individuelles')
      .addItem('🎯 Phase 1 - Options & LV2', 'legacy_runPhase1_PRIME')
      .addItem('🔗 Phase 2 - ASSO/DISSO', 'legacy_runPhase2_PRIME')
      .addItem('⚖️ Phase 3 - Effectifs & Parité', 'legacy_runPhase3_PRIME')
      .addItem('🔄 Phase 4 - Équilibrage Scores (OPTIMUM PRIME)', 'legacy_runPhase4_PRIME'))
    .addSeparator()
    .addItem('📋 Voir Classes Sources', 'legacy_viewSourceClasses_PRIME')
    .addItem('📊 Voir Résultats TEST', 'legacy_viewTestResults_PRIME')
    .addToUi();

  logLine('INFO', '✅ Menu PRIME LEGACY créé');
}

/**
 * Affiche les classes sources détectées
 */
function legacy_viewSourceClasses_PRIME() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();

    const sourceSheets = allSheets.filter(function(s) {
      return /^(ECOLE\d+|[3-6]°\d+)$/.test(s.getName());
    });

    sourceSheets.sort(function(a, b) {
      return a.getName().localeCompare(b.getName());
    });

    // Compter les élèves par source
    let details = '';
    let totalEleves = 0;

    sourceSheets.forEach(function(s) {
      const numEleves = Math.max(0, s.getLastRow() - 1);
      totalEleves += numEleves;
      details += '• ' + s.getName() + ' : ' + numEleves + ' élèves\n';
    });

    ui.alert(
      '📋 Classes Sources Détectées',
      'ONGLETS SOURCES (' + sourceSheets.length + ') :\n\n' +
      details +
      '\nTOTAL : ' + totalEleves + ' élèves\n\n' +
      (sourceSheets.length > 0
        ? '✅ Prêt à lancer le pipeline LEGACY'
        : '⚠️ Aucun onglet source trouvé'),
      ui.ButtonSet.OK
    );

  } catch (e) {
    ui.alert('❌ Erreur', e.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Affiche les résultats dans les onglets TEST
 */
function legacy_viewTestResults_PRIME() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();

    const testSheets = allSheets.filter(function(s) {
      return s.getName().endsWith('TEST');
    });

    testSheets.sort(function(a, b) {
      return a.getName().localeCompare(b.getName());
    });

    if (testSheets.length === 0) {
      ui.alert(
        '⚠️ Aucun Résultat TEST',
        'Aucun onglet TEST trouvé.\n\n' +
        'Lancez d\'abord le pipeline LEGACY pour créer les onglets TEST.',
        ui.ButtonSet.OK
      );
      return;
    }

    // Compter les élèves par TEST
    let details = '';
    let totalEleves = 0;
    let totalAssigned = 0;

    testSheets.forEach(function(s) {
      const numEleves = Math.max(0, s.getLastRow() - 1);
      totalEleves += numEleves;

      // Compter élèves assignés
      if (numEleves > 0) {
        const data = s.getDataRange().getValues();
        const headers = data[0];
        const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');

        if (idxAssigned >= 0) {
          for (let i = 1; i < data.length; i++) {
            if (String(data[i][idxAssigned] || '').trim()) {
              totalAssigned++;
            }
          }
        }
      }

      details += '• ' + s.getName() + ' : ' + numEleves + ' élèves\n';
    });

    const pctAssigned = totalEleves > 0
      ? ((totalAssigned / totalEleves) * 100).toFixed(1)
      : 0;

    ui.alert(
      '📊 Résultats TEST',
      'ONGLETS TEST (' + testSheets.length + ') :\n\n' +
      details +
      '\nTOTAL : ' + totalEleves + ' élèves\n' +
      'ASSIGNÉS : ' + totalAssigned + ' (' + pctAssigned + '%)\n\n' +
      '✅ Pipeline exécuté avec succès',
      ui.ButtonSet.OK
    );

  } catch (e) {
    ui.alert('❌ Erreur', e.toString(), ui.ButtonSet.OK);
  }
}
