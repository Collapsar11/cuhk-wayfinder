import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(`public/data/${n}.json`)),places=read('places'),stops=read('stops'),transit=read('transit');
const used=new Set(transit.variants.flatMap(v=>v.stops));
places.places=places.places.filter(p=>!p.id.startsWith('bus-stop-'));
for(const s of stops.filter(s=>used.has(s.id))){
 const aliases=[s.id+'号站',...(['62','63'].includes(s.id)?['环回东站','环迴东站','环回东',s.id==='62'?'环回东上行':'环回东下行']:[])];
 places.places.push({id:'bus-stop-'+s.id,stopId:s.id,name:s.name,en:s.en,aliases,categories:['transport'],coords:s.coords,region:'校巴站',address:'',precision:'bus-stop',source:s.source,coordinateSource:s.source,retrievedAt:'2026-10-01',search:[s.name,s.en,...aliases].join(' ')});
}
for(const p of places.places.filter(p=>p.id==='f-309')){p.aliases=[...new Set([...p.aliases,'敬文can','敬文 can','敬文饭堂','CWC canteen'])];if(!p.search.includes('敬文can'))p.search+=' 敬文can 敬文 can 敬文饭堂 cwc canteen';}
fs.writeFileSync('public/data/places.json',JSON.stringify(places));console.log(`${used.size} in-service stop records added to searchable places`);
