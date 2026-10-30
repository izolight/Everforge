# Enemy factions (V-19)

Factions are shared organizations with a readable mark and a combat identity. A
faction tag is lightweight enemy metadata; it must not change map generation,
save shape, authored boss phases, alpha count, or V-10 encounter weights.

## Taxonomy

| Faction | Shared membership | Combat signature | Visual cue |
| --- | --- | --- | --- |
| Raiders | Woods Bandit, Pass Raider, plus generated slots | Hard strikes and pressure (`heavy`, `guard`, `inflict`) | Crossed blades, rust orange |
| Cultists | Nightshade Witch, Cairn Seer, Fen Mire Witch, plus generated slots | Repeated or baleful attacks (`multi`, `burrow`, `inflict`) | Three prongs, magenta |
| Cult of the Star | Ash Revenant, Void Acolyte, Fallen Seraph, plus generated slots | Draining rites and force (`drain`, `inflict`, `heavy`) | Eight-point star, old gold |
| Constructs | Stone Golem, Slag Sentry, Anvil Crawler, Orrery Construct, plus generated slots | Guard, repair, or status effects (`guard`, `heal`, `inflict`) | Rune square, blue steel |

Authored memberships span at least two regions per faction. Generated members
are paired to the role selected by V-17's biome-aware slot cycle; a larger
roster repeats the available roles without an RNG draw. Authored lookup uses
the enemy catalog key, since authored definitions do not store their own ID.
The authored alpha remains the same creature in its existing slot and receives
the faction paired with its role.

## Integration contract

The V-17 role model remains authoritative for role and stat/special compatibility.
Faction special selection intersects the role-compatible kinds with a faction's
signature kinds, prefers matching biome specials, then falls back to matching
shared specials. It uses the already-existing special-selection draw once. If
the pools ever have no compatible result, generation must fail in a focused
check instead of silently giving a faction an unrelated special.

Faction names and marks are useful player-facing data in battle/Codex. The tag
does not grant separate rewards: this keeps regional economy and the no-affix
essence rule unchanged. No new creature families, elements, bosses, regions,
encounter count, or multi-enemy behavior are in scope.
