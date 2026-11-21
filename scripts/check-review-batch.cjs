/* Real review controls with isolated responses; never publishes to Google. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const harness = `
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import ReviewManager from '/src/ReviewManager.tsx';
window.__synced=0; window.__toasts=[];
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ReviewManager, {
 liveReviews:[],setLiveReviews:()=>{},loadingReviews:false,syncingReviews:false,
 providerToken:'test-google',user:{id:'owner'},activeLocationId:'locations/1',
 handleSyncReviews:()=>{},onReviewsChanged:()=>{window.__synced++},
 showToast:(message,type)=>window.__toasts.push({message,type})
}));`;
const api = `export const API_URL='http://test.invalid';window.__batchCalls=0;
export async function apiFetch(url,options={}) {
 if(!url.endsWith('/batch-reply')) return Response.json({jobs:[]});
 window.__batchCalls++;
 if(window.__mode==='pending') await new Promise(resolve=>window.__release=resolve);
 if(window.__mode==='network') throw new TypeError('Failed to fetch');
 if(window.__mode==='outage') return Response.json({detail:'AI provider is temporarily unavailable.'},{status:503});
 if(window.__mode==='partial') return Response.json({replied:[{status:'published'},{status:'failed',error:'Google delivery is uncertain; the reply is held for reconciliation'}]});
 return Response.json({replied:[]});
}`;
(async () => {
 const browser = await chromium.launch({executablePath:process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
  for (const mode of ['pending','outage','partial','network','empty']) {
   const page = await browser.newPage(); const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**',r=>r.abort());
   await page.route('**/src/main.tsx*',r=>r.fulfill({contentType:'application/javascript',body:harness}));
   await page.route('**/src/lib/api.ts*',r=>r.fulfill({contentType:'application/javascript',body:api}));
   await page.goto('http://127.0.0.1:5173');
   await page.getByRole('button',{name:'Reply to 5 Reviews',exact:true}).waitFor();
   await page.evaluate(value=>{window.__mode=value},mode);
   await page.getByRole('button',{name:'Reply to 5 Reviews',exact:true}).click();
   if(mode==='pending') {
    const busy=page.getByRole('button',{name:'Replying…',exact:true});
    assert(await busy.isDisabled());
    assert(await page.getByRole('button',{name:'Reply to All Unreplied (Max 25)',exact:true}).isDisabled());
    await page.evaluate(()=>{document.querySelector('button[disabled]').click();window.__release()});
   }
   await page.waitForFunction(()=>window.__synced===1);
   const result=await page.evaluate(()=>({calls:window.__batchCalls,toast:window.__toasts.at(-1)}));
   assert.equal(result.calls,1);
   if(mode==='outage') assert.match(result.toast.message,/AI provider is temporarily unavailable/);
   if(mode==='partial') {assert.match(result.toast.message,/1 replies published; 1 could not be completed/);assert.match(result.toast.message,/held for reconciliation/);assert.equal(result.toast.type,'error')}
   if(mode==='network') assert.match(result.toast.message,/Sync reviews before retrying; some replies may already have been published/);
   if(mode==='empty') assert.equal(result.toast.message,'No eligible unanswered reviews were found.');
   assert.equal(await page.getByRole('button',{name:'Reply to 5 Reviews',exact:true}).isDisabled(),false);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Review batch UI: provider errors, partial delivery, uncertain transport, empty batch, busy controls and no duplicate request passed.');
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
