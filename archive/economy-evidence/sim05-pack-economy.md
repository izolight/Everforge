# SIM05: Pack-aware economy samples

## Scope and reproduction

Measured on the working tree based at revision `204356785129b196c5cc78e17e2e1449f3c10339`, with the SIM05 dispatch correction applied locally. That revision enabled seeded multi-foe map encounters with `--packs`, but the expedition economy loop still called `POL["smart"]` for all fights. The matrix and attrition paths already used `pack-smart` for multi-foe fights. SIM05 routes only expedition fights through the same policy selection: with packs enabled and a smart policy, multi-foe fights use `pack-smart`; single foes (including lair bosses) keep regular smart. The no-packs default and non-smart policies retain their existing dispatch.

The real-fight regression is:

```sh
NODE_PATH=/workspace/Everforge/node_modules node tools/sim-pack-economy-check.js
```

It calls the exported simulator `setup`, instruments the simulator's expedition fight-turn seam, and runs real multi-foe fights in both `SIM.fresh` and `SIM.exped`. It also starts a real single-foe lair boss fight in each mode and checks that regular smart is selected, and verifies the no-packs default never selects pack-smart. Result: fresh had 74 pack-smart turns and 20 regular single-foe turns (boss policy `smart`); economy had 78 and 6 (boss policy `smart`); no-packs had 0 pack-smart, 0 multi-foe regular-smart, and 99 regular single-foe turns (boss policy `smart`).

Pack-aware economy samples use:

```sh
NODE_PATH=/workspace/Everforge/node_modules node tools/sim.js \
  --econ-only --packs --zone woods,pass,hollow,spire --kit melee \
  --policy smart --heat 0 --seed SEED --exped 30 \
  --visit-limit LIMIT --jobs 1 --out /tmp/sim05-sSEED-vLIMIT.json
```

Seeds were `1`, `7`, and `11`; limits were 8 and 12. Each of the six runs covers 30 expeditions in each zone, for 720 total. Kits are the simulator's stage-matched melee kits, codex mastery is enabled for the zone and earlier zones, and all current biome modifiers remain on. Each file records `packs: true`. The SIM04 reference used the same seed, kit, policy, Heat, zone, sample count and limits, but omitted `--packs`; it is the explicit single-foe reference. Both tests use smart policy. In pack-enabled expeditions the fix applies `pack-smart` target selection only to multi-foe encounters. No balance values were tuned.

## Results

Means are averaged equally across the three seeds, with 30 expeditions per seed. Percentages use 90 expeditions per zone and threshold. `By foe` is the simulator's `cont` counter: fights where `B.by === "it"`, i.e. initiated by a roaming foe. Direct essences and embers are realized during the run. Salvage essence and ember values are estimated from new non-equipped loot; the bot does not actually salvage. Fights, by-foe encounters, and steps are per expedition.

| POI limit | Zone | Clear / defeat | Direct ess | Salv. ess | Embers | Salv. embers | Fights | By foe | Steps |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | Woods | 100% / 0% | 0.64 | 12.63 | 29.37 | 15.53 | 10.07 | 2.29 | 36.80 |
| 8 | Pass | 100% / 0% | 1.05 | 13.40 | 28.32 | 14.64 | 9.06 | 1.80 | 38.36 |
| 8 | Hollow | 90% / 10% | 1.72 | 17.70 | 25.99 | 14.18 | 8.76 | 1.98 | 38.06 |
| 8 | Spire | 87% / 13% | 2.29 | 17.34 | 26.63 | 16.72 | 9.02 | 2.02 | 37.27 |
| 12 | Woods | 100% / 0% | 0.83 | 14.93 | 33.58 | 18.76 | 12.49 | 2.83 | 50.76 |
| 12 | Pass | 100% / 0% | 1.19 | 16.15 | 31.70 | 17.49 | 11.18 | 2.13 | 51.38 |
| 12 | Hollow | 83% / 17% | 1.95 | 20.94 | 28.02 | 16.93 | 10.50 | 2.43 | 48.18 |
| 12 | Spire | 88% / 12% | 2.70 | 20.31 | 30.38 | 20.09 | 11.22 | 2.60 | 48.09 |

Exact defeats per seed (seed order 1, 7, 11):

| Zone | Limit 8 | Limit 12 |
|---|---:|---:|
| Woods | 0, 0, 0 | 0, 0, 0 |
| Pass | 0, 0, 0 | 0, 0, 0 |
| Hollow | 6, 0, 3 | 6, 3, 6 |
| Spire | 3, 3, 6 | 4, 2, 5 |

## Comparison with SIM04 single-foe reference

- Woods and Pass clear rates remain 100% in both modes and thresholds.
- At limit 8, Hollow defeats are 9/90 with packs versus 7/90 in SIM04; Spire defeats are 12/90 versus 0/90. At limit 12, Hollow has 15/90 versus 10/90; Spire has 11/90 versus 2/90. These are small deterministic samples; they show materially different pack-mode outcomes for the later zones, not a population-level estimate.
- Estimated Spire salvage essence averages 17.34 (limit 8) and 20.31 (limit 12) with packs, compared with 19.78 and 23.74 in SIM04. Shorter failed runs and the pack reward model change what is actually collected; these estimates are not a pure salvage-rate comparison.
- The POI threshold is again associated with roughly 10–14 more steps and 1.4–2.4 more fights in these pack-aware samples. More fights do not imply more direct rewards when expeditions end in defeat, and packs pay according to the shared encounter rules.
- Since the old `--packs` economy mode used the wrong policy, its pre-fix outputs are not suitable as pack-aware smart-policy results. SIM04 remains valid for the explicit single-foe reference.

## Artifacts and limits

Raw JSON is temporary at `/tmp/sim05-s{1,7,11}-v{8,12}.json`. The run is a seeded, exploratory simulator comparison with stage kits and codex mastery, not observed player behavior. It does not model salvage actions, and the loss percentages have limited precision at 90 runs per cell.
