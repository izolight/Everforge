#!/usr/bin/env node
// V-17 isolated role-model check. It does not load or mutate game data.
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const { ROLE_ORDER, ENEMY_ROLES, roleFromSpecial, roleOf, roleForSlot, roleForPoolSlot, roleSpecial, roleStats } = require("../js/roles.js");

assert.deepStrictEqual(ROLE_ORDER, ["bruiser", "skirmisher", "caster", "support"]);
assert(ROLE_ORDER.every(role => ENEMY_ROLES[role].name && ENEMY_ROLES[role].desc && ENEMY_ROLES[role].kinds.length));
assert.strictEqual(new Set(ROLE_ORDER.map((_, i) => roleForSlot(i))).size, ROLE_ORDER.length);
assert.strictEqual(roleForSlot(0), roleForSlot(4));
for (let rosterSize = 10; rosterSize <= 14; rosterSize++) {
  const counts = Object.fromEntries(ROLE_ORDER.map(role => [role, 0]));
  for (let slot = 0; slot < rosterSize; slot++) counts[roleForSlot(slot)]++;
  assert(ROLE_ORDER.every(role => counts[role] > 0), `${rosterSize}-creature rosters represent every role`);
  assert(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1, "role slots stay evenly distributed");
}
for (const pool of [
  [{kind:"heavy"},{kind:"multi"},{kind:"drain"}],
  [{kind:"heavy"},{kind:"multi"},{kind:"heal"}]
]) {
  const available = ROLE_ORDER.filter(role => pool.some(sp => ENEMY_ROLES[role].kinds.includes(sp.kind)));
  const counts = Object.fromEntries(available.map(role => [role, 0]));
  for (let slot = 0; slot < 12; slot++) {
    const role = roleForPoolSlot(slot, pool);
    assert(available.includes(role), "pool slot only chooses a role with a compatible special");
    counts[role]++;
  }
  assert(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1, "compatible pool roles stay balanced");
}
assert.strictEqual(roleFromSpecial({kind:"heal"}), "support");
assert.strictEqual(roleFromSpecial({kind:"multi"}), "skirmisher");
assert.strictEqual(roleFromSpecial({kind:"drain"}), "caster");
assert.strictEqual(roleFromSpecial({kind:"heavy"}), "bruiser");
assert.strictEqual(roleFromSpecial({kind:"summon"}), "support");
assert.strictEqual(roleOf({role:"support",sp:{kind:"heavy"}}), "support", "explicit role wins over inferred role");
assert.strictEqual(roleOf({sp:{kind:"drain"}}), "caster", "authored role follows its special");
assert.strictEqual(roleOf(null), null);

// Load the authored catalog in an isolated context, then ensure each current
// non-boss has a valid inferred role and every role has authored representation.
const dataContext = {};
vm.runInNewContext(fs.readFileSync(require.resolve("../js/data.js"), "utf8") + ";globalThis.__enemies=ENEMIES", dataContext);
const authoredRegulars = Object.values(dataContext.__enemies).filter(enemy => !enemy.boss);
const authoredRoles = new Set(authoredRegulars.map(enemy => roleOf(enemy)));
assert(authoredRegulars.length > 0);
assert(ROLE_ORDER.every(role => authoredRoles.has(role)), "authored roster covers every role");
assert(authoredRegulars.every(enemy => ROLE_ORDER.includes(roleOf(enemy))), "every authored regular maps to a role");

const sample = { hp:100, atk:20, def:4 };
const roleStatsByName = {};
for (const role of ROLE_ORDER) {
  const source = { ...sample, id:"sample", sp:{kind:"heavy"}, drops:["ore"] };
  const stats = roleStats(source, role);
  roleStatsByName[role] = stats;
  assert(stats.hp > 0 && stats.atk > 0 && stats.def >= 0);
  assert.strictEqual(stats.id, source.id, "role profile preserves identity");
  assert.strictEqual(stats.sp, source.sp, "role profile preserves special");
  assert.strictEqual(stats.drops, source.drops, "role profile preserves rewards");
  assert.deepStrictEqual(source, { ...sample, id:"sample", sp:{kind:"heavy"}, drops:["ore"] }, "combat profile does not mutate generated data");
}
assert(roleStatsByName.bruiser.hp > sample.hp && roleStatsByName.bruiser.def > sample.def && roleStatsByName.bruiser.atk < sample.atk);
assert(roleStatsByName.skirmisher.hp < sample.hp && roleStatsByName.skirmisher.atk > sample.atk);
assert(roleStatsByName.caster.hp < sample.hp && roleStatsByName.caster.atk > sample.atk);
assert(roleStatsByName.support.hp > sample.hp && roleStatsByName.support.def > sample.def && roleStatsByName.support.atk < sample.atk);
const boss = { ...sample, boss:true };
assert.deepStrictEqual(roleStats(boss, "support"), boss, "boss stats remain authored");

for (const role of ROLE_ORDER) {
  let draws = 0;
  const themed = [{name:"theme heal",kind:"heal"},{name:"theme heavy",kind:"heavy"}];
  const shared = [{name:"shared",kind:ENEMY_ROLES[role].kinds[0]}];
  const selected = roleSpecial(role, themed, shared, () => { draws++; return .5; });
  assert(ENEMY_ROLES[role].kinds.includes(selected.kind) || themed.some(sp => ENEMY_ROLES[role].kinds.includes(sp.kind)) === false && themed.includes(selected), `${role} receives a compatible special or retains its biome signature when no compatible kind exists`);
  assert.strictEqual(draws, 1, `${role} selection consumes one draw`);
}

assert.strictEqual(
  roleSpecial("skirmisher", [{name:"healing grove",kind:"heal"}], [{name:"shared multi",kind:"multi"}], () => .25).name,
  "healing grove",
  "retain a biome signature when it has no role-compatible special"
);
assert.strictEqual(roleSpecial("skirmisher", [], [{name:"shared multi",kind:"multi"}], () => .25).name, "shared multi", "use shared compatible specials only when no biome pool exists");
assert.strictEqual(roleSpecial("caster", [{name:"last",kind:"drain"}], [], () => 1).name, "last", "a boundary RNG value still selects a candidate");
assert.throws(() => roleSpecial("caster", [], [], () => .5), /No special available/);
assert.throws(() => roleForSlot(1.5), /integer/);

console.log("ROLE MODEL CHECK OK: 4 roles, stable authored/slot mapping, boss-safe stat copies, compatible pools, one draw per selection");
