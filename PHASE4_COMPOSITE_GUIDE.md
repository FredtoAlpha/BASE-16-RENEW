# Guide - Phase 4 Score Composite

## 🎯 Objectif

Le nouveau système de Phase 4 transforme la parité d'un simple critère de départage en **objectif d'optimisation principal**, tout en assurant une **distribution harmonieuse des scores** dans chaque classe.

### Problème résolu

**Ancien système** :
- ❌ Parité = simple départage (si variance similaire)
- ❌ Peut créer des classes "élite" (plein de COM=3/4) et "poubelle" (plein de COM=1/2)
- ❌ Les moyennes sont bonnes, mais la répartition est déséquilibrée

**Nouveau système** :
- ✅ **Parité = objectif principal** (avec poids configurable)
- ✅ **Harmonie des distributions** : chaque classe ressemble à la distribution globale
- ✅ **Évite les classes extrêmes** : ni élite, ni poubelle

## 📊 Score Composite

Le nouveau système optimise un **score composite unique** :

```
Score composite = weights.parity  × erreurParité
                + weights.com     × erreurHarmonie_COM
                + weights.tra     × erreurHarmonie_TRA
                + weights.part    × erreurHarmonie_PART
                + weights.abs     × erreurHarmonie_ABS
```

### Composantes du score

#### 1. Erreur de parité

```
erreurParité = Σ_classes |F - M|
```

**Plus c'est bas, meilleure est la parité.**

Exemple :
- Classe A : 15F / 15M → écart = 0
- Classe B : 18F / 12M → écart = 6
- Classe C : 14F / 16M → écart = 2
- **Total : 0 + 6 + 2 = 8**

#### 2. Erreur harmonique

Pour chaque dimension D (COM, TRA, PART, ABS), pour chaque score s (1,2,3,4) :

```
cibleGlobale[D][s] = proportionGlobale[D][s] × tailleClasse

erreurHarmonie[D] = Σ_classes Σ_scores |count[D][C][s] - cible[D][C][s]|
```

**Plus c'est bas, plus les classes ressemblent à la distribution globale.**

Exemple avec COM pour une classe de 30 élèves :
- Distribution globale : 20% score 1, 30% score 2, 40% score 3, 10% score 4
- Cible classe : 6×1, 9×2, 12×3, 3×4
- Réel classe : 8×1, 10×2, 10×3, 2×4
- Erreur : |8-6| + |10-9| + |10-12| + |2-3| = 2 + 1 + 2 + 1 = **6**

## 🔧 Configuration

### Poids par défaut

```javascript
ctx.weights = {
  parity: 2.0,  // ✨ NOUVEAU : Poids de parité (objectif principal)
  com: 1.0,     // Priorité MAXIMALE pour COM
  tra: 0.7,     // Priorité moyenne pour TRA
  part: 0.4,    // Priorité basse pour PART
  abs: 0.2      // Priorité très basse pour ABS
};
```

### Ajuster les priorités

#### Exemple 1 : Prioriser absolument la parité

```javascript
ctx.weights = {
  parity: 5.0,  // Très élevé : la parité devient l'objectif absolu
  com: 1.0,
  tra: 0.7,
  part: 0.4,
  abs: 0.2
};
```

Résultat attendu :
- ✅ Toutes les classes très équilibrées F/M
- ⚠️ Peut légèrement sacrifier l'harmonie des scores COM

#### Exemple 2 : Équilibrer parité et harmonie COM

```javascript
ctx.weights = {
  parity: 1.0,  // Même poids que COM
  com: 1.0,     // Harmonie COM aussi importante que parité
  tra: 0.7,
  part: 0.4,
  abs: 0.2
};
```

Résultat attendu :
- ✅ Bon équilibre entre parité et harmonie COM
- ✅ Classes ni trop déséquilibrées en F/M, ni trop extrêmes en scores

#### Exemple 3 : Focus sur l'harmonie, parité secondaire

```javascript
ctx.weights = {
  parity: 0.5,  // Faible : parité moins importante
  com: 2.0,     // Très élevé : priorité absolue à l'harmonie COM
  tra: 1.0,
  part: 0.5,
  abs: 0.2
};
```

Résultat attendu :
- ✅ Classes très harmonieuses en distribution de scores
- ⚠️ Peut accepter des écarts de parité plus importants

## 🚀 Intégration

### Option A : Remplacement direct

Dans votre fichier d'orchestration principal :

```javascript
// AVANT
const p4Result = Phase4_balanceScoresSwaps_BASEOPTI_V3(ctx);

// APRÈS
const p4Result = Phase4_balanceScoresSwaps_CompositeV3(ctx);
```

### Option B : Mode test avec flag

```javascript
// Ajouter le poids de parité
ctx.weights = {
  parity: 2.0,
  com: 1.0,
  tra: 0.7,
  part: 0.4,
  abs: 0.2
};

// Flag optionnel
ctx.useCompositeScore = true;

if (ctx.useCompositeScore) {
  const p4Result = Phase4_balanceScoresSwaps_CompositeV3(ctx);
} else {
  const p4Result = Phase4_balanceScoresSwaps_BASEOPTI_V3(ctx);
}
```

## 📈 Résultat attendu

### Exemple de log

```
📌 PHASE 4 V3 - SCORE COMPOSITE (Parité + Harmonie)
⚖️ Poids : PARITY=2.0, COM=1.0, TRA=0.7, PART=0.4, ABS=0.2

📊 Calcul des cibles de distribution globale...
  Total élèves : 90
  Proportions globales COM : {"1":"22.2%","2":"33.3%","3":"33.3%","4":"11.1%"}

📊 Score initial :
  Composite : 45.30
  Parité (×2.0) : 8.0 → 16.00
  Harmonie : 29.30 (COM=18.5, TRA=7.2, PART=2.8, ABS=0.8)

🔍 Recherche swap : 225 testés, 45 bloqués (mobilité), 12 bloqués (DISSO/ASSO), 168 sans amélioration
✅ Meilleur swap trouvé : amélioration=0.850 (parité: -1.00, harmonie: -0.15)

📊 10 swaps | score=37.45 | amélioration=7.85 (parité=4.0, harmonie=25.60)
📊 20 swaps | score=32.10 | amélioration=13.20 (parité=2.0, harmonie=28.10)

✅ PHASE 4 V3 - SCORE COMPOSITE terminée
  Swaps appliqués : 28
  Score initial : 45.30
  Score final : 28.75
  Amélioration : 16.55 (36.5%)

  Détails finaux :
    Parité : 2.00 (composante : 4.00)
    Harmonie : 24.75
      COM : 15.20
      TRA : 6.35
      PART : 2.50
      ABS : 0.70

📊 Distributions finales par classe :
  6°1 (30 élèves) :
    COM : 1=7(6.7), 2=10(10.0), 3=10(10.0), 4=3(3.3)
  6°2 (30 élèves) :
    COM : 1=6(6.7), 2=10(10.0), 3=11(10.0), 4=3(3.3)
  6°3 (30 élèves) :
    COM : 1=7(6.7), 2=10(10.0), 3=9(10.0), 4=4(3.3)
```

### Interprétation

✅ **Parité** : 2.0 → Excellente (toutes les classes proche de l'équilibre F/M)

✅ **Harmonie COM** : Les classes ont des distributions très proches de la cible
- 6°1 : 7 vs 6.7 (cible), 10 vs 10.0, etc.
- Écarts minimes

✅ **Amélioration** : 36.5% → Très bon résultat

## 🔍 Diagnostic

### Vérifier l'équilibre parité / harmonie

Si après optimisation :

#### Cas 1 : Parité parfaite mais harmonie faible

```
Parité : 0.0 (composante : 0.00)
Harmonie : 45.30 (COM=35.0, ...)
```

**Diagnostic** : `weights.parity` trop élevé, sacrifie l'harmonie

**Solution** : Réduire `weights.parity` (ex: 2.0 → 1.0)

#### Cas 2 : Harmonie parfaite mais parité faible

```
Parité : 12.0 (composante : 24.00)
Harmonie : 5.20 (COM=2.5, ...)
```

**Diagnostic** : `weights.parity` trop faible, parité négligée

**Solution** : Augmenter `weights.parity` (ex: 0.5 → 2.0)

#### Cas 3 : Bon équilibre

```
Parité : 2.0 (composante : 4.00)
Harmonie : 24.75 (COM=15.2, ...)
```

**Diagnostic** : Configuration optimale ✅

### Vérifier l'absence de classes extrêmes

Regarder les distributions finales :

```
6°1 : COM : 1=2, 2=5, 3=18, 4=5  ← ⚠️ Classe "élite" (trop de 3/4)
6°2 : COM : 1=15, 2=10, 3=4, 4=1  ← ⚠️ Classe "poubelle" (trop de 1/2)
6°3 : COM : 1=7, 2=10, 3=10, 4=3  ← ✅ Équilibrée
```

**Diagnostic** : Harmonie insuffisante

**Solutions** :
1. Augmenter `weights.com` (ex: 1.0 → 2.0)
2. Augmenter `maxSwaps` pour plus d'itérations
3. Vérifier que les contraintes DISSO/ASSO ne bloquent pas les swaps

## 📊 Métriques de qualité

### KPI à surveiller

| Métrique | Cible | Critique |
|----------|-------|----------|
| **Score composite** | Réduction > 20% | > 30% excellent |
| **Erreur de parité** | < 4 (pour 3 classes) | < 2 excellent |
| **Erreur harmonique COM** | < 20 (pour 90 élèves) | < 15 excellent |
| **Swaps appliqués** | 20-50 | > 50 peut indiquer configuration sous-optimale |

### Formules de référence

#### Erreur de parité acceptable

Pour N classes de 30 élèves :
- **Excellent** : erreur < N
- **Bon** : erreur < 2×N
- **Limite** : erreur < 3×N

Exemple pour 3 classes :
- Excellent : < 3
- Bon : < 6
- Limite : < 9

#### Erreur harmonique acceptable (par dimension)

Pour D élèves totaux et N classes :
- **Excellent** : erreur < D / 5
- **Bon** : erreur < D / 3
- **Limite** : erreur < D / 2

Exemple pour 90 élèves :
- Excellent : < 18
- Bon : < 30
- Limite : < 45

## 🧪 Tests de validation

### Test 1 : Vérifier que parité est optimisée

```javascript
// Avant Phase 4
const parityBefore = calculateParityScore_V3(data, headers, byClass);

// Après Phase 4
const parityAfter = calculateParityScore_V3(data, headers, byClass);

// Vérifier amélioration
if (parityAfter < parityBefore) {
  console.log('✅ Parité améliorée : ' + parityBefore + ' → ' + parityAfter);
} else {
  console.log('⚠️ Parité non améliorée (vérifier weights.parity)');
}
```

### Test 2 : Vérifier l'harmonie des distributions

```javascript
const targets = calculateGlobalTargets_V3(data, headers, byClass);
const harmonicError = calculateHarmonicError_V3(
  targets.classCounts,
  targets.classTargets,
  weights
);

console.log('Erreur harmonique : ' + harmonicError.total.toFixed(2));
console.log('  COM : ' + harmonicError.byDimension.COM.toFixed(2));
console.log('  TRA : ' + harmonicError.byDimension.TRA.toFixed(2));

// Pour chaque classe, vérifier qu'elle est proche de la cible
for (const cls in targets.classTargets) {
  const counts = targets.classCounts[cls];
  const targets_cls = targets.classTargets[cls];

  let maxDeviation = 0;
  for (let s = 1; s <= 4; s++) {
    const deviation = Math.abs(counts.COM[s] - targets_cls.COM[s]);
    maxDeviation = Math.max(maxDeviation, deviation);
  }

  if (maxDeviation <= 3) {
    console.log('✅ ' + cls + ' : harmonie COM correcte (écart max = ' + maxDeviation + ')');
  } else {
    console.log('⚠️ ' + cls + ' : harmonie COM imparfaite (écart max = ' + maxDeviation + ')');
  }
}
```

### Test 3 : Détecter les classes extrêmes

```javascript
const distributions = calculateScoreDistributions_V3(data, headers, byClass);

for (const cls in distributions) {
  const com = distributions[cls].COM;
  const total = com[1] + com[2] + com[3] + com[4];

  const pct1and2 = (com[1] + com[2]) / total * 100;
  const pct3and4 = (com[3] + com[4]) / total * 100;

  if (pct1and2 > 70) {
    console.log('❌ ' + cls + ' : classe "poubelle" détectée (' + pct1and2.toFixed(1) + '% de 1/2)');
  } else if (pct3and4 > 70) {
    console.log('❌ ' + cls + ' : classe "élite" détectée (' + pct3and4.toFixed(1) + '% de 3/4)');
  } else {
    console.log('✅ ' + cls + ' : distribution équilibrée');
  }
}
```

## 🔄 Migration

### Étape 1 : Test en parallèle (1 semaine)

```javascript
// Exécuter l'ancien système
const oldResult = Phase4_balanceScoresSwaps_BASEOPTI_V3(ctx);

// Sauvegarder l'état
const savedData = [...data];
const savedByClass = {...byClass};

// Restaurer et exécuter le nouveau système
// ... restauration ...
ctx.weights.parity = 2.0;
const newResult = Phase4_balanceScoresSwaps_CompositeV3(ctx);

// Comparer les résultats
console.log('Ancien système :');
console.log('  Variance : ' + oldResult.finalVariance);
console.log('  Parité : ' + calculateParityScore_V3(...));

console.log('Nouveau système :');
console.log('  Score composite : ' + newResult.finalScore.compositeScore);
console.log('  Parité : ' + newResult.finalScore.parityError);
console.log('  Harmonie : ' + newResult.finalScore.harmonicError.total);
```

### Étape 2 : Ajustement des poids (1 semaine)

Tester différentes configurations :

```javascript
const configurations = [
  { parity: 1.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 },
  { parity: 2.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 },
  { parity: 3.0, com: 1.0, tra: 0.7, part: 0.4, abs: 0.2 },
];

configurations.forEach(function(config) {
  ctx.weights = config;
  const result = Phase4_balanceScoresSwaps_CompositeV3(ctx);
  console.log('Config parity=' + config.parity + ' → score=' + result.finalScore.compositeScore);
});
```

### Étape 3 : Déploiement progressif

- Semaine 3 : Activer par défaut avec `parity=2.0`
- Semaine 4 : Retirer l'ancien système

## 📚 Résumé

### Avantages du nouveau système

✅ **Parité comme objectif principal** (pas simple départage)
✅ **Harmonie des distributions** (chaque classe ≈ distribution globale)
✅ **Évite les classes extrêmes** (ni élite, ni poubelle)
✅ **Poids configurables** (ajustables selon priorités)
✅ **Score unique et clair** (facile à comprendre et optimiser)

### Configuration recommandée

```javascript
ctx.weights = {
  parity: 2.0,  // Priorité élevée à la parité
  com: 1.0,     // Priorité maximale à l'harmonie COM
  tra: 0.7,     // Bon équilibre TRA
  part: 0.4,    // Priorité moyenne PART
  abs: 0.2      // Priorité basse ABS
};

ctx.maxSwaps = 100; // Suffisant pour la plupart des cas
```

### Checklist de validation

- [ ] Score composite réduit de > 20%
- [ ] Erreur de parité < 2×N_classes
- [ ] Erreur harmonique COM < totalEleves / 3
- [ ] Aucune classe "élite" ou "poubelle" détectée
- [ ] Toutes les contraintes LV2/OPT/ASSO/DISSO respectées
- [ ] Logs sans anomalies

---

**Version** : 1.0.0
**Date** : 2025-11-13
