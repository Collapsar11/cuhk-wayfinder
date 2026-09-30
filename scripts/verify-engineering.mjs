import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const url=process.env.SITE_URL||'http://localhost:4174/cuhk-wayfinder/';
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
try{
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator('.mobile-switch [data-tab="shortcuts"]').click();await expect(page.locator('.shortcut-card')).toHaveCount(9);
 await expect(page.locator('#shortcut-lsb-shb')).toContainText('SHB 5/F');await expect(page.locator('#shortcut-shb-erb')).toContainText('ERB 9/F');
 await page.locator('#try-engineering-route').click();await expect(page.locator('#origin')).toHaveValue(/研究生宿舍/);await expect(page.locator('#destination')).toHaveValue(/SHB 5 楼/);
 for(const [date,line] of [['2026-10-02T09:00','2S'],['2026-10-04T10:00','H'],['2026-10-02T20:00','N']]){
  await page.locator('#departure').fill(date);await page.locator('#departure').press('Tab');await page.locator('#calculate').click();
  const card=page.locator('.route-card').filter({hasText:'经邵逸夫堂 · 到 SHB 5 楼'});await expect(card).toHaveCount(1);await expect(card).toContainText(line+' 号线');await card.click();
  await expect(page.locator('.step.bus')).toContainText('研究生宿舍');await expect(page.locator('.step.bus')).toContainText('邵逸夫堂');await expect(page.locator('.steps')).toContainText('到达 SHB 5 楼连廊入口');
  console.log(date,await card.innerText());
 }
 fs.mkdirSync('docs/screenshots',{recursive:true});await page.screenshot({path:'docs/screenshots/engineering-route.png',fullPage:true});
 await page.locator('#shortcuts-enabled').uncheck();await page.locator('#calculate').click();await expect(page.locator('#route-results')).toContainText('SHB 5 楼入口通过连廊接入');await expect(page.locator('.route-card')).toHaveCount(0);
 await page.locator('.mobile-switch [data-tab="explore"]').click();await page.locator('#search').fill('SHB');
 // Use the actual building, not the separate entrance or a facility.
 await page.locator('[data-place="b-34"]').first().click();await page.locator('#mobile-map').click();await expect(page.locator('.maplibregl-canvas')).toBeVisible();
 await page.locator('#three-toggle').click();await page.waitForTimeout(1200);
 const canvas=page.locator('.maplibregl-canvas');const box=await canvas.boundingBox();
 // Off-centre hits the footprint, not its centre POI marker.
 await canvas.click({position:{x:box.width/2-20,y:box.height/2}});await expect(page.locator('.campus-popup h3')).toHaveText('何善衡工程學大樓');await expect(page.locator('.campus-popup')).toContainText('SHB');await expect(canvas).toBeVisible();
 await page.screenshot({path:'docs/screenshots/building-popup-mobile.png'});
 await page.locator('.maplibregl-popup-close-button').click();await page.locator('#three-toggle').click();await page.waitForTimeout(1000);
 // The same footprint is hit through its rendered 3D roof/wall.
 await canvas.click({position:{x:box.width/2-20,y:box.height/2-20}});await expect(page.locator('.campus-popup h3')).toHaveText('何善衡工程學大樓');await expect(canvas).toBeVisible();
 await page.screenshot({path:'docs/screenshots/building-popup-3d.png'});
 await page.locator('.maplibregl-popup-close-button').click();await page.locator('.mobile-switch [data-tab="shortcuts"]').click();await page.locator('[data-shortcut-map="lsb-shb"]').click();await page.waitForTimeout(1100);
 await page.locator('.lift-marker').filter({hasText:'↔'}).first().click();await expect(page.locator('.campus-popup')).toContainText('LG1/F');await expect(page.locator('.campus-popup')).toContainText('SHB 5/F');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);
 await page.waitForFunction(()=>document.querySelector('#cache-status')?.textContent.includes('离线'));
 await context.setOffline(true);await page.goto(url+'?from=b-109&to=entrance-shb-5',{waitUntil:'networkidle'});await page.locator('#departure').fill('2026-10-04T10:00');await page.locator('#calculate').click();await expect(page.locator('.route-card').filter({hasText:'经邵逸夫堂 · 到 SHB 5 楼'})).toContainText('H 号线');
 console.log('PASS: 2S/H/N PGH1→RRS→SHB5, floor arrival, disabled shortcut, actual 2D/3D footprint clicks, connection popup, mobile and offline.');
}finally{await browser.close();}
