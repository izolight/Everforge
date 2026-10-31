# Enemy role model (V-17)

Roles describe how an enemy asks the player to respond. They are combat metadata; they do not change roster size, rewards, authored names, map generation, or save shape.

| Role | Stat bias | Special kinds | Player-facing cue |
| --- | --- | --- | --- |
| Bruiser | 1.16× HP, 0.96× ATK, +1 DEF | heavy, guard, enrage | Durable; punish missed defenses. |
| Skirmisher | 0.94× HP, 1.05× ATK | multi, burrow, inflict | Light and quick; repeated or evasive attacks. |
| Caster | 0.90× HP, 1.08× ATK | inflict, drain, heavy | Fragile at close range; channels harmful effects or draining attacks. |
| Support | 1.06× HP, 0.90× ATK, +1 DEF | heal, guard, inflict | Sustains itself with healing, wards, or helpful status effects. |

The stat bias is applied to a combat copy of a non-boss foe. HP and ATK are rounded to the nearest integer with a minimum of 1; DEF is clamped to zero. Boss phase profiles remain authored and unchanged. Role application must preserve all other creature fields, including alpha/affix metadata, specials, and drops.

Authored enemies infer a stable role from their existing special kind: heal and summon map to Support; multi and burrow to Skirmisher; inflict and drain to Caster; remaining kinds and enemies without a special map to Bruiser. Generated rosters cycle through the roles supported by their biome's special kinds. A biome without a Support-compatible signature special does not label a creature Support; its available role slots remain balanced to within one creature. Across authored enemies and generated biomes, all four roles appear in simulation coverage. Assignment uses no random draw. The generator filters a biome's signature specials to the assigned role's compatible kinds and uses its existing special-choice draw once. The shared pool remains the fallback only for a biome without its own pool.

V-17 does not add special kinds or summon new enemies. Existing behavior and role distinctions are conveyed through the chosen special, stat profile, and translated role label/description. It does not implement V-18 multi-enemy encounters or V-19 factions.
