"""OSM topology, no inferred links between disconnected roads."""
import xml.etree.ElementTree as ET,json,pathlib,collections
root=ET.parse('data/raw/osm.xml').getroot()
def tags(x):return {a.get('k'):a.get('v') for a in x.findall('tag')}
nodes={n.get('id'):[float(n.get('lat')),float(n.get('lon'))] for n in root.findall('node')}
allowed={'footway','path','pedestrian','steps','living_street','residential','service','unclassified','tertiary','secondary','track','road','cycleway'}
ways=[];features=[]
# Multipolygon buildings (including Lady Shaw Building) carry names on the relation.
wayElements={w.get('id'):w for w in root.findall('way')}
relationTags={};relationHoles={}
for rel in root.findall('relation'):
 rt=tags(rel)
 if rt.get('type')!='multipolygon' or 'building' not in rt:continue
 outer=[m.get('ref') for m in rel.findall('member') if m.get('role')=='outer']
 inner=[m.get('ref') for m in rel.findall('member') if m.get('role')=='inner']
 # Preserve complete closed footprints and their courtyard holes; do not invent missing geometry.
 for ref in outer:
  w=wayElements.get(ref)
  if w is None:continue
  refs=[n.get('ref') for n in w.findall('nd')]
  if refs[0]!=refs[-1]:continue
  relationTags[ref]=rt
  if len(outer)==1:relationHoles[ref]=inner

for w in root.findall('way'):
 t={**relationTags.get(w.get('id'),{}),**tags(w)};refs=[n.get('ref') for n in w.findall('nd')];coords=[nodes[r] for r in refs if r in nodes]
 if len(coords)<2:continue
 # strict public-foot access; CUHK entrance access is additionally explained in app
 foot=t.get('foot'); access=t.get('access');h=t.get('highway')
 walk=h in allowed and foot not in ['no','private'] and (access not in ['no','private'] or foot in ['yes','designated','permissive']) and t.get('area')!='yes' and t.get('indoor')!='yes' and not t.get('construction')
 if h=='cycleway' and foot not in ['yes','designated','permissive']:walk=False
 if walk:ways.append({'id':w.get('id'),'nodes':refs,'tags':{k:v for k,v in t.items() if k in ['highway','name','name:zh','name:en','incline','surface','lit','covered','wheelchair','oneway:foot','foot:forward','foot:backward','access','bridge','tunnel','level','layer','conveying','oneway','step_count','handrail']}})
 kind='road' if h else 'building' if 'building' in t else 'water' if t.get('natural')=='water' or t.get('water') else 'green' if t.get('landuse') in ['forest','grass','recreation_ground'] or t.get('natural') in ['wood','scrub'] or t.get('leisure') in ['garden','park','pitch'] else None
 if kind:
  polygon=refs[0]==refs[-1] and (kind!='road' or t.get('area')=='yes')
  features.append({'type':'Feature','id':'osm-way-'+w.get('id'),'properties':{'osmId':w.get('id'),'en':t.get('name:en',''),'kind':kind,'name':t.get('name:zh',t.get('name','')),'highway':h,'height':float(t.get('height','0').split(' ')[0]) if t.get('height','0').replace('.','',1).isdigit() else 0,'levels':float(t.get('building:levels','0')) if t.get('building:levels','0').replace('.','',1).isdigit() else 0},'geometry':{'type':'Polygon' if polygon else 'LineString','coordinates':[[[round(c[1],7),round(c[0],7)] for c in coords]] if polygon else [[round(c[1],7),round(c[0],7)] for c in coords]}})
for f in features:
 if f['geometry']['type']!='Polygon':continue
 for ref in relationHoles.get(f['properties']['osmId'],[]):
  ring=[n.get('ref') for n in wayElements[ref].findall('nd')]
  if ring[0]==ring[-1] and all(n in nodes for n in ring):
   f['geometry']['coordinates'].append([[nodes[n][1],nodes[n][0]] for n in ring])
used={r for w in ways for r in w['nodes']};ids={r:i for i,r in enumerate(sorted(used))}
graph={'source':'https://www.openstreetmap.org/copyright','retrievedAt':'2026-10-01','nodeIds':sorted(used),'nodes':[nodes[r] for r in sorted(used)],'ways':[dict(w,nodes=[ids[r] for r in w['nodes']]) for w in ways]}
pathlib.Path('public/data/graph.json').write_text(json.dumps(graph,ensure_ascii=False,separators=(',',':')))
pathlib.Path('public/data/basemap.json').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')))
print('graph',len(used),'nodes',len(ways),'ways; basemap',len(features),'features')
