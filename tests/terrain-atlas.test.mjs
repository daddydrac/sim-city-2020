import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,makeTerrain,nextTerrainSeed} from '../dist/terrain.mjs';
import {terrainSurvey,terrainSignature} from '../dist/terrain-style.mjs';
import {waterMeshFor} from '../dist/terrain-water.mjs';
import {createRegion,serialize,deserialize,disaster} from '../dist/engine.mjs';

test('automatic seeds stay in the supported range and never repeat the current seed',()=>{
 for(const v of [0,Number.EPSILON,.1,.5,.999999999,1]){const n=nextTerrainSeed(2020,()=>v);assert(Number.isInteger(n)&&n>=1&&n<=2147483647);assert.notEqual(nextTerrainSeed(n,()=>v),n);}
 let previous=2020;for(let i=0;i<2000;i++){const n=nextTerrainSeed(previous);assert(Number.isInteger(n)&&n>=1&&n<=2147483647&&n!==previous);previous=n;}
});
test('twelve landforms vary actual shorelines with the seed and reproduce exactly',()=>{
 assert.equal(PRESETS.length,12);for(const p of PRESETS){const a=makeTerrain(p.id,{seed:918726}),b=makeTerrain(p.id,{seed:218983}),again=makeTerrain(p.id,{seed:918726});assert.equal(terrainSignature(a),terrainSignature(again));assert.notEqual(terrainSignature(a),terrainSignature(b));const changed=a.tiles.filter((t,i)=>t.terrain!==b.tiles[i].terrain).length;assert(changed>a.tiles.length*.005,p.id+' coastline did not vary');}
});
test('generation extremes produce finite, editable maps with water and dry land',()=>{
 for(const p of PRESETS)for(const seed of [1,2147483647]){const c=makeTerrain(p.id,{seed,terrainConfig:{relief:1.8,water:1.5,forest:1.8}});assert(c.tiles.every(t=>Number.isFinite(t.elevation)&&t.elevation>=0&&t.elevation<=500));const s=terrainSurvey(c);assert(s.waterPercent>0&&s.waterPercent<95,p.id);assert(s.gentlePercent>0,p.id);assert(Number.isFinite(s.maxElevation));}
});
test('relief, water and forest settings change their intended terrain measurements',()=>{
 const seed=832139,p='estuary',base=makeTerrain(p,{seed}),high=makeTerrain(p,{seed,terrainConfig:{relief:1.8}}),wet=makeTerrain(p,{seed,terrainConfig:{water:1.5}}),dry=makeTerrain(p,{seed,terrainConfig:{water:.5}}),bare=makeTerrain(p,{seed,terrainConfig:{forest:0}});
 assert(terrainSurvey(high).maxElevation>terrainSurvey(base).maxElevation*1.7);assert(terrainSurvey(wet).waterPercent>terrainSurvey(dry).waterPercent);assert(terrainSurvey(base).forestPercent>0);assert.equal(terrainSurvey(bare).forestPercent,0);
});
test('terrain edits invalidate the survey and water mesh stays finite inside map bounds',()=>{
 const c=createRegion('alpine',{starter:false}),old=terrainSurvey(c);c.tiles[9000].elevation=450;c.terrainRevision++;assert.notEqual(terrainSurvey(c),old);const mesh=waterMeshFor(c),p=mesh.attributes.positions.value;assert(p.length>0&&p.length%9===0);for(let i=0;i<p.length;i+=3){assert(Number.isFinite(p[i])&&Math.abs(p[i])<=c.width*c.cellSize/2);assert(Number.isFinite(p[i+1])&&Math.abs(p[i+1])<=c.height*c.cellSize/2);assert(Math.abs(p[i+2]-.42)<1e-5);}
});
test('save/load preserves generated terrain, configuration, forest and stable map seed',()=>{
 const c=createRegion('fjord',{seed:2134567,terrainConfig:{relief:1.35,water:.8,forest:1.5}}),sig=terrainSignature(c),s=terrainSurvey(c),seed=c.seed;disaster(c);assert.equal(c.seed,seed);assert(Number.isInteger(c.randomState));const saved=serialize(c),d=deserialize(saved);assert.equal(d.seed,seed);assert.equal(d.randomState,c.randomState);assert.equal(terrainSignature(d),sig);assert.deepEqual(d.terrainConfig,c.terrainConfig);assert.equal(terrainSurvey(d).forestPercent,s.forestPercent);assert.equal(serialize(d),saved);
});
test('invalid seeds and imported terrain settings are rejected before rendering',()=>{
 for(const seed of [0,-1,1.2,NaN,2147483648])assert.throws(()=>makeTerrain('estuary',{seed}),/seed/);
 const c=JSON.parse(serialize(createRegion()));c.terrainConfig.forest=Infinity;assert.throws(()=>deserialize(JSON.stringify(c)),/terrain settings/);
});
