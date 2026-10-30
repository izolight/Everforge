#!/usr/bin/env node
// V-17 integrated role generation, combat, and mobile battle UI regression.
const assert = require("assert");
const path = require("path");
const { chromium } = require("playwright");

const URL = "file://" + path.resolve(__dirname, "..", "index.html");
const SHOT = path.resolve(__dirname, "../combat-evidence/v17-role-mobile.png");

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(URL);
    await page.addInitScript(() => localStorage.setItem("everforge-lang", "en"));
    const result = await page.evaluate(() => {
      LANG = "en";
      const order = [...ROLE_ORDER];
      const checkRoster = roster => {
        const counts = Object.fromEntries(order.map(role => [role, 0]));
        const biome = roster[0] && (roster[0].biome || ZONE_BIOME[roster[0].zone]);
        const pool = BIOME_SP[biome] || GEN_SP;
        const available = order.filter(role => pool.some(entry => ENEMY_ROLES[role].kinds.includes(entry.kind)));
        for (const foe of roster) {
          if (!order.includes(foe.role)) throw Error(`Missing role on ${foe.id}`);
          counts[foe.role]++;
          const compatible = pool.some(entry => ENEMY_ROLES[foe.role].kinds.includes(entry.kind));
          if (compatible && !ENEMY_ROLES[foe.role].kinds.includes(foe.sp.kind)) throw Error(`${foe.id}: ${foe.role} has incompatible ${foe.sp.kind}`);
          if (!compatible && !pool.some(entry => entry.name === foe.sp.name)) throw Error(`${foe.id}: fallback lost its biome signature`);
        }
        if (available.some(role => !counts[role]) || Math.max(...available.map(role => counts[role])) - Math.min(...available.map(role => counts[role])) > 1) throw Error("Roster roles are missing or uneven for its biome pool");
        return counts;
      };
      const authored = Object.values(ENEMIES).filter(foe => !foe.gen && !foe.boss);
      const authoredRoles = [...new Set(authored.map(roleOf))].sort();
      if (order.some(role => !authoredRoles.includes(role))) throw Error("Authored enemies do not represent every role");
      const regional = {};
      const regionalFoes = [];
      for (const zone of ["woods", "pass", "hollow", "spire"]) {
        const roster = genRoster(zone);
        if (roster.length !== GEN_N) throw Error(`${zone}: expected ${GEN_N} generated wilds`);
        regionalFoes.push(...roster);
        regional[zone] = checkRoster(roster);
      }

      const seed = 1478777168;
      const makeRiftRoster = () => {
        riftMake(seed, 1);
        return Array.from({ length: RIFT_N }, (_, i) => ENEMIES[`w_rift_${i}`]);
      };
      const rift = makeRiftRoster();
      const deterministic = JSON.stringify(rift.map(e => [e.id, e.role, e.name, e.sp.kind])) ===
        JSON.stringify(makeRiftRoster().map(e => [e.id, e.role, e.name, e.sp.kind]));
      if (!deterministic) throw Error("Same Rift seed changed role/special roster");
      const riftCounts = checkRoster(rift);
      const simulatedRoles = [...new Set([...authored.map(roleOf), ...regionalFoes.map(roleOf), ...rift.map(roleOf)])].sort();
      if (order.some(role => !simulatedRoles.includes(role))) throw Error("role simulation coverage is incomplete");

      S = freshState();
      S.zone = RIFT_ZONE;
      S.unlocked = ZONES.map(zone => zone[0]);
      S.unl = Object.fromEntries(UNLOCKS.map((unlock, i) => [unlock.id, i + 1]));
      S.rift = { seed, depth: 1, best: 1, cleared: 0 };
      S.view = "battle";
      S.hp = pstats().maxHp;
      S.battle = null;
      S.event = null;

      const battleProfiles = {};
      for (const role of order) {
        const foe = rift.find(entry => entry.role === role) || regionalFoes.find(entry => entry.role === role);
        if (!foe) throw Error(`No simulated foe for ${role}`);
        startBattle(foe.id, { rar: "normal", afx: [], biomeMods: false, depthMods: false });
        const got = { role: S.battle.role, hp: S.battle.max, atk: S.battle.atk, def: S.battle.def };
        if (got.role !== role || !Number.isFinite(got.hp) || got.hp < 1 || !Number.isFinite(got.atk) || got.atk < 1 || !Number.isFinite(got.def) || got.def < 0) throw Error(`${role} battle has invalid role/profile: ${JSON.stringify(got)}`);
        battleProfiles[role] = got;
        S.battle = null;
      }

      const boss = ENEMIES.rift_boss;
      startBattle("rift_boss", { rar: "normal", afx: [], biomeMods: false, depthMods: false });
      const bossUnchanged = roleStats(boss, roleOf(boss)).hp === boss.hp && roleStats(boss, roleOf(boss)).atk === boss.atk && roleStats(boss, roleOf(boss)).def === boss.def;
      const bossRole = S.battle.role;
      const chip = document.querySelector(".role-chip");
      const cue = chip && (chip.getAttribute("data-tip") || chip.getAttribute("title") || chip.getAttribute("aria-label") || "");
      const roleUi = !!chip && chip.textContent.trim() === tx(ENEMY_ROLES[bossRole].name) && cue.includes(tx(ENEMY_ROLES[bossRole].desc));
      const mobile = { width: document.documentElement.scrollWidth, view: innerWidth };
      return { order, authoredCount: authored.length, authoredRoles, generatedCount: GEN_N, regional, riftBiome: rift[0].biome, riftCount: rift.length, riftCounts, simulatedRoles, deterministic, battleProfiles, bossUnchanged, roleUi, mobile };
    });
    assert.strictEqual(result.riftCount, 10, "Rift wild roster size stays unchanged");
    assert(result.deterministic, "Rift roster roles and specials are seeded");
    assert(result.bossUnchanged, "role stats do not alter Rift master profile");
    assert(result.roleUi, "battle header exposes the translated role and description");
    assert(result.mobile.width <= result.mobile.view, "role badge fits the mobile battle layout");
    assert.deepStrictEqual(errors, [], "browser has no page errors");
    await page.locator("body").screenshot({ path: SHOT, fullPage: true });
    console.log("ENEMY ROLE CHECK OK", JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
