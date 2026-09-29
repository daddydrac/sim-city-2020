import {siteTiles} from './sites.mjs';
import {adjacent as gridAdjacent} from './grid.mjs';
import {capacityFactor,networkLevel,occupiedLevel} from './development.mjs';
import {climate} from './climate.mjs';
export const OPERATIONS={thermal:100,hydrogen:100,solar:100,hydro:65,water:100,maintenance:100,transit:100};
export const OP_LABELS={thermal:'Thermal generation',hydrogen:'Hydrogen fuel delivery',solar:'Solar dispatch',hydro:'Reservoir release',water:'Pump delivery',maintenance:'Network maintenance',transit:'Transit frequency'};
function connectedFrom(seeds,predicate,city){const visited=new Set(seeds),queue=[...seeds];for(let p=0;p<queue.length;p++)for(const i of gridAdjacent(queue[p],city))if(!visited.has(i)&&predicate(i)){visited.add(i);queue.push(i);}return visited;}
export function utilityNetworks(city,roadNetwork){
 const t=city.tiles,e=climate(city),o={...OPERATIONS,...city.operations},at=i=>[...new Set(siteTiles(city,t[i]).flatMap(j=>[j,...gridAdjacent(j,city)]))];
 const road=i=>at(i).some(j=>roadNetwork.has(j));
 const stockCapacity=t.filter(a=>['dam','reservoir'].includes(a.type)).reduce((v,a)=>v+50000*capacityFactor(a.level),0);
 city.storage=Math.max(0,Math.min(stockCapacity,city.storage||0));
 const solarFactor=e.night?0:Math.max(0,e.sunHeight)*(['rain','hail','snow'].includes(e.weather)?.3:1);
 const maintenance=.65+.35*o.maintenance/100;
 const potential={power:16000*o.thermal/100,solar:4500*solarFactor*o.solar/100,hydrogen:8500*o.hydrogen/100,dam:10000*o.hydro/100*(city.storage>0?1:0)};
 const generators=t.filter(a=>Object.hasOwn(potential,a.type)&&road(a.id)&&!a.burning&&potential[a.type]>0);
 const liveWire=connectedFrom(generators.flatMap(a=>at(a.id).filter(i=>t[i].wire)),i=>t[i].wire,city);
 const connectedGenerators=generators.filter(a=>at(a.id).some(i=>liveWire.has(i)));
 const gross=connectedGenerators.reduce((v,a)=>v+potential[a.type]*maintenance*capacityFactor(a.level),0);
 const wireCount=t.filter(a=>a.wire).length,pipeCount=t.filter(a=>a.pipe).length;
 const gridLoss=Math.min(25,t.reduce((v,a)=>v+(a.wire?.006/capacityFactor(networkLevel(a,'wire')):0),0)+Math.max(0,100-o.maintenance)*.13),waterLoss=Math.min(35,t.reduce((v,a)=>v+(a.pipe?.008/capacityFactor(networkLevel(a,'pipe')):0),0)+Math.max(0,100-o.maintenance)*.2);
 const pumps=t.filter(a=>['pump','dam','reservoir'].includes(a.type)&&road(a.id)&&at(a.id).some(i=>liveWire.has(i))&&!a.burning&&(a.type==='pump'||city.storage>0));
 const wet=connectedFrom(pumps.flatMap(a=>at(a.id).filter(i=>t[i].pipe)),i=>t[i].pipe,city);
 const waterGross=pumps.reduce((v,a)=>v+(a.type==='pump'?15000:Math.min(city.storage,8000*o.hydro/100))*capacityFactor(a.level),0)*o.water/100*maintenance;
 const drainage=connectedFrom(t.filter(a=>a.type==='pump'||a.type==='reservoir').flatMap(a=>at(a.id).filter(i=>t[i].drain)),i=>t[i].drain,city);
 const demand=t.reduce((v,a)=>v+(['residential','commercial','industrial','arcology','skyscraper'].includes(a.type)?Math.ceil(Math.max(12,occupiedLevel(a)*20)*e.powerFactor):0),0);
 const waterDemand=t.reduce((v,a)=>v+(['residential','commercial','industrial','arcology','skyscraper'].includes(a.type)?Math.max(12,occupiedLevel(a)*18):0),0);
 const emissions=Math.round(connectedGenerators.reduce((v,a)=>v+(a.type==='power'?potential.power*.08:a.type==='hydrogen'?potential.hydrogen*.012:0)*capacityFactor(a.level),0));
 const operatingCost=Math.round(t.reduce((v,a)=>v+(a.type==='power'?360*(.3+.7*o.thermal/100):a.type==='solar'?55:a.type==='hydrogen'?500*(.2+.8*o.hydrogen/100):a.type==='dam'?140:a.type==='reservoir'?75:a.type==='pump'?100*(.3+.7*o.water/100):0)*capacityFactor(a.level),0)+(wireCount*.45+pipeCount*.4)*(o.maintenance/100));
 for(const a of t){a.wireLive=liveWire.has(a.id);a.pipeLive=wet.has(a.id);a.drainLive=drainage.has(a.id);a.cableLoad=gross?Math.min(100,demand/(gross*(1-gridLoss/100))*100):0;}
 return {liveWire,wet,powerCapacity:Math.floor(gross*(1-gridLoss/100)),waterCapacity:Math.floor(waterGross*(1-waterLoss/100)),gross:Math.round(gross),demand,waterDemand,gridLoss,waterLoss,stockCapacity,emissions,operatingCost,drainage:drainage.size,disconnectedCables:wireCount-liveWire.size,disconnectedPipes:pipeCount-wet.size};
}
