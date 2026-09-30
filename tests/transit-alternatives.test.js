import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {WalkGraph,planTransit,createTrips} from '../src/routing.js';
const read=n=>JSON.parse(fs.readFileSync('public/data/'+n+'.json')),g=new WalkGraph(read('graph')),data=read('transit'),stops=read('stops');
const at=s=>new Date(s+'+08:00'),coord=id=>stops.find(s=>s.id===id).coords;
for(const [time,line] of [['2026-10-04T10:00','H'],['2026-10-02T20:00','N']])test(`${line} stays visible as a slower bus alternative`,()=>{
 const r=planTransit(g,data,stops,coord('1'),coord('2'),{date:at(time)});
 assert.ok(r.walk);assert.ok(r.transit);assert.ok(r.transit.minutes>r.walk.minutes);assert.ok(r.transit.legs.some(l=>l.kind==='bus'&&l.route===line));
 assert.ok(r.transit.legs.filter(l=>l.kind==='walk').every(l=>l.minutes<=12.001));
});
test('Sunday evening has H, never N; weekday evening includes N',()=>{
 const sun=createTrips(data,stops,at('2026-10-04T20:00'));assert.deepEqual([...new Set(sun.map(t=>t.route))],['H']);
 const fri=createTrips(data,stops,at('2026-10-02T20:00'));assert.ok(fri.some(t=>t.route==='N'));assert.ok(!fri.some(t=>t.route==='H'));
});
test('H/N first and final departure are inclusive; conditional stops apply to both visits',()=>{
 for(const [time,line,first,last,count] of [['2026-10-04T10:00','H',500,1400,46],['2026-10-02T20:00','N',1140,1410,19]]){
  const trips=createTrips(data,stops,at(time)).filter(t=>t.route===line);assert.equal(trips[0].departure,first);assert.equal(trips.at(-1).departure,last);assert.equal(trips.length,count);
  for(const t of trips){assert.equal(t.ids.filter(id=>id==='22').length,t.departure%60===0?2:0);if(line==='H')assert.equal(t.ids.includes('55'),t.departure%60===0);}
 }
});
test('after all buses finish, no walking-only path is mislabeled transit',()=>{
 const r=planTransit(g,data,stops,coord('1'),coord('2'),{date:at('2026-10-04T23:59')});assert.ok(r.walk);assert.equal(r.transit,null);
});
