import {WalkGraph,planTransit,directTransitAlternatives,hongKongParts} from './routing.js';
import {resolveStops} from './transit-stops.js';
import {sunContext,sumMetrics,routePreferenceScore} from './comfort.js';
import {shbEntrance,engineeringBus,engineeringArrival} from './engineering-route.js';
const labels={fast:'较快步行',shade:'避晒优先',gentle:'少爬坡优先',comfort:'舒适步行'};
export function planJourney(dataset,from,to,options={}){
 const date=new Date(options.date||Date.now()),sun=sunContext(date,from,options.sunMode||'auto');
 const stops=resolveStops(dataset.transit,dataset.stops,hongKongParts(date));
 if(options.fromPlaceId?.startsWith('bus-stop-'))from=stops.find(s=>s.id===options.fromPlaceId.slice(9))?.coords||from;
 if(options.toPlaceId?.startsWith('bus-stop-'))to=stops.find(s=>s.id===options.toPlaceId.slice(9))?.coords||to;
 const config={shortcuts:options.shortcuts!==false,elevatorWait:options.elevatorWait??1.5,avoidSteps:options.profile==='no-steps',sunFactor:sun.factor};
 const explicitEntrance=options.toPlaceId==='entrance-shb-5',explicitOrigin=options.fromPlaceId==='entrance-shb-5';
 const graphs=[['osm',new WalkGraph(dataset.graph,config)],...(!explicitEntrance&&!explicitOrigin?[['lands',new WalkGraph(dataset.lands,config)]]:[])];
 if(explicitOrigin){from=shbEntrance(graphs[0][1]);if(!config.shortcuts||!from)return {alternatives:[],reason:'entrance-disabled',sun,preference:options.preference||'comfort'};}
 if(explicitEntrance){to=shbEntrance(graphs[0][1]);if(!config.shortcuts||!to)return {alternatives:[],reason:'entrance-disabled',sun,preference:options.preference||'comfort'};}
 const alternatives=[],byKey=new Map();
 const add=(r,tag,network)=>{
  if(!r)return;
  const key=(r.arrivalLabel||(explicitEntrance?engineeringArrival:''))+(r.kind==='transit'?'bus:'+r.legs.map(l=>l.kind==='bus'?`${l.route}:${l.departure}:${l.stops.join(',')}`:l.edgeKeys.join(',')).join('|'):network+':'+r.edgeKeys.join('|'));
  if(byKey.has(key)){const old=byKey.get(key);if(r.guide)Object.assign(old,{guide:r.guide,source:r.source});if(!old.tags.includes(tag))old.tags.push(tag);return;}
  const next={...r,...(explicitEntrance?{arrivalLabel:engineeringArrival,arrivalCoords:[...to]}:{}),id:'route-'+alternatives.length,tags:[tag],network,terrain:network==='lands'};
  byKey.set(key,next);alternatives.push(next);
 };
 for(const [network,g] of graphs){
  for(const profile of ['fast','shade','gentle','comfort'])add(g.route(from,to,profile),labels[profile],network);
  // Preserve feasible elevator routes even when waiting makes them slower.
  if(network==='osm')for(const r of g.elevatorAlternatives(from,to))add(r,'电梯备选 · '+r.viaElevator,network);
 }
 if(config.shortcuts&&!explicitEntrance&&!explicitOrigin)add(new WalkGraph(dataset.graph,{...config,shortcuts:false}).route(from,to),'户外步行 · 不穿楼','osm');
 let reason=null;
 for(const profile of ['fast','comfort']){
  const result=planTransit(graphs[0][1],dataset.transit,dataset.stops,from,to,{...options,date,profile});reason=result.reason;
  if(result.transit){
   const r=result.transit,m=sumMetrics(r.legs.filter(l=>l.kind==='walk')),waitMinutes=r.legs.filter(l=>l.kind==='bus').reduce((n,l)=>n+l.wait,0);
   // Stop shelter is not surveyed: do not count bus waiting as shaded.
   m.unknownCoverMinutes+=waitMinutes;
   add({...r,...m,steps:m.stairs,waitMinutes},profile==='fast'?'校巴接驳':'校巴 · 舒适接驳','osm');
  }
 }
 for(const r of directTransitAlternatives(graphs[0][1],dataset.transit,dataset.stops,from,to,{...options,date,profile:'fast'})){
  const m=sumMetrics(r.legs.filter(l=>l.kind==='walk')),bus=r.legs.find(l=>l.kind==='bus'),waitMinutes=bus.wait;m.unknownCoverMinutes+=waitMinutes;
  add({...r,...m,steps:m.stairs,waitMinutes},bus.variantLabel+' · 直达校巴','osm');
 }
 if(config.shortcuts&&['b-34','entrance-shb-5'].includes(options.toPlaceId)){
  const g=graphs[0][1],entrance=shbEntrance(g);
  if(entrance){
   for(const profile of ['fast','comfort']){
    const walk=g.route(from,entrance,profile);
    if(walk)add({...walk,arrivalLabel:engineeringArrival,arrivalCoords:[...entrance]},'到 SHB 5 楼连廊入口','osm');
   }
   if(options.fromPlaceId==='b-109'){
    const r=engineeringBus(g,dataset.transit,dataset.stops,from,entrance,{...options,date,profile:'fast'});
    if(r){const m=sumMetrics(r.legs.filter(l=>l.kind==='walk')),waitMinutes=r.legs.filter(l=>l.kind==='bus').reduce((n,l)=>n+l.wait,0);m.unknownCoverMinutes+=waitMinutes;add({...r,...m,steps:m.stairs,waitMinutes},'研宿一座 → 邵逸夫堂 → SHB 5 楼','osm');}
   }
  }
 }
 const preference=options.preference||'comfort';
 alternatives.sort((a,b)=>routePreferenceScore(a,preference,sun.factor)-routePreferenceScore(b,preference,sun.factor));
 return {alternatives,reason,sun,preference};
}
