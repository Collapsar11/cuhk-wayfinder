import SunCalc from 'suncalc';
// Preference weights are not travel minutes or a medical heat-stress model.
export const PREFERENCES={
 fast:{sun:0,climb:0,stairs:0,unknownSlope:0},
 shade:{sun:3,climb:.12,stairs:.7,unknownSlope:.2},
 gentle:{sun:.3,climb:.55,stairs:2.5,unknownSlope:.5},
 comfort:{sun:2,climb:.35,stairs:1.5,unknownSlope:.35}
};
export function sunContext(date,coords=[22.419,114.207],mode='auto'){
 // SunCalc 1.9.0 returns radians. No weather, trees, or building-shadow claims.
 const altitude=SunCalc.getPosition(new Date(date),...coords).altitude;
 const daylight=Number.isFinite(altitude)&&altitude>0;
 return {daylight,altitudeDegrees:altitude*180/Math.PI,factor:!daylight||mode==='off'?0:mode==='strong'?1:Math.max(.25,Math.sin(altitude)),mode};
}
export function coverType(tags){return tags.covered==='yes'||tags.indoor==='yes'||tags.highway==='elevator'?'covered':tags.covered==='no'?'exposed':'unknown';}
export function preferencePenalty(m,profile='fast',sun=1){
 const w=PREFERENCES[profile]||PREFERENCES.fast;
 return w.sun*sun*(m.exposedMinutes+m.unknownCoverMinutes)+w.climb*m.ascent+w.stairs*m.stairs/75+w.unknownSlope*m.unknownSlopeMeters/75;
}
export function blankMetrics(){return {ascent:0,descent:0,coveredMeters:0,exposedMeters:0,unknownCoverMeters:0,exposedMinutes:0,unknownCoverMinutes:0,knownSlopeMeters:0,estimatedSlopeMeters:0,unknownSlopeMeters:0,stairs:0,escalatorMeters:0,elevatorCount:0};}
export function sumMetrics(items){const m=blankMetrics();for(const i of items)for(const k of Object.keys(m))m[k]+=i[k]||0;return m;}
export function routePreferenceScore(r,preference='comfort',sun=1){return r.minutes+preferencePenalty(r,preference,sun);}
