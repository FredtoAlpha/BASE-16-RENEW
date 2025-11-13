# 📋 INVENTAIRE PRIME LEGACY - Analyse Complète des Scripts

## 🎯 Objectif
Créer un pipeline LEGACY optimisé en:
1. Nettoyant les doublons
2. Gardant uniquement les fichiers fonctionnels
3. Intégrant la logique OPTI pour répartition
4. Créant une Interface UI LEGACY complète

## 📁 FICHIERS EXISTANTS (Par Catégorie)

### 🔴 PIPELINE LEGACY - Code Principal
| Fichier | Taille | Fonctions Clés | Statut |
|---------|--------|----------------|--------|
| `Code.gs` | 119K | Menu, legacy_runPhase1-4, Interface UI | ✅ GARDER (point d'entrée) |
| `Orchestration_V14I.gs` | 104K | makeCtxFromSourceSheets_, Phase1I-4_ | 🔍 ANALYSER (source principale?) |
| `Orchestration_V14I_Stream.gs` | 52K | initEmptyCacheTabs_, Phase4_optimizeSwaps_Guarded_ | 🔍 ANALYSER |

### 🟠 PHASES - Implémentations Multiples (DOUBLONS SUSPECTS)

#### Phase 1 - Options & LV2
| Fichier | Fonction | Ligne | Notes |
|---------|----------|-------|-------|
| Orchestration_V14I.gs | Phase1I_dispatchOptionsLV2_ | 1023 | Version LEGACY actuelle |
| Phases_BASEOPTI_V3_COMPLETE.gs | Phase1I_dispatchOptionsLV2_BASEOPTI_V3 | 34 | Version OPTI V3 ✅ |
| Phases_BASEOPTI.gs | Phase1I_dispatchOptionsLV2_BASEOPTI | 23 | Version OPTI ancienne ❌ |

**Décision**: Utiliser logique OPTI V3 (Phases_BASEOPTI_V3_COMPLETE.gs)

#### Phase 2 - DISSO/ASSO
| Fichier | Fonction | Ligne | Notes |
|---------|----------|-------|-------|
| Phase2I_DissoAsso.gs | Phase2I_applyDissoAsso_ | 12 | Version LEGACY standalone |
| Phases_BASEOPTI_V3_COMPLETE.gs | Phase2I_applyDissoAsso_BASEOPTI_V3 | 134 | Version OPTI V3 ✅ |
| Phases_BASEOPTI.gs | Phase2I_applyDissoAsso_BASEOPTI | 127 | Version OPTI ancienne ❌ |

**Décision**: Utiliser logique OPTI V3

#### Phase 3 - Effectifs & Parité
| Fichier | Fonction | Ligne | Notes |
|---------|----------|-------|-------|
| Orchestration_V14I.gs | Phase3I_completeAndParity_ | 1557 | Version LEGACY |
| Phase3_PariteAdaptive_V3.gs | Phase3I_completeAndParity_PariteAdaptive_V3 | 308 | Parité adaptative |
| Phases_BASEOPTI_V3_COMPLETE.gs | Phase3I_completeAndParity_BASEOPTI_V3 | 655 | Version OPTI V3 ✅ |
| Phases_BASEOPTI.gs | Phase3I_completeAndParity_BASEOPTI | 394 | Version OPTI ancienne ❌ |

**Décision**: Utiliser logique OPTI V3

#### Phase 4 - Optimisation Scores
| Fichier | Fonction | Ligne | Notes |
|---------|----------|-------|-------|
| Orchestration_V14I.gs | Phase4_balanceScoresSwaps_ | 1928 | Version LEGACY |
| Phase4_BASEOPTI_V2.gs | Phase4_balanceScoresSwaps_BASEOPTI | 24 | Version OPTI V2 |
| Phases_BASEOPTI_V3_COMPLETE.gs | Phase4_balanceScoresSwaps_BASEOPTI_V3 | 1112 | Version OPTI V3 ✅ OPTIMUM PRIME |
| Phase4_Optimisation_V15.gs | V11_OptimisationDistribution_Combined | 560 | Version V15 (5336 lignes, système différent) ⚠️ |
| Orchestration_V14I_Stream.gs | Phase4_optimizeSwaps_Guarded_ | 1474 | Version avec guard |

**Décision**: Utiliser logique OPTI V3 OPTIMUM PRIME (corrigée, 0 bugs)

### 🟢 OUTILS UTILITAIRES (À CONSERVER)
| Fichier | Taille | Fonction | Statut |
|---------|--------|----------|--------|
| `COMPTER.gs` | 20K | Compteurs effectifs/options/langues | ✅ GARDER |
| `Consolidation.gs` | 15K | consoliderDonnees(), verifierDonnees() | ✅ GARDER |
| `GenereNOMprenomID.gs` | 9.3K | Génération ID_ELEVE | ✅ GARDER |
| `ListesDeroulantes.gs` | 17K | Listes déroulantes dynamiques | ✅ GARDER |
| `Initialisation.gs` | 41K | Outils initialisation onglets | ✅ GARDER |
| `Structure.gs` | 11K | Gestion _STRUCTURE | ✅ GARDER |

### 🟡 CONFIGURATION & SYSTÈME
| Fichier | Taille | Fonction | Statut |
|---------|--------|----------|--------|
| `Config.gs` | 35K | CONFIG, ERROR_CODES, getConfig() | ✅ GARDER |
| `OptiConfig_System.gs` | 24K | Configuration OPTI | 🔍 ANALYSER (OPTI only?) |
| `BASEOPTI_System.gs` | 30K | Système BASEOPTI | 🔍 ANALYSER |
| `BASEOPTI_Architecture_V3.gs` | 16K | Architecture V3 | 🔍 ANALYSER |
| `BASEOPTI_Validation.gs` | 4.9K | Validations | ✅ GARDER |

### 🔵 MODULES SPÉCIALISÉS
| Fichier | Taille | Fonction | Statut |
|---------|--------|----------|--------|
| `Mobility_System.gs` | 12K | Gestion mobilité élèves | ✅ GARDER |
| `Analytics_System.gs` | 20K | Analytics & métriques | ✅ GARDER |
| `NiveauxDynamiques.gs` | 6.2K | Niveaux dynamiques | ✅ GARDER |
| `RateLimiting_Utils.gs` | 6.0K | Rate limiting | ✅ GARDER |
| `Utils_QuotaParser.gs` | 4.7K | Parsing quotas | ✅ GARDER |
| `Utils_VIEUX.gs` | 34K | Vieux utilitaires | ⚠️ VÉRIFIER (obsolète?) |

### 🟣 TESTS
| Fichier | Taille | Fonction | Statut |
|---------|--------|----------|--------|
| `Phase3_PariteAdaptive_Tests.gs` | 13K | Tests Phase 3 | ✅ GARDER |
| `TEST_PARITE_ADAPTATIVE.gs` | 11K | Tests parité | ✅ GARDER |
| `GroupsModule_TestCases.gs` | 14K | Tests modules groupes | ✅ GARDER |

### ⚪ AUTRES
| Fichier | Taille | Fonction | Statut |
|---------|--------|----------|--------|
| `AdminPasswordHelper.gs` | 961 | Helper admin | ✅ GARDER |
| `OPTI_Pipeline_Independent.gs` | 15K | Pipeline OPTI indépendant | 🔍 ANALYSER |

## 🔥 FICHIERS À SUPPRIMER (Doublons/Obsolètes)
1. ❌ `Phases_BASEOPTI.gs` (21K) - Ancienne version, remplacée par V3
2. ⚠️ `Utils_VIEUX.gs` (34K) - À vérifier si vraiment obsolète

## 🎯 DÉCISIONS ARCHITECTURE PRIME LEGACY

### Structure Proposée
```
PRIME_LEGACY/
├── Core/
│   ├── LEGACY_Pipeline.gs          # Pipeline principal (depuis Code.gs + Orchestration)
│   ├── LEGACY_Context.gs           # makeCtxFromSourceSheets_, etc.
│   └── LEGACY_Interface.gs         # Interface UI LEGACY
│
├── Phases/
│   ├── LEGACY_Phase1_OptionsLV2.gs    # Depuis BASEOPTI V3
│   ├── LEGACY_Phase2_DissoAsso.gs     # Depuis BASEOPTI V3
│   ├── LEGACY_Phase3_Parite.gs        # Depuis BASEOPTI V3
│   └── LEGACY_Phase4_Optimisation.gs  # Depuis BASEOPTI V3 OPTIMUM PRIME
│
├── Tools/
│   ├── LEGACY_Compter.gs              # Depuis COMPTER.gs
│   ├── LEGACY_Consolidation.gs        # Depuis Consolidation.gs
│   ├── LEGACY_Creation_Onglets.gs     # initEmptyCacheTabs_ + helpers
│   ├── LEGACY_ListesDeroulantes.gs    # Depuis ListesDeroulantes.gs
│   └── LEGACY_GenererID.gs            # Depuis GenereNOMprenomID.gs
│
├── Utils/
│   ├── LEGACY_Config.gs               # Config LEGACY
│   ├── LEGACY_Validation.gs           # Validations
│   └── LEGACY_Helpers.gs              # Helpers divers
│
└── Menu/
    └── LEGACY_Menu.gs                 # Menu Google Sheets LEGACY
```

## ✅ NEXT STEPS
1. ✅ Créer branche `claude/PRIME-LEGACY-01SJDcJv7zHGGBXWhHpzfnxr`
2. 🔄 Analyser en détail Orchestration_V14I.gs pour identifier code à garder
3. 🔄 Créer LEGACY_Pipeline.gs basé sur logique OPTI V3
4. 🔄 Créer LEGACY_Interface.gs avec phases pré-pipeline
5. 🔄 Adapter les phases BASEOPTI V3 pour LEGACY
6. 🔄 Tester isolation complète OPTI/LEGACY
