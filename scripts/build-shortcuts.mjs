import fs from 'node:fs';
const g=JSON.parse(fs.readFileSync('public/data/graph.json'));
const source='https://www.oalglobal.cuhk.edu.hk/campus-tour-essential-shortcut/';
const definitions=[
 {id:'wmw',name:'蒙民伟工程学大楼',coords:[22.4180047,114.2079598],low:'G/F',high:'9/F',floorRise:9,node:'13674323072',lowerWay:'1492178658',upperWay:'1492178659',description:'由苗圃径进入地下，乘升降机至 9 楼，经连廊往何善衡工程学大楼及中央校园。',osm:'https://www.openstreetmap.org/node/13674323072',routeNumber:8},
 {id:'mmw',name:'蒙民伟楼',coords:[22.4197497,114.2092910],low:'G/F',high:'7/F',floorRise:7,node:'13674323069',splitWay:'1492178657',description:'医学楼一侧的地下与新亚书院一侧的 7 楼相连；往新亚可乘电梯上楼，反向可下到医学楼。',osm:'https://www.openstreetmap.org/node/13674323069',routeNumber:4},
 {id:'lsk',name:'李兆基楼',coords:[22.4197374,114.2039557],low:'G/F',high:'3/F',floorRise:3,node:'13674323073',splitWay:'1492178660',description:'从富尔敦楼方向到李兆基楼地下，升至 3 楼，经天桥到联合书院网球场一侧。注意不是李兆基建筑学大楼。',osm:'https://www.openstreetmap.org/node/13674323073',routeNumber:6}
];
for(const s of definitions){
 s.source=source;s.hours='开放时间与门禁未核实';s.coordinateAccuracy='OSM 电梯节点；入口和楼层连接依据官方近路指南，未现场测量';s.waitMinutes=1.5;s.rideMinutes=s.floorRise*.06;s.retrievedAt='2026-10-01';
 const old=g.nodeIds.indexOf(s.node);if(old<0)throw Error(s.node);const upper=g.nodes.length;g.nodes.push(g.nodes[old]);g.nodeIds.push(s.node+':'+s.high);
 if(s.splitWay){const idx=g.ways.findIndex(w=>w.id===s.splitWay);const w=g.ways[idx],at=w.nodes.indexOf(old);if(at<1)throw Error(s.id);g.ways.splice(idx,1,{...w,id:w.id+'-high',nodes:[...w.nodes.slice(0,at),upper],tags:{...w.tags,shortcut:s.id,level:s.high}},{...w,id:w.id+'-low',nodes:w.nodes.slice(at),tags:{...w.tags,shortcut:s.id,level:s.low}});}
 else {const upperWay=g.ways.find(w=>w.id===s.upperWay),lowerWay=g.ways.find(w=>w.id===s.lowerWay);upperWay.nodes=upperWay.nodes.map(n=>n===old?upper:n);upperWay.tags={...upperWay.tags,shortcut:s.id,level:s.high};lowerWay.tags={...lowerWay.tags,shortcut:s.id,level:s.low};}
 g.ways.push({id:'lift-'+s.id,nodes:[old,upper],tags:{highway:'elevator',covered:'yes',indoor:'yes',shortcut:s.id,name:s.name+'电梯',fromLevel:s.low,toLevel:s.high,fixedMinutes:s.waitMinutes+s.rideMinutes}});
}
// Explicit escalators and footbridge already connected in OSM; use direction, don't model as bidirectional stairs.
const yia={id:'yia-wmy',name:'康本园 → 伍何曼原楼',coords:[22.4161608,114.2108777],low:'YIA 1/F',high:'WMY 5/F',source,osm:'https://www.openstreetmap.org/way/1426636965',description:'经康本园 1–2 楼，再到伍何曼原楼 5 楼；可接苗圃径。此段含扶手电梯，不能视作轮椅无障碍路线。',hours:'开放时间未核实',coordinateAccuracy:'OSM 扶梯与连廊；楼层来自官方指南',routeNumber:2,retrievedAt:'2026-10-01'};
for(const w of g.ways)if(['1426636965','1426636969','1426728929','1426728932'].includes(w.id)){w.tags.shortcut='yia-wmy';if(w.tags.conveying)w.tags['oneway:foot']='yes';}
fs.writeFileSync('public/data/graph.json',JSON.stringify(g));fs.writeFileSync('public/data/shortcuts.json',JSON.stringify([...definitions,yia]));console.log('3 floor-separated elevator connectors + YIA escalator/bridge');
