# V-08 · Geyser Field baseline

## Pre-Geyser reference

Captured against the Garden candidate that became committed `b41c95b`, before adding Geyser. The active selector had eleven biomes. These four fingerprints were verified against the committed `b41c95b` tree blobs (not the later dirty working files): `js/monsters.js` `78c1c121b6be311b5dfefc351c2d4b902dc75cd3`, `js/lang/de.js` `b4e2765f96b4767bedb3c99573b0d2a421d58aad`, `js/lang/ko.js` `4b0772f05ef05cbda9725d2d56b7763dcdfeb906`, and `tools/sim.js` `df9e7c708587be90aaefbe3896aab1ce6d02fac7`. The current `js/monsters.js` working-tree hash differs because it contains the V-08 Geyser additions; the baseline itself matches `b41c95b` and did not need to be rerun.

Seeds 1 and 7 were run separately with `node tools/sim.js --wild --n 30 --heat 0 --policy smart --seed SEED --no-biome-mods --no-depth-mods --rift-wild --rift-depth 1,3 --jobs 4 --out rift-evidence/v08-reference-seedSEED.json`; stdout is saved to the matching `.txt`. This is the simulator's Rift stage-kit matrix, 30 fights per row, smart policy, Heat 0, depths 1 and 3, with biome and depth modifiers disabled. The logs identify the biome and generated master selected at each depth.

Native master mean win rates by depth were 95%/90% for seed 1 and 94%/89% for seed 7. Across both depths, the native Windcut master row won 99% and 98%, respectively. The separate ordinary Rift-wild rows won 100% at depth 1 and 99% at depth 3 in both samples, but had 90/94 `TOO_EASY` cells at depth 1 and 7/4 `TOO_EASY` plus 2 `TOO_HARD` cells at depth 3 (seed 1/7). These are the existing reference sample's broad difficulty limitations, not a Geyser result or an acceptance gate.

Raw outputs: [seed 1 JSON](v08-reference-seed1.json), [seed 1 log](v08-reference-seed1.txt), [seed 7 JSON](v08-reference-seed7.json), [seed 7 log](v08-reference-seed7.txt). Adding Geyser changes the selector denominator and may remap seed-to-biome selection; post-change comparisons must report that and must not claim exact same-seed roster parity.

## Integrated Geyser + Sporewood candidate

After V-09 Sporewood was added, paired reference samples were rerun on the frozen V-08/V-09 candidate based at `b41c95b`. The exact source/check working-tree blobs were: `js/monsters.js` `b0d838e3cae4bbcc90d6e3e34121effe42725985`, `js/lang/de.js` `a3fc6ebfed9cb7b6b59190e326744f6e5fd6255b`, `js/lang/ko.js` `6eb027be3bafe796d2d8949051baf0b7ad774e70`, `tools/sim.js` `df9e7c708587be90aaefbe3896aab1ce6d02fac7`, `tools/element-weight-check.js` `c37a779f93df8ece61fc6ee016b9c4c76686703e`, `tools/geyser-biome-check.js` `3d59499d27058d37bf7adc3c2330f81c2791dcc7`, and `tools/sporewood-biome-check.js` `68a2d1b9697cc4bc7030960113ba052729e6739b`.

Both seeds used `node tools/sim.js --wild --n 30 --heat 0 --policy smart --seed SEED --no-biome-mods --no-depth-mods --rift-wild --rift-depth 1,3 --jobs 4`, recording 30 fights per row at Heat 0 with smart policy and biome/depth modifiers disabled. All 13 active biome IDs appear in the output, including `geyser` and `sporewood` at depths 1 and 3. The selector now has thirteen entries, so these are coverage samples rather than exact same-seed comparisons with the eleven-biome baseline.

| Seed | Geyser master win rate | Sporewood master win rate | Geyser ordinary-wild row | Sporewood ordinary-wild row |
| --- | ---: | ---: | --- | --- |
| 1 | 100% | 98% | 98%; 16 `TOO_EASY` | 99%; 4 `TOO_EASY` |
| 7 | 100% | 98% | 98%; 1 `TOO_HARD`, 13 `TOO_EASY` | 99%; 4 `TOO_EASY` |

Other biomes also retain existing easy/hard flags, including several depth-3 hard cells; these results do not claim that the overall wild difficulty matrix is balanced. Raw integrated outputs: [seed 1 JSON](v08-v09-integrated-seed1.json), [seed 1 log](v08-v09-integrated-seed1.txt), [seed 7 JSON](v08-v09-integrated-seed7.json), [seed 7 log](v08-v09-integrated-seed7.txt).

The Geyser focused fixture selected generated seed `1426396178`, reproduced its 10-wild roster/master, tested the `fire:3, ice:3, stone:3, arcane:1` pool over 10,000 deterministic samples, verified three existing-kind specials and German/Korean names/tells, and captured 390×844 mobile map/battle views (`v08-geyser-*-mobile.png`). The combined test suite passed 34/34. V-13's element distribution check was generalized to compare measured frequencies against each biome's configured weights and the existing M-05 signature boost; this now covers Sporewood's 3:3:1:1 mix while keeping one-draw and daily determinism assertions.
