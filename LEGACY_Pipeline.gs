/**
 * ===================================================================
 * 🚀 PRIME LEGACY - PIPELINE PRINCIPAL
 * ===================================================================
 *
 * Pipeline LEGACY optimisé basé sur OPTIMUM PRIME (BASEOPTI V3)
 *
 * ARCHITECTURE :
 * - LECTURE : Onglets sources (°1, °2, etc.)
 * - ÉCRITURE : Onglets TEST
 * - LOGIQUE : Phases BASEOPTI V3 (OPTIMUM PRIME - 0 bugs)
 *
 * ISOLATION COMPLÈTE :
 * - OPTI : _BASEOPTI → _CACHE → FIN
 * - LEGACY : Sources (°1, °2) → TEST
 * - 0 INTERFÉRENCE : Onglets différents, fonctions partagées sûres
 *
 * Date : 2025-11-13
 * Branche : claude/PRIME-LEGACY-01SJDcJv7zHGGBXWhHpzfnxr
 *
 * ===================================================================
 */

// ===================================================================
// PIPELINE COMPLET LEGACY
// ===================================================================

/**
 * Lance le pipeline LEGACY complet
 * Sources (6°1, 6°2...) → TEST (6°1TEST, 6°2TEST...)
 *
 * @returns {Object} Résultat du pipeline avec statistiques
 */
function legacy_runFullPipeline_PRIME() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '🚀 PRIME LEGACY - Pipeline Complet',
    'Cette action va :\n\n' +
    '1. Détecter automatiquement les onglets sources (°1, °2, etc.)\n' +
    '2. Créer les onglets TEST\n' +
    '3. Lancer les 3 phases optimisées du pipeline :\n' +
    '   • Phase 1 : Options & LV2\n' +
    '   • Phase 2 : ASSO/DISSO\n' +
    '   • Phase 3 : Équilibrage final (Effectifs, Parité & Scores)\n\n' +
    'Durée estimée : 2-5 minutes\n\n' +
    'Continuer ?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    logLine('INFO', '❌ Pipeline LEGACY annulé par l\'utilisateur');
    return { ok: false, message: 'Annulé par l\'utilisateur' };
  }

  try {
    const startTime = new Date();
    SpreadsheetApp.getActiveSpreadsheet().toast('🚀 Lancement PRIME LEGACY...', 'En cours', -1);

    logLine('INFO', '='.repeat(80));
    logLine('INFO', '🚀 PRIME LEGACY - PIPELINE COMPLET');
    logLine('INFO', '='.repeat(80));

    // ========== ÉTAPE 1 : CONSTRUIRE CONTEXTE LEGACY ==========
    SpreadsheetApp.getActiveSpreadsheet().toast('Détection onglets sources...', 'Initialisation', -1);

    // ✅ FIX: Détection automatique des onglets sources (°1, °2, etc.)
    const ctx = typeof makeCtxFromSourceSheets_LEGACY === 'function'
      ? makeCtxFromSourceSheets_LEGACY()
      : null;

    if (!ctx) {
      throw new Error('❌ makeCtxFromSourceSheets_LEGACY() non trouvée ! Vérifier LEGACY_Context.gs');
    }

    logLine('INFO', '📋 Contexte LEGACY créé :');
    logLine('INFO', '  • Sources : ' + (ctx.srcSheets || []).join(', '));
    logLine('INFO', '  • Destinations TEST : ' + (ctx.cacheSheets || []).join(', '));
    logLine('INFO', '  • Niveaux : ' + (ctx.niveaux || []).join(', '));

    // ========== ÉTAPE 2 : CRÉER ONGLETS TEST ==========
    SpreadsheetApp.getActiveSpreadsheet().toast('Création onglets TEST...', 'Initialisation', -1);

    if (typeof initEmptyTestTabs_LEGACY === 'function') {
      const initResult = initEmptyTestTabs_LEGACY(ctx);
      logLine('INFO', '✅ Onglets TEST créés : ' + (initResult.opened || []).join(', '));
    } else {
      throw new Error('❌ initEmptyTestTabs_LEGACY() non trouvée ! Vérifier LEGACY_Init_Onglets.gs');
    }

    // ========== ÉTAPE 3 : PHASE 1 - OPTIONS & LV2 ==========
    SpreadsheetApp.getActiveSpreadsheet().toast('Phase 1/3...', 'Options & LV2', -1);
    logLine('INFO', '');

    if (typeof Phase1I_dispatchOptionsLV2_LEGACY === 'function') {
      const p1Result = Phase1I_dispatchOptionsLV2_LEGACY(ctx);
      logLine('INFO', '✅ Phase 1 terminée : ' + JSON.stringify(p1Result.counts || {}));
    } else {
      throw new Error('❌ Phase1I_dispatchOptionsLV2_LEGACY() non trouvée ! Vérifier LEGACY_Phase1_OptionsLV2.gs');
    }

    // ========== ÉTAPE 4 : PHASE 2 - ASSO/DISSO ==========
    SpreadsheetApp.getActiveSpreadsheet().toast('Phase 2/3...', 'ASSO/DISSO', -1);
    logLine('INFO', '');

    if (typeof Phase2I_applyDissoAsso_LEGACY === 'function') {
      const p2Result = Phase2I_applyDissoAsso_LEGACY(ctx);
      logLine('INFO', '✅ Phase 2 terminée : ASSO=' + (p2Result.asso || 0) + ', DISSO=' + (p2Result.disso || 0));
    } else {
      throw new Error('❌ Phase2I_applyDissoAsso_LEGACY() non trouvée ! Vérifier LEGACY_Phase2_DissoAsso.gs');
    }

    // ========== ÉTAPE 5 : PHASE 3 - OPTIMISATION FINALE (OPTIMUM PRIME) ==========
    SpreadsheetApp.getActiveSpreadsheet().toast('Phase 3/3...', 'Équilibrage Scores (OPTIMUM PRIME)', -1);
    logLine('INFO', '');

    if (typeof Phase4_balanceScoresSwaps_LEGACY === 'function') {
      const p4Result = Phase4_balanceScoresSwaps_LEGACY(ctx);
      logLine('INFO', '✅ Phase 3 (Optimisation) terminée : ' + (p4Result.swapsApplied || 0) + ' swaps appliqués');
    } else {
      throw new Error('❌ Phase4_balanceScoresSwaps_LEGACY() non trouvée ! Vérifier LEGACY_Phase4_Optimisation.gs');
    }

    // ========== ÉTAPE 6 : FINALISATION ==========
    const duration = ((new Date() - startTime) / 1000).toFixed(1);

    // Compter les onglets TEST créés
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const testSheets = ss.getSheets().filter(function(s) {
      return s.getName().endsWith('TEST');
    });

    logLine('INFO', '');
    logLine('INFO', '='.repeat(80));
    logLine('INFO', '✅ PRIME LEGACY - PIPELINE COMPLET RÉUSSI');
    logLine('INFO', '='.repeat(80));
    logLine('INFO', '  • Durée : ' + duration + 's');
    logLine('INFO', '  • Onglets TEST créés : ' + testSheets.length);
    logLine('INFO', '  • Onglets : ' + testSheets.map(function(s) { return s.getName(); }).join(', '));
    logLine('INFO', '='.repeat(80));

    ui.alert(
      '✅ PRIME LEGACY - Pipeline Terminé',
      'Pipeline complet réussi en ' + duration + 's\n\n' +
      testSheets.length + ' onglet(s) TEST créé(s) :\n' +
      testSheets.map(function(s) { return '• ' + s.getName(); }).join('\n') + '\n\n' +
      'Vous pouvez maintenant :\n' +
      '• Vérifier les résultats dans les onglets TEST\n' +
      '• Utiliser COMPTER pour analyser la répartition\n' +
      '• Copier vers FIN si satisfait',
      ui.ButtonSet.OK
    );

    return {
      ok: true,
      message: 'Pipeline LEGACY réussi',
      duration: duration,
      testSheets: testSheets.length
    };

  } catch (e) {
    logLine('ERROR', '❌ Erreur PRIME LEGACY : ' + e.toString());
    logLine('ERROR', 'Stack : ' + (e.stack || 'N/A'));

    ui.alert(
      '❌ Erreur PRIME LEGACY',
      'Une erreur est survenue :\n\n' + e.toString() + '\n\n' +
      'Consultez les logs pour plus de détails.',
      ui.ButtonSet.OK
    );

    return { ok: false, message: e.toString() };

  } finally {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
  }
}

// ===================================================================
// PHASES INDIVIDUELLES LEGACY
// ===================================================================

/**
 * Lance Phase 1 LEGACY - Options & LV2
 */
function legacy_runPhase1_PRIME() {
  const ui = SpreadsheetApp.getUi();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('🎯 Phase 1 LEGACY en cours...', 'Options & LV2', -1);

    logLine('INFO', '🎯 PHASE 1 LEGACY - Options & LV2');

    // Construire le contexte LEGACY
    const ctx = typeof makeCtxFromSourceSheets_LEGACY === 'function'
      ? makeCtxFromSourceSheets_LEGACY()
      : null;

    if (!ctx) throw new Error('makeCtxFromSourceSheets_LEGACY() non trouvée');

    // Lancer Phase 1 LEGACY
    if (typeof Phase1I_dispatchOptionsLV2_LEGACY === 'function') {
      const result = Phase1I_dispatchOptionsLV2_LEGACY(ctx);

      ui.alert(
        '✅ Phase 1 LEGACY Terminée',
        'Options & LV2 répartis avec succès\n\n' +
        'Élèves placés :\n' +
        Object.keys(result.counts || {}).map(function(opt) {
          return '• ' + opt + ' : ' + result.counts[opt];
        }).join('\n'),
        ui.ButtonSet.OK
      );

      return result;
    } else {
      throw new Error('Phase1I_dispatchOptionsLV2_LEGACY() non trouvée');
    }

  } catch (e) {
    logLine('ERROR', '❌ Erreur Phase 1 LEGACY : ' + e.toString());
    ui.alert('❌ Erreur Phase 1 LEGACY', e.toString(), ui.ButtonSet.OK);
    return { ok: false, message: e.toString() };

  } finally {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
  }
}

/**
 * Lance Phase 2 LEGACY - ASSO/DISSO
 */
function legacy_runPhase2_PRIME() {
  const ui = SpreadsheetApp.getUi();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('🔗 Phase 2 LEGACY en cours...', 'ASSO/DISSO', -1);

    logLine('INFO', '🔗 PHASE 2 LEGACY - ASSO/DISSO');

    const ctx = typeof makeCtxFromSourceSheets_LEGACY === 'function'
      ? makeCtxFromSourceSheets_LEGACY()
      : null;

    if (!ctx) throw new Error('makeCtxFromSourceSheets_LEGACY() non trouvée');

    if (typeof Phase2I_applyDissoAsso_LEGACY === 'function') {
      const result = Phase2I_applyDissoAsso_LEGACY(ctx);

      ui.alert(
        '✅ Phase 2 LEGACY Terminée',
        'ASSO/DISSO appliqués avec succès\n\n' +
        '• ASSO : ' + (result.asso || 0) + ' élèves\n' +
        '• DISSO : ' + (result.disso || 0) + ' codes',
        ui.ButtonSet.OK
      );

      return result;
    } else {
      throw new Error('Phase2I_applyDissoAsso_LEGACY() non trouvée');
    }

  } catch (e) {
    logLine('ERROR', '❌ Erreur Phase 2 LEGACY : ' + e.toString());
    ui.alert('❌ Erreur Phase 2 LEGACY', e.toString(), ui.ButtonSet.OK);
    return { ok: false, message: e.toString() };

  } finally {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
  }
}

/**
 * Lance la Phase 3 (Optimisation Finale) LEGACY - Équilibrage Scores (OPTIMUM PRIME)
 */
function legacy_runPhase4_PRIME() {
  const ui = SpreadsheetApp.getUi();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('🔄 Phase 4 LEGACY en cours...', 'Équilibrage Scores (OPTIMUM PRIME)', -1);

    logLine('INFO', '🔄 PHASE 4 LEGACY - Équilibrage Scores (OPTIMUM PRIME)');

    const ctx = typeof makeCtxFromSourceSheets_LEGACY === 'function'
      ? makeCtxFromSourceSheets_LEGACY()
      : null;

    if (!ctx) throw new Error('makeCtxFromSourceSheets_LEGACY() non trouvée');

    if (typeof Phase4_balanceScoresSwaps_LEGACY === 'function') {
      const result = Phase4_balanceScoresSwaps_LEGACY(ctx);

      ui.alert(
        '✅ Phase 4 LEGACY Terminée (OPTIMUM PRIME)',
        'Équilibrage scores terminé avec succès\n\n' +
        '• Swaps appliqués : ' + (result.swapsApplied || 0) + '\n' +
        '• Algorithme : OPTIMUM PRIME (0 bugs)',
        ui.ButtonSet.OK
      );

      return result;
    } else {
      throw new Error('Phase4_balanceScoresSwaps_LEGACY() non trouvée');
    }

  } catch (e) {
    logLine('ERROR', '❌ Erreur Phase 4 LEGACY : ' + e.toString());
    ui.alert('❌ Erreur Phase 4 LEGACY', e.toString(), ui.ButtonSet.OK);
    return { ok: false, message: e.toString() };

  } finally {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
  }
}

// ===================================================================
// UTILITAIRES PIPELINE
// ===================================================================

/**
 * Affiche le statut actuel du pipeline LEGACY
 */
function legacy_showPipelineStatus() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Détecter onglets sources
    const allSheets = ss.getSheets();
    const sourceSheets = allSheets.filter(function(s) {
      return /^(ECOLE\d+|[3-6]°\d+)$/.test(s.getName());
    });

    // Détecter onglets TEST
    const testSheets = allSheets.filter(function(s) {
      return s.getName().endsWith('TEST');
    });

    ui.alert(
      '📊 Statut PRIME LEGACY',
      'ONGLETS SOURCES (' + sourceSheets.length + ') :\n' +
      sourceSheets.map(function(s) { return '• ' + s.getName(); }).join('\n') +
      '\n\nONGLETS TEST (' + testSheets.length + ') :\n' +
      (testSheets.length > 0
        ? testSheets.map(function(s) { return '• ' + s.getName(); }).join('\n')
        : '• Aucun onglet TEST (lancer le pipeline)') +
      '\n\n' +
      (testSheets.length === 0
        ? '🚀 Prêt à lancer le pipeline !'
        : '✅ Pipeline déjà exécuté'),
      ui.ButtonSet.OK
    );

  } catch (e) {
    ui.alert('❌ Erreur', e.toString(), ui.ButtonSet.OK);
  }
}
