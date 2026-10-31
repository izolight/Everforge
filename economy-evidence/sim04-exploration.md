# SIM04: Larger economy samples at POI limits 8 and 12

## Reproduction

Measured against game revision `7c76df0b86f85be46b4f227739af3e7c1f8d74b6`. The economy path is unchanged from `2972dfe4b09d6863a55e3845615a1e61e15f038d`; the intervening SIM03 revision changed only fresh-mode chores, not this economy measurement. The simulator source was not changed for these runs.

For each seed `1`, `7`, and `11`, run:

```sh
NODE_PATH=/workspace/Everforge/node_modules node tools/sim.js \
  --econ-only --zone woods,pass,hollow,spire --kit melee \
  --policy smart --heat 0 --seed SEED --exped 30 \
  --visit-limit LIMIT --out /tmp/sim04-sSEED-vLIMIT.json
```

`LIMIT` was 8 or 12. Each run covers 30 expeditions in each of four zones, giving 90 expeditions per zone and limit, 720 total. These are deterministic seeded samples. The game used its current biome modifiers, the stage-matched melee kit, and codex mastery for that zone and earlier zones. Research and unlock sequencing are bypassed by the simulator's standard economy setup.

The runs use the explicit existing single-foe map reference: `--packs` was not supplied (`packs: false` in each JSON). Map fights therefore do not model the current multi-foe packs. Results should not be read as current pack encounter income or difficulty.

## Results

Means are first averaged within each seed's 30 expeditions, then averaged equally over the three seeds. Clear and defeat percentages are over all 90 expeditions at that zone and limit. `by foe` is the simulator's `cont` counter: fights where `B.by === "it"`. `ess` is direct essence income. `salv. ess` and `salv. embers` are estimated value from non-equipped loot if salvaged; the simulator does not actually salvage during an expedition. Fights, loot, ambushes, and steps are per expedition.

| POI limit | Zone | Clear / defeat | Direct ess | Salv. ess | Embers | Salv. embers | Fights | By foe | Steps |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | Woods | 100% / 0% | 0.62 | 13.12 | 29.92 | 16.46 | 10.39 | 2.41 | 38.53 |
| 8 | Pass | 100% / 0% | 1.00 | 13.80 | 28.22 | 14.62 | 9.21 | 1.70 | 39.51 |
| 8 | Hollow | 92% / 8% | 1.62 | 17.13 | 26.96 | 14.29 | 8.81 | 1.99 | 38.19 |
| 8 | Spire | 100% / 0% | 2.21 | 19.78 | 28.53 | 17.91 | 9.22 | 1.94 | 37.07 |
| 12 | Woods | 100% / 0% | 0.74 | 15.43 | 33.26 | 19.50 | 12.51 | 2.93 | 49.71 |
| 12 | Pass | 100% / 0% | 1.18 | 17.10 | 31.61 | 17.80 | 11.18 | 2.10 | 49.96 |
| 12 | Hollow | 89% / 11% | 1.84 | 21.41 | 29.92 | 17.12 | 10.90 | 2.44 | 48.66 |
| 12 | Spire | 98% / 2% | 2.49 | 23.74 | 31.34 | 21.46 | 11.00 | 2.43 | 47.10 |

## Readout

- Raising the POI threshold from 8 to 12 is associated with about 10–11 more steps and 1.8–2.2 more fights per expedition in each zone in these samples. Mean direct embers rise by about 2.8–3.4, alongside estimated salvage value in both essences and embers.
- Hollow had the highest observed defeat rates: 7/90 expeditions (8%) at limit 8 and 10/90 (11%) at limit 12. Per-seed defeats were 3, 1, and 3 at limit 8, then 4, 2, and 4 at limit 12. Spire had 2/90 defeats (2%) at limit 12 (per seed: 1, 0, 1); no other zone-limit sample had defeats. These finite samples do not establish that the higher threshold caused Hollow's increase. No balance tuning was made.
- Spire salvage value remains substantial: at threshold 8 the mean estimate is 19.78 essences and 17.91 embers per expedition; at threshold 12 it is 23.74 essences and 21.46 embers. It is an estimate on new non-equipped drops, not automatically realized income, and the sample omits multi-foe packs.
- A higher routing threshold was associated with higher mean fights, item drops, and steps in these samples. The comparison does not isolate route length from encounter rewards, and results may vary with other seeds.

## Artifacts

Raw simulator JSON was written to `/tmp/sim04-s{1,7,11}-v{8,12}.json`; it is temporary and not tracked. No combat or economy tuning was applied.
