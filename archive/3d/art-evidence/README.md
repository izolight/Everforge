# 3D hero (exploratory, `art3d/`)

The current simplified Prismatic Wanderer is shown in the [front / three-quarter / side / back turnaround](prismatic-wanderer-turnaround.png), [cape-free turnaround](prismatic-wanderer-under-cape.png) and [face close-up](prismatic-wanderer-face.png). These are actual geometry renders against `prismatic-simplified-heroes-v1.png`, using `--preset prismatic --variant female` (or `prismatic_under_cape`). Earlier hero images below document the previous models.

Rendered in Node with `node tools/hero3d-shot.js --evidence`, using the dependency-free software renderer. See [art3d/README.md](../art3d/README.md).

- [Base hero turnaround](hero3d-base.png): the unequipped body in front, 3/4, side and back views. It shows the face, hair, linen undershirt, waist tie, wrapped shins and mitten hands, in the rest pose.
- [Wanderer turnaround](hero3d-wanderer.png): the 2D portrait's default look (hood, tunic, cape, boots, sword), built entirely from swappable gear.
- [Loadouts](hero3d-loadouts.png): the `wanderer` and `adventurer` presets. `adventurer` fills every slot and recolours the cape through a loadout override.
- Animation sheets, 8 frames each, with the adventurer loadout: [idle](hero3d-anim-idle.png), [walk](hero3d-anim-walk.png), [run](hero3d-anim-run.png), [attack](hero3d-anim-attack.png) (sword slash with shield guard), [cast](hero3d-anim-cast.png), [hit](hero3d-anim-hit.png), [block](hero3d-anim-block.png), [victory](hero3d-anim-victory.png), [defeat](hero3d-anim-defeat.png). The cape and pendant move by spring-bone simulation.
- `node tools/hero3d-check.js` checks that every item and preset assembles with normalised skin weights, that every clip keeps the feet above the floor, and that frames are deterministic.

