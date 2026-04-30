# ADR-001 — Moteur de rendu : PixiJS v8

Date : 2026-04-30
Statut : Accepté

## Contexte

V1 du jeu de football web. Vue top-down, 22 joueurs + ballon + traînées + HUD, cible 60 FPS sur laptop M1 / Ryzen 5 de 2022. Budget bundle < 5 Mo total assets compris.

## Décision

PixiJS v8 (imposé par le prompt initial, confirmé après analyse).

## Raisons

- WebGL/WebGPU automatique, batching de sprites natif → ~50 draw calls maximum, négligeable sur la machine cible.
- API stable pour un usage 2D simple : `Sprite`, `Graphics`, `Container`, `Text`, `RenderTexture`.
- Bundle ~150 Ko gzippé, compatible avec le budget 5 Mo total.
- Écosystème suffisant : `@pixi/sound` ou Howler en parallèle, `pixi-particles` v8-ready.

## Caveats

- PixiJS v8 est sorti en 2024. Les tutoriels mainstream restent majoritairement v7. Référence officielle uniquement (`https://pixijs.com/8.x/`), pas de Stack Overflow d'avant 2024.
- API renames vs v7 : `Application.init()` async, `Assets` au lieu de `Loader`, Graphics chaining différent (`.rect(...).stroke({...}).fill({...})`).

## Alternatives écartées

- **Phaser 3** : overkill, apporte sa propre boucle, son input, sa physique, son ECS. Ferait doublon avec nos couches custom.
- **PixiJS v7** : end-of-life en faveur de v8.
- **Three.js / Babylon.js** : 3D inutile en vue top-down.
- **Canvas 2D natif** : pas de batching, ne tient pas 60 FPS à 22 entités + traînées + HUD sans optimisation manuelle coûteuse.

## Conséquences

- Toutes les dépendances tierces graphiques doivent être v8-compatibles.
- Génération procédurale des sprites joueur via `Graphics` → `RenderTexture` au boot. Aucun asset binaire pour les joueurs en V1.
