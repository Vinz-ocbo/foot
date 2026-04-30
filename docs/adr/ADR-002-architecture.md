# ADR-002 — Architecture : systèmes-orientée maison (pas bitECS)

Date : 2026-04-30
Statut : Accepté

## Contexte

22 entités joueurs + 1 ballon en simulation à 60 Hz. Besoin de logique testable hors canvas, déterministe, replay-able. Le prompt laisse le choix entre bitECS et une architecture maison.

## Décision

Architecture systèmes-orientée maison, sans bitECS ni autre lib ECS tierce.

## Raisons

- 22 entités × ~8 systèmes × 60 Hz = ~10 600 invocations/sec. Le gain SoA de bitECS est zéro mesurable à ce volume.
- Coût bitECS en lisibilité (composants = numeric IDs, pas de classes typées) bien réel pour une équipe d'un dev.
- Replay déterministe trivial : itération `for` ordonnée sur `Entity[]`, pas de `Map` / `Set` dans la simulation.
- Tests Vitest super simples : on importe une fonction-système, on lui passe les arrays de composants, on assert.
- TS strict reste plein : chaque composant est une interface typée, l'auto-complétion fonctionne.

## Forme retenue

```ts
type Entity = number; // index dans les Structure-of-Arrays
interface World {
  entities: Entity[];
  transforms: Float32Array; // 3 slots/entité : x, y, facing
  velocities: Float32Array; // 2 slots/entité : vx, vy
  players: PlayerComponent[]; // métadonnées non-hot (équipe, rôle, FSM)
  ball: BallState; // singleton
}
type System = (world: World, dt: number) => void;
```

SoA sur les composants chauds (transform, velocity), AoS pour les composants tièdes (PlayerComponent).

## Règles de simulation

- Ordre d'exécution des systèmes fixé en dur dans `core/match/loop.ts`.
- Aucun système ne crée d'entité dans son tick — seulement des « commandes » écrites dans une queue, appliquées entre deux ticks.
- Aucune allocation par frame dans les hot paths : pré-allocation de tous les tableaux et objets temporaires.
- Itération uniquement sur `Entity[]`, jamais sur `Map` / `Set` (ordre non garanti = non-déterminisme).
- Aucun `Math.random()` dans `core/`. PRNG mulberry32 seedé exclusivement.

## Alternatives écartées

- **bitECS** : perf inutile à 22 entités, dette en lisibilité et type-safety.
- **Miniplex / Becsy** : mêmes raisons, plus une dépendance externe.
- **Approche objet classique avec héritage** : rejeté par `.clinerules` (anti-pattern), et empêche le pré-allocation et la testabilité.

## Conséquences

- Si le projet dépasse plusieurs centaines d'entités (foule animée, particules massives), revisiter — mais c'est un problème V2+.
- Un dev qui rejoint le projet doit comprendre la convention SoA via Float32Array. Documenté ici et dans le code.
