"""Sample the bundled Terrarium DEM for coarse OUTDOOR OSM slope estimates.
No floor/bridge elevations are inferred. stdlib-only RGB/RGBA PNG decoder.
"""
import json,math,struct,zlib,pathlib

def png(path):
 b=path.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n';p=8;data=b''
 while p<len(b):
  n=struct.unpack('>I',b[p:p+4])[0];kind=b[p+4:p+8];part=b[p+8:p+8+n];p+=12+n
  if kind==b'IHDR':w,h,depth,color,compression,filtering,interlace=struct.unpack('>IIBBBBB',part);assert depth==8 and color in [2,6] and interlace==0
  if kind==b'IDAT':data+=part
 channels=3 if color==2 else 4;stride=w*channels;raw=zlib.decompress(data);rows=[];prev=[0]*stride
 for y in range(h):
  off=y*(stride+1);f=raw[off];row=list(raw[off+1:off+1+stride])
  for x in range(stride):
   a=row[x-channels] if x>=channels else 0;b=prev[x];c=prev[x-channels] if x>=channels else 0
   if f==1:pred=a
   elif f==2:pred=b
   elif f==3:pred=(a+b)//2
   elif f==4:
    q=a+b-c;pa,pb,pc=abs(q-a),abs(q-b),abs(q-c);pred=a if pa<=pb and pa<=pc else b if pb<=pc else c
   else:assert f==0;pred=0
   row[x]=(row[x]+pred)%256
  rows.append(row);prev=row
 return w,h,channels,rows
cache={}
def pixel(x,y):
 tx,ty=x//256,y//256
 if (tx,ty) not in cache:cache[tx,ty]=png(pathlib.Path(f'public/data/terrain/12/{tx}/{ty}.png'))
 w,h,c,rows=cache[tx,ty];row=rows[y%256];i=(x%256)*c
 return row[i]*256+row[i+1]+row[i+2]/256-32768

def sample(lat,lng):
 size=2**12*256;x=(lng+180)/360*size-.5;y=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*size-.5
 ix,iy=math.floor(x),math.floor(y);a,b=x-ix,y-iy
 return round(pixel(ix,iy)*(1-a)*(1-b)+pixel(ix+1,iy)*a*(1-b)+pixel(ix,iy+1)*(1-a)*b+pixel(ix+1,iy+1)*a*b,2)
p=pathlib.Path('public/data/graph.json');g=json.loads(p.read_text());g['terrainElevations']=[sample(*n[:2]) for n in g['nodes']]
g['terrainElevationSource']={'name':'Mapzen Terrarium zoom 12','url':'https://registry.opendata.aws/terrain-tiles/','horizontalResolutionMetersApprox':35,'method':'bilinear pixel-center sampling; only applied to outdoor ground paths; not floor-level survey'}
p.write_text(json.dumps(g,ensure_ascii=False,separators=(',',':')))
print(len(g['terrainElevations']),'coarse terrain elevations;',min(g['terrainElevations']),max(g['terrainElevations']))
