# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Web football game, top-down 2D, played in a browser. **V1 scope** is a complete solo match (human vs AI) — full spec in `prompt-jeu-foot-v1.md`, which is the source of truth for scope, constraints, and acceptance criteria. Read it before making non-trivial decisions. `.clinerules` (in French) defines the senior-game-dev persona and engineering conventions that apply here.

## Stack (locked)

- **TypeScript strict** + `noUncheckedIndexedAccess` (see `tsconfig.json`)
- **PixiJS v8** for rendering — see `docs/adr/ADR-001-pixijs.md`
- **Vite 6** build, **Vitest 3** tests
- **Howler.js** for audio (added in J5)
- **Architecture**: home-grown systems-oriented, NOT bitECS — see `docs/adr/ADR-002-architecture.md`
- **Physics**: custom, no Matter.js — see `docs/adr/ADR-003-physique.md`

Don't swap any of these without an ADR and explicit user sign-off.

## Commands

| Command              | Effect                                            |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR on http://localhost:5173 |
| `npm run build`      | `tsc --noEmit` + Vite production build to `dist/` |
| `npm run preview`    | Serve the prod build locally                      |
| `npm test`           | Vitest single run                                 |
| `npm run test:watch` | Vitest watch mode                                 |
| `npm run lint`       | ESLint (flat config)                              |
| `npm run typecheck`  | `tsc --noEmit` only                               |
| `npm run format`     | Prettier write                                    |

Run a single test file: `npx vitest run tests/<file>.test.ts`. Run a single test: append `-t "<name>"`.

## Architecture rules (non-negotiable)

These come from `.clinerules` and the V1 prompt — violating them is a real bug, not a stylistic choice:

- **Strict layering**: `src/core/` is pure logic, **zero Pixi import**. `src/render/` is Pixi only. `src/input/`, `src/audio/`, `src/ui/` likewise siloed. The rule is checked by reading the imports — don't reach across.
- **Fixed timestep 60 Hz** for simulation (`FixedTimestep` in `src/core/loop/`), interpolated render. Never use `setInterval`/`setTimeout` for the loop. The accumulator pattern (Glenn Fiedler "Fix Your Timestep") is already wired in `src/main.ts` — extend it, don't replace.
- **Zero allocation in hot paths**: no closures, no `.map`/`.filter`, no object literals inside the simulation tick or per-entity inner loops. Pre-allocate everything; mutate in place. Vec2 utilities in `src/core/math/vec2.ts` follow the `(out, ...inputs)` convention — keep that pattern. `FixedTimestep.tick()` returns a shared `TickResult` for the same reason — read fields immediately, don't store the reference.
- **Determinism**: no `Math.random()` in `src/core/`. Use mulberry32 seeded by the kickoff timestamp (added in J4/J5). Iterate only over `Entity[]` arrays — never `Map`/`Set` (iteration order = non-determinism).
- **No `any` without a justifying comment.** Type everything.
- **Variable names in English; comments in French** when the user writes in French (he does).

## Soft rules locked early in cadrage (V1 quirks worth remembering)

- **Keyboard only in V1**, gamepad deferred to V2. Keep `src/input/` abstract (`InputSource` interface) so gamepad slots in without refactor.
- **Tank-style movement** (J2): `↑↓` produce thrust forward in the player's facing; alternating between them triggers a 180° flip + velocity reset. `←→` rotate the player at 6 rad/s. There is no backward thrust. Diagonal speed is naturally normalized (no extra logic needed).
- **Spin direction locks** (J2): once the user starts curving a free ball with `←/→`, the sign is locked until the ball is captured or stops. Opposite-sign input is ignored mid-flight. Player rotation is also suppressed while the ball is in flight so `←/→` only feeds the spin without drifting the facing.
- **Camera is a fixed "stadium" view** in V1 (full pitch visible at 1280×720). Canvas is CSS-responsive (16:9 letterbox, body filled green). No scroll, no zoom. Look-ahead camera is V2.
- **Soft offside rule**: AI attackers must not stay ahead of the last opposing defender outside an active run. Implemented as a constraint in the AI FSM, not a referee call. The human is not penalized.
- **Player switching** (J3): closest-to-ball with **0.4 s cooldown + 1 m hysteresis** to prevent ping-pong. Manual switch (Tab) bypasses both.
- **Replay determinism with quantized inputs**: when gamepad lands in V2, axes are quantized to 32 values (8 directions × 4 intensity levels) before the replay buffer. Don't store raw floats.

## Milestones

J0 (done) → J1 → J2 → J3 → J4 → J5. Each milestone ends with: atomic commit (Conventional Commits), green CI (`lint` + `typecheck` + `test` + `build`), playable demo, CHANGELOG entry. Don't start the next milestone before the previous one is green.

Acceptance criteria for V1 are listed in `prompt-jeu-foot-v1.md` (search "CRITÈRES D'ACCEPTATION V1") — verify each box before declaring V1 done.

## Persona reminders

From `.clinerules`: direct, technical, opinionated. Refuse anti-patterns (logic in root scene, coupling render to logic, trusting the client in MP, reinventing engines) and explain why. Flag deliberate technical debt with a repayment plan. "Le plus simple" → ship simple; "production-ready" → ship robust, tested, documented.

Ask before writing code when a structural choice has multiple defensible answers; otherwise, decide and document via ADR.
