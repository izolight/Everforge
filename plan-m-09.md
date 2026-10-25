# M-09 · Rebalance affixed foes and staff kits

`tasks.md` M-09 · Size M. Files: `js/data.js`, `js/affix.js`, plus `tools/sim.js` (the measurement and one kit) and the docs (`README.md`, `todo.md`, `tasks.md`).

**Done when**
- Every stage kit (`melee`, `defensive`, `staff` at woods/pass/hollow) wins over 85% against magic and rare foes at Heat 0–3 with `smart` play in `node tools/sim.js --rarity`. In other words, no `RARE_HARD` row for a stage kit.
- No `SLOG` row (mean turns over 30, any policy, any Heat) in the rarity table.
- The rarity table and the numbers in the README, `todo.md` and `tasks.md` match the new data.

The starter kit is not a stage kit and now has its own task, **M-10**. See "Out of scope".

---

## 0. Related tasks in `tasks.md` (from main)

- **M-04 · Add wild creatures and Rift masters to the simulator** (`tools/sim.js`, In Progress, Worker B; it comes before M-09). It overlaps step 1. It wants wild creatures run "through normal/magic/rare", but rarity does nothing to a wild creature (§1.1). Agree with M-04 that `--rarity` leaves `w_*` out, and that M-04 reports them in a section of its own. If M-04 lands first, rebase step 1 onto it rather than adding a second wild filter.
- **M-03 · Close authored element gaps** (In Progress). It swaps or adds enemies in the woods, pass and hollow rosters, which changes the arrival-zone enemy lists. Re-run step 5 after M-03 merges. The enemies that matter here are the healers (Witch, Orrery, Sprite, Briarling) and the slow ones (Stone Golem, Witch, Orrery).
- **M-10 · Tune the starter kit against magic/rare enemies**. The starter rows that stay flagged after M-09 belong there.

## 1. Research findings

The numbers below come from `node tools/sim.js --rarity --seed 7 --n 100`, re-run on `d71a352` after merging main (the drops/crafting rework, save v17). That rework changes drops and crafting, not combat. The results match the pre-merge run to within a point or two. The kit items the sim uses (`leather_cap`, `iron_helmet`, `stone_plate`, `shroud`, `oak_staff`) all still exist, and the kits report `kit warnings: 0`. Raw outputs are in `/tmp/m09/` (scratch, not committed).

### 1.1 The rarity table counts wild creatures, which never change with rarity (a measurement bug)

`--rarity` builds its cells from every non-boss enemy in the arrival zone. That includes the ten wild creatures (`w_<zone>_0..9`) per region. A wild creature always brings its own affixes: `startBattle` → `speciesAfx(E)` wins over `opt.rar`/`opt.afx`. So its "normal", "magic" and "rare" cells are the same fight. That is 10 of 15–16 enemies per row, all at about 95–100%. They pull every magic and rare row up toward the normal row and hide the real affix problem.

| smart, Heat 3 | as printed today | without wild creatures |
|---|---|---|
| staff/hollow, rare | 83% `RARE_HARD` | **57%** |
| staff/hollow, magic | 91% | **78%** `RARE_HARD` |
| staff/pass, rare | 93% | **84%** `RARE_HARD` |
| melee/hollow, rare | 95% | 89% |

The "without" column matches the old A1 note in `todo.md` (staff/hollow 59%), from before the wild creatures existed.

Two wild creatures also distort the SLOG flags, and they still do on `d71a352`. `w_hollow_2` and `w_hollow_8` fight `defensive/pass` to a **0% / 150-turn stalemate** under the `basic` policy (and under `passive` before the merge), at every rarity. Smart play wins. Those two cells alone add about 19 turns to the row mean, and they are the only reason `defensive/pass basic|passive` shows `SLOG` in the printed table. This is a real bug, but it belongs to the wild-creature roster, not to affixes (see Out of scope).

### 1.2 The staff/hollow kit wears worse armor than staff/pass (a kit authoring issue)

| kit | HP | DEF (reduction) | helm / body |
|---|---|---|---|
| staff/pass | 73 | 38 (43%) | `iron_helmet pelt` / `stone_plate pelt` |
| staff/hollow | **64** | **24 (32%)** | `leather_cap shroud` / `jerkin shroud ess:Arcane` |
| staff/hollow, fixed | 75 | 41 (45%) | `iron_helmet shroud` / `stone_plate shroud ess:Arcane` |

A stage kit is meant to be "what a player plausibly owns when they finish that zone". Nobody drops back from an iron helmet and stone plate to a leather cap and jerkin. After the drops rework this armor still comes within reach by the Pass: monsters no longer drop gear, but the `helm` and `chest` patterns forge `iron_helmet` from Iron Ingots (Scrap Iron) and `stone_plate` from Golem Stone (Golem Cores), and both raws drop in the Pass. The fix keeps the shroud (and its shadow resist) and the Arcane infusion, so the build idea stays the same. It reports `kit warnings: 0` and uses no extra essence.

Effect with only this change: staff/hollow at Heat 3 goes from **57% to about 89%** against rares (n=60 before the merge) and from 78% to about 98% against magic. On the merged code the full table at n=100 confirms it: both staff/hollow `RARE_HARD` rows go away.

A game-side alternative does not work. Raising the staff form's `m.def` in `BASE` (`.4` → `1`) left the kit at DEF 24 and changed nothing, because the kit's weakness is its armor, not the staff. Fixing this through `data.js` alone would mean a large, global staff buff tuned around a kit no player would build.

### 1.3 What makes affixed fights hard or slow

Win% by first affix, all stage kits, smart, rare, Heat 3, without wild creatures (`d71a352`):

```
fire 78  ice 100  poison 80  holy 92  shadow 93  iron 91  swift 91  arcane 96
vamp 94  thorn 92  regen 90  frenzy 87  ward 87  elusive 94  split 97  boom 88  swiftfoot 88
```

- **Burning and Venomous** are the worst for every kit. `ELITE_INF_CH` gives a 25% status chance, ×1.5 from Heat 3 (`HEAT_T.inf`) and ×2 on specials. Burn deals 20% of Attack per turn and poison stacks.
- **Volatile, Frenzied and Vampiric** mostly hurt the low-HP staff/hollow kit (25%, 50% and 53% before the kit fix). After the kit fix they are no longer outliers.
- **Slogs come from sustain affixes.** Mean turns by affix for the slowest matchups (Heat 3, rare, smart, n=120, before the merge):

| matchup | overall | worst affixes |
|---|---|---|
| staff/pass vs Nightshade Witch | 68%, 41.6t | Warded 71t, Regenerating 68t |
| defensive/pass vs Witch | 95%, 36.0t | Regenerating 81t, Warded 61t |
| defensive/woods vs Stone Golem | 98%, 40.7t | Regenerating 74t, Warded 62t |
| defensive/hollow vs Orrery | 100%, 31.0t | Warded 54t, Regenerating 53t |

- **Self-healing species plus sustain affixes stack badly.** The Witch (`Hex Brew`, 25% max HP every 3 turns) with Regenerating (3% per turn) or Warded (20% ward that comes back after 3 turns) out-heals a staff or defensive kit. Rarity also scales the heal, because the heal is a share of max HP. Five species have a `kind:"heal"` special: Glowcap Sprite, Briarling, Nightshade Witch and Orrery Construct in `data.js`, and the `Mend` special in `monsters.js` `GEN_SP` for wild creatures.

### 1.4 Levers tried

All on top of the kit fix unless noted, n=60, smart, before the merge. Rows are staff/pass and staff/hollow, rare, Heat 3, plus the remaining matchups over 30 turns at Heat 0–3.

| experiment | staff/pass | staff/hollow | enemy cells >30t at H0–3 |
|---|---|---|---|
| kit fix only | 84% (witch 42t) | 89% | golem 41t, witch 36t, orrery 31t |
| `ELITE_INF_CH` .25→.15 (without kit fix) | 85% | 54% | — |
| Volatile capped at 20% of *your* max HP (without kit fix) | 82% | 60% | — |
| + `AFX_T.regen` .03→.02 | 87% | 91% | golem 34t, witch 32–35t |
| + `AFX_T.ward.every` 3→5 | 86% | 91% | no better (noisy) |
| + `RARITIES.rare.hp` 1.55→1.4 | 85% | 92% | golem 36t, witch 32t |
| + healers never roll sustain affixes | 85% (witch 29t) | 89% | golem 41t |
| **+ healer rule + regen .02 + rare hp 1.45** | **89%** (witch 24t) | **92%** | golem 32t |

---

## 2. Changes

### Step 1: Fix the rarity table measurement (`tools/sim.js`; coordinate with M-04)

1. Mark wild creatures in the `enemiesAll` list (`wild:!!(e.afx&&e.afx.length)`) and leave them out of the `--rarity` cells (`!e.wild`). Rarity cannot change them, so they say nothing about rarity. The normal matrix keeps them, and M-04 owns how they are reported.
2. Print a "slowest enemy" note per flagged row, or add a per-enemy `SLOG` list under the table. This turns "rare fights slog past 30 turns" into something you can see without digging through `--out` JSON.
3. Record turns per first affix in `SIM.cells` (`ba[a]=[n,wins,turns]`) and print mean turns next to win% in the "By first affix" lines.
4. Stop duplicating the affix pool. `SIM.afxFor` rebuilds the pool `rollAfx` uses (the `roam` filter). Move that into an `afxPool(E,mv)` helper in `affix.js` (step 3) and call it from both, so the sim cannot drift from the game.
5. Update the `--rarity` paragraph in the README: wild creatures are left out, and the new columns.

Re-baseline after this step. Expected flags (as measured on `d71a352`): staff/pass rare, staff/hollow magic and rare (`RARE_HARD`), the two starter rows, and `defensive/woods basic rare` `SLOG` (32.8t at Heat 5). The old `defensive/pass` SLOG rows go away because the stalemate creatures are no longer counted.

### Step 2: Fix the staff/hollow kit (`tools/sim.js` `KITS.staff.hollow`)

```diff
-["head","helm","leather_cap shroud"],["body","body","jerkin shroud ess:Arcane"]
+["head","helm","iron_helmet shroud"],["body","body","stone_plate shroud ess:Arcane"]
```

Update the comment on the staff kit line to "lighter armor than melee, never lighter than the previous stage". Check that `kit warnings: 0` and that `ess` stays within `ESS_BUDGET.hollow`. **Decision for you** (see §5).

### Step 3: Self-healing species never roll sustain affixes (`js/affix.js`)

- Add `afxPool(E,mv)` = the current `roam` filter, plus: if the species' special is a heal (`E.sp&&E.sp.kind==="heal"`), leave out every affix in group `sustain` (Vampiric, Regenerating, Warded).
- `rollAfx(R,rar,o)` gets the species through `o.e` (an id). `rollFoe` passes `o.e` through. Callers that have the id: `map.js:54` (`nd.e`), `:57` (`p.e`), `:81` (`e`), `:121` (`nd.e`), and `battle.js:19` (`id`). Check the line numbers again before editing; main moved code around.
- **Do not pass `e` from `monsters.js:88`** (`genRoster` / the Rift master). Rosters are rebuilt at every load from `rng(hash("wild:"+zone))`. A smaller pool would use the rng differently and quietly change every region's wild creatures and the saved Rift's master. Leave a short comment there saying why.
- Update the comment above `afxOk` (the roll rules) and the README affix paragraph ("Two affixes never combine when..."): "a species that heals itself never rolls Vampiric, Regenerating or Warded."
- Saves: POIs keep the affixes they already rolled (`p.rar`/`p.afx`), so an existing map can still hold a Regenerating Witch. No save version bump (v17 now) or migration is needed. Dailies stay deterministic per seed, but a healer tile rolls differently from before the update.
- Drops are not affected. `afxDrop` (new on main) turns each rolled affix into an affixed raw, and fewer sustain rolls on healers only shift which essences those species drop (fewer Nourishing, Wood and Runic from Witch/Orrery/Sprite/Briarling). Mention this in the M-08 essence-sources discussion, because Wood and Runic are two of its five essences.

### Step 4: Numbers (`js/data.js`)

| constant | now | new | why |
|---|---|---|---|
| `AFX_T.regen` | .03 | **.02** | the main slog driver (53–81 turns on armored or healing foes). The chip, tooltip and Codex read `pcn(AFX_T.regen)`, so the text follows. |
| `RARITIES.rare.hp` | 1.55 | **1.45** | shorter rare fights for every kit (rare Heat 3 turns −10–17%) and the margin staff/pass needs. Wild creatures divide by `rm.hp` in `monsters.js`, so their HP stays on band. |

Leave these unchanged unless step 5 shows a need: `ELITE_INF_CH`, the Volatile blast, `AFX_T.frenzy`, `AFX_T.ward`, `RARITIES.magic`, `RAR_CH`. Each was tested and either moved staff/hollow by 4 points or less, or added noise.

### Step 5: Verify, then fine-tune only if needed

Run in this order. Use n=200 for the final rarity table, because per-row noise at n=100 is about ±3 points.

```
node tools/sim.js --rarity --seed 7  --n 200 --out sim-rarity.json
node tools/sim.js --rarity --seed 11 --n 200          # second seed: the margin must hold
node tools/sim.js --elite --seed 7                    # full matrix: no new TOO_EASY/TOO_HARD, boss rows unchanged
node tools/sim.js --econ-only --seed 7                # essences and embers: compare with the FRAG baseline in todo.md (expect only the small healer-drop shift)
node tools/affix-check.js                             # roll rules, regen amount (reads AFX_T, should pass as-is)
node tools/smoke.js
node tools/i18n-check.js                              # no new strings expected; must stay green
```

Add a check to `tools/affix-check.js`: 4000 rolls of `rollAfx(…,{e:"witch",mv:"chase",heat:4})` never contain `vamp`/`regen`/`ward`. Also check that the wild roster is unchanged: same `ENEMIES.w_hollow_*.afx` before and after.

If staff/pass rare at Heat 3 lands under 87% on either seed, fine-tune in this order: (a) `RARITIES.rare.hp` 1.45 → 1.4, (b) `ELITE_INF_CH` .25 → .2 (Burning and Venomous are the worst affixes for every kit).

### Step 6: Docs

- `README.md`: rarity multipliers ("rare x1.45"), the Regenerating row ("2% of max HP"), the roll rule for self-healing species, the `--rarity` paragraph (wild creatures left out, the new columns), and a short **rarity table** summary of the final smart rows at Heat 0/3/5. The done criterion "rarity table updated" points here; today the README only describes the table.
- `todo.md`: replace the "Affix balance leftovers (from A1)" entry with what is still open (below), and point the staff note under "Composable monster art" at the new numbers.
- `tasks.md`: set M-09 to `In Progress` while working and tick it when done. Add the wild stalemate and the defensive/woods vs Golem note to the relevant tasks (M-04 or a new entry).

---

## 3. Expected result

Full table, n=100, seed 7, wild creatures left out, on `d71a352`. **Before** = HEAD. **After** = steps 1–4. Smart policy, win% / mean turns:

| kit | rarity | H0 | H3 | H5 |
|---|---|---|---|---|
| staff/woods | rare | 100% 8.6t → 100% 7.9t | 95% 13.4t → 97% 12.4t | 45% → 50% |
| staff/pass | magic | 100% 8.7t → 100% 8.3t | 96% 13.2t → 94% 12.7t | 66% → 67% |
| staff/pass | rare | 99% 11.4t → 99% 9.9t | **84% 18.7t → 88% 15.3t** | 32% → 36% |
| staff/hollow | magic | 98% 9.2t → 100% 8.0t | **78% 12.9t → 99% 11.4t** | 40% → 81% |
| staff/hollow | rare | 91% 12.7t → 100% 9.7t | **57% 15.9t → 90% 14.2t** | 14% → 41% |
| melee/hollow | rare | 99% → 100% | 89% 15.7t → 91% 13.5t | 39% → 41% |
| defensive/pass | rare | 100% 14.6t → 100% 12.6t | 98% 21.0t → 100% 17.4t | 78% 27.9t → 88% 23.4t |
| defensive/woods | rare | 100% 14.2t → 100% 12.7t | 100% 19.0t → 100% 16.7t | 93% 26.6t → 94% 23.0t |

Flagged rows go from 6 to 2. The 2 left are the starter kit, which moves to M-10. `defensive/woods basic rare` drops from 32.8t to 28.9t at Heat 5 and loses its `SLOG` flag. Normal rows do not change, except staff/hollow, which gains from the kit fix.

Staff/pass rare at Heat 3 (88%) has the thinnest margin; the n=200 two-seed check in step 5 decides it.

The slowest single matchup at Heat 0–3 drops from 41t (staff/pass vs rare Witch) to 32t (defensive/woods vs rare Stone Golem). The defensive/woods kit's Iron sword hits a Golem that resists metal, so this is a matchup, not a row. Row means stay under the SLOG line. The step 1 per-enemy output will keep it visible.

---

## 4. Out of scope (record in `todo.md` / `tasks.md`)

- **Starter kit vs magic and rare** (Heat 0: magic 80–84%, rare 61–69%). This is **M-10**. The tutorial forges a Fire weapon first, and the starter's Heat 3 and 5 rows cannot happen in play.
- **Heat 5 rares** stay hard for every stage kit (36–50% smart for staff and melee). The target is Heat 0–3. Heat 5 also adds a third affix (`RAR_CH.k3`=4) and Inferno's armor bite.
- **Wild creature stalemates**: `w_hollow_2` and `w_hollow_8` vs `defensive/pass` under `basic` play: 0% win, 150 turns (confirmed on `d71a352`). Smart play wins. That suggests a creature the kit cannot hurt with plain attacks. Look at it with `--trace --kit defensive/pass --enemy w_hollow_2`. This fits M-04 (wild creatures in the sim). The roster is rebuilt at load, so a fix there changes the creatures.
- **Defensive/woods vs a rare Stone Golem** (about 32 turns at Heat 3, 46 at Heat 5).

## 5. Decisions needed

1. **Fix the staff/hollow kit (step 2)?** Recommended. It is most of the staff/hollow gain, and the current kit is weaker than the one before it. Without it, steps 3–4 leave staff/hollow at about 62% for rares at Heat 3, and closing that gap in `data.js` needs a large global staff buff.
2. **The healer rule (step 3)** is a design rule, not just a number. Players will never see a Regenerating Witch or a Warded Orrery again. The other option is to keep the roll rule and nerf Regenerating and Warded harder for everyone. Recommended: the rule.
3. **Who owns the wild filter in `--rarity`, M-04 or M-09?** Recommended: M-09 adds the small filter now, and M-04 builds its wild report on top of it.

## 6. Running the sim in this sandbox

`tools/sim.js` needs `playwright`, which is not in the repo. There is no root, and Chromium's system libraries are missing. What worked, all in `/tmp/m09` (nothing in the repo):

- `npm i playwright@<version>` in `/tmp/m09/pw`, matching the browser in `~/.cache/ms-playwright`. Other sessions replace that cache: it held `chromium-1140` (Playwright 1.48.2) at first and `chromium-1248` (1.64.1) after the merge. Match whatever is there.
- A stray `/tmp/node_modules` (Playwright 1.48, from another session) wins module lookup for anything under `/tmp`. `/tmp/m09/node_modules` is a symlink to `/tmp/m09/pw/node_modules`, so copies under `/tmp/m09/` find the right one first.
- `apt-get download` of the Chromium dependency `.deb`s, using a private `Dir::State::Lists`, extracted with `dpkg-deb -x` and loaded through `LD_LIBRARY_PATH`.
- A `node -r` preload (`/tmp/m09/noFonts.js`) that aborts `fonts.googleapis.com`/`fonts.gstatic.com` requests. Without it, the page `load` event never fires and the sim times out.

```
LD_LIBRARY_PATH=/tmp/m09/root/lib/x86_64-linux-gnu:/tmp/m09/root/usr/lib/x86_64-linux-gnu \
NODE_PATH=/tmp/m09/pw/node_modules node -r /tmp/m09/noFonts.js tools/sim.js --rarity --seed 7 --n 100
```

Run from the worktree, `NODE_PATH` is enough. For copies under `/tmp`, rely on the symlink. A full `--rarity` run at n=100 takes about 2 minutes. A run limited to `--kit staff,melee,defensive --policy smart,basic` at n=60 takes about 30 s.
