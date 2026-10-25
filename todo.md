# Everforge — ideas backlog

Ideas discussed but not yet scheduled.

## World and monsters
- **Composable monster art + more base monsters (done).** Bodies per family with overlay parts and affix marks (`BODY`/`PART`/`AFX_ART` in `js/art/`); 12 new regular enemies, six per region. Follow-ups: every new creature can be mastered for `RP.mast`, so 24 more RP is available over a career; watch the research pace. Staff kits are weakest against the Fallen Seraph and Orrery Construct at Heat 5 (78% win arriving at the Spire), in line with the staff note under Balance.
- **Wild creatures per region (done).** Every region has ten creatures rolled from its biome (`js/monsters.js`): a body and parts from the theme, an element, a name from the biome's words, and one or two affixes of their own. They are rare-grade (so they show a frame on the map) but their affixes are their own: no extra essence, no elite embers, so a region's economy does not move, and their stats land on the region's band. Follow-ups: they are about 40% of a region's encounters, so re-run `tools/sim.js` for every region (the wild creatures are not in the enemy's list; pick them by hand or add a `--wild` flag). Their names are English only (no dictionary entry per name): a translation pass would need a rule per biome instead of a line per creature.
- **The Wanderer's Rift (done).** A random region past the Spire: a biome, a palette, a name, ten wild creatures and a master with three affixes, rolled from one seed that lives in the save (a reload shows the same region). Descending goes one depth deeper (18% HP and 12% Attack per depth); the best depth is the record. Follow-ups: the Rift is a score mode, so the tiers cap at 9 and the Smith level at 10; it has no Heat, no daily and no renown of its own yet. A save bump (v16) came with it.
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
