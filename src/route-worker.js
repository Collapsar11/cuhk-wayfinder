import {planJourney} from './planner.js';
let dataset;
self.onmessage=({data:m})=>{try{
 if(m.type==='init'){dataset=m.data;self.postMessage({id:m.id,ready:true});return;}
 self.postMessage({id:m.id,result:planJourney(dataset,m.from,m.to,m.options)});
 }catch(e){self.postMessage({id:m.id,error:e.message});}};
