// Disjoint service patterns: each scheduled departure belongs to exactly one variant.
// The route number stays official; variant ids are internal identifiers only.
export function serviceVariants(routes){
 const result=[];
 for(const route of routes){
  const base={...route,route:route.id,weekdays:route.noSaturday?[1,2,3,4,5]:null,term:'any',label:route.id,detail:'',special:false};
  const add=(id,detail,extra={})=>{
   const v={...base,id,detail,label:route.id+(detail?'（'+detail+'）':''),...extra};
   delete v.saturdayEnd;delete v.nonTeachingEnd;delete v.noSaturday;
   // Show the actual first/last departure for this pattern, not the parent envelope.
   const minute=s=>Number(s.slice(0,2))*60+Number(s.slice(3)),clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
   let a=minute(v.start),b=minute(v.end);while(!v.mins.includes(a%60)&&a<=b)a++;while(!v.mins.includes(b%60)&&b>=a)b--;
   v.start=clock(a);v.end=clock(b);result.push(v);
  };
  if(route.id==='2'){
   add('2-regular','不停邵逸夫堂',{mins:[15],stops:route.stops.filter(id=>id!=='4'),conditional:null});
   add('2-rrs','停邵逸夫堂',{mins:[45],conditional:null,special:true,note:'时刻表中的 :45 班次停邵逸夫堂；官网条件为始发站每小时 31 至 00 分发出的班次。'});
  }else if(['5','6A','7'].includes(route.id)){
   add(route.id+'-weekday','星期一至五',{weekdays:[1,2,3,4,5]});
   add(route.id+'-saturday','星期六',{weekdays:[6],end:route.saturdayEnd,special:true});
  }else if(route.id==='8'){
   add('8-teaching','教学日',{term:'teaching'});
   add('8-nonteaching','非教学日',{term:'non-teaching',stops:[...route.stops.slice(0,-1),...route.nonTeachingEnd],special:true,note:'改停大学站广场、崇基教学楼，不停大学站。'});
  }else if(route.id==='H'){
   add('H-regular','不停39区',{mins:[20,40],stops:route.stops.filter(id=>!['22','55'].includes(id)),conditional:null,note:'此类班次不停研究生宿舍一座及 39 区（上行）。'});
   add('H-area39','停39区',{mins:[0],conditional:null,special:true,note:'整点始发班次停靠 39 区（上行）及研究生宿舍一座；两次经过研宿均停靠。'});
  }else add(route.id,'');
 }
 return result;
}
export function variantApplies(v,day){
 return !(v.days==='holiday'&&!day.holiday||v.days!=='holiday'&&day.holiday||v.days==='teaching'&&!day.teaching||v.weekdays&&!v.weekdays.includes(day.weekday)||v.term==='teaching'&&!day.teaching||v.term==='non-teaching'&&day.teaching);
}
export function variantDays(v){
 if(v.days==='holiday')return '周日及公众假期';
 const week=v.weekdays?.length===1?'星期六':v.weekdays?.length===5?'星期一至五':'星期一至六';
 return week+' · '+(v.days==='teaching'||v.term==='teaching'?'仅教学日':v.term==='non-teaching'?'仅非教学日（公假除外）':'公假除外');
}
