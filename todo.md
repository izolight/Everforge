# Everforge — ideas backlog

Ideas discussed but not yet scheduled.

## World and monsters
- **Composable monster art + more base monsters (done).** Bodies per family with overlay parts and affix marks (`BODY`/`PART`/`AFX_ART` in `art.js`); 12 new regulars, six per region. Follow-ups: every new creature can be mastered for `RP.mast`, so 24 more RP is available over a career; watch the research pace. Staff kits are weakest against the Fallen Seraph and Orrery Construct at Heat 5 (78% win arriving at the Spire), in line with the staff note under Balance.
- **Endless Rift (infinite maps).** Unlocks after the Spire. Procedural regions: biome templates (palette, terrain mix, monster families) rotating by depth; HP/attack curve past depth 4 tuned with `tools/sim.js`. Item tiers cap at 9 and smith level at 10, so treat it as a score mode: best-depth record, renown, rising grade odds rather than rising tiers. Needs a save bump.
- **New hand-made regions.** Each region is about one piece: 3–4 enemies, a boss with phases, palette, terrain mix, essences.
- **Earlier mystery reveal** on the map (optional idea from P11).

## Balance
- **Trait stacking soft cap.** The min-max `stacked` kit still breezes through Heat 5 (spire/Archon 100% smart, 82% HP left). A cap on stat-from-trait would rescale every existing item, so it needs a decision.
- **Starter sword vs Gnarlhorn.** Without the tutorial's Fire weapon, basic play wins about 8%. The tutorial forges a Fire weapon first (100% win), so it was left alone; easing Gnarlhorn slightly would fix it.

- **Affix balance leftovers (from A1).** Staff kits are weakest against affixed foes: rare at Heat 3 is 83% for staff/pass and 59% for staff/hollow, and magic Volatile/Warded/Burning are 74-76% on staff kits. Defensive kits against rares at Heat 5 run about 31 turns (SLOG line 30). The starter kit loses to magic and rare enemies.
- **New essence sources.** Wood, Heavy, Runic, Light and Steam only come from affix drops and salvage, never from the peddler, chests or shrines. Decide whether that's intended.

## Research (from G2)
- **RP pacing (done in G2 review).** A career bot over 20 expeditions found 7 of 9 techniques affordable on expedition 1 and income gone by expedition 5, so salvage RP was dropped, forms pay 2, bosses 4/8/12/16 by region, Smith levels 2-9 and skill levels 3/5/7/9 pay 2 each, and costs rose (Layering 6 ... Precision I 20). Watch it in play; move `RP` and the `TECHS` costs, not the code.
- **More to spend RP on.** Everything in the tree is a gate. Ideas: a second tier past Masterwork (a fifth trait-slot technique, grade 5 refining), a Study upgrade, naming recipes.
- **Recipes tab and tech gates.** Loading a recipe in the crucible does not check techniques (a veteran knows them all, a newcomer only has recipes they forged); an imported save could show it.

## Housekeeping
- Delete the merged local `feat/*` and `fix/*` branches.
