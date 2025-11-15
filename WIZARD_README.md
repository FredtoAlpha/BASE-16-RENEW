# 🚀 WIZARD INTERFACE - Documentation Complète

## 📋 Vue d'ensemble

Le **Wizard Interface** est une nouvelle interface guidée multiphase qui simplifie l'ensemble du processus de configuration et de répartition des élèves dans BASE-16 RENEW.

### ✨ Avantages

- ✅ **Guidage pas à pas** : 6 phases claires et structurées
- ✅ **Sauvegarde automatique** : Reprise de session en cas d'interruption
- ✅ **Modèles réutilisables** : Sauvegarder et charger des configurations
- ✅ **Validation en temps réel** : Vérification des données à chaque étape
- ✅ **Import CSV** : Import facilité des données élèves
- ✅ **Interface moderne** : Design responsive et intuitif

---

## 🎯 Les 6 Phases du Wizard

### **Phase 1 : Initialisation** 🎬

**Objectif** : Configuration initiale du système

**Actions** :
- Sélectionner le niveau scolaire (6°, 5°, 4°, 3°)
- Définir le nombre de classes sources et destinations
- Configurer les LV2 disponibles (ESP, ITA, ALL, CHI...)
- Configurer les options disponibles (LATIN, GREC, CHAV...)
- Charger un modèle de configuration existant (optionnel)
- Sauvegarder la configuration comme modèle (optionnel)

**Résultat** :
- Création des onglets sources (ECOLE1, ECOLE2... ou 6°1, 6°2...)
- Création de l'onglet CONSOLIDATION
- Création/mise à jour de _STRUCTURE
- Création/mise à jour de _CONFIG

**Fichiers concernés** :
- `Initialisation.gs` → `initialiserSysteme()`
- `WizardPhases.html` → `loadPhase1Content()`

---

### **Phase 2 : Import & Préparation** 📊

**Objectif** : Import des données élèves et préparation

**Étapes** :

#### **Étape 1 : Import**
- **Saisie manuelle** : Remplir directement les onglets sources
- **Import CSV** : Importer un fichier CSV par classe

#### **Étape 2 : Génération automatique**
- Génération de la colonne `NOM & PRENOM` (concaténation)
- Génération des `ID_ELEVE` uniques (ECOLE1001, ECOLE1002...)
- Masquage des colonnes NOM, PRENOM, ID_ELEVE

#### **Étape 3 : Listes déroulantes**
- Application des listes déroulantes pour :
  - SEXE (M / F)
  - LV2 (ESP / ITA / ALL / CHI...)
  - OPT (LATIN / GREC / CHAV...)
  - Critères COM/TRA/PART/ABS (1-4)
  - DISPO (ULIS / GEVASCO / PAP...)

#### **Étape 4 : Validation**
- Vérification des doublons ID_ELEVE
- Vérification des champs obligatoires
- Détection des incohérences

#### **Étape 5 : Consolidation**
- Fusion de toutes les données dans CONSOLIDATION
- Résolution des doublons
- Tri et organisation

**Fichiers concernés** :
- `GenereNOMprenomID.gs` → `genererNomPrenomEtID()`
- `ListesDeroulantes.gs` → `ajouterListesDeroulantes()`
- `Consolidation.gs` → `verifierDonnees()`, `consoliderDonnees()`
- `WizardBackend.gs` → `importCSVVersOnglet()`

---

### **Phase 3 : Configuration** ⚙️

**Objectif** : Configuration du pipeline (mapping, quotas, coefficients)

**⚠️ STATUT** : En cours d'implémentation

Pour l'instant, utilisez **ConfigurationComplete.html** depuis le menu :
- Menu **Console** → **Configuration Complète**

**Prévu** :
- Mapping classes sources → destinations
- Définition des quotas LV2/OPT par classe
- Configuration des coefficients de pondération

---

### **Phase 4 : Exécution** 🚀

**Objectif** : Lancement du pipeline LEGACY avec suivi temps réel

**⚠️ STATUT** : En cours d'implémentation

Pour l'instant, utilisez le menu **LEGACY** :
- Menu **LEGACY** → **Créer Onglets TEST (Pipeline Complet)**

**Prévu** :
- Aperçu avant lancement
- Barre de progression en temps réel
- Logs détaillés
- Estimation du temps restant

---

### **Phase 5 : Validation & Rapport** ✅

**Objectif** : Consultation du rapport détaillé

**⚠️ STATUT** : En cours d'implémentation

**Prévu** :
- Résumé par LV2/Option
- Statistiques de répartition
- Alertes et warnings
- Graphiques visuels

---

### **Phase 6 : Finalisation** 🏁

**Objectif** : Actions finales

**⚠️ STATUT** : En cours d'implémentation

**Prévu** :
- Ouverture Interface V2 (swaps manuels)
- Finalisation TEST → DEF
- Export PDF/Excel
- Historique des exécutions

---

## 📂 Architecture des Fichiers

### Fichiers Principaux

```
WizardInterface.html        → Interface HTML principale avec styles et structure
WizardPhases.html           → Contenu JavaScript de toutes les phases
WizardBackend.gs            → Fonctions Apps Script côté serveur
Code.gs                     → Ajout du menu pour ouvrir le wizard
```

### Fichiers Dépendances

```
Initialisation.gs           → Phase 1 (initialiserSysteme)
GenereNOMprenomID.gs        → Phase 2 (genererNomPrenomEtID)
ListesDeroulantes.gs        → Phase 2 (ajouterListesDeroulantes)
Consolidation.gs            → Phase 2 (verifierDonnees, consoliderDonnees)
ConfigurationComplete.html  → Phase 3 (configuration complète)
LEGACY_Orchestration.gs     → Phase 4 (pipeline complet)
Phase5.gs                   → Phase 6 (finalisation)
```

---

## 🛠️ Fonctions Nouvelles Créées

### WizardBackend.gs

| Fonction | Description |
|----------|-------------|
| `ouvrirWizardInterface()` | Ouvre l'interface wizard |
| `sauvegarderEtatWizard(state)` | Sauvegarde l'état actuel |
| `chargerEtatWizard()` | Charge l'état sauvegardé |
| `supprimerEtatWizard()` | Supprime la session |
| `sauvegarderModeleConfig(nom, config)` | Sauvegarde un modèle |
| `chargerModeleConfig(nom)` | Charge un modèle |
| `listerModelesConfig()` | Liste tous les modèles |
| `supprimerModeleConfig(nom)` | Supprime un modèle |
| `importCSVVersOnglet(csvContent, targetSheet)` | Import CSV |
| `detecterColonnesCSV(headers)` | Détection auto colonnes |
| `transformerDonneesCSV(data, mapping, targetHeaders)` | Transformation données |
| `wizard_*()` | Wrappers pour fonctions existantes |

### Onglets Créés

- `_MODELES_CONFIG` : Stockage des modèles de configuration (caché)

---

## 🚀 Comment Utiliser

### 1. Ouvrir le Wizard

```
Menu : 🎯 CONSOLE → 🚀 ASSISTANT DE CONFIGURATION (NOUVEAU)
```

### 2. Suivre les 6 Phases

1. **Initialisation** : Configurer niveau, classes, LV2/OPT
2. **Import** : Importer ou saisir les données élèves
3. **Configuration** : Configurer mapping et quotas (utiliser ConfigurationComplete.html)
4. **Exécution** : Lancer le pipeline (utiliser menu LEGACY)
5. **Validation** : Consulter le rapport
6. **Finalisation** : Actions finales

### 3. Sauvegarde Automatique

Le wizard sauvegarde automatiquement votre progression. Si vous fermez la fenêtre :

- Au prochain lancement, on vous proposera de **reprendre où vous en étiez**
- Cliquez sur **Reprendre** pour continuer
- Ou **Nouvelle session** pour recommencer

### 4. Modèles de Configuration

**Sauvegarder un modèle** (Phase 1) :
1. Remplir tous les champs
2. Cliquer sur **Sauvegarder comme modèle**
3. Donner un nom (ex: "Config 2024-2025")

**Charger un modèle** (Phase 1) :
1. Sélectionner le modèle dans la liste déroulante
2. Cliquer sur **Charger ce modèle**
3. Tous les champs sont pré-remplis

### 5. Import CSV

**Format attendu** :
```csv
NOM,PRENOM,SEXE,LV2,OPT,COM,TRA,PART,ABS
DUPONT,Jean,M,ESP,LATIN,3,4,3,1
MARTIN,Marie,F,ITA,GREC,4,4,4,1
```

**Étapes** :
1. Phase 2 → Sélectionner "Import CSV"
2. Choisir la classe cible (ECOLE1, ECOLE2...)
3. Sélectionner le fichier CSV
4. Cliquer sur **Importer**

Le système détecte automatiquement les colonnes grâce aux alias définis dans `Config.gs`.

---

## 🔧 Prochaines Étapes (TODO)

### Phase 3 : Configuration

- [ ] Implémenter interface de mapping classes
- [ ] Implémenter interface de quotas LV2/OPT
- [ ] Implémenter interface de coefficients
- [ ] Intégrer avec ConfigurationComplete.html existant

### Phase 4 : Exécution

- [ ] Ajouter barre de progression temps réel
- [ ] Implémenter polling toutes les 2 secondes
- [ ] Afficher logs en direct
- [ ] Calculer temps restant

### Phase 5 : Validation

- [ ] Générer rapport structuré
- [ ] Ajouter graphiques (Charts API)
- [ ] Lister les alertes détaillées
- [ ] Exporter rapport PDF/Excel

### Phase 6 : Finalisation

- [ ] Intégrer Interface V2 (swaps)
- [ ] Ajouter confirmation destructive renforcée
- [ ] Implémenter historique exécutions
- [ ] Exports PDF/Excel

---

## 🎨 Personnalisation

### Modifier les Couleurs

Dans `WizardInterface.html`, modifier les variables CSS :

```css
/* Gradient principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Couleur principale */
--primary-color: #1976d2;

/* Couleur succès */
--success-color: #4caf50;
```

### Ajouter des Options/LV2

Dans `WizardPhases.html`, modifier les valeurs par défaut :

```javascript
phase1_lv2Options = ['ESP', 'ITA', 'ALL', 'CHI', 'RUS']; // Ajouter RUS
phase1_optOptions = ['CHAV', 'LATIN', 'GREC', 'SPORT']; // Ajouter SPORT
```

---

## 🐛 Dépannage

### Le wizard ne s'ouvre pas

1. Vérifier que `WizardBackend.gs` est bien présent
2. Vérifier les logs : **Extensions → Apps Script → Exécutions**
3. Autoriser les autorisations si demandé

### La sauvegarde ne fonctionne pas

1. Vérifier les propriétés utilisateur :
   ```javascript
   PropertiesService.getUserProperties().getProperty('WIZARD_STATE');
   ```

### L'import CSV échoue

1. Vérifier que le CSV est bien encodé en UTF-8
2. Vérifier que les en-têtes correspondent aux alias dans `Config.gs`
3. Consulter les logs pour voir le mapping détecté

---

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| Lignes de code HTML/CSS | ~1000 |
| Lignes de code JavaScript | ~800 |
| Lignes de code Apps Script | ~600 |
| Nombre de phases | 6 |
| Fonctions backend | 20+ |

---

## 👨‍💻 Développement

### Tester en local

1. Ouvrir le projet dans Apps Script
2. Déployer comme web app (mode test)
3. Ouvrir l'URL générée

### Débugger

Utiliser `Logger.log()` côté serveur et `console.log()` côté client.

Afficher les logs :
```
Extensions → Apps Script → Exécutions → Vue
```

---

## 📝 Changelog

### v1.0.0 (2025-11-15)

✅ **Implémenté** :
- Structure HTML complète du wizard
- Stepper multiphase (6 phases)
- Phase 1 : Initialisation complète
- Phase 2 : Import & Préparation complète
- Sauvegarde/restauration de session
- Modèles de configuration
- Import CSV avec détection automatique
- Wrappers pour fonctions existantes
- Intégration dans le menu

🚧 **En cours** :
- Phase 3 : Configuration (mapping, quotas)
- Phase 4 : Exécution (feedback temps réel)
- Phase 5 : Validation & Rapport
- Phase 6 : Finalisation

---

## 🙏 Crédits

- **Architecture** : Conception basée sur les meilleures pratiques UX/UI
- **Design** : Material Design (Google)
- **Intégration** : BASE-16 RENEW (système existant)

---

## 📞 Support

Pour toute question ou bug, consulter les logs et la documentation des fonctions existantes.

**Happy wizarding! 🧙‍♂️**
