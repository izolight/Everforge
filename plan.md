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
