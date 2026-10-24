# Everforge

A mobile-first crafting and battling game. Fight through three regions, salvage loot into essences, and forge better gear. It runs entirely in the browser, with no build step and no dependencies. Progress is stored in `localStorage`; the Codex tab can export and import a save code.

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
  fx.js           floating-number / hit-flash queue
  map.js          region maps, nodes, map events (chest, shrine, peddler, camp)
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
- When the save shape changes, bump `KEY`/`v`, add a migration step in `migrate()`, and extend `sane()` if new required fields are added.

## Testing

`node tools/smoke.js [steps]` plays the game headlessly through the real UI (Playwright + Chromium) and fails on any page error or if the run gets stuck. It also replays every save in `tools/fixtures/` to check that old saves still migrate. When you bump the save version, run `node tools/smoke.js 400 --write-fixture` once to add a fixture for the new version.
