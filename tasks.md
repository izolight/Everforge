# Everforge — tasks and watchlist

Single planning record, consolidated 2026-10-31. **62 tracked tasks complete; no open or active tasks.** Ideas below are unscheduled, not commitments. Completion records describe historical validation, not a fresh check of today's build.

## Next decisions and playtest watchlist

Refresh measurements on the current build before opening follow-up tasks.

| Area | What to check | Possible follow-up |
|---|---|---|
| First forge and research pace | Does waiting for the first slot technique feel too long? Weaponcraft/Armorcraft cost 14 RP, Infusing 8, Improving 10 in the completed rework. | Adjust `TECHS` costs after playtesting; preserve M-10 tutorial preparation. |
| Bot priorities | Six expedition samples show gear-first buys gear techniques earlier than cheapest-first. [SIM-02 evidence](economy-evidence/sim02-research-policy.md). | Compare larger samples and real player choices before drawing pacing conclusions. |
| Fusing timing | `--fresh` only plays the Woods, so the intended second-region timing is unmeasured. | Extend the sim into the Pass or check in play. |
| Expedition visit cap | SIM-04 single-foe and SIM-05 pack-aware samples associate a higher limit with more fights and steps; the pack-aware sample had 9/90 Hollow and 12/90 Spire defeats at limit 8, compared with 15/90 and 11/90 respectively at limit 12. [SIM-04](economy-evidence/sim04-exploration.md), [SIM-05](economy-evidence/sim05-pack-economy.md). | Consider balance only after more seeds or play data; the 90-run cells are exploratory. |
| Roaming ambushes | Denser maps increased encounters initiated by roamers in the recorded run. | Add a movement cap only if play shows excessive ambushes; the tried cap of six had no measurable sim effect. |
| Essence/material income | SIM-05 pack-aware runs show substantial estimated Spire salvage essence value, lower than the SIM-04 single-foe estimate in these samples. [SIM-04](economy-evidence/sim04-exploration.md), [SIM-05](economy-evidence/sim05-pack-economy.md). | Retune `FRAG`/drop chances only after broader samples and player data. |
| Regional material coverage | Pass lacks local Timber; Hollow/Spire lack local Leather. Earlier zones supply these. | Decide whether every region should supply every material type. |
| Trait stacking | Earlier runs found stacked kits very strong at Heat 5. | Decide whether a soft cap is desirable; it would rescale existing items. Remeasure before specifying it. |
| Roster coverage | Spire has six authored regulars; the other regions have seven. The Woods' stag is also weak to Stone. | Check whether the asymmetry and Stone-kit matchup warrant changes. |

## Unscheduled ideas

- **Rift progression:** consider Heat, daily participation or renown beyond depth records. The recorded tier/Smith caps are 9/10; review the progression purpose before expanding it.
- **Earlier map mystery reveal:** optional idea from P11; needs a concrete player-facing benefit and reveal rule.
- **More research rewards:** consider a tier beyond Masterwork, grade-5 refining, a Study upgrade or recipe naming; reconcile with the current technique tree before specifying.
- **Alternative essence rewards:** shrines, altars, alchemists, chests and peddlers give essences directly. Consider rewards that improve subsequent deconstruction instead.
- **Pattern-forging risk:** patterns currently use flat `SHAPE` XP and no failure roll. Consider skill-based risk for higher-grade materials only if it improves the crafting choices.
- **Animation/depth:** consider brief SVG anticipation, attack and recovery motions, body-specific idle motion and restrained biome ambience after silhouette work. Preserve reduced-motion support and game-randomness isolation. A 2.5D presentation is exploratory; full 3D has no scheduled task or agreed requirement.

## Housekeeping candidates

- Review merged local `feat/*` and `fix/*` branches for deletion.

## Known limits and retained decisions

- **Starter progression (M-10):** equip the tutorial Fire sword and learn Weaponcraft before exploring; no raw starter-stat buff. Historical Heat-0 smart runs won 6/6 Woods expeditions for seeds 1/7/11; the seed-1 Heat-3 starter rare row remained `RARE_HARD` (79%).
- **Affix/staff balance (M-09):** repaired Hollow staff armor; rare HP 1.45×; Regenerating 3% normally, 0.5% for rare foes at Heat 5+; authored self-healers exclude sustain affixes; regular rares gain a third affix at Heat 6. On baseline `4b0ef66` plus changes, seed-7/11 n=100 rarity samples had minimum stage-kit wins of 99%/88% at Heat 0/3 and no aggregate `SLOG`. Elite `TOO_EASY` cells increased by 3 arrival and 13 on-stage. These results supersede the removed M-09 plan's hypotheses.
- **Rift masters (M-11):** stored rare rarity and three compatible affixes apply once. The depth-1 profile tapers from 4.4× HP / 1.0× attack to 3.2× / 0.95× by depth 3. Historical seed-1 n=100 smart Heat-0 samples across eight biomes won 99.7%/96.5% at depths 1/3; three `SLOG` rows remained at each depth. Later biome/mechanic changes require a new baseline.
- **Wilds and alphas (M-12, V-16):** regional combat profiles and one alpha per generator-backed authored region are complete; Hollow melee alpha samples retain a roughly 34-turn `SLOG`. See [wild balance](balance-evidence/m12-review.md) and [alpha review](art-evidence/v16-alpha-review.md).
- **Current expansion:** 13 Rift biomes; 12 wilds per generator-backed authored region, 10 per Rift; Fen remains authored-only. Encounter weights preserve the old regional generated-foe share. See [roster measurements](balance-evidence/v10-roster.md).
- **Roles, factions, families and packs:** implemented, with residual deep-Rift difficulty and changed regional expedition attrition. V-18 depth-9 native-wild samples won about 52.6–52.8%; exact economy parity is not claimed. See [roles](balance-evidence/v17-enemy-roles.md), [factions](rift-evidence/v19-factions.md), [Water/Steam](rift-evidence/v20-water-steam.md), and [packs](combat-evidence/v18-multi-enemy.md).
- **Crafting:** save v18, technique gates, Crucible actions and research branches are complete. Recorded costs: Weaponcraft/Armorcraft 14 RP, Infusing 8, Improving 10; `DENSITY_RW` 0.65. Historical affordability and income estimates are limited by the bot's cheapest-technique policy and eight-visit cap; measure before retuning.

## Completed task index

All rows are **Done**. Keep IDs stable; detailed implementation remains in source, Git history and the evidence documents below.

### Monster coverage, balance and progression

| ID | Completed work |
|---|---|
| M-01 | Fill the missing body type in every biome |
| M-02 | Remove the duplicate region name |
| M-03 | Close authored element gaps |
| M-04 | Add wild creatures and Rift masters to the simulator |
| M-05 | Give each Rift-only biome a signature identity |
| M-06 | Promote Fen to a full region |
| M-07 | Boss coverage for missing elements |
| M-08 | Add non-affix sources for Steam essence |
| M-09 | Rebalance affixed foes and staff kits |
| M-10 | Tune the starter kit against magic/rare enemies |
| M-11 | Fix the Rift master's affixes and stat band |
| M-12 | Give the wild creatures a fight of their own |

### Biome variety and mechanics

| ID | Completed work |
|---|---|
| V-01 | Expand biome part pools from 6 to 8–10 |
| V-02 | Use the four orphan parts |
| V-03 | More patterns per biome |
| V-04 | Expand region-name pools |
| V-05 | Add a Tidewrack coast biome |
| V-06 | Add a Windcut crags biome |
| V-07 | Add a Radiant garden biome |
| V-08 | Add a Geyser field biome |
| V-09 | Add a Sporewood biome |
| V-10 | Increase seeded roster size |
| V-11 | Add per-biome special pools |
| V-12 | Make part pools body-aware |
| V-13 | Weight biome elements |
| V-14 | Add new enemy special kinds |
| V-15 | Add biome modifiers to the map |
| V-16 | Add one alpha wild creature per roster |
| V-17 | Introduce enemy roles |
| V-18 | Add multi-enemy encounters |
| V-19 | Add cross-biome factions |
| V-20 | Promote Water and Steam to full monster families |
| V-21 | Add seeded Rift depth modifiers |
| V-22 | Visual readability rules for enemies |

### Art identity and readability

| ID | Completed work |
|---|---|
| A-01 | Give animal species distinct silhouettes |
| A-02 | Give named equipment recognizable shapes |
| A-03 | Give Rift biomes distinct terrain art |
| A-04 | Match generated creature names to anatomy |
| A-05 | Verify creature visual hierarchy at gameplay sizes |

### UI

| ID | Completed work |
|---|---|
| U-01 | Grade pips and rarity frames |
| U-02 | Keep the Forge result summary and action visible |
| U-03 | Use one contextual ingredient picker per Forge task |
| U-04 | Make Inventory immediately accessible and readable |
| U-05 | Separate Inventory filters and explain empty results |
| U-06 | Open Codex on searchable creature knowledge |
| U-07 | Bound Codex card sizes on desktop |
| U-08 | Explain crafting actions with consistent outcome language |
| U-09 | Give item sheets a clear primary action |

### Crafting

| ID | Completed work |
|---|---|
| C-01 | Data: techniques, salvage skill, denser maps, save v18 |
| C-02 | Gating: `actionOk` |
| C-03 | Crucible actions |
| C-04 | Input effects |
| C-05 | Research view |
| C-06 | Density |
| C-07 | Sim and tuning |
| C-08 | Text and docs |

### Simulator

| ID | Completed work |
|---|---|
| SIM-01 | Make the expedition POI routing threshold configurable and measure fuller exploration |
| SIM-02 | Add selectable fresh-mode research purchase priorities and JSON output |
| SIM-03 | Use the equipped weapon and real research gates for fresh-mode essence crafting |
| SIM-04 | Compare 30 expedition samples across three seeds at POI limits 8 and 12 |

| ID | Scope and acceptance | Status |
|---|---|---|
| SIM-05 | Verify pack-aware fight dispatch in economy and fresh modes; correct it if needed; add a regression that observes real multi-foe fights using pack-smart; compare Heat-0 smart stage-melee economy samples (seeds 1/7/11, 30 expeditions per zone, limits 8/12) with SIM-04 and document exact revision, configuration, outcomes and policy caveats. No tuning. | Done |

### Localization

| ID | Scope and acceptance | Status |
|---|---|---|
| I18N-01 | Localize generated creature singular/plural names and Rift boss short names in German/Korean via finite biome-prefix and anatomy-compatible noun dictionaries; preserve canonical English names, RNG draw order, and save IDs; cover real locale rerender and Codex search; exclude generated lore, intros, regions, specials, and tells. | Done |

## Evidence and future task upkeep

- Art: [acceptance sheets](art-evidence/README.md); UI wording: [terminology](ui-terminology.md).
- Regions and economy: [Fen simulation](region-evidence/m06-fen-sim-seed1.txt), [boss elements](rift-evidence/m07-boss-elements.md), [Steam source](economy-evidence/README.md).
- Fresh research policies: [SIM-02 comparison](economy-evidence/sim02-research-policy.md).
- Fresh weapon infusion gates and SIM-03 measurements: [fresh infusion evidence](economy-evidence/sim03-fresh-infusion.md).
- Larger economy samples and SIM-04 visit-limit comparison: [exploration evidence](economy-evidence/sim04-exploration.md).
- Pack-aware economy comparison and regression: [SIM-05 evidence](economy-evidence/sim05-pack-economy.md), [regression script](tools/sim-pack-economy-check.js).
- Procedural creature name localization scope, acceptance, and verification: [I18N-01](docs/procedural-name-localization.md); [browser regression](tools/procedural-name-check.js).
- Rift biome additions: [Tidewrack](rift-evidence/v05-tidewrack.md), [Windcut](rift-evidence/v06-windcut.md), [Garden](rift-evidence/v07-garden.md), [Geyser](rift-evidence/v08-baseline.md), [Sporewood](rift-evidence/v09-sporewood.md).
- Combat foundations: [biome identity](rift-evidence/m05-identity.md), [specials](combat-evidence/v14-specials.md), [biome special pools](rift-evidence/v11-biome-specials.md), [element weights](rift-evidence/v13-element-weights.md), [map modifiers](rift-evidence/v15-biome-modifiers.md), [depth modifiers](rift-evidence/v21-depth-modifiers.md).
- Design references: [roles](docs/enemy-roles.md), [factions](docs/enemy-factions.md), [multi-enemy encounters](docs/multi-enemy-encounters.md). Evidence files remain supporting records, not separate task queues.

Before scheduling an idea, add an ID, scope, acceptance criteria and status here (`Planned`, `In Progress`, or `Done`). Record completion briefly and link durable evidence. For balance measurements, include revision, seed, kit, policy, Heat and sample size. Generator pool or RNG changes can reroll rosters; refresh seeded wild measurements after such changes. Use the README for simulator commands and setup.
