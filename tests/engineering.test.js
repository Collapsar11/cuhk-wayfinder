import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {WalkGraph,createTrips} from '../src/routing.js';
import {planJourney} from '../src/planner.js';
import {shbEntrance,engineeringBus} from '../src/engineering-route.js';
import {containsPoint,labelBuildings} from '../src/buildings.js';
import {searchPlaces} from '../src/search.js';
const read=n=>JSON.parse(fs.readFileSync(`public/data/${n}.json`));
const data={graph:read('graph'),lands:read('lands-graph'),stops:read('stops'),transit:read('transit')};
const places=read('places').places,from=places.find(p=>p.id==='b-109'),to=places.find(p=>p.id==='b-34');
for(const [date,line] of [['2026-10-02T09:00+08:00','2S'],['2026-10-04T10:00+08:00','H'],['2026-10-02T20:00+08:00','N']])test(`PGH1 to SHB retains ${line} via stop 4 and actual 5/F bridge entrance`,()=>{
 const result=planJourney(data,from.coords,to.coords,{fromPlaceId:from.id,toPlaceId:to.id,date});
 const r=result.alternatives.find(r=>r.guide==='pgh-shb');assert.ok(r);
 const bus=r.legs.find(l=>l.kind==='bus');assert.equal(bus.route,line);assert.deepEqual(bus.stops,['22','2','4']);
 const last=r.legs.at(-1);assert.ok(last.segments.some(s=>s.connection==='lsb-shb'));assert.ok(last.segments.some(s=>s.stairs));
 assert.equal(last.nodeIds.at(-1),data.graph.nodeIds.indexOf('2389077301'));assert.equal(last.connectors.at(-1)[0][0],r.arrivalCoords[0]);
 assert.match(r.arrivalLabel,/5/);assert.ok(Number.isFinite(r.minutes));
 const trip=createTrips(data.transit,data.stops,new Date(date)).find(t=>t.route===line&&t.times[t.ids.indexOf('22')]===bus.departure);
 assert.ok(trip);if(line!=='2S')assert.equal(trip.departure%60,0);
});
test('engineering route respects holidays, service end, visitor and stairs constraints',()=>{
 const g=new WalkGraph(data.graph),end=shbEntrance(g);
 for(const opts of [{member:false},{date:new Date('2026-10-04T23:59+08:00')}])assert.equal(engineeringBus(g,data.transit,data.stops,from.coords,end,{date:new Date('2026-10-04T10:00+08:00'),...opts}),null);
 const r=planJourney(data,from.coords,to.coords,{fromPlaceId:from.id,toPlaceId:'entrance-shb-5',date:'2026-10-04T10:00+08:00',shortcuts:false});assert.equal(r.reason,'entrance-disabled');assert.equal(r.alternatives.length,0);
 const noSteps=planJourney(data,from.coords,to.coords,{fromPlaceId:from.id,toPlaceId:to.id,date:'2026-10-04T10:00+08:00',profile:'no-steps'});assert.ok(noSteps.alternatives.every(r=>r.stairs===0));
});
test('SHB 5/F entrance is exact and cannot snap to a different floor when disabled',()=>{
 const r=planJourney(data,from.coords,to.coords,{fromPlaceId:from.id,toPlaceId:'entrance-shb-5',date:'2026-10-02T09:00+08:00'});
 assert.ok(r.alternatives.length);for(const a of r.alternatives){assert.match(a.arrivalLabel,/5/);const walk=a.kind==='transit'?a.legs.at(-1):a;assert.equal(walk.nodeIds.at(-1),data.graph.nodeIds.indexOf('2389077301'));}
 const g=new WalkGraph(data.graph,{shortcuts:false});assert.equal(g.snap(shbEntrance(g)),null);
});
test('ERB west bridge reaches 9/F; crossing to east G/F includes elevator in both directions',()=>{
 const g=new WalkGraph(data.graph),coord=id=>{const p=[...g.nodes[data.graph.nodeIds.indexOf(id)]];p.osmNodeId=id;return p;};
 const west=coord('1502845935'),east=coord('10026093827');
 for(const [a,b] of [[west,east],[east,west]]){const r=g.route(a,b);assert.ok(r.segments.some(s=>s.kind==='elevator'&&s.shortcut==='wmw'));assert.equal(r.elevatorCount,1);}
 const high=data.graph.ways.find(w=>w.id==='1492178658-high'),low=data.graph.ways.find(w=>w.id==='1492178658-low');assert.equal(high.tags.level,'9/F');assert.equal(low.tags.level,'G/F');assert.ok(!high.nodes.some(n=>low.nodes.includes(n)));
 assert.ok(!data.graph.ways.some(w=>w.id==='1116933334'),'construction stair excluded');
});
test('building footprints include named LSB multipolygon with courtyard and SHB',()=>{
 const base=read('basemap'),lsb=base.features.find(f=>f.properties.placeId==='b-33'),shb=base.features.find(f=>f.properties.placeId==='b-34');
 assert.ok(lsb);assert.ok(shb);assert.match(lsb.properties.name,/夫人/);assert.equal(lsb.geometry.coordinates.length,2);
 assert.ok(containsPoint(shb.geometry,to.coords));assert.ok(!containsPoint(shb.geometry,from.coords));
 const shape={type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1],[0,0]],[[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.2,.2]]]};
 assert.equal(containsPoint(shape,[.5,.5]),false);
 const unknown={type:'Feature',properties:{kind:'building',name:''},geometry:shape};
 labelBuildings({features:[unknown]},[{id:'b-test',name:'nearby',en:'nearby',coords:[2,2],aliases:[]}]);assert.equal(unknown.properties.name,'');
});
test('new connections retain floor provenance, stair counts and searchable entrance',()=>{
 const s=read('shortcuts');assert.equal(s.length,9);assert.equal(s.find(s=>s.id==='shb-erb').high,'ERB 9/F');
 for(const w of data.graph.ways.filter(w=>w.tags.connection==='alumni-stairs'))assert.ok(['83','85'].includes(w.tags.step_count));
 assert.ok(searchPlaces(places,'研宿一座').some(p=>p.id===from.id));assert.equal(searchPlaces(places,'SHB5')[0].id,'entrance-shb-5');
});
