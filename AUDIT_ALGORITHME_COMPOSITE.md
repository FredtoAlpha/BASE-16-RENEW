# Audit de l'Algorithme de Répartition "Optimus Prime"

**Date de l'audit :** 2025-11-13
**Version auditée :** `claude/optimum-prime-master`

## 1. Introduction

Cet audit examine l'algorithme de répartition des élèves, surnommé "Optimus Prime", en se concentrant sur son **processus de répartition** et son **efficacité à maintenir l'équilibre de parité Hommes/Femmes (H/F)**. L'analyse se base sur le code fourni dans la branche `claude/optimum-prime-master`, qui introduit un score composite pour l'optimisation.

## 2. Analyse du Processus de Répartition

L'algorithme est structuré en 4 phases distinctes, ce qui est une excellente pratique en termes de modularité et de maintenabilité.

- **Phase 1 (Options & LV2) et Phase 2 (ASSO/DISSO)** : Ces phases initiales traitent les contraintes "dures" (règles métier non négociables). Placer les élèves ayant des options spécifiques (LV2, LATIN, etc.) et gérer les demandes de regroupement ou de séparation en premier est logique et correct. Cela garantit que les contraintes les plus fortes sont satisfaites avant toute optimisation.

- **Phase 3 (Remplissage & Parité)** : Cette phase vise à compléter les classes jusqu'à leur effectif cible tout en tentant d'atteindre une parité H/F.
  - **Logique actuelle :** L'algorithme calcule un ratio H/F global basé sur le pool d'élèves restants, puis en déduit un objectif de parité pour chaque classe. Il tente ensuite de remplir les places restantes en choisissant l'élève (H ou F) qui minimise l'écart par rapport à cette cible.
  - **Point fort :** L'intention est bonne. Le calcul d'un ratio global et son application proportionnelle aux classes est une approche mathématiquement saine.
  - **Point faible / Dysfonctionnement suspecté :** Le problème ne vient pas de la stratégie mais de l'implémentation. L'algorithme semble prendre des décisions "locales" (élève par élève) sans réévaluer l'impact global à chaque étape, ce qui peut conduire à des situations sous-optimales. Si un élève "F" est nécessaire pour une classe A mais que le seul élève "F" disponible est "verrouillé" par une contrainte (par exemple, une option LV2 non disponible dans la classe A), l'algorithme peut se retrouver bloqué ou faire un choix par défaut qui dégrade la parité ailleurs.

- **Phase 4 (Swaps d'optimisation)** : C'est le cœur de l'optimisation "fine". L'introduction d'un **score composite** est une avancée majeure par rapport aux versions précédentes.
  - **Score Composite :** La formule `Gain = w_p * ΔParité + w_c * ΔCOM + w_t * ΔTRA + ...` permet de pondérer l'importance de chaque critère (parité, comportement, travail, etc.).
  - **Point fort :** Cette approche est puissante et flexible. En ajustant les poids (`w_p`, `w_c`, etc.), on peut piloter l'optimisation pour privilégier, par exemple, la parité ou l'équilibre des niveaux de comportement.
  - **Point faible / Risque :** Le succès de cette phase dépend entièrement de la **qualité du calcul de gain (Δ)** et de la **pertinence des poids**. Si le calcul du "gain de parité" est défectueux ou si son poids est trop faible, l'algorithme privilégiera systématiquement les autres critères, même si cela doit se faire au détriment de la parité.

## 3. Analyse Spécifique de l'Algorithme de Parité H/F

Le dysfonctionnement de la parité semble provenir d'une combinaison de facteurs :

1.  **"Effet de bord" de la Phase 3 :** La phase de remplissage peut créer des déséquilibres importants si elle est contrainte par les options (LV2/OPT). Par exemple, si tous les élèves restants avec l'option "ITALIEN" sont des filles et qu'elles doivent toutes aller en 6°1, cette classe commencera la phase 4 avec un fort surplus de filles, un problème que les swaps de la phase 4 pourraient ne jamais pouvoir corriger.

2.  **Poids insuffisant de la Parité en Phase 4 :** Si le poids `w_p` est trop faible dans le score composite, un swap qui améliorerait grandement la parité mais dégraderait légèrement l'équilibre du comportement (`COM`) pourrait être rejeté par l'algorithme. L'optimiseur, en cherchant le "meilleur" gain global, peut considérer que sacrifier la parité est un compromis acceptable.

3.  **Manque de "Swaps de Parité Pure" :** L'algorithme cherche le meilleur swap *composite*. Il pourrait être bénéfique d'introduire une sous-phase ou une logique qui, si la parité est très mauvaise (au-delà d'un certain seuil), effectue des swaps qui n'améliorent *que* la parité, même si le gain composite est nul ou légèrement négatif.

4.  **Verrouillage par les contraintes dures :** Un élève "FIXE" (par exemple, à cause d'une option rare) ne peut pas être échangé. Si plusieurs élèves du même sexe se retrouvent "FIXES" dans la même classe, ils créent un déséquilibre de parité permanent que l'algorithme ne peut pas corriger.

## 4. Recommandations

Pour améliorer l'équilibrage de la parité, voici plusieurs pistes, classées par ordre de priorité :

1.  **Prioriser la Parité en Phase 3 :**
    - **Modifier la logique de remplissage :** Au lieu de simplement prendre le prochain élève disponible, l'algorithme devrait peut-être évaluer une liste de candidats pour chaque place vacante. Pour une place donnée, il pourrait tester plusieurs élèves (H et F) et choisir celui qui non seulement respecte les contraintes mais minimise aussi le déséquilibre de parité *futur*.

2.  **Renforcer l'impact de la Parité en Phase 4 :**
    - **Augmenter le poids `w_p` :** C'est la solution la plus simple. Doubler ou tripler le poids de la parité forcera l'algorithme à donner la priorité aux swaps qui améliorent cet aspect.
    - **Introduire un "Coût d'Inégalité" non linéaire :** Au lieu d'un gain linéaire, le score de parité pourrait devenir exponentiel lorsque l'écart H/F dépasse un certain seuil (par exemple, > 2). Un écart de 3 serait alors pénalisé bien plus fortement qu'un écart de 2, rendant sa correction prioritaire.

3.  **Ajouter une Étape de "Réparation de Parité" :**
    - Après la phase 4, si des classes dépassent encore le seuil de tolérance de parité, lancer une boucle de "swaps de dernier recours". Cette boucle ne chercherait qu'à échanger un "F" contre un "M" (ou inversement) entre les classes les plus déséquilibrées, sans tenir compte des autres critères. Ces swaps ne seraient autorisés que s'ils ne violent aucune contrainte dure (ASSO/DISSO, LV2/OPT).

## 5. Conclusion

L'algorithme "Optimus Prime" est une base solide et bien structurée. Son principal défaut n'est pas conceptuel mais réside dans **l'arbitrage entre les différents objectifs d'optimisation**. Le dysfonctionnement de la parité H/F est très probablement dû à une **priorité insuffisante accordée à ce critère** par rapport aux contraintes de répartition (options) et aux autres critères d'optimisation (comportement, travail).

En ajustant les poids, en renforçant la logique de la phase 3 et en ajoutant potentiellement une étape de "réparation", il est tout à fait possible de corriger ce dysfonctionnement et d'atteindre un équilibre de parité satisfaisant, tout en conservant les excellentes capacités d'harmonisation des classes de l'algorithme.
