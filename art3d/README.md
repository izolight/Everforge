# art3d — the 3D hero

An exploratory, dependency-free 3D version of the Everforge hero. It has:

- a base body with no equipment
- a modular gear system with one template item per slot
- a skeleton rig with spring bones
- a set of animation clips

A small software renderer draws everything in the inked, cel-shaded style of the 2D portrait (`js/hero.js`). The code is plain scripts on a global `H3` namespace, so the same files run in the browser (`art3d/index.html`) and in Node (`tools/hero3d-lib.js`). Nothing in the game loads art3d yet.

```
open art3d/index.html                                    # viewer: presets, per-slot gear, clips, drag/zoom, PNG + sprite sheet export
node tools/hero3d-shot.js --list                         # registered gear, clips, presets
node tools/hero3d-shot.js --preset adventurer --views    # front / 3/4 / side / back sheet -> /tmp/hero3d.png
node tools/hero3d-shot.js --preset adventurer --anim attack --frames 8 --yaw 0.2
node tools/hero3d-shot.js --evidence                     # refresh art-evidence/hero3d-*.png
node tools/hero3d-check.js                               # structural checks (part of npm test)
```

## Files (load order = `<script>` order in index.html)

| file | owns |
|---|---|
| `core.js` | Maths, geometry builders (`loft`, `tube`, `sheet`, `ball`, `box`, `xform`, `mirrorX`). Renderer: materials, contact shading, ink. Pure-JS compositing. |
| `rig.js` | Skeleton, poses, skinning, binding (rigid / auto / fn / transfer), spring bones |
| `body.js` | The unequipped hero: skeleton definition, `dims` measurements, body meshes, colliders |
| `hero.js` | Gear and animation registries, assembly (`H3.hero.build`), posing, frame rendering |
| `gear/*.js` | Template items, registered with `H3.gear.register` |
| `anim.js` | Animation clips, registered with `H3.anim.register`, plus keyframe/IK helpers |
| `presets.js` | Named loadouts: `base`, `wanderer` (the 2D portrait's default look), `adventurer` (every slot) |

## Conventions

- Units are metres, y is up, the feet are at y=0, and the hero faces **+z**.
- **+x is the hero's LEFT** (bones `*.L`). The main hand is the right hand (`hand.R`, x<0). The off hand is `hand.L`.
- Meshes are built in the **rest pose** (arms hanging slightly out).
- `paint(p)` receives the position at mesh creation time, before any `xform`. So paint is authored in the part's own space.
- Palette entries look like `{c:"#hex", mat:"cloth|leather|skin|hair|wood|metal|gold|gem|glow", line:false}`. `line:false` drops the thin ink line where that region meets others.
- `mesh.bias` (metres) pulls a layer toward the camera in the depth test. Use it for belts, trims and decals.
- No randomness. Use `H3.U.hash(x,y,z)` for deterministic variation.

## The base body (`body.js`)

The base body is the hero with no equipment. It has these parts:

- face, ears and hair
- a linen undershirt, trousers with a waist tie, and wrapped shins and feet
- chunky mitten hands, with a finger bone that closes the fist

Every mesh has a tag, and gear hides body parts by tag prefix. The tags are:

- `head`, `head.ears`
- `hair.front`, `hair.top`, `hair.back`
- `neck`
- `torso`, `torso.lace`, `torso.tie`
- `arm.L/R`, `hand.L/R`, `leg.L/R`, `foot.L/R`

`H3.body.dims` holds the measurements that gear fits to. Gear reads it at build time, so reshaping the body moves the gear with it. It contains:

- joints, head, neck, chest, waist, hips
- the loft ring keys in `dims.rings`
- the grip used by held items

## Skeleton

The bone hierarchy has three branches:

- `root > hips > spine > chest > neck > head`
- `chest > shoulder.S > upperarm.S > forearm.S > hand.S > fingers.S`
- `hips > thigh.S > shin.S > foot.S`

Here S is L or R. Every bone's rest orientation is the world axes.

A pose is `{t:[x,y,z], r:{bone:[rx,ry,rz]}, p:{bone:[dx,dy,dz]}}`. Rotations use Euler angles applied as `R = Ry·Rx·Rz`:

- `rx>0`: an upright bone bends **forward**; a hanging limb swings **backward**. Lift a leg forward with `rx<0`. A knee bends with shin `rx>0`, an elbow with forearm `rx<0`.
- `rz>0`: an upright bone leans to the hero's **right**; a hanging limb's end moves toward **+x**. That is outward for `.L` and inward for `.R`.
- `ry>0` turns toward the hero's left.
- `H3.rig.mirror(pose)` swaps L and R and negates `ry` and `rz`.
- `fingers.S` closes the hand: `rz<0` for `.L`, `rz>0` for `.R`.

## Gear: one template per slot

| slot | item | mechanism it demonstrates |
|---|---|---|
| head | `hood` | Weights copied from head/neck/torso (`bind:{from:[...]}`); `hides:["hair.back"]` |
| body | `tunic` | Built from the body's inflated torso and arm rings (`H3.body.inflate`); weights copied from the body; hides `torso.tie` and `torso.lace` |
| back | `cape` | Spring bones: 5 chains × 3 bones on `chest`, softer toward the hem; collides with the body colliders; trails with `clip.speed` |
| hands | `hide_gloves` | A shell offset from the body's own hand meshes (`shell()` in `gear/limbs.js`); hides `hand` |
| feet | `boots` | The same shell technique on the foot and shin, with a flared cuff; hides `foot` |
| charm | `pendant` | A cord on the torso, with an amulet hanging from its own small spring bone |
| main | `iron_sword` | A held item authored in grip space and placed in the fist; a pose hint closes the fingers; `kind:"sword"` drives the attack variant |
| off | `wood_shield` | Built in rest space and bound rigidly to `forearm.L`; `kind:"shield"` drives the guard pose |

```js
H3.gear.register({id:"hood", slot:"head", name:"Leather hood", colors:{main:"#4b4236"},
  hides:["hair.back"], kind:"hood", build(ctx){ return {meshes:[...], bones:[...], colliders:[...], pose:{r:{...}}} }});
```

- **Slots** are `head body back hands feet charm main off`. `back` is a 3D-only cosmetic slot for capes. Ids match the game's item ids where they exist, so mapping game items to 3D gear later is a lookup.
- **`ctx`** gives the item:
  - `dims` and `body` (`H3.body`)
  - `col(name)`, which returns a colour with loadout overrides applied
  - the `G` and `U` helpers
  - `grip`, `side`, `has(slot)` and `kind`
- **Binding** (`mesh.bind`):
  - `"bone"`: rigid
  - `{bones:[..],power}`: inverse distance to those bones
  - `{fn:p=>[[bone,w],..]}`: explicit weights
  - `{from:["torso","arm"]}`: copy weights from those body parts
  - *omitted*: copy weights from the whole body
- **Held items** (`main` and `off`) are authored with the handle along +Y and the origin at the centre of the grip. Set `mesh.held=true` and assembly moves the item into the fist and binds it to the hand.
- **Recolouring**: a loadout entry may carry colour overrides, e.g. `{id:"cape", colors:{main:"#2f4a3e"}}` (see `adventurer`).
- **Adding an item**: copy the template for the closest mechanism, change the shapes and colours, and register a new id. The viewer and checks pick it up automatically.

## Animation

| clip | type | notes |
|---|---|---|
| `idle` | loop 3.2 s | Breathing, weight shift, relaxed arms; an armed hero holds the blade low |
| `walk` | loop 1.0 s, speed 1.3 | Heel strike and toe-off, counter-rotating chest; an armed hero carries the blade forward |
| `run` | loop 0.66 s, speed 3.2 | Flight phase, pumping arms, lean |
| `attack` | 0.9 s | Variant from `ctx.kind.main`: sword = diagonal slash, otherwise a punch. `ctx.kind.off==="shield"` adds a guard |
| `cast` | 1.2 s | Gather, push forward |
| `hit` | 0.5 s | Flinch back |
| `block` | 0.8 s | Forearm and shield swung across the front |
| `victory` | 1.6 s | Arm (and blade) raised, hop |
| `defeat` | 1.4 s | Stagger to one knee; holds the kneel |

- One-shot clips start, and except `defeat` end, on the idle pose.
- Walk and run are in-place loops. A game moves the entity at `speed`.
- `anim.js` provides these helpers:
  - easing functions
  - `track()` keyframes for numbers or `[rx,ry,rz]`
  - `shot()` for one-shots anchored to idle
  - `floorY()` to keep the soles on the floor
  - `airborne()` for hops

## Rendering notes

- A frame has these passes: skinning, then rasterising into depth, normal and position buffers, then per-pixel paint and material shading (cool shadows, warm key, rim), then contact shading, then ink.
- Stills render supersampled: 760×1000 at ss=2 takes about 0.4 s in Node or the browser.
- The viewer previews at a reduced resolution, around 30 ms per frame, and redraws at full quality when paused.
- `H3.hero.frame(..., {bg:false})` gives a transparent sprite with its ground shadow.
