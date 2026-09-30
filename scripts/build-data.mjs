import fs from 'node:fs';
import {Converter} from 'opencc-js';
const toSimple=Converter({from:'hk',to:'cn'});
const raw=fs.readFileSync('data/raw/locations-en.js','utf8');
const db={};
// Parse only JSON records in known arrays; never execute downloaded JavaScript.
for(const match of raw.matchAll(/^(\w+)\s*:\s*\[([\s\S]*?)\](?:,|\s*\})/gm)){
 if(match[1]==='InfoWindow_Display')continue;
 db[match[1]]=match[2].split(/\r?\n/).map(s=>s.trim().replace(/,$/, '')).filter(s=>s.startsWith('{')).map(s=>JSON.parse(s));
}
const retrievedAt=JSON.parse(fs.readFileSync('data/raw/sources.json')).find(x=>x.file==='locations-en.js').retrievedAt;
const source='https://www.cuhk.edu.hk/chinese/campus/cuhk-campus-map.html';
const plain=s=>(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const coords=s=>s?.match(/-?\d+\.\d+/g)?.map(Number);
const valid=c=>c?.length===2&&c[0]>22.408&&c[0]<22.432&&c[1]>114.197&&c[1]<114.222;
const regions=Object.fromEntries(db.campus.map(x=>[x.id,plain(x.campus_xb5)]));
const categorize=b=> b.hostel_type||/Hostel|Residence|Hall [123]|Postgraduate Hall/i.test(b.bldg_name_en)?'hostel':/Library/.test(b.bldg_name_en)?'library':/Sports|Gymnasium|Swimming|Tennis/.test(b.bldg_name_en)?'sports':/Amenities|Activity|Student Centre|Franklin|Fulton|Shaw Hall|Museum/.test(b.bldg_name_en)?'activity':'academic';
const places=[];
for(const b of db.buildings){
 if(b.active!=='True'||!valid(coords(b.lat_lng)))continue;
 places.push({id:`b-${b.building_id}`,name:plain(b.bldg_name_xb5),en:plain(b.bldg_name_en),aliases:[b.shortname,b.bldg_code].filter(Boolean),categories:[categorize(b)],coords:coords(b.lat_lng),region:regions[b.campus_id]||'校园',address:'',source,coordinateSource:source,retrievedAt,website:b.website_xb5||b.website_en||'',note:plain(b.remark_xb5),precision:'building'});
}
const cats={1:'activity',2:'activity',3:'services',4:'services',5:'sports',6:'shop',7:'transport',12:'activity',13:'food',14:'food',15:'services',16:'library',17:'services',18:'activity',19:'activity',21:'services',23:'transport',24:'transport',25:'transport',26:'shop',27:'sports',28:'sports',29:'sports',30:'sports',31:'sports',32:'shop',35:'academic',37:'sports',40:'services',42:'services'};
for(const f of db.facilities){
 if(f.bCampusMap!=='True'||!valid(coords(f.lat_lng))||!cats[f.type_id])continue;
 const name=plain(f.facilities_name_xb5);const existing=places.find(p=>p.name===name);
 if(existing){existing.categories=[...new Set([...existing.categories,cats[f.type_id]])];existing.address=plain(f.address_xb5);existing.hoursText=plain(f['opening hours_xb5']);existing.website=f.website_xb5||existing.website;continue;}
 const c=coords(f.lat_lng),near=places.reduce((a,p)=>!a||Math.hypot(p.coords[0]-c[0],p.coords[1]-c[1])<Math.hypot(a.coords[0]-c[0],a.coords[1]-c[1])?p:a,null);
 places.push({id:`f-${f.facilities_id}`,name,en:plain(f.facilities_name_en),aliases:[f.shortname].filter(Boolean),categories:[cats[f.type_id]],coords:c,region:near?.region||'校园',address:plain(f.address_xb5),hoursText:plain(f['opening hours_xb5']),phone:plain(f.tel_xb5||f.tel),source,coordinateSource:source,retrievedAt,website:f.website_xb5||f.website_en||'',note:f.type_id==='13'?'官网标为会员餐厅，请先确认用餐资格。':'',precision:'facility'});
}
const food=JSON.parse(fs.readFileSync('data/raw/food-restaurants.json'));
const foodAt=JSON.parse(fs.readFileSync('data/raw/sources-food.json'))[0].retrievedAt;
const zones={Front:'山腳校園',Back:'後山校園',Central:'中央校園',CC:'崇基學院',NA:'新亞書院',UC:'聯合書院',Shaw:'逸夫書院',SHHO:'善衡書院',Morningside:'晨興書院',WYS:'伍宜孫書院',CWC:'敬文書院',LWS:'和聲書院'};
for(const f of food){
 const c=[f.coordinates?.lat,f.coordinates?.lng];if(!valid(c))throw Error(`invalid food coordinate ${f.id}`);
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s/g,'');
 const match=places.find(p=>p.categories.includes('food')&&(norm(p.name)===norm(f.name)||norm(p.en)===norm(f.name)||p.name.replace(/[（(].*$/,'')===f.name));
 const p=match||{id:`food-${f.id}`,name:f.name,en:'',aliases:[],categories:['food'],coords:c,precision:'facility'};
 if(!match)places.push(p);
 Object.assign(p,{foodId:f.id,aliases:[...new Set([...p.aliases,...f.aliases])],region:zones[f.zone]||f.zone,address:f.location_desc,foodType:f.restaurant_type,price:f.avg_price,regularHours:f.regular_hours,holidayHours:f.holiday_hours,source:'https://ueatwhat.com/',foodUrl:`https://ueatwhat.com/restaurant/${f.id}`,coordinateSource:match?source:'https://ueatwhat.com/',retrievedAt:foodAt,updatedAt:f.updatedAt});
}
for(const p of places){p.search=toSimple([p.name,p.en,...p.aliases,p.address,p.region].join(' ')).toLowerCase();}
const stops=db.shuttle_bus_stops.filter(x=>x.active==='True').map(s=>({id:s.bus_stop_id,name:s.bus_stop_name_xb5,en:s.bus_stop_name_en,coords:coords(s.lat_lng),source}));
// Supplement directional stops absent from the university's older coordinate database using explicit OSM nodes.
const osm=fs.readFileSync('data/raw/osm.xml','utf8');
const extra=[['wys-up','2035104644','伍宜孙书院（上行）'],['wys-down','1716519421','伍宜孙书院（下行）'],['na-circle','2036051434','新亚坊']];
for(const [id,osmId,name] of extra){const m=osm.match(new RegExp(`<node id="${osmId}"[^>]*>`));if(!m)throw Error(osmId);const lat=Number(m[0].match(/lat="([^"]+)"/)[1]),lng=Number(m[0].match(/lon="([^"]+)"/)[1]);stops.push({id,name,en:name,coords:[lat,lng],source:`https://www.openstreetmap.org/node/${osmId}`});}
// Shaw's official coordinate is shared by the two directions; show this as approximate.
for(const [id,name] of [['shaw-up','逸夫书院（上行）'],['shaw-down','逸夫书院（下行）']])stops.push({...stops.find(s=>s.id==='15'),id,name,approximate:true});
stops.push({...stops.find(s=>s.id==='55'),id:'area-down',name:'39区（下行）',approximate:true});
const write=(name,x)=>fs.writeFileSync(`public/data/${name}.json`,JSON.stringify(x));
write('places',{retrievedAt,places});write('stops',stops);
write('food-calendar',{retrievedAt:foodAt,holidays:JSON.parse(fs.readFileSync('data/raw/food-holidays.json')),overrides:JSON.parse(fs.readFileSync('data/raw/food-overrides.json')).map(({res_id,start_date,end_date,is_open,special_hours,is_global_closure,note,updatedAt})=>({res_id,start_date,end_date,is_open,special_hours,is_global_closure,note,updatedAt}))});
fs.writeFileSync('data/raw/map-parsed.json',JSON.stringify(db));
console.log(`${places.length} places, ${food.length} restaurants with hours, ${stops.length} bus stops`);
