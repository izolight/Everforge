# Art acceptance evidence

Captured from the repository's SVG renderers in Chromium at the sizes used by the mobile UI. Authored combat data and map generation rules are unchanged. Body pools, compatible naming, and attachment selection alter seeded generated rosters, so the seed-1 sample is recorded below.

- [Creature families at battle 76px and Codex 96px](creature-size-review.png): canine, feline, bulky bear, low reptile, generic beast, construct, undead, elemental and humanoid. Each is shown with rare framing, affix treatment and a crowded status row. The face remains the first read on the new animal silhouettes. The bear's broad shoulder plates no longer cross its face. Major head shapes are mutually exclusive in generated combinations, preventing hood, horn, crown and halo piles.
- [Rift tile motifs](rift-tile-review.png): obstacle and water art for fen, ash, bone, deep, forest, tundra, ember and astral. Their shapes remain distinct at the 24px tile source size while sharing each saved Rift palette. Floor ambience uses lower opacity than obstacles and POI markers.
- [Seeded Rift maps at mobile 37px tile size](rift-map-review.png): all eight biomes show the actual map renderer with fog, obstacles, water, POIs, foe markers and boss direction. Review map seeds are deterministically derived from the biome and labeled as review rolls.
- [Named items and equipped hero](item-size-review.png): dagger, Sprite Lantern, Voidweave Robe, Witch Eye and Fang Charm at 64px inventory size, with corresponding equipped hero forms. Dagger and sword proportions differ both in inventory and when held.

## Validation

- `node tools/part-check.js` — 530 compatible body/part renders; 0 problems.
- `node tools/color-check.js` — 701 creature accents and palette comparisons; 0 problems.
- `node tools/name-check.js` — 144 seeded biome/body name samples; 0 problems.
- `node tools/map-check.js` — 240 seeded maps and map independence checks passed.
- `node tools/hero-check.js` — mobile hero equipment and all weapon forms passed.
- `node tools/affix-check.js` — affix hooks, art and essence regressions passed.

`node tools/sim.js --wild --seed 1 --n 1 --rift-seeds 1 --rift-depth 1 --no-econ` completed after M-10 released `tools/sim.js`. It covered 10 creatures in each of the four authored regions plus one Rift biome/depth; 10,440 wild and 396 Rift fight cells were produced with zero kit warnings. This one-fight-per-cell screen had 226 flagged aggregate rows, so those flags are recorded as a smoke sample and are not used as a balance estimate. See [compact sim summary](a04-seed1-sim-summary.json).
