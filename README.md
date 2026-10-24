# Everforge

A mobile-first crafting and battling game. Fight through four regions, salvage loot into essences, and forge better gear. It runs entirely in the browser, with no build step and no dependencies. Progress is stored in `localStorage`; the Codex tab can export and import a save code.

## Run it

Open `index.html` in a browser, or serve the folder with any static server (`python3 -m http.server`). It loads three fonts from Google Fonts and falls back to system fonts offline.

## Layout

```
index.html        page markup and script loading order
css/styles.css    all styles (one dark "forge" theme)
js/
  data.js         traits, forms, recipes, items, enemies, tutorial, constants
  state.js        save/load, versioned migrations, save validation
  helpers.js      small utilities and shared item/level helpers
  crafting.js     mixing rules and combine() (trait merging, reactions, mishaps)
  codex.js        creature knowledge tracking
  goals.js        tutorial steps and bounties
  player.js       equipment, player stats, infusions
  fx.js           floating-number / hit-flash queue (also maps floaters to sounds)
  audio.js        synthesized sound effects (Web Audio), mute/volume preference
  map.js          region maps, nodes, map events (chest, shrine, peddler, camp)
  encounters.js   choice-driven map events (ENC table: shrine, altar, alchemist, traveller, forge, riddle)
  economy.js      embers currency: peddler shop, selling, grade upgrades, reforging mishaps
  battle.js       combat loop, enemy turns, victory and defeat
  endgame.js      daily expedition (seeded by the UTC date): plan, start, finish, abandon, reward
  gear.js         equip / settle gear, item effect descriptions
  art.js          SVG art for items, creatures, map nodes and icons
  render.js       view rendering (battle, gear, forge, recipes, codex)
  sheets.js       item and codex bottom sheets
  forgefx.js      forging animation
  embers.js       ambient ember canvas
  events.js       DOM event wiring, save export/import, first render
```

## Conventions

- The scripts are plain (non-module) scripts that share one global scope, so they work from `file://` without a server. **Load order matters**; it is the order of the `<script>` tags in `index.html`. Each file may use anything defined by files above it at load time, and anything at all inside functions at call time.
- All game state lives in the single global `S` (see `freshState()` in `state.js`). After changing it, call `save()` and `render()`.
- Weapon-form and shield abilities live in the `ABILITIES` table (`data.js`); `ability(key)` in `battle.js` runs them, cooldowns are per battle in `B.cd`, and `effects()` reads the same table for item text.
- Heat (`HEAT`, `HEAT_T` in `data.js`) is stored per zone in `S.heat[zone]={max,sel}`; a map remembers the heat it was generated with (`map.heat`) and `heatNow()` reads it. The daily lives in `S.daily` (not `S.maps`); while `S.run==='daily'`, `curMap()` returns its map and `S.zone` is the daily's zone, restored from `S.daily.back` by `finishDaily()`. Daily maps come from `genMap({seed,...})`, which uses the seeded `rng` instead of `Math.random`.
- Bosses can carry a data-driven `phase` (see `archon` in `data.js`): below `at` of max HP they spend a turn changing form, and `foeOf(B)` returns the current form's fields (element, weak, resist, special, status). Use `foeOf(B)` rather than `ENEMIES[B.id]` for anything that depends on the form.
- Adding a zone: append to `ZONES` and give it enemies, a boss and a `terrain()` look in `art.js`. Unlocking, the mimic scaling (`MIMIC_HP`/`MIMIC_ATK`), bounties and the daily pick it up; `migrate()` opens zones for saves that already beat the boss before them; a daily boss kill unlocks the next zone too (same rule, so a reload never changes what is open).
- When the save shape changes, bump `KEY`/`v`, add a migration step in `migrate()`, and extend `sane()` if new required fields are added.
- Secrets (`SECRETS`, optional `bonus:{trait,v}` merged by `combine()`) start hidden except the first three. `S.hints` lists secret indexes; each repeat of an index reveals one more ingredient (`hintLv`, `giveHint(x)` in `goals.js`). Hint scrolls come from chests, shrine offerings, riddles, travellers, boss first kills, bounties and the daily.
- Map events live in `ENC[type]={make(rv,hl),pick(choice,ev)}`; `rv` is four rolls pre-rolled per node (`nd.rv`) in the seeded daily map, plus four more (`rv[4..7]`, from `nd.gr`) that roll the grade of whatever the event gives. Satchel-dependent choices vary per player. Every event must finish in `endEv(...)` (no choices) or a leave.
- Embers (`S.embers`, tunables in `EMB` in `data.js`) come from fights (`fightEmbers`), salvage and selling. The peddler is a shop (`merchant(sh)`; the stock is pre-rolled per node as `nd.sh` on the seeded daily). Quality grades: essences and basic materials (ores, hides, herbs; not relics or gear) come in 5 grades, Faint/Lesser/Plain/Greater/Pure (`GRADES`, `GRADE_M` in `data.js`). A graded item has the id `<base>@<g>` (`ess_Fire@4`, `golem_core@2`); **Plain keeps the bare id**, so SECRETS, recipes and old saves are untouched (secrets only match Plain; a graded stand-in logs why). Use `gradeOf`/`baseIdOf`/`gradedId` (pure, `data.js`), `gradedItem(base,g)`/`essG(trait,g)` (create the item on demand) and `isEss`/`essTrait`; never parse `ess_` ids by hand. Drops roll a grade with `rollGrade(zone,heat,x)` (`GRADE_ODDS`, Heat shifts it; `gdrop`/`gess` for a zone, `dropNow`/`essNow` for the current one); `x` is a 0-1 roll so seeded daily outcomes pre-roll it (`nd.gr`, the fraction left of a shop roll). Upgrading (Forge tab, `upgrade(id)`, `UP` and `GRADE_LV`): 3 of a grade + embers make 1 of the next, with an Alchemy-skill success chance (a miss loses 1 of the 3) and an Alchemy level needed per grade. Infusion counts essences by `INF_W` (Greater = 3 plain, Pure = 9, Lesser = 1/3, Faint = 1/9) and `infPay(t)` picks what to spend. Salvaged gear gives essences of grade `sg` (set by `combine()`: the lowest grade among its inputs, Plain if none), a graded material salvages into its own grade, and a graded material's essence count follows its Plain traits; infusion overpayment is kept as `S.infCredit` (ninths); `worth()` scales by `GRADE_W`. `mkGraded` in `state.js` rebuilds graded items, so `migrate()` resets them to their fixed values. `reforge(id)` makes a new `c_` item, like old-forge tempering.
- Crafting skills: `S.skills={key:xp}` for the `SKILLS` table in `data.js` (`skillOf(item)` maps a form to a skill, `skLv(k)` gives the level from `SK_LV`, `SK_CAP` the highest result tier per level). `combine(items,{roll})` is now random per attempt (`roll` 0-100 fixes it; previews and the sim pass `roll:100`): difficulty (`CRAFT`) minus skill level gives the failure chance (`FAIL`), split into a mishap and a fizzle (`FIZ`: ingredients lost, a share of their worth refunded in embers). A result above the skill's tier cap is blocked in the forge. A clean result keeps the id `c_<hash(inputs)>` (recipe book, secrets, stacking); a mishap gets its own id and a `clean` field, and `reforge` turns it back into the clean item. The first forge never fails. Merge gains above `SOFT` count half; upgrading a crafted item of the same form adds difficulty.
- Sound: `sfx(name,delay)` in `audio.js` is a safe no-op without a user gesture or Web Audio; add a sound as one line in `SND` (built from `osc`/`noise`) and a gap in `GAP` if it needs rate limiting. The preference is in `localStorage` key `everforge-sound`, never in `S`.
- Lifetime counters live in `S.stats` (`statsDef()` in `state.js`; `migrate()` merges missing fields, deriving what it can). Count in the central places (`strike`, `dealt()` before any `B.hp-=`, enemy hit path, `enemyDown`, `youFall`, `finishDaily`, `gainEmbers`/`spendEmbers`) and show them in `renderStats()` (Codex tab).

## Testing

`node tools/smoke.js [steps]` plays the game headlessly through the real UI (Playwright + Chromium) and fails on any page error or if the run gets stuck. It also replays every save in `tools/fixtures/` to check that old saves still migrate. When you bump the save version, run `node tools/smoke.js 400 --write-fixture` once to add a fixture for the new version.

### Balance simulator

`node tools/sim.js` runs the real combat and map code (`startBattle`, `attack`, `parry`, `ability`, `useItem`, `pstats()`, `visit()`...) headlessly in Chromium, with `render`/`save`/`fx`/`sfx`/`toast` stubbed. It builds player kits by actually crafting with `combine()` (the kit table at the top of `tools/sim.js`: balanced `melee`, `defensive`, `staff` and a min-maxed `stacked` kit at woods/pass/hollow/spire "end", plus a `starter` kit, the fresh-save sword; every recipe is checked with `checkMix` and any warning is printed) and prints each kit's `pstats()`, essence use (in plain-essence equivalents) and the embers to upgrade its graded essences. It fights every enemy at each Heat with three bot policies: `passive` (attack only), `basic` (attack, guard on a telegraphed special) and `smart` (parry telegraphed specials, use the ability when ready, heal below 35% HP). The codex is pre-mastered for the kit's zone and earlier ones (`--no-mastered` to turn that off).

The main pairing is **arrival**: the kit of the previous stage against the next zone (starter kit against the woods); **on-stage** (the kit's own zone) is a second table. Skills: each stage kit assumes the crafting-skill XP in `STAGES[..].sk` (a focused player's skills at that point); the sim builds the clean result (`roll:100`) and reports the crafts, expected attempts and expected fizzles a player would need. Per row: win%, mean turns and mean HP left% per Heat. Flags (Heat 0 unless noted): `TOO_EASY` (win 100%, over 85% HP left and under 4 turns, under 10 for a boss), `TOO_HARD` (wins under 50%) and `SLOG` (mean turns over 30, 50 for a boss, any Heat). `--attrition` adds expeditions of 4 regulars and a boss on one HP bar (35% heals after fights 2 and 4) with clear %. The economy section plays whole expeditions through `visit()` and reports embers, essences and items per expedition, with and without the salvage value of the new loot (the bot never salvages), and the peddler's price range.

```
node tools/sim.js                                  # full matrix, 40 fights per cell, about 15 s
node tools/sim.js --n 100 --seed 7 --attrition --out sim.json
node tools/sim.js --kit stacked --zone spire --heat 0,5 --policy smart
node tools/sim.js --enemy archon,phoenix --elite   # --elite adds an elite variant (*) of each regular enemy
```

Flags: `--n` fights per cell, `--zone`/`--enemy`/`--kit`/`--heat`/`--policy` (comma lists; `--kit` matches names like `melee`, `spire`, `staff/pass`; `--zone` keeps enemies of those zones and the kits whose own or arrival zone is listed), `--seed` (seeds `Math.random` per cell, so results are reproducible), `--row` (map row 0-5 used to scale regular enemies, default 3), `--all` (also print the other pairings), `--attrition`, `--no-mastered`, `--jobs` (browser pages in parallel), `--exped` (expeditions per zone), `--no-econ` / `--econ-only`, `--out` (JSON path). Change the numbers in `data.js`, rerun with the same `--seed` and compare.
