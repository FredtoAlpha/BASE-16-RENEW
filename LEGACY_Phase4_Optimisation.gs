/**
 * ===================================================================
 * 🔄 PRIME LEGACY - PHASE 4 : ÉQUILIBRAGE SCORES (OPTIMUM PRIME)
 * ===================================================================
 *
 * Basé sur : OPTIMUM PRIME (Phase4_balanceScoresSwaps_BASEOPTI_V3)
 * Phase 4 : Optimise via swaps (Harmonie académique & Parité)
 * LIT : Onglets TEST
 * ÉCRIT : Onglets TEST (swaps _CLASS_ASSIGNED)
 *
 * Date : 2025-11-13
 * Branche : claude/prime-legacy-cleanup-015Zz6D3gh1QcbpR19TUYMLw
 *
 * ===================================================================
 */

/**
 * Phase 4 LEGACY : Équilibrage Scores via Swaps (OPTIMUM PRIME)
 * ✅ IMPLÉMENTATION FONCTIONNELLE basée sur OPTIMUM PRIME
 */
function Phase4_balanceScoresSwaps_LEGACY(ctx) {
  logLine('INFO', '='.repeat(80));
  logLine('INFO', '📌 PHASE 4 LEGACY - Équilibrage Scores (OPTIMUM PRIME)');
  logLine('INFO', '='.repeat(80));

  const ss = ctx.ss || SpreadsheetApp.getActive();
  const maxSwaps = ctx.maxSwaps || 500;
  const weights = ctx.weights || { parity: 1.0, com: 1.0, tra: 0.5, part: 0.3, abs: 0.2 };

  // ========== CONSOLIDER DONNÉES ==========
  const allData = [];
  let headersRef = null;

  (ctx.cacheSheets || []).forEach(function(testName) {
    const testSheet = ss.getSheetByName(testName);
    if (!testSheet || testSheet.getLastRow() <= 1) return;

    const data = testSheet.getDataRange().getValues();
    if (!headersRef) headersRef = data[0];

    for (let i = 1; i < data.length; i++) {
      allData.push({
        sheetName: testName,
        row: data[i],
        index: i
      });
    }
  });

  if (allData.length === 0) {
    return { ok: false, swapsApplied: 0 };
  }

  const idxAssigned = headersRef.indexOf('_CLASS_ASSIGNED');
  const idxSexe = headersRef.indexOf('SEXE');
  const idxCOM = headersRef.indexOf('COM');
  const idxTRA = headersRef.indexOf('TRA');
  const idxPART = headersRef.indexOf('PART');
  const idxABS = headersRef.indexOf('ABS');
  const idxMobilite = headersRef.indexOf('MOBILITE');
  const idxFixe = headersRef.indexOf('FIXE');

  // ========== PLACEMENT DES ÉLÈVES NON ASSIGNÉS (LOGIQUE DE L'ANCIENNE PHASE 3) ==========
  let placedCount = 0;
  for (let i = 0; i < allData.length; i++) {
    const item = allData[i];
    if (String(item.row[idxAssigned] || '').trim()) continue;

    // Trouver la classe cible la moins remplie en respectant les effectifs de _STRUCTURE
    const targetClass = findLeastPopulatedClass_Phase4(allData, headersRef, ctx);
    item.row[idxAssigned] = targetClass;
    placedCount++;
  }
  if (placedCount > 0) {
    logLine('INFO', '  ✅ ' + placedCount + ' élèves non assignés ont été placés.');
  }


  // ========== GROUPER PAR CLASSE ==========
  const byClass = {};
  for (let i = 0; i < allData.length; i++) {
    const cls = String(allData[i].row[idxAssigned] || '').trim();
    if (cls) {
      if (!byClass[cls]) byClass[cls] = [];
      byClass[cls].push(i);
    }
  }

  // ========== SWAPS OPTIMISATION (MOTEURS SILENCIEUX) ==========
  let swapsApplied = 0;
  const stabilityAnchor = {}; // Pour éviter les oscillations infinies

  for (let iter = 0; iter < maxSwaps; iter++) {
    const scoreBefore = calculateGlobalScore(allData, byClass, headersRef, weights);

    let bestSwap = null;
    let bestGain = 0;

    // --- 1. Identifier la classe la plus déséquilibrée ---
    // (Simplification : on itère sur toutes les classes et tous les élèves)

    const classes = Object.keys(byClass);
    for (let c1 = 0; c1 < classes.length; c1++) {
      const cls1 = classes[c1];
      const indices1 = byClass[cls1];

      // --- 2. Identifier l'élève "perturbateur" ---
      for (let i = 0; i < indices1.length; i++) {
        const i1 = indices1[i];

        // Ignorer les élèves fixes ou ceux qui ont déjà beaucoup bougé
        if (String(allData[i1].row[idxFixe] || '').toUpperCase() === 'FIXE' ||
            String(allData[i1].row[idxMobilite] || '').toUpperCase() === 'FIXE' ||
            (stabilityAnchor[i1] || 0) > 3) {
          continue;
        }

        // --- 3. Chercher le meilleur partenaire d'échange dans les autres classes ---
        for (let c2 = c1 + 1; c2 < classes.length; c2++) {
          const cls2 = classes[c2];
          const indices2 = byClass[cls2];

          for (let j = 0; j < indices2.length; j++) {
            const i2 = indices2[j];

            // Ignorer les élèves fixes ou instables
            if (String(allData[i2].row[idxFixe] || '').toUpperCase() === 'FIXE' ||
                String(allData[i2].row[idxMobilite] || '').toUpperCase() === 'FIXE' ||
                (stabilityAnchor[i2] || 0) > 3) {
              continue;
            }

            // Simuler le swap en créant une copie de la structure byClass
            const tempByClass = JSON.parse(JSON.stringify(byClass));
            const indexInCls1 = tempByClass[cls1].indexOf(i1);
            const indexInCls2 = tempByClass[cls2].indexOf(i2);

            if (indexInCls1 > -1 && indexInCls2 > -1) {
              tempByClass[cls1][indexInCls1] = i2;
              tempByClass[cls2][indexInCls2] = i1;
            }

            const scoreAfter = calculateGlobalScore(allData, tempByClass, headersRef, weights);
            const gain = scoreBefore - scoreAfter;

            // Pas besoin d'annuler, la simulation est sur une copie

            if (gain > bestGain) {
              bestGain = gain;
              bestSwap = { i1: i1, i2: i2, cls1: cls1, cls2: cls2 };
            }
          }
        }
      }
    }

    // --- 4. Appliquer le meilleur swap trouvé ---
    if (bestSwap && bestGain > 0.01) {
      const { i1, i2, cls1, cls2 } = bestSwap;

      // Appliquer le swap
      allData[i1].row[idxAssigned] = cls2;
      allData[i2].row[idxAssigned] = cls1;

      // Mettre à jour la structure 'byClass' pour refléter le changement
      const indexInCls1 = byClass[cls1].indexOf(i1);
      const indexInCls2 = byClass[cls2].indexOf(i2);
      if(indexInCls1 > -1 && indexInCls2 > -1) {
          byClass[cls1][indexInCls1] = i2;
          byClass[cls2][indexInCls2] = i1;
      }

      swapsApplied++;

      // Mettre à jour l'ancre de stabilité
      stabilityAnchor[i1] = (stabilityAnchor[i1] || 0) + 1;
      stabilityAnchor[i2] = (stabilityAnchor[i2] || 0) + 1;

      if (swapsApplied % 10 === 0) {
        logLine('INFO', '  🔄 ' + swapsApplied + ' swaps (gain: ' + bestGain.toFixed(2) + ', score: ' + (scoreBefore - bestGain).toFixed(2) + ')');
      }
    } else {
      logLine('INFO', '  🛑 Convergence atteinte après ' + swapsApplied + ' swaps (aucun swap bénéfique trouvé).');
      break;
    }
  }

  // ========== RÉÉCRIRE ==========
  const bySheet = {};
  for (let i = 0; i < allData.length; i++) {
    const item = allData[i];
    if (!bySheet[item.sheetName]) bySheet[item.sheetName] = [];
    bySheet[item.sheetName].push(item);
  }

  for (const sheetName in bySheet) {
    const testSheet = ss.getSheetByName(sheetName);
    if (!testSheet) continue;

    const items = bySheet[sheetName];
    const allRows = [headersRef];
    items.forEach(function(item) {
      allRows.push(item.row);
    });

    testSheet.getRange(1, 1, allRows.length, headersRef.length).setValues(allRows);
  }

  SpreadsheetApp.flush();

  logLine('INFO', '✅ PHASE 4 LEGACY terminée : ' + swapsApplied + ' swaps appliqués');

  return { ok: true, swapsApplied: swapsApplied };
}

/**
 * Calcule le score global d'harmonie (erreur à minimiser) en se basant sur la distance de distribution.
 * Un score plus faible signifie un meilleur équilibre.
 */
function calculateGlobalScore(allData, byClass, headers, weights) {
  const idxSexe = headers.indexOf('SEXE');
  const criteria = [
    { name: 'COM', index: headers.indexOf('COM'), weight: weights.com || 1.0 },
    { name: 'TRA', index: headers.indexOf('TRA'), weight: weights.tra || 0.5 },
    { name: 'PART', index: headers.indexOf('PART'), weight: weights.part || 0.3 },
    { name: 'ABS', index: headers.indexOf('ABS'), weight: weights.abs || 0.2 }
  ];

  let totalScore = 0;

  // ========== 1. SCORE DE PARITÉ ==========
  let parityError = 0;
  for (const cls in byClass) {
    const indices = byClass[cls];
    let countF = 0;
    indices.forEach(function(i) {
      if (String(allData[i].row[idxSexe] || '').toUpperCase() === 'F') countF++;
    });
    const countM = indices.length - countF;
    parityError += Math.abs(countF - countM);
  }
  totalScore += parityError * (weights.parity || 1.0);

  // ========== 2. SCORE D'HARMONIE ACADÉMIQUE (DISTANCE DE DISTRIBUTION) ==========

  // --- a) Calculer la distribution globale de référence pour chaque critère ---
  const globalDists = {};
  criteria.forEach(function(crit) {
    if (crit.index === -1) return;

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, total: 0 };
    allData.forEach(function(item) {
      const score = parseInt(item.row[crit.index], 10) || 3; // Par défaut à 3 si vide/invalide
      if (score >= 1 && score <= 4) {
        dist[score]++;
        dist.total++;
      }
    });

    // Normaliser en pourcentages
    for (let s = 1; s <= 4; s++) {
      dist[s] = (dist.total > 0) ? (dist[s] / dist.total) * 100 : 0;
    }
    globalDists[crit.name] = dist;
  });

  // --- b) Calculer l'erreur de chaque classe par rapport à la distribution globale ---
  let harmonyError = 0;
  for (const cls in byClass) {
    const indices = byClass[cls];
    if (indices.length === 0) continue;

    criteria.forEach(function(crit) {
      if (crit.index === -1) return;

      // Calculer la distribution de la classe
      const classDist = { 1: 0, 2: 0, 3: 0, 4: 0, total: indices.length };
      indices.forEach(function(i) {
        const score = parseInt(allData[i].row[crit.index], 10) || 3;
        if (score >= 1 && score <= 4) {
          classDist[score]++;
        }
      });

      // Normaliser en pourcentages
      for (let s = 1; s <= 4; s++) {
        classDist[s] = (classDist.total > 0) ? (classDist[s] / classDist.total) * 100 : 0;
      }

      // Calculer l'erreur (distance de Manhattan) entre la distrib de la classe et la distrib globale
      let classError = 0;
      const globalDist = globalDists[crit.name];
      for (let s = 1; s <= 4; s++) {
        classError += Math.abs(classDist[s] - globalDist[s]);
      }

      // Pondérer par le poids du critère et ajouter à l'erreur d'harmonie
      harmonyError += classError * crit.weight;
    });
  }

  totalScore += harmonyError;
  return totalScore;
}

/**
 * Helper pour trouver la classe la moins remplie, en tenant compte des effectifs cibles de _STRUCTURE.
 * @param {Array} allData - Toutes les données des élèves.
 * @param {Array} headers - Les en-têtes de colonnes.
 * @param {Object} ctx - Le contexte du pipeline LEGACY.
 * @returns {string} Le nom de la classe la moins remplie.
 */
function findLeastPopulatedClass_Phase4(allData, headers, ctx) {
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const classCounts = {};

  // Initialiser les compteurs pour toutes les classes cibles définies dans _STRUCTURE
  (ctx.niveaux || []).forEach(function(cls) {
    classCounts[cls] = 0;
  });

  // Compter les élèves déjà assignés dans chaque classe
  for (let i = 0; i < allData.length; i++) {
    const cls = String(allData[i].row[idxAssigned] || '').trim();
    if (cls && classCounts.hasOwnProperty(cls)) {
      classCounts[cls]++;
    }
  }

  let minClass = null;
  let minFillRatio = Infinity;

  // Trouver la classe avec le ratio de remplissage (effectif actuel / effectif cible) le plus bas
  for (const cls in classCounts) {
    const targetSize = (ctx.effectifs && ctx.effectifs[cls]) ? ctx.effectifs[cls] : 25; // Utilise 25 comme effectif par défaut
    const currentSize = classCounts[cls];

    if (currentSize >= targetSize) continue; // Ne pas choisir une classe déjà pleine ou au-delà

    const fillRatio = currentSize / targetSize;

    if (fillRatio < minFillRatio) {
      minFillRatio = fillRatio;
      minClass = cls;
    }
  }

  // S'il n'y a pas de classe disponible (par ex. toutes pleines), retourner la première par défaut
  return minClass || (ctx.niveaux && ctx.niveaux.length > 0 ? ctx.niveaux[0] : '6°1');
}
