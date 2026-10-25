# M-02 · Remove the duplicate region name

## Context
"The Cinder Wastes" appears twice in `js/monsters.js`:
- as the ash biome's name, `BIOMES.ash.n` (line 29)
- in the ember biome's region list, `BIOMES.ember.regions` (line 20)

A Rift region rolled from ember can therefore have the same name as the ash biome, so two different places show the same name. A scan of all 8 biome names and 24 region names finds no other duplicate.

## Change: `js/monsters.js` only
Rename the **ember region** and keep the ash biome name:

```js
regions:["The Ashen Kilns","The Slag Flats","The Vent Fields"],   // was "The Cinder Wastes"
```

Why rename the region and not the biome:
- `BIOMES.ash.n` is the biome's identity. It's also used as the place name in creature intros when there's no `where` (line 89).
- The ember region is one of three random Rift names (`riftMake`, line 110). Changing it touches the least.
- "The Ashen Kilns" fits Cinder Hollow's forge lore ("It was forged…", "coal and old iron"). It doesn't repeat a word from the other ember regions or from the ash biome and its regions (Glass Desert / Rust Flats / Salt Reach).

Nothing else needs to change:
- **Saves:** `riftEnsure` (line 117) rebuilds `S.rift.name` from the seed on every load, so a save sitting in an old "Cinder Wastes" rift picks up the new name. No fixture in `tools/fixtures` contains the string.
- **Translations:** `js/lang/*-data.js` don't translate generated biome or region names, so there's nothing to add.

## Verification
- Duplicate scan: the result must be `[]`.
  ```sh
  node -e 'const s=require("fs").readFileSync("js/monsters.js","utf8");
  const n=[...s.matchAll(/^[a-z]+:\{n:"([^"]+)"/gm)].map(m=>m[1]);
  const r=[...s.matchAll(/regions:\[([^\]]+)\]/g)].flatMap(m=>JSON.parse("["+m[1]+"]"));
  const c={};[...n,...r].forEach(x=>c[x]=(c[x]||0)+1);
  console.log(n.length,r.length,Object.entries(c).filter(e=>e[1]>1))'
  ```
  It should print `8 24 []`.
- `grep -rn "Cinder Wastes" js` should match only line 29 (`ash.n`).
- `node tools/map-check.js`, `node tools/smoke.js` and `node tools/i18n-check.js` all pass.
