#!/usr/bin/env node
// Runs every tools/*-check.js and then tools/smoke.js, one after another; prints PASS/FAIL per file and exits non-zero if any failed.
// Usage: node tools/run-checks.js   (npm test)
const fs=require("fs"),path=require("path"),{spawnSync}=require("child_process");
const files=[...fs.readdirSync(__dirname).filter(f=>f.endsWith("-check.js")).sort(),"smoke.js"];
let fails=0;
for(const f of files){
  console.log(`\n=== ${f}`);
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{stdio:"inherit"});
  const pass=r.status===0;if(!pass)fails++;
  console.log(`${pass?"PASS":"FAIL"} ${f}`);
}
console.log(`\n${files.length-fails}/${files.length} passed`);
process.exit(fails?1:0);
