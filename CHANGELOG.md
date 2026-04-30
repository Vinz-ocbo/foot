# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

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
