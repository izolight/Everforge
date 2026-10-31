# V-15 · Seeded Rift biome passives

## Scope and rules

The existing Rift seed selects the biome, and its saved biome selects the passive. The effects make no random draws and do not alter map layout, biome selection, monster pools, or generated creature stats. Forest is the neutral eighth biome; the seven effects below follow V-15's task card.

The focused browser fixtures use biome seeds: tundra 1, astral 4, forest 6, fen 7, ash 8, bone 12, deep 14 and ember 20.

| Biome | Passive | Rule |
|---|---|---|
| Fen | Poison fog | A landed, unguarded enemy hit adds one mild Poison stack. Poison caps at three; resistance shortens duration. |
| Tundra | Killing chill | A landed, unguarded enemy hit applies Chill for up to two turns; Ice resistance shortens duration. |
| Ember | Cinder air | A landed, unguarded enemy hit applies Burn for up to two turns; Fire resistance shortens duration. |
| Astral | Arcane surge | On turn 3, 6, 9, etc., the enemy's next attack, if any, has 25% more power and uses Arcane. Arcane resistance and the usual Guard/Parry rules apply. |
| Ash | Blinding sand | Player attacks deal 20% less damage on turns 3, 6, 9, etc. |
| Bone | Grave fear | A landed, unguarded enemy hit leaves the player off balance for the next player action. |
| Deep | Drowning pressure | At the end of turns 3, 6, 9, etc., lose 4% maximum HP, reduced by Stone resistance. It bypasses Defense and Guard and still occurs after a Parry; it can defeat the player through the normal recovery path. |

Guard prevents hit-sourced statuses and fear. A successful Parry interrupts a telegraphed special before its hit and any hit-sourced passive effect. Resistance shortens guaranteed biome status duration. For biome-sourced statuses, reapplying the same status keeps the longer duration and stronger tick damage; Poison adds one stack per landed hit up to the shared three-stack cap. Existing non-biome status refresh behavior is unchanged, and statuses from separate sources can coexist.

Rift maps are not part of the current daily rotation (`dailyPlan` chooses only authored regions), so daily twists and Rift passives do not currently share a run. Daily map/twist rolls remain untouched. If a future daily includes the Rift, modifiers compose independently: `double` doubles enemy attack before status damage is computed; `cinder` and Ember's Burn combine into one Burn application per landed hit, with the twist's 50% Burn damage increase; `elites` and `nocamp` retain their existing map rules. Heat remains an independent modifier.

`startBattle(..., {biomeMods:false})` disables only the Rift passive for reference measurement. Live Rift battles use the saved Rift biome by default. M-12 uses `--no-biome-mods` for its modifier-free reference mode. No map/save version bump or generator change is needed; older active Rift battles derive the biome from the saved Rift state.

## Evidence

- [Focused V-15 browser-check output](v15-check.txt) covers all seven effects, neutral forest, deterministic seed mapping, status/resistance, Guard and Parry, deep-pressure defeat/recovery, reference opt-out, daily twist isolation, and browser errors.
- [Mobile battle HUD cue](v15-battle-mobile.png), showing the active modifier during combat at 390×844.
- [Mobile Rift map and modifier badge](v15-rift-card-mobile.png), captured at 390×844.
- [Mobile Codex modifier details](v15-codex-mobile.png), captured at 390×844 with no horizontal overflow.

`node tools/biome-check.js` passes. `node tools/i18n-check.js` passes for English keys in German and Korean. The check is discoverable by `node tools/run-checks.js`.

`node tools/map-check.js` also passes: 240 seeded layouts stayed connected, daily layouts remained deterministic, saves/reloads preserved maps and fleeing enemies, and map controls fit 320/360/720px widths.

## Paired simulator sample

The live and reference runs used the same deterministic automatic Rift seed set, which covers deep (3608050713), fen (3574495475), astral (3675161189), forest (3624828332), ember (3641605951), tundra (3742271665), bone (3033363595) and ash (3100474071). Both used HEAD `2c9b1a0` plus the uncommitted M-12 review candidate (authored wilds at 2× HP / 1.2× Attack; Rift wilds and masters unchanged), smart policy, Heat 0, 25 fights per cell and depth 1. The live run enabled passives by default; the reference added `--no-biome-mods`.

- Live: [simulator JSON](v15-sim-live.json), [console output](v15-sim-live.txt).
- Reference: [simulator JSON](v15-sim-reference.json), [console output](v15-sim-reference.txt).
- Native Rift-master rows: 32 kit/biome cells (800 fights) averaged 97.5% wins live vs 99.9% reference; mean duration was 25.4 vs 24.9 turns and mean remaining HP was 64.2% vs 67.6%.
- Native Rift-wild rows: 320 cells (8,000 fights) averaged 99.7% wins live vs 99.8% reference; mean duration was 7.1 turns in both runs and mean remaining HP was 92.1% vs 93.3%.

This is a paired impact sample, not an accepted balance baseline or a balance sweep. It covers one sampled depth and one simulator seed; the full check runner separately passed 22/22. The M-12 candidate is still under review, and its authored-wild tuning must not be read as accepted balance data. Full check output is in [v15-full-checks.log](v15-full-checks.log).
