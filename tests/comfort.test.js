import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {WalkGraph} from '../src/routing.js';import {sunContext,coverType,routePreferenceScore} from '../src/comfort.js';import {planJourney} from '../src/planner.js';
const read=n=>JSON.parse(fs.readFileSync('public/data/'+n+'.json'));
const coveredGraph={nodes:[[22.42,114.20,0],[22.4205,114.2004,0],[22.421,114.20,0]],ways:[{id:'open',nodes:[0,2],tags:{covered:'no'}},{id:'roof',nodes:[0,1,2],tags:{covered:'yes'}}]};
test('shade chooses a longer covered route; reported minutes remain physical time',()=>{
 const g=new WalkGraph(coveredGraph),fast=g.route(g.nodes[0],g.nodes[2]),shade=g.route(g.nodes[0],g.nodes[2],'shade');
 assert.ok(shade.minutes>fast.minutes);assert.ok(shade.coveredMeters>fast.coveredMeters);assert.ok(shade.preferenceCost<fast.minutes+3*fast.exposedMinutes);assert.equal(shade.minutes,shade.meters/75);
});
test('nighttime removes sun penalty; unknown cover is not counted as shade',()=>{
 const night=sunContext('2026-10-04T22:00+08:00'),day=sunContext('2026-10-04T12:00+08:00');assert.equal(night.factor,0);assert.ok(day.factor>.5);assert.equal(sunContext('2026-10-04T12:00+08:00',undefined,'off').factor,0);assert.equal(sunContext('2026-10-04T22:00+08:00',undefined,'strong').factor,0);assert.equal(coverType({}), 'unknown');
 const g=new WalkGraph(coveredGraph,{sunFactor:0}),a=g.route(g.nodes[0],g.nodes[2],'shade'),b=g.route(g.nodes[0],g.nodes[2]);assert.deepEqual(a.edgeKeys,b.edgeKeys);
});
test('comfort can prefer a slower elevator over a large stair climb',()=>{
 const d={nodes:[[22.42,114.2,0],[22.4201,114.2,0],[22.4201,114.2,20],[22.421,114.2,20]],ways:[{id:'stairs',nodes:[0,3],tags:{highway:'steps',covered:'no'}},{id:'access',nodes:[0,1],tags:{covered:'yes'}},{id:'lift',nodes:[1,2],tags:{highway:'elevator',fixedMinutes:1.86,shortcut:'lift'}},{id:'landing',nodes:[2,3],tags:{covered:'yes'}}]};
 const g=new WalkGraph(d,{elevatorWait:5}),fast=g.route(d.nodes[0],d.nodes[3]),comfort=g.route(d.nodes[0],d.nodes[3],'comfort');assert.equal(fast.elevatorCount,0);assert.equal(comfort.elevatorCount,1);assert.ok(comfort.minutes>fast.minutes);assert.equal(comfort.ascent,0);assert.equal(fast.ascent,20);assert.equal(comfort.stairs,0);
 assert.ok(g.elevatorAlternatives(d.nodes[0],d.nodes[3]).length);assert.equal(new WalkGraph(d,{shortcuts:false}).elevatorAlternatives(d.nodes[0],d.nodes[3]).length,0);
});
test('unknown slopes remain unknown and connector uncertainty is retained',()=>{const g=new WalkGraph({nodes:[[22.42,114.2],[22.421,114.2]],ways:[{id:'u',nodes:[0,1],tags:{}}]});const r=g.route([22.4199,114.2],g.nodes[1]);assert.equal(r.knownSlopeMeters,0);assert.equal(r.unknownSlopeMeters,r.meters);assert.equal(r.unknownCoverMeters,r.meters);assert.ok(r.connectorMeters>0);});
test('terrain is never used to infer indoor / bridge floor heights',()=>{const d={nodes:[[22.42,114.2],[22.421,114.2]],terrainElevations:[0,60],ways:[{id:'bridge',nodes:[0,1],tags:{bridge:'yes'}}]};const r=new WalkGraph(d).route(d.nodes[0],d.nodes[1]);assert.equal(r.knownSlopeMeters,0);d.ways[0].tags={};const outdoor=new WalkGraph(d).route(d.nodes[0],d.nodes[1]);assert.equal(outdoor.ascent,60);assert.ok(outdoor.estimatedSlopeMeters>0);});
const dataset={graph:read('graph'),lands:read('lands-graph'),stops:read('stops'),transit:read('transit')},places=read('places').places,from=places.find(p=>p.id==='f-76').coords,to=places.find(p=>p.id==='b-5').coords;
test('real campus query retains shade, gentle, slower lift, and H bus choices with valid geometry',()=>{
 const r=planJourney(dataset,from,to,{date:'2026-10-04T12:00+08:00',member:true,elevatorWait:5,preference:'comfort'}),a=r.alternatives;
 for(const tag of ['避晒优先','少爬坡优先'])assert.ok(a.some(x=>x.tags.includes(tag)));
 assert.ok(a.some(x=>x.elevatorCount>0&&x.minutes>Math.min(...a.map(x=>x.minutes))));assert.ok(a.some(x=>x.kind==='transit'&&x.legs.some(l=>l.kind==='bus'&&l.route==='H')));
 const lands=a.filter(x=>x.network==='lands'),fast=lands.find(x=>x.tags.includes('较快步行'));assert.ok(lands.some(x=>x.coveredMeters>fast.coveredMeters+100));assert.ok(lands.some(x=>x.ascent<fast.ascent-20));
 for(const route of a){assert.ok(Number.isFinite(route.minutes));if(route.kind==='walk'){assert.equal(route.geometry.length,route.segments.length+1);assert.equal(route.nodeIds.length,new Set(route.nodeIds).size);assert.ok(Math.abs(route.coveredMeters+route.exposedMeters+route.unknownCoverMeters-route.meters)<1e-6);}}
 for(let i=1;i<a.length;i++)assert.ok(routePreferenceScore(a[i],'comfort',r.sun.factor)>=routePreferenceScore(a[i-1],'comfort',r.sun.factor)-1e-6);
});
test('no-steps and disabled shortcuts constrain every returned alternative, including bus access',()=>{
 const r=planJourney(dataset,from,to,{date:'2026-10-02T20:00+08:00',member:true,shortcuts:false,profile:'no-steps'});assert.ok(r.alternatives.length);
 for(const a of r.alternatives)for(const w of a.kind==='transit'?a.legs.filter(l=>l.kind==='walk'):[a]){assert.equal(w.stairs,0);assert.equal(w.escalatorMeters,0);assert.ok(!w.segments.some(s=>s.shortcut));}
});
