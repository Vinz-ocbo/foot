# FOOT — V1

Jeu de football web, vue top-down, jouable au navigateur. V1 = match solo (humain vs IA).

Prompt produit dans `prompt-jeu-foot-v1.md`. Décisions techniques dans `docs/adr/`.

## Stack

- TypeScript strict (ES2022, `noUncheckedIndexedAccess`)
- PixiJS v8 (rendu) — cf. `docs/adr/ADR-001-pixijs.md`
- Vite 6 (build) + Vitest 3 (tests)
- Howler.js (audio)
- Architecture systèmes-orientée maison — cf. `docs/adr/ADR-002-architecture.md`
- Physique custom — cf. `docs/adr/ADR-003-physique.md`

## Pré-requis

Node 20.11+ (testé sous Node 24).

## Installation

```bash
npm install
```

## Commandes

| Commande             | Effet                                           |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Serveur dev avec HMR sur http://localhost:5173/ |
| `npm run build`      | Build de production dans `dist/`                |
| `npm run preview`    | Prévisualise le build prod localement           |
| `npm test`           | Vitest une fois                                 |
| `npm run test:watch` | Vitest en watch                                 |
| `npm run lint`       | ESLint sur tout le repo                         |
| `npm run format`     | Prettier (écriture)                             |
| `npm run typecheck`  | `tsc --noEmit`                                  |

## Structure

```
src/
├── core/        # Logique pure, zéro dépendance Pixi, testable hors navigateur
│   ├── ecs/     # (J3+) entités, composants, systèmes
│   ├── physics/ # (J1+) ballon, joueurs, collisions
│   ├── ai/      # (J4+) FSM, décisions, formations
│   ├── rules/   # (J3+) règles foot
│   ├── match/   # (J3+) boucle match, chrono, score
│   ├── replay/  # (J5) record/playback déterministe
│   ├── loop/    # boucle fixed-timestep
│   └── math/    # Vec2, PRNG seedé
├── render/      # Pixi only
├── input/       # (J2+) clavier abstrait, gamepad en V2
├── audio/       # (J5) Howler
├── ui/          # (J3+) menus HTML/CSS
└── main.ts      # Bootstrap
tests/           # Vitest
docs/adr/        # Architecture Decision Records
```

## Contrôles V1 (clavier)

| Touche                   | Effet                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| `↑` / `W` ou `↓` / `S`   | Avancer (alterner les deux flèches déclenche un demi-tour 180°)        |
| `←` / `A` et `→` / `D`   | Pivoter en continu (6 rad/s)                                           |
| `Shift`                  | Sprint (uniquement en avant, draine la stamina)                        |
| `Espace` (charge)        | Tir : 12–28 m/s, élévation au-delà de 30 % de charge, max 20°          |
| `E` (tap < 80 ms)        | Passe à plat (10 m/s, ras du sol)                                      |
| `E` (hold, charge)       | Lob (10–22 m/s, élévation 15°→45°)                                     |
| `←` / `→` pendant le vol | Donne du spin au ballon (Magnus). Sens verrouillé à la 1ère impulsion. |
| `R`                      | Reset position joueur + ballon                                         |

Pendant que le ballon est libre et en mouvement, la rotation du joueur est figée pour que `←/→` ne pilote que le spin sans dévier le facing.

## État du projet

V1 en cours. Progression dans `CHANGELOG.md`.

### Dette assumée pour V1 → V2

- Hors-jeu (V1 utilise une règle douce : un attaquant ne reste pas devant le dernier défenseur adverse hors phase de course)
- Fautes, cartons, remplacements, blessures
- Mode multijoueur (local et en ligne)
- Compétitions, ligues, saisons, transferts
- Commentaire audio
- Vrais noms / licences de clubs et joueurs (équipes fictives)
- Mode entraînement, tirs au but isolés
- Localisation multilingue (FR uniquement)
- Gamepad (couche `input/` prête pour l'ajout, structure `InputSource`)
