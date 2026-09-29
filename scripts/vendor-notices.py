from pathlib import Path
import urllib.request, hashlib, json, concurrent.futures
root=Path(__file__).resolve().parents[1]
packages={'react':'18.2.0','react-dom':'18.2.0','redux':'4.2.1','react-redux':'8.1.3','react-is':'18.2.0','styled-components':'6.1.8','maplibre-gl':'3.6.2','kepler.gl':'3.1.0','deck.gl':'8.9.36','@luma.gl/core':'8.5.21','@loaders.gl/i3s':'3.4.15'}
def fetch(item):
 name,version=item
 for file in ['LICENSE','LICENSE.md','LICENSE.txt']:
  url=f'https://unpkg.com/{name}@{version}/{file}'
  try:
   content=urllib.request.urlopen(url,timeout=25).read()
   path=root/'dist/vendor/licenses'/f'{name.replace("/","_").replace("@","")}-{version}.txt'
   path.write_bytes(content)
   return {'package':name,'version':version,'licenseSource':url}
  except Exception:pass
 return {'package':name,'version':version,'error':'No license fetched'}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 result=list(pool.map(fetch,packages.items()))
# Retain license files from the exact transitive packages used for local bundles.
for package in (root/'node_modules').rglob('package.json'):
 if 'node_modules' not in package.parts:continue
 try:meta=json.loads(package.read_text())
 except Exception:continue
 for filename in ['LICENSE','LICENSE.md','LICENSE.txt','license','license.md']:
  source=package.parent/filename
  if source.is_file():
   safe=(meta.get('name',package.parent.name)+'-'+str(meta.get('version','unknown'))).replace('/','_').replace('@','')
   (root/'dist/vendor/licenses'/f'{safe}.txt').write_bytes(source.read_bytes());break
manifest={'packages':result,'files':[{ 'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted((root/'dist/vendor').iterdir()) if p.is_file() and p.suffix in ['.js','.css']]}
(root/'dist/vendor/manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(result,indent=2))
