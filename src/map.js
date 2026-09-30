import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(workerUrl);
const fc=features=>({type:'FeatureCollection',features});
const line=(coords,kind)=>({type:'Feature',properties:{kind},geometry:{type:'LineString',coordinates:coords.map(c=>[c[1],c[0]])}});
export async function createCampusMap(base,shortcuts,onSelect,onShortcut,onError){
 const map=new maplibregl.Map({container:'map',center:[114.2075,22.4192],zoom:16.1,pitch:48,bearing:-22,maxPitch:75,minZoom:14,maxZoom:20,maxBounds:[[114.197,22.408],[114.221,22.432]],attributionControl:{compact:true},style:{version:8,sources:{campus:{type:'geojson',data:base,attribution:'<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://www.cuhk.edu.hk/chinese/campus/cuhk-campus-map.html">CUHK</a>'},terrain:{type:'raster-dem',tiles:[`${location.origin}${import.meta.env.BASE_URL}data/terrain/{z}/{x}/{y}.png`],encoding:'terrarium',tileSize:256,minzoom:12,maxzoom:12,bounds:[114.08,22.30,114.35,22.53],attribution:'<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain: Mapzen / SRTM</a>'}},layers:[
 {id:'bg',type:'background',paint:{'background-color':'#eef0e6'}},
 {id:'green',type:'fill',source:'campus',filter:['all',['==',['get','kind'],'green'],['==',['geometry-type'],'Polygon']],paint:{'fill-color':'#cbdcc2','fill-opacity':.75}},
 {id:'water',type:'fill',source:'campus',filter:['all',['==',['get','kind'],'water'],['==',['geometry-type'],'Polygon']],paint:{'fill-color':'#afd0d0'}},
 {id:'road-border',type:'line',source:'campus',filter:['==',['get','kind'],'road'],paint:{'line-color':'#dbdfd4','line-width':['interpolate',['linear'],['zoom'],14,2,18,13]}},
 {id:'roads',type:'line',source:'campus',filter:['==',['get','kind'],'road'],paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],14,1,18,9]}},
 {id:'footways',type:'line',source:'campus',filter:['in',['get','highway'],['literal',['footway','steps','path']]],paint:{'line-color':'#d1b793','line-width':2,'line-dasharray':[2,2]}},
 {id:'buildings',type:'fill-extrusion',source:'campus',filter:['all',['==',['get','kind'],'building'],['==',['geometry-type'],'Polygon']],paint:{'fill-extrusion-color':'#c2cbb9','fill-extrusion-height':['case',['>', ['get','height'],0],['get','height'],['>', ['get','levels'],0],['*',['get','levels'],3.3],12],'fill-extrusion-opacity':.92}}
 ],terrain:{source:'terrain',exaggeration:1}}});
 let markers=[],labels=[],startMarker,endMarker;
 map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-right');
 map.addControl(new maplibregl.ScaleControl({maxWidth:100,unit:'metric'}),'bottom-left');
 map.on('error',e=>onError?.(e.error?.message||'地图加载失败'));
 await new Promise((resolve,reject)=>{map.once('load',resolve);setTimeout(()=>map.loaded()?resolve():reject(Error('地图加载超时')),20000);});
 map.addSource('route',{type:'geojson',data:fc([]),attribution:'<a href="https://portal.csdi.gov.hk/">Map from Lands Department · © HKSAR Government / CSDI</a>'});
 map.addLayer({id:'route-halo',type:'line',source:'route',paint:{'line-color':'#fff','line-width':9,'line-opacity':.9}});
 map.addLayer({id:'route-walk',type:'line',source:'route',filter:['==',['get','kind'],'walk'],paint:{'line-color':'#20674f','line-width':5}});
 map.addLayer({id:'route-bus',type:'line',source:'route',filter:['==',['get','kind'],'bus'],paint:{'line-color':'#8253ae','line-width':4,'line-dasharray':[2,1.5]}});
 map.addLayer({id:'route-connector',type:'line',source:'route',filter:['==',['get','kind'],'connector'],paint:{'line-color':'#dd945c','line-width':3,'line-dasharray':[1,2]}});
 for(const s of shortcuts){const el=document.createElement('button');el.className='lift-marker';el.textContent='↥';el.title=s.name+' · '+s.low+' ↔ '+s.high;el.setAttribute('aria-label',el.title);el.onclick=e=>{e.stopPropagation();onShortcut(s.id);};new maplibregl.Marker({element:el}).setLngLat([s.coords[1],s.coords[0]]).addTo(map);}
 const labelNames=[['大学站',22.41445,114.21018],['中央校园',22.4191,114.2058],['新亚书院',22.4221,114.209],['联合书院',22.4214,114.2057],['逸夫书院',22.4229,114.2017],['崇基学院',22.4161,114.2093],['敬文书院',22.425,114.2062]];
 for(const [name,lat,lng] of labelNames){const el=document.createElement('span');el.className='area-label';el.textContent=name;labels.push(new maplibregl.Marker({element:el}).setLngLat([lng,lat]).addTo(map));}
 return {map,
  places(places,selected){markers.forEach(m=>m.remove());markers=[];for(const p of places.slice(0,65)){const el=document.createElement('button');el.className='place-dot '+(p.id===selected?'chosen':'');el.title=p.name;el.setAttribute('aria-label',p.name);el.innerHTML=p.id===selected?'<span></span>':'';el.onclick=e=>{e.stopPropagation();onSelect(p.id);};markers.push(new maplibregl.Marker({element:el}).setLngLat([p.coords[1],p.coords[0]]).addTo(map));}},
  focus(c,z=17.5){map.flyTo({center:[c[1],c[0]],zoom:z,duration:800});},
  three(enabled){map.easeTo({pitch:enabled?55:0,bearing:enabled?-22:0,duration:650});map.setLayoutProperty('buildings','visibility','visible');map.setPaintProperty('buildings','fill-extrusion-height',enabled?['case',['>', ['get','height'],0],['get','height'],['>', ['get','levels'],0],['*',['get','levels'],3.3],12]:0);map.setTerrain(enabled?{source:'terrain',exaggeration:1}:null);},
  route(r,from,to){startMarker?.remove();endMarker?.remove();if(!r){map.getSource('route').setData(fc([]));return;}
   const features=[],legs=r.kind==='transit'?r.legs:[r];for(const l of legs){features.push(line(l.geometry,l.kind==='bus'?'bus':'walk'));for(const c of l.connectors||[])features.push(line(c,'connector'));}
   map.getSource('route').setData(fc(features));const bounds=new maplibregl.LngLatBounds();for(const f of features)for(const c of f.geometry.coordinates)bounds.extend(c);map.fitBounds(bounds,{padding:{top:85,bottom:85,left:65,right:65},maxZoom:18,pitch:map.getPitch(),duration:700});
   const make=(c,text,cls)=>{const e=document.createElement('span');e.className='endpoint '+cls;e.textContent=text;return new maplibregl.Marker({element:e}).setLngLat([c[1],c[0]]).addTo(map);};startMarker=make(from,'起','');endMarker=make(to,'终','end');
  },resize(){map.resize();}
 };
}
