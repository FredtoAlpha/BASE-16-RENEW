/**
 * ===================================================================
 * TESTS UNITAIRES - PHASE 4 SCORE COMPOSITE
 * ===================================================================
 *
 * Tests pour valider le bon fonctionnement du nouveau système composite
 */

/**
 * Fonction principale de test - Exécute tous les tests
 */
function runAllPhase4CompositeTests() {
  Logger.log('='.repeat(80));
  Logger.log('🧪 TESTS UNITAIRES - PHASE 4 SCORE COMPOSITE');
  Logger.log('='.repeat(80));
  Logger.log('');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Liste des tests à exécuter
  const tests = [
    testCalculateGlobalTargets,
    testCalculateHarmonicError,
    testCalculateCompositeScore,
    testCompositeScoreWithDifferentWeights,
    testParityComponent,
    testHarmonicErrorReduction,
    testNoExtremeClasses,
    testSwapImprovesCompositeScore
  ];

  // Exécuter chaque test
  tests.forEach(function(testFunc) {
    results.total++;
    try {
      const result = testFunc();
      if (result.passed) {
        results.passed++;
        Logger.log('✅ ' + result.name);
      } else {
        results.failed++;
        Logger.log('❌ ' + result.name + ' : ' + result.message);
      }
      results.tests.push(result);
    } catch (e) {
      results.failed++;
      Logger.log('❌ ' + testFunc.name + ' : EXCEPTION : ' + e.message);
      results.tests.push({
        name: testFunc.name,
        passed: false,
        message: 'Exception: ' + e.message
      });
    }
  });

  // Résumé
  Logger.log('');
  Logger.log('='.repeat(80));
  Logger.log('📊 RÉSUMÉ DES TESTS');
  Logger.log('='.repeat(80));
  Logger.log('Total : ' + results.total);
  Logger.log('✅ Réussis : ' + results.passed);
  Logger.log('❌ Échoués : ' + results.failed);
  Logger.log('Taux de réussite : ' + (results.passed / results.total * 100).toFixed(1) + '%');
  Logger.log('');

  return results;
}

// ===================================================================
// TESTS INDIVIDUELS
// ===================================================================

/**
 * Test 1 : Calcul des cibles globales
 */
function testCalculateGlobalTargets() {
  const testName = 'testCalculateGlobalTargets';

  // Données de test simulées
  const data = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'], // headers
    ['A', 'F', 1, 2, 3, 4, '6°1'],
    ['B', 'M', 2, 2, 3, 4, '6°1'],
    ['C', 'F', 3, 3, 3, 3, '6°1'],
    ['D', 'M', 1, 2, 2, 3, '6°2'],
    ['E', 'F', 2, 3, 3, 3, '6°2'],
    ['F', 'M', 4, 4, 4, 4, '6°2']
  ];

  const headers = data[0];
  const byClass = {
    '6°1': [1, 2, 3],
    '6°2': [4, 5, 6]
  };

  const targets = calculateGlobalTargets_V3(data, headers, byClass);

  // Vérifications
  if (!targets.globalCounts) {
    return {
      name: testName,
      passed: false,
      message: 'globalCounts manquant'
    };
  }

  if (!targets.globalProportions) {
    return {
      name: testName,
      passed: false,
      message: 'globalProportions manquant'
    };
  }

  if (!targets.classTargets) {
    return {
      name: testName,
      passed: false,
      message: 'classTargets manquant'
    };
  }

  // Vérifier que la somme des proportions = 1
  const sumProportionsCOM = targets.globalProportions.COM[1] +
                             targets.globalProportions.COM[2] +
                             targets.globalProportions.COM[3] +
                             targets.globalProportions.COM[4];

  if (Math.abs(sumProportionsCOM - 1.0) > 0.01) {
    return {
      name: testName,
      passed: false,
      message: 'Somme des proportions COM ≠ 1.0 : ' + sumProportionsCOM
    };
  }

  // Vérifier que les cibles par classe sont cohérentes
  const target6_1 = targets.classTargets['6°1'];
  const target6_2 = targets.classTargets['6°2'];

  if (!target6_1 || !target6_2) {
    return {
      name: testName,
      passed: false,
      message: 'Cibles par classe manquantes'
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 2 : Calcul de l'erreur harmonique
 */
function testCalculateHarmonicError() {
  const testName = 'testCalculateHarmonicError';

  // Données de test
  const classCounts = {
    '6°1': {
      COM: { 1: 5, 2: 10, 3: 10, 4: 5 }
    },
    '6°2': {
      COM: { 1: 5, 2: 10, 3: 10, 4: 5 }
    }
  };

  const classTargets = {
    '6°1': {
      COM: { 1: 5, 2: 10, 3: 10, 4: 5 } // Parfaitement aligné
    },
    '6°2': {
      COM: { 1: 5, 2: 10, 3: 10, 4: 5 }
    }
  };

  const weights = { com: 1.0 };

  const harmonicError = calculateHarmonicError_V3(classCounts, classTargets, weights);

  // L'erreur doit être 0 (parfaitement aligné)
  if (Math.abs(harmonicError.byDimension.COM) > 0.01) {
    return {
      name: testName,
      passed: false,
      message: 'Erreur harmonique devrait être 0 pour distributions alignées, obtenu : ' + harmonicError.byDimension.COM
    };
  }

  // Test avec désalignement
  classCounts['6°1'].COM = { 1: 10, 2: 8, 3: 8, 4: 4 }; // Décalé

  const harmonicError2 = calculateHarmonicError_V3(classCounts, classTargets, weights);

  // L'erreur doit être > 0
  if (harmonicError2.byDimension.COM <= 0) {
    return {
      name: testName,
      passed: false,
      message: 'Erreur harmonique devrait être > 0 pour distributions désalignées'
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 3 : Calcul du score composite
 */
function testCalculateCompositeScore() {
  const testName = 'testCalculateCompositeScore';

  // Données de test minimales
  const data = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 2, 3, 4, '6°1'],
    ['B', 'M', 2, 2, 3, 4, '6°1'],
    ['C', 'F', 3, 3, 3, 3, '6°2'],
    ['D', 'M', 1, 2, 2, 3, '6°2']
  ];

  const headers = data[0];
  const byClass = {
    '6°1': [1, 2],
    '6°2': [3, 4]
  };

  const weights = {
    parity: 1.0,
    com: 1.0,
    tra: 0.7,
    part: 0.4,
    abs: 0.2
  };

  const score = calculateCompositeScore_V3(data, headers, byClass, weights, null);

  // Vérifications
  if (score.compositeScore === undefined) {
    return {
      name: testName,
      passed: false,
      message: 'compositeScore manquant'
    };
  }

  if (score.parityError === undefined) {
    return {
      name: testName,
      passed: false,
      message: 'parityError manquant'
    };
  }

  if (score.harmonicError === undefined) {
    return {
      name: testName,
      passed: false,
      message: 'harmonicError manquant'
    };
  }

  // Le score composite doit être positif
  if (score.compositeScore < 0) {
    return {
      name: testName,
      passed: false,
      message: 'Score composite négatif : ' + score.compositeScore
    };
  }

  // Le score composite doit être la somme pondérée
  const expectedScore = score.details.parityComponent + score.details.harmonicComponent;
  if (Math.abs(score.compositeScore - expectedScore) > 0.01) {
    return {
      name: testName,
      passed: false,
      message: 'Score composite incohérent : ' + score.compositeScore + ' vs ' + expectedScore
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 4 : Score composite avec différents poids
 */
function testCompositeScoreWithDifferentWeights() {
  const testName = 'testCompositeScoreWithDifferentWeights';

  const data = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 2, 3, 4, '6°1'],
    ['B', 'M', 2, 2, 3, 4, '6°1'],
    ['C', 'F', 3, 3, 3, 3, '6°1'],
    ['D', 'M', 1, 2, 2, 3, '6°2'],
    ['E', 'F', 2, 3, 3, 3, '6°2'],
    ['F', 'M', 4, 4, 4, 4, '6°2']
  ];

  const headers = data[0];
  const byClass = {
    '6°1': [1, 2, 3],
    '6°2': [4, 5, 6]
  };

  // Test avec poids parité faible
  const weights1 = { parity: 0.5, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 };
  const score1 = calculateCompositeScore_V3(data, headers, byClass, weights1, null);

  // Test avec poids parité élevé
  const weights2 = { parity: 5.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 };
  const score2 = calculateCompositeScore_V3(data, headers, byClass, weights2, null);

  // Avec un poids parité plus élevé, la composante parité doit être plus importante
  if (score2.details.parityComponent <= score1.details.parityComponent) {
    return {
      name: testName,
      passed: false,
      message: 'Composante parité devrait augmenter avec le poids : ' +
               score1.details.parityComponent + ' vs ' + score2.details.parityComponent
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 5 : Composante de parité
 */
function testParityComponent() {
  const testName = 'testParityComponent';

  // Test avec parité parfaite
  const data1 = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 1, 1, 1, '6°1'],
    ['B', 'M', 1, 1, 1, 1, '6°1']
  ];

  const headers = data1[0];
  const byClass1 = { '6°1': [1, 2] };
  const weights = { parity: 1.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 };

  const score1 = calculateCompositeScore_V3(data1, headers, byClass1, weights, null);

  // Parité parfaite => erreur = 0
  if (score1.parityError !== 0) {
    return {
      name: testName,
      passed: false,
      message: 'Parité devrait être 0 pour 1F/1M, obtenu : ' + score1.parityError
    };
  }

  // Test avec parité imparfaite
  const data2 = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 1, 1, 1, '6°1'],
    ['B', 'F', 1, 1, 1, 1, '6°1'],
    ['C', 'M', 1, 1, 1, 1, '6°1']
  ];

  const byClass2 = { '6°1': [1, 2, 3] };
  const score2 = calculateCompositeScore_V3(data2, headers, byClass2, weights, null);

  // Parité : 2F vs 1M => écart = 1
  if (score2.parityError !== 1) {
    return {
      name: testName,
      passed: false,
      message: 'Parité devrait être 1 pour 2F/1M, obtenu : ' + score2.parityError
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 6 : Réduction de l'erreur harmonique
 */
function testHarmonicErrorReduction() {
  const testName = 'testHarmonicErrorReduction';

  // Configuration initiale avec classe déséquilibrée
  const data = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 1, 1, 1, '6°1'],
    ['B', 'F', 1, 1, 1, 1, '6°1'],
    ['C', 'F', 1, 1, 1, 1, '6°1'],
    ['D', 'M', 4, 4, 4, 4, '6°2'],
    ['E', 'M', 4, 4, 4, 4, '6°2'],
    ['F', 'M', 4, 4, 4, 4, '6°2']
  ];

  const headers = data[0];
  const byClass = {
    '6°1': [1, 2, 3],
    '6°2': [4, 5, 6]
  };

  const weights = { parity: 1.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 };

  const score1 = calculateCompositeScore_V3(data, headers, byClass, weights, null);

  // Configuration équilibrée après swap (simulation)
  data[3][6] = '6°1'; // Déplacer D vers 6°1
  data[1][6] = '6°2'; // Déplacer B vers 6°2

  byClass['6°1'] = [1, 3, 4];
  byClass['6°2'] = [2, 5, 6];

  const score2 = calculateCompositeScore_V3(data, headers, byClass, weights, null);

  // L'erreur harmonique devrait diminuer après rééquilibrage
  if (score2.harmonicError.total >= score1.harmonicError.total) {
    return {
      name: testName,
      passed: false,
      message: 'Erreur harmonique devrait diminuer après rééquilibrage : ' +
               score1.harmonicError.total + ' → ' + score2.harmonicError.total
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 7 : Détection de classes extrêmes
 */
function testNoExtremeClasses() {
  const testName = 'testNoExtremeClasses';

  // Classe "poubelle" (trop de 1/2)
  const data1 = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 1, 1, 1, '6°1'],
    ['B', 'F', 1, 1, 1, 1, '6°1'],
    ['C', 'F', 2, 2, 2, 2, '6°1'],
    ['D', 'M', 2, 2, 2, 2, '6°1']
  ];

  const headers = data1[0];
  const byClass1 = { '6°1': [1, 2, 3, 4] };

  const distributions1 = calculateScoreDistributions_V3(data1, headers, byClass1);
  const com1 = distributions1['6°1'].COM;
  const total1 = com1[1] + com1[2] + com1[3] + com1[4];
  const pct1and2_1 = (com1[1] + com1[2]) / total1 * 100;

  if (pct1and2_1 <= 70) {
    return {
      name: testName,
      passed: false,
      message: 'Devrait détecter classe poubelle, obtenu : ' + pct1and2_1 + '% de 1/2'
    };
  }

  // Classe "élite" (trop de 3/4)
  const data2 = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 3, 3, 3, 3, '6°1'],
    ['B', 'F', 3, 3, 3, 3, '6°1'],
    ['C', 'F', 4, 4, 4, 4, '6°1'],
    ['D', 'M', 4, 4, 4, 4, '6°1']
  ];

  const byClass2 = { '6°1': [1, 2, 3, 4] };

  const distributions2 = calculateScoreDistributions_V3(data2, headers, byClass2);
  const com2 = distributions2['6°1'].COM;
  const total2 = com2[1] + com2[2] + com2[3] + com2[4];
  const pct3and4_2 = (com2[3] + com2[4]) / total2 * 100;

  if (pct3and4_2 <= 70) {
    return {
      name: testName,
      passed: false,
      message: 'Devrait détecter classe élite, obtenu : ' + pct3and4_2 + '% de 3/4'
    };
  }

  return { name: testName, passed: true };
}

/**
 * Test 8 : Swap améliore le score composite
 */
function testSwapImprovesCompositeScore() {
  const testName = 'testSwapImprovesCompositeScore';

  // Configuration déséquilibrée
  const data = [
    ['NOM', 'SEXE', 'COM', 'TRA', 'PART', 'ABS', '_CLASS_ASSIGNED'],
    ['A', 'F', 1, 1, 1, 1, '6°1'],
    ['B', 'F', 1, 1, 1, 1, '6°1'],
    ['C', 'M', 4, 4, 4, 4, '6°2'],
    ['D', 'M', 4, 4, 4, 4, '6°2']
  ];

  const headers = data[0];
  const byClass = {
    '6°1': [1, 2],
    '6°2': [3, 4]
  };

  const weights = { parity: 1.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 };

  const scoreBefore = calculateCompositeScore_V3(data, headers, byClass, weights, null);

  // Simuler un swap : A (1F) ↔ C (4M)
  data[1][6] = '6°2'; // A va en 6°2
  data[3][6] = '6°1'; // C va en 6°1

  byClass['6°1'] = [2, 3];
  byClass['6°2'] = [1, 4];

  const scoreAfter = calculateCompositeScore_V3(data, headers, byClass, weights, null);

  // Le score devrait s'améliorer (diminuer)
  if (scoreAfter.compositeScore >= scoreBefore.compositeScore) {
    return {
      name: testName,
      passed: false,
      message: 'Score devrait diminuer après swap bénéfique : ' +
               scoreBefore.compositeScore + ' → ' + scoreAfter.compositeScore
    };
  }

  return { name: testName, passed: true };
}

// ===================================================================
// TEST D'INTÉGRATION (optionnel)
// ===================================================================

/**
 * Test d'intégration complet (nécessite une vraie feuille de calcul)
 * À exécuter manuellement sur un jeu de données test
 */
function testFullPhase4Integration() {
  Logger.log('🧪 TEST D\'INTÉGRATION - PHASE 4 SCORE COMPOSITE');
  Logger.log('');

  // Créer un contexte de test
  const ctx = {
    ss: SpreadsheetApp.getActive(),
    levels: ['6°1', '6°2', '6°3'],
    targets: {
      '6°1': 30,
      '6°2': 30,
      '6°3': 30
    },
    quotas: {
      '6°1': { 'ITA': 5, 'CHAV': 10 },
      '6°2': { 'ESP': 5, 'CHAV': 10 },
      '6°3': { 'ALL': 5, 'CHAV': 10 }
    },
    weights: {
      parity: 2.0,
      com: 1.0,
      tra: 0.7,
      part: 0.4,
      abs: 0.2
    },
    maxSwaps: 50
  };

  try {
    const result = Phase4_balanceScoresSwaps_CompositeV3(ctx);

    Logger.log('✅ Test d\'intégration réussi');
    Logger.log('Résultat :');
    Logger.log('  Swaps : ' + result.swapsApplied);
    Logger.log('  Score initial : ' + result.initialScore.compositeScore.toFixed(2));
    Logger.log('  Score final : ' + result.finalScore.compositeScore.toFixed(2));
    Logger.log('  Amélioration : ' + result.improvement.toFixed(2));
    Logger.log('  Parité : ' + result.finalScore.parityError.toFixed(2));
    Logger.log('  Harmonie : ' + result.finalScore.harmonicError.total.toFixed(2));

    return true;
  } catch (e) {
    Logger.log('❌ Test d\'intégration échoué : ' + e.message);
    Logger.log(e.stack);
    return false;
  }
}
