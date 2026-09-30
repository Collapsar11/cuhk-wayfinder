import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root='dist',base=process.env.BASE_PATH||'/';
fs.copyFileSync('THIRD_PARTY_NOTICES.md','dist/THIRD_PARTY_NOTICES.txt');
fs.copyFileSync('LICENSE','dist/LICENSE.txt');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(root).filter(p=>!p.endsWith('/sw.js'));const hash=crypto.createHash('sha256');for(const f of files)hash.update(fs.readFileSync(f));const version='cuhk-wayfinder-'+hash.digest('hex').slice(0,12);
const urls=[base,...files.map(f=>base+path.relative(root,f).replaceAll('\\','/'))];
fs.writeFileSync('dist/sw.js',`const CACHE=${JSON.stringify(version)},BASE=${JSON.stringify(base)},FILES=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cuhk-wayfinder-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(BASE))return;e.respondWith(caches.open(CACHE).then(async c=>{if(e.request.mode==='navigate'){return (await c.match(BASE+'index.html'))||fetch(e.request);}return (await c.match(e.request,{ignoreSearch:true,ignoreVary:true}))||fetch(e.request);}));});\n`);
fs.writeFileSync('dist/.nojekyll','');console.log('Offline cache:',files.length,'files,',version);
