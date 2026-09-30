import fs from 'node:fs';
import {labelBuildings} from '../src/buildings.js';
const read=n=>JSON.parse(fs.readFileSync(`public/data/${n}.json`));
const write=(n,d)=>fs.writeFileSync(`public/data/${n}.json`,JSON.stringify(d));
const g=read('graph'),shortcuts=read('shortcuts'),places=read('places');
const math='https://www.math.cuhk.edu.hk/about-us/maps-directions';
const visiting='https://www.cse.cuhk.edu.hk/about/visiting-us/';
const additions=[
 {id:'lsb-shb',name:'邵逸夫夫人楼 ↔ SHB 连廊',type:'bridge',low:'LSB LG1/F',high:'SHB 5/F',wayIds:['136995432','188010215'],buildingIds:['b-33','b-34'],source:math,
  description:'从邵逸夫夫人楼（LSB）LG1 的 D 出口，经天桥到何善衡工程学大楼（SHB）5 楼。邵逸夫堂下车后可经中央校园及 LSB 一侧接入；下车接驳含楼梯，不能据此认定全程无障碍。',arrivalNode:'2389077301'},
 {id:'shb-erb',name:'SHB ↔ 蒙民伟工程学大楼连廊',type:'bridge',low:'SHB 5/F',high:'ERB 9/F',wayIds:['1548082087','136995433'],buildingIds:['b-34','b-40'],source:math,
  description:'SHB 5 楼平台继续向东，经天桥进入蒙民伟工程学大楼（ERB）9 楼。官方指南注明桥段部分有盖、部分露天；未逐段定位盖顶范围，不按全程有盖计算。'},
 {id:'mall-stairs',name:'邵逸夫堂 → 连廊接驳楼梯',type:'stairs',low:'中央校园',high:'LSB 连廊方向',wayIds:['217711451','217711476','217711478','218424332'],buildingIds:['b-14','b-33'],source:visiting,
  description:'邵逸夫堂下车后的步行接驳可经中央校园南侧楼梯，再到 LSB 一侧的 SHB 5 楼连廊。地图列出几处可选楼梯，并非需要依次走完；具体台阶数和开放状况未核实。'},
 {id:'alumni-stairs',name:'校友径中央段楼梯',type:'stairs',low:'校友径下段',high:'中央校园方向',wayIds:['1379216539','1379216538'],buildingIds:[],source:'https://www.openstreetmap.org/way/1379216538',
  description:'OSM 将相连两段分别标为 85 级与 83 级，并标有扶手。合计 168 级为社区地图记录，未现场点算；避开楼梯时不会采用这两段。'},
 {id:'new-asia-stairs',name:'新亚梯',type:'stairs',low:'中央校园',high:'新亚书院方向',wayIds:['191766973'],buildingIds:[],source:'https://www.openstreetmap.org/way/191766973',
  description:'从中央校园往新亚方向的折返楼梯。路段来自 OSM；没有可靠台阶数与遮蔽资料，避开楼梯时排除此段。'}
];
for(const c of additions){
 c.geometry=[];c.hours='门禁、施工及开放状况未现场核实';c.coordinateAccuracy='几何来自 OSM；楼层来自所列校方指南；楼内详细走线未测绘';c.retrievedAt='2026-10-01';
 for(const id of c.wayIds){
  const w=g.ways.find(w=>w.id===id);if(!w)throw Error(`Missing connection ${id}`);
  w.tags.connection=c.id;w.tags['name:zh']=c.name;
  if(c.type==='bridge'){w.tags.shortcut=c.id;w.tags.level=c.id==='lsb-shb'?'SHB 5/F':'SHB 5/F ↔ ERB 9/F';}
  c.geometry.push(w.nodes.map(n=>g.nodes[n]));
 }
 c.coords=c.geometry[0][Math.floor(c.geometry[0].length/2)];
 shortcuts.push(c);
}
const arrival=g.nodes[g.nodeIds.indexOf('2389077301')];
places.places=places.places.filter(p=>p.id!=='entrance-shb-5');
const shb=places.places.find(p=>p.id==='b-34');
places.places.push({...shb,id:'entrance-shb-5',name:'SHB 5 楼 · 连廊入口',en:'SHB 5/F footbridge entrance',aliases:['SHB5','SHB 5F','何善衡五楼'],coords:arrival,precision:'entrance',routingNode:'2389077301',coordinateSource:'https://www.openstreetmap.org/node/2389077301',retrievedAt:'2026-10-01',parentId:'b-34',source:math,note:'连通 LSB LG1 与 ERB 9 楼；入口位置采用 OSM 天桥接楼端点。',search:'shb5 shb 5f shb 5 楼 何善衡五楼 连廊入口'});
const pgh=places.places.find(p=>p.id==='b-109');pgh.aliases=[...new Set([...pgh.aliases,'研宿一座','研究生宿舍一座'])];if(!pgh.search.includes('研宿一座'))pgh.search+=' 研宿一座 研究生宿舍一座';
write('places',places);write('graph',g);write('shortcuts',shortcuts);write('basemap',labelBuildings(read('basemap'),places.places));
console.log('Added 2 floor-labelled bridges, 3 stair groups and SHB 5/F entrance; labelled building footprints');
