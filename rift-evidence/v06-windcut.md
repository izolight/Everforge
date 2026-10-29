# V-06 · Windcut Crags

## Scope and implementation

Windcut adds one generated Rift biome using the card's existing stone, metal, swift and arcane elements; beast, humanoid, construct and elemental bodies; and armor, horns, chains, crystals, wings and tail parts. Its element selection is weighted 3:3:3:1 (stone/metal/swift/arcane). The biome has three translated specials using existing multi, heavy and drain combat kinds. It adds no element family, authored region, or roster slot.

## Baseline before generator changes

- Revision: `685fd58` (committed V-05 + M-07 state), nine Rift biomes.
- Command, run independently for seeds 1 and 7: `node tools/sim.js --wild --n 30 --heat 0 --policy smart --seed SEED --no-biome-mods --no-depth-mods --rift-wild --rift-depth 1 --jobs 4 --out rift-evidence/v06-reference-seedSEED.json` (stdout saved as the matching `.txt`).
- Kit/policy/Heat/depth: simulator's Rift stage-kit matrix; smart policy; Heat 0; depth 1; 30 fights per row; biome/depth modifiers disabled.
- Native Rift master depth-1 win rates were 98% (seed 1) and 96% (seed 7). The separate Rift wild-creature native rows won 100% and flagged `TOO_EASY` in 80/83 cells, respectively. This is a coverage reference, not a claim of balanced wild difficulty.
- Raw output: [seed 1 JSON](v06-reference-seed1.json), [seed 1 log](v06-reference-seed1.txt), [seed 7 JSON](v06-reference-seed7.json), [seed 7 log](v06-reference-seed7.txt).

Adding a biome changes the selector length and therefore the seed-to-biome mapping. These candidate runs are coverage and balance samples; they are not exact same-seed roster parity claims. The V-07 Radiant garden task is being integrated concurrently; final combined measurements will identify both new biomes and be recorded below after its generator/list freeze.

## Focused Windcut check

`node tools/windcut-check.js` passes on the integrated Windcut + Garden candidate. It checks exact pool membership and attachability, one selector entry, ten wild creatures plus one master, deterministic regeneration, unique regular names and biome-compatible master naming, translated special names/tells with existing combat kinds, and 3:3:3:1 weight counts from 10,000 deterministic uniform samples (3,000/3,000/3,000/1,000). The discovered fixture is seed `1478777168` (`hash("v06-windcut:" + i)` first matching seed). At 390×844, the map and battle fit without horizontal overflow. Screenshots: [map](v06-windcut-map-mobile.png) and [battle](v06-windcut-battle-mobile.png).

## Integrated validation

The combined Windcut + Radiant Garden candidate has 11 Rift biomes. Its source base is still `685fd58`; current uncommitted content fingerprints are `js/monsters.js` `78c1c121b6be311b5dfefc351c2d4b902dc75cd3`, `js/lang/de.js` `b4e2765f96b4767bedb3c99573b0d2a421d58aad`, `js/lang/ko.js` `4b0772f05ef05cbda9725d2d56b7763dcdfeb906`, `tools/windcut-check.js` `c5128370fa041a7fecb7782ddd3de8b47643d66b`, and `tools/sim.js` `df9e7c708587be90aaefbe3896aab1ce6d02fac7` (`git hash-object`).

Run independently for seeds 1 and 7: `node tools/sim.js --wild --n 30 --heat 0 --policy smart --seed SEED --no-biome-mods --no-depth-mods --rift-wild --rift-depth 1,3 --jobs 4 --out rift-evidence/v06-integrated-seedSEED.json` (stdout saved as `.txt`). The simulator's smart stage-kit matrix runs 30 fights per row at Heat 0 across every current Rift biome and depths 1 and 3; biome and depth modifiers are disabled for the reference comparison. Both new biome IDs appear at both depths in both outputs: Windcut seed `3641605951`, `The Chainwind Shelf`; Garden seed `3675161189`, `The Sunken Garden`.

Native master row means by depth were 95%/90% (seed 1) and 94%/89% (seed 7). Across depths 1 and 3, Windcut masters won 99%/98% and Garden masters 99%/99%, respectively. The separate ordinary Rift wild rows won 100% at depth 1 and 99% at depth 3 in both samples; they retain many `TOO_EASY` flags (90 and 94 cells at depth 1), plus 2 `TOO_HARD` cells at depth 3 in each seed. These are coverage and broad difficulty observations, not a wild-balance acceptance gate. Other biome master means vary materially (for example Ash 82%/80% and Bone 62% in these samples). The selector grew from nine to eleven biomes, changing seed-to-biome mapping, so the paired runs do not claim exact same-seed roster or balance parity. Raw results: [seed 1 JSON](v06-integrated-seed1.json), [seed 1 log](v06-integrated-seed1.txt), [seed 7 JSON](v06-integrated-seed7.json), [seed 7 log](v06-integrated-seed7.txt).

Focused checks on the integrated candidate passed: `windcut-check`, `garden-biome-check`, `biome-special-check`, `element-weight-check`, `name-check` (198 seeded biome/body name samples), `part-check` (602 renders, 26 documented inapplicable tail/body cases), `map-check`, `biome-check`, `rift-boss-check`, `affix-check`, and `i18n-check`. The color check initially caught Garden too close to Astral; after V-07 changed Garden's accents, it passed with 220 biome accent pairs and 701 creature accents, zero problems. `node tools/run-checks.js` then passed **32/32**, with `SMOKE OK`; `git diff --check` also passed. The aggregate simulation still shows many wild-row `TOO_EASY` flags and a small number of `TOO_HARD` flags at depth 3, recorded above as broad coverage observations rather than hidden or treated as a task acceptance gate.
