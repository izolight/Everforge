# V-09 · Sporewood

## Implementation

Added Sporewood as a Rift-only biome. It uses the existing poison, wood, shadow,
and holy elements; undead, beast, elemental, and humanoid bodies; and the requested
vines, hood, mane, tail, horns, and crystals part pool. Poison and wood are common
weights (3 each); shadow and holy are rare weights (1 each). Selection stays in the
existing single-roll weighted element picker.

The biome adds the regions “The Sporewood,” “The Hollow Bloom,” and “The Weeping
Canopy,” a moss-and-spore palette, and three translated existing-kind specials:
Sporeburst, Thornroot Crush, and Mycelial Mend. It adds no element, family, roster
slot, or combat rule. Adding it to the seeded biome selector changes which biome
some existing seeds select; the paired reports are coverage on the expanded
selector, not an exact same-seed comparison against the old selector.

## Checks and visual evidence

- `tools/sporewood-biome-check.js`: deterministic seeded roster (10 regulars and
  one master), requested element/body/part/region pools, valid part attachments,
  unique regular names, translated special names/tells, and a 390px mobile map
  and battle without horizontal overflow.
- `tools/element-weight-check.js`: one-draw picker, fallback, daily pre-roll
  determinism, and distribution checks; Sporewood’s 3:3:1:1 ratio is included.
- `tools/color-check.js`: 45 element pairs, 312 biome accent pairs, and 701
  creature accents; zero problems.
- `tools/name-check.js`: 234 seeded biome/body samples; zero problems.
- `tools/part-check.js`: 650 renders; zero problems, with 29 documented
  body/part skips.
- `tools/biome-check.js`, `tools/biome-special-check.js`,
  `tools/rift-identity-check.js`, `tools/map-check.js`, and i18n checks pass.

Mobile captures: [map](v09-sporewood-map-mobile.png) and
[battle](v09-sporewood-battle-mobile.png).

## Seeded simulation coverage

The integrated V-08/V-09 candidate was sampled at Rift depths 1 and 3 with seeds
1 and 7, smart policy, Heat 0, and 30 fights per simulator cell. Both reports
include all 13 current biome IDs, including Geyser and Sporewood at both depths.
The Sporewood master won 98% in both seeds; Sporewood wild rows won 99% in both
seeds and recorded four `TOO_EASY` flags per seed. Geyser master won 100% in both
seeds; its wild rows won 98% (seed 1: 16 `TOO_EASY`) and 98% (seed 7: one
`TOO_HARD`, 13 `TOO_EASY`). These are small coverage samples, not a balance
acceptance claim. Other biomes retain additional `TOO_EASY`, `TOO_HARD`, and
`SLOG` flags.

Raw integrated reports: [seed 1 JSON](v08-v09-integrated-seed1.json),
[seed 1 text](v08-v09-integrated-seed1.txt), [seed 7 JSON](v08-v09-integrated-seed7.json),
and [seed 7 text](v08-v09-integrated-seed7.txt).

The final integrated suite passed 34/34 checks, including the Sporewood and
Geyser focused checks, element weights, i18n, color, names, parts, maps, V-11
specials, and Rift checks. The simulator files are coverage evidence, not proof
of balance parity: adding both biomes remaps some seeded biome selections.
