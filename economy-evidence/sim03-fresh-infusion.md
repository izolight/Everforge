# SIM-03: Fresh equipped-weapon essence crafts

Implemented at `2972dfe` plus uncommitted SIM-03 changes. Fresh chores now resolve `S.eq.main` for each attempt, require a live equipped weapon, pass the exact weapon and essence through `actionOk` and `checkMix`, and invoke the real `forgeIt`. On success the game equips a replacement crafted ID; the next attempt resolves that new ID. A fizzle consumes the equipped input, so subsequent attempts stop when the main slot is empty. No tutorial item, action gate, or game rule changed.

The Fire-prepared sword has `ei:1` because it already contains Fire essence. Adding another essence therefore requires Infusing and Infusing III; Infusing III also requires Infusing II and Smith Lv 5. Fresh-mode bot research policies did not meet this full chain in the six-expedition samples, so no sampled post-expedition sword crafts succeeded. The attempt rows show the actual missing gates.

## Refreshed research policy samples

Runs use revision `2972dfe` plus SIM-03 changes, six fresh Woods expeditions, Heat 0, smart combat policy, visit threshold 8, stage/tutorial starter and seeds 1, 7 and 11. Each seed/policy run records two attempts per expedition when two distinct essence traits are present. The refreshed results match SIM-02 exactly for expedition outcomes, RP earned, purchase sequence and affordability; the only new per-row data is infusion attempt/gate detail.

| Seed | Policy | Expedition result | RP earned per expedition | Infusion attempts | Observed missing gates |
|---:|---|---|---|---:|---|
| 1 | cheapest | 6 wins | 19, 8, 2, 5, 5, 2 | 12 | 8 missing Infusing + Infusing III; 4 missing Infusing III |
| 1 | gear-first | 6 wins | 19, 8, 2, 5, 5, 2 | 12 | 12 missing Infusing + Infusing III |
| 7 | cheapest | 5 wins, 1 loss (E3) | 19, 9, 3, 4, 5, 4 | 12 | 6 missing Infusing + Infusing III; 6 missing Infusing III |
| 7 | gear-first | 5 wins, 1 loss (E3) | 19, 9, 3, 4, 5, 4 | 12 | 12 missing Infusing + Infusing III |
| 11 | cheapest | 6 wins | 16, 10, 5, 4, 2, 3 | 12 | 6 missing Infusing + Infusing III; 6 missing Infusing III |
| 11 | gear-first | 6 wins | 16, 10, 5, 4, 2, 3 | 12 | 12 missing Infusing + Infusing III |

The policy comparison still models bot choices, not actual player behavior. It only covers the Woods opening and does not measure second-region crafting timing.

## Focused verification

`NODE_PATH=/workspace/Everforge/node_modules node tools/sim-fresh-infusion-check.js` uses the production fresh infusion helper and real craft methods. It verifies: the real action gate blocks a crafted equipped sword without Infusing and Infusing III; with Bladecraft, Infusing, Infusing II and Infusing III learned at Smith Lv 5, two crafts succeed and each next attempt uses the replacement ID; a real fizzle removes the weapon and leaves the next essence untouched; an empty essence inventory does nothing; and an absent equipped weapon leaves essences untouched. The harness forces deterministic high/low craft rolls but calls the real `forgeIt` path.
