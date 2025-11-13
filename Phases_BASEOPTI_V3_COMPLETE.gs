/**
 * ===================================================================
 * PHASES 1-2-3-4 V3 - _BASEOPTI COMME VIVIER UNIQUE
 * ⚡ OPTIMUM PRIME MASTER - VERSION OPTIMISÉE
 * ===================================================================
 *
 * Architecture correcte :
 * - _BASEOPTI = source unique de vérité
 * - Colonne _CLASS_ASSIGNED pour marquer les affectations
 * - Toutes les phases lisent/écrivent dans _BASEOPTI
 * - CACHE rempli à la fin uniquement
 *
 * 🚀 OPTIMISATIONS OPTIMUM PRIME (branche: claude/optimum-prime-master) :
 * 1. ✅ FIX CRITIQUE : Bug s1/s2 dans findBestSwap_V3 (variables non définies)
 * 2. ⚡ Performance : Ajout paramètres pos1/pos2 pour accès direct aux indices
 * 3. 📊 Métriques : Compteurs tested, blockedByMobility, blockedByDissoAsso
 * 4. 🔄 Boucle Phase4 : Ajout boucle for() manquante + targetDistribution
 * 5. 🛑 Early stopping : Détection stagnation + limite maxSwaps
 * 6. 🧹 Nettoyage : Suppression code mort (currentScore, finalError)
 *
 * Basé sur : codex/audit-du-pipeline-opti (2000 lignes, version la plus complète)
 * Date : 2025-11-13
 */

// ===================================================================
// PHASE 1 V3 - OPTIONS & LV2
// ===================================================================

/**
 * Phase 1 V3 : Place les élèves avec OPT/LV2 selon quotas
 * LIT : _BASEOPTI (colonne _CLASS_ASSIGNED vide)
 * ÉCRIT : _BASEOPTI (remplit _CLASS_ASSIGNED)
 */
function Phase1I_dispatchOptionsLV2_BASEOPTI_V3(ctx) {
  logLine('INFO', '='.repeat(80));
  logLine('INFO', '📌 PHASE 1 V3 - Options & LV2 (depuis _BASEOPTI)');
  logLine('INFO', '='.repeat(80));

  const ss = ctx.ss || SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');

  if (!baseSheet) {
    throw new Error('_BASEOPTI introuvable');
  }

  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];

  const idxLV2 = headers.indexOf('LV2');
  const idxOPT = headers.indexOf('OPT');
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');

  if (idxAssigned === -1) {
    throw new Error('Colonne _CLASS_ASSIGNED manquante');
  }

  const stats = {};

  // Parcourir les quotas par classe
  for (const classe in (ctx.quotas || {})) {
    const quotas = ctx.quotas[classe];

    for (const optName in quotas) {
      const quota = quotas[optName];
      if (quota <= 0) continue;

      let placed = 0;

      // Parcourir _BASEOPTI
      for (let i = 1; i < data.length; i++) {
        if (placed >= quota) break;

        const row = data[i];
        const assigned = String(row[idxAssigned] || '').trim();

        if (assigned) continue; // Déjà placé

        const lv2 = String(row[idxLV2] || '').trim().toUpperCase();
        const opt = String(row[idxOPT] || '').trim().toUpperCase();

        let match = false;
        if (['ITA', 'ESP', 'ALL', 'PT'].indexOf(optName) >= 0) {
          match = (lv2 === optName);
        } else {
          match = (opt === optName);
        }

        if (match) {
          // ✅ PLACER SANS VÉRIFIER DISSO : LV2/OPT = RÈGLE ABSOLUE
          data[i][idxAssigned] = classe;
          placed++;
          stats[optName] = (stats[optName] || 0) + 1;
        }
      }

      if (placed > 0) {
        logLine('INFO', '  ✅ ' + classe + ' : ' + placed + ' × ' + optName + (placed < quota ? ' (⚠️ quota=' + quota + ')' : ''));
      }
    }
  }

  // Écrire dans _BASEOPTI
  baseSheet.getRange(1, 1, data.length, headers.length).setValues(data);
  SpreadsheetApp.flush();

  // Sync vers colonnes legacy pour compatibilité audit
  syncClassAssignedToLegacy_('P1');

  // ⚡ OPTIMISATION QUOTA : Ne pas copier vers CACHE en Phase 1 (économiser les appels API)
  // La copie se fera en Phase 4 finale
  // copyBaseoptiToCache_V3(ctx);

  // ✅ CALCUL MOBILITÉ : Déterminer FIXE/PERMUT/LIBRE après Phase 1
  if (typeof computeMobilityFlags_ === 'function') {
    computeMobilityFlags_(ctx);
  } else {
    logLine('WARN', '⚠️ computeMobilityFlags_ non disponible (vérifier que Mobility_System.gs est chargé)');
  }

  logLine('INFO', '✅ PHASE 1 V3 terminée');

  return { ok: true, counts: stats };
}

// ===================================================================
// PHASE 2 V3 - CODES ASSO/DISSO
// ===================================================================

/**
 * Phase 2 V3 : Applique codes A (regrouper) et D (séparer)
 * LIT : _BASEOPTI (TOUS les élèves, placés ou non)
 * ÉCRIT : _BASEOPTI (update _CLASS_ASSIGNED)
 */
function Phase2I_applyDissoAsso_BASEOPTI_V3(ctx) {
  logLine('INFO', '='.repeat(80));
  logLine('INFO', '📌 PHASE 2 V3 - Codes ASSO/DISSO (depuis _BASEOPTI)');
  logLine('INFO', '='.repeat(80));

  const ss = ctx.ss || SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');

  if (!baseSheet) {
    throw new Error('_BASEOPTI introuvable');
  }

  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];

  const idxA = headers.indexOf('ASSO');
  const idxD = headers.indexOf('DISSO');
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const idxNom = headers.indexOf('NOM');

  let assoMoved = 0;
  let dissoMoved = 0;

  // ============= CODES ASSO (A) =============

  const groupsA = {};
  for (let i = 1; i < data.length; i++) {
    const codeA = String(data[i][idxA] || '').trim().toUpperCase();
    if (codeA) {
      if (!groupsA[codeA]) groupsA[codeA] = [];
      groupsA[codeA].push(i);
    }
  }

  logLine('INFO', '🔗 Groupes ASSO : ' + Object.keys(groupsA).length);

  for (const code in groupsA) {
    const indices = groupsA[code];
    if (indices.length <= 1) {
      logLine('INFO', '  ⏭️ A=' + code + ' : 1 seul élève');
      continue;
    }

    logLine('INFO', '  🔗 A=' + code + ' : ' + indices.length + ' élèves');

    // Trouver classe majoritaire
    const classCounts = {};
    indices.forEach(function(idx) {
      const cls = String(data[idx][idxAssigned] || '').trim();
      if (cls) {
        classCounts[cls] = (classCounts[cls] || 0) + 1;
      }
    });

    let targetClass = null;
    let maxCount = 0;
    for (const cls in classCounts) {
      if (classCounts[cls] > maxCount) {
        maxCount = classCounts[cls];
        targetClass = cls;
      }
    }

    // Si aucun placé, choisir classe la moins remplie
    if (!targetClass) {
      targetClass = findLeastPopulatedClass_V3(data, headers, ctx);
    }

    logLine('INFO', '    🎯 Cible : ' + targetClass);

    // Déplacer tous vers la cible
    indices.forEach(function(idx) {
      const currentClass = String(data[idx][idxAssigned] || '').trim();
      if (currentClass !== targetClass) {
        data[idx][idxAssigned] = targetClass;
        assoMoved++;
        logLine('INFO', '      ✅ ' + data[idx][idxNom] + ' : ' + currentClass + ' → ' + targetClass);
      }
    });
  }

  // ============= CODES DISSO (D) =============

  const groupsD = {};
  for (let i = 1; i < data.length; i++) {
    const codeD = String(data[i][idxD] || '').trim().toUpperCase();
    if (codeD) {
      if (!groupsD[codeD]) groupsD[codeD] = [];
      groupsD[codeD].push(i);
      dissoMoved++; // ✅ Compter chaque élève avec un code DISSO
    }
  }

  logLine('INFO', '🚫 Groupes DISSO : ' + Object.keys(groupsD).length + ' (' + dissoMoved + ' élèves)');

  for (const code in groupsD) {
    const indices = groupsD[code];
    // ✅ CORRECTION : Ne pas skip les groupes avec 1 élève (il faut vérifier la classe)
    // if (indices.length <= 1) continue;

    logLine('INFO', '  🚫 D=' + code + ' : ' + indices.length + ' élève(s) à vérifier');

    // Vérifier si plusieurs sont dans la même classe
    const byClass = {};
    indices.forEach(function(idx) {
      const cls = String(data[idx][idxAssigned] || '').trim();
      if (cls) {
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(idx);
      }
    });

    // Pour chaque classe avec >1 élève D, déplacer
    for (const cls in byClass) {
      if (byClass[cls].length > 1) {
        logLine('INFO', '    ⚠️ ' + cls + ' contient ' + byClass[cls].length + ' D=' + code);

        // Garder le premier, déplacer les autres
        for (let j = 1; j < byClass[cls].length; j++) {
          const idx = byClass[cls][j];

          // 🔒 Trouver classe sans ce code D (en vérifiant LV2/OPT)
          const targetClass = findClassWithoutCodeD_V3(data, headers, code, groupsD[code], idx, ctx);

          if (targetClass) {
            data[idx][idxAssigned] = targetClass;
            logLine('INFO', '      ✅ ' + data[idx][idxNom] + ' : ' + cls + ' → ' + targetClass + ' (séparation D=' + code + ')');
          } else {
            logLine('WARN', '      ⚠️ ' + data[idx][idxNom] + ' reste en ' + cls + ' (contrainte LV2/OPT absolue)');
          }
        }
      }
    }
  }

  // Écrire dans _BASEOPTI
  baseSheet.getRange(1, 1, data.length, headers.length).setValues(data);
  SpreadsheetApp.flush();

  // Sync vers colonnes legacy pour compatibilité audit
  syncClassAssignedToLegacy_('P2');

  // ⚡ OPTIMISATION QUOTA : Ne pas copier vers CACHE en Phase 2 (économiser les appels API)
  // La copie se fera en Phase 4 finale
  // copyBaseoptiToCache_V3(ctx);

  // ✅ CALCUL MOBILITÉ : Recalculer après Phase 2 (codes A/D peuvent changer les contraintes)
  if (typeof computeMobilityFlags_ === 'function') {
    computeMobilityFlags_(ctx);
  } else {
    logLine('WARN', '⚠️ computeMobilityFlags_ non disponible (vérifier que Mobility_System.gs est chargé)');
  }

  logLine('INFO', '✅ PHASE 2 V3 terminée : ' + assoMoved + ' ASSO, ' + dissoMoved + ' DISSO');

  return { ok: true, asso: assoMoved, disso: dissoMoved };
}

// ===================================================================
// HELPERS
// ===================================================================

function findLeastPopulatedClass_V3(data, headers, ctx) {
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const counts = {};

  (ctx.levels || []).forEach(function(cls) {
    counts[cls] = 0;
  });

  for (let i = 1; i < data.length; i++) {
    const cls = String(data[i][idxAssigned] || '').trim();
    if (cls && counts[cls] !== undefined) {
      counts[cls]++;
    }
  }

  let minClass = null;
  let minCount = Infinity;
  for (const cls in counts) {
    if (counts[cls] < minCount) {
      minCount = counts[cls];
      minClass = cls;
    }
  }

  return minClass || (ctx.levels && ctx.levels[0]) || '6°1';
}

/**
 * 🔒 SÉCURITÉ DISSO : Trouve une classe sans le code DISSO spécifié
 * Vérifie aussi les contraintes LV2/OPT (règle absolue)
 * 
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes
 * @param {string} codeD - Code DISSO à éviter
 * @param {Array} indicesWithD - Indices des élèves avec ce code DISSO
 * @param {number} eleveIdx - Index de l'élève à déplacer
 * @param {Object} ctx - Contexte avec quotas
 * @returns {string|null} Classe cible ou null si impossible
 */
function findClassWithoutCodeD_V3(data, headers, codeD, indicesWithD, eleveIdx, ctx) {
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const idxLV2 = headers.indexOf('LV2');
  const idxOPT = headers.indexOf('OPT');

  // Récupérer LV2/OPT de l'élève
  const eleveLV2 = eleveIdx ? String(data[eleveIdx][idxLV2] || '').trim().toUpperCase() : '';
  const eleveOPT = eleveIdx ? String(data[eleveIdx][idxOPT] || '').trim().toUpperCase() : '';

  // Classes déjà occupées par ce code DISSO
  const classesWithD = new Set();
  indicesWithD.forEach(function(idx) {
    const cls = String(data[idx][idxAssigned] || '').trim();
    if (cls) classesWithD.add(cls);
  });

  // Collecter toutes les classes
  const allClasses = new Set();
  for (let i = 1; i < data.length; i++) {
    const cls = String(data[i][idxAssigned] || '').trim();
    if (cls) allClasses.add(cls);
  }

  // 🔒 PRIORITÉ 1 : Trouver une classe qui propose LV2/OPT de l'élève ET sans code DISSO
  if (eleveLV2 || eleveOPT) {
    for (const cls of Array.from(allClasses)) {
      if (classesWithD.has(cls)) continue; // Déjà un élève avec ce code DISSO

      // Vérifier si cette classe propose LV2/OPT de l'élève
      const quotas = (ctx && ctx.quotas && ctx.quotas[cls]) || {};
      
      let canPlace = false;
      if (eleveLV2 && ['ITA', 'ESP', 'ALL', 'PT'].indexOf(eleveLV2) >= 0) {
        // L'élève a une LV2 spécifique
        canPlace = (quotas[eleveLV2] !== undefined && quotas[eleveLV2] > 0);
      } else if (eleveOPT) {
        // L'élève a une option spécifique
        canPlace = (quotas[eleveOPT] !== undefined && quotas[eleveOPT] > 0);
      }

      if (canPlace) {
        logLine('INFO', '        ✅ Classe ' + cls + ' compatible (propose ' + (eleveLV2 || eleveOPT) + ')');
        return cls;
      }
    }

    // ⚠️ Aucune classe compatible trouvée
    logLine('WARN', '        ⚠️ Aucune classe sans D=' + codeD + ' ne propose ' + (eleveLV2 || eleveOPT));
    logLine('WARN', '        🔒 CONTRAINTE LV2/OPT ABSOLUE : élève reste dans sa classe (doublon DISSO accepté)');
    return null; // ❌ Impossible de déplacer sans violer LV2/OPT
  }

  // 🔒 PRIORITÉ 2 : Si pas de LV2/OPT spécifique, n'importe quelle classe sans code DISSO
  for (const cls of Array.from(allClasses)) {
    if (!classesWithD.has(cls)) {
      return cls;
    }
  }

  return null; // Aucune classe disponible
}

/**
 * 🔒 GARDIEN DISSO/ASSO : Vérifie si un élève peut être placé dans une classe
 * sans violer les contraintes DISSO/ASSO
 *
 * @param {number} eleveIdx - Index de l'élève dans data
 * @param {string} targetClass - Classe de destination
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes
 * @param {number} excludeIdx - Index de l'élève à exclure de la vérification (pour les swaps)
 * @param {Object} ctx - Contexte avec quotas (optionnel, pour vérifier LV2/OPT)
 * @returns {Object} { ok: boolean, reason: string }
 */
function canPlaceInClass_V3(eleveIdx, targetClass, data, headers, excludeIdx, ctx) {
  // 🛡️ Validations de sécurité
  if (!data || !headers || !targetClass) {
    logLine('ERROR', 'canPlaceInClass_V3 : paramètres invalides');
    return { ok: false, reason: 'Paramètres invalides' };
  }

  if (!data[eleveIdx]) {
    logLine('ERROR', 'canPlaceInClass_V3 : élève index ' + eleveIdx + ' introuvable');
    return { ok: false, reason: 'Élève introuvable' };
  }

  const idxD = headers.indexOf('DISSO');
  const idxA = headers.indexOf('ASSO');
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const idxLV2 = headers.indexOf('LV2');
  const idxOPT = headers.indexOf('OPT');

  if (idxAssigned === -1) {
    logLine('ERROR', 'canPlaceInClass_V3 : colonne _CLASS_ASSIGNED introuvable');
    return { ok: false, reason: 'Colonne _CLASS_ASSIGNED manquante' };
  }

  const eleveD = String(data[eleveIdx][idxD] || '').trim().toUpperCase();
  const eleveA = String(data[eleveIdx][idxA] || '').trim().toUpperCase();
  const eleveLV2 = String(data[eleveIdx][idxLV2] || '').trim().toUpperCase();
  const eleveOPT = String(data[eleveIdx][idxOPT] || '').trim().toUpperCase();

  // 🔒 VÉRIFIER LV2/OPT : L'élève a une LV2 ou OPT ?
  if ((eleveLV2 || eleveOPT) && ctx && ctx.quotas) {
    const quotas = ctx.quotas[targetClass] || {};

    // Si l'élève a une LV2 spécifique (ITA, ESP, ALL, PT)
    if (eleveLV2 && ['ITA', 'ESP', 'ALL', 'PT'].indexOf(eleveLV2) >= 0) {
      // La classe cible doit proposer cette LV2
      if (quotas[eleveLV2] === undefined || quotas[eleveLV2] === 0) {
        return {
          ok: false,
          reason: 'LV2 violation : élève a ' + eleveLV2 + ' mais classe ' + targetClass + ' ne la propose pas'
        };
      }
    }

    // Si l'élève a une option spécifique (CHAV, etc.)
    if (eleveOPT) {
      // La classe cible doit proposer cette option
      if (quotas[eleveOPT] === undefined || quotas[eleveOPT] === 0) {
        return {
          ok: false,
          reason: 'OPT violation : élève a ' + eleveOPT + ' mais classe ' + targetClass + ' ne la propose pas'
        };
      }
    }
  }

  // Vérifier DISSO : L'élève a un code D ?
  if (eleveD) {
    // Vérifier si la classe cible contient déjà un élève avec ce code D
    for (let i = 1; i < data.length; i++) {
      if (!data[i]) continue; // Skip lignes vides
      if (i === eleveIdx) continue; // Skip l'élève lui-même
      if (excludeIdx !== undefined && i === excludeIdx) continue; // Skip l'élève exclu (swap)

      const cls = String(data[i][idxAssigned] || '').trim();
      if (cls !== targetClass) continue; // Pas dans la classe cible

      const otherD = String(data[i][idxD] || '').trim().toUpperCase();
      if (otherD === eleveD) {
        return {
          ok: false,
          reason: 'DISSO violation : classe ' + targetClass + ' contient déjà un élève avec code D=' + eleveD
        };
      }
    }
  }

  // Vérifier ASSO : L'élève a un code A ?
  if (eleveA) {
    // Trouver où sont les autres membres du groupe ASSO
    let groupClass = null;
    for (let i = 1; i < data.length; i++) {
      if (!data[i]) continue; // Skip lignes vides
      if (i === eleveIdx) continue;

      const otherA = String(data[i][idxA] || '').trim().toUpperCase();
      if (otherA === eleveA) {
        const cls = String(data[i][idxAssigned] || '').trim();
        if (cls) {
          if (groupClass === null) {
            groupClass = cls;
          } else if (groupClass !== cls) {
            // Groupe ASSO déjà dispersé - ne pas ajouter de contrainte
            groupClass = null;
            break;
          }
        }
      }
    }

    // Si le groupe ASSO est déjà établi dans une classe, l'élève doit y aller
    if (groupClass && groupClass !== targetClass) {
      return {
        ok: false,
        reason: 'ASSO violation : groupe A=' + eleveA + ' est dans ' + groupClass + ', pas dans ' + targetClass
      };
    }
  }

  return { ok: true, reason: '' };
}

/**
 * 🔒 GARDIEN SWAP : Vérifie si un swap entre deux élèves viole DISSO/ASSO/LV2/OPT
 *
 * @param {number} idx1 - Index élève 1
 * @param {string} cls1 - Classe actuelle élève 1
 * @param {number} idx2 - Index élève 2
 * @param {string} cls2 - Classe actuelle élève 2
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes
 * @param {Object} ctx - Contexte avec quotas
 * @returns {Object} { ok: boolean, reason: string }
 */
function canSwapStudents_V3(idx1, cls1, idx2, cls2, data, headers, ctx) {
  // Vérifier si élève 1 peut aller dans cls2 (en excluant idx2 qui va partir de cls2)
  const check1 = canPlaceInClass_V3(idx1, cls2, data, headers, idx2, ctx);
  if (!check1.ok) {
    return { ok: false, reason: 'Swap impossible : élève 1 → ' + cls2 + ' : ' + check1.reason };
  }

  // Vérifier si élève 2 peut aller dans cls1 (en excluant idx1 qui va partir de cls1)
  const check2 = canPlaceInClass_V3(idx2, cls1, data, headers, idx1, ctx);
  if (!check2.ok) {
    return { ok: false, reason: 'Swap impossible : élève 2 → ' + cls1 + ' : ' + check2.reason };
  }

  return { ok: true, reason: '' };
}

/**
 * Copie _BASEOPTI vers les onglets CACHE pour affichage live
 */
function copyBaseoptiToCache_V3(ctx) {
  logLine('INFO', '📋 copyBaseoptiToCache_V3: Début copie vers CACHE...');
  
  // 🔍 AUDIT CRITIQUE : Vérifier ctx.cacheSheets
  if (!ctx || !ctx.cacheSheets) {
    logLine('ERROR', '❌ PROBLÈME CRITIQUE: ctx.cacheSheets est undefined ou null !');
    logLine('ERROR', '   ctx existe: ' + (ctx ? 'OUI' : 'NON'));
    if (ctx) {
      logLine('ERROR', '   ctx.cacheSheets: ' + (ctx.cacheSheets || 'UNDEFINED'));
      logLine('ERROR', '   Clés de ctx: ' + Object.keys(ctx).join(', '));
    }
    return;
  }
  
  logLine('INFO', '  📌 ctx.cacheSheets: [' + ctx.cacheSheets.join(', ') + ']');
  
  const ss = ctx.ss || SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');

  if (!baseSheet) {
    logLine('ERROR', '❌ _BASEOPTI introuvable !');
    return;
  }

  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');

  logLine('INFO', '  📊 _BASEOPTI: ' + (data.length - 1) + ' élèves, colonne _CLASS_ASSIGNED: index=' + idxAssigned);

  // Grouper par classe
  const byClass = {};
  (ctx.cacheSheets || []).forEach(function(cacheName) {
    const cls = cacheName.replace('CACHE', '').trim();
    byClass[cls] = [];
    logLine('INFO', '  📂 Initialisation classe: ' + cls + ' (onglet: ' + cacheName + ')');
  });

  // 🔍 AUDIT : Compter les élèves assignés
  let totalAssigned = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const cls = String(row[idxAssigned] || '').trim();

    if (cls) {
      totalAssigned++;
      if (byClass[cls]) {
        byClass[cls].push(row);
      } else {
        logLine('WARN', '  ⚠️ Élève assigné à classe inconnue: ' + cls + ' (ligne ' + (i+1) + ')');
      }
    }
  }

  logLine('INFO', '  📊 Élèves assignés: ' + totalAssigned + '/' + (data.length - 1));

  // 🔍 AUDIT : Afficher répartition par classe
  for (const cls in byClass) {
    logLine('INFO', '  📌 ' + cls + ': ' + byClass[cls].length + ' élèves');
  }

  // Écrire dans CACHE
  let sheetsWritten = 0;
  for (const cls in byClass) {
    const cacheName = cls + 'CACHE';
    const sh = ss.getSheetByName(cacheName);

    if (!sh) {
      logLine('WARN', '  ⚠️ Onglet CACHE introuvable: ' + cacheName);
      continue;
    }

    // Vider TOUT le contenu (y compris les en-têtes pour forcer la mise à jour)
    if (sh.getLastRow() > 0) {
      sh.clearContents();
    }

    // ✅ TOUJOURS écrire les en-têtes de _BASEOPTI (pour synchroniser les colonnes)
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Écrire élèves
    if (byClass[cls].length > 0) {
      sh.getRange(2, 1, byClass[cls].length, headers.length).setValues(byClass[cls]);
      logLine('INFO', '  ✅ ' + cacheName + ': ' + byClass[cls].length + ' élèves écrits');
      sheetsWritten++;
    } else {
      logLine('INFO', '  ℹ️ ' + cacheName + ': 0 élèves (vide)');
    }
  }

  SpreadsheetApp.flush();
  
  logLine('INFO', '✅ copyBaseoptiToCache_V3: ' + sheetsWritten + ' onglets CACHE remplis');
}

// ===================================================================
// PHASE 3 V3 - COMPLÉTER EFFECTIFS & PARITÉ
// ===================================================================

/**
 * Phase 3 V3 : Complète les effectifs et équilibre parité
 * LIT : _BASEOPTI (élèves non assignés)
 * ÉCRIT : _BASEOPTI (update _CLASS_ASSIGNED)
 */
function Phase3I_completeAndParity_BASEOPTI_V3(ctx) {
  logLine('INFO', '='.repeat(80));
  logLine('INFO', '📌 PHASE 3 V3 - Effectifs & Parité (depuis _BASEOPTI)');
  logLine('INFO', '='.repeat(80));

  const ss = ctx.ss || SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');

  if (!baseSheet) {
    throw new Error('_BASEOPTI introuvable');
  }

  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];

  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const idxSexe = headers.indexOf('SEXE');
  const idxId = headers.indexOf('ID');

  if (idxAssigned === -1) {
    throw new Error('Colonne _CLASS_ASSIGNED introuvable');
  }
  if (idxSexe === -1) {
    throw new Error('Colonne SEXE introuvable');
  }

  const classNames = Array.isArray(ctx.levels) ? ctx.levels.slice() : [];
  const targetMap = ctx.targets || {};
  for (const cls in targetMap) {
    if (classNames.indexOf(cls) === -1) {
      classNames.push(cls);
    }
  }

  const classes = [];
  const classByName = {};
  classNames.forEach(function(name) {
    const targetTotal = Number(targetMap[name] || 0);
    const entry = {
      name: name,
      targetTotal: targetTotal,
      currentF: 0,
      currentM: 0,
      slotsLeft: 0,
      pendingF: 0,
      pendingM: 0,
      targetF_total: 0,
      targetM_total: 0,
      targetF_newSlots: 0,
      targetM_newSlots: 0
    };
    classes.push(entry);
    classByName[name] = entry;
  });

  const poolF = [];
  const poolM = [];

  for (let i = 1; i < data.length; i++) {
    const assigned = String(data[i][idxAssigned] || '').trim();
    const sexe = String(data[i][idxSexe] || '').trim().toUpperCase();

    if (assigned && classByName[assigned]) {
      if (sexe === 'F') {
        classByName[assigned].currentF++;
      } else if (sexe === 'M') {
        classByName[assigned].currentM++;
      }
    } else if (!assigned) {
      if (sexe === 'F') {
        poolF.push(i);
      } else if (sexe === 'M') {
        poolM.push(i);
      }
    }
  }

  classes.forEach(function(cls) {
    const filled = cls.currentF + cls.currentM;
    cls.slotsLeft = Math.max(0, cls.targetTotal - filled);
  });

  logLine('INFO', '📊 Besoins par classe :');
  classes.forEach(function(cls) {
    logLine('INFO', '  ' + cls.name + ' : ' + cls.currentF + 'F/' + cls.currentM + 'M (cible=' + cls.targetTotal + ', slots restants=' + cls.slotsLeft + ')');
  });

  logLine('INFO', '👥 Pool disponible : ' + poolF.length + ' F, ' + poolM.length + ' M');

  const parityTolerance = typeof ctx.parityTolerance === 'number' ? ctx.parityTolerance : 0;

  const totalSlots = classes.reduce(function(sum, cls) {
    return sum + cls.slotsLeft;
  }, 0);
  const totalPool = poolF.length + poolM.length;
  const ratioF = totalPool > 0 ? poolF.length / totalPool : 0.5;
  const ratioM = 1 - ratioF;

  logLine('INFO', '⚖️ Ratio F/M basé sur le vivier restant : ' + (ratioF * 100).toFixed(1) + '% F / ' + (ratioM * 100).toFixed(1) + '% M');

  if (totalPool < totalSlots) {
    logLine('WARN', '⚠️ Vivier insuffisant pour remplir toutes les classes : ' + totalPool + ' élèves pour ' + totalSlots + ' places');
  }

  const capacity = Math.min(totalSlots, totalPool);
  const targetFGlobalExact = totalSlots * ratioF;
  let targetFGlobal = Math.round(targetFGlobalExact);
  targetFGlobal = Math.min(targetFGlobal, poolF.length, capacity);
  let targetMGlobal = Math.min(poolM.length, capacity - targetFGlobal);
  let allocated = targetFGlobal + targetMGlobal;
  if (allocated < capacity) {
    const remaining = capacity - allocated;
    const extraF = Math.min(poolF.length - targetFGlobal, remaining);
    targetFGlobal += extraF;
    allocated += extraF;
    const extraM = Math.min(poolM.length - targetMGlobal, capacity - allocated);
    targetMGlobal += extraM;
    allocated += extraM;
  }
  logLine('INFO', '🎯 Quota global Phase 3 : ' + targetFGlobal + ' F / ' + targetMGlobal + ' M (slots=' + totalSlots + ', capacité=' + capacity + ')');
  const unreachableSlots = totalSlots - capacity;
  if (unreachableSlots > 0) {
    logLine('WARN', '⚠️ ' + unreachableSlots + " places ne pourront pas être pourvues faute d'élèves disponibles");
  }

  const targets = [];
  let sumBaseFTotal = 0;
  classes.forEach(function(cls) {
    const exactFTotal = cls.targetTotal * ratioF;
    let baseF = Math.floor(exactFTotal);
    if (baseF < 0) baseF = 0;
    if (baseF > cls.targetTotal) baseF = cls.targetTotal;
    const remainder = exactFTotal - baseF;
    targets.push({
      classInfo: cls,
      baseF: baseF,
      remainder: remainder
    });
    sumBaseFTotal += baseF;
  });

  let remainingFGlobal = Math.max(0, targetFGlobal - sumBaseFTotal);
  targets.sort(function(a, b) {
    if (b.remainder === a.remainder) {
      return a.classInfo.name.localeCompare(b.classInfo.name);
    }
    return b.remainder - a.remainder;
  });
  for (let i = 0; i < targets.length && remainingFGlobal > 0; i++) {
    const info = targets[i];
    if (info.baseF >= info.classInfo.targetTotal) continue;
    info.baseF++;
    remainingFGlobal--;
  }
  if (remainingFGlobal > 0) {
    for (let i = 0; i < targets.length && remainingFGlobal > 0; i++) {
      const info = targets[i];
      if (info.baseF >= info.classInfo.targetTotal) continue;
      info.baseF++;
      remainingFGlobal--;
    }
  }

  targets.forEach(function(target) {
    const cls = target.classInfo;
    cls.targetF_total = Math.min(cls.targetTotal, Math.max(0, target.baseF));
    cls.targetM_total = Math.max(0, cls.targetTotal - cls.targetF_total);
    const remainingFForClass = Math.max(0, cls.targetF_total - cls.currentF);
    const localSlots = cls.slotsLeft;
    cls.targetF_newSlots = Math.min(remainingFForClass, localSlots);
    cls.targetM_newSlots = Math.max(0, localSlots - cls.targetF_newSlots);
  });

  logLine('INFO', '📌 Quotas cibles (méthode des plus forts restes) :');
  classes.forEach(function(cls) {
    logLine('INFO', '  ' + cls.name + ' -> cible finale ' + cls.targetF_total + 'F/' + cls.targetM_total + 'M (slots F restants=' + cls.targetF_newSlots + ', slots M restants=' + cls.targetM_newSlots + ')');
  });

  function globalNeed(sex, targetF, targetM, placedF, placedM) {
    return sex === 'F' ? targetF - placedF : targetM - placedM;
  }

  function decideSexForSeat(cls, meta) {
    const finalF = cls.currentF + cls.pendingF;
    const finalM = cls.currentM + cls.pendingM;
    const targetF = cls.targetF_total;
    const targetM = cls.targetM_total;
    const diffF = targetF - finalF;
    const diffM = targetM - finalM;
    const withinTol = Math.abs(diffF) <= meta.parityTolerance && Math.abs(diffM) <= meta.parityTolerance;
    const poolFSize = meta.poolF.length;
    const poolMSize = meta.poolM.length;

    if (poolFSize === 0 && poolMSize === 0) {
      return null;
    }

    if (withinTol) {
      if (poolFSize === 0) return poolMSize > 0 ? 'M' : null;
      if (poolMSize === 0) return 'F';
      const globalNeedF = globalNeed('F', meta.targetFGlobal, meta.targetMGlobal, meta.placedF, meta.placedM);
      const globalNeedM = globalNeed('M', meta.targetFGlobal, meta.targetMGlobal, meta.placedF, meta.placedM);
      if (globalNeedF > globalNeedM) return 'F';
      if (globalNeedM > globalNeedF) return 'M';
      if (globalNeedF <= 0 && globalNeedM <= 0) {
        if (poolFSize > poolMSize) return 'F';
        if (poolMSize > poolFSize) return 'M';
      }
      return meta.lastSexUsed === 'F' ? 'M' : 'F';
    }

    if (diffF > diffM && diffF > 0) {
      if (poolFSize > 0) return 'F';
    } else if (diffM > diffF && diffM > 0) {
      if (poolMSize > 0) return 'M';
    } else {
      if (diffF > 0 && poolFSize > 0) return 'F';
      if (diffM > 0 && poolMSize > 0) return 'M';
    }

    const globalNeedF = globalNeed('F', meta.targetFGlobal, meta.targetMGlobal, meta.placedF, meta.placedM);
    const globalNeedM = globalNeed('M', meta.targetFGlobal, meta.targetMGlobal, meta.placedF, meta.placedM);

    if (globalNeedF > globalNeedM && poolFSize > 0) return 'F';
    if (globalNeedM > globalNeedF && poolMSize > 0) return 'M';

    if (poolFSize === 0 && poolMSize > 0) return 'M';
    if (poolMSize === 0 && poolFSize > 0) return 'F';

    if (poolFSize === 0 && poolMSize === 0) return null;

    return meta.lastSexUsed === 'F' ? 'M' : 'F';
  }

  function pickStudentFromPool(sex, cls, poolF, poolM, data, headers, ctx) {
    const pool = sex === 'F' ? poolF : poolM;
    for (let i = 0; i < pool.length; i++) {
      const idx = pool[i];
      const check = canPlaceInClass_V3(idx, cls.name, data, headers, undefined, ctx);
      if (check && check.ok) {
        return { poolIndex: i, rowIndex: idx };
      }
    }
    return null;
  }

  function parityPenaltyAfterPlacement(cls, sex, tolerance) {
    const finalF = cls.currentF + cls.pendingF + (sex === 'F' ? 1 : 0);
    const finalM = cls.currentM + cls.pendingM + (sex === 'M' ? 1 : 0);
    const diffF = Math.abs(finalF - cls.targetF_total);
    const diffM = Math.abs(finalM - cls.targetM_total);
    const overTolF = Math.max(0, diffF - tolerance);
    const overTolM = Math.max(0, diffM - tolerance);
    return overTolF + overTolM;
  }

  function oppositeSex(sex) {
    return sex === 'F' ? 'M' : 'F';
  }

  let lastSexUsed = 'M';
  let placedF = 0;
  let placedM = 0;

  const targetTotals = { F: targetFGlobal, M: targetMGlobal };

  let progress = true;
  while (progress) {
    progress = false;

    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      if (cls.slotsLeft <= 0) {
        continue;
      }
      if (poolF.length + poolM.length === 0) {
        break;
      }

      const meta = {
        parityTolerance: parityTolerance,
        lastSexUsed: lastSexUsed,
        targetFGlobal: targetTotals.F,
        targetMGlobal: targetTotals.M,
        placedF: placedF,
        placedM: placedM,
        poolF: poolF,
        poolM: poolM
      };

      let chosenSex = decideSexForSeat(cls, meta);
      if (!chosenSex) {
        logParityDecision(cls, {
          type: 'SKIP_SLOT',
          reason: 'no_decision_possible'
        });
        continue;
      }

      const primaryPoolSize = chosenSex === 'F' ? poolF.length : poolM.length;
      let selection = pickStudentFromPool(chosenSex, cls, poolF, poolM, data, headers, ctx);
      let fallbackUsed = false;
      let penaltyPrimary = primaryPoolSize > 0 ? parityPenaltyAfterPlacement(cls, chosenSex, parityTolerance) : Infinity;

      if (!selection) {
        const altSex = oppositeSex(chosenSex);
        const altSelection = pickStudentFromPool(altSex, cls, poolF, poolM, data, headers, ctx);
        if (altSelection) {
          const penaltyAlt = parityPenaltyAfterPlacement(cls, altSex, parityTolerance);
          if (penaltyAlt <= penaltyPrimary) {
            logParityDecision(cls, {
              type: 'FALLBACK_SEX',
              fromSex: chosenSex,
              toSex: altSex,
              reason: primaryPoolSize === 0 ? 'pool_empty_primary_sex' : 'no_compatible_candidate_primary_sex',
              penaltyOriginal: penaltyPrimary,
              penaltyFallback: penaltyAlt
            });
            selection = altSelection;
            chosenSex = altSex;
            fallbackUsed = true;
          } else {
            logParityDecision(cls, {
              type: 'SKIP_SLOT',
              fromSex: chosenSex,
              toSex: altSex,
              reason: 'fallback_would_worsen_parity',
              penaltyOriginal: penaltyPrimary,
              penaltyFallback: penaltyAlt
            });
            continue;
          }
        } else {
          logParityDecision(cls, {
            type: 'BLOCKED_SLOT',
            fromSex: chosenSex,
            toSex: altSex,
            reason: primaryPoolSize === 0 ? 'pool_empty_both' : 'no_candidate_any_sex'
          });
          continue;
        }
      }

      const poolToUse = chosenSex === 'F' ? poolF : poolM;
      const rowIndex = poolToUse.splice(selection.poolIndex, 1)[0];
      data[rowIndex][idxAssigned] = cls.name;

      if (chosenSex === 'F') {
        cls.pendingF++;
        placedF++;
      } else {
        cls.pendingM++;
        placedM++;
      }

      cls.slotsLeft--;
      lastSexUsed = chosenSex;
      progress = true;

      const eleveRow = data[rowIndex];
      const eleveId = idxId >= 0 ? eleveRow[idxId] : '';

      logParityDecision(cls, {
        type: 'PLACE',
        sex: chosenSex,
        eleveId: eleveId || '',
        reason: fallbackUsed ? 'fallback_parity_choice' : 'primary_parity_choice'
      });
    }
  }

  classes.forEach(function(cls) {
    const finalF = cls.currentF + cls.pendingF;
    const finalM = cls.currentM + cls.pendingM;
    if (cls.slotsLeft > 0) {
      logLine('WARN', '  ⚠️ ' + cls.name + ' : ' + cls.slotsLeft + ' sièges non pourvus');
    }
    logLine('INFO', '  ✅ ' + cls.name + ' finalisé (' + finalF + 'F/' + finalM + 'M)');
  });

  baseSheet.getRange(1, 1, data.length, headers.length).setValues(data);
  SpreadsheetApp.flush();

  syncClassAssignedToLegacy_('P3');

  // ⚡ OPTIMISATION QUOTA : Ne pas copier vers CACHE en Phase 3 (économiser les appels API)
  // La copie se fera en Phase 4 finale
  // copyBaseoptiToCache_V3(ctx);

  if (typeof computeMobilityFlags_ === 'function') {
    computeMobilityFlags_(ctx);
  } else {
    logLine('WARN', '⚠️ computeMobilityFlags_ non disponible (vérifier que Mobility_System.gs est chargé)');
  }

  let remaining = 0;
  for (let i = 1; i < data.length; i++) {
    if (!String(data[i][idxAssigned] || '').trim()) {
      remaining++;
    }
  }

  if (remaining > 0) {
    logLine('WARN', '⚠️ ' + remaining + ' élèves non placés après P3');
  }

  logLine('INFO', '✅ PHASE 3 V3 terminée');

  return { ok: true };
}

function logParityDecision(cls, details) {
  try {
    function formatPenalty(value) {
      if (value === undefined || value === null) return '';
      if (value === Infinity) return '∞';
      if (value === -Infinity) return '-∞';
      return value;
    }

    const row = [
      new Date(),
      'PHASE3_PARITY',
      cls && cls.name ? cls.name : (cls && cls.id ? cls.id : ''),
      details.type || '',
      details.sex || '',
      details.fromSex || '',
      details.toSex || '',
      details.reason || '',
      formatPenalty(details.penaltyOriginal),
      formatPenalty(details.penaltyFallback),
      details.eleveId || ''
    ];

    if (typeof appendLogRow === 'function') {
      appendLogRow(row);
    } else if (typeof logLine === 'function') {
      logLine('INFO', '📓 P3[' + row[2] + '] ' + JSON.stringify(details));
    }
  } catch (err) {
    if (typeof logLine === 'function') {
      logLine('WARN', '⚠️ Erreur logParityDecision : ' + err);
    }
  }
}



// ===================================================================
// PHASE 4 V3 - SWAPS BASÉS SUR L'HARMONIE ET LA PARITÉ
// ===================================================================

/**
 * Phase 4 V3 : Optimise la répartition par swaps en se basant sur un score
 * composite qui vise à harmoniser la distribution des scores dans les classes
 * tout en équilibrant la parité F/M.
 */
function Phase4_balanceScoresSwaps_BASEOPTI_V3(ctx) {
  logLine('INFO', '='.repeat(80));
  logLine('INFO', '📌 PHASE 4 V3 - Swaps pour Harmonie & Parité');
  logLine('INFO', '='.repeat(80));

  // Récupérer poids (depuis UI ou défaut)
  const defaultWeights = {
    com: 1.0,  // Priorité MAXIMALE
    tra: 0.7,
    part: 0.4,
    abs: 0.2,
    parity: 0.3
  };
  const weights = Object.assign({}, defaultWeights, ctx.weights || {});

  logLine('INFO', '⚖️ Poids : COM=' + weights.com + ', TRA=' + weights.tra + ', PART=' + weights.part + ', ABS=' + weights.abs + ', Parité=' + weights.parity);

  const ss = ctx.ss || SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');
  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];

  // Grouper par classe
  const byClass = {};
  for (let i = 1; i < data.length; i++) {
    const cls = String(data[i][headers.indexOf('_CLASS_ASSIGNED')] || '').trim();
    if (cls) {
      if (!byClass[cls]) byClass[cls] = [];
      byClass[cls].push(i);
    }
  }

  logLine('INFO', '📖 Élèves par classe :');
  for (const cls in byClass) {
    logLine('INFO', '  ' + cls + ' : ' + byClass[cls].length + ' élèves');
  }

  // Calculer score composite initial (harmonie académique + parité)
  const initialMetrics = calculateCompositeScore_V3(data, headers, byClass, weights);
  const initialAcademic = initialMetrics.academic;
  const initialParity = initialMetrics.parity;
  const initialComposite = initialMetrics.composite;
  logLine('INFO', '🎯 Score composite initial : ' + initialComposite.toFixed(2) + ' (plus bas = mieux)');
  logLine('INFO', '  ↳ Harmonie académique pondérée : ' + initialAcademic.toFixed(2));
  logLine('INFO', '  ↳ Parité (écart total F/M) : ' + initialParity.toFixed(2));

  // ✅ OPTIMUM PRIME: Calculer distribution cible pour l'harmonie
  const targetDistribution = calculateTargetDistribution_V3(data, headers, byClass);

  // Optimisation par swaps
  let swapsApplied = 0;
  const maxSwaps = ctx.maxSwaps || 500;

  let bestComposite = initialComposite;
  let stagnation = 0;

  // ⚡ OPTIMUM PRIME: Boucle d'optimisation avec early stopping intelligent
  for (let iter = 0; iter < maxSwaps; iter++) {
    // Trouver le meilleur swap possible
    const swap = findBestSwap_V3(data, headers, byClass, targetDistribution, weights, ctx);

    if (!swap || !swap.compositeGain || swap.compositeGain <= 0) {
      logLine('INFO', '  🛑 Plus de swap bénéfique trouvé (compositeGain=' + (swap && swap.compositeGain ? swap.compositeGain.toFixed(3) : 'null') + ').');
      break;
    }

    // Appliquer le swap
    const { idx1, idx2 } = swap;
    const cls1 = String(data[idx1][headers.indexOf('_CLASS_ASSIGNED')]);
    const cls2 = String(data[idx2][headers.indexOf('_CLASS_ASSIGNED')]);

    data[idx1][headers.indexOf('_CLASS_ASSIGNED')] = cls2;
    data[idx2][headers.indexOf('_CLASS_ASSIGNED')] = cls1;

    const pos1 = byClass[cls1].indexOf(idx1);
    const pos2 = byClass[cls2].indexOf(idx2);
    if (pos1 !== -1) byClass[cls1].splice(pos1, 1, idx2);
    if (pos2 !== -1) byClass[cls2].splice(pos2, 1, idx1);

    swapsApplied++;
    // ✅ OPTIMUM PRIME: Tracker le gain composite (pas de currentScore nécessaire)

    if (swapsApplied % 10 === 0) {
      const metrics = calculateCompositeScore_V3(data, headers, byClass, weights);
      const improvement = initialComposite - metrics.composite; // Positif = amélioration
      logLine('INFO', '  📊 ' + swapsApplied + ' swaps | harmonie=' + metrics.academic.toFixed(2) + ' | parité=' + metrics.parity.toFixed(2) + ' | composite=' + metrics.composite.toFixed(2) + ' | amélioration=' + improvement.toFixed(2));

      if (metrics.composite >= bestComposite - 1e-6) {
        stagnation++;
      } else {
        bestComposite = metrics.composite;
        stagnation = 0;
      }

      if (stagnation >= 5) {
        logLine('INFO', '  ⏸️ Stagnation détectée');
        break;
      }
    }
  }

  // Finalisation
  baseSheet.getRange(1, 1, data.length, headers.length).setValues(data);
  SpreadsheetApp.flush();
  copyBaseoptiToCache_V3(ctx);
  if (typeof computeMobilityFlags_ === 'function') computeMobilityFlags_(ctx);

  // ✅ OPTIMUM PRIME: Calcul des métriques finales
  const finalMetrics = calculateCompositeScore_V3(data, headers, byClass, weights);
  const finalAcademic = finalMetrics.academic;
  const finalParity = finalMetrics.parity;
  const finalComposite = finalMetrics.composite;
  const compositeImprovement = initialComposite - finalComposite;
  const academicImprovement = initialAcademic - finalAcademic;
  const parityImprovement = initialParity - finalParity;
  logLine('INFO', '✅ PHASE 4 V3 terminée : ' + swapsApplied + ' swaps, harmonie=' + finalAcademic.toFixed(2) + ', parité=' + finalParity.toFixed(2) + ', composite=' + finalComposite.toFixed(2) + ' (gain=' + compositeImprovement.toFixed(2) + ')');

  const finalDist = calculateScoreDistributions_V3(data, headers, byClass);

  const distributionImprovements = {};
  ['COM', 'TRA', 'PART', 'ABS'].forEach(function(key) {
    const initialValue = initialMetrics.distributionErrors[key] || 0;
    const finalValue = finalMetrics.distributionErrors[key] || 0;
    distributionImprovements[key] = initialValue - finalValue;
  });

  // ✅ AUDIT COMPLET : Générer un rapport détaillé de fin d'optimisation
  const auditReport = generateOptimizationAudit_V3(ctx, data, headers, byClass, finalDist, {
    initialAcademic: initialAcademic,
    finalAcademic: finalAcademic,
    academicImprovement: academicImprovement,
    initialParity: initialParity,
    finalParity: finalParity,
    parityImprovement: parityImprovement,
    initialComposite: initialComposite,
    finalComposite: finalComposite,
    compositeImprovement: compositeImprovement,
    initialDistributionErrors: initialMetrics.distributionErrors,
    finalDistributionErrors: finalMetrics.distributionErrors,
    distributionImprovements: distributionImprovements,
    weights: {
      com: weights.com,
      tra: weights.tra,
      part: weights.part,
      abs: weights.abs,
      parity: weights.parity
    },
    swapsApplied: swapsApplied
  });

  return { 
    ok: true, 
    swapsApplied: swapsApplied,
    audit: auditReport 
  };
}

/**
 * Calcule la distribution cible des scores pour chaque critère.
 * @returns {Object} ex: { COM: { '1': 0.1, '2': 0.2, ... }, ... }
 */
function calculateTargetDistribution_V3(data, headers, byClass) {
  const criteria = ['COM', 'TRA', 'PART', 'ABS'];
  const totalStudents = data.length - 1;
  const globalCounts = {};

  criteria.forEach(crit => {
    const idx = headers.indexOf(crit);
    globalCounts[crit] = { '1': 0, '2': 0, '3': 0, '4': 0 };
    for (let i = 1; i < data.length; i++) {
      const score = String(data[i][idx] || '3');
      if (globalCounts[crit][score]) {
        globalCounts[crit][score]++;
      } else {
        globalCounts[crit][score] = 1; // Handle potential other values
      }
    }
  });

  const targetDistribution = {};
  criteria.forEach(crit => {
    targetDistribution[crit] = {};
    for (let s = 1; s <= 4; s++) {
      targetDistribution[crit][s] = globalCounts[crit][s] / totalStudents;
    }
  });

  return targetDistribution;
}

function calculateDistributionTargets_V3(distributions, byClass) {
  const criteria = ['COM', 'TRA', 'PART', 'ABS'];
  const scores = [1, 2, 3, 4];

  const globalCounts = {};
  const proportions = {};
  const targets = {};

  let totalStudents = 0;

  criteria.forEach(function(criterion) {
    globalCounts[criterion] = { 1: 0, 2: 0, 3: 0, 4: 0 };
  });

  for (const cls in byClass) {
    totalStudents += byClass[cls].length;
  }

  for (const cls in distributions) {
    criteria.forEach(function(criterion) {
      scores.forEach(function(score) {
        globalCounts[criterion][score] += distributions[cls][criterion][score] || 0;
      });
    });
  }

  criteria.forEach(function(criterion) {
    proportions[criterion] = {};
    scores.forEach(function(score) {
      proportions[criterion][score] = totalStudents > 0
        ? globalCounts[criterion][score] / totalStudents
        : 0;
    });

  for (const cls in byClass) {
    const size = byClass[cls].length;
    targets[cls] = {};
    criteria.forEach(function(criterion) {
      targets[cls][criterion] = {};
      scores.forEach(function(score) {
        targets[cls][criterion][score] = proportions[criterion][score] * size;
      });
    });
  }

  return {
    totalStudents: totalStudents,
    globalCounts: globalCounts,
    proportions: proportions,
    targets: targets
  };
}

function calculateDistributionErrors_V3(distributions, targets) {
  const criteria = ['COM', 'TRA', 'PART', 'ABS'];
  const scores = [1, 2, 3, 4];
  const errors = {
    COM: 0,
    TRA: 0,
    PART: 0,
    ABS: 0
  };

  for (const cls in distributions) {
    criteria.forEach(function(criterion) {
      scores.forEach(function(score) {
        const actual = distributions[cls][criterion][score] || 0;
        const target = targets[cls] && targets[cls][criterion]
          ? targets[cls][criterion][score] || 0
          : 0;
        errors[criterion] += Math.abs(actual - target);
      });
    });
  }

  return errors;
}

function calculateParityPenalty_V3(data, headers, byClass) {
  const idxSexe = headers.indexOf('SEXE');
  let totalParityGap = 0;
  for (const cls in byClass) {
    let countF = 0, countM = 0;
    byClass[cls].forEach(idx => {
      if (String(data[idx][idxSexe] || '').toUpperCase() === 'F') countF++; else countM++;
    });
    totalParityGap += Math.abs(countF - countM);
  }
  return totalParityGap;
}

/**
 * Calcule un score composite combinant l'harmonie académique (répartition 1/2/3/4)
 * et une pénalité de parité globale.
 * @returns {{
 *   composite:number,
 *   parity:number,
 *   academic:number,
 *   distributionErrors:Object,
 *   targets:Object
 * }}
 */
function calculateCompositeScore_V3(data, headers, byClass, weights) {
  const distributions = calculateScoreDistributions_V3(data, headers, byClass);
  const targetsInfo = calculateDistributionTargets_V3(distributions, byClass);
  const distributionErrors = calculateDistributionErrors_V3(distributions, targetsInfo.targets);

  const academicWeighted =
    (weights.com || 0) * distributionErrors.COM +
    (weights.tra || 0) * distributionErrors.TRA +
    (weights.part || 0) * distributionErrors.PART +
    (weights.abs || 0) * distributionErrors.ABS;

  const parityPenalty = calculateParityPenalty_V3(data, headers, byClass);
  const parityWeight = typeof weights.parity === 'number' ? weights.parity : 0;
  const composite = academicWeighted + parityWeight * parityPenalty;

  return {
    composite: composite,
    parity: parityPenalty,
    academic: academicWeighted,
    distributionErrors: distributionErrors,
    targets: targetsInfo
  };
}

/**
 * Trouve le meilleur swap possible en minimisant le score composite (harmonie académique + parité).
 */
function calculateCompositeSwapScore_V3(data, headers, byClass, targetDistribution, weights, swap) {
  const criteria = ['COM', 'TRA', 'PART', 'ABS'];
  let totalError = 0;

  if (swap) { // Simulation rapide
    const { idx1, idx2 } = swap;
    const cls1 = String(data[idx1][headers.indexOf('_CLASS_ASSIGNED')]);
    const cls2 = String(data[idx2][headers.indexOf('_CLASS_ASSIGNED')]);

    const tempByClass = JSON.parse(JSON.stringify(byClass));
    const pos1 = tempByClass[cls1].indexOf(idx1);
    const pos2 = tempByClass[cls2].indexOf(idx2);
    if(pos1 !== -1) tempByClass[cls1].splice(pos1, 1, idx2);
    if(pos2 !== -1) tempByClass[cls2].splice(pos2, 1, idx1);
    byClass = tempByClass;
  }

  // Erreur de parité
  totalError += calculateParityError_V3(byClass, data, headers) * (weights.parity || 1.0);

  // Erreurs d'harmonie
  criteria.forEach(crit => {
    totalError += calculateHarmonyError_V3(byClass, data, headers, crit, targetDistribution) * (weights[crit.toLowerCase()] || 0.1);
  });

  return totalError;
}


/**
 * Trouve le meilleur swap possible en maximisant le gain sur le score composite.
 */
function findBestSwap_V3(data, headers, byClass, targetDistribution, weights, ctx) {
  const idxMobilite = headers.indexOf('MOBILITE');
  const idxFixe = headers.indexOf('FIXE');
  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const idxSexe = headers.indexOf('SEXE');

  const parityTolerance = (typeof ctx.parityTolerance === 'number' && ctx.parityTolerance >= 0)
    ? ctx.parityTolerance
    : Infinity;
  const enforceParityTolerance = idxSexe >= 0 && isFinite(parityTolerance) && (weights.parity === undefined || weights.parity > 0);

  const currentMetrics = calculateCompositeScore_V3(data, headers, byClass, weights);
  const currentComposite = currentMetrics.composite;
  const currentParity = currentMetrics.parity;
  const currentDistributionErrors = currentMetrics.distributionErrors;

  let bestSwap = null;
  let bestCompositeGain = 1e-6; // Seuil minimum d'amélioration du score composite
  let bestDeltaCOM = -Infinity;
  let bestDeltaTRA = -Infinity;
  let bestDeltaPART = -Infinity;
  let bestDeltaABS = -Infinity;
  let bestDeltaParity = -Infinity;

  // 📊 Compteurs de debug
  let tested = 0;
  let blockedByMobility = 0;
  let blockedByDissoAsso = 0;
  let blockedByParity = 0;
  let noImprovement = 0;

  const classes = Object.keys(byClass);

  const classParitySnapshot = {};
  if (enforceParityTolerance) {
    classes.forEach(function(cls) {
      let countF = 0;
      let countM = 0;
      byClass[cls].forEach(function(idx) {
        const sexe = String(data[idx][idxSexe] || '').toUpperCase();
        if (sexe === 'F') countF++;
        else if (sexe === 'M') countM++;
      });
      classParitySnapshot[cls] = { F: countF, M: countM };
    });
  }

  // Essayer swaps entre paires de classes
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const cls1 = classes[i];
      const cls2 = classes[j];

      byClass[cls1].forEach((idx1, pos1) => {
        if (String(data[idx1][idxMobilite] || '').toUpperCase() === 'FIXE' || String(data[idx1][idxFixe] || '').toUpperCase() === 'FIXE') {
          blockedByMobility++;
          return;
        }

        byClass[cls2].forEach((idx2, pos2) => {
          if (String(data[idx2][idxMobilite] || '').toUpperCase() === 'FIXE' || String(data[idx2][idxFixe] || '').toUpperCase() === 'FIXE') {
            blockedByMobility++;
            return;
          }

          tested++;

          if (enforceParityTolerance) {
            const sexe1 = String(data[idx1][idxSexe] || '').toUpperCase();
            const sexe2 = String(data[idx2][idxSexe] || '').toUpperCase();
            const parity1 = classParitySnapshot[cls1] || { F: 0, M: 0 };
            const parity2 = classParitySnapshot[cls2] || { F: 0, M: 0 };

            const after1F = parity1.F + (sexe2 === 'F' ? 1 : 0) - (sexe1 === 'F' ? 1 : 0);
            const after1M = parity1.M + (sexe2 === 'M' ? 1 : 0) - (sexe1 === 'M' ? 1 : 0);
            const after2F = parity2.F + (sexe1 === 'F' ? 1 : 0) - (sexe2 === 'F' ? 1 : 0);
            const after2M = parity2.M + (sexe1 === 'M' ? 1 : 0) - (sexe2 === 'M' ? 1 : 0);

            if (Math.abs(after1F - after1M) > parityTolerance || Math.abs(after2F - after2M) > parityTolerance) {
              blockedByParity++;
              return;
            }
          }

          // 🔒 VÉRIFIER CONTRAINTES DISSO/ASSO/LV2/OPT avant le swap
          const swapCheck = canSwapStudents_V3(idx1, cls1, idx2, cls2, data, headers, ctx);
          if (!swapCheck.ok) {
            blockedByDissoAsso++;
            return;
          }

          // Simuler le swap
          const saved1 = data[idx1][idxAssigned];
          const saved2 = data[idx2][idxAssigned];

          data[idx1][idxAssigned] = cls2;
          data[idx2][idxAssigned] = cls1;

          // ✅ FIX CRITIQUE: Update temporaire byClass avec positions correctes
          const savedByClass1 = byClass[cls1][pos1];
          const savedByClass2 = byClass[cls2][pos2];
          byClass[cls1][pos1] = idx2;
          byClass[cls2][pos2] = idx1;

          // Calculer nouveau score composite
          const candidateMetrics = calculateCompositeScore_V3(data, headers, byClass, weights);
          const newComposite = candidateMetrics.composite;
          const newParity = candidateMetrics.parity;

          const compositeGain = currentComposite - newComposite;
          const parityGain = currentParity - newParity;
          const deltaCOM = (currentDistributionErrors.COM || 0) - (candidateMetrics.distributionErrors.COM || 0);
          const deltaTRA = (currentDistributionErrors.TRA || 0) - (candidateMetrics.distributionErrors.TRA || 0);
          const deltaPART = (currentDistributionErrors.PART || 0) - (candidateMetrics.distributionErrors.PART || 0);
          const deltaABS = (currentDistributionErrors.ABS || 0) - (candidateMetrics.distributionErrors.ABS || 0);

          // ✅ Restaurer état original
          data[idx1][idxAssigned] = saved1;
          data[idx2][idxAssigned] = saved2;
          byClass[cls1][pos1] = savedByClass1;
          byClass[cls2][pos2] = savedByClass2;

          // Décider si ce swap est meilleur
          let takeThisSwap = false;

          if (compositeGain > bestCompositeGain + 1e-6) {
            takeThisSwap = true;
          } else if (Math.abs(compositeGain - bestCompositeGain) <= 1e-6 && compositeGain > 1e-6) {
            if (deltaCOM > bestDeltaCOM + 1e-6) {
              takeThisSwap = true;
            } else if (Math.abs(deltaCOM - bestDeltaCOM) <= 1e-6 && deltaTRA > bestDeltaTRA + 1e-6) {
              takeThisSwap = true;
            } else if (Math.abs(deltaCOM - bestDeltaCOM) <= 1e-6 && Math.abs(deltaTRA - bestDeltaTRA) <= 1e-6 && deltaPART > bestDeltaPART + 1e-6) {
              takeThisSwap = true;
            } else if (Math.abs(deltaCOM - bestDeltaCOM) <= 1e-6 && Math.abs(deltaTRA - bestDeltaTRA) <= 1e-6 && Math.abs(deltaPART - bestDeltaPART) <= 1e-6 && deltaABS > bestDeltaABS + 1e-6) {
              takeThisSwap = true;
            } else if (Math.abs(deltaCOM - bestDeltaCOM) <= 1e-6 && Math.abs(deltaTRA - bestDeltaTRA) <= 1e-6 && Math.abs(deltaPART - bestDeltaPART) <= 1e-6 && Math.abs(deltaABS - bestDeltaABS) <= 1e-6 && parityGain > bestDeltaParity + 1e-6) {
              takeThisSwap = true;
            }
          }

          if (takeThisSwap) {
            bestCompositeGain = compositeGain;
            bestDeltaCOM = deltaCOM;
            bestDeltaTRA = deltaTRA;
            bestDeltaPART = deltaPART;
            bestDeltaABS = deltaABS;
            bestDeltaParity = parityGain;
            bestSwap = {
              idx1: idx1,
              idx2: idx2,
              compositeGain: compositeGain,
              parityGain: parityGain,
              deltas: {
                COM: deltaCOM,
                TRA: deltaTRA,
                PART: deltaPART,
                ABS: deltaABS
              }
            };
          } else {
            noImprovement++;
          }
        });
      });
    }
  }

  // 📊 Log des statistiques de recherche
  if (tested > 0 || blockedByMobility > 0 || blockedByDissoAsso > 0 || blockedByParity > 0) {
    logLine('INFO', '  🔍 Recherche swap : ' + tested + ' testés, ' + blockedByMobility + ' bloqués (mobilité), ' +
            blockedByDissoAsso + ' bloqués (DISSO/ASSO), ' + blockedByParity + ' bloqués (parité), ' +
            noImprovement + ' sans amélioration');
  }

  return bestSwap;
}


// ===================================================================
// SYNC LEGACY COLUMNS FOR AUDIT COMPATIBILITY
// ===================================================================

/**
 * Synchronise _CLASS_ASSIGNED vers les colonnes legacy (_PLACED, CLASSE_FINAL, _TARGET_CLASS)
 * pour assurer la compatibilité avec les fonctions d'audit existantes.
 *
 * @param {string} phaseLabel - Label de la phase (P1, P2, P3, P4)
 */
function syncClassAssignedToLegacy_(phaseLabel) {
  const ss = SpreadsheetApp.getActive();
  const baseSheet = ss.getSheetByName('_BASEOPTI');

  if (!baseSheet) {
    logLine('WARN', '⚠️ syncClassAssignedToLegacy_: _BASEOPTI introuvable');
    return;
  }

  const data = baseSheet.getDataRange().getValues();
  const headers = data[0];

  const idxAssigned = headers.indexOf('_CLASS_ASSIGNED');
  const idxPlaced = headers.indexOf('_PLACED');
  const idxClasseFinal = headers.indexOf('CLASSE_FINAL');
  const idxTargetClass = headers.indexOf('_TARGET_CLASS');

  if (idxAssigned === -1) {
    logLine('WARN', '⚠️ syncClassAssignedToLegacy_: colonne _CLASS_ASSIGNED introuvable');
    return;
  }

  let synced = 0;

  for (let i = 1; i < data.length; i++) {
    const assigned = String(data[i][idxAssigned] || '').trim();

    if (assigned) {
      // Sync _PLACED
      if (idxPlaced >= 0) {
        data[i][idxPlaced] = phaseLabel;
      }

      // Sync CLASSE_FINAL
      if (idxClasseFinal >= 0) {
        data[i][idxClasseFinal] = assigned;
      }

      // Sync _TARGET_CLASS
      if (idxTargetClass >= 0) {
        data[i][idxTargetClass] = assigned;
      }

      synced++;
    }
  }

  // Écrire les modifications
  baseSheet.getRange(1, 1, data.length, headers.length).setValues(data);
  SpreadsheetApp.flush();

  logLine('INFO', '  🔄 Sync legacy: ' + synced + ' élèves (' + phaseLabel + ')');
}

/**
 * ============================================================
 * AUDIT COMPLET DE FIN D'OPTIMISATION
 * ============================================================
 * Génère un rapport détaillé avec :
 * - Répartition par classe (effectifs, parité F/M)
 * - Distribution des scores (COM, TRA, PART, ABS)
 * - Respect des quotas LV2/OPT
 * - Statuts de mobilité (FIXE, PERMUT, LIBRE)
 * - Codes ASSO/DISSO
 * - Métriques de qualité (variance, écart-type)
 *
 * @param {Object} ctx - Contexte d'optimisation
 * @param {Array} data - Données _BASEOPTI
 * @param {Array} headers - En-têtes _BASEOPTI
 * @param {Object} byClass - Index des élèves par classe
 * @param {Object} distributions - Distributions des scores
 * @param {Object} metrics - Métriques d'optimisation
 * @returns {Object} Rapport d'audit complet
 */
function generateOptimizationAudit_V3(ctx, data, headers, byClass, distributions, metrics) {
  logLine('INFO', '');
  logLine('INFO', '═══════════════════════════════════════════════════════');
  logLine('INFO', '📊 AUDIT COMPLET DE FIN D\'OPTIMISATION');
  logLine('INFO', '═══════════════════════════════════════════════════════');
  logLine('INFO', '');

  const report = {
    timestamp: new Date().toISOString(),
    metrics: metrics,
    classes: {},
    global: {
      totalStudents: 0,
      totalFemale: 0,
      totalMale: 0,
      parityRatio: 0
    },
    quotas: {},
    mobility: {
      FIXE: 0,
      PERMUT: 0,
      LIBRE: 0,
      CONFLIT: 0
    },
    codes: {
      ASSO: {},
      DISSO: {}
    },
    quality: {}
  };

  // Indices des colonnes
  const idxNom = headers.indexOf('NOM');
  const idxPrenom = headers.indexOf('PRENOM');
  const idxSexe = headers.indexOf('SEXE');
  const idxLV2 = headers.indexOf('LV2');
  const idxOPT = headers.indexOf('OPT');
  const idxCOM = headers.indexOf('COM');
  const idxTRA = headers.indexOf('TRA');
  const idxPART = headers.indexOf('PART');
  const idxABS = headers.indexOf('ABS');
  const idxMobilite = headers.indexOf('MOBILITE');
  const idxFixe = headers.indexOf('FIXE');
  const idxAsso = headers.indexOf('ASSO');
  const idxDisso = headers.indexOf('DISSO');
  const idxClassAssigned = headers.indexOf('_CLASS_ASSIGNED');

  // ========== 1. ANALYSE PAR CLASSE ==========
  logLine('INFO', '📋 1. RÉPARTITION PAR CLASSE');
  logLine('INFO', '─────────────────────────────────────────────────────');

  for (const cls in byClass) {
    const indices = byClass[cls];
    const classData = {
      name: cls,
      total: indices.length,
      female: 0,
      male: 0,
      parityRatio: 0,
      scores: {
        COM: { 1: 0, 2: 0, 3: 0, 4: 0, avg: 0 },
        TRA: { 1: 0, 2: 0, 3: 0, 4: 0, avg: 0 },
        PART: { 1: 0, 2: 0, 3: 0, 4: 0, avg: 0 },
        ABS: { 1: 0, 2: 0, 3: 0, 4: 0, avg: 0 }
      },
      lv2: {},
      opt: {},
      mobility: { FIXE: 0, PERMUT: 0, LIBRE: 0, CONFLIT: 0 }
    };

    // Compter par sexe, scores, LV2, OPT, mobilité
    indices.forEach(function(idx) {
      const sexe = String(data[idx][idxSexe] || '').toUpperCase();
      if (sexe === 'F') classData.female++;
      else if (sexe === 'M') classData.male++;

      // Scores
      const com = Number(data[idx][idxCOM] || 3);
      const tra = Number(data[idx][idxTRA] || 3);
      const part = Number(data[idx][idxPART] || 3);
      const abs = Number(data[idx][idxABS] || 3);

      classData.scores.COM[com]++;
      classData.scores.TRA[tra]++;
      classData.scores.PART[part]++;
      classData.scores.ABS[abs]++;

      // LV2 et OPT
      const lv2 = String(data[idx][idxLV2] || '').trim().toUpperCase();
      const opt = String(data[idx][idxOPT] || '').trim().toUpperCase();

      if (lv2 && lv2 !== 'ESP' && lv2 !== 'ANG') {
        classData.lv2[lv2] = (classData.lv2[lv2] || 0) + 1;
      }
      if (opt) {
        classData.opt[opt] = (classData.opt[opt] || 0) + 1;
      }

      // Mobilité
      const mob = String(data[idx][idxMobilite] || 'LIBRE').toUpperCase();
      if (mob.includes('FIXE')) classData.mobility.FIXE++;
      else if (mob.includes('PERMUT')) classData.mobility.PERMUT++;
      else if (mob.includes('CONFLIT')) classData.mobility.CONFLIT++;
      else classData.mobility.LIBRE++;
    });

    // Calculer parité
    classData.parityRatio = classData.total > 0 
      ? (classData.female / classData.total * 100).toFixed(1) 
      : 0;

    // Calculer moyennes des scores
    ['COM', 'TRA', 'PART', 'ABS'].forEach(function(scoreType) {
      let sum = 0;
      let count = 0;
      for (let score = 1; score <= 4; score++) {
        sum += score * classData.scores[scoreType][score];
        count += classData.scores[scoreType][score];
      }
      classData.scores[scoreType].avg = count > 0 ? (sum / count).toFixed(2) : 0;
    });

    report.classes[cls] = classData;
    report.global.totalStudents += classData.total;
    report.global.totalFemale += classData.female;
    report.global.totalMale += classData.male;

    // Log
    logLine('INFO', '  ' + cls + ' : ' + classData.total + ' élèves (' + classData.female + 'F / ' + classData.male + 'M = ' + classData.parityRatio + '% F)');
    logLine('INFO', '    Scores moyens: COM=' + classData.scores.COM.avg + ', TRA=' + classData.scores.TRA.avg + ', PART=' + classData.scores.PART.avg + ', ABS=' + classData.scores.ABS.avg);
    
    if (Object.keys(classData.lv2).length > 0) {
      logLine('INFO', '    LV2: ' + JSON.stringify(classData.lv2));
    }
    if (Object.keys(classData.opt).length > 0) {
      logLine('INFO', '    OPT: ' + JSON.stringify(classData.opt));
    }
    
    logLine('INFO', '    Mobilité: FIXE=' + classData.mobility.FIXE + ', PERMUT=' + classData.mobility.PERMUT + ', LIBRE=' + classData.mobility.LIBRE);
  }

  // Parité globale
  report.global.parityRatio = report.global.totalStudents > 0
    ? (report.global.totalFemale / report.global.totalStudents * 100).toFixed(1)
    : 0;

  logLine('INFO', '');
  logLine('INFO', '  GLOBAL : ' + report.global.totalStudents + ' élèves (' + report.global.totalFemale + 'F / ' + report.global.totalMale + 'M = ' + report.global.parityRatio + '% F)');

  // ========== 2. RESPECT DES QUOTAS ==========
  logLine('INFO', '');
  logLine('INFO', '📊 2. RESPECT DES QUOTAS LV2/OPT');
  logLine('INFO', '─────────────────────────────────────────────────────');

  if (ctx.quotas) {
    for (const cls in ctx.quotas) {
      const quotasDef = ctx.quotas[cls];
      const classData = report.classes[cls];
      
      if (!classData) continue;

      logLine('INFO', '  ' + cls + ' :');

      for (const option in quotasDef) {
        const quota = quotasDef[option];
        const actual = classData.lv2[option.toUpperCase()] || classData.opt[option.toUpperCase()] || 0;
        const status = actual <= quota ? '✅' : '⚠️';
        
        logLine('INFO', '    ' + status + ' ' + option + ' : ' + actual + ' / ' + quota + ' (quota)');
        
        if (!report.quotas[option]) {
          report.quotas[option] = { quota: quota, actual: 0, classes: [] };
        }
        report.quotas[option].actual += actual;
        report.quotas[option].classes.push({ class: cls, count: actual });
      }
    }
  }

  // ========== 3. CODES ASSO/DISSO ==========
  logLine('INFO', '');
  logLine('INFO', '🔗 3. CODES ASSO/DISSO');
  logLine('INFO', '─────────────────────────────────────────────────────');

  for (let i = 1; i < data.length; i++) {
    const asso = String(data[i][idxAsso] || '').trim().toUpperCase();
    const disso = String(data[i][idxDisso] || '').trim().toUpperCase();
    const classe = String(data[i][idxClassAssigned] || '').trim();

    if (asso) {
      if (!report.codes.ASSO[asso]) {
        report.codes.ASSO[asso] = { count: 0, classes: {} };
      }
      report.codes.ASSO[asso].count++;
      report.codes.ASSO[asso].classes[classe] = (report.codes.ASSO[asso].classes[classe] || 0) + 1;
    }

    if (disso) {
      if (!report.codes.DISSO[disso]) {
        report.codes.DISSO[disso] = { count: 0, classes: {} };
      }
      report.codes.DISSO[disso].count++;
      report.codes.DISSO[disso].classes[classe] = (report.codes.DISSO[disso].classes[classe] || 0) + 1;
    }
  }

  // Log ASSO
  const assoKeys = Object.keys(report.codes.ASSO);
  if (assoKeys.length > 0) {
    logLine('INFO', '  ASSO (' + assoKeys.length + ' groupes) :');
    assoKeys.forEach(function(code) {
      const group = report.codes.ASSO[code];
      const classesStr = Object.keys(group.classes).map(function(c) {
        return c + '(' + group.classes[c] + ')';
      }).join(', ');
      const status = Object.keys(group.classes).length === 1 ? '✅' : '⚠️';
      logLine('INFO', '    ' + status + ' ' + code + ' : ' + group.count + ' élèves → ' + classesStr);
    });
  } else {
    logLine('INFO', '  Aucun code ASSO');
  }

  // Log DISSO
  const dissoKeys = Object.keys(report.codes.DISSO);
  if (dissoKeys.length > 0) {
    logLine('INFO', '  DISSO (' + dissoKeys.length + ' codes) :');
    dissoKeys.forEach(function(code) {
      const group = report.codes.DISSO[code];
      const classesStr = Object.keys(group.classes).map(function(c) {
        return c + '(' + group.classes[c] + ')';
      }).join(', ');
      const status = Object.keys(group.classes).length === group.count ? '✅' : '⚠️';
      logLine('INFO', '    ' + status + ' ' + code + ' : ' + group.count + ' élèves → ' + classesStr);
    });
  } else {
    logLine('INFO', '  Aucun code DISSO');
  }

  // ========== 4. MÉTRIQUES DE QUALITÉ ==========
  logLine('INFO', '');
  logLine('INFO', '📈 4. MÉTRIQUES DE QUALITÉ');
  logLine('INFO', '─────────────────────────────────────────────────────');

  // Calculer écart-type des effectifs
  const effectifs = Object.keys(report.classes).map(function(cls) {
    return report.classes[cls].total;
  });
  const avgEffectif = effectifs.reduce(function(a, b) { return a + b; }, 0) / effectifs.length;
  const varianceEffectif = effectifs.reduce(function(sum, val) {
    return sum + Math.pow(val - avgEffectif, 2);
  }, 0) / effectifs.length;
  const ecartTypeEffectif = Math.sqrt(varianceEffectif);

  report.quality.effectifs = {
    avg: avgEffectif.toFixed(2),
    ecartType: ecartTypeEffectif.toFixed(2)
  };

  logLine('INFO', '  Effectifs : moyenne=' + report.quality.effectifs.avg + ', écart-type=' + report.quality.effectifs.ecartType);

  // Calculer écart-type de la parité
  const parities = Object.keys(report.classes).map(function(cls) {
    return parseFloat(report.classes[cls].parityRatio);
  });
  const avgParity = parities.reduce(function(a, b) { return a + b; }, 0) / parities.length;
  const varianceParity = parities.reduce(function(sum, val) {
    return sum + Math.pow(val - avgParity, 2);
  }, 0) / parities.length;
  const ecartTypeParity = Math.sqrt(varianceParity);

  report.quality.parity = {
    avg: avgParity.toFixed(1),
    ecartType: ecartTypeParity.toFixed(2)
  };

  logLine('INFO', '  Parité F/M : moyenne=' + report.quality.parity.avg + '% F, écart-type=' + report.quality.parity.ecartType);

  // Métriques d'optimisation
  logLine('INFO', '  Harmonie académique pondérée : initiale=' + metrics.initialAcademic.toFixed(2) + ', finale=' + metrics.finalAcademic.toFixed(2) + ' (Δ=' + metrics.academicImprovement.toFixed(2) + ')');
  logLine('INFO', '  Parité totale |F-M| : initiale=' + metrics.initialParity.toFixed(2) + ', finale=' + metrics.finalParity.toFixed(2) + ' (Δ=' + metrics.parityImprovement.toFixed(2) + ')');
  logLine('INFO', '  Score composite : initial=' + metrics.initialComposite.toFixed(2) + ', final=' + metrics.finalComposite.toFixed(2) + ' (Δ=' + metrics.compositeImprovement.toFixed(2) + ')');
  logLine('INFO', '  Harmonisation détaillée : COM=' + metrics.distributionImprovements.COM.toFixed(2) + ', TRA=' + metrics.distributionImprovements.TRA.toFixed(2) + ', PART=' + metrics.distributionImprovements.PART.toFixed(2) + ', ABS=' + metrics.distributionImprovements.ABS.toFixed(2));
  logLine('INFO', '  Swaps appliqués : ' + metrics.swapsApplied);

  // ========== 5. SYNTHÈSE ==========
  logLine('INFO', '');
  logLine('INFO', '✅ 5. SYNTHÈSE');
  logLine('INFO', '─────────────────────────────────────────────────────');
  logLine('INFO', '  Classes : ' + Object.keys(report.classes).length);
  logLine('INFO', '  Élèves : ' + report.global.totalStudents + ' (' + report.global.totalFemale + 'F / ' + report.global.totalMale + 'M)');
  logLine('INFO', '  Parité globale : ' + report.global.parityRatio + '% F');
  logLine('INFO', '  Groupes ASSO : ' + assoKeys.length);
  logLine('INFO', '  Codes DISSO : ' + dissoKeys.length);
  const improvementRatio = metrics.initialComposite !== 0
    ? (metrics.compositeImprovement / metrics.initialComposite * 100).toFixed(1)
    : 'N/A';
  logLine('INFO', '  Amélioration composite : ' + improvementRatio + '%');

  logLine('INFO', '');
  logLine('INFO', '═══════════════════════════════════════════════════════');
  logLine('INFO', '');

  return report;
}

