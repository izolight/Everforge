# Everforge — ideas backlog

Ideas discussed but not yet scheduled.

## World and monsters
- **Composable monster art + more base monsters.** Every enemy is a hand-drawn inline SVG. Option A: hand-draw more (3 → ~6 regulars per zone). Option B (preferred): composable art — a body per family (beast, undead, construct, elemental, humanoid) tinted by affix colour plus overlays (horns, auras, armour), so new variety is nearly free.
- **Endless Rift (infinite maps).** Unlocks after the Spire. Procedural regions: biome templates (palette, terrain mix, monster families) rotating by depth; HP/attack curve past depth 4 tuned with `tools/sim.js`. Item tiers cap at 9 and smith level at 10, so treat it as a score mode: best-depth record, renown, rising grade odds rather than rising tiers. Needs a save bump.
- **New hand-made regions.** Each region is about one piece: 3–4 enemies, a boss with phases, palette, terrain mix, essences.
- **Per-type map icons.** All map enemies use the crossed-swords icon; chasers and wanderers are only told apart by the "!" badge.
- **Hollow third enemy.** Cinder Hollow has only two regular enemies, so none stand still.
- **Earlier mystery reveal** on the map (optional idea from P11).

## Combat
- **Guard/Parry rework.** Today parry (80%, negates the special and ripostes 1.5x) beats guard (−60%) on telegraphed specials in expectation. Proposal:
  - Guard is always reliable and also blocks the status from the hit, and grants "Braced" (+30% damage on your next attack).
  - Parry is skill-based: base ~65%, + per study level of that enemy's special, + SPD or weapon form (daggers/spellblades better, heavy worse), cap ~90%, always shown on the button.

## Balance
- **Trait stacking soft cap.** The min-max `stacked` kit still breezes through Heat 5 (spire/Archon 100% smart, 82% HP left). A cap on stat-from-trait would rescale every existing item, so it needs a decision.
- **Starter sword vs Gnarlhorn.** Without the tutorial's Fire weapon, basic play wins about 8%. The tutorial forges a Fire weapon first (100% win), so it was left alone; easing Gnarlhorn slightly would fix it.

- **Affix balance leftovers (from A1).** Staff kits are weakest against affixed foes: rare at Heat 3 is 83% for staff/pass and 59% for staff/hollow, and magic Volatile/Warded/Burning are 74-76% on staff kits. Defensive kits against rares at Heat 5 run about 31 turns (SLOG line 30). The starter kit loses to magic and rare enemies.
- **New essence sources.** Wood, Heavy, Runic, Light and Steam only come from affix drops and salvage, never from the peddler, chests or shrines. Decide whether that's intended.

## Housekeeping
- Delete the merged local `feat/*` and `fix/*` branches.
