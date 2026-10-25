// Shared helpers for the Playwright checks: the game URL and a fresh page with the sound and toast spies in place.
const path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");

async function open(browser,w,setup){
  const page=await browser.newPage({viewport:{width:w,height:844},reducedMotion:"reduce"}),errs=[];
  page.on("pageerror",e=>errs.push(e.message));page.on("console",m=>{if(m.type()==="error"&&!/fonts\.(googleapis|gstatic)|net::ERR/.test(m.text()))errs.push(m.text())});
  await page.goto(URL);if(setup){await page.evaluate(setup);await page.reload()}
  await page.waitForFunction(()=>typeof S==="object"&&S);page.errs=errs;
  await page.evaluate(()=>{window.__s=[];window.__t=[];const s0=sfx,t0=toast;window.sfx=(n,d)=>{__s.push(n);return s0(n,d)};window.toast=(m,l)=>{__t.push(m);return t0(m,l)}}); // spies: sounds and toasts
  return page;
}
module.exports={URL,open};
