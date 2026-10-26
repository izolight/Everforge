# Everforge — ideas and playtest watchlist

For scoped work, status and dependencies, use [tasks.md](tasks.md). Finished work and its evidence live in [backlog-completed.md](backlog-completed.md). This file holds undecided ideas and observations; none is an active assignment. Promote an idea to a task with an ID, scope and acceptance criteria before scheduling it.

## Already tracked elsewhere

| Topic | Canonical tasks |
|---|---|
| Starter difficulty | M-10; M-09 affix/staff balance is complete ([evidence](backlog-completed.md#m-09)) |
| Rift masters and wild creature strength | M-11, M-12, V-16 |
| Steam essence availability | M-08; Heavy, Runic and Light already have deconstruction sources. Wood has a boss-only non-affix source. |
| More authored regions and biome identity | M-05, M-06, V-11 |
| Species silhouettes, equipment shapes, terrain, creature names, visual hierarchy | A-01–A-05 |
| Completed creature composition, wild rosters, element coverage, Rift, crafting rework | [Completed backlog](backlog-completed.md); no follow-up to add `--wild` or save migration remains. |

## Playtest and measurement watchlist

These observations need fresh evidence on the current build; they do not reopen the completed crafting rework.

| Area | What to check | Possible follow-up |
|---|---|---|
| First forge and research pace | Does waiting for the first slot technique feel too long? Weaponcraft/Armorcraft cost 14 RP, Infusing 8, Improving 10 in the completed rework. | Adjust `TECHS` costs after playtesting; coordinate starter changes with M-10. |
| Bot priorities | `--fresh` buys the cheapest technique first, so kitchen techniques precede gear. | Compare a gear-first policy with actual player choices before drawing pacing conclusions. |
| Fusing timing | `--fresh` only plays the Woods, so the intended second-region timing is unmeasured. | Extend the sim into the Pass or check in play. |
| Expedition visit cap | `walkExped` stops after eight visits and misses some dense-map rewards. | Measure fuller exploration before retuning `DENSITY_RW`. |
| Roaming ambushes | Denser maps increased encounters initiated by roamers in the recorded run. | Add a movement cap only if play shows excessive ambushes; the tried cap of six had no measurable sim effect. |
| Essence/material income | Compare reward pace across zones and seeds, especially Spire salvage essences. | Retune `FRAG`/drop chances only after current economy measurements. |
| Regional material coverage | Pass lacks local Timber; Hollow/Spire lack local Leather. Earlier zones supply these. | Decide whether every region should supply every material type. |
| Trait stacking | Earlier runs found stacked kits very strong at Heat 5. | Decide whether a soft cap is desirable; it would rescale existing items. Remeasure before specifying it. |
| Roster coverage | Spire has six authored regulars; the other regions have seven. The Woods' stag is also weak to Stone. | Check whether the asymmetry and Stone-kit matchup warrant changes. |

## Unscheduled ideas

- **Procedural name localization:** generated creature names remain English. Translate biome/body word lists and composition rules rather than adding a dictionary entry per creature; coordinate with A-04.
- **Rift progression:** consider Heat, daily participation or renown beyond depth records. The recorded tier/Smith caps are 9/10; review the progression purpose before expanding it.
- **Earlier map mystery reveal:** optional idea from P11; needs a concrete player-facing benefit and reveal rule.
- **More research rewards:** consider a tier beyond Masterwork, grade-5 refining, a Study upgrade or recipe naming; reconcile with the current technique tree before specifying.
- **Alternative essence rewards:** shrines, altars, alchemists, chests and peddlers give essences directly. Consider rewards that improve subsequent deconstruction instead.
- **Pattern-forging risk:** patterns currently use flat `SHAPE` XP and no failure roll. Consider skill-based risk for higher-grade materials only if it improves the crafting choices.
- **Animation/depth:** consider brief SVG anticipation, attack and recovery motions, body-specific idle motion and restrained biome ambience after silhouette work. Preserve reduced-motion support and game-randomness isolation. A 2.5D presentation is exploratory; full 3D has no scheduled task or agreed requirement.

## Housekeeping candidates

- Review merged local `feat/*` and `fix/*` branches for deletion.

## Historical crafting measurements

The notes below were recorded when C-01–C-08 completed. They explain the chosen tuning; they are not measurements rerun during backlog cleanup. Pre-v18 RP pacing and starter/Gnarlhorn estimates have been superseded by the current watchlist and M-10. Recipe technique gating was implemented in C-02, so the older imported-save concern is no longer an open item.

<details>
<summary>Recorded crafting-rework results and limitations</summary>

- **Densities and what the sim says.** `DENSITY_RW` is 0.65, not the plan's 0.55: the sim's expedition walk stops after eight points of interest, so a dense map gives about 30% more fights (7.8 to 10.2 in the Woods), not twice as many, and 0.55 lost about 15% of the embers. Four seeds, 200 expeditions each: embers -4% to -6% per zone, embers with salvage -1% to -3%, materials +1% to +3%, essences from salvage +2% to +6%. Torch-outs fall. Smith XP stays at zero from fights (no fight gives XP; only heat spoils, bounties and dailies do), so nothing scales there.
- **Visit cap.** `walkExped` in `tools/sim.js` stops at eight visits, which hides part of the new fights. Raising it shows the full value of the dense maps, but the embers and materials targets would need `DENSITY_RW` retuned.
- **Ambushes.** Caught-by-roamer rises from about 1.0 to 1.9 per expedition (13% to 19% of fights). A cap of six movers per step made no measurable difference in the sim, so none was added. Add `ROAM.act` if play shows too many ambushes.
- **Fusing timing is unmeasured.** The `--fresh` sim plays the Woods only (the starter kit seldom beats Gnarlhorn), so "Fusing around the second region" cannot be checked. In that run Fusing is affordable from expedition 9 at cost 20 (with Improving's chain). Check it in play, or make `--fresh` continue into the Pass.
- **Research pace.** Weaponcraft and Armorcraft cost 14 (the first slot technique is affordable from expedition 2 or 3 across four seeds, not expedition 1), Infusing 8 (from expedition 2 to 5 across four seeds), Improving 10. Research per expedition in the Woods: mean 1.9 before, 2.1 after (30 expeditions, seed 7). Watch whether 14 RP for a group feels too long to wait on the first forge, and move the `TECHS` costs, not the code.
- **Cheap techniques are bought first.** The `--fresh` bot buys the cheapest technique it can afford, so Cooking and Brewing come before the gear in its path. A real player may prefer the gear, which the intro cards point at.
- **Essences from salvage in the Spire** came out about 16% above the old values on seed 7 over 30 expeditions (within 5% on average). Check it if the Spire's essence feels generous.

</details>
