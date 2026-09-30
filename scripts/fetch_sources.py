"""Download public campus sources; retain dated provenance and never execute source JS."""
import urllib.request, pathlib, json, datetime, concurrent.futures
BASE=pathlib.Path(__file__).resolve().parents[1]
SOURCES={
 'locations-en.js':'https://www.cuhk.edu.hk/english/js/campus/cuhk_location_db.js',
 'locations-zh.js':'https://www.cuhk.edu.hk/chinese/js/campus/cuhk_location_db.js',
 'map-config.js':'https://www.cuhk.edu.hk/english/js/campus/cuhk_map_config.js',
 'map-init.js':'https://www.cuhk.edu.hk/english/js/campus/cuhk_map_init.js',
 'food.html':'https://ueatwhat.com/',
 'accommodation.html':'https://www.cuhk.edu.hk/chinese/campus/accommodation.html',
}
for r in ['1','2','2s','3','4','8','n','h','5','6a','6b','7','up','down']:
 SOURCES['bus-'+r+'.html']='https://transport.cuhk.edu.hk/route/'+r+'/'
def fetch(item):
 name,url=item; row={'file':name,'url':url,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; CUHKCampusNavigator/0.1; public research)'})
  data=urllib.request.urlopen(req,timeout=45).read();(BASE/'data/raw'/name).write_bytes(data)
  row.update(bytes=len(data),status='ok')
 except Exception as e:row.update(status='error',error=str(e))
 return row
if __name__=='__main__':
 (BASE/'data/raw').mkdir(parents=True,exist_ok=True)
 rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(fetch,SOURCES.items()))
 (BASE/'data/raw/sources.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 print(json.dumps(rows,ensure_ascii=False,indent=2))

 # Extra runtime-data inputs. Official PDFs still require manual visual review.
 extra={
  'osm.xml':'https://api.openstreetmap.org/api/0.6/map?bbox=114.197,22.408,114.222,22.432',
  'bus-shuttle.pdf':'https://transport.cuhk.edu.hk/wp-content/uploads/documents/Shuttle.pdf',
  'bus-night.pdf':'https://transport.cuhk.edu.hk/wp-content/uploads/documents/NH.pdf',
  'bus-class.pdf':'https://transport.cuhk.edu.hk/wp-content/uploads/documents/Meet-Class.pdf'
 }
 food={f'food-{name}.json':f'https://api.ueatwhat.com/api/{name}' for name in ['restaurants','holidays','overrides']}
 for filename,inputs in [('sources-extra.json',extra),('sources-food.json',food)]:
  rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=3).map(fetch,inputs.items()))
  (BASE/'data/raw'/filename).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
  print(json.dumps(rows,ensure_ascii=False,indent=2))
