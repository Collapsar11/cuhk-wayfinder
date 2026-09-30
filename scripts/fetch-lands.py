"""Download only CUHK's 3D pedestrian network. Large raw file stays on external disk."""
import urllib.request,urllib.parse,json,pathlib,sys,datetime
base='https://portal.csdi.gov.hk/server/rest/services/common/landsd_rcd_1637222018065_52265/MapServer/0/query'
p={'where':'1=1','geometry':'114.198,22.412,114.214,22.429','geometryType':'esriGeometryEnvelope','inSR':4326,'spatialRel':'esriSpatialRelIntersects','outSR':4326,'outFields':'*','returnZ':'true','f':'json','resultRecordCount':3000,'orderByFields':'OBJECTID'}
features=[]
for offset in range(0,60000,3000):
 p['resultOffset']=offset
 req=urllib.request.Request(base+'?'+urllib.parse.urlencode(p),headers={'User-Agent':'CUHK-Wayfinder data importer'})
 r=json.load(urllib.request.urlopen(req,timeout=90))
 if 'error' in r:raise RuntimeError(r['error'])
 features.extend(r['features']);print(offset,len(r['features']),flush=True)
 if not r.get('exceededTransferLimit'):break
else:raise RuntimeError('Pagination did not finish; refusing to save partial network')
assert len({f['attributes']['OBJECTID'] for f in features})==len(features),'Duplicate record IDs'
out=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/Volumes/H/cuhk-wayfinder/raw/lands-campus-network.json')
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'features':features,'source':base,'bbox':p['geometry'],'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()},ensure_ascii=False))
print('Saved',len(features),'features to',out)
