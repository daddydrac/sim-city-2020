import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../dist');
const args=process.argv.slice(2); const port=Number(args[args.indexOf('--port')+1])||Number(process.env.PORT)||4173;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname); if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);return res.end();}if((await stat(path)).isDirectory())path=resolve(path,'index.html');const body=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'0.0.0.0',()=>console.log('City preview ready on '+port));
