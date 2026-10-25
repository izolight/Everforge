# M-03 · Close authored element gaps

**Goal:** each campaign region's authored roster (`ENEMIES` in `js/data.js`) covers the element pool of its biome (`BIOMES[ZONE_BIOME[zone]].els` in `js/monsters.js`), with art, drops, lore and German/Korean text. Any element that is still missing is documented as an exception.

**Done when:** every pool element is covered (or documented), `node tools/i18n-check.js` passes, and `node tools/sim.js` raises no new TOO_EASY, TOO_HARD or SLOG flags on the affected zones.

## Current state (audit)

| Zone (biome) | Pool | Authored regulars (el, mv) | Missing | Duplicates | Outside the pool |
|---|---|---|---|---|---|
| woods (forest) | wood, poison, fire, swift, metal | boar (wood, chase), sprite (holy, wander), bandit (metal, still), stag (wood, wander), briar (wood, still), ghoul (shadow, chase); boss gnarlhorn (wood) | **fire, poison, swift** | wood x3 | holy, shadow |
| pass (tundra) | ice, swift, stone, arcane, metal | wolf (ice, chase), wraith (shadow, wander), golem (stone, still), bear (ice, wander), raider (metal, chase), squall (swift, still); boss rimeclaw (ice) | **arcane** | ice x2 | shadow |
| hollow (ember) | fire, poison, metal, stone | imp (fire, wander), witch (poison, chase), slag (stone, still), salamander (fire, chase), revenant (shadow, wander), brimstone (poison, still); boss phoenix (fire) | **metal** | fire x2, poison x2 | shadow |
| spire (astral) | arcane, holy, swift, shadow | harpy (swift), sentinel (arcane), acolyte (shadow), seraph (holy), lynx (arcane), orrery (metal); boss archon (swift→shadow) | none | arcane x2 | metal |

Right now each region has six regulars, two per movement type (commit efe34bb).

## Approach

Where an existing creature's theme fits a missing element, **swap a duplicate's element**. Where none fits, **add one new regular**. **Never delete an enemy id**: saves reference ids in `S.kills`, `S.seen`, `S.codex`, map POIs, bounties and a battle in progress.

**Leave `BIOMES` alone.** `genRoster` seeds the wild creatures from `"wild:"+zone`. Changing an `els` list would change which element each roll picks and shift everything rolled after it, so every save's existing wild creatures would change.

**Both rules above no longer hold.** Saves are latest-only: a save of another version is not loaded, so a content change (a new `BIOMES` element list, a deleted enemy id) breaks no save — it only needs a fresh sim measurement.

### Woods: 2 swaps + 1 new
1. **Briarling → poison.** Thorny brambles with stinging sap fit poison. `el:"poison"`; it keeps `weak:["fire"]` and `resist:["wood","poison"]`. Change the art accent toward the poison family (`FAM.poison` green), rewrite the lore line to mention the sap, and keep the drops.
2. **Mossback Stag → swift.** A fleet stag still fits its theme. `el:"swift"`, `weak:["stone","fire"]` (it keeps fire so the Woods stays friendly to the starter Fire), `resist:["swift"]`. Rewrite the lore line to add speed and keep the drops. Stone damage is already available in the Woods through Heavy (boar_hide and wood_shield).
3. **New: Kindle Fox** (`kindlefox`), fire, `mv:"chase"`, `w:2`. A fox with a smouldering tail that starts brush fires.
   - Stats near Woods peers: hp ~30, atk 6, def 1.
   - `weak:["ice"]`, `resist:["fire"]`. This is the first Woods enemy that the tutorial's Fire essence does not counter. Study reveals that, and the tutorial hands out Ice at step 4.
   - Special: `heavy` "Tail Flare" (x ~1.8).
   - Art: `{b:"beast",p:["tail","flames"],c:"#c8642e",a:"#ffd27a",pat:"stripes",po:.6}`.
   - Drops (Woods items only): chili .5, boar_hide .35, trail_boots .12.
   - **No `inf`.** No Woods enemy inflicts a status today, and the Woods should stay status-free. The same applies to the poison Briarling.

Result: wood (boar + boss), poison, fire, swift and metal are all covered. Seven regulars: chase 3, wander 2, still 2.

### Pass: 1 new
4. **New: Cairn Seer** (`seer`), arcane, `mv:"still"`, `w:2`. A hooded hermit who reads frost-runes cut into the cairns.
   - Stats near Pass peers: hp ~58, atk 10, def 4.
   - `weak:["metal"]` (Sharp and Iron are common by now), `resist:["arcane","ice"]`.
   - Special: `heal` "Glyph Mend" (x ~.25). The Pass currently has no healer.
   - Art: `{b:"humanoid",p:["hood","staff","runes"],skin:"#c99b78",c:"#5a6fa8",a:"#a9f0ff",pat:"bands",po:.5}`.
   - Drops: spring_water .5, rune_shard ≤ .2, fang_charm .12. `GEN_DROP.pass.arcane` already lets wild Pass creatures drop rune_shard. If sim kits or `zoneRare` show an economy shift, use holy_water instead.
   - Keep both ice creatures. Ice is the region's theme and the wolf pairs with Rimeclaw.

### Hollow: 1 new
5. **New: Anvil Crawler** (`anvil`), metal, `mv:"wander"`, `w:2`. A forge construct that scuttles between cold anvils.
   - Stats near Hollow peers: hp ~95, atk 14, def 6.
   - `weak:["arcane","ice"]`, `resist:["metal","fire"]`.
   - Special: `multi` n:2 "Pincer Clamp" (x ~.9).
   - Art: `{b:"construct",p:["shell","spikes","armor"],c:"#7a7f86",a:"#ff8a3d",pat:"bands",po:.55}`.
   - Drops (Hollow items): golem_core .5, coal .4, ember_treads .12.
   - Considered and rejected: re-elementing Slag Sentry to metal. Its iron arms would fit, but stone would then go missing and the README documents it as the Hollow's Stone construct.

### Spire: no change
The Spire is already covered. Record it in the audit only.

### Documented exceptions
Some authored enemies sit outside their biome pool on purpose: Woods holy (Glowcap Sprite) and shadow (Barrow Ghoul), Pass/Hollow shadow (Ice Wraith, Ash Revenant), and Spire metal (Orrery Construct). These are additions, not gaps. Bosses are not counted toward coverage. Write this down in README.md next to the creature/biome notes, and in a one-line comment above `ZONE_BIOME`.

## Steps

1. **Baseline.** Run `node tools/sim.js --zone woods,pass,hollow --elite --out /tmp/m03-before.json` and `node tools/sim.js --zone woods,pass,hollow --attrition` before editing, so the results can be compared.
2. **Data (`js/data.js`).**
   - Edit `briar` and `stag` (el, weak, resist, lore, art accent).
   - Insert `kindlefox`, `seer` and `anvil` next to their zone peers. The codex lists enemies in `ENEMIES` order per zone.
   - Every field follows the existing composed-art enemies: name, plural, zone, mv, el, hp/atk/def, weak, resist, w, verb, intro, lore, art, sp{every,name,kind,…,tell}, drops.
   - Reuse existing hit verbs where possible, which also keeps the contextual hit-line words already translated.
3. **Art (`js/art/`).**
   - No new parts should be needed: tail, flames, hood, staff, runes, shell, spikes and armor already exist in `PART`.
   - Check each new portrait in the codex and in battle at 390 px and 360 px, including with an affix overlay (`AFX_ART` parts may collide with shell or hood).
   - Add a part to `js/art/parts.js` only if a silhouette reads badly.
4. **Save safety (`js/state.js`, sanitize near the `codex` timing pass).**
   - Prune each `S.codex[id].weak` and `.resist` to `allFacts(ENEMIES[id], …)`, and `.drops` to the current drop ids.
   - Without this, a save that learned "stag is weak to fire/resists wood" counts a stale fact in `know()`. That inflates `have`, can mark the enemy mastered wrongly, and can show the wrong weakness.
   - This is idempotent, so no version bump is needed. Add a short comment explaining why.
5. **Translations (`js/lang/de-data.js`, `js/lang/ko-data.js`).**
   - Add entries for each new enemy: name, plural, intro, lore, sp name, tell, and verb if it is new. Korean plural = singular, as in the existing entries.
   - Replace the old briar and stag lore keys. `i18n-check` fails on dead entries.
6. **Coverage guard.**
   - Add a short preflight in `tools/sim.js` `main()`, after `enemiesAll` is read. For each `ZONE_BIOME` zone, list the pool elements that no non-boss authored enemy of that zone has. Print the list, and exit 1 on a gap unless the element is in a small `EL_EXCEPT` map.
   - `EL_EXCEPT` is empty after this change. It exists so a future documented exception has one place to live.
7. **Docs.**
   - README: update the roster sentence (line ~62) and the Hollow paragraph, add the exceptions note, and mention the codex pruning under the save notes.
   - todo.md: M-03 is not listed there. Add a "(done)" entry in the same style as the existing ones.
8. **Verify.**
   - `node tools/i18n-check.js` must pass. Optionally add `--tour` with `I18N_LANG` for de and ko.
   - `node tools/sim.js --zone woods,pass,hollow --elite`: no new flags. The new enemies' win%, turns and HP left should fall within their zone peers' range on both the arrival and on-stage kits.
   - `node tools/sim.js --enemy stag,briar,kindlefox,seer,anvil --elite --heat 0,3,5`.
   - `node tools/sim.js --zone woods,pass,hollow --attrition`: compare clear rates with the baseline. The encounter mix changes, because the weight totals per zone grow by 2.
   - `node tools/sim.js --fresh`: first-expedition Woods results should stay close to the baseline (the fire-resistant fox is the main risk).
   - Tune hp, atk, def or weaknesses until the numbers match, then rerun.
   - `node tools/smoke.js` and `node tools/affix-check.js`. Affix rolls depend on `mv`, and the roam affix needs a mover.
9. **Commit** as one change: "Close authored element gaps in Woods, Pass and Hollow".

## Risks and open choices
- **Woods difficulty.** The Kindle Fox is the first Woods enemy that resists the starter Fire. If `--fresh` or the starter/woods arrival rows turn TOO_HARD, lower its def, or add `weak:["ice","wood"]`, before considering `w:1`.
- **Roster size.** Woods, Pass and Hollow go to seven regulars while the Spire keeps six. The other option is replacing a duplicate outright (bear or salamander), but that deletes translated content and needs id migration. Adding is the safer choice.
- **rune_shard in the Pass** slightly front-loads a Spire material. Fall back to holy_water if kit sums or `zoneRare` move noticeably.
- **Names** (Kindle Fox, Cairn Seer, Anvil Crawler) are placeholders and easy to change before translation.

---

# V-01 · Expand biome part pools from 6 to 8–10

## Context
Every one of the 8 `BIOMES` in `js/monsters.js` offers 6 parts. `genCreature` (line ~81) picks 1–3 distinct parts, so a biome has only 41 possible part sets (6+15+20). Raising every pool to **9** gives 129 sets (9+36+84) per biome, which means much more visual variety and no code change.

The renderer already has 22 parts (`PART`, `js/art/parts.js`). We only need to choose which ones each biome gets.

## Constraints on which parts to add
- **No `tail`.** Only the beast body has a tail anchor (`a.t`, `js/art/bodies.js:9`). On any other body, `tail` draws nothing (`parts.js:13`). Fixing that belongs to V-12, so don't add `tail` anywhere new. Existing `tail` entries stay untouched.
- **No `blade`, `axe`, `staff`, `tusks`.** Those are V-02, which waits on V-12's body-aware gating.
- **Never `hood` and `halo` in the same pool.** `compose` (`js/art/creature.js:4`) already keeps an affix halo off a hooded creature, so the two shouldn't co-roll from a pool either.
- Every other part draws from the `h`/`s`/`c` anchors, which all 5 bodies have, so any body can take them.
- Append new parts to the end of each array, and don't reorder or remove anything.

## Change: `js/monsters.js` only, `parts` array of each biome

| biome | current (6) | add (3) → 9 | theme |
|---|---|---|---|
| forest | mane antlers horns tail vines spikes | `hood` `wings` `shell` | druid cowl, owl/moth wings, beetle carapace |
| tundra | frost mane horns tail spikes armor | `crystals` `antlers` `hood` | ice shards, elk, fur hood |
| ember | flames spikes armor chains horns crown | `runes` `wings` `shell` | forge runes, fire wings, slag carapace |
| astral | orbit runes halo wings crown crystals | `armor` `chains` `mane` | orrery plating, star chains, star-mane (no hood: has halo) |
| fen | vines mane tail horns spikes shell | `hood` `antlers` `wings` | bog hag, bog elk, marsh-fly wings |
| ash | armor spikes flames chains horns shell | `hood` `crystals` `wings` | desert wraps, glass shards, vulture wings |
| bone | horns antlers mane chains armor tail | `hood` `runes` `wings` | grave shroud, grave runes, bone wings |
| deep | crystals runes vines tail frost hood | `shell` `spikes` `chains` | abyssal shell, urchin spines, drowned anchors |

After the change, every biome has 9 distinct parts. No biome pairs `hood` with `halo`, and no new `tail` or orphan parts are added.

## Expected side effects
- Seeded wild rosters (`genRoster`, seed `"wild:"+zone`) and Rift creatures will look different. The part-roll loop draws a variable number of `R()` values, so the rolls after it (colours, names, stats) shift too. This is intended and matches what M-01 did. Saves don't store wild creature data; `buildRoster`/`riftEnsure` rebuild it on load.
- `hood`, `crown`, `horns` and `antlers` are all head parts, so they can overlap on one creature. The visual spot-check should cover the new head-slot pairs (tundra hood with horns or antlers, bone hood with horns or antlers).

## Verification
1. Pool check (node, no browser). It should print 8 pools of 9 with no problems:
   ```sh
   node -e 'const s=require("fs").readFileSync("js/monsters.js","utf8");
   [...s.matchAll(/^([a-z]+):\{n:.*?parts:(\[[^\]]*\])/gms)].forEach(m=>{const p=JSON.parse(m[2]);
   const bad=[p.length<8&&"<8",new Set(p).size!==p.length&&"dup",p.includes("hood")&&p.includes("halo")&&"hood+halo",
   ["blade","axe","staff","tusks"].some(x=>p.includes(x))&&"orphan"].filter(Boolean);console.log(m[1],p.length,bad.join(" ")||"ok")})'
   ```
2. Render check: load `js/art/*.js` in a node `vm` context, then call `compose` for every biome × body × part. Assert that each call returns non-empty SVG without throwing, and that each part draws something on every body (`tail` excepted).
3. `node tools/map-check.js` and `node tools/smoke.js` pass. Both need Playwright, which isn't installed in this worktree yet, so run `npm i -D playwright` (or install it globally) first.
4. Visual spot-check: open `index.html`, look through the Codex or wild encounters in each of the 4 campaign regions plus a few Rift depths, and confirm the new parts look right on every body.
5. Update `tasks.md`: tick V-01 and set its status to `Done`.
