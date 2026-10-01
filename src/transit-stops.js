export function resolveStops(data,stops,day){
 const active=(data.alerts||[]).filter(a=>day.day>=a.date&&(!a.until||day.day<=a.until)&&(day.day!==a.date||day.minute>=(a.startMinute||0)));
 return stops.flatMap(s=>{
  const alerts=active.filter(a=>a.stops.includes(s.id));
  if(alerts.some(a=>a.type==='suspension'))return [];
  const relocation=alerts.find(a=>a.type==='relocation');
  return [{...s,...(relocation?{coords:relocation.coords,originalCoords:s.coords,name:s.name+'（临时站）',relocation,approximate:true}:{}),routes:data.routes.filter(r=>r.stops.includes(s.id)||r.nonTeachingEnd?.includes(s.id)).map(r=>r.id)}];
 });
}
export function stopNotes(...stops){return stops.filter(s=>s?.relocation).map(s=>({stopId:s.id,title:s.name,text:s.relocation.note,url:s.relocation.url}));}
