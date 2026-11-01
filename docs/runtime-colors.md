# Runtime raster colors

Open **Equipment → Appearance workbench** in the game, then use the **Weapons**
or **Wardrobe** navigation links. Expand the part color controls, choose a part,
and choose a custom color. Colors persist in each workbench's preview recipe;
they do not change the live SVG character or game save.

[Custom-color preview](../assets/hero/clothing-kit/review/runtime-colors-v1.png).

All exported weapon components and wardrobe layers support independent colors,
including bases, trousers, armor plates, belts, straps, embroidery, cuffs, helmet,
shield and charm. Appearance supports skin, eyes, hair and both underclothes
layers. Existing named palettes still work; fabric and leather also accept hex.

Every color is a `#RGB` or `#RRGGBB` value. Each part supports:

- `all`: recolor all visible pixels, including parts without authored masks.
- `surface`: use the existing primary mask, or visible pixels if none is supplied.
- `trim`: use a separate trim mask when the part has one.

Channels apply in that order. Each uses the **original** image luminance,
preserving source shading and alpha. Masked channels can override the whole-part
color. `original` restores source pixels in that channel; omitting a channel
inherits its default (for example a wardrobe fabric dye). A whole-part override
bypasses the group dye for that part. Remove a part override
to return to group dyes. A part's colors stay with its ID when it is hidden,
unequipped, or its upgrade is disabled.

```js
// Independently color the assembled weapon's four slots.
await BladeKit.render(canvas, bladeManifest, {
  blade: 'standard', material: 'steel', guard: 'straight',
  colors: {
    blade: { surface: '#568ca0' },
    guard: { surface: '#7a4b34', trim: '#e9bc60' },
    grip: { all: '#453044' },
    pommel: { all: '#8899aa' }
  }
});

// Each hand in BladeKit.renderHeld receives its own complete weapon recipe.
// Wardrobe part keys are IDs from manifest.layers; hands are independent here too.
await ClothingKit.render(canvas, heroManifest, bladeManifest, clothingManifest,
  { skin: '#94674d', hairColor: '#283548' },
  {
    outfit: 'plate', protection: 'stone', left: 'standard', right: 'short',
    fabric: '#456789',
    colors: {
      'plate-cuirass': { surface: '#8995aa' },
      'trousers-base': { all: '#3c405d' },
      helmet: { all: '#8995aa' },
      charm: { surface: '#56a5aa', trim: '#e9bc60' }
    },
    weaponColors: {
      left: { blade: { all: '#799aba' } },
      right: { grip: { surface: '#653c51' } }
    }
  }
);

await HeroKit.render(canvas, heroManifest, {
  colors: { torso: { all: '#456789' }, trousers: { all: '#393c5a' } }
});
```

`HeroKit.part(baseURL, descriptor, channels, defaults)` is the shared renderer
for any raster asset, including standalone creature art. A descriptor has `src`,
optional `mask`, optional `trimMask`, and optional `tintReferenceLuma`. Paths are
relative to `baseURL`. It returns a cached canvas; treat that canvas as read-only
and draw it into your destination. Cache size is bounded during color dragging.

```js
const layer = await HeroKit.part('../assets/creatures/',
  { src: 'frost-wolf-v1.png' }, { all: '#7a4cba' });
ctx.drawImage(layer, 0, 0);
```

Explicit surface reference luminance retains established dye values. Otherwise
the renderer measures the selected source pixels. Mask quality still determines
which details are isolated; whole-part tint changes every detail's color while
retaining its luminance. Tinting does not invent a new material texture. Archived
sources and static review sheets remain reference artwork. The live SVG game
renderers remain separate from these raster assembly workbenches.

Run `node tools/tint-kit-check.js` for all exported clothing/weapon parts, alpha
and mask isolation, source restoration, custom group dyes, underclothes, equipped
weapon colors, persistence and mobile controls. The existing appearance, blade
and clothing checks cover assembly and occlusion compatibility.
