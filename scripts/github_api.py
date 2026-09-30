"""Deploy helper: reuse Git's credential helper without writing or printing secrets."""
import urllib.request,urllib.error,json,subprocess,os,sys

def request(method,path,data=None):
 p=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,env={**os.environ,'GIT_TERMINAL_PROMPT':'0'},timeout=20)
 fields=dict(x.split('=',1) for x in p.stdout.splitlines() if '=' in x)
 token=os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN') or fields.get('password')
 if not token:raise RuntimeError('No GitHub credential available')
 req=urllib.request.Request('https://api.github.com'+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'CUHK-Wayfinder-Deployment'})
 try:
  with urllib.request.urlopen(req,timeout=40) as r:return r.status,json.load(r) if r.status!=204 else {}
 except urllib.error.HTTPError as e:return e.code,json.load(e)
if __name__=='__main__':
 method,path=sys.argv[1:3];payload=json.loads(sys.argv[3]) if len(sys.argv)>3 else None
 code,result=request(method,path,payload)
 # Allowlisted output: no token or credential fields.
 keys=['login','name','full_name','html_url','clone_url','default_branch','status','build_type','source','message','errors','url','id','private','permissions']
 print(json.dumps({'http_status':code,**{k:result[k] for k in keys if k in result}},ensure_ascii=False,indent=2))
 if code>=400:sys.exit(1)
