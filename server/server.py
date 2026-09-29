"""Local single-player save service; SQLite is never served as a static file."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json,sqlite3,os,uuid,time
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
DATA=Path(os.environ.get('CITY_DATA',ROOT/'data')); DATA.mkdir(parents=True,exist_ok=True)
DB=DATA/'cities.sqlite3'
def connect():
 c=sqlite3.connect(DB,timeout=10);c.row_factory=sqlite3.Row;return c
with connect() as c:
 c.execute('PRAGMA journal_mode=WAL')
 c.execute('CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY,name TEXT NOT NULL,month INTEGER NOT NULL,population INTEGER NOT NULL,updated INTEGER NOT NULL,save TEXT NOT NULL)')
 c.execute('PRAGMA user_version=1')
class Handler(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.glb':'model/gltf-binary'}
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT/'dist'),**kw)
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-cache');super().end_headers()
 def reply(self,status,value):
  body=json.dumps(value).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_GET(self):
  path=urlparse(self.path).path
  if path=='/api/games':
   with connect() as c:rows=c.execute('SELECT id,name,month,population,updated FROM games ORDER BY updated DESC').fetchall()
   return self.reply(200,[dict(r) for r in rows])
  if path.startswith('/api/games/'):
   with connect() as c:r=c.execute('SELECT save FROM games WHERE id=?',(path.split('/')[-1],)).fetchone()
   return self.reply(200,json.loads(r['save'])) if r else self.reply(404,{'error':'Save not found'})
  if path.startswith('/api/'):return self.reply(404,{'error':'Unknown endpoint'})
  return super().do_GET()
 def do_POST(self):
  if self.path!='/api/games':return self.reply(404,{'error':'Unknown endpoint'})
  # Refuse cross-origin writes, including hostile pages targeting localhost.
  origin=self.headers.get('Origin')
  if origin and urlparse(origin).netloc!=self.headers.get('Host'):return self.reply(403,{'error':'Origin rejected'})
  if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.reply(415,{'error':'JSON required'})
  try:
   size=int(self.headers.get('Content-Length','0'))
   if not 0<size<=40000000:return self.reply(413,{'error':'Save exceeds 40 MB'})
   value=json.loads(self.rfile.read(size));save=value['save']
   if not isinstance(save,dict):raise ValueError('Invalid save format')
   name=value.get('name',save.get('name','New city'))
   if not isinstance(name,str) or not name.strip() or len(name)>80:raise ValueError('Use a name of 1–80 characters')
   if not isinstance(save,dict) or save.get('version') not in (1,2,3) or not isinstance(save.get('tiles'),list):raise ValueError('Invalid save format')
   if not isinstance(save.get('month'),int) or save['month']<0:raise ValueError('Invalid month')
   ident=str(uuid.uuid4());now=time.time_ns()//1000000
   with connect() as c:c.execute('INSERT INTO games VALUES(?,?,?,?,?,?)',(ident,name.strip(),save['month'],max(0,int(value.get('population',0))),now,json.dumps(save,allow_nan=False)))
   self.reply(201,{'id':ident,'name':name.strip(),'updated':now})
  except (ValueError,TypeError,KeyError) as e:self.reply(400,{'error':str(e)})
if __name__=='__main__':
 server=ThreadingHTTPServer((os.environ.get('CITY_HOST','127.0.0.1'),int(os.environ.get('PORT','8080'))),Handler)
 print('Sim City 2020 v0.5.0: http://localhost:'+str(server.server_address[1]),flush=True)
 server.serve_forever()
