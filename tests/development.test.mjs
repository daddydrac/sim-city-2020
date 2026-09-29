import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,build,index,tick,analyze,serialize,deserialize} from '../dist/engine.mjs';
import {growthStatus,advanceDevelopment,MAX_PHASE} from '../dist/development.mjs';
import {MILESTONES,eligiblePhase,unlockProgression,calendarYear,advanceClock,YEAR_MS,MONTH_MS} from '../dist/progression.mjs';
import {parcelCapacity} from '../dist/population.mjs';

function neighborhood(){
 const c=createCity(false);c.cash=1e7;for(const k of Object.keys(c.finance.rates))c.finance.rates[k]=4;
 for(let x=26;x<32;x++)for(const tool of ['road','wire','pipe'])assert(build(c,index(x,16),tool).ok);
 assert(build(c,index(27,15),'power').ok);assert(build(c,index(28,15),'pump').ok);
 for(const [x,type]of [[28,'residential'],[29,'commercial'],[30,'industrial']])assert(build(c,index(x,17),type).ok);
 return c;
}
test('new campaigns start empty in 1900; residents fill phase-one homes without a progression deadlock',()=>{
 const c=neighborhood(),t=c.tiles[index(28,17)];assert.equal(calendarYear(c),1900);assert.equal(c.metrics.population,0);assert.equal(t.level,1);
 assert(growthStatus(c,t).blocked.some(s=>s.includes('500 residents and year 1905')));
 for(let i=0;i<24;i++)tick(c);
 assert(c.metrics.population>0);assert(c.metrics.population<=parcelCapacity(t).homes);assert.equal(t.level,1);assert.equal(c.progression.phase,1);
});
test('one year takes exactly 480,000 active milliseconds; pause, background, speed and partial saves work',()=>{
 const c=neighborhood();advanceClock(c,YEAR_MS-1,{onMonth:tick});assert.equal(c.month,11);assert.equal(calendarYear(c),1900);
 const saved=deserialize(serialize(c));advanceClock(saved,1,{onMonth:tick});assert.equal(saved.month,12);assert.equal(calendarYear(saved),1901);
 const before=serialize(saved);advanceClock(saved,YEAR_MS,{playing:false,onMonth:tick});advanceClock(saved,YEAR_MS,{visible:false,onMonth:tick});assert.equal(serialize(saved),before);
 advanceClock(saved,MONTH_MS/6,{speed:6,onMonth:tick});assert.equal(saved.month,13);assert.equal(saved.calendar.monthProgress,0);
});
test('every milestone requires both thresholds, including strictly after 2070 for phase ten',()=>{
 for(const g of MILESTONES.slice(1)){
  assert.equal(eligiblePhase(g.year,g.population),g.phase);
  assert(eligiblePhase(g.year-1,10000000)<g.phase);
  assert(eligiblePhase(2200,g.population-1)<g.phase);
 }
 assert.equal(eligiblePhase(2070,500000),9);assert.equal(eligiblePhase(2071,499999),9);assert.equal(eligiblePhase(2071,500000),10);
 const c=createCity(false);c.month=(2071-1900)*12;c.metrics.population=500000;assert(unlockProgression(c));assert.equal(c.progression.phase,10);c.metrics.population=0;unlockProgression(c);assert.equal(c.progression.phase,10);
});
test('unlocked local development takes supplied months, with no skipped phases; disruption resets progress',()=>{
 const c=neighborhood(),t=c.tiles[index(28,17)];c.progression.phase=2;
 tick(c);tick(c);assert.equal(t.level,1);assert.equal(t.growthMonths,2);
 c.operations.water=0;tick(c);assert.equal(t.growthMonths,0);assert(growthStatus(c,t).blocked.includes('Provide water'));
 c.operations.water=100;tick(c);tick(c);assert.equal(t.level,1);tick(c);assert.equal(t.level,2);
 for(let i=0;i<20;i++)tick(c);assert.equal(t.level,2);
 // Even a malformed in-memory progress counter cannot bypass the city-era lock.
 t.growthMonths=120;advanceDevelopment(c,t);assert.equal(t.level,2);
});
test('zone and infrastructure evolution cap at ten, improve capacity, and resume deterministically',()=>{
 const c=neighborhood(),initial=c.metrics.powerCapacity;c.progression.phase=10;c.month=(2071-1900)*12;
 const targets=[28,29,30].map(x=>c.tiles[index(x,17)]),seen=targets.map(()=>new Set([1]));
 for(let i=0;i<180;i++){tick(c);targets.forEach((t,j)=>seen[j].add(t.level));}
 for(let j=0;j<targets.length;j++){assert.equal(targets[j].level,MAX_PHASE);assert.deepEqual([...seen[j]],[1,2,3,4,5,6,7,8,9,10]);}
 assert.equal(c.tiles[index(27,15)].level,10);assert(c.metrics.powerCapacity>initial);assert.equal(c.tiles[index(30,16)].networkLevels.wire,10);
 const restored=deserialize(serialize(c));assert.deepEqual(restored.metrics,c.metrics);tick(c);tick(restored);assert.equal(serialize(restored),serialize(c));
});
test('lower effective taxes attract faster growth; excessive taxes cause actual departures',()=>{
 const low=neighborhood(),high=deserialize(serialize(low));for(const key of Object.keys(high.finance.rates))high.finance.rates[key]=16;
 for(let i=0;i<30;i++){tick(low);tick(high);}assert(low.metrics.population>high.metrics.population);
 const before=low.metrics.population;low.finance.rates.residential=25;for(let i=0;i<12;i++)tick(low);assert(low.metrics.population<before);
 const cut=neighborhood();for(let i=0;i<20;i++)tick(cut);const occupied=cut.metrics.population;cut.operations.water=0;for(let i=0;i<10;i++)tick(cut);assert(cut.metrics.population<occupied);
});
test('legacy saves preserve dates, all occupied building categories, and earned phases',()=>{
 const c=createCity(false);let id=32*12+12;for(const type of ['residential','arcology','mixeduse','commercial','industrial','skyscraper','mall','stripmall','hotel','casino','bank']){Object.assign(c.tiles[id++],{type,level:2,age:6});}
 const old=JSON.parse(serialize(c));delete old.simulationVersion;delete old.calendar;delete old.progression;old.month=36;
 const migrated=deserialize(JSON.stringify(old));assert.equal(calendarYear(migrated),2023);assert.equal(migrated.progression.phase,2);
 assert.equal(migrated.metrics.population,48+220+100);assert.equal(migrated.metrics.jobs,26+36+140+90+35+70+100+80+30);
 const bad=JSON.parse(serialize(migrated));bad.tiles[0].networkLevels.wire=11;assert.throws(()=>deserialize(JSON.stringify(bad)),/development/);
});
test('an unfunded or disconnected network does not upgrade',()=>{
 const c=createCity(false),id=index(20,20);c.progression.phase=10;build(c,id,'wire');for(let i=0;i<12;i++)tick(c);assert.equal(c.tiles[id].networkLevels.wire,1);
 const supplied=neighborhood();supplied.progression.phase=10;supplied.operations.maintenance=0;analyze(supplied);for(let i=0;i<12;i++)tick(supplied);assert.equal(supplied.tiles[index(27,15)].level,1);
});
test('default region and optional starter both obey the empty 1900 campaign contract',async()=>{
 const {createRegion}=await import('../dist/engine.mjs');for(const starter of [false,true]){const c=createRegion('estuary',{starter});assert.equal(c.metrics.population,0);assert.equal(calendarYear(c),1900);assert.equal(c.month,0);assert.equal(c.progression.phase,1);assert(c.tiles.every(t=>t.level<=1));assert.equal(c.width*c.cellSize,16384);assert.equal(c.height*c.cellSize,12288);}
});
test('fire on a mature occupied building remains immediately saveable',async()=>{
 const {disaster}=await import('../dist/engine.mjs');const c=neighborhood(),t=c.tiles[index(28,17)];t.level=10;t.residents=4000;analyze(c);for(let i=0;i<3;i++)disaster(c);assert.doesNotThrow(()=>deserialize(serialize(c)));
});
