# V-20 · Water and Steam families

## Scope and implementation

Water and Steam are now full creature families with distinct family colours, native
weakness/resistance/status profiles, matching elemental affixes, and locale entries
in English, German, and Korean. Tidewrack can generate Water creatures and Geyser
Field can generate Steam creatures. The existing Steam essence recipes, essence
pool, Cursed Altar and generic reward quantities are unchanged. Rift generated
creatures add only existing material drops; they add no essence drop source.

The family-specific affixes are eligible only for generated creatures of the
matching element, so other family pools and the old elemental-affix index order
remain stable. The V-20 check verifies that these affixes set the family in combat,
add its resistance, and remove its matching weakness. Tidewrack and Geyser retain
their existing roster size and special pools.

## Validation and deterministic samples

Reference revision: `c03737c469e3a7f6032d9c86be1e02df2a30163d` (V-19). Baseline
and final standard simulations used seed 1 and seed 7 separately, `--wild --n 30
--heat 0 --policy smart --rift-seeds 1,7 --rift-depth 1,3,9
--no-biome-mods --no-depth-mods --jobs 4`. Each file contains 792 Rift cell rows.
Both runs selected only Tundra and Radiant Garden, and all 792 row metrics matched
per seed. This confirms sampled unaffected-roster stability; these runs do not
exercise the new families.

Targeted samples used the same settings and `--rift-seeds 16,37`, the deterministic
simulator seed IDs that select Tidewrack and Geyser respectively. The IDs were
verified from the written JSON (`riftSeeds: ["16","37"]`) before reporting them.
Each biome/depth row aggregates 132 kit/rarity cells at 30 fights each. Results:

| Biome | Depth | Seed 1 wins / turns / HP left | Seed 1 flags | Seed 7 wins / turns / HP left | Seed 7 flags |
|---|---:|---|---|---|---|
| Tidewrack | 1 | 98.1% / 11.0 / 81.6% | 13 TOO_EASY, 3 SLOG | 98.0% / 11.0 / 81.2% | 11 TOO_EASY, 4 SLOG |
| Tidewrack | 3 | 89.4% / 14.5 / 63.2% | 13 SLOG, 9 TOO_HARD, 2 TOO_EASY | 89.3% / 14.6 / 63.1% | 12 SLOG, 7 TOO_HARD, 2 TOO_EASY |
| Tidewrack | 9 | 39.2% / 18.4 / 19.7% | 78 TOO_HARD, 11 SLOG | 39.5% / 18.4 / 19.6% | 80 TOO_HARD, 11 SLOG |
| Geyser | 1 | 97.5% / 11.5 / 83.7% | 14 TOO_EASY, 5 SLOG, 2 TOO_HARD | 98.0% / 11.6 / 83.6% | 14 TOO_EASY, 5 SLOG, 2 TOO_HARD |
| Geyser | 3 | 93.4% / 14.6 / 68.3% | 7 SLOG, 4 TOO_HARD, 1 TOO_EASY | 92.7% / 14.7 / 68.2% | 10 SLOG, 5 TOO_HARD, 2 TOO_EASY |
| Geyser | 9 | 46.5% / 20.8 / 23.6% | 76 TOO_HARD, 21 SLOG | 45.9% / 20.8 / 24.0% | 75 TOO_HARD, 19 SLOG |

These are coverage measurements across the simulator's kits and rarities, not a
claim that every individual matchup is balanced. Deep Rift fights still have many
TOO_HARD and SLOG flags; no flags, kits, or acceptance thresholds were adjusted.

Economy comparisons used 100 expeditions per seed and the `--econ-only` defaults.
Clear rates, raw essence, embers, and the other sampled economy fields matched by
zone except `salvEss`: Woods seed 1 changed 12.778933 to 12.771689 (−0.007244),
and Hollow seed 7 changed 18.005778 to 18.012000 (+0.006222). This small finite-
sample difference is recorded rather than claiming exact yield parity. Recipes,
essence pools, generic drop quantities, and economy source constants are unchanged.

`node tools/run-checks.js` passed **41/41**, including smoke. Focused V-20 family,
element-weight, affix, color, i18n, Tidewrack, and Geyser checks passed. The family
check samples 30,000 selections per new biome (common elements 3:3:3, rare 1:1),
checks one RNG draw, verifies generated matchup/status and affix combat behavior,
checks family palette/affix art, and confirms the family promotion creates no new
essence source. Existing browser fixtures verify translated content and 390px
mobile map/battle layout without browser errors.

## Frozen V-20 source fingerprints

SHA-256 of the working source at validation freeze:

| File | SHA-256 |
|---|---|
| `js/data.js` | `f0108b48a09654890b95e2824fd039960cadafcd7d2fc2b2b7c8df2e8cd80b51` |
| `js/affix.js` | `89a2d7a483e0a3d3fc375db568dbe1c55853335a20fe87a377d4773f8e5a674d` |
| `js/monsters.js` | `a0246a304a4c156aa41b0a102a7d2ccd88b03ab1733acbd52aeb3477b924bca0` |
| `js/art/color.js` | `ebcd36a34b802387308af5293ecfec75a10d2a921ba0fbaac53cc978e27e73cd` |
| `js/art/affixes.js` | `51788c63a4311fa9e9b6a18f57bb122113e5e29cba7037a143147cbf11e97211` |
| `js/lang/de-data.js` | `8ba51a45a85e3bf98ae7b250652f4f2848563742c92f656476983e01ece0a2c8` |
| `js/lang/ko-data.js` | `e09c419501c38d24babd11143965e917827640eb3af0e93b1e45d468c6f6e096` |
| `tools/element-family-check.js` | `15f2788162cc34097edaffdd34ac86ceeabb63cf6a91b7e46bcfe007ef767a94` |
| `tools/geyser-biome-check.js` | `3de0d3ac22cff8709623d4164fa5093b39327426a7438d7c4e3ddba2dd1e5bae` |
| `tools/tidewrack-check.js` | `34e173a28878cbe9374fd19218ddd97ac39793acffbd2878ad3813c99d77a5f3` |

## Raw results

- [Baseline Rift seed 1](v20-baseline-c03737c-seed1.json) · [seed 7](v20-baseline-c03737c-seed7.json)
- [Final reference Rift seed 1](v20-final-c03737c-seed1.json) · [seed 7](v20-final-c03737c-seed7.json)
- [Tidewrack/Geyser Rift seed 1](v20-targeted-families-seed1.json) · [seed 7](v20-targeted-families-seed7.json)
- [Baseline economy seed 1](../balance-evidence/v20-baseline-econ-c03737c-seed1.json) · [seed 7](../balance-evidence/v20-baseline-econ-c03737c-seed7.json)
- [Final economy seed 1](../balance-evidence/v20-final-econ-c03737c-seed1.json) · [seed 7](../balance-evidence/v20-final-econ-c03737c-seed7.json)
