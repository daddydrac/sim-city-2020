import test from 'node:test';
import assert from 'node:assert/strict';
import {WebMercatorViewport} from './support/web-mercator.mjs';
import {createRegion,createCity,serialize,deserialize,analyze,TOOLS,build,index,tick} from '../dist/engine.mjs';
import {PRESETS,makeTerrain} from '../dist/terrain.mjs';
import {adjacent} from '../dist/grid.mjs';
import {beginStroke,extendStroke,gridLine} from '../dist/construction.mjs';
import {position,tileAt,terrainHeight,cursorParcel} from '../dist/geo.mjs';
import {launchState} from '../dist/launch.mjs';
import {captureAnalysis,metricValue,roadRoutes,analysisHistory} from '../dist/analytics.mjs';
import {importTerrain} from '../dist/terrain-import.mjs';

test('city-sized rectangular maps keep neighbors, sparse saves and utility coverage correct',()=>{
 const c=createRegion();assert.equal(c.tiles.length,49152);assert.equal(c.width*c.cellSize,16384);assert.equal(c.height*c.cellSize,12288);assert.equal(c.metrics.power,100);assert.equal(c.metrics.water,100);assert(!adjacent(255,c).includes(256));
 const far=c.tiles[index(250,180,c)];if(far.terrain==='water'){far.terrain='land';far.elevation=3;}assert(build(c,far.id,'garage').ok);const text=serialize(c);assert(text.length<700000);const roundtrip=deserialize(text);assert.equal(roundtrip.tiles[far.id].type,'garage');assert.equal(roundtrip.tiles[far.id].elevation,far.elevation);assert.equal(serialize(roundtrip),text);
});

test('terrain presets provide distinct water and elevation patterns',()=>{
 const signatures=new Set();for(const p of PRESETS){const c=makeTerrain(p.id),wet=c.tiles.filter(t=>t.terrain==='water').length;assert(wet>100);assert(wet<c.tiles.length-100);assert(Math.max(...c.tiles.map(t=>t.elevation))>5);signatures.add(c.tiles.filter((_,i)=>i%97===0).map(t=>t.elevation).join(','));}assert.equal(signatures.size,12);
});

test('a held stroke fills skipped cells, stays connected, deduplicates visits and charges once',()=>{
 const c=createCity(false),stroke=beginStroke(c,'pipe'),before=c.cash;extendStroke(stroke,index(10,10));extendStroke(stroke,index(18,17));extendStroke(stroke,index(10,10));extendStroke(stroke,index(10,10));const ids=[...stroke.visited];assert.equal(stroke.placed,ids.length);assert.equal(before-c.cash,ids.length*TOOLS.pipe.cost);assert(ids.every(i=>c.tiles[i].pipe));const line=gridLine({x:10,y:10},{x:18,y:17});for(let i=1;i<line.length;i++)assert.equal(Math.abs(line[i][0]-line[i-1][0])+Math.abs(line[i][1]-line[i-1][1]),1);
 const once=c.cash;extendStroke(stroke,null);extendStroke(stroke,index(22,22));assert.equal(c.cash,once-TOOLS.pipe.cost);assert.equal(c.tiles[index(21,21)].pipe,false);
});

test('one stroke snapshot restores construction, cash and terrain edits together',()=>{
 const c=createCity(false),save=serialize(c),s=beginStroke(c,'raise');extendStroke(s,index(20,20));extendStroke(s,index(25,20));extendStroke(s,index(20,20));assert.equal(c.tiles[index(20,20)].elevation,1);assert(c.terrainRevision>0);const restored=deserialize(save);assert.equal(serialize(restored),save);assert.equal(restored.tiles[index(20,20)].elevation,0);
});

test('cursor placement follows projected terrain at different angles, bearings and underground depths',()=>{
 const c=createRegion('highlands',{starter:false});
 // Controlled rolling slopes keep the target visible at every bearing. A hidden
 // valley correctly picks the foreground ridge, so it is not a round-trip target.
 for(const t of c.tiles)t.elevation=8+t.x*.03+t.y*.04+Math.sin(t.x*.1)*.1;
 const x=120.5,y=96.5,expected=index(120,96,c),center=position(x,y,0,c);
 for(const bearing of [-179,-90,0,90,179,359])for(const pitch of [0,40,65])for(const depth of [0,3,6,18,35,45]){const viewport=new WebMercatorViewport({width:1230,height:780,longitude:center[0],latitude:center[1],zoom:15.5,bearing,pitch});const world=position(x,y,terrainHeight(c,x,y)-depth,c),pixel=viewport.project(world);assert.equal(cursorParcel(viewport,pixel.slice(0,2),c,depth),expected,`bearing=${bearing}, pitch=${pitch}, depth=${depth}`);}
 assert.equal(tileAt(position(250.5,180.5,0,c),c),index(250,180,c));assert.equal(tileAt(position(-2,10,0,c),c),null);
});

test('parking lots and structures are buildable, productive, phased and distinguishable in saves',()=>{
 const c=createCity(),lot=c.tiles[index(10,17)],garage=c.tiles[index(21,13)];for(const t of [lot,garage]){t.type='empty';t.level=0;}assert(build(c,lot.id,'parking').ok);assert(build(c,garage.id,'garage').ok);assert.equal(lot.level,1);assert.equal(garage.level,1);assert(garage.parkingCapacity>lot.parkingCapacity);assert(lot.runoff>.5);assert(c.metrics.parkingCapacity>0);const copy=deserialize(serialize(c));assert.equal(copy.tiles[garage.id].type,'garage');
});

test('launch animation opens doors before ejection and unfolds arrays after separation',()=>{
 assert.equal(launchState(0).height,0);assert(launchState(12).height>0);assert.equal(launchState(16).door,0);assert.equal(launchState(20).door,100);assert.equal(launchState(20).separation,0);assert.equal(launchState(25).separation,65);assert.equal(launchState(25).unfold,0);assert.equal(launchState(31).unfold,90);assert.equal(launchState(39).active,false);
});

test('analytics snapshots retain old values while live data and road routes follow the city',()=>{
 const c=createCity();const resident=c.tiles.find(t=>t.type==='residential');resident.residents=12;analyze(c);captureAnalysis(c);const t=c.tiles.find(t=>t.population>0),before=metricValue(c,t,'population',0);t.population+=100;assert.equal(metricValue(c,t,'population'),before+100);assert.equal(metricValue(c,t,'population',0),before);const routes=roadRoutes(c).paths;assert(routes.length);for(const r of routes)for(const p of r.path){const id=tileAt(p,c);assert(['road','bridge','bus','subway','elevatedStation'].includes(c.tiles[id].type));}for(let i=0;i<15;i++){c.month++;captureAnalysis(c);}assert.equal(analysisHistory(c).length,12);
});

test('terrain import validates elevations and preserves water masks and georeferencing',()=>{
 const fields=['x','y','elevation_m','water'].map(name=>({name})),rows=[[0,0,0,1],[255,0,60,0],[0,191,120,0],[255,191,240,0]],c=importTerrain({fields,rows});assert.equal(c.tiles[0].terrain,'water');assert.equal(c.tiles.at(-1).elevation,40);assert.equal(c.tiles.length,49152);assert.throws(()=>importTerrain({fields,rows:[[0,0,-1,0],...rows.slice(1)]}),/Elevations/);assert.throws(()=>importTerrain({fields,rows:rows.map(r=>[500,...r.slice(1)])}),/span|coordinates/);
});
