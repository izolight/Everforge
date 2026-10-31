# M-05 · Rift-only biome identities

## Implementation

Fen, ash, bone and deep now have a distinct Rift identity on generated creatures:

| Biome | Favored element | Favored existing material | Signature trait | Hit infliction |
|---|---|---|---|---|
| Fen | Poison | Witchwood | Mire Venom | Poison, 25% |
| Ash | Fire | Storm Feather | Cinder Brand | Burn, 25% |
| Bone | Shadow | Void Crystal | Grave Curse | Curse, 25% |
| Deep | Ice | Holy Water | Undertow Chill | Chill, 25% |

The favored element occupies two of five selection weights; each alternative occupies one. The favored material keeps the biome's existing drop entry and gains 0.12 chance, capped at 0.90. Generated drops keep their existing item selection and one-to-three slots. No new material, reward slot, or essence source was added. The signature infliction uses the combat engine's existing status, Guard, Parry and resistance rules.

Identity selection uses the same single element RNG draw. The material adjustment adds no draws. It is Rift-only; authored region generation, seeded daily pre-rolls, V-15 passives, V-21 depth modifiers, and the M-11 master special/three-affix compatibility rules remain in place.

## Paired Rift simulation

Measurements were captured at `4483712` with the M-12 progression helper committed. The concurrent V-16 authored-alpha candidate was present in both samples; these results cover Rift foes, so its authored rosters do not enter the comparison. The reference predates M-05 identity. The candidate uses the M-05 generator changes. Both use the same simulator options except simulator seed:

```sh
node tools/sim.js --wild --n 30 --heat 0 --policy smart --seed 1|7 \
  --no-biome-mods --no-depth-mods \
  --rift-seeds 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16 \
  --rift-depth 1,3,9 --rift-wild --jobs 4 --out rift-evidence/m05-*.json
```

Each run samples the Rift master at depths 1, 3 and 9 across the listed Rift seeds, with 30 fights per cell. Table rows combine the native-master results from both simulator seeds, all four kits, and all Rift seeds selecting that biome/depth. `n` is the number of kit/seed cells, not the number of individual fights.

| Biome | Depth | Reference win / turns / HP left | Identity win / turns / HP left | Cells |
|---|---:|---:|---:|---:|
| Fen | 1 | 100.0% / 21.5 / 65.9% | 97.1% / 23.1 / 61.1% | 16 |
| Fen | 3 | 98.3% / 22.0 / 60.5% | 85.6% / 23.0 / 50.5% | 16 |
| Fen | 9 | 45.8% / 34.0 / 19.5% | 28.3% / 29.5 / 11.5% | 16 |
| Ash | 1 | 99.8% / 26.8 / 71.1% | 94.2% / 26.8 / 66.0% | 16 |
| Ash | 3 | 95.2% / 27.7 / 62.9% | 85.8% / 26.9 / 55.3% | 16 |
| Ash | 9 | 34.4% / 32.8 / 17.9% | 23.5% / 28.2 / 12.2% | 16 |
| Bone | 1 | 100.0% / 27.6 / 79.8% | 100.0% / 27.4 / 80.5% | 8 |
| Bone | 3 | 100.0% / 28.4 / 71.9% | 100.0% / 28.0 / 73.3% | 8 |
| Bone | 9 | 74.2% / 41.4 / 42.0% | 73.8% / 41.1 / 46.4% | 8 |
| Deep | 1 | 86.3% / 22.4 / 43.6% | 95.0% / 23.2 / 47.7% | 16 |
| Deep | 3 | 80.4% / 22.5 / 38.8% | 89.4% / 23.7 / 42.8% | 16 |
| Deep | 9 | 7.1% / 22.2 / 1.7% | 15.0% / 25.8 / 3.6% | 16 |

The differences reflect the new element and status mixes as well as combat randomness. Fen and ash lower master win rates in the sample; deep improves against its reference. Depth 9 remains a weak baseline for several kits and is not claimed as balanced. These paired samples demonstrate generated coverage and identity effects, not multi-seed sensitivity beyond simulator seeds 1 and 7.

## Durable artifacts and checks

- Reference JSON: [seed 1](m05-reference-seed1.json), [seed 7](m05-reference-seed7.json)
- Identity JSON: [seed 1](m05-identity-seed1.json), [seed 7](m05-identity-seed7.json)
- Checks: `node tools/rift-identity-check.js`, `node tools/biome-special-check.js`, `node tools/biome-check.js`, `node tools/depth-check.js`, `node tools/i18n-check.js`

The focused identity check verifies the four metadata mappings, weighted element distribution, single-draw element selection, favored-drop cap and draw count, deterministic rosters at depths 1/3/9, signature inflictions, and the generated master's three-affix M-11 profile with `GEN_SP` fallback. The biome-special check also verifies V-15 and V-21 remain active together. The initial i18n check found six missing German/Korean Alpha strings while V-16 was active; those were subsequently supplied. Final i18n and parent identity/alpha checks pass. The combined full suite passed 26/26. Fen and ash master win-rate reductions and depth-9 difficulty remain explicit limitations in the paired table above.
