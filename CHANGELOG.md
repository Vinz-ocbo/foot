# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### J2 — Joueur humain (clavier)

- `PlayerState` (pos + vel + facing + stamina + team + hasBall) et `stepPlayer` semi-implicit Euler.
- Modèle de mouvement « tank » : `↑↓/WS` avancent dans la direction du facing avec toggle de demi-tour à l'alternance, `←→/AD` pivotent en continu (6 rad/s ≈ 344 °/s).
- Sprint Shift à 9 m/s, draine 1.0 stamina/s ; course 7 m/s récupère 0.2/s ; arrêt récupère 0.4/s. Refus du sprint sous 10.
- Couche `src/input/` : interface `InputSource` + `KeyboardSource` zéro-allocation. Edge events (shootReleased, passReleased, turnAroundPressed, etc.) consommés sur sample.
- Possession : capture si ballon dans cône 90° du facing, distance < 0.9 m (contact visuel), |ball.vel| < 12 m/s, z < 0.5 m. `applySoftAttach` glisse le ballon à 0.5 m devant le joueur (lerp 0.4) et reset le spin.
- Tir chargé `Espace` : 12–28 m/s sur 0.5 s de charge, élévation 0–20° à partir de 30 % de charge (range max ≈ 51 m, apex ≈ 4.7 m).
- Passe `E` : tap (< 80 ms) → passe à plat 10 m/s ; hold → lob chargé 10–22 m/s avec élévation 15°→45° sur 0.6 s.
- Effet Magnus : `input.rotate` alimente `ball.spin` quand le ballon est libre et en mouvement, plafonné ±8 rad/s, ramp-up 30 rad/s². **Sens du spin verrouillé à la première impulsion** (anti-yo-yo). **Rotation du joueur figée pendant le vol** pour ne pas dévier en essayant de courber. Demi-vie spin 1 s, k_magnus 0.05.
- Rendu joueur procédural (cercle teinté équipe, indicateur de facing blanc, anneau jaune contrôlé). Barre de charge bicolore (orange tir, bleue lob).
- Canvas responsive (16:9, lettrebox/pillarbox vert).
- 48 nouveaux tests Vitest sur `player`, `possession`, `actions`, et l'effet Magnus.

### J1 — Terrain & physique du ballon

- `BallState` (pos + vel + z + vz + spin) et `stepBall` semi-implicit Euler.
- Friction de roulement μ = 0.4, restitution e = 0.6 (calibrée à la main pour que les 2e/3e rebonds restent visibles), amortissement horizontal au rebond 0.7.
- Seuil de repos `BOUNCE_SETTLE_VZ_THRESHOLD_MS = 0.5 m/s` pour stopper la cascade de micro-rebonds (sans appliquer l'amortissement horizontal sur les pseudo-rebonds dûs à la gravité par-frame d'un ballon au repos).
- Rendu du ballon avec ombre au sol et lift visuel en altitude (effet parallaxe top-down).
- Debug : clic gauche = tir au sol vers le curseur, clic droit = lob.
- 10 nouveaux tests (friction linéaire, apex/durée de vol, ratio post-rebond, snap-to-zero, repos absolu).

### J0 — Setup repo + tooling

- Bootstrap Vite 6 + TypeScript strict + PixiJS v8 + Vitest 3 + ESLint 9 (flat config) + Prettier 3.
- Boucle fixed-timestep 60 Hz avec accumulateur (anti spiral-of-death à 250 ms).
- Terrain rendu vide aux dimensions FIFA proportionnelles (105 × 68 m), canvas 1280 × 720.
- FPS counter de debug en haut-gauche.
- Utilitaires `Vec2` mutables zéro-allocation.
- ADR-001 (PixiJS v8), ADR-002 (architecture systèmes maison), ADR-003 (modèle physique).
- CI GitHub Actions : lint + typecheck + test + build.
