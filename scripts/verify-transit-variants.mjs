import {chromium,expect} from '@playwright/test';import fs from 'node:fs';
const url=process.env.SITE_URL||'http://localhost:4174/cuhk-wayfinder/',out=process.env.SCREENSHOT_DIR||'docs/screenshots';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);
const bus=async()=>{await page.locator('.mobile-switch [data-tab="bus"]').click();};
const date=async s=>{await page.locator('#bus-date').fill(s);await page.locator('#bus-date').press('Tab');};
try{
 await page.goto(url,{waitUntil:'networkidle'});await bus();await expect(page.locator('.bus-card')).toHaveCount(18);await page.locator('[data-bus-filter="special"]').click();await expect(page.locator('.bus-card')).toHaveCount(6);
 for(const label of ['2（停邵逸夫堂）','5（星期六）','6A（星期六）','7（星期六）','8（非教学日）','H（停39区）'])await expect(page.locator('.bus-card h3').filter({hasText:label})).toHaveCount(1);
 await date('2026-10-03T10:00');for(const [id,end] of [['5-saturday','13:26'],['6A-saturday','13:10'],['7-saturday','13:18']]){const c=page.locator(`[data-bus-variant="${id}"]`);await expect(c).toContainText(end);await expect(c.locator('.bus-status')).toContainText('始发站下一班');}
 await expect(page.locator('[data-bus-variant="2-rrs"] .bus-status')).toContainText('10:45 / 11:45 / 12:45');
 await date('2026-12-10T10:00');const nt=page.locator('[data-bus-variant="8-nonteaching"]');await expect(nt.locator('.bus-status')).toContainText('10:15 / 10:35 / 10:55');await nt.locator('summary').click();await expect(nt.locator('.bus-stop-sequence')).toContainText('崇基教學樓');
 for(const id of ['5-saturday','6A-saturday','7-saturday'])await expect(page.locator(`[data-bus-variant="${id}"] .bus-status`)).toContainText('不提供此类班次');
 await date('2026-10-04T10:00');await expect(page.locator('[data-bus-variant="H-area39"] .bus-status')).toContainText('10:00 / 11:00 / 12:00');await page.screenshot({path:out+'/bus-variants-mobile.png'});
 await date('2026-10-02T09:00');await page.locator('#try-cwc-route').click();await expect(page.locator('#destination')).toHaveValue(/敬文/);await page.locator('#calculate').click();
 const eight=page.locator('.route-card').filter({hasText:'8 号线'}).first();await expect(eight).toBeVisible({timeout:30000});await eight.click();await expect(page.locator('.step.bus')).toContainText('環迴東站');await expect(page.locator('.step.bus')).toContainText('敬文書院');await expect(page.locator('.steps')).toContainText('临时站');await expect(page.locator('.steps')).toContainText('近似');console.log('PGH1→CWC',await eight.innerText());
 await page.screenshot({path:out+'/pgh-cwc-route.png'});
 await bus();await page.locator('[data-stop-map="62"]').click();if(await page.locator('#three-toggle').getAttribute('aria-pressed')==='true')await page.locator('#three-toggle').click();await page.waitForTimeout(1300);const canvas=page.locator('.maplibregl-canvas'),box=await canvas.boundingBox();await canvas.click({position:{x:box.width/2,y:box.height/2}});await expect(page.locator('.campus-popup')).toContainText('環迴東站');await expect(page.locator('.campus-popup')).toContainText('4 / 8');await expect(page.locator('.campus-popup')).toContainText('近似');await page.screenshot({path:out+'/circuit-east-stop.png'});
 await page.locator('.mobile-switch [data-tab="explore"]').click();await page.locator('#search').fill('环回东');await expect(page.locator('.place-card')).toHaveCount(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);
 await page.waitForFunction(()=>document.querySelector('#cache-status')?.textContent.includes('离线'));
 await context.setOffline(true);await page.goto(url+'?from=b-109&to=f-309',{waitUntil:'networkidle'});await page.locator('#departure').fill('2026-12-10T09:00');await page.locator('#calculate').click();const offline=page.locator('.route-card').filter({hasText:'8 号线（非教学日）'}).first();await expect(offline).toBeVisible();await offline.click();await expect(page.locator('.step.bus')).toContainText('環迴東站');
 console.log('PASS: six explicit variants, Saturday times, non-teaching terminus, H hourly 39-area service, PGH1→Circuit East→8→CWC, stop map/search and offline.');
}finally{await browser.close();}
