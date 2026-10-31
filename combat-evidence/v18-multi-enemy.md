# V-18 · Multi-enemy encounters

Implementation and comparison evidence for the V-18 candidate based on the
committed V-20 baseline `71421af`. Raw paired simulator results are
[single-foe seed 1](../rift-evidence/v18-single-seed1.json),
[packs seed 1](../rift-evidence/v18-packs-seed1.json),
[single-foe seed 7](../rift-evidence/v18-single-seed7.json), and
[packs seed 7](../rift-evidence/v18-packs-seed7.json).

## Encounter rules

- Normal and daily fight/elite map nodes resolve to deterministic packs of two
  or three distinct non-boss enemies. The existing POI remains the only map
  node and reward owner. Bosses and direct/tutorial battles remain single foes.
- Pack membership uses a node-derived private seed. It does not consume the map
  generation or daily pre-roll stream. Members retain independent role, faction,
  rarity/affixes, HP, phase, status and special state. Existing V-17 role and
  V-19 faction selection contracts remain in use.
- A player action advances one round. Living foes act once in pack slot order;
  defeated foes skip their turn. Target selection is free and is saved. Guard
  covers the pack round; Parry answers the queued actor; player round, status
  and cooldown ticks happen once after the full enemy phase.
- Warstaff Sweep hits every living member once at 0.55× its single-target
  power. Other actions stay single-target. A partial clear/flee stores each
  foe on the original map node. Species kills/Codex records resolve per foe;
  expedition wins, XP and rewards resolve once after the last member, using the
  leader profile and existing node pre-roll.
- Pack members after the leader use reduced combat stats to bound their added
  pressure. In regions and Rift depth 1, companion slots 1/2 use 0.35/0.25 HP
  and 0.20/0.12 attack. Rift depth 3 uses 0.48/0.38 HP and 0.24/0.16 attack.
  Rift depth 9 is capped at two members; its companion uses 0.20 HP and 0.05
  attack. These factors apply after the member's role, region/rarity and heat
  profile. The isolated pack resolver and node specification remain seeded and
  are stored with the map state.
- Saves keep version 18. New saves store canonical `battle.foes` and target;
  load normalization adapts old top-level single-foe battle fields to a
  one-member pack and routes malformed pack arrays through existing recovery.

## Paired combat sample

Commands used the same candidate and settings, with `--wild --n 30 --heat 0
--policy smart --no-biome-mods --no-depth-mods --no-econ --rift-depth 1,3,9`.
Single-foe rows omit `--packs`; pack rows add it. Each seed covers four
stage kits, 13 Rift biomes, depths 1/3/9, 52 Rift-master rows and 520 native
Rift-wild rows per depth. The pack flag makes the simulator use its pack-smart
targeting policy; raw rows include the `pack` marker.

| Sample | Depth | Rift wild win rate (single → final pack) | Final-pack flags |
|---|---:|---:|---|
| Seed 1 | 1 | 99.9% → 99.7% | 7 SLOG |
| Seed 1 | 3 | 98.2% → 94.1% | 50 SLOG, 12 TOO_HARD |
| Seed 1 | 9 | 59.7% → 52.6% | 64 SLOG, 238 TOO_HARD |
| Seed 7 | 1 | 99.9% → 99.7% | 5 SLOG |
| Seed 7 | 3 | 98.2% → 94.4% | 47 SLOG, 12 TOO_HARD |
| Seed 7 | 9 | 59.6% → 52.8% | 64 SLOG, 243 TOO_HARD |

Each cell contains 30 fights; flags count rows, not individual fights. The
corrected final pack runs use the saved post-review source and are linked here:
[seed 1](v18-final-packs-seed1.json) and
[seed 7](v18-final-packs-seed7.json). Across 520 native Rift-wild rows per
depth, depth 1 stayed near the single-foe reference; the pack deltas were
−4.1/−3.8 points at depth 3 and −7.1/−6.8 at depth 9. Deep Rift packs still
have substantial `TOO_HARD`/`SLOG` flags. Rift-master rows are unchanged by
pack mode: depth-1 win rates were 98.9%/98.3%, depth-3 95.4%/94.4%, and
depth-9 33.2%/34.4% for seeds 1/7. Authored regional rows averaged
99.2%/99.1% with packs versus 99.6%/99.7% single-foe over the 348 sampled
native rows. These two seeds establish sampled coverage, not general balance.

## Validation and visual review

`node tools/multi-enemy-model-check.js` verifies 500 deterministic pack
resolutions, private RNG isolation, unique 2–3 member composition, target
selection, stable action order, AoE targeting and save normalization.
`node tools/multi-enemy-check.js` exercises normal, daily and Rift entry,
map pack badges, targeting, save/reload and re-entry with member wounds, legacy
single-foe migration, generated regional and Rift saves, unknown-ID recovery
without progression loss, per-member frenzy/ward/split state, frozen-slot Parry
forecast/interception, selected-target retention, pack payout order and one-time
affix statistics. It also captures
[390 px combat](v18-pack-mobile.png) and [map](v18-pack-map-mobile.png) views.

`node tools/multi-enemy-model-check.js`, `node tools/multi-enemy-check.js`,
`node tools/monster-respawn-check.js`, and `node tools/motion-check.js` pass.
The browser regression includes lethal status-tick handoff between pack members,
legacy save migration and pack re-entry. `node tools/run-checks.js` passed
**42/42**, including `SMOKE OK`; i18n, syntax and `git diff --check` pass.

## Expedition economy sample

Final paired `--econ-only --exped 30 --policy smart --heat 0` samples used the
same seeds and modifier-free settings. With `--packs`, the expedition simulator uses
the real pack member builder and pack-smart policy on each regular encounter.
The single-foe reference omits `--packs`. Raw results:
[seed 1 single](../rift-evidence/v18-econ-single-seed1.json),
[seed 1 packs](../rift-evidence/v18-econ-packs-seed1.json),
[seed 7 single](../rift-evidence/v18-econ-single-seed7.json), and
[seed 7 packs](../rift-evidence/v18-econ-packs-seed7.json).

| Seed | Zone | Single clear / loss | Pack clear / loss |
|---|---|---:|---:|
| 1 | Woods | 100% / 0% | 100% / 0% |
| 1 | Pass | 100% / 0% | 100% / 0% |
| 1 | Hollow | 90% / 10% | 80% / 20% |
| 1 | Spire | 100% / 0% | 90% / 10% |
| 7 | Woods | 100% / 0% | 100% / 0% |
| 7 | Pass | 100% / 0% | 100% / 0% |
| 7 | Hollow | 97% / 3% | 87% / 13% |
| 7 | Spire | 100% / 0% | 83% / 17% |

These runs show more attrition in Hollow and Spire with packs. Yields also vary
with clears and combat RNG. For Spire, item counts were 12.5→10.0 and
10.7→9.1, while salvage-essence averages were 21.5→18.0 and 17.9→19.0 for
seeds 1 and 7. No reward source, quantity, or price changed. The paired sample
shows higher Hollow/Spire loss rates and does not establish exact economy parity.
