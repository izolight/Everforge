# V-05 · Tidewrack coast biome

## Scope and implementation

Added Tidewrack as the ninth selectable Rift biome using only the existing ice,
poison, shadow and swift elements; beast, undead, elemental and humanoid bodies;
and shell, frost, tail, vines, hood and crystals parts. The biome includes its
own coast palette, compatible region/name vocabulary and lore, a weighted
3:1 common/rare element profile, and three translated V-11-compatible specials
(`drain`, `multi`, `heavy`). The existing Rift special-selection draw remains
the only draw. No Water/Steam family or authored region was added. Existing
M-05 fen/ash/bone/deep identity data and M-06 Fen stage handling remain intact.

## Seeded simulation evidence

Baseline revision: `0b22c5a` plus the M-06 integration that was later committed
there. Before V-05, `RIFT_BIOMES` had eight entries. Baseline generator SHA-256
was `23d81d52ac5b27e998674373f16cb1e34fa7bfa029d47a4096b4f2c60b68ab19`, data
SHA-256 `8d13b5650a25670a05d0a7c4f4efe6f47d9d8882cb1ca587a140a99f5212cf76`, and
simulator SHA-256
`6181a9a2e1dc6a0bf4a8b8a00c44066dbaca6e34dacff3093eb4378d6fa20b9f`.

After V-05 and the concurrent M-07 authored-boss phase content were frozen, the
same simulator settings ran on HEAD `0b22c5a` with uncommitted M-07 data, once
with `--seed 1` and once with `--seed 7`; both used
`--wild --n 30 --heat 0 --policy smart --no-biome-mods --no-depth-mods --rift-wild --rift-depth 1 --jobs 4`.
This expands the native Rift set to nine biomes and 1,188 Rift cells per seed.
Each depth-1 cell uses the simulator's current kit set and 30 fights. Candidate
artifacts are `v05-candidate-seed1/7.json` and `.txt`; reference artifacts are
`v05-reference-seed1/7.json` and `.txt`.

| Seed | Rift-wild mean win rate | Tidewrack | Lowest biome sample |
| --- | ---: | ---: | --- |
| 1 | 98% | 100% | Ash 90% |
| 7 | 96% | 100% | Deep 88% |

The separate “master's wild creatures” summary reports 100% mean wins for all
nine biome rows in both seeds, with `TOO_EASY` flags (80 rows for seed 1, 83 for
seed 7). Tidewrack's Drowned Wraith defensive/Spire native row is a long fight:
59.6 turns (`SLOG`) for seed 1 and 59.4 turns (`SLOG`) for seed 7, despite 100%
wins. The wider matrix also reports existing SLOG/low-win rows. These are
recorded in the raw simulator outputs; V-05 does not retune combat bands.

The comparison is a coverage and smoke comparison, not exact same-seed parity:
adding a ninth entry changes the biome-selection denominator and therefore the
biome/roster identities associated with seeds. The candidate also includes
M-07's separately scoped authored-boss phase changes. Simulator-generated
economic totals are not claimed as equal.

Candidate source fingerprints at measurement time: `js/monsters.js`
`90669b45bcf6033ee8412fb50b0042ec062959bff2a80beaf045d34bc3a973cd`, `js/data.js`
`3eb3f6329742fbc03f436dbf616c25e967d887f2f32cbb822e25646723d0b29b`, and
`tools/sim.js`
`6181a9a2e1dc6a0bf4a8b8a00c44066dbaca6e34dacff3093eb4378d6fa20b9f`.

## Focused checks and visual review

`node tools/tidewrack-check.js` verifies single membership in `RIFT_BIOMES`, the
allowed elements/bodies/parts, deterministic seeded creatures and master,
compatible translated specials, names and attachments, and 390px mobile map and
battle rendering. The inspected screenshots are
`v05-tidewrack-map-mobile.png` and `v05-tidewrack-battle-mobile.png`. The map
uses the new marine palette and readable existing tile silhouettes; the battle
shows the generated Brine Hound with its shell/tail anatomy at mobile width.

The V-11 special check now derives pool and translation coverage from current
biome data. The V-15 passive and Rift-master regression checks were updated to
derive their coverage from the current biome count, preserving the seven named
passives while checking Forest and Tidewrack as neutral. The V-13 distribution
check samples every configured biome; Tidewrack's 20,000-draw sample was
7,514 ice, 7,504 poison, 2,499 shadow and 2,483 swift. Full-suite status is
recorded with the final V-05 completion entry.
