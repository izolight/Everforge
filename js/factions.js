// V-19 faction metadata and deterministic special filtering.
// This module does not assign factions to game enemies until the generator
// integration is frozen; it is safe to load beside the V-17 role model.
const FACTION_ORDER = Object.freeze(["raiders", "cultists", "starCult", "constructs"]);
const ENEMY_FACTIONS = Object.freeze({
  raiders: Object.freeze({
    key: "raiders", name: "Raiders", desc: "Raiders strike hard and press their attack.",
    role: "bruiser", kinds: Object.freeze(["heavy", "guard", "inflict"]),
    mark: "crossed-blades", color: "#d99058"
  }),
  cultists: Object.freeze({
    key: "cultists", name: "Cultists", desc: "Cultists harry their prey with repeated or baleful attacks.",
    role: "skirmisher", kinds: Object.freeze(["multi", "burrow", "inflict"]),
    mark: "three-prong", color: "#c27aa8"
  }),
  starCult: Object.freeze({
    key: "starCult", name: "Cult of the Star", desc: "The star cult drains strength through arcane rites.",
    role: "caster", kinds: Object.freeze(["drain", "inflict", "heavy"]),
    mark: "eight-point-star", color: "#d6bd65"
  }),
  constructs: Object.freeze({
    key: "constructs", name: "Constructs", desc: "Constructs endure and restore their defenses.",
    role: "support", kinds: Object.freeze(["heal", "guard", "inflict"]),
    mark: "rune-square", color: "#82a9ba"
  })
});

// Explicit authored memberships make shared factions visible across regions.
// Generated enemies use the stable role-slot cycle below, without a new draw.
const AUTHORED_FACTIONS = Object.freeze({
  bandit: "raiders", raider: "raiders",
  witch: "cultists", seer: "cultists", fen_mirewitch: "cultists",
  golem: "constructs", slag: "constructs", anvil: "constructs", orrery: "constructs",
  revenant: "starCult", acolyte: "starCult", seraph: "starCult"
});

function factionForRole(role) {
  const faction = FACTION_ORDER.find(key => ENEMY_FACTIONS[key].role === role);
  if (!faction) throw new Error(`No faction paired with role ${role}`);
  return faction;
}

function factionOf(enemy, id = enemy?.id) {
  if (!enemy) return null;
  if (ENEMY_FACTIONS[enemy.faction]) return enemy.faction;
  return AUTHORED_FACTIONS[id] || null;
}

// Filter the role-compatible pool through the faction's signature kinds.
// Prefer matching biome specials, then matching shared specials, and spend
// exactly the caller's existing special-selection draw.
function factionSpecial(faction, roleKinds, biomePool, sharedPool, random) {
  const spec = ENEMY_FACTIONS[faction];
  if (!spec || !Array.isArray(roleKinds) || typeof random !== "function")
    throw new Error("Invalid faction special request");
  const allowed = new Set(spec.kinds.filter(kind => roleKinds.includes(kind)));
  if (!allowed.size) throw new Error(`Faction ${faction} has no special compatible with its role`);
  const themed = (biomePool || []).filter(sp => allowed.has(sp.kind));
  const candidates = themed.length ? themed : (sharedPool || []).filter(sp => allowed.has(sp.kind));
  if (!candidates.length) throw new Error(`No special available for faction ${faction}`);
  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll > 1) throw new Error("Faction RNG must return a value in [0, 1]");
  return candidates[Math.min(candidates.length - 1, Math.floor(roll * candidates.length))];
}

if (typeof module !== "undefined") {
  module.exports = { FACTION_ORDER, ENEMY_FACTIONS, AUTHORED_FACTIONS, factionForRole, factionOf, factionSpecial };
}
