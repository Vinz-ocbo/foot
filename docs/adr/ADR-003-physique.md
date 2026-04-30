# ADR-003 — Modèle physique

Date : 2026-04-30
Statut : Accepté

## Contexte

Physique custom légère pour foot top-down. Pas de moteur lourd type Matter.js (overkill pour cercles + AABB + friction). Doit être déterministe et testable hors canvas.

## Ballon

État : `pos: Vec2 (m)`, `vel: Vec2 (m/s)`, `z: number (m)`, `vz: number (m/s)`, `spin: number (rad/s)`.

- **Roulement au sol** (`z = 0`) : `a = -μ_roll · g · v̂` avec `μ_roll = 0.4`. Stop net si `|v| < 0.05 m/s`.
- **Vol** (`z > 0`) : `vz' = vz - g · dt` avec `g = 9.81`. `z' = z + vz · dt`.
- **Rebond** : à `z ≤ 0` et `vz < 0` → `z = 0`, `vz = -e · vz` avec `e = 0.45` (cuir/herbe). Amortissement horizontal `v *= 0.7`.
- **Magnus simplifié** (optionnel V1) : `a_lateral = k_magnus · vel × spin · ẑ` avec `k_magnus = 0.05`. Activé seulement sur tirs avec courbe demandée. Skip-able si la complexité dérape.
- **Sortie de terrain** : pas de rebond sur les bords. Le système `rules` détecte la sortie et déclenche touche / corner / but.

## Joueur

État : `pos`, `vel`, `facing`, `stamina`, `role: 'GK'|'DEF'|'MID'|'FWD'`, `team: 0|1`, `fsmState`.

- **Cinématique** : `target_vel = input_dir · v_max`. `v_max = 7 m/s` (course) ou `9 m/s` (sprint). Accélération `18 m/s²`, décélération `22 m/s²`.
- **Collisions joueur-joueur** : cercles `r = 0.4 m`. Séparation positionnelle 50/50 + impulsion symétrique légère.
- **Possession** : `|ball.pos - player.pos| < 0.6 m` ET `|ball.vel - player.vel| < 3 m/s` ET ballon dans cône frontal 90° → soft-attach. Ballon glisse à 0.5 m devant facing, lerp = 0.4. Relâche sur tir, passe, tacle réussi adverse, ou perte de contrôle.
- **Tacle** : impulsion frontale 0.3 s, hitbox capsule (1.5 m × 0.5 m). Si overlap avec porteur adverse : transfert possession + impulsion résiduelle communiquée au ballon. Probabilités déterministes : 90 % dans le dos, 60 % de côté, 35 % de face. Tirage avec PRNG seedé.
- **Tir** : `v_ball = facing · power`, `power ∈ [8, 30] m/s` selon durée de charge (0–1.5 s, courbe quasi-linéaire). `vz = power · sin(elev)` avec `elev` proportionnel à la durée d'appui au-delà de 60 % (frappes molles restent au sol).
- **Passe** : direction ajustée vers coéquipier le mieux aligné dans cône 45° du facing. Vitesse `v = clamp(dist · 1.4, 8, 22)`.

## Stamina

-1.0/s en sprint, +0.4/s à l'arrêt, +0.2/s en course normale. Range 0–100. Sprint impossible si <10. Pas de fatigue d'équipe globale en V1.

## Switch joueur (humain)

- Switch automatique vers le joueur le plus proche du ballon parmi l'équipe humaine.
- **Cooldown 0.4 s** entre deux switches automatiques.
- **Hystérésis 1 m** : le joueur courant garde le contrôle tant qu'un autre n'est pas au moins 1 m plus proche du ballon. Évite le ping-pong frame-à-frame.
- Bouton de switch manuel (Tab) ignore cooldown et hystérésis.

## Règle hors-jeu douce (V1, en attendant la vraie règle V2)

- Un attaquant ne reste jamais devant le dernier défenseur adverse hors phase de course active vers le ballon. Implémentée comme contrainte dans la FSM IA. L'humain n'est pas pénalisé directement (pas de coup franc) mais ses coéquipiers IA respectent la règle.

## Déterminisme

- Fixed timestep 60 Hz. `dt = 1/60` exact.
- PRNG **mulberry32** seedé par le timestamp du coup d'envoi (stocké dans le replay).
- Aucun appel à `Math.random()` dans `core/`. ESLint à durcir en J5 pour interdire l'import.
- Inputs gamepad (V2) quantifiés à 32 valeurs avant écriture replay.
- Itération uniquement sur `Entity[]` ordonné, jamais sur `Map` / `Set`.

## Tests prévus

- Friction : `(vx=10, vy=0)` après 5 s → vitesse calculée vs intégration analytique `v(t) = max(0, v0 - μ·g·t)`.
- Vol : `(z=0, vz=10)` apex à `vz=0` à `t≈1.02 s`, `z_max ≈ 5.10 m`.
- Rebond : énergie après n rebonds = `e^(2n) · E_init` (vertical seul).
- Possession : seuil de capture vérifiable par cas limites (juste à 0.6 m, juste au-delà, vitesse relative juste à 3 m/s).
- Tir : direction = facing exact, magnitude = power de charge.
- Tacle : probabilité de réussite déterministe selon angle relatif et seed PRNG.
