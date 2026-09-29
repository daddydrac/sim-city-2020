import test from 'node:test';import assert from 'node:assert/strict';
import {assetModel} from '../dist/asset-models.mjs';import {ART_REGISTRY} from '../dist/art-registry.mjs';import {SITE_SIZES,siteTiles} from '../dist/sites.mjs';
import {createCity,build,analyze,index,serialize,deserialize,terraform,buildBridge} from '../dist/engine.mjs';
test('every catalogued asset has ten distinct geometry stages, three LODs, and stable site sockets',()=>{
 assert.equal(Object.keys(ART_REGISTRY).length,42);
 for(const type of Object.keys(ART_REGISTRY)){
  const [w,d]=(SITE_SIZES[type]||[1,1]).map(n=>n*64),signatures=new Set();let sockets;
  for(let phase=1;phase<=10;phase++){
   const model=assetModel(type,phase,{lotWidth:w,lotDepth:d});assert(model.parts.length+model.paths.length>0);assert.equal(model.stage,ART_REGISTRY[type].phases[phase-1]);signatures.add(JSON.stringify([model.parts,model.paths]));
   sockets??=model.sockets;assert.deepEqual(model.sockets,sockets);
   for(const part of model.parts){assert([...part.position,...part.scale,...part.rotation].every(Number.isFinite),type);assert(part.scale.every(n=>n>0),type);assert(Math.abs(part.position[0])+part.scale[0]<=w/2+.01,type+' width '+part.role);assert(Math.abs(part.position[1])+part.scale[1]<=d/2+.01,type+' depth '+part.role);}
   for(const lod of [1,2]){const lower=assetModel(type,phase,{lotWidth:w,lotDepth:d,lod});assert(lower.parts.length<=model.parts.length,type+' LOD budget');assert.deepEqual(lower.sockets,model.sockets);}
  }
  assert.equal(signatures.size,10,type+' distinct phases');
 }
});
test('night, snow, seasons and wheel animation change the production asset data',()=>{
 const day=assetModel('residential',6),night=assetModel('residential',6,{night:true}),off=assetModel('residential',6,{night:true,powered:false});
 assert(night.parts.some(p=>p.role==='recessed-window'&&p.material==='light'));assert(!off.parts.some(p=>p.material==='light'));assert.notDeepEqual(day.parts,night.parts);
 assert(assetModel('residential',6,{weather:'snow'}).parts.some(p=>p.role==='snow-cap'));assert.notDeepEqual(assetModel('park',6).parts,assetModel('park',6,{season:'autumn'}).parts);
 assert.notDeepEqual(assetModel('ferris',5,{time:0}).parts,assetModel('ferris',5,{time:5}).parts);
 assert(assetModel('residential',10).parts.some(p=>p.role==='forest-dome'));
});
test('multi-parcel facilities reserve, supply, serialize and demolish as one site',()=>{
 const c=createCity(false);c.cash=1e7;const id=index(20,20);for(const tool of ['road','wire','pipe'])build(c,index(23,20),tool);
 for(let x=24;x<32;x++)for(const tool of ['road','wire','pipe'])build(c,index(x,20),tool);
 build(c,index(25,19),'power');build(c,index(26,19),'pump');assert(build(c,id,'mall').ok);const t=c.tiles[id],ids=siteTiles(c,t);assert.equal(ids.length,6);assert(t.access);assert(t.powered);assert(t.watered);
 const child=ids.at(-1),cash=c.cash;assert.equal(build(c,child,'residential').ok,false);assert.equal(c.cash,cash);assert.equal(terraform(c,child,'raise').ok,false);
 const restored=deserialize(serialize(c));for(const i of ids)assert.equal(restored.tiles[i].siteRoot,id);
 assert(build(restored,child,'bulldoze').ok);assert.equal(restored.tiles[id].type,'empty');for(const i of ids)assert.equal(restored.tiles[i].siteRoot,undefined);
});
test('edge overflow, overlap, steep sites and invalid reservations cannot mutate a city',()=>{
 const c=createCity(false);c.cash=1e7;const before=serialize(c);assert.equal(build(c,index(30,20),'airport').ok,false);assert.equal(serialize(c),before);
 c.tiles[index(21,20)].elevation=4;assert.equal(build(c,index(20,20),'mall').ok,false);c.tiles[index(21,20)].elevation=0;
 assert(build(c,index(20,20),'mall').ok);assert.equal(buildBridge(c,index(18,21),index(25,21)).ok,false);
 const bad=JSON.parse(serialize(c));bad.tiles[index(21,20)].siteRoot=999;assert.throws(()=>deserialize(JSON.stringify(bad)),/reservation/);
});
