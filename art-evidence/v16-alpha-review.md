# V-16 · Authored regional alpha wilds

## Scope and implementation

V-16 applies to the four authored `GEN_N` rosters only: Woods, Pass, Hollow, and Spire. It promotes one existing slot in each ten-creature roster; it does not add a roster entry or modify seeded Rift wilds or masters. M-05 Rift identity work is a separate concurrent change.

The selected slot is `hash("wild-alpha-slot:" + zone) % roster.length`, so normal roster generation draws and every non-alpha entry remain unchanged. The alpha adds 30% base HP, 10% base Attack, and 2 Defense before the existing rarity and M-12 combat bands. It retains weight and its exact regional `drops` table. Its affixes are fixed, compatible rare trios; the species rarity/affixes are intrinsic, so the battle does not grant affix essence drops.

| Region | Alpha | Affixes |
| --- | --- | --- |
| Woods | Thornheart Alpha | Swift-footed, Elusive, Umbral |
| Pass | Frosthorn Alpha | Iron, Splitting, Frenzied |
| Hollow | Cinderback Alpha | Umbral, Volatile, Regenerating |
| Spire | Starcrown Alpha | Vampiric, Thorned, Swift-footed |

The map shows an alpha with a star and a purple double frame layered over the rare frame and affix pips. [Mobile map review at 390px viewport / 36px tile](v16-alpha-map-mobile.png).

## Determinism, combat, and progression checks

`node tools/alpha-check.js` passes. It checks exactly one alpha in each authored roster, deterministic output without ambient `Math.random`, unchanged non-alpha entries and generation draws, the 1.3× HP / 1.1× Attack / +2 Defense band, compatible three-affix profiles, unique names, unchanged alpha drops/weight, intrinsic essence suppression, and M-12 tutorial/stage bands. The mobile marker is present at 36×36px.

The first profile used a seeded rare affix roll. Both seeds found one real outlier: Spire staff/spire won only 42% (21/50) and was flagged `TOO_HARD`, with Volatile among its affixes. That trial is preserved in [seed 1](v16-alpha-trial-volatile-seed1.json) and [seed 7](v16-alpha-trial-volatile-seed7.json). Spire now uses the compatible Vampiric / Thorned / Swift-footed trio.

Final paired measurements used base commit `4483712` plus the uncommitted V-16 and M-05 source candidate. The combined V-16 source-set SHA-256 at measurement time was `5212b5e28c3de5d6f7ac5c2f3854462701d03b94eadb8be02c79f4a3ca58ab33`.

Each command ran 50 trials per cell; seeds 1 and 7 therefore give 100 paired trials per region/kit cell. All used smart policy, Heat 0, row/depth 3, four simulator kits, and disabled V-15/V-21 biome/depth modifiers. The alpha-specific rows covered only the four authored alphas. Both JSON files retain the full metrics and simulator args: [seed 1](v16-alpha-final-seed1.json), [seed 7](v16-alpha-final-seed7.json).

```sh
node tools/sim.js --zone woods,pass,hollow,spire --enemy w_woods_3,w_pass_0,w_hollow_6,w_spire_4 --kit melee,defensive,staff,stacked --n 50 --heat 0 --policy smart --seed 1 --no-biome-mods --no-depth-mods --no-econ --jobs 4 --out art-evidence/v16-alpha-final-seed1.json
node tools/sim.js --zone woods,pass,hollow,spire --enemy w_woods_3,w_pass_0,w_hollow_6,w_spire_4 --kit melee,defensive,staff,stacked --n 50 --heat 0 --policy smart --seed 7 --no-biome-mods --no-depth-mods --no-econ --jobs 4 --out art-evidence/v16-alpha-final-seed7.json
```

All 16 region × stage-kit cells won 100% in each seed, with no `TOO_EASY` or `TOO_HARD` flags. Hollow melee is flagged `SLOG` in both seeds (33.94 and 34.28 mean turns); retain this long-fight limitation rather than claiming a flag-free sample. Averages below combine seeds 1 and 7; HP is the player's mean HP remaining after the win.

| Alpha region | Melee | Defensive | Staff | Stacked |
| --- | --- | --- | --- | --- |
| Woods | 100%, 8.9 turns, 65% HP | 100%, 15.8 turns, 88% HP | 100%, 12.0 turns, 56% HP | 100%, 6.3 turns, 78% HP |
| Pass | 100%, 23.0 turns, 62% HP | 100%, 26.6 turns, 63% HP | 100%, 17.0 turns, 56% HP | 100%, 12.8 turns, 84% HP |
| Hollow | 100%, 34.1 turns, 39% HP | 100%, 15.7 turns, 55% HP | 100%, 9.3 turns, 40% HP | 100%, 15.3 turns, 41% HP |
| Spire | 100%, 11.0 turns, 50% HP | 100%, 19.9 turns, 42% HP | 100%, 9.3 turns, 78% HP | 100%, 7.2 turns, 62% HP |

The `node tools/sim.js --econ-only --seed 1` smoke output is saved at [economy summary](v16-alpha-economy-seed1.txt) with its machine-readable result at [JSON](v16-alpha-economy-seed1.json). This generic economy-only path does not fight alpha enemies, so it is not presented as exact post-reward parity. Alpha economy is instead checked structurally: the promoted slot retains its original regional drop rows and weight, intrinsic affixes grant no essence reward, and all final stage-kit alpha samples clear.

## Validation

- `node tools/alpha-check.js` — pass.
- `node tools/i18n-check.js` — pass (German and Korean alpha names, label, description, and reward text).
- `node tools/run-checks.js` — **26/26 passed**, including affix, biome-special, V-14, and alpha checks.
- `git diff --check` — pass before documentation updates.
