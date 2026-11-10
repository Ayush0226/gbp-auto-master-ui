/* Run against Vite with Playwright installed, or set PLAYWRIGHT_MODULE to its package path.
 * This isolated preview uses the real components/styles and mocked API responses.
 * It never signs in or calls production services.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const base = process.env.LAYOUT_BASE_URL || 'http://127.0.0.1:5173';
const output = process.env.LAYOUT_OUTPUT || path.join(os.tmpdir(), 'gbp-plans-layout');
const main = `
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import '/src/index.css';
import '/src/design/studio.css';
import '/src/design/live-workspace.css';
import SubscriptionPage from '/src/SubscriptionPage.tsx';
const h=React.createElement;
const {createRoot}=ReactDOM;
createRoot(document.getElementById('root')).render(h('div',{className:'App'},
  h('div',{className:'app-shell st-live-app'},
    h('aside',{className:'sidebar'},h('b',{},'gbpautomaster'),h('nav',{className:'nav-menu'},h('button',{className:'nav-item active'},'Plans & access'))),
    h('div',{style:{flex:1,minWidth:0,display:'flex',flexDirection:'column'}},
      h('div',{className:'mobile-topbar'},'Plans & access'),
      h('main',{className:'main'},h('header',{},h('div',{className:'desktop-only-title'},h('h2',{},'Plans'))),
        h('div',{className:'content-container'},h(SubscriptionPage)))))));
`;
const api = `
export const API_URL='http://layout.invalid';
export async function apiFetch(url,options={}) {
  if(String(url).includes('redeem-access-code')) {
    const {code}=JSON.parse(options.body);
    if(code==='INVALID') return Response.json({detail:'Please retry this request. '+ 'reference_'.repeat(100)},{status:400});
    window.__lifetime=true;
    return Response.json({success:true,already_redeemed:false});
  }
  return Response.json({subscription:{plan_type:window.__lifetime?'yearly':'free',status:'active',is_lifetime:!!window.__lifetime,expires_at:null}});
}
`;

async function metrics(page) {
  return page.evaluate(() => {
    const rect = element => {
      const {left,right,width} = element.getBoundingClientRect();
      return {left,right,width};
    };
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      content: rect(document.querySelector('.content-container')),
      page: rect(document.querySelector('.access-page')),
      cards: [...document.querySelectorAll('.access-page .glass')].map(rect),
      input: document.querySelector('.access-code-form input') ? rect(document.querySelector('.access-code-form input')) : null,
      messages: [...document.querySelectorAll('.access-code-message')].map(element => ({width:element.clientWidth,scroll:element.scrollWidth})),
    };
  });
}

function verify(result) {
  assert(result.documentWidth <= result.viewport + 1, 'Document overflows horizontally');
  assert(result.page.width >= result.content.width - 1, 'Plans page is narrower than its content area');
  for (const box of [...result.cards, ...(result.input ? [result.input] : [])]) {
    assert(box.left >= -1 && box.right <= result.viewport + 1, 'A card or input extends past the viewport');
  }
  for (const message of result.messages) assert(message.scroll <= message.width + 1, 'Long message does not wrap');
}

(async () => {
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({channel:process.env.LAYOUT_BROWSER || 'msedge',headless:true});
  const checks=[];
  try {
    for (const width of [1768,1440,1024,768,390,320]) {
      console.log('Checking viewport',width);
      const context = await browser.newContext({viewport:{width,height:906}});
      await context.route('https://**',route=>route.abort());
      await context.route('**/src/main.tsx*',route=>route.fulfill({contentType:'text/javascript',body:main}));
      await context.route('**/src/lib/api.ts*',route=>route.fulfill({contentType:'text/javascript',body:api}));
      const page=await context.newPage();
      page.setDefaultTimeout(15000);
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
      await page.getByText('Your account is ready for an access code.',{exact:true}).waitFor();
      verify(await metrics(page));
      if(width===1768 || width===390) await page.screenshot({path:path.join(output,`plans-${width}.png`),fullPage:true});
      await page.getByLabel('Access code',{exact:true}).fill('INVALID');
      await page.getByRole('button',{name:'Activate lifetime access',exact:true}).click();
      await page.getByRole('alert').waitFor();
      verify(await metrics(page));
      await page.getByLabel('Access code',{exact:true}).fill('LAYOUT-CHECK');
      await page.getByRole('button',{name:'Activate lifetime access',exact:true}).click();
      await page.getByRole('heading',{name:'Yearly · Lifetime access',exact:true}).waitFor();
      verify(await metrics(page));
      assert.equal(await page.locator('.access-code-form').count(),0,'Activation form remains after success');
      assert.equal(errors.length,0,errors.join('\n'));
      if(width===1768) await page.screenshot({path:path.join(output,'plans-lifetime.png'),fullPage:true});
      checks.push({width,free:true,longError:true,lifetime:true,overflow:false});
      await context.close();
    }
    await fs.writeFile(path.join(output,'results.json'),JSON.stringify(checks,null,2));
    console.log(JSON.stringify({checks,output},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
