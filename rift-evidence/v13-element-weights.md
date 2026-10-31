# V-13 · Weight biome elements

## Design

`BIOMES[biome].elW` is an optional element-to-weight map. Configured common
elements use weight 3 and rare elements use weight 1; an unconfigured element
defaults to 1. A biome without `elW` therefore keeps the old uniform roll.
The selector makes one weighted draw and adds no RNG calls. The simulator uses
the generated `ENEMIES` roster, so its wild battles use the same weighted roster
as the game.

M-05's Fen/Ash/Bone/Deep Rift identity bias is represented in these same maps as
2:1 for the signature element versus its peers. It is no longer applied as a
second multiplier. Those four-biome Rift probabilities remain exactly 40% for
the signature element and 20% for each of three alternatives. For other
generated creatures, the drop table continues to use the uniform element that
the same single random value would have selected before V-13. This keeps regional
drop availability and seeded daily map loot stable while the creature's combat
element uses the weighted result. M-05 signature Rift drops continue to follow
their signature-weighted element.

## Reproducibility and element distribution

Baseline revision: `4133e11`; paired simulator seeds 1 and 7, n=30, row 3,
Heat 0, smart policy, modifier-free (`--no-biome-mods --no-depth-mods`), Rift
wilds at depth 1, four simulator workers. Each run completed 1,474 matrix,
1,160 authored-wild, and 1,056 Rift cells. Raw reference outputs are
`v13-reference-seed1/7.json/.txt`. An earlier n=10 seed-1 run is retained as
`v13-baseline-seed1.json/.txt`.

The before/after element probe uses 10,000 weighted-selection draws per biome,
LCG seed `0x51313`, reset per biome. Counts are stored in
`v13-baseline-probe.json`; the post-change 20,000-draw counts and one-draw,
uniform-fallback, and custom-weight checks are printed in
`v13-element-weight-check.txt`.

| Biome | Baseline signature rate, if applicable | V-13 intended mix |
|---|---:|---|
| Forest | — | Wood, poison, swift common (3 each); fire, metal rare (1 each) |
| Tundra | — | Ice, swift, stone common (3 each); arcane, metal rare (1 each) |
| Ember | — | Fire, poison, metal common (3 each); stone rare (1) |
| Astral | — | Arcane, holy, swift common (3 each); shadow rare (1) |
| Fen | Poison 39.0% | Poison 40%; wood, shadow, swift 20% each |
| Ash | Fire 39.0% | Fire 40%; metal, stone, poison 20% each |
| Bone | Shadow 39.0% | Shadow 40%; holy, stone, poison 20% each |
| Deep | Ice 40.0% | Ice 40%; arcane, shadow, poison 20% each |

The authored-biome weights are reflected in generated wild roster simulation
output; M-05's four signature rates stay unchanged. M-06's Fen region was
integrated concurrently. The paired runs below use the integrated generator
candidate after the M-06 owner froze the Fen generator hunk; they cover the 29
native rows in the four existing stage regions plus seeded Rift wilds.

## Paired simulator sample

Weighted candidate runs: seeds 1 and 7, n=30, row 3, Heat 0, smart policy,
modifier-free, Rift wilds at depth 1, four workers. Results are
`v13-weighted-seed1/7.json/.txt`. The reports cover the four stage regions and
the seeded Rift roster. Across 29 native region/kit rows, mean win rates were
99.75% for seed 1 and 99.79% for seed 7; mean turns / HP were 7.93 / 78.4% and
7.98 / 78.2%, respectively. Seed 1 includes a Spire staff/Spire row at 92.7%
wins. The candidate reported 9 flagged native rows for seed 1 (including 8
TOO_EASY and 1 TOO_HARD flags) and 8 for seed 7 (7 TOO_EASY); these remain
visible in the raw outputs and are balance context, not V-13 acceptance
failures.

The baseline and candidate means above are paired by seed and row. Candidate
versus reference deltas for seed 1 were −0.03 percentage points win rate,
−0.13 turns, and +0.26 percentage points remaining HP; seed 7 deltas were
−0.05 points, −0.11 turns, and +0.17 points. The candidate was measured on
base HEAD `4133e11` plus the integrated working tree; at measurement time the
`js/monsters.js` SHA-256 was
`23d81d52ac5b27e998674373f16cb1e34fa7bfa029d47a4096b4f2c60b68ab19` and the
check script SHA-256 was
`41b3cf0dbcbaba520bf7511c2d727790148c1d8242079d94700e3239746b19`. The
integrated candidate fingerprints were `js/data.js`
`8d13b5650a25670a05d0a7c4f4efe6f47d9d8882cb1ca587a140a99f5212cf76`,
`js/state.js` `5e03381acf96409f313f7a3f5e39e4c430e63e11aa64b06a7a44d65ad7c88984`,
German catalog `5c11ffd061808a75167f7e87682881fd6f8e1755ab28b8b2db25510ff433f6cd`,
Korean catalog `0eea3fa4a35038f648a64b04505805683065be5c9bb1261527cd224831e017fd`,
and `tools/sim.js`
`0a1c59fd28a057b6cca3a6256af0ef7c36718757701471f60a893b9b7a21e411`.

The modifier-free baseline's 29 native rows averaged 99.8% wins, 8.06 turns,
and 78.1% HP for seed 1 (7 TOO_EASY, 1 TOO_HARD row); seed 7 averaged 99.8%
wins, 8.09 turns, and 78.0% HP (7 TOO_EASY rows). These are row means; they do
not isolate the impact of a particular element or establish exact per-enemy
parity.

## Daily pre-roll and checks

`v13-daily-preroll-check.json` compares both `dailyPlan` and the generated daily
map for 2026-10-28, 2026-10-29, and 2026-11-01 against a detached 4133e11
worktree; all match exactly, including pre-rolled loot. Generation also succeeds with ambient
`Math.random` disabled, and repeating each authored roster reproduces its full
output.

Focused validation on the integrated candidate passed:
`node tools/element-weight-check.js`, `node tools/rift-identity-check.js`,
`node tools/biome-special-check.js`, `node tools/i18n-check.js`,
`node tools/fen-region-check.js`, `node tools/smoke.js`, and
`git diff --check`. The full `node tools/run-checks.js` run passed 27/28 before
the parent corrected `v14-special-check.js`; that check had rejected the valid
additional Fen guard assignments while checking the original special-kind
users. The parent reran the corrected V-14 check successfully. The whole suite
was not rerun after that test-only fix. M-06's authored-region additions also
mean the earlier daily-map snapshot is an isolated V-13 comparison, not a claim
that the final M-06+V-13 world map is unchanged from 4133e11. The integrated
element check independently repeats daily generation and verifies
determinism under the final candidate.
