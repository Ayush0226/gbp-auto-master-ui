/* Real UI components, isolated provider/API fixtures; no production writes. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
const base='http://127.0.0.1:5173';
const harness=`
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import '/src/index.css';import '/src/design/studio.css';import '/src/design/live-workspace.css';
import ContentCalendarV2 from '/src/ContentCalendarV2.tsx';
const h=React.createElement;
ReactDOM.createRoot(document.getElementById('root')).render(h('div',{className:'st-live-app'},h(ContentCalendarV2,{
user:{id:'owner'},liveLocations:[{id:'locations/1',name:'Test café'}],activeLocationId:'locations/1',
showToast:(message,type)=>{window.__toast={message,type};}})));
`;
const api=`export const API_URL='http://test.invalid';window.__calls=[];
export async function apiFetch(url,options={}) {
window.__calls.push({url,body:options.body?JSON.parse(options.body):null});
if(url.includes('/images/providers')) return Response.json({cloudflare_available:true,pollinations_available:true,pollinations_connected:false});
if(url.includes('/legacy-posts/')) return Response.json({posts:[]});
if(url.includes('/images/generate')) {
 if(window.__exhausted) return Response.json({detail:'Provider daily allowance is exhausted'},{status:429});
 return Response.json({asset:{id:'generated-owned-image',public_url:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22512%22 height=%22512%22%3E%3Crect width=%22512%22 height=%22512%22 fill=%22%23abc389%22/%3E%3C/svg%3E'}});
}
if(options.method==='POST' && url.includes('/schedule')) return Response.json({status:'scheduled',location_count:1});
if(options.method==='POST' && url.endsWith('/campaigns')) return Response.json({campaign_id:'test-campaign'});
return Response.json({campaigns:[],assets:[]});}
`;
(async()=>{
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const output=path.join(os.tmpdir(),'gbp-image-journey');await fs.mkdir(output,{recursive:true});
try {
 for(const width of [1440,390]) {
 const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());
 await page.route('**/src/main.tsx*',r=>r.fulfill({contentType:'application/javascript',body:harness}));
 await page.route('**/src/lib/api.ts*',r=>r.fulfill({contentType:'application/javascript',body:api}));
 await page.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'application/javascript',body:'export const supabase={};'}));
 await page.goto(base);await page.getByRole('button',{name:'+ New campaign',exact:true}).click();
 await page.getByPlaceholder('Diwali admissions offer').fill('Weekly café update');
 await page.getByPlaceholder('Write the message customers will see on Google…').fill('Fresh coffee this week.');
 await page.getByLabel('Image description').fill('A warm café with fresh coffee');
 await page.getByRole('button',{name:'Generate preview',exact:true}).click();
 await page.getByRole('button',{name:'Use this image',exact:true}).click();
 await page.getByAltText('Selected campaign photo').waitFor();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
 await page.screenshot({path:path.join(output,'image-studio-'+width+'.png'),fullPage:true});
 await page.getByRole('button',{name:'Schedule campaign',exact:true}).click();
 await page.waitForFunction(()=>window.__toast?.type==='success');
 const created=await page.evaluate(()=>window.__calls.find(c=>c.url.endsWith('/campaigns')&&c.body));
 assert.equal(created.body.media_asset_id,'generated-owned-image');assert.deepEqual(created.body.location_ids,['locations/1']);
 await page.getByRole('button',{name:'+ New campaign',exact:true}).click();
 await page.getByLabel('Image description').fill('Another café photo');await page.evaluate(()=>window.__exhausted=true);
 await page.getByRole('button',{name:'Generate preview',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'allowance is exhausted'}).waitFor();assert.deepEqual(errors,[]);
 await page.close();
 }
 console.log('Image preview → owned media → campaign scheduling, mobile layout and provider error checks passed. Screenshots: '+output);
}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
