# 🚀 PLAN D'ACTION PRIME LEGACY

## ✅ ÉTAPE 1 : DOUBLONS À SUPPRIMER IMMÉDIATEMENT

### Fichiers Obsolètes (Remplacés par V3)
```bash
git rm Phases_BASEOPTI.gs              # 21K - Remplacé par V3
```

**Justification**: `Phases_BASEOPTI_V3_COMPLETE.gs` contient toutes les phases corrigées et optimisées (OPTIMUM PRIME)

## 🔧 ÉTAPE 2 : CRÉER NOUVEAUX FICHIERS LEGACY (Sans toucher aux anciens)

### 2.1 Core Pipeline
**`LEGACY_Pipeline.gs`** - Pipeline principal adapté pour LEGACY
- Source: Code.gs (legacy_runFullPipeline, legacy_runPhase1-4) + Orchestration_V14I.gs
- Modifications: Lire depuis onglets sources (°1, °2, etc.), écrire vers onglets TEST

### 2.2 Context & Initialization  
**`LEGACY_Context.gs`** - Gestion contexte LEGACY
- Source: makeCtxFromSourceSheets_() depuis Orchestration_V14I.gs
- Adaptation: Détecter onglets sources automatiquement

**`LEGACY_Init_Onglets.gs`** - Création onglets TEST
- Source: initEmptyCacheTabs_() depuis Orchestration_V14I_Stream.gs
- Adaptation: Créer onglets avec suffixe TEST, copier headers

### 2.3 Interface UI LEGACY
**`LEGACY_Interface.gs`** - Interface utilisateur complète
- **Phase 0a**: Créer onglets sources (nouveau)
- **Phase 0b**: Créer listes déroulantes (depuis ListesDeroulantes.gs)
- **Phase 0c**: Générer ID_ELEVE (depuis GenereNOMprenomID.gs)
- **Phase 0d**: Créer _CONSOLIDATION (depuis Consolidation.gs)
- **Phases 1-4**: Pipeline répartition

### 2.4 Phases (Adaptées de BASEOPTI V3 OPTIMUM PRIME)
**`LEGACY_Phase1_OptionsLV2.gs`**
- Base: Phase1I_dispatchOptionsLV2_BASEOPTI_V3 (Phases_BASEOPTI_V3_COMPLETE.gs:34)
- Adaptation: Lire sources °1 °2, écrire vers TEST

**`LEGACY_Phase2_DissoAsso.gs`**
- Base: Phase2I_applyDissoAsso_BASEOPTI_V3 (Phases_BASEOPTI_V3_COMPLETE.gs:134)

**`LEGACY_Phase3_Parite.gs`**
- Base: Phase3I_completeAndParity_BASEOPTI_V3 (Phases_BASEOPTI_V3_COMPLETE.gs:655)

**`LEGACY_Phase4_Optimisation.gs`**
- Base: Phase4_balanceScoresSwaps_BASEOPTI_V3 (Phases_BASEOPTI_V3_COMPLETE.gs:1112)
- ✅ VERSION OPTIMUM PRIME (bugs corrigés)

### 2.5 Outils (Préfixés LEGACY_)
**`LEGACY_Compter.gs`**
- Source: COMPTER.gs
- Adaptation: Filtrer onglets LEGACY uniquement

**`LEGACY_Consolidation.gs`**
- Source: Consolidation.gs (consoliderDonnees, verifierDonnees)
- Adaptation: Créer onglet _CONSOLIDATION_LEGACY

**`LEGACY_Structure.gs`**
- Source: Structure.gs
- Adaptation: Gérer _STRUCTURE pour LEGACY

**`LEGACY_GenererID.gs`**
- Source: GenereNOMprenomID.gs
- Adaptation: Générer IDs dans onglets sources

**`LEGACY_ListesDeroulantes.gs`**
- Source: ListesDeroulantes.gs
- Adaptation: Créer listes dans onglets sources

### 2.6 Menu
**`LEGACY_Menu.gs`** - Menu Google Sheets LEGACY
```javascript
Menu: ⚙️ LEGACY
├── 📋 PHASE 0 : Préparation
│   ├── 🏗️ Créer Onglets Sources (6°1, 6°2...)
│   ├── 🆔 Générer ID_ELEVE
│   ├── 📋 Créer Listes Déroulantes
│   ├── 🔗 Créer _CONSOLIDATION
│   └── ✅ Vérifier Données Sources
│
├── 📋 PHASE 1-4 : Répartition
│   ├── ▶️ Pipeline Complet (Créer TEST)
│   ├── 🎯 Phase 1 - Options & LV2
│   ├── 🔗 Phase 2 - ASSO/DISSO
│   ├── ⚖️ Phase 3 - Effectifs & Parité
│   └── 🔄 Phase 4 - Équilibrage Scores
│
└── 📊 Outils
    ├── 📊 COMPTER Sources
    ├── 📊 COMPTER TEST
    ├── 📋 Voir Classes Sources
    └── 📊 Voir Résultats TEST
```

## 🎯 ÉTAPE 3 : ISOLATION OPTI/LEGACY

### Stratégie de Non-Interférence
1. **OPTI** lit/écrit dans `_BASEOPTI` + onglets `_CACHE`
2. **LEGACY** lit depuis onglets sources (°1, °2, etc.) + écrit vers onglets TEST

### Colonne d'Affectation
- Les deux utilisent `_CLASS_ASSIGNED` (compatible)
- Pas de conflit car onglets différents

### Fonctions Partagées (OK)
- Config.gs
- BASEOPTI_Validation.gs
- Mobility_System.gs
- Analytics_System.gs
- RateLimiting_Utils.gs

## 📝 ÉTAPE 4 : TIMELINE D'IMPLÉMENTATION

### Phase 1 : Core (30 min)
1. ✅ Créer branche PRIME LEGACY
2. ✅ Supprimer Phases_BASEOPTI.gs
3. Créer LEGACY_Pipeline.gs
4. Créer LEGACY_Context.gs
5. Créer LEGACY_Init_Onglets.gs

### Phase 2 : Phases Répartition (45 min)
6. Créer LEGACY_Phase1_OptionsLV2.gs
7. Créer LEGACY_Phase2_DissoAsso.gs
8. Créer LEGACY_Phase3_Parite.gs
9. Créer LEGACY_Phase4_Optimisation.gs (OPTIMUM PRIME)

### Phase 3 : Outils Phase 0 (30 min)
10. Créer LEGACY_GenererID.gs
11. Créer LEGACY_ListesDeroulantes.gs
12. Créer LEGACY_Consolidation.gs
13. Créer LEGACY_Structure.gs

### Phase 4 : Interface & Menu (30 min)
14. Créer LEGACY_Interface.gs
15. Créer LEGACY_Menu.gs
16. Créer LEGACY_Compter.gs

### Phase 5 : Tests & Documentation (30 min)
17. Tester isolation OPTI/LEGACY
18. Tester pipeline complet LEGACY
19. Documenter PRIME LEGACY
20. Commit & Push

## ⚠️ VALIDATION UTILISATEUR REQUISE

**QUESTION**: Cette approche te convient ?
- ✅ Créer nouveaux fichiers LEGACY_* (propres, sans doublons)
- ✅ Garder anciens fichiers pour référence temporaire
- ✅ Une fois PRIME LEGACY validé → supprimer anciens fichiers

**OU tu préfères** :
- ❌ Supprimer immédiatement tous les doublons
- ❌ Modifier directement les fichiers existants

**RÉPONDS JUSTE "GO" SI TU VALIDES LE PLAN !** 🚀
