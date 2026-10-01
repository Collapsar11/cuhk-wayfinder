import {_android as android,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const serial=process.env.ANDROID_SERIAL||'emulator-5580';
if(!serial.startsWith('emulator-'))throw Error('This script only modifies an isolated emulator.');
const adb=(...args)=>execFileSync('adb',['-s',serial,...args],{encoding:'utf8'});
const pkg='io.github.collapsar11.cuhkwayfinder.debug';
const out=process.env.SCREENSHOT_DIR||'/tmp/cuhk-android-check';fs.mkdirSync(out,{recursive:true});
adb('install','-r','android/app/build/outputs/apk/debug/app-debug.apk');
adb('shell','pm','clear',pkg);
adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');
adb('shell','am','start','-n',pkg+'/io.github.collapsar11.cuhkwayfinder.MainActivity');
const devices=await android.devices({omitDriverInstall:true}),device=devices.find(d=>d.serial()===serial);
if(!device)throw Error('Test emulator not found');
try {
 const webview=await device.webView({pkg},{timeout:60000}),page=await webview.page(),errors=[];
 page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await expect(page.locator('#search')).toBeVisible();await expect(page.locator('#cache-status')).toContainText('内置');
 await page.locator('#search').fill('环回东');await expect(page.locator('.place-card')).toHaveCount(2);
 await page.locator('#mobile-map').click();await expect(page.locator('.maplibregl-canvas')).toBeVisible();await expect(page.locator('.map-error')).toHaveCount(0);
 await page.screenshot({path:out+'/map-offline.png'});
 adb('shell','input','keyevent','4');await expect(page.locator('#search')).toBeVisible();
 await page.locator('.mobile-switch [data-tab="bus"]').click();await expect(page.locator('.bus-card')).toHaveCount(18);
 await page.locator('#bus-date').fill('2026-10-02T09:00');await page.locator('#bus-date').press('Tab');await page.locator('#try-cwc-route').click();await page.locator('#calculate').click();
 const eight=page.locator('.route-card').filter({hasText:'8 号线'}).first();await expect(eight).toBeAttached();await expect(page.locator('.steps')).toHaveCount(0);await eight.click();
 await expect(page.locator('.step.bus')).toContainText('環迴東站');await expect(page.locator('.step.bus')).toContainText('敬文書院');
 await page.screenshot({path:out+'/route-offline.png'});
 await page.locator('#share-route').click();await expect(page.locator('.toast')).toContainText('已复制路线链接');
 await expect(page.locator('.toast')).toHaveCount(0,{timeout:10000});
 await page.locator('#route-map').click();await expect(page.locator('.maplibregl-canvas')).toBeVisible();adb('shell','input','keyevent','4');await expect(eight).toBeVisible();
 adb('shell','input','keyevent','4');await expect(page.locator('.steps')).toHaveCount(0);
 await page.locator('#departure').fill('2026-12-10T09:00');await page.locator('#departure').press('Tab');await page.locator('#calculate').click();await expect(page.locator('.route-card').filter({hasText:'8 号线（非教学日）'}).first()).toBeAttached();
 await page.locator('#origin').fill('');adb('shell','input','keyevent','279');await expect(page.locator('#origin')).toHaveValue('https://collapsar11.github.io/cuhk-wayfinder/?from=b-109&to=f-309');
 // Reload while offline: all requests must still be satisfied from APK assets.
 await page.reload({waitUntil:'load'});await expect(page.locator('#search')).toBeVisible();await expect(page.locator('.map-error')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);
 console.log(JSON.stringify({serial,android:adb('shell','getprop','ro.build.version.release').trim(),offlineFirstLaunch:true,offlineReload:true,map3D:true,route8ViaCircuitEast:true,nonTeaching8:true,all18Variants:true,inlineDetails:true,nativeBack:true,nativeCopy:true,errors},null,2));
} finally {await device.close();}
