import {hongKongParts,minutes} from './routing.js';
export function opening(place,calendar,date=new Date()){
 if(!place.regularHours)return {status:'unknown',label:'时间待核实',slots:[],reason:'暂无结构化营业时间'};
 const {day,minute,weekday,year}=hongKongParts(date);
 if(year!==2026)return {status:'unknown',label:'假期资料未覆盖',slots:[],reason:'已导入假期仅覆盖 2026 年'};
 const overrides=calendar.overrides.filter(o=>(o.res_id===place.foodId||o.is_global_closure)&&day>=o.start_date&&day<=o.end_date).sort((a,b)=>Number(b.is_global_closure)-Number(a.is_global_closure)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
 let slots,reason='每周营业时间';const o=overrides[0];
 if(o){slots=o.is_open?o.special_hours:[];reason='特别营业安排';}
 else if(calendar.holidays.includes(day)&&place.holidayHours?.type==='closed'){slots=[];reason='公假休息';}
 else if(calendar.holidays.includes(day)&&place.holidayHours?.type==='special'){slots=place.holidayHours.slots;reason='公假营业时间';}
 else slots=place.regularHours[['sun','mon','tue','wed','thu','fri','sat'][weekday]]||[];
 if(!slots.length)return {status:'closed',label:'今日休息',slots,reason};
 const hit=slots.find(s=>minute>=minutes(s.start)&&minute<minutes(s.end));
 if(hit)return {status:'open',label:minutes(hit.end)-minute<=30?'即将打烊 · 或已截单':'按时刻表营业',slots,reason};
 return {status:'closed',label:slots.some(s=>minutes(s.start)>minute)?'稍后营业':'今日已结束',slots,reason};
}
