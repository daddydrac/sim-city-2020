import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';
import {createCity,tick,serialize,deserialize} from '../dist/engine.mjs';
async function start(data){const child=spawn('python',['server/server.py'],{cwd:new URL('..',import.meta.url),env:{...process.env,CITY_DATA:data,CITY_HOST:'127.0.0.1',PORT:'0',PYTHONDONTWRITEBYTECODE:'1'},stdio:['ignore','pipe','pipe']});let logs='';const url=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server did not start: '+logs)),10000);child.stderr.on('data',d=>logs+=d);child.once('error',reject);child.once('exit',code=>{clearTimeout(timeout);reject(Error('Server exited '+code+': '+logs));});child.stdout.on('data',d=>{const match=d.toString().match(/http:\/\/localhost:(\d+)/);if(match){clearTimeout(timeout);resolve('http://127.0.0.1:'+match[1]);}});});return {child,url};}
async function stop(child){if(child.exitCode!==null)return;child.kill();await once(child,'exit');}
test('real SQLite service persists two independent campaigns across restart and serves bundled modules',async()=>{
 const data=await mkdtemp(join(tmpdir(),'sc20-save-test-'));let instance;
 try{instance=await start(data);const city=createCity();for(let i=0;i<12;i++)tick(city);city.calendar.monthProgress=12345;const save=JSON.parse(serialize(city));
 const post=async body=>fetch(instance.url+'/api/games',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const a=await post({name:'First city',save,population:city.metrics.population});assert.equal(a.status,201);const id=(await a.json()).id;
 const other=createCity(false);const b=await post({name:'Second city',save:JSON.parse(serialize(other)),population:0});assert.equal(b.status,201);
 assert.equal((await post({save:null})).status,400);assert.equal((await fetch(instance.url+'/gallery.html')).status,200);assert.match((await fetch(instance.url+'/progression.mjs')).headers.get('content-type'),/javascript/);
 await stop(instance.child);instance=await start(data);const list=await (await fetch(instance.url+'/api/games')).json();assert.equal(list.length,2);
 const restored=deserialize(JSON.stringify(await (await fetch(instance.url+'/api/games/'+id)).json()));assert.equal(restored.month,12);assert.equal(restored.calendar.startYear,1900);assert.equal(restored.calendar.monthProgress,12345);assert.equal(restored.metrics.population,city.metrics.population);
 tick(city);tick(restored);assert.equal(serialize(restored),serialize(city));
 assert.equal((await fetch(instance.url+'/data/cities.sqlite3')).status,404);
 }finally{if(instance)await stop(instance.child);await rm(data,{recursive:true,force:true});}
});
