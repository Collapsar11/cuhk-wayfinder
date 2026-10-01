import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createTrips,serviceDay,hongKongParts} from '../src/routing.js';
import {resolveStops} from '../src/transit-stops.js';
import {planJourney} from '../src/planner.js';import {searchPlaces} from '../src/search.js';
const read=n=>JSON.parse(fs.readFileSync(`public/data/${n}.json`)),data=read('transit'),stops=read('stops'),places=read('places').places;
const at=s=>new Date(s+'+08:00'),trips=s=>createTrips(data,stops,at(s));
test('six requested variants are explicit; every departure is unique',()=>{
 assert.deepEqual(data.variants.filter(v=>v.special).map(v=>v.label).sort(),['2（停邵逸夫堂）','5（星期六）','6A（星期六）','7（星期六）','8（非教学日）','H（停39区）'].sort());
 assert.equal(data.variants.length,18);
 for(const date of ['2026-10-02T10:00','2026-10-03T10:00','2026-10-04T10:00','2026-12-10T10:00']){const t=trips(date);assert.equal(new Set(t.map(t=>t.route+':'+t.departure)).size,t.length);}
});
test('2 stop-at-Shaw variant has 07:45–18:45 :45 departures and station 4',()=>{
 const t=trips('2026-10-02T10:00'),yes=t.filter(t=>t.variantId==='2-rrs'),no=t.filter(t=>t.variantId==='2-regular');
 assert.equal(yes[0].departure,465);assert.equal(yes.at(-1).departure,1125);assert.equal(yes.length,12);
 assert.ok(yes.every(t=>t.departure%60===45&&t.ids.includes('4')));assert.ok(no.every(t=>t.departure%60===15&&!t.ids.includes('4')));
});
test('Saturday 5/6A/7 have independent first and last trips, and no weekday duplicates',()=>{
 const t=trips('2026-10-03T10:00');
 for(const [line,first,last,count] of [['5',558,806,15],['6A',550,790,5],['7',498,798,11]]){
  const v=t.filter(t=>t.route===line);assert.equal(v[0].departure,first);assert.equal(v.at(-1).departure,last);assert.equal(v.length,count);assert.ok(v.every(t=>t.variantId===line+'-saturday'));
 }
 assert.ok(!trips('2026-10-02T10:00').some(t=>t.variantId.endsWith('-saturday')));
 for(const date of ['2026-12-12T10:00','2026-10-01T10:00','2026-10-04T10:00'])assert.ok(!trips(date).some(t=>['5','6A','7'].includes(t.route)));
});
test('non-teaching 8 replaces the terminus and H 39-area stops are only hourly',()=>{
 const nt=trips('2026-12-10T10:00').filter(t=>t.route==='8');assert.ok(nt.length);assert.ok(nt.every(t=>t.variantId==='8-nonteaching'&&t.ids.slice(-2).join(',')==='52,23'&&!t.ids.includes('1')));
 assert.ok(trips('2026-10-02T10:00').filter(t=>t.route==='8').every(t=>t.variantId==='8-teaching'&&t.ids.at(-1)==='1'));
 const h=trips('2026-10-04T10:00'),special=h.filter(t=>t.variantId==='H-area39');assert.equal(special.length,15);assert.equal(special[0].departure,540);assert.equal(special.at(-1).departure,1380);
 assert.ok(special.every(t=>t.ids.includes('55')&&t.ids.filter(id=>id==='22').length===2&&t.departure%60===0));assert.ok(h.filter(t=>t.variantId==='H-regular').every(t=>!t.ids.includes('55')&&!t.ids.includes('22')));
});
test('relocation keeps service, applies only after effective time, preserves original coordinates',()=>{
 const current=resolveStops(data,stops,hongKongParts(at('2026-10-02T09:00'))),up=current.find(s=>s.id==='62'),down=current.find(s=>s.id==='63');
 assert.ok(up.routes.includes('8')&&up.routes.includes('4'));assert.ok(up.approximate);assert.ok(down.relocation);assert.notDeepEqual(up.coords,up.originalCoords);
 assert.deepEqual(resolveStops(data,stops,hongKongParts(at('2026-09-27T10:00'))).find(s=>s.id==='62').coords,stops.find(s=>s.id==='62').coords);
 assert.ok(!resolveStops(data,stops,hongKongParts(at('2026-09-19T08:34'))).find(s=>s.id==='63').relocation);
 assert.ok(resolveStops(data,stops,hongKongParts(at('2026-09-19T08:35'))).find(s=>s.id==='63').relocation);
});
test('PGH1 to CWC canteen retains direct 8 from relocated Circuit East in both term modes',()=>{
 const dataset={graph:read('graph'),lands:read('lands-graph'),transit:data,stops},from=places.find(p=>p.id==='b-109'),to=places.find(p=>p.id==='f-309');
 for(const [date,variant] of [['2026-10-02T09:00','8-teaching'],['2026-12-10T09:00','8-nonteaching']]){
  const r=planJourney(dataset,from.coords,to.coords,{fromPlaceId:from.id,toPlaceId:to.id,date:at(date).toISOString()});
  const direct=r.alternatives.find(r=>r.legs?.some(l=>l.variantId===variant&&l.stops.join(',')==='62,64'));assert.ok(direct);
  const bus=direct.legs.find(l=>l.kind==='bus');assert.equal(bus.notices[0].stopId,'62');assert.ok(direct.legs[0].meters<500);assert.ok(direct.legs.at(-1).meters<250);
 }
 assert.ok(searchPlaces(places,'环回东').some(p=>p.stopId==='62'));assert.equal(searchPlaces(places,'敬文can')[0].id,to.id);
 assert.ok(serviceDay(data,at('2026-10-01T09:00')).holiday);
});
