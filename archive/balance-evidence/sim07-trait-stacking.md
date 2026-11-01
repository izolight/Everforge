# SIM07: Spire trait-stacking refresh

**Status: Done (measurement only; no balance tuning).**

## Scope and acceptance

Refresh the on-stage Spire baseline for `stacked/spire` against `melee/spire`, `defensive/spire`, and `staff/spire`. Measure the six authored Spire regulars and the authored boss at Heat 0 and 5 with smart policy, 100 fights per cell, and seeds 1, 7, and 11. Record kit budgets/stats, per-enemy win/turn/HP means, stronger stacked results, and residual hard/slog outcomes. The results must be reproducible from an isolated source snapshot at the documented full Git revision. No soft cap or game changes.

The source snapshot is extracted from Git revision `9a70f53cbd1ffe68f4a53b36b6ffb55eb9f8eef5` into `/tmp/everforge-sim07-baseline`, so concurrent simulator edits in the shared worktree cannot affect the runs.

## Reproduction command

```sh
cd /tmp/everforge-sim07-baseline
NODE_PATH=/workspace/Everforge/node_modules node tools/sim.js \
  --no-econ --no-wild --zone spire \
  --enemy harpy,sentinel,acolyte,seraph,lynx,orrery,archon \
  --kit stacked/spire,melee/spire,defensive/spire,staff/spire \
  --heat 0,5 --policy smart --n 100 --seed SEED --jobs 1 \
  --out /tmp/sim07-SEED.json
```

The `--enemy` list restricts the cells to six authored Spire regulars plus `archon`; it excludes generic enemies such as the Mimic and generator-backed wilds. `--kit` selects four exact on-stage kits; `--zone spire` also permits kits arriving from Hollow, but the explicit `*/spire` names exclude those arrival kits. `--no-econ --no-wild` keeps the run to the intended authored matrix.

## Results

Each cell is the mean over 300 fights (100 per seed), formatted as `win% / turns / HP remaining%`; HP is zero on losses. Seeds are averaged equally. Both heats use smart policy, row 3, codex mastery for Spire and earlier regions, biome and depth modifiers enabled, with no wild or economy section.

### Heat 0

| Enemy | Melee | Defensive | Staff | Stacked |
|---|---:|---:|---:|---:|
| Harpy | 100.0% / 3.8 / 100% | 100.0% / 6.2 / 100% | 100.0% / 3.3 / 100% | 100.0% / 2.0 / 100% |
| Sentinel | 100.0% / 4.7 / 99% | 100.0% / 11.3 / 97% | 100.0% / 9.2 / 88% | 100.0% / 3.5 / 99% |
| Acolyte | 100.0% / 3.7 / 100% | 100.0% / 5.7 / 100% | 100.0% / 3.2 / 100% | 100.0% / 2.8 / 100% |
| Seraph | 100.0% / 4.7 / 98% | 100.0% / 8.2 / 99% | 100.0% / 4.1 / 96% | 100.0% / 3.5 / 99% |
| Lynx | 100.0% / 3.1 / 100% | 100.0% / 5.7 / 100% | 100.0% / 3.2 / 100% | 100.0% / 1.9 / 100% |
| Orrery | 100.0% / 4.9 / 100% | 100.0% / 13.4 / 100% | 100.0% / 5.3 / 97% | 100.0% / 4.3 / 100% |
| Archon | 100.0% / 7.0 / 98% | 100.0% / 13.6 / 96% | 100.0% / 7.5 / 94% | 100.0% / 5.0 / 99% |

### Heat 5

| Enemy | Melee | Defensive | Staff | Stacked |
|---|---:|---:|---:|---:|
| Harpy | 100.0% / 5.1 / 100% | 100.0% / 9.1 / 98% | 100.0% / 4.5 / 96% | 100.0% / 3.2 / 100% |
| Sentinel | 100.0% / 7.0 / 91% | 100.0% / 16.5 / 68% | 95.3% / 16.1 / 48% | 100.0% / 4.5 / 91% |
| Acolyte | 100.0% / 4.8 / 91% | 100.0% / 8.8 / 79% | 100.0% / 4.4 / 94% | 100.0% / 3.5 / 92% |
| Seraph | 100.0% / 7.2 / 78% | 100.0% / 11.9 / 75% | 94.3% / 6.7 / 64% | 100.0% / 4.7 / 92% |
| Lynx | 100.0% / 3.9 / 98% | 100.0% / 8.5 / 95% | 100.0% / 4.2 / 94% | 100.0% / 3.1 / 97% |
| Orrery | 100.0% / 7.4 / 98% | 100.0% / 21.2 / 78% | 99.3% / 8.4 / 67% | 100.0% / 6.5 / 97% |
| Archon | 100.0% / 12.2 / 79% | 96.0% / 24.7 / 44% | 72.7% / 20.7 / 43% | 99.7% / 8.2 / 88% |

### Built kit comparison

The simulator crafts these kits through the real `combine()` path at Smith Lv 9. Stats are the resulting build summary, and essence/refining values are the simulator's setup budgets.

| Kit | Essence budget | Refining embers | HP | ATK / MAG | DEF / reduction | SPD | Crit |
|---|---:|---:|---:|---:|---:|---:|---:|
| Melee | 23 | 12 | 88 | 45 / 9 | 63 / 56% | 14 | 33% |
| Defensive | 23 | 12 | 108 | 17 / 6 | 97 / 66% | 0 | 17% |
| Staff | 23 | 12 | 62 | 10 / 38 | 20 / 29% | 12 | 5% |
| Stacked | 106 | 372 | 113 | 75 / 1 | 105 / 68% | 28 | 53% |

Stacked wins all 2,100 Heat-0 fights and 2,099/2,100 at Heat 5 (99.95%). Its overall mean is about 3.3 turns at Heat 0 and 4.8 at Heat 5, versus 4.6/6.8 for melee, 9.2/14.4 for defensive, and 5.1/9.3 for staff. At Heat 5, defensive wins 2,088/2,100 (99.43%), and staff wins 1,985/2,100 (94.52%). These totals and means were recomputed directly from 21 enemy cells per kit and heat across the three raw JSON files (seven enemy cells per file). Stacked is also considerably more expensive in essence and refining budgets: 106 essences and 372 refining embers versus 23 and 12 for every comparison kit.

No Heat-0 `TOO_HARD` cells or `SLOG` cells appear for these four Spire kits. Fourteen Heat-0 cells meet the simulator's `TOO_EASY` rule (100% wins, over 85% HP left, under four turns; boss under ten). At Heat 5 the main residual difficulty is the Archon: defensive wins 96.0% and leaves 44% HP after 24.7 turns; staff wins 72.7% and leaves 43% after 20.7 turns. Stacked wins 99.7% and leaves 88% after 8.2 turns. Staff also averages 95.3% against Sentinel and 94.3% against Seraph at Heat 5. These are exploratory samples, not evidence for a soft cap by themselves.

Raw JSON is temporary at `/tmp/sim07-{1,7,11}.json`. The durable tables above contain the aggregate sample results; the commands and source revision are recorded above.
