export const distance=(a,b)=>{const rad=Math.PI/180,lat=(a[0]+b[0])/2*rad;return Math.hypot((a[0]-b[0])*rad,(a[1]-b[1])*rad*Math.cos(lat))*6371000;};
export class Heap{
 constructor(){this.a=[];}push(v){let i=this.a.length;this.a.push(v);while(i){let p=(i-1)>>1;if(this.a[p][0]<=v[0])break;this.a[i]=this.a[p];i=p;}this.a[i]=v;}
 pop(){if(!this.a.length)return;const top=this.a[0],end=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let c=i*2+1;if(c+1<this.a.length&&this.a[c+1][0]<this.a[c][0])c++;if(this.a[c][0]>=end[0])break;this.a[i]=this.a[c];i=c;}this.a[i]=end;}return top;}
}
export class WalkGraph{
 constructor(data,{shortcuts=true,elevatorWait=1.5}={}){this.source=data.source;this.shortcuts=shortcuts;this.elevatorWait=elevatorWait;this.nodes=data.nodes;this.ways=data.ways;this.adj=this.nodes.map(()=>[]);this.rev=this.nodes.map(()=>[]);this.cache=new Map();
  for(let w=0;w<this.ways.length;w++){const way=this.ways[w],t=way.tags;if(t.shortcut&&!shortcuts)continue;for(let i=1;i<way.nodes.length;i++){const a=way.nodes[i-1],b=way.nodes[i],d=distance(this.nodes[a],this.nodes[b]);if(!d&&!t.fixedMinutes)continue;
   const add=(a,b,dir)=>{const edge={to:b,d,w,dir};this.adj[a].push(edge);this.rev[b].push({...edge,to:a});};
   if(t['oneway:foot']!=='-1'&&t['foot:forward']!=='no')add(a,b,1);
   if(t['oneway:foot']!=='yes'&&t['oneway:foot']!=='1'&&t['foot:backward']!=='no')add(b,a,-1);
  }}
  const seen=new Set(),components=[];for(let i=0;i<this.nodes.length;i++){if(seen.has(i))continue;const todo=[i],component=[];seen.add(i);while(todo.length){const n=todo.pop();component.push(n);for(const e of [...this.adj[n],...this.rev[n]])if(!seen.has(e.to)){seen.add(e.to);todo.push(e.to);}}components.push(component);}components.sort((a,b)=>b.length-a.length);this.snapNodes=components[0]?.length>100?components[0]:this.nodes.map((_,i)=>i);
 }
 snap(coord){let d=Infinity,id=-1;for(const i of this.snapNodes){if(this.adj[i].some(e=>this.ways[e.w].tags.highway==='elevator'))continue;const x=distance(coord,this.nodes[i]);if(x<d){id=i;d=x;}}return d<=120?{id,d,coord}:null;}
 weight(e,profile){const t=this.ways[e.w].tags;if(t.shortcut&&!this.shortcuts)return Infinity;if(profile==='no-steps'&&(t.highway==='steps'||t.wheelchair==='no'))return Infinity;if(t.fixedMinutes)return Math.max(0,t.fixedMinutes-1.5)+this.elevatorWait;
  // Nominal 4.5 km/h; stairs 2.4 km/h. Penalize only explicit incline tags, not fabricated elevation.
  const incline=parseFloat(t.incline);const uphill=Number.isFinite(incline)?Math.max(0,incline*e.dir):0;
  return e.d/(t.highway==='steps'?40:75)*(1+Math.min(uphill,30)/20);
 }
 tree(snap,profile='fast',reverse=false){if(!snap)return null;const key=`${snap.id}:${profile}:${reverse}`;if(this.cache.has(key))return this.cache.get(key);
  const times=new Float64Array(this.nodes.length).fill(Infinity),prev=new Int32Array(this.nodes.length).fill(-1),edges=new Array(this.nodes.length);times[snap.id]=0;const q=new Heap();q.push([0,snap.id]);const adj=reverse?this.rev:this.adj;
  while(q.a.length){const [cost,id]=q.pop();if(cost!==times[id])continue;for(const e of adj[id]){const n=cost+this.weight(e,profile);if(n<times[e.to]){times[e.to]=n;prev[e.to]=id;edges[e.to]=e;q.push([n,e.to]);}}}
  const r={times,prev,edges,root:snap.id,reverse};if(this.cache.size>80)this.cache.delete(this.cache.keys().next().value);this.cache.set(key,r);return r;
 }
 route(from,to,profile='fast',tree=null){const a=this.snap(from),b=this.snap(to);if(!a||!b)return null;tree=tree||this.tree(a,profile);if(!Number.isFinite(tree.times[b.id]))return null;
  const ids=[b.id],segments=[];let i=b.id;while(i!==a.id){const e=tree.edges[i];if(!e)return null;segments.push(e);i=tree.prev[i];ids.push(i);}ids.reverse();segments.reverse();
  return {kind:'walk',source:this.source,ascent:segments.reduce((n,e)=>n+Math.max(0,(this.ways[e.w].tags.rise||0)*e.dir),0),minutes:tree.times[b.id]+(a.d+b.d)/75,meters:segments.reduce((n,e)=>n+e.d,0)+a.d+b.d,steps:segments.filter(e=>this.ways[e.w].tags.highway==='steps').reduce((n,e)=>n+e.d,0),geometry:ids.map(id=>this.nodes[id]),connectors:[[from,this.nodes[a.id]],[this.nodes[b.id],to]],connectorMeters:a.d+b.d,segments:segments.map(e=>({meters:e.d,name:this.ways[e.w].tags['name:zh']||this.ways[e.w].tags.name||'',stairs:this.ways[e.w].tags.highway==='steps',shortcut:this.ways[e.w].tags.shortcut,kind:this.ways[e.w].tags.highway,fromLevel:e.dir===1?this.ways[e.w].tags.fromLevel:this.ways[e.w].tags.toLevel,toLevel:e.dir===1?this.ways[e.w].tags.toLevel:this.ways[e.w].tags.fromLevel}))};
 }
}
export function hongKongParts(date=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
 const day=`${p.year}-${p.month}-${p.day}`;return {day,minute:Number(p.hour)*60+Number(p.minute),weekday:new Date(day+'T12:00:00+08:00').getUTCDay(),year:Number(p.year)};
}
export const clock=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(Math.floor(m%60)).padStart(2,'0')}`;
export const minutes=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
export function serviceDay(data,date,override='auto'){
 const p=hongKongParts(date),holiday=p.weekday===0||data.holidays.includes(p.day);
 let teaching=!holiday&&data.teachingTerms.some(([a,b])=>p.day>=a&&p.day<=b)&&!data.readingWeeks.some(([a,b])=>p.day>=a&&p.day<=b);
 if(override!=='auto')teaching=override==='teaching'&&!holiday;
 return {...p,holiday,teaching,known:data.holidayYears.includes(p.year)&&p.day>=data.effectiveFrom&&p.day<=data.validThrough};
}
export function createTrips(data,stops,date,override='auto'){
 const day=serviceDay(data,date,override);if(!day.known)return [];
 const byId=Object.fromEntries(stops.map(s=>[s.id,s]));const trips=[];
 for(const r of data.routes){
  if(r.days==='holiday'&&!day.holiday||r.days!=='holiday'&&day.holiday||r.days==='teaching'&&!day.teaching||r.noSaturday&&day.weekday===6)continue;
  const end=minutes(day.weekday===6&&r.saturdayEnd?r.saturdayEnd:r.end),start=minutes(r.start);
  for(let departure=start;departure<=end;departure++){
   if(!r.mins.includes(departure%60))continue;
   let ids=r.stops.filter(id=>!r.conditional?.[id]||r.conditional[id]==='minute00'&&departure%60===0||r.conditional[id]==='minute45'&&departure%60===45);
   if(r.nonTeachingEnd&&!day.teaching)ids=[...ids.slice(0,-1),...r.nonTeachingEnd];
   const times=[departure];for(let i=1;i<ids.length;i++)times.push(times[i-1]+Math.max(.8,distance(byId[ids[i-1]].coords,byId[ids[i]].coords)*1.35/250+.35));
   trips.push({route:r.id,name:r.name,source:r.source,ids,times,departure});
  }
 }
 return trips;
}
export function planTransit(graph,data,stops,from,to,{date=new Date(),profile='fast',member=true,teaching='auto'}={}){
 const walk=graph.route(from,to,profile);if(!member)return {walk,transit:null,reason:'visitor'};
 const day=serviceDay(data,date,teaching);if(!day.known)return {walk,transit:null,reason:'calendar'};
 const trips=createTrips(data,stops,date,teaching);const a=graph.snap(from),b=graph.snap(to);if(!a||!b)return {walk,transit:null,reason:'coverage'};
 const originTree=graph.tree(a,profile),destTree=graph.tree(b,profile,true);
 const blocked=new Set(data.alerts.flatMap(a=>a.stops));const use=stops.filter(s=>!blocked.has(s.id)).map(s=>({...s,snap:graph.snap(s.coords)})).filter(s=>s.snap);
 const index=new Map(use.map((s,i)=>[s.id,i])),nStops=use.length;
 // Distinct states preserve bus alternatives even when walking is earlier:
 // 0 = origin access; 1 = just alighted; 2 = one walking transfer after alighting.
 // Only state 1 can finish; transfer walks cannot chain into unlimited access walks.
 const labels=new Float64Array(nStops*3).fill(Infinity),prev=new Array(nStops*3),q=new Heap();
 let best=Infinity,finish=-1;
 const maxWalk=12;
 for(let i=0;i<nStops;i++){const s=use[i];const t=originTree.times[s.snap.id]+(a.d+s.snap.d)/75;if(t<=maxWalk){labels[i]=day.minute+t;prev[i]={kind:'walk',from:-1,minutes:t};q.push([labels[i],i]);}}
 const stopTrips=new Map();for(const t of trips)for(let i=0;i<t.ids.length-1;i++){if(!stopTrips.has(t.ids[i]))stopTrips.set(t.ids[i],[]);stopTrips.get(t.ids[i]).push({trip:t,at:i});}
 while(q.a.length){const [time,stateId]=q.pop();if(time!==labels[stateId]||time>day.minute+180||time>=best)continue;const i=stateId%nStops,phase=Math.floor(stateId/nStops),s=use[i];
  if(phase===1){
   const tail=destTree.times[s.snap.id]+(b.d+s.snap.d)/75;if(tail<=maxWalk&&time+tail<=day.minute+180&&time+tail<best){best=time+tail;finish=stateId;}
   const tree=graph.tree(s.snap,profile);
   for(let j=0;j<nStops;j++){if(j===i)continue;const t=tree.times[use[j].snap.id]+(s.snap.d+use[j].snap.d)/75,next=2*nStops+j;if(t<=maxWalk&&time+t<labels[next]){labels[next]=time+t;prev[next]={kind:'walk',from:stateId,minutes:t};q.push([labels[next],next]);}}
  }
  for(const {trip:t,at} of stopTrips.get(s.id)||[]){
   if(t.times[at]<time+1.5||t.times[at]>time+90)continue;
   for(let j=at+1;j<t.ids.length;j++){const stop=index.get(t.ids[j]);if(stop===undefined)continue;const next=nStops+stop;if(t.times[j]>=labels[next])continue;
    labels[next]=t.times[j];prev[next]={kind:'bus',from:stateId,trip:t,start:at,end:j,wait:t.times[at]-time,minutes:t.times[j]-t.times[at]};q.push([labels[next],next]);
   }
  }
 }
 if(finish<0)return {walk,transit:null,reason:'no-service'};
 const legs=[];let stateId=finish;
 const lastWalk=graph.route(use[stateId%nStops].coords,to,profile);if(lastWalk)legs.push({...lastWalk,fromName:use[stateId%nStops].name,toName:'目的地'});
 let count=0;
 while(stateId>=0&&count++<nStops*3+1){const e=prev[stateId];if(!e)break;const i=stateId%nStops,fromStop=e.from<0?null:use[e.from%nStops];
  if(e.kind==='walk'){const r=graph.route(fromStop?fromStop.coords:from,use[i].coords,profile);if(!r)return {walk,transit:null,reason:'coverage'};legs.push({...r,fromName:fromStop?fromStop.name:'起点',toName:use[i].name});}
  else {const seq=e.trip.ids.slice(e.start,e.end+1);legs.push({...e,route:e.trip.route,name:e.trip.name,source:e.trip.source,departure:e.trip.times[e.start],arrival:e.trip.times[e.end],fromName:fromStop.name,toName:use[i].name,stops:seq,geometry:seq.map(id=>stops.find(s=>s.id===id).coords)});}
  stateId=e.from;
 }
 legs.reverse();
 return {walk,transit:{kind:'transit',minutes:best-day.minute,arrival:best,legs,walkingMinutes:legs.filter(x=>x.kind==='walk').reduce((n,l)=>n+l.minutes,0),meters:legs.filter(x=>x.kind==='walk').reduce((n,l)=>n+l.meters,0)},reason:null};
}
