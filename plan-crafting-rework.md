# Crafting rework · gradual research, clear crucible actions, denser regions

Files: `js/data.js` (TECHS, UNLOCKS, RP, POI_N, SKILLS, TUTORIAL), `js/research.js`, `js/crafting.js`, `js/render/forge-view.js`, `js/render/gear-view.js` (salvage), `js/map.js`, `js/battle.js` (drops), `js/state.js` (new save version), `js/lang/*`, `tools/sim.js`, docs (`README.md`, `tasks.md`, `todo.md`).

Old saves do not need to keep working: bump the save version and start fresh. No migration code.

**Done when**
- A new game can only salvage. Every other crafting action is opened by a technique in Research.
- The forge has five separate actions (Forge, Infuse, Improve, Fuse, Refine), each with its own slot layout. The crucible always says which action it is doing and what each input changes.
- Each region map has about twice as many fights. Embers, materials and XP for a whole expedition stay within ±10% of today (checked with `tools/sim.js`). Research points per expedition go up.
- The new player's path is covered by intro cards: salvage → first technique → first forge → infuse → the rest.

---

## 1. Today (for reference)

- **Research** (`TECHS`, data.js:439) is a 4×4 tree. Binding is free and the rest are bought with RP: Layering, Compounding, Mending, Refining, Tempering, Alloying, Precision I/II, Masterwork. `craftMiss` (research.js) works out which techniques a crucible needs *after* the inputs are placed. That is why players can't tell what they are doing.
- **Patterns** unlock as soon as you deconstruct something (UNLOCKS `patterns`). Every slot can be forged right away.
- **Skills** (`SKILLS`, data.js:377) already exist per category: weapon, shield, helm, body, gloves, boots, trinket, cooking, brewing, alchemy. Each levels with use and caps the tier you can make (`SK_CAP`).
- **RP** (`RP`, data.js:437) comes only from first-time discoveries, such as a new form, recipe, reaction, essence, study, mastery, boss, affix or Smith level. Mastery comes from codex knowledge, which grows with fights and study.
- **Regions** have 7–8 hand-made creatures, 10 generated wild creatures (`GEN_N`, monsters.js) and a boss. Maps place 5–7 fights and 1–2 elites (`POI_N`, data.js:336).

## 2. Technique tree

Every technique is a node with `cost`, `pre`, an optional `rq` (Smith or skill level) and an intro card `i`. RP costs are a first guess; tune them with the sim in step 7.

### 2.1 Tier 0: what you start with
- **Salvage**: always on. Gets a visible skill, *Salvaging*, that levels with use. Any item can be salvaged at any level: input is never limited, so the bag can always be cleared. The level sets **output quality** instead:
  - Yield: +1 base material at Lv 3 and Lv 6.
  - Grade: salvaging an item above your cap (`SK_CAP[lv-1]`, the same table the crafting skills use) gives materials one grade lower than the item's. At or under the cap you get the full grade.
  - Essence: the chance to get the affix essence rises with level (about 40% at Lv 1 to 100% at Lv 6), replacing the flat roll.
  - Salvaging above your cap gives more skill XP (a reason to try).
  - The salvage preview shows what you get now and what you would get at the cap.
- Nothing else. The Forge tab shows the Research panel and a locked row for each action, using `lockRow`.

### 2.2 Gear branch
| Technique | Cost | Needs | Opens |
|---|---|---|---|
| Weaponcraft | 3 | — | Group technique. Makes weapon slot techniques half price, and includes **one** weapon form of your choice for free. |
| Armorcraft | 3 | — | The same for armor: helm, body, gloves, boots, shield. |
| Trinketry | 6 | Weaponcraft or Armorcraft | Charms |
| Slot techniques (Bladecraft, Spearcraft, Staffcraft, Helmcraft, Bodycraft, Glovecraft, Bootcraft, Shieldcraft) | 6 each, 3 with their group | the group technique | Patterns and blueprints for that slot. A blueprint for a slot you don't know shows as locked, with the technique's name. |

The free pick in each group (decided: a free slot, not a cost-1 slot) means the first forge happens within the first expedition or two. The skill for each slot stays as it is (it levels with use and `SK_CAP` gates the tier).

### 2.3 The forge actions
| Technique | Cost | Needs | Action |
|---|---|---|---|
| Infusing | 8 | any slot technique | **Infuse**: one item and one essence. Covers all slots you know now and learn later. Replaces Binding. |
| Infusing II | 14 | Infusing, Smith Lv 3 | Two essences per infusion. Replaces Tempering for essences. |
| Infusing III | 24 | Infusing II, Smith Lv 5 | Infuse an already infused item (stacking). Replaces Layering. |
| Improving | 10 | any slot technique | **Improve**: an item plus materials (ore, hide, herb, relic). Replaces Compounding. |
| Improving II | 18 | Improving, Smith Lv 3 | More materials in one go, as far as the crucible slots allow. |
| Fusing | 20 | Improving and both slot techniques of a fusion | **Fuse**: two items into a new form (spear + shield → lance). Replaces Alloying. A fusion shows in Recipes only once both of its slots are known. |
| Refining | 12 | Salvaging Lv 2 | **Refine**: three of one grade → one of the next. |
| Mending | 12 | Infusing or Improving | Reforge a flawed item. |
| Precision I / II | 20 / 30 | Mending | Lower failure odds. |
| Masterwork | 40 | Fusing, Infusing II | Legendary secrets. |

### 2.4 Kitchen and still
| Technique | Cost | Needs | Opens |
|---|---|---|---|
| Cooking | 4 | — | Food: ingredients only, its own simple crucible |
| Brewing | 6 | — | Potions and elixirs |
| Alchemy | 8 | Brewing or Infusing | Make essences and materials. Same role as today's alchemy forms. |

Cooking and Brewing are cheap and independent, so a player who is struggling in fights has an early way to sustain themselves.

### 2.5 Tree view
The tree grows from 10 nodes to about 25. Replace the fixed 4×4 grid (`renderResearch`, W=4/H=4) with branch columns (Gear · Forge actions · Kitchen) that scroll vertically. Node positions stay `pos:[col,row]`, with W and H taken from the data.

## 3. The crucible: one action at a time

### 3.1 Choosing the action
- A row of action tabs sits above the crucible: **Forge · Infuse · Improve · Fuse · Refine** (plus Cook and Brew when those are known). Locked actions show a lock and the technique that opens them.
- Choosing an action sets the slot layout and filters the bench to inputs that fit:
  - Forge: a pattern or blueprint, with material slots by role (as now in `#patp`).
  - Infuse: `[item] ← [essence]` (two essence slots with Infusing II).
  - Improve: `[item] ← [material] [material]…`
  - Fuse: `[item] + [item] → [form]`, showing the target form as soon as one side is placed.
  - Refine: `[3× same grade] → [next grade]`.
- An input that doesn't belong can't be dropped in, and the tooltip says why ("Essences go in Infuse"). `craftMiss` stays as a guard but should never fire from the UI.
- Picking an item in the Gear tab offers buttons straight into the matching action ("Infuse…", "Improve…", "Salvage").

### 3.2 Seeing what each input does
`combine()` (crafting.js:55) already returns `log`, `diff`, `inst`, `gap`, `fail`, `fiz` and `mis`. The work is mostly display (`forge-view.js`):
- **Header**: the action and the result in one line, for example "Infusing · Iron Helm ← Fire essence → Iron Helm of Embers".
- **Before → after**: the base item's stats and traits next to the result's. Each change carries a small chip in the colour of the input that caused it. Track the source per trait in `combine()`: add `src` to each `log` entry if it isn't there yet.
- **Reactions** show as their own line linking the two inputs ("Fire + Water → Steam, −1 stability").
- **Risk breakdown**: the failure chance as a stacked bar with base, tier over skill, each conflict, each extra input, and Precision. Hovering an input highlights its share.
- **Empty states** teach: an empty Infuse crucible reads "Put in an item you want to strengthen, then an essence. Essences come from salvaging affixed materials."

### 3.3 Feedback after the craft
The result card keeps its current layout but adds the same per-input chips, so the player sees once more which input did what.

## 4. Denser regions

The goal is more fights, so mastery, study and affix discoveries (and the RP they pay) come faster, while the loot from a whole expedition stays the same.

- `POI_N.fight` goes from `[5,3]` (5–7) to `[10,4]` (10–13), and `POI_N.elite` from `[1,2]` to `[2,2]`. Check that the 13×17 grid still leaves room for paths. If not, raise `GRID.h` by 2–3 rows.
- **Per-fight rewards** are multiplied by about 0.55 (embers, material drop chance, smith XP from fights) through one constant `DENSITY_RW` in data.js, so totals per expedition stay flat. Boss rewards and first-kill RP are unchanged.
- **Torch** (`TORCH.max` 40): more fights mean more detours. Raise it only if the sim shows torch-outs going up by more than a few points.
- **Roaming**: with twice as many movers, check how often a creature catches up with you (`roam`). Cap roamers that act per step at about 6 if the map gets too busy.
- **Mastery**: codex knowledge per fight stays the same, so mastery comes in about half the expeditions, which is the intended source of extra RP. `RP.mast` is unchanged.
- **Variety**: each map draws its fights from the full 18-kind pool, weighted towards kinds you haven't mastered yet. That way a denser map also turns up new creatures sooner.

## 5. Early-game flow (intro cards)
1. Start: the map card, as now.
2. First material picked up → **Salvage** card (Gear tab): deconstruct for base materials, embers and sometimes an essence.
3. Research opens at the first RP. If the first salvage doesn't already pay RP, add a one-time "first salvage" reward of 2 RP. The card points at Weaponcraft/Armorcraft.
4. First slot technique → **Forge** card on the pattern list.
5. First essence picked up while Infusing is unknown → a hint toast: "Research Infusing to bind this into gear".
6. Every later technique has its own card pointing at its action tab (`sel` set to the tab).

Remove UNLOCKS `patterns` (patterns now come with slot techniques). `blueprints` stays, but only lists blueprints for known slots.

## 6. Steps
1. **Data**: new TECHS list, SKILLS gets `salvage`, `RP.salvage`, `POI_N`, `DENSITY_RW`, save version bump. Delete the old Binding/Layering/Compounding/Tempering/Alloying.
2. **Gating**: `craftMiss` becomes `actionOk(action, inputs)`. Patterns, blueprints, Recipes and the Gear-tab buttons check slot techniques.
3. **Crucible actions**: action tabs, a slot layout per action, bench filtering (forge-view.js).
4. **Input effects**: per-input `src` in `combine()`, the before/after diff with chips, the risk bar.
5. **Research view**: branch layout, about 25 nodes, intro cards for each.
6. **Density**: POI_N, the reward multiplier, the weighted spawn pick, the roamer cap.
7. **Sim and tuning**: `tools/sim.js` reports RP, embers, materials and XP per expedition, plus the expedition count until each technique is affordable. Target: the first slot technique after expedition 1, Infusing by expedition 3–4, Fusing around the second region.
8. **Text and docs**: `js/lang/*`, the Codex Guide order, README, tasks.md.

## 7. Decisions
- Weaponcraft/Armorcraft include one free slot.
- Salvaging limits output quality only (grade, yield, essence chance), never which items can go in.
- All fights stay full fights (no skirmish tier): today's maps feel too short, so 10–13 fights is the goal, not a risk.
