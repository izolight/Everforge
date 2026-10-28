# M-12 balance review — not accepted

M-12 remains **In Progress**. This note records the refreshed baseline, the current review candidate, and the conflicts that prevent closing the task.

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

## Decision needed to close

The measured choices do not satisfy the criteria together: a moderate band preserves strong stage-kit wins but misses Woods' roster threshold and reduces fresh-opening wins; a much stronger Woods band clears the sampled roster threshold but breaks the fresh opening. Exact measured economy parity and a Rift wild resolution also remain open. Do not mark M-12 Done or loosen its simulator flags/acceptance criteria on this evidence.
