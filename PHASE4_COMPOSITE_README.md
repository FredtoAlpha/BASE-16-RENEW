# Phase 4 - Score Composite (Parité + Harmonie)

## 🎯 Vue d'ensemble

Le nouveau système de Phase 4 avec **score composite** transforme l'optimisation des classes en intégrant :

1. **Parité F/M comme objectif principal** (plus seulement un critère de départage)
2. **Harmonie des distributions** (éviter classes "élite" et "poubelle")
3. **Score unique et clair** (facile à comprendre et ajuster)

## 📦 Fichiers créés

### 1. `Phase4_CompositeScore_V3.gs` (Code principal)

Fonctions principales :

- **`calculateGlobalTargets_V3()`** : Calcule les cibles de distribution globale
- **`calculateHarmonicError_V3()`** : Calcule l'erreur harmonique (distance aux cibles)
- **`calculateCompositeScore_V3()`** : Combine parité + harmonie avec poids
- **`findBestSwap_CompositeV3()`** : Trouve le meilleur swap selon score composite
- **`Phase4_balanceScoresSwaps_CompositeV3()`** : Fonction principale de la Phase 4

### 2. `PHASE4_COMPOSITE_GUIDE.md` (Documentation complète)

Guide détaillé avec :
- Explication du score composite
- Configuration des poids
- Exemples d'utilisation
- Diagnostic et troubleshooting
- Tests de validation
- Plan de migration

### 3. `PHASE4_COMPOSITE_README.md` (Ce fichier)

Vue d'ensemble et quick start

## 🚀 Quick Start

### Étape 1 : Ajouter le fichier au projet

Copier `Phase4_CompositeScore_V3.gs` dans votre projet Apps Script

### Étape 2 : Configurer les poids

```javascript
ctx.weights = {
  parity: 2.0,  // ✨ NOUVEAU : Poids de parité (objectif principal)
  com: 1.0,     // Priorité MAXIMALE pour COM
  tra: 0.7,
  part: 0.4,
  abs: 0.2
};
```

### Étape 3 : Appeler la nouvelle fonction

```javascript
// Remplacer
const p4Result = Phase4_balanceScoresSwaps_BASEOPTI_V3(ctx);

// Par
const p4Result = Phase4_balanceScoresSwaps_CompositeV3(ctx);
```

## ✨ Améliorations clés

| Aspect | Ancien système | Nouveau système |
|--------|---------------|-----------------|
| **Parité** | Critère de départage secondaire | Objectif principal avec poids ✅ |
| **Harmonie** | Variance simple (peut cacher classes extrêmes) | Distance à distribution globale ✅ |
| **Score** | Variance + parité en départage | Score composite unifié ✅ |
| **Classes extrêmes** | Possibles (élite/poubelle) | Évitées par construction ✅ |
| **Configuration** | Poids COM/TRA/PART/ABS uniquement | + poids parité ajustable ✅ |

## 📊 Exemple de résultat

### Avant (ancien système)

```
Variance : 12.45
Parité : 8 (moyenne, utilisée comme départage)

6°1 : COM : 1=2,  2=5,  3=18, 4=5   ← Classe "élite"
6°2 : COM : 1=15, 2=10, 3=4,  4=1   ← Classe "poubelle"
6°3 : COM : 1=7,  2=10, 3=10, 4=3   ← OK
```

❌ **Problème** : Classes extrêmes malgré bonne variance globale

### Après (nouveau système)

```
Score composite : 28.75 (↓ 36.5%)
Parité : 2.0 (excellente)
Harmonie COM : 15.20 (très bonne)

6°1 : COM : 1=7, 2=10, 3=10, 4=3  ← Équilibrée
6°2 : COM : 1=6, 2=10, 3=11, 4=3  ← Équilibrée
6°3 : COM : 1=7, 2=10, 3=9,  4=4  ← Équilibrée
```

✅ **Résultat** : Toutes les classes équilibrées, proche de la distribution globale

## 🔧 Configuration des poids

### Recommandé (par défaut)

```javascript
parity: 2.0,  // Priorité élevée à la parité
com: 1.0,     // Priorité maximale à l'harmonie COM
tra: 0.7,
part: 0.4,
abs: 0.2
```

**Résultat attendu** :
- ✅ Classes équilibrées F/M (erreur < 4 pour 3 classes)
- ✅ Distributions harmonieuses en COM
- ✅ Bon compromis TRA/PART/ABS

### Parité absolue

```javascript
parity: 5.0,  // Très élevé
com: 1.0,
tra: 0.7,
part: 0.4,
abs: 0.2
```

**Résultat attendu** :
- ✅ Parité quasi parfaite (erreur < 2)
- ⚠️ Peut légèrement sacrifier l'harmonie COM

### Harmonie prioritaire

```javascript
parity: 0.5,  // Faible
com: 2.0,     // Très élevé
tra: 1.0,
part: 0.5,
abs: 0.2
```

**Résultat attendu** :
- ✅ Distributions très harmonieuses
- ⚠️ Parité moins stricte (erreur peut monter à 6-8)

## 📈 Métriques de qualité

### KPI principaux

| Métrique | Cible | Excellent |
|----------|-------|-----------|
| Score composite | Réduction > 20% | > 30% |
| Erreur de parité | < 4 (3 classes) | < 2 |
| Erreur harmonique COM | < 20 (90 élèves) | < 15 |
| Classes extrêmes | 0 | 0 |

### Vérification rapide

```javascript
const result = Phase4_balanceScoresSwaps_CompositeV3(ctx);

console.log('Score composite : ' + result.finalScore.compositeScore.toFixed(2));
console.log('Amélioration : ' + (result.improvement / result.initialScore.compositeScore * 100).toFixed(1) + '%');
console.log('Parité : ' + result.finalScore.parityError.toFixed(2));
console.log('Harmonie : ' + result.finalScore.harmonicError.total.toFixed(2));

// Critères de succès
const success =
  result.improvement / result.initialScore.compositeScore > 0.20 &&  // > 20% amélioration
  result.finalScore.parityError < 4 &&                                // Parité < 4
  result.finalScore.harmonicError.total < 30;                         // Harmonie < 30

console.log(success ? '✅ Optimisation réussie' : '⚠️ Ajuster les poids');
```

## 🔍 Diagnostic

### Problème : Parité insuffisante

```
Parité : 8.0 (composante : 16.00)
Harmonie : 10.50
```

**Solution** : Augmenter `weights.parity`

```javascript
ctx.weights.parity = 3.0; // au lieu de 2.0
```

### Problème : Classes extrêmes persistantes

```
6°1 : COM : 1=15, 2=8, 3=5, 4=2  ← Trop de 1/2
```

**Solutions** :
1. Augmenter `weights.com` (ex: 1.0 → 2.0)
2. Augmenter `maxSwaps` (ex: 100 → 150)
3. Vérifier contraintes DISSO/ASSO bloquantes

### Problème : Score ne s'améliore pas

```
📊 10 swaps | score=45.20 | amélioration=0.10
⏸️ Stagnation détectée
```

**Causes possibles** :
- Trop de contraintes DISSO/ASSO/LV2/OPT
- Poids mal calibrés
- Maximum local atteint

**Solutions** :
1. Vérifier les logs de blocage : `bloqués (DISSO/ASSO)`
2. Ajuster les poids (essayer différentes configurations)
3. Augmenter `maxSwaps` ou `maxIterations`

## 🧪 Tests de validation

### Test 1 : Parité améliorée

```javascript
// Avant Phase 4
const parityBefore = calculateParityScore_V3(data, headers, byClass);

// Exécuter Phase 4
Phase4_balanceScoresSwaps_CompositeV3(ctx);

// Après Phase 4
const parityAfter = calculateParityScore_V3(data, headers, byClass);

console.log(parityAfter < parityBefore ? '✅ Parité améliorée' : '❌ Parité non améliorée');
```

### Test 2 : Pas de classes extrêmes

```javascript
const distributions = calculateScoreDistributions_V3(data, headers, byClass);

let hasExtremeClass = false;
for (const cls in distributions) {
  const com = distributions[cls].COM;
  const total = com[1] + com[2] + com[3] + com[4];
  const pct1and2 = (com[1] + com[2]) / total * 100;
  const pct3and4 = (com[3] + com[4]) / total * 100;

  if (pct1and2 > 70 || pct3and4 > 70) {
    console.log('❌ Classe extrême détectée : ' + cls);
    hasExtremeClass = true;
  }
}

console.log(hasExtremeClass ? '❌ Échec' : '✅ Toutes les classes équilibrées');
```

### Test 3 : Amélioration significative

```javascript
const result = Phase4_balanceScoresSwaps_CompositeV3(ctx);
const improvement_pct = result.improvement / result.initialScore.compositeScore * 100;

if (improvement_pct > 30) {
  console.log('✅ Excellente amélioration : ' + improvement_pct.toFixed(1) + '%');
} else if (improvement_pct > 20) {
  console.log('✅ Bonne amélioration : ' + improvement_pct.toFixed(1) + '%');
} else {
  console.log('⚠️ Amélioration faible : ' + improvement_pct.toFixed(1) + '%');
}
```

## 🔄 Plan de migration

### Semaine 1 : Test en parallèle

- Garder l'ancien système actif
- Activer le nouveau via flag `useCompositeScore`
- Comparer les résultats sur plusieurs jeux de données

### Semaine 2 : Ajustement des poids

- Tester différentes configurations de `weights.parity`
- Identifier la configuration optimale pour vos données
- Valider avec les utilisateurs finaux

### Semaine 3 : Déploiement

- Activer par défaut le nouveau système
- Garder l'ancien en fallback
- Monitorer les premiers lancements

### Semaine 4 : Nettoyage

- Supprimer l'ancien code si validation OK
- Mettre à jour la documentation utilisateur

## 📚 Documentation complète

- **Code source** : `Phase4_CompositeScore_V3.gs`
- **Guide détaillé** : `PHASE4_COMPOSITE_GUIDE.md`
- **Ce README** : `PHASE4_COMPOSITE_README.md`

## ✅ Checklist de déploiement

- [ ] Fichier `Phase4_CompositeScore_V3.gs` ajouté au projet
- [ ] `ctx.weights.parity` configuré (recommandé : 2.0)
- [ ] Tests de validation exécutés
- [ ] Parité améliorée confirmée
- [ ] Aucune classe extrême détectée
- [ ] Score composite réduit de > 20%
- [ ] Contraintes LV2/OPT/ASSO/DISSO respectées
- [ ] Logs vérifiés (pas d'anomalies)
- [ ] Validation avec utilisateurs finaux

## 🤝 Support

En cas de problème :

1. Consulter le guide détaillé (`PHASE4_COMPOSITE_GUIDE.md`)
2. Vérifier les logs de la Phase 4
3. Ajuster les poids selon le diagnostic
4. Comparer avec l'ancien système en mode parallèle

---

**Version** : 1.0.0
**Date** : 2025-11-13
**Auteur** : Claude Code Assistant
