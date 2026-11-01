# SIM-01: Expedition POI visit limit sample

Measurements use baseline revision `8b4b454` plus the uncommitted SIM-01 simulator changes. Each cell is 3 expeditions per zone (n=3), Heat 0, `smart` policy, stage-matched `melee` kit, codex mastered for the zone. All expeditions cleared in these samples. Cap 8 is the default; cap 12 is the fuller-exploration comparison. Figures are means per expedition: fights / direct essences / fight embers.

| Seed | Zone | Cap 8 | Cap 12 |
|---:|---|---:|---:|
| 1 | Woods | 9.3 / 0.78 / 29.0 | 12.0 / 0.81 / 32.0 |
| 1 | Pass | 10.3 / 2.56 / 32.3 | 12.3 / 3.22 / 35.3 |
| 1 | Hollow | 10.0 / 2.22 / 29.3 | 13.7 / 2.44 / 35.7 |
| 1 | Spire | 7.3 / 1.78 / 25.7 | 10.3 / 1.89 / 30.0 |
| 7 | Woods | 12.0 / 0.37 / 32.7 | 14.3 / 0.41 / 35.7 |
| 7 | Pass | 9.3 / 1.11 / 26.7 | 12.0 / 1.78 / 30.7 |
| 7 | Hollow | 8.7 / 0.56 / 29.0 | 11.7 / 0.67 / 35.7 |
| 7 | Spire | 9.7 / 1.33 / 27.3 | 10.0 / 1.67 / 30.7 |
| 11 | Woods | 10.0 / 0.33 / 28.3 | 11.3 / 0.37 / 30.0 |
| 11 | Pass | 9.3 / 0.93 / 25.0 | 11.3 / 0.93 / 28.0 |
| 11 | Hollow | 10.0 / 4.00 / 31.3 | 13.0 / 4.00 / 35.3 |
| 11 | Spire | 7.7 / 1.81 / 25.3 | 9.7 / 2.15 / 29.7 |

The higher cap increased fight counts and embers in every zone/seed cell, and increased or held direct essence income. The largest additional fight count was 3.7 per expedition (seed 1, Hollow); the highest direct essence change was +0.67 (seed 7, Pass). The threshold changes when routing targets the lair: incidental POIs encountered en route can push visits above the threshold, while low torch or no reachable targets can cause an earlier switch. Three samples per cell are a small exploratory measurement and do not support balance tuning.

Reproduce with `node tools/sim.js --econ-only --zone woods,pass,hollow,spire --heat 0 --policy smart --exped 3 --seed <1|7|11> --visit-limit <8|12> --out /tmp/sim01-<limit>-seed<seed>.json`. JSON `args.visitLimit` records the selected limit.
