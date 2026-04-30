# PROMPT — Développement d'un jeu de football web (V1 : match solo)

## CONTEXTE

Tu es l'agent développeur de jeu JavaScript senior défini dans `.clinerules`. Tu vas concevoir et implémenter un **jeu de football jouable dans le navigateur**. Cette première itération (V1) doit livrer un **match solo complet et plaisant à jouer** : un humain contre une équipe IA, du coup d'envoi au coup de sifflet final, sans bug bloquant.

Tu travailles en autonomie : tu poses tes questions de cadrage en début de session si nécessaire, tu prends des décisions techniques justifiées, tu livres du code production-ready et tu documentes au fur et à mesure.

## OBJECTIF V1

Un joueur humain peut lancer le jeu, choisir son équipe, jouer un match complet de football vu du dessus (top-down) ou en vue 2.5D selon ton choix justifié, marquer des buts, en encaisser, et voir le score final. Le tout fluide à 60 FPS sur un laptop standard de 2022.

## STACK TECHNIQUE IMPOSÉE

- **Langage** : TypeScript strict
- **Moteur de rendu** : PixiJS v8 (2D performant, WebGL/WebGPU, écosystème mature pour le sport)
- **Build** : Vite
- **Physique** : implémentation custom légère (pas de moteur lourd type Matter.js — overkill pour du foot top-down où on n'a besoin que de cercles/AABB et de friction)
- **Audio** : Web Audio API directement, ou Howler.js si besoin de simplicité
- **Architecture** : ECS via **bitECS** ou architecture orientée systèmes maison si tu juges bitECS overkill pour la V1 — justifie ton choix
- **Tests** : Vitest pour la logique pure
- **Pas de framework UI** : HTML/CSS natif pour les menus, Pixi pour le terrain

## FONCTIONNALITÉS V1 — PÉRIMÈTRE STRICT

### Gameplay obligatoire
1. **Match 11 vs 11** sur un terrain aux dimensions FIFA proportionnelles (105m × 68m, échelle pixel à définir).
2. **Contrôle d'un joueur à la fois** côté humain : celui le plus proche du ballon, switch automatique. Bouton de switch manuel optionnel.
3. **Actions du joueur humain** : se déplacer, courir (sprint avec stamina), tirer (puissance variable selon durée d'appui), passer (courte/longue), tacler, changer de joueur.
4. **Physique du ballon** : friction au sol, rebonds sur les bords, trajectoires balistiques sur les tirs aériens, effet « Magnus » optionnel mais simple.
5. **Règles** : coup d'envoi, touches, corners, six mètres, buts, mi-temps, fin de match. **Pas de hors-jeu en V1**, **pas de fautes/cartons en V1** — assume-le explicitement comme dette.
6. **Durée du match** : configurable, défaut 2 × 3 minutes de temps réel (échelle accélérée pour rester fun).
7. **Score affiché**, chronomètre, mi-temps avec changement de côté.

### IA adversaire (et coéquipiers)
1. Machine à états par joueur : `Idle`, `ChasingBall`, `SupportingAttack`, `Defending`, `Marking`, `ReturningToPosition`.
2. Formation tactique simple (4-4-2 par défaut), positions de base ajustées dynamiquement selon la position du ballon (bloc équipe qui glisse).
3. Décisions offensives basiques : passer au coéquipier le mieux placé (heuristique : démarqué + en avant + distance raisonnable), tirer si dans la zone et angle ouvert, dribbler sinon.
4. Décisions défensives : marquer le porteur le plus proche, intercepter les passes lisibles, retour défensif.
5. Niveau de difficulté : **un seul niveau en V1** (« Normal »), équilibré pour qu'un joueur moyen puisse gagner 1 match sur 2.

### Contrôles
- **Clavier** : ZQSD/WASD ou flèches pour déplacer, Espace tir (charge à l'appui), E passe, A tacle, Shift sprint, Tab switch joueur.
- **Manette** : Gamepad API, mapping Xbox/PlayStation. Stick gauche déplacement, A/croix passe, B/rond tir, X/carré tacle, RT/R2 sprint, LB/L1 switch.
- Sensibilité et remappage : pas en V1, mais structure le code pour que ce soit ajoutable sans refonte.

### UI/UX
1. Écran titre minimal : « Jouer un match », « Crédits ».
2. Écran de sélection : équipe domicile / extérieur (8 équipes fictives avec stats simples : attaque/milieu/défense de 1 à 5).
3. HUD en match : score, chronomètre, mi-temps, indicateur du joueur contrôlé (flèche au-dessus), jauge de tir pendant la charge.
4. Écran fin de match : score final, statistiques basiques (possession, tirs, tirs cadrés), bouton rejouer.

### Audio
1. Bruitages essentiels : coup de pied dans le ballon, sifflet (coup d'envoi, but, mi-temps, fin), foule en fond (boucle), réaction foule sur but.
2. Pas de musique en V1 obligatoire, mais prévoir le slot.

## CONTRAINTES TECHNIQUES NON NÉGOCIABLES

1. **60 FPS stables** sur un laptop M1/Ryzen 5 de 2022 avec 22 joueurs + ballon + IA active.
2. **Fixed timestep** à 60 Hz pour la simulation, rendu interpolé.
3. **Logique de jeu déterministe et testable** sans canvas (la physique du ballon, les règles, l'IA doivent passer en tests Vitest sans navigateur).
4. **Aucune allocation par frame** dans les hot paths (boucle de simulation, IA des 22 joueurs).
5. **Séparation stricte** : `core/` (logique pure, zéro dépendance Pixi), `render/` (Pixi only), `input/`, `audio/`, `ui/`.
6. **Sauvegarde de replay** : enregistrer les inputs de la partie pour rejouer un match à l'identique (preuve de déterminisme et feature pratique pour le debug).
7. **Build < 5 Mo** total assets compris pour la V1.

## ARCHITECTURE ATTENDUE

```
src/
├── core/                    # Logique pure, testable sans navigateur
│   ├── ecs/                 # Entités, composants, systèmes
│   ├── physics/             # Ballon, joueurs, collisions
│   ├── ai/                  # FSM, prise de décision, formations
│   ├── rules/               # Règles foot (touches, corners, buts)
│   ├── match/               # Boucle de match, chrono, score
│   ├── replay/              # Enregistrement/relecture inputs
│   └── math/                # Vec2, PRNG seedé, utilitaires
├── render/                  # Pixi only
│   ├── pitch.ts
│   ├── players.ts
│   ├── ball.ts
│   ├── hud.ts
│   └── camera.ts
├── input/                   # Clavier + Gamepad → actions abstraites
├── audio/
├── ui/                      # Menus HTML/CSS
├── assets/
└── main.ts                  # Bootstrap
tests/
├── physics.test.ts
├── rules.test.ts
├── ai.test.ts
└── replay.test.ts
```

## LIVRABLES ATTENDUS

### Phase 1 — Cadrage (avant tout code)
1. **ADR-001** : choix du moteur (Pixi confirmé ou alternative justifiée).
2. **ADR-002** : choix architecture ECS (bitECS vs maison).
3. **ADR-003** : modèle physique du ballon et des joueurs (équations, paramètres).
4. **Liste de questions ouvertes** que tu poses avant de coder (max 10).
5. **Plan de découpage en jalons** (ex : J1 terrain + ballon physique, J2 contrôle d'un joueur, J3 IA basique, J4 règles, J5 polish).

### Phase 2 — Implémentation incrémentale
À chaque jalon, tu livres :
- Code commité de manière atomique avec messages clairs (Conventional Commits).
- Tests qui passent.
- Une démo jouable de l'incrément.
- Un court CHANGELOG.

### Phase 3 — V1 finale
- Match jouable de bout en bout.
- README avec instructions d'install, contrôles, architecture.
- Build de production déployable (Netlify/itch.io).
- Liste des dettes techniques V1 → V2 (hors-jeu, fautes, multijoueur, etc.).

## PRINCIPES DE GAME FEEL (NON NÉGOCIABLES POUR LA QUALITÉ PERÇUE)

1. **Réactivité des contrôles** : input → mouvement visible en moins de 50 ms.
2. **Inertie des joueurs** : accélération/décélération physiques, pas de stop instantané, mais pas trop molles non plus (ajuste à la main jusqu'à ce que ça « sente » bien).
3. **Feedback visuel sur le tir** : jauge claire, flash sur la frappe, légère secousse caméra sur les frappes puissantes.
4. **Feedback audio synchrone** au contact ballon (latence < 30 ms).
5. **Caméra** : suit le ballon avec lissage et look-ahead (anticipe la direction du jeu), pas de scroll saccadé.
6. **Indication du joueur contrôlé** toujours lisible.

## CE QUE TU NE FAIS PAS EN V1

- Mode multijoueur (ni local, ni en ligne).
- Compétitions, ligues, saisons.
- Hors-jeu, fautes, cartons, remplacements, blessures.
- Éditeur d'équipes, transferts.
- Commentaire audio.
- Vrais noms de clubs/joueurs (licences) — équipes et joueurs fictifs.
- Mode entraînement, tirs au but isolés.
- Statistiques avancées au-delà du minimum HUD.
- Localisation multilingue (FR uniquement en V1).

Note ces points comme dette assumée dans le README, avec une priorisation V2 indicative.

## MÉTHODE DE TRAVAIL ATTENDUE

1. **Commence par poser tes questions de cadrage** (vue top-down stricte ou 2.5D ? style graphique : pixel art, vectoriel, semi-réaliste ? est-ce que je peux générer/utiliser des assets libres ou tu en fournis ?). Maximum 10 questions, regroupées.
2. **Propose ton plan de jalons** avant de coder.
3. **Code par tranches verticales jouables** : préfère un MVP moche mais complet (terrain + 1 joueur + ballon qui bouge) à un terrain magnifique sans gameplay.
4. **Profile dès qu'il y a 22 entités à l'écran**, n'attends pas la fin.
5. **Teste la physique et les règles** dès qu'elles sont écrites, pas après.
6. **Joue ton propre jeu** régulièrement et ajuste le game feel — c'est un jeu, pas un système.

## CRITÈRES D'ACCEPTATION V1

Le jeu est livrable quand :
- [ ] Un match complet peut être joué du coup d'envoi à la fin sans crash ni bug bloquant.
- [ ] 60 FPS tenus en match avec 22 joueurs actifs sur la machine de référence.
- [ ] Les buts, touches et corners se déclenchent correctement à 100 %.
- [ ] L'IA adverse propose un défi équilibré (testé sur au moins 10 matchs).
- [ ] Les contrôles clavier ET manette fonctionnent.
- [ ] Le replay d'un match enregistré reproduit exactement le même résultat.
- [ ] Tous les tests Vitest passent.
- [ ] Le README permet à un développeur tiers de cloner, installer et lancer en moins de 5 minutes.
- [ ] Le build de production fait moins de 5 Mo.
- [ ] Aucun warning TypeScript en mode strict.

## DÉMARRAGE

Lis attentivement ce prompt et `.clinerules`. Si tout est clair, commence par la **Phase 1 (Cadrage)** : pose tes questions de cadrage groupées, puis livre les ADR et le plan de jalons. Ne touche pas une ligne de code de gameplay avant d'avoir mon feu vert sur le plan.

Si quelque chose dans ce prompt te semble incohérent, sous-spécifié ou contre-productif pour la qualité du jeu, dis-le maintenant et propose une alternative argumentée. Mieux vaut recadrer avant de coder qu'après.
