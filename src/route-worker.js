import {WalkGraph,planTransit} from './routing.js';
let dataset;
self.onmessage=({data:m})=>{try{
 if(m.type==='init'){dataset=m.data;self.postMessage({id:m.id,ready:true});return;}
 const {from,to,options}=m;
 const g=new WalkGraph(dataset.graph,{shortcuts:options.shortcuts,elevatorWait:options.elevatorWait});
 const result=planTransit(g,dataset.transit,dataset.stops,from,to,{...options,date:new Date(options.date)});
 const outdoor=options.shortcuts?new WalkGraph(dataset.graph,{shortcuts:false}).route(from,to,options.profile):null;
 const terrainWalk=new WalkGraph(dataset.lands,{shortcuts:options.shortcuts,elevatorWait:options.elevatorWait}).route(from,to,options.profile);
 self.postMessage({id:m.id,result:{...result,outdoor,terrainWalk}});
 }catch(e){self.postMessage({id:m.id,error:e.message});}};
