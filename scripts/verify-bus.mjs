import {chromium,expect} from '@playwright/test';
const url=process.env.SITE_URL||'http://localhost:4173/cuhk-wayfinder/';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('.mobile-switch [data-tab="bus"]').click();
 await expect(page.locator('[data-bus-filter="H"]')).toBeVisible();await expect(page.locator('[data-bus-filter="N"]')).toBeVisible();
 await page.locator('[data-bus-filter="H"]').click();await page.locator('#bus-date').fill('2026-10-04T10:00');await page.locator('#bus-date').press('Tab');
 await expect(page.locator('.bus-card')).toHaveCount(1);await expect(page.locator('[data-bus-line="H"] .bus-status')).toContainText('10:00 / 10:20 / 10:40');
 await page.locator('[data-bus-filter="N"]').click();await expect(page.locator('.bus-status')).toContainText('所选日期不提供此线服务');
 await page.locator('#bus-date').fill('2026-10-02T20:00');await page.locator('#bus-date').press('Tab');await expect(page.locator('.bus-status')).toContainText('20:00 / 20:15 / 20:30');
 await page.locator('#bus-plan').click();await page.locator('#origin').fill('大学站西');await page.locator('#origin-results [data-pick]').first().click();await page.locator('#destination').fill('錢穆圖書館');await page.locator('#destination-results [data-pick]').first().click();
 for(const [date,line] of [['2026-10-02T20:00','N'],['2026-10-04T10:00','H']]){
  await page.locator('#departure').fill(date);await page.locator('#departure').press('Tab');await page.locator('#calculate').click();await expect(page.locator('.route-card').filter({hasText:line+' 号线'}).first()).toBeVisible({timeout:20000});console.log(date,await page.locator('.route-card').filter({hasText:line+' 号线'}).first().innerText());
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);console.log('PASS: H/N direct tabs, date rules, Sunday H and weekday N in route results; mobile layout; no page errors.');
} finally {await browser.close();}
