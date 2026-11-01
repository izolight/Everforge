# M-12 balance review — accepted regional profile

M-12 is **Done** for authored-region stage-kit balance. The baseline and earlier candidate sections below are retained as historical decision evidence; the final accepted profile and validation are recorded at the end.

## Method

- Baseline revision: `2c9b1a0`, before M-12 tuning. Candidate revision: `2c9b1a0` plus the uncommitted M-12 generator edit in this worktree. The seed-1 baseline predates V-15; both candidate seeds use `--no-biome-mods` so the paired comparisons suppress V-15 passives.
- Candidate: authored-region wild HP `2.0×` and attack `1.2×` their region tier, with the existing rarity normalization and affix multipliers. Rift wilds remain at `1.0×/1.0×`; generated Rift masters retain the accepted M-11 profile and `+2 DEF` boss bonus.
- Combat sample: seed 1 and seed 7; `--wild --n 100 --heat 0 --policy smart --rift-depth 1`; all 16 region-stage kit rows (`melee`, `defensive`, `staff`, `stacked` paired with their own region). The reference mode has biome passives disabled. Candidate JSON: [seed 1](m12-candidate-seed1.json) and [seed 7](m12-candidate-seed7.json). Baselines: [seed 1](m12-seed1-baseline.json) and [seed 7](m12-seed7-baseline.json).
- Economy sample: seed 1, 30 expeditions, `--econ-only --no-biome-mods`, smart policy, Heat 0. [Baseline](m12-economy-baseline.json) and [candidate](m12-economy-candidate.json).

## Stage-kit result

All 32 candidate region-stage summary rows won 100%. Every candidate row took more turns than its zone's regular enemies and ended with less player HP: the smallest turn delta was `+1.83` and the least favorable HP delta was `−1`. The roster-share criterion still fails in Woods in both seeds:

| Region | Kit | Seed 1 `TOO_EASY` | Seed 7 `TOO_EASY` |
|---|---|---:|---:|
| Woods | melee | 4/10 | 4/10 |
| Woods | defensive | 0/10 | 0/10 |
| Woods | staff | 1/10 | 1/10 |
| Woods | stacked | 9/10 | 9/10 |
| Pass | melee / defensive / staff / stacked | 0 / 0 / 0 / 2 | 0 / 0 / 0 / 2 |
| Hollow | melee / defensive / staff / stacked | 0 / 0 / 0 / 1 | 0 / 0 / 0 / 1 |
| Spire | melee / defensive / staff / stacked | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |

The candidate meets the turn and HP deltas but not the rule that no more than a third of each roster is flagged `TOO_EASY`; Woods stacked is `9/10`, and Woods melee is `4/10`.

## Opening progression and economy

With the tutorial Fire sword and Weaponcraft, the fresh seed-1 six-expedition opening (`--fresh --exped 6 --seed 1`, smart policy, Heat 0) was `4/6` wins on the candidate, versus `6/6` on the unscaled baseline. Raising the whole Woods roster to `4.5×` HP removed `TOO_EASY` in a 40-fight-per-cell seed-1 stage matrix (`--wild --seed 1 --n 40`, smart, Heat 0), but the same fresh opening fell to `0/6`. That stronger band is rejected as an opening regression. A mixed roster trial did not resolve the aggregate Woods stacked count.

The 30-expedition economy sample kept clear/loss at `100%/0%` in all four zones, and no drop pool, reward quantity, or catalog price constant was changed. However, the same-seed observed economy totals and shop-stock extrema differ between baseline and candidate (including embers, essences, items, and sampled price ranges). Exact expedition-economy parity is not established; the full per-zone values are in the JSON files.

Rift wilds remain at their pre-M-12 band. The refreshed Rift matrix still has a substantial `TOO_EASY` share on native wild rows and some `TOO_HARD` forced affix rows. No M-12 multiplier was applied there because the forced-rare defensive/spellcaster interactions are already punitive; the Rift wild profile needs a separate scoped resolution before claiming the whole generated roster accepted. The Rift master itself is unchanged.

## Final regional progression profile

The accepted profile keeps seeded generated stats at their rarity-normalized region tier, then scales combat-only stats when Smith level reaches the region's stage-kit level. Below that threshold, including the fresh tutorial, generated nonboss regional wilds stay at 1× HP / 1× ATK. At Smith Lv 3 / 5 / 7 / 9, Woods uses 4.5× HP and later regions use 2× HP; all use 1× ATK. The Rift and all generated bosses are excluded. This leaves roster IDs, RNG draws, drops, affix behavior, and the M-11 master profile unchanged.

### Final validation

Candidate source revision: `0a95948` plus the uncommitted M-12 changes. V-21's biome/depth hooks were present and explicitly disabled for the Rift reference rows. Paired commands:

```sh
node tools/sim.js --wild --seed 1 --n 100 --heat 0 --policy smart --zone woods,pass,hollow,spire --rift-depth 1 --no-biome-mods --no-depth-mods --no-econ --out balance-evidence/m12-progression-final-seed1.json
node tools/sim.js --wild --seed 7 --n 100 --heat 0 --policy smart --zone woods,pass,hollow,spire --rift-depth 1 --no-biome-mods --no-depth-mods --no-econ --out balance-evidence/m12-progression-final-seed7.json
```

These are 100 simulated fights per creature and kit, Heat 0, smart policy, all four same-region stage kits (`melee`, `defensive`, `staff`, `stacked`), with both Rift modifiers disabled for reference. In both seeds, all 32 region/kit native rows have positive turn deltas and negative player-HP deltas versus same-zone regulars. Minimum `Δ turns` is +2.2; the least-negative `Δ HP` is −6. Native rows win 100% except `staff/spire` (98% for seed 1, 97% for seed 7). The largest native `TOO_EASY` share is `stacked/pass`, 1/10 creatures (10%) in each seed; the other region/kit native rows have none. No native row is `TOO_HARD`.

The 4.5× Woods band no longer changes the opening tutorial: the final fresh run is 6/6 wins for seed 1 and 6/6 for seed 7. Seed 11 is 5/6, with the final loss at Smith Lv 1; the M-12 profile is inactive at that level, so this is retained as opening-loop variance rather than attributed to the band. Full stdout is saved in `m12-opening-seed1.log`, `m12-opening-seed7.log`, and `m12-opening-seed11.log`.

The same-seed 30-expedition economy sample is `m12-economy-progression.json`, compared with `m12-economy-baseline.json`. Every region remains 30/30 clears and 0 losses. Economy tables, reward quantities, prices, and drop pools were not changed. Observed per-run item/essence/ember totals and some sampled shop stock differ slightly because a combat stat change alters the combat RNG path; exact same-seed loot-output parity is not claimed.

Wild affixes still grant no essence (`B.intr` reward guard unchanged). `node tools/rift-boss-check.js`, `node tools/v14-special-check.js`, `node tools/special-check.js`, JavaScript syntax checks, and `git diff --check` pass. Rift wilds remain on their previous combat band; this task's acceptance is scoped to authored-region stage kits, and these measurements do not claim a Rift-wild balance fix. The M-11 master is unchanged.
