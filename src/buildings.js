import {normal} from './search.js';

function inRing([x,y],ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
export function containsPoint(geometry,coords){
 const point=[coords[1],coords[0]],polygons=geometry.type==='MultiPolygon'?geometry.coordinates:[geometry.coordinates];
 return polygons.some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(r=>inRing(point,r)));
}
// An official building name is matched by name first, then by containment.
// Facilities, nearby buildings and courtyard points cannot rename a footprint.
export function labelBuildings(base,places){
 const buildings=places.filter(p=>p.id.startsWith('b-'));
 for(const f of base.features){
  if(f.properties.kind!=='building'||!['Polygon','MultiPolygon'].includes(f.geometry.type))continue;
  const p=f.properties,names=[normal(p.name),normal(p.en)].filter(Boolean);
  const named=buildings.filter(b=>[b.name,b.en].some(n=>names.includes(normal(n))));
  const contained=buildings.filter(b=>containsPoint(f.geometry,b.coords));
  const match=named.length===1?named[0]:!p.name&&contained.length===1?contained[0]:null;
  if(match){p.name=match.name;p.en=match.en;p.placeId=match.id;p.aliases=match.aliases.join(' · ');}
 }
 return base;
}
