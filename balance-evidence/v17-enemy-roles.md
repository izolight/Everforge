# V-17 · Enemy roles

V-17 adds four documented roles: Bruiser, Skirmisher, Caster, and Support. Authored
non-boss enemies infer their role from their existing special; generated enemies
receive a deterministic role slot based on the roles their biome's special pool
can support. Role assignment adds no random draw. Special selection still uses one
existing draw, restricted to role-compatible kinds when possible. A biome without
a compatible special does not assign that role. Role labels and descriptions are
translated in German and Korean and appear on the battle enemy card.

| Role | HP | ATK | DEF | Compatible special kinds |
|---|---:|---:|---:|---|
| Bruiser | 1.16× | 0.96× | +1 | heavy, guard, enrage |
| Skirmisher | 0.94× | 1.05× | unchanged | multi, burrow, inflict |
| Caster | 0.90× | 1.08× | unchanged | inflict, drain, heavy |
| Support | 1.06× | 0.90× | +1 | heal, guard, inflict |

Stats are applied to a combat copy, with HP and ATK rounded and clamped to at least
1 and DEF clamped to zero. Bosses keep their authored phase stats. Full behavior,
special mappings, and rationale are in [the role design](../docs/enemy-roles.md).

## Validation

On frozen baseline `ce7c136`, the V-10 candidate settings and role candidate runs
used smart policy, Heat 0, 30 fights per cell, seeds 1 and 7, and disabled biome
and depth modifiers. The V-10 reference logs are [seed 1](../rift-evidence/v10-candidate-seed1.txt)
and [seed 7](../rift-evidence/v10-candidate-seed7.txt); the V-17 outputs are
[seed 1 JSON](v17-role-seed1.json) / [text](v17-role-seed1.txt) and
[seed 7 JSON](v17-role-seed7.json) / [text](v17-role-seed7.txt). Each Rift sample
contains both Rift seeds (1 and 7) at depths 1, 3, and 9.

Across the 29 authored native stage-kit rows per seed, V-10 reference wins were
99.8% for both seeds. Role-candidate wins were 99.6% and 99.7%; mean turns changed
from 7.70 to 7.95 for seed 1 and 7.75 to 7.91 for seed 7. No authored row was
flagged by the simulator.

For native Rift rows (four stage kits, ten wilds plus the master, two Rift seeds,
88 cells per depth), aggregate wild/master win rates changed from 86.9% to 87.9%
for seed-1's regional run and from 86.6% to 87.9% for seed 7. Depth 1 remained
near 100% wins; depth 3 was 99.1% / 99.1% versus 99.5% / 99.6%; depth 9 improved
from 61.2% / 60.1% to 64.6% / 64.6%. Mean turns fell by about 0.4 at depth 1,
0.8 at depth 3, and 1.8 at depth 9. Depth-9 TOO_HARD flags remain (41 and 40
role-candidate cells versus 48 and 51 in the reference); depth 1/3 also retain
some TOO_EASY flags. Generated Rift masters are not role-scaled.

The 100-expedition-per-zone economy comparison used the same seeds and simulator
settings as the V-10 candidate reference. Woods and Pass cleared 100% for both
seeds in both versions. Hollow clear rates changed from 97% to 95% (seed 1) and
93% (seed 7); Spire changed from 99% to 98% and 97%. Sampled items, essences, and
embers shifted because combat outcomes changed; reward tables and drop quantities
were not changed. These two 100-expedition samples do not establish economy parity.
No separate fresh-opening comparison was run for V-17.

`node tools/run-checks.js` passed **38/38**, including smoke. Focused role model and
browser checks passed: all four roles are represented by authored enemies and in
simulation coverage; the four generated authored rosters have balanced supported
roles; the seeded ten-wild Rift roster repeats; each role enters combat with finite
stats; bosses remain unchanged; and the role chip fits the 390 px viewport. The
browser screenshot is [v17-role-mobile.png](../combat-evidence/v17-role-mobile.png).
Also passed: `i18n-check`, `name-check` (234 samples), `color-check` (0 problems),
`part-check` (650 renders, 0 problems), and the V-11 biome-special regression
check. The full suite ran with V-19's isolated model-only check present; faction
behavior was not integrated into this V-17 candidate.

## Frozen candidate

Measurements describe `ce7c136` plus these V-17 source files before V-19
integration. SHA-256 fingerprints:

- `index.html`: `e7c2de8b956cb20aaa1365ebc86f21cf3d8530ca2346eda868d1c811c954e59e`
- `js/roles.js`: `afad97c70b8cb77abf62db7940249b324e4e8a40beaac8d8c83aba5d2ba82202`
- `js/monsters.js`: `e292f7e1fecc5b141d9ed006449e12c806bcba92a43698051baf53b583ae9855`
- `js/battle.js`: `a1bfaab1e5a42ff88c6cbd6ad83b402c7871c4f8006b2484e6774c3b235acaa4`
- `js/render/battle-view.js`: `62ff3423502dd151f75d58c69999cebe9991da6782f5a443fdd80a8fd7139894`
- `js/lang/de.js`: `2dec0ce965e2b69c76ac26efa85cdafa41517ea80c9c8b04ebe0f64dd71aa71d`
- `js/lang/ko.js`: `8686c0c0c4bd165dcc350c9aa4d942f44ddd228b83683e79753c0f37d071fa79`

The role model and browser checks, language and V-11 regression checks, and full
suite were run before V-19 shared generator integration. Re-run them against any
combined V-19 candidate before treating these measurements as its balance result.
