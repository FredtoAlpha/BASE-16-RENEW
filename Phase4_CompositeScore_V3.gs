/**
 * ===================================================================
 * PHASE 4 V3 - SCORE COMPOSITE (Parité + Harmonie des distributions)
 * ===================================================================
 *
 * Nouveau principe : Optimiser un score composite qui combine :
 * 1. Parité F/M (comme objectif principal, pas simple départage)
 * 2. Harmonie des distributions de scores (éviter classes élite/poubelle)
 *
 * L'idée clé : Chaque classe doit ressembler à la distribution globale,
 * avec une répartition harmonieuse des scores 1/2/3/4 dans chaque dimension.
 *
 * Score composite = weights.parity * deltaParity
 *                 + weights.com    * deltaCOM
 *                 + weights.tra    * deltaTRA
 *                 + weights.part   * deltaPART
 *                 + weights.abs    * deltaABS
 */

// ===================================================================
// CALCUL DE LA CIBLE DE DISTRIBUTION GLOBALE
// ===================================================================

/**
 * Calcule la cible de distribution globale pour chaque dimension et score
 *
 * Pour chaque dimension D (COM, TRA, PART, ABS) :
 * - Calcule le nombre total d'élèves avec score 1, 2, 3, 4
 * - Calcule la proportion p[D][s] = globalCount[D][s] / totalEleves
 * - Pour chaque classe C de taille sizeC, la cible est :
 *   target[D][C][s] = p[D][s] * sizeC
 *
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes
 * @param {Object} byClass - Index des élèves par classe
 * @returns {Object} { globalCounts, globalProportions, classCounts, classTargets }
 */
function calculateGlobalTargets_V3(data, headers, byClass) {
  const idxCOM = headers.indexOf('COM');
  const idxTRA = headers.indexOf('TRA');
  const idxPART = headers.indexOf('PART');
  const idxABS = headers.indexOf('ABS');

  const criteria = ['COM', 'TRA', 'PART', 'ABS'];
  const scores = [1, 2, 3, 4];

  // 1. Compter les scores globaux
  const globalCounts = {
    COM: { 1: 0, 2: 0, 3: 0, 4: 0 },
    TRA: { 1: 0, 2: 0, 3: 0, 4: 0 },
    PART: { 1: 0, 2: 0, 3: 0, 4: 0 },
    ABS: { 1: 0, 2: 0, 3: 0, 4: 0 }
  };

  let totalEleves = 0;

  for (const cls in byClass) {
    const indices = byClass[cls];
    indices.forEach(function(idx) {
      const com = Number(data[idx][idxCOM] || 3);
      const tra = Number(data[idx][idxTRA] || 3);
      const part = Number(data[idx][idxPART] || 3);
      const abs = Number(data[idx][idxABS] || 3);

      globalCounts.COM[com]++;
      globalCounts.TRA[tra]++;
      globalCounts.PART[part]++;
      globalCounts.ABS[abs]++;
      totalEleves++;
    });
  }

  // 2. Calculer les proportions globales
  const globalProportions = {};
  criteria.forEach(function(crit) {
    globalProportions[crit] = {};
    scores.forEach(function(s) {
      globalProportions[crit][s] = totalEleves > 0 ? globalCounts[crit][s] / totalEleves : 0.25;
    });
  });

  // 3. Calculer les counts actuels par classe
  const classCounts = calculateScoreDistributions_V3(data, headers, byClass);

  // 4. Calculer les cibles par classe
  const classTargets = {};
  for (const cls in byClass) {
    const sizeC = byClass[cls].length;
    classTargets[cls] = {};

    criteria.forEach(function(crit) {
      classTargets[cls][crit] = {};
      scores.forEach(function(s) {
        classTargets[cls][crit][s] = globalProportions[crit][s] * sizeC;
      });
    });
  }

  return {
    globalCounts: globalCounts,
    globalProportions: globalProportions,
    classCounts: classCounts,
    classTargets: classTargets,
    totalEleves: totalEleves
  };
}

// ===================================================================
// CALCUL DE L'ERREUR HARMONIQUE
// ===================================================================

/**
 * Calcule l'erreur harmonique : distance entre distribution réelle et cible
 *
 * Pour chaque dimension D, pour chaque classe C, pour chaque score s :
 * error[D] = Σ_C Σ_s |count[D][C][s] - target[D][C][s]|
 *
 * Plus l'erreur est basse, plus la distribution est harmonieuse.
 *
 * @param {Object} classCounts - Distributions réelles par classe
 * @param {Object} classTargets - Cibles par classe
 * @param {Object} weights - Poids par dimension
 * @returns {Object} { total, byDimension: { COM, TRA, PART, ABS } }
 */
function calculateHarmonicError_V3(classCounts, classTargets, weights) {
  const criteria = ['COM', 'TRA', 'PART', 'ABS'];
  const scores = [1, 2, 3, 4];

  const errorByDimension = {
    COM: 0,
    TRA: 0,
    PART: 0,
    ABS: 0
  };

  criteria.forEach(function(crit) {
    let errorD = 0;
    const weight = weights[crit.toLowerCase()] || 1.0;

    for (const cls in classTargets) {
      scores.forEach(function(s) {
        const count = classCounts[cls][crit][s] || 0;
        const target = classTargets[cls][crit][s] || 0;
        const diff = Math.abs(count - target);
        errorD += diff;
      });
    }

    errorByDimension[crit] = errorD * weight;
  });

  const totalError = errorByDimension.COM + errorByDimension.TRA +
                     errorByDimension.PART + errorByDimension.ABS;

  return {
    total: totalError,
    byDimension: errorByDimension
  };
}

// ===================================================================
// CALCUL DU SCORE COMPOSITE
// ===================================================================

/**
 * Calcule le score composite combinant parité et harmonie
 *
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes
 * @param {Object} byClass - Index des élèves par classe
 * @param {Object} weights - Poids incluant weights.parity
 * @param {Object} targets - Résultat de calculateGlobalTargets_V3 (optionnel, calculé si absent)
 * @returns {Object} {
 *   parityError,
 *   harmonicError,
 *   compositeScore,
 *   details: { parityWeight, harmonicDetails }
 * }
 */
function calculateCompositeScore_V3(data, headers, byClass, weights, targets) {
  // Calculer les cibles si pas fournies
  if (!targets) {
    targets = calculateGlobalTargets_V3(data, headers, byClass);
  }

  // 1. Erreur de parité (somme des |F-M| par classe)
  const parityError = calculateParityScore_V3(data, headers, byClass);

  // 2. Erreur harmonique (distance aux cibles)
  const harmonicError = calculateHarmonicError_V3(
    targets.classCounts,
    targets.classTargets,
    weights
  );

  // 3. Poids de parité (défaut : poids élevé pour priorité)
  const parityWeight = weights.parity !== undefined ? weights.parity : 2.0;

  // 4. Score composite (plus c'est bas, mieux c'est)
  const compositeScore = parityWeight * parityError + harmonicError.total;

  return {
    parityError: parityError,
    harmonicError: harmonicError,
    compositeScore: compositeScore,
    details: {
      parityWeight: parityWeight,
      parityComponent: parityWeight * parityError,
      harmonicComponent: harmonicError.total,
      harmonicByDimension: harmonicError.byDimension
    }
  };
}

// ===================================================================
// RECHERCHE DU MEILLEUR SWAP (VERSION COMPOSITE)
// ===================================================================

/**
 * Trouve le meilleur swap en optimisant le score composite
 *
 * Pour chaque swap candidat :
 * - Calcule le score composite avant/après
 * - Le delta = scoreBefore - scoreAfter (positif = amélioration)
 * - Prend le swap avec le meilleur delta
 *
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes
 * @param {Object} byClass - Index des élèves par classe
 * @param {Object} weights - Poids incluant weights.parity
 * @param {Object} ctx - Contexte avec quotas et contraintes
 * @param {Object} targets - Cibles globales (optionnel)
 * @returns {Object|null} { idx1, idx2, improvement, details } ou null
 */
function findBestSwap_CompositeV3(data, headers, byClass, weights, ctx, targets) {
  const idxMobilite = headers.indexOf('MOBILITE');
  const idxFixe = headers.indexOf('FIXE');
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');

  // Calculer les cibles globales une seule fois
  if (!targets) {
    targets = calculateGlobalTargets_V3(data, headers, byClass);
  }

  // Score actuel
  const currentScore = calculateCompositeScore_V3(data, headers, byClass, weights, targets);

  let bestSwap = null;
  let bestImprovement = 0.001; // Seuil minimum

  // Compteurs de debug
  let tested = 0;
  let blockedByMobility = 0;
  let blockedByDissoAsso = 0;
  let noImprovement = 0;

  const classes = Object.keys(byClass);

  // Essayer swaps entre paires de classes
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const cls1 = classes[i];
      const cls2 = classes[j];

      const indices1 = byClass[cls1];
      const indices2 = byClass[cls2];

      // Limiter recherche (performance)
      const max = 15;
      for (let s1 = 0; s1 < Math.min(indices1.length, max); s1++) {
        const idx1 = indices1[s1];

        // Vérifier mobilité
        const mob1 = String(data[idx1][idxMobilite] || '').toUpperCase();
        const fixe1 = String(data[idx1][idxFixe] || '').toUpperCase();
        if (mob1 === 'FIXE' || fixe1 === 'FIXE') {
          blockedByMobility++;
          continue;
        }

        for (let s2 = 0; s2 < Math.min(indices2.length, max); s2++) {
          const idx2 = indices2[s2];

          const mob2 = String(data[idx2][idxMobilite] || '').toUpperCase();
          const fixe2 = String(data[idx2][idxFixe] || '').toUpperCase();
          if (mob2 === 'FIXE' || fixe2 === 'FIXE') {
            blockedByMobility++;
            continue;
          }

          tested++;

          // Vérifier contraintes DISSO/ASSO/LV2/OPT
          const swapCheck = canSwapStudents_V3(idx1, cls1, idx2, cls2, data, headers, ctx);
          if (!swapCheck.ok) {
            blockedByDissoAsso++;
            continue;
          }

          // Simuler le swap
          const saved1 = data[idx1][idxAssigned];
          const saved2 = data[idx2][idxAssigned];

          data[idx1][idxAssigned] = cls2;
          data[idx2][idxAssigned] = cls1;

          // Update temporaire byClass
          byClass[cls1][s1] = idx2;
          byClass[cls2][s2] = idx1;

          // Recalculer les cibles (les effectifs de classe n'ont pas changé, mais les counts oui)
          const newTargets = {
            globalCounts: targets.globalCounts,
            globalProportions: targets.globalProportions,
            classCounts: calculateScoreDistributions_V3(data, headers, byClass),
            classTargets: targets.classTargets,
            totalEleves: targets.totalEleves
          };

          // Calculer nouveau score composite
          const newScore = calculateCompositeScore_V3(data, headers, byClass, weights, newTargets);

          // Amélioration = réduction du score (plus le score est bas, mieux c'est)
          const improvement = currentScore.compositeScore - newScore.compositeScore;

          // Restaurer
          data[idx1][idxAssigned] = saved1;
          data[idx2][idxAssigned] = saved2;
          byClass[cls1][s1] = idx1;
          byClass[cls2][s2] = idx2;

          // Décider si ce swap est meilleur
          if (improvement > bestImprovement) {
            bestImprovement = improvement;
            bestSwap = {
              idx1: idx1,
              idx2: idx2,
              improvement: improvement,
              details: {
                parityDelta: currentScore.parityError - newScore.parityError,
                harmonicDelta: currentScore.harmonicError.total - newScore.harmonicError.total,
                currentScore: currentScore.compositeScore,
                newScore: newScore.compositeScore
              }
            };
          } else {
            noImprovement++;
          }
        }
      }
    }
  }

  // Log des statistiques de recherche
  if (tested > 0 || blockedByMobility > 0 || blockedByDissoAsso > 0) {
    logLine('INFO', '  🔍 Recherche swap : ' + tested + ' testés, ' + blockedByMobility + ' bloqués (mobilité), ' +
            blockedByDissoAsso + ' bloqués (DISSO/ASSO), ' + noImprovement + ' sans amélioration');
  }

  if (bestSwap) {
    logLine('INFO', '  ✅ Meilleur swap trouvé : amélioration=' + bestImprovement.toFixed(3) +
            ' (parité: ' + bestSwap.details.parityDelta.toFixed(2) +
            ', harmonie: ' + bestSwap.details.harmonicDelta.toFixed(2) + ')');
  }

  return bestSwap;
}

// ===================================================================
// PHASE 4 PRINCIPALE (VERSION COMPOSITE)
// ===================================================================

/**
 * Phase 4 V3 : Optimise les classes avec score composite
 *
 * @param {Object} ctx - Contexte avec ss, weights, maxSwaps, parityTolerance
 * @returns {Object} { ok, swapsApplied, audit }
 */
function Phase4_balanceScoresSwaps_CompositeV3(ctx) {
  logLine('INFO', '='.repeat(80));
  logLine('INFO', '📌 PHASE 4 V3 - SCORE COMPOSITE (Parité + Harmonie)');
  logLine('INFO', '='.repeat(80));

  // Récupérer poids (depuis UI ou défaut)
  const weights = ctx.weights || {
    parity: 2.0,  // ✨ NOUVEAU : Poids de parité (objectif principal)
    com: 1.0,     // Priorité MAXIMALE pour COM
    tra: 0.7,
    part: 0.4,
    abs: 0.2
  };

  logLine('INFO', '⚖️ Poids : PARITY=' + weights.parity + ', COM=' + weights.com +
          ', TRA=' + weights.tra + ', PART=' + weights.part + ', ABS=' + weights.abs);

  const ss = ctx.ss || SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');

  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];

  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');

  // Grouper par classe
  const byClass = {};
  for (let i = 1; i < data.length; i++) {
    const cls = String(data[i][idxAssigned] || '').trim();
    if (cls) {
      if (!byClass[cls]) byClass[cls] = [];
      byClass[cls].push(i);
    }
  }

  logLine('INFO', '📖 Élèves par classe :');
  for (const cls in byClass) {
    logLine('INFO', '  ' + cls + ' : ' + byClass[cls].length + ' élèves');
  }

  // Calculer les cibles globales
  logLine('INFO', '📊 Calcul des cibles de distribution globale...');
  const targets = calculateGlobalTargets_V3(data, headers, byClass);

  logLine('INFO', '  Total élèves : ' + targets.totalEleves);
  logLine('INFO', '  Proportions globales COM : ' +
          JSON.stringify({
            '1': (targets.globalProportions.COM[1] * 100).toFixed(1) + '%',
            '2': (targets.globalProportions.COM[2] * 100).toFixed(1) + '%',
            '3': (targets.globalProportions.COM[3] * 100).toFixed(1) + '%',
            '4': (targets.globalProportions.COM[4] * 100).toFixed(1) + '%'
          }));

  // Score initial
  const initialScore = calculateCompositeScore_V3(data, headers, byClass, weights, targets);
  logLine('INFO', '📊 Score initial :');
  logLine('INFO', '  Composite : ' + initialScore.compositeScore.toFixed(2));
  logLine('INFO', '  Parité (×' + weights.parity + ') : ' + initialScore.parityError.toFixed(2) +
          ' → ' + initialScore.details.parityComponent.toFixed(2));
  logLine('INFO', '  Harmonie : ' + initialScore.harmonicError.total.toFixed(2) +
          ' (COM=' + initialScore.details.harmonicByDimension.COM.toFixed(1) +
          ', TRA=' + initialScore.details.harmonicByDimension.TRA.toFixed(1) +
          ', PART=' + initialScore.details.harmonicByDimension.PART.toFixed(1) +
          ', ABS=' + initialScore.details.harmonicByDimension.ABS.toFixed(1) + ')');

  // Optimisation par swaps
  let swapsApplied = 0;
  const maxSwaps = ctx.maxSwaps || 100;
  const maxIterations = maxSwaps * 10;

  let bestScore = initialScore.compositeScore;
  let stagnation = 0;

  for (let iter = 0; iter < maxIterations && swapsApplied < maxSwaps; iter++) {
    // Trouver meilleur swap
    const swap = findBestSwap_CompositeV3(data, headers, byClass, weights, ctx, targets);

    if (!swap) {
      logLine('INFO', '  🛑 Plus de swap bénéfique (iteration=' + iter + ')');
      break;
    }

    // Appliquer le swap
    const idx1 = swap.idx1;
    const idx2 = swap.idx2;
    const cls1 = String(data[idx1][idxAssigned]);
    const cls2 = String(data[idx2][idxAssigned]);

    data[idx1][idxAssigned] = cls2;
    data[idx2][idxAssigned] = cls1;

    // Update byClass
    const pos1 = byClass[cls1].indexOf(idx1);
    const pos2 = byClass[cls2].indexOf(idx2);
    if (pos1 >= 0) byClass[cls1][pos1] = idx2;
    if (pos2 >= 0) byClass[cls2][pos2] = idx1;

    swapsApplied++;

    // Log tous les 10 swaps
    if (swapsApplied % 10 === 0) {
      // Recalculer targets avec nouveaux counts
      const newTargets = {
        globalCounts: targets.globalCounts,
        globalProportions: targets.globalProportions,
        classCounts: calculateScoreDistributions_V3(data, headers, byClass),
        classTargets: targets.classTargets,
        totalEleves: targets.totalEleves
      };

      const newScore = calculateCompositeScore_V3(data, headers, byClass, weights, newTargets);
      const improvement = initialScore.compositeScore - newScore.compositeScore;

      logLine('INFO', '  📊 ' + swapsApplied + ' swaps | score=' + newScore.compositeScore.toFixed(2) +
              ' | amélioration=' + improvement.toFixed(2) +
              ' (parité=' + newScore.parityError.toFixed(1) +
              ', harmonie=' + newScore.harmonicError.total.toFixed(1) + ')');

      if (newScore.compositeScore >= bestScore) {
        stagnation++;
      } else {
        bestScore = newScore.compositeScore;
        stagnation = 0;
      }

      if (stagnation >= 5) {
        logLine('INFO', '  ⏸️ Stagnation détectée');
        break;
      }
    }
  }

  // Écrire dans _BASEOPTI
  baseSheet.getRange(1, 1, data.length, headers.length).setValues(data);
  SpreadsheetApp.flush();

  // Copier vers CACHE
  if (typeof copyBaseoptiToCache_V3 === 'function') {
    copyBaseoptiToCache_V3(ctx);
  }

  // Recalculer mobilité
  if (typeof computeMobilityFlags_ === 'function') {
    logLine('INFO', '🔒 Recalcul des statuts de mobilité après copie CACHE...');
    computeMobilityFlags_(ctx);
    logLine('INFO', '✅ Colonnes FIXE et MOBILITE restaurées dans les onglets CACHE');
  }

  // Score final
  const finalTargets = {
    globalCounts: targets.globalCounts,
    globalProportions: targets.globalProportions,
    classCounts: calculateScoreDistributions_V3(data, headers, byClass),
    classTargets: targets.classTargets,
    totalEleves: targets.totalEleves
  };

  const finalScore = calculateCompositeScore_V3(data, headers, byClass, weights, finalTargets);
  const totalImprovement = initialScore.compositeScore - finalScore.compositeScore;

  logLine('INFO', '');
  logLine('INFO', '✅ PHASE 4 V3 - SCORE COMPOSITE terminée');
  logLine('INFO', '  Swaps appliqués : ' + swapsApplied);
  logLine('INFO', '  Score initial : ' + initialScore.compositeScore.toFixed(2));
  logLine('INFO', '  Score final : ' + finalScore.compositeScore.toFixed(2));
  logLine('INFO', '  Amélioration : ' + totalImprovement.toFixed(2) +
          ' (' + (totalImprovement / initialScore.compositeScore * 100).toFixed(1) + '%)');
  logLine('INFO', '');
  logLine('INFO', '  Détails finaux :');
  logLine('INFO', '    Parité : ' + finalScore.parityError.toFixed(2) +
          ' (composante : ' + finalScore.details.parityComponent.toFixed(2) + ')');
  logLine('INFO', '    Harmonie : ' + finalScore.harmonicError.total.toFixed(2));
  logLine('INFO', '      COM : ' + finalScore.details.harmonicByDimension.COM.toFixed(2));
  logLine('INFO', '      TRA : ' + finalScore.details.harmonicByDimension.TRA.toFixed(2));
  logLine('INFO', '      PART : ' + finalScore.details.harmonicByDimension.PART.toFixed(2));
  logLine('INFO', '      ABS : ' + finalScore.details.harmonicByDimension.ABS.toFixed(2));

  // Audit complet
  const auditReport = typeof generateOptimizationAudit_V3 === 'function'
    ? generateOptimizationAudit_V3(ctx, data, headers, byClass, finalTargets.classCounts, {
        initialVariance: initialScore.compositeScore,
        finalVariance: finalScore.compositeScore,
        totalImprovement: totalImprovement,
        swapsApplied: swapsApplied
      })
    : null;

  // Afficher distributions finales par classe
  logLine('INFO', '');
  logLine('INFO', '📊 Distributions finales par classe :');
  for (const cls in byClass) {
    const counts = finalTargets.classCounts[cls];
    const targets_cls = finalTargets.classTargets[cls];

    logLine('INFO', '  ' + cls + ' (' + byClass[cls].length + ' élèves) :');
    logLine('INFO', '    COM : 1=' + counts.COM[1] + '(' + targets_cls.COM[1].toFixed(1) + '), ' +
            '2=' + counts.COM[2] + '(' + targets_cls.COM[2].toFixed(1) + '), ' +
            '3=' + counts.COM[3] + '(' + targets_cls.COM[3].toFixed(1) + '), ' +
            '4=' + counts.COM[4] + '(' + targets_cls.COM[4].toFixed(1) + ')');
  }

  return {
    ok: true,
    swapsApplied: swapsApplied,
    swaps: swapsApplied,
    initialScore: initialScore,
    finalScore: finalScore,
    improvement: totalImprovement,
    audit: auditReport
  };
}
