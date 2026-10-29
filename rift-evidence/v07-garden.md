# V-07 · Radiant Garden

## Implementation

Added Radiant Garden as the eleventh selectable Rift biome on top of the V-06 Windcut candidate. It reuses holy, wood, poison and swift; beast, humanoid, elemental and undead bodies; and antlers, vines, halo, wings, crown and mane parts. The common elements are weighted 3:3 and poison/swift 1:1. Garden uses the existing renderer, family and attachability rules, and keeps the ten-wild-plus-master roster size.

The biome has a magenta and leaf-green palette, translated regions and lore, and three translated specials (`Briarwheel`, `Crownfall`, `Sunward Mend`) using existing `multi`, `heavy` and `heal` combat kinds. The special-selection and element-selection RNG draw counts are unchanged. Appending Garden to the biome selector changes seed-to-biome mapping; this evidence does not claim same-seed roster parity.

## Focused evidence

`node tools/garden-biome-check.js` passes. It selects Garden from the reproducible ordinal-5 Rift seed (`3675161189`), rebuilds the same roster twice, and checks biome membership, the exact element/body/part pools and weights, translated region/special strings, ten unique regular names, valid body-part attachments, and ten wilds plus a master. The 390×844 mobile map and battle render without horizontal overflow. Screenshots: [map](v07-garden-map-mobile.png) and [battle](v07-garden-battle-mobile.png).

`node tools/biome-check.js`, `node tools/i18n-check.js`, `node tools/color-check.js`, and the Garden focused check pass; the color check reports 220 biome accent pairs and 701 creature accents with no problems. The integrated `node tools/run-checks.js` suite passed **32/32**, including smoke.

## Simulation and limits

Integrated paired simulations used seeds 1 and 7, smart policy, Heat 0, n=30 per stage-kit row, depths 1 and 3, with biome and depth modifiers disabled. Both runs explicitly include Windcut and Garden at both depths. Garden's sampled Rift-master rows won 99% in each seed. Across the full Rift wild matrix, wins were 100% at depth 1 and 99% at depth 3 for both seeds. Seed 1 recorded 90 `TOO_EASY` cells at depth 1, then 7 `TOO_EASY` and 2 `TOO_HARD` cells at depth 3; seed 7 recorded 94 `TOO_EASY` cells at depth 1, then 4 `TOO_EASY` and 2 `TOO_HARD` cells at depth 3.

These samples establish deterministic biome coverage and report measured combat outcomes; they do not establish a balanced difficulty curve or economy parity. The expanded 11-biome selector remaps seeds, so the samples are not exact per-roster comparisons with the nine-biome baseline. Raw integrated outputs are [seed 1](v06-integrated-seed1.json) and [seed 7](v06-integrated-seed7.json), with readable summaries beside each file.
