# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### J0 — Setup repo + tooling

- Bootstrap Vite 6 + TypeScript strict + PixiJS v8 + Vitest 3 + ESLint 9 (flat config) + Prettier 3.
- Boucle fixed-timestep 60 Hz avec accumulateur (anti spiral-of-death à 250 ms).
- Terrain rendu vide aux dimensions FIFA proportionnelles (105 × 68 m), canvas 1280 × 720.
- FPS counter de debug en haut-gauche.
- Utilitaires `Vec2` mutables zéro-allocation.
- ADR-001 (PixiJS v8), ADR-002 (architecture systèmes maison), ADR-003 (modèle physique).
- CI GitHub Actions : lint + typecheck + test + build.
