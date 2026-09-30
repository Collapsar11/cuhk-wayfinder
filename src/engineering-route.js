import {createTrips,serviceDay} from './routing.js';
export const engineeringSource='https://www.cse.cuhk.edu.hk/about/visiting-us/';
export const engineeringArrival='SHB 5 楼连廊入口';
export function shbEntrance(graph){
 const id=graph.nodeIds?.indexOf('2389077301');if(!(id>=0))return null;
 const coords=[...graph.nodes[id]];coords.osmNodeId='2389077301';return coords;
}
// A separately retained, single-bus candidate for the user's PGH1 → RRS → SHB route.
// Stop 22 occurs twice in loop services: use the actual sequence and conditional-stop trip.
export function engineeringBus(graph,data,stops,from,to,{date,member=true,teaching='auto',profile='fast'}={}){
 if(!member||!graph.shortcuts)return null;
 const day=serviceDay(data,date,teaching);if(!day.known)return null;
 const board=stops.find(s=>s.id==='22'),alight=stops.find(s=>s.id==='4');
 const access=graph.route(from,board.coords,profile),egress=graph.route(alight.coords,to,profile);
 if(!access||!egress||access.minutes>12||egress.minutes>12||!egress.segments.some(s=>s.connection==='lsb-shb'))return null;
 let best=null;
 for(const trip of createTrips(data,stops,date,teaching))for(let i=0;i<trip.ids.length;i++){
  if(trip.ids[i]!==board.id)continue;
  const j=trip.ids.indexOf(alight.id,i+1),ready=day.minute+access.minutes;
  if(j<0||trip.times[i]<ready+1.5||trip.times[i]>ready+90||trip.times[j]+egress.minutes>day.minute+180)continue;
  const minutes=trip.times[j]+egress.minutes-day.minute;if(best&&minutes>=best.minutes)continue;
  const ids=trip.ids.slice(i,j+1);
  best={kind:'transit',minutes,arrival:day.minute+minutes,arrivalLabel:engineeringArrival,arrivalCoords:[...to],guide:'pgh-shb',source:engineeringSource,
   meters:access.meters+egress.meters,walkingMinutes:access.minutes+egress.minutes,
   legs:[{...access,fromName:'起点',toName:board.name},
    {kind:'bus',route:trip.route,name:trip.name,source:trip.source,fromName:board.name,toName:alight.name,stops:ids,departure:trip.times[i],arrival:trip.times[j],wait:trip.times[i]-ready,minutes:trip.times[j]-trip.times[i],geometry:ids.map(id=>stops.find(s=>s.id===id).coords)},
    {...egress,fromName:alight.name,toName:engineeringArrival,arrivalLabel:engineeringArrival}]
  };
 }
 return best;
}
