#!/usr/bin/env node
// Isolated V-19 taxonomy check; no game generator or combat files are loaded.
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const { ROLE_ORDER, ENEMY_ROLES, roleForSlot } = require("../js/roles.js");
const { FACTION_ORDER, ENEMY_FACTIONS, AUTHORED_FACTIONS, factionForRole, factionOf, factionSpecial } = require("../js/factions.js");

assert.deepStrictEqual(FACTION_ORDER, ["raiders", "cultists", "starCult", "constructs"]);
assert(FACTION_ORDER.every(id => ENEMY_FACTIONS[id].name && ENEMY_FACTIONS[id].desc && ENEMY_FACTIONS[id].mark));
assert.strictEqual(new Set(FACTION_ORDER.map(id => ENEMY_FACTIONS[id].color)).size, FACTION_ORDER.length, "factions have distinct shared-look colors");
assert.strictEqual(new Set(ROLE_ORDER.map(role => factionForRole(role))).size, ROLE_ORDER.length);

const dataContext = {};
vm.runInNewContext(fs.readFileSync(require.resolve("../js/data.js"), "utf8") + ";globalThis.__enemies=ENEMIES", dataContext);
const enemies = dataContext.__enemies;
const authoredByFaction = Object.fromEntries(FACTION_ORDER.map(id => [id, []]));
for (const [id, faction] of Object.entries(AUTHORED_FACTIONS)) {
  assert(enemies[id], `authored faction member ${id} exists`);
  assert.strictEqual(enemies[id].faction, faction, `${id} carries its authored faction tag`);
  assert.strictEqual(factionOf(enemies[id], id), faction, `${id} resolves to its authored faction`);
  authoredByFaction[faction].push(enemies[id]);
}
assert.strictEqual(factionOf({ id: "new-generated-entry", faction: "starCult" }), "starCult", "explicit generated faction wins");
assert.strictEqual(factionOf({ id: "unknown" }), null, "unassigned content stays untagged");
assert(authoredByFaction.raiders.some(a => a.zone === "woods") && authoredByFaction.raiders.some(a => a.zone === "pass"), "raiders span Woods and Pass");
assert(new Set(authoredByFaction.cultists.map(a => a.zone)).size >= 2, "cultists span multiple authored regions");
assert(new Set(authoredByFaction.constructs.map(a => a.zone)).size >= 2, "constructs span multiple authored regions");
assert(new Set(authoredByFaction.starCult.map(a => a.zone)).size >= 2, "star cult spans multiple authored regions");

for (let size = 10; size <= 14; size++) {
  const tags = Array.from({ length: size }, (_, slot) => factionForRole(roleForSlot(slot)));
  const counts = Object.fromEntries(FACTION_ORDER.map(id => [id, tags.filter(tag => tag === id).length]));
  assert(FACTION_ORDER.every(id => counts[id] > 0));
  assert(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1, `${size}-slot faction distribution is balanced`);
  assert.deepStrictEqual(tags, Array.from({ length: size }, (_, slot) => factionForRole(roleForSlot(slot))), "slot tags are deterministic");
}

for (const role of ROLE_ORDER) {
  const faction = factionForRole(role);
  assert.strictEqual(ENEMY_FACTIONS[faction].role, role, `${faction} pairs with the stable role slot`);
  const roleKinds = ENEMY_ROLES[role].kinds;
  assert(ENEMY_FACTIONS[faction].kinds.some(kind => roleKinds.includes(kind)), `${faction} has a ${role}-compatible special`);
  let draws = 0;
  const themed = [{ name: "wrong theme", kind: "summon" }, { name: "signature", kind: ENEMY_FACTIONS[faction].kinds.find(kind => roleKinds.includes(kind)) }];
  const selected = factionSpecial(faction, roleKinds, themed, [{ name: "shared", kind: roleKinds[0] }], () => { draws++; return .5; });
  assert.strictEqual(selected.name, "signature", `${faction} selects its themed signature`);
  assert.strictEqual(draws, 1, "faction filter uses only one existing special draw");
  draws = 0;
  const fallback = factionSpecial(faction, roleKinds, [{ name: "off-theme", kind: "summon" }], [{ name: "shared signature", kind: selected.kind }], () => { draws++; return 0; });
  assert.strictEqual(fallback.name, "shared signature", "faction fallback stays signature-compatible");
  assert.strictEqual(draws, 1);
}

assert.throws(() => factionForRole("unassigned"), /No faction paired/);
assert.throws(() => factionSpecial("raiders", ["summon"], [], [], () => .5), /compatible/);
console.log("FACTION MODEL CHECK OK: cross-region authored tags, balanced deterministic slots, role-compatible signature specials, one draw");
