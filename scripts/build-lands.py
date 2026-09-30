"""Convert the official 3D network snapshot, keeping XYZ topology separate from OSM.
Usage: python3 scripts/build-lands.py /path/to/lands-campus-network.json
Access-time-restricted links are excluded until their schedules can be resolved.
"""
import json,sys,math,collections
from pathlib import Path
raw=json.load(open(sys.argv[1]));nodes=[];ways=[];index={};excluded=collections.Counter()
def node(c):
 # ~1 mm horizontal, 1 cm vertical: do not join crossings on different levels.
 key=(round(c[0],8),round(c[1],8),round(c[2],2))
 if key not in index:index[key]=len(nodes);nodes.append([round(c[1],8),round(c[0],8),round(c[2],2)])
 return index[key]
for f in raw['features']:
 a=f['attributes'];kind=a['FeatureType']
 if a['Enabled']!=1:excluded['disabled']+=1;continue
 if a.get('AccessTimeID') is not None:excluded['unresolvedAccessTime']+=1;continue
 if a['Location']==3:excluded['paidArea']+=1;continue
 for pi,path in enumerate(f['geometry']['paths']):
  if len(path)<2:continue
  ns=[node(c) for c in path];tags={'highway':'elevator' if kind in [10,18] else 'steps' if kind in [8,12,16,20] else 'footway','name':a.get('AliasNameTC') or a.get('StreetNameTC') or a.get('AliasNameEN') or '', 'source':'landsd','featureType':kind}
  if a['Direction']:tags['oneway:foot']='yes' if a['Direction']==1 else '-1'
  if a['WheelchairBarrier']==1:tags['wheelchair']='no'
  if a['Location']==2:tags['shortcut']='lands-indoor'
  if a['WeatherProof'] in [1,2]:tags['covered']='yes' if a['WeatherProof']==1 else 'no'
  if a['Location']==2:tags['indoor']='yes'
  if kind in [8,16]:tags['conveying']='yes'
  for j in range(1,len(ns)):
   p,q=nodes[ns[j-1]],nodes[ns[j]];d=math.hypot((q[0]-p[0])*111195,(q[1]-p[1])*102800);rise=q[2]-p[2]
   t={**tags,'incline':round(rise/max(d,.1)*100,2),'rise':round(rise,2)}
   if kind in [10,18]:t.update(fixedMinutes=1.5+abs(rise)/60,fromLevel=f'高程 {p[2]}m',toLevel=f'高程 {q[2]}m')
   ways.append({'id':f"lands-{a['PedestrianRouteID']}-{pi}-{j}",'nodes':[ns[j-1],ns[j]],'tags':t})
out={'source':raw['source'],'retrievedAt':raw['retrievedAt'],'recordCount':len(raw['features']),'excluded':dict(excluded),'nodes':nodes,'ways':ways}
Path('public/data/lands-graph.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(len(nodes),'nodes;',len(ways),'segments; excluded',dict(excluded))
