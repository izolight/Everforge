// V-17 enemy role profiles. This file is data/helpers only until combat and
// generation explicitly opt into the role system.
const ROLE_ORDER = Object.freeze(["bruiser", "skirmisher", "caster", "support"]);
const ENEMY_ROLES = Object.freeze({
  bruiser: Object.freeze({
    key: "bruiser",
    name: "Bruiser",
    desc: "Hard to wear down; its heavy attacks punish missed defenses.",
    hp: 1.16, atk: .96, def: 1,
    kinds: Object.freeze(["heavy", "guard", "enrage"])
  }),
  skirmisher: Object.freeze({
    key: "skirmisher",
    name: "Skirmisher",
    desc: "Light and quick; it favors repeated or evasive attacks.",
    hp: .94, atk: 1.05, def: 0,
    kinds: Object.freeze(["multi", "burrow", "inflict"])
  }),
  caster: Object.freeze({
    key: "caster",
    name: "Caster",
    desc: "Fragile at close range; it channels harmful effects or draining attacks.",
    hp: .9, atk: 1.08, def: 0,
    kinds: Object.freeze(["inflict", "drain", "heavy"])
  }),
  support: Object.freeze({
    key: "support",
    name: "Support",
    desc: "Sustains itself with healing, wards, or helpful status effects.",
    hp: 1.06, atk: .9, def: 1,
    kinds: Object.freeze(["heal", "guard", "inflict"])
  })
});

// Existing authored enemies receive a stable tactical label from their authored
// special. Generated rosters can instead assign roles by slot, without an RNG draw.
function roleFromSpecial(sp) {
  if (!sp) return "bruiser";
  if (["heal", "summon"].includes(sp.kind)) return "support";
  if (["multi", "burrow"].includes(sp.kind)) return "skirmisher";
  if (["inflict", "drain"].includes(sp.kind)) return "caster";
  return "bruiser";
}

function roleOf(enemy) {
  if (!enemy) return null;
  if (ENEMY_ROLES[enemy.role]) return enemy.role;
  return roleFromSpecial(enemy.sp);
}

function roleForSlot(index) {
  if (!Number.isInteger(index)) throw new Error("Role slot must be an integer");
  return ROLE_ORDER[((index % ROLE_ORDER.length) + ROLE_ORDER.length) % ROLE_ORDER.length];
}

// Cycle across the roles supported by a biome's pool. Some authored biome pools
// have no restorative special, so labeling one of their foes Support would be
// misleading. This is deterministic and adds no random draws.
function roleForPoolSlot(index, biomePool) {
  const pool = biomePool || [];
  const available = ROLE_ORDER.filter(role => pool.some(sp => ENEMY_ROLES[role].kinds.includes(sp.kind)));
  if (!available.length) return roleForSlot(index);
  if (!Number.isInteger(index)) throw new Error("Role slot must be an integer");
  return available[((index % available.length) + available.length) % available.length];
}

// Prefer a biome's themed specials when one has a role-compatible kind. If the
// intersection is empty, retain the biome pool rather than lose its signature;
// the shared pool is only a fallback for biomes without their own pool. The
// caller supplies its existing generator RNG; selection consumes one draw.
function roleSpecial(role, biomePool, sharedPool, random) {
  const kinds = ENEMY_ROLES[role]?.kinds;
  if (!kinds || typeof random !== "function") throw new Error("Invalid role special request");
  const themed = (biomePool || []).filter(sp => kinds.includes(sp.kind));
  const candidates = themed.length ? themed : (biomePool && biomePool.length ? biomePool : (sharedPool || []).filter(sp => kinds.includes(sp.kind)));
  if (!candidates.length) throw new Error(`No special available for ${role}`);
  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll > 1) throw new Error("Role RNG must return a value in [0, 1]");
  return candidates[Math.min(candidates.length - 1, Math.floor(roll * candidates.length))];
}

// Return a combat-only stat copy. Bosses keep their authored phase/profile rules.
function roleStats(enemy, role) {
  const spec = ENEMY_ROLES[role];
  if (!enemy) return enemy;
  if (!spec || enemy.boss) return { ...enemy };
  return {
    ...enemy,
    hp: Math.max(1, Math.round(enemy.hp * spec.hp)),
    atk: Math.max(1, Math.round(enemy.atk * spec.atk)),
    def: Math.max(0, enemy.def + spec.def)
  };
}

if (typeof module !== "undefined") {
  module.exports = { ROLE_ORDER, ENEMY_ROLES, roleFromSpecial, roleOf, roleForSlot, roleForPoolSlot, roleSpecial, roleStats };
}
