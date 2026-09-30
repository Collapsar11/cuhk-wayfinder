import {WalkGraph,planTransit} from './routing.js';
import {sunContext,sumMetrics,routePreferenceScore} from './comfort.js';
const labels={fast:'较快步行',shade:'避晒优先',gentle:'少爬坡优先',comfort:'舒适步行'};
export function planJourney(dataset,from,to,options={}){
 const date=new Date(options.date||Date.now()),sun=sunContext(date,from,options.sunMode||'auto');
 const config={shortcuts:options.shortcuts!==false,elevatorWait:options.elevatorWait??1.5,avoidSteps:options.profile==='no-steps',sunFactor:sun.factor};
 const graphs=[['osm',new WalkGraph(dataset.graph,config)],['lands',new WalkGraph(dataset.lands,config)]];
 const alternatives=[],byKey=new Map();
 const add=(r,tag,network)=>{
  if(!r)return;
  const key=r.kind==='transit'?'bus:'+r.legs.map(l=>l.kind==='bus'?`${l.route}:${l.departure}:${l.stops.join(',')}`:l.edgeKeys.join(',')).join('|'):network+':'+r.edgeKeys.join('|');
  if(byKey.has(key)){const old=byKey.get(key);if(!old.tags.includes(tag))old.tags.push(tag);return;}
  const next={...r,id:'route-'+alternatives.length,tags:[tag],network,terrain:network==='lands'};
  byKey.set(key,next);alternatives.push(next);
 };
 for(const [network,g] of graphs){
  for(const profile of ['fast','shade','gentle','comfort'])add(g.route(from,to,profile),labels[profile],network);
  // Preserve feasible elevator routes even when waiting makes them slower.
  if(network==='osm')for(const r of g.elevatorAlternatives(from,to))add(r,'电梯备选 · '+r.viaElevator,network);
 }
 if(config.shortcuts)add(new WalkGraph(dataset.graph,{...config,shortcuts:false}).route(from,to),'户外步行 · 不穿楼','osm');
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
 const preference=options.preference||'comfort';
 alternatives.sort((a,b)=>routePreferenceScore(a,preference,sun.factor)-routePreferenceScore(b,preference,sun.factor));
 return {alternatives,reason,sun,preference};
}
