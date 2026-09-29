import {ART_REGISTRY} from './art-registry.mjs';
import {MILESTONES,calendarYear} from './progression.mjs';
export const MAX_PHASE=10;
export const ZONE_TYPES=['residential','commercial','industrial','arcology','skyscraper','mall','stripmall','mixeduse','hotel','casino','bank'];
export const NETWORK_TYPES=['pipe','wire','tunnel','drain','elevated'];
const green=['park','forest','wetland'];
const generators=['power','solar','hydrogen','dam'];
const phases={
 residential:['Foundation','Starter homes','Townhouses','Garden apartments','Urban apartments','Mid-rise residences','Terraced residences','Residential towers','Sky gardens','Vertical neighborhood'],
 commercial:['Foundation','Local shops','Shopping street','Business center','Office block','Corporate offices','Business tower','Financial tower','Skyline offices','Metropolitan center'],
 industrial:['Foundation','Workshop','Light factory','Production hall','Factory complex','Modernized works','Advanced factory','Automated works','Research industry','Industrial campus'],
 arcology:['Foundation','Garden pavilion','Planted terraces','Forest residences','Garden tower','Vertical woodland','Biodome residences','Forest district','Sky forest','Mature arcology'],
 skyscraper:['Foundation','Starter tower','Office tower','Stepped tower','Terraced tower','Sky lobby','Sky gardens','Skyline tower','Super tower','Metropolitan landmark']
};
const general=['Established','Expanded','Improved','Upgraded','Modernized','Advanced','Integrated','High capacity','Regional','Flagship'];
export const occupiedLevel=t=>ZONE_TYPES.includes(t.type)?Math.max(0,t.level-1):t.level;
export const capacityFactor=level=>1+Math.max(0,(level||1)-1)*.12;
export const networkLevel=(t,key)=>t[key]?t.networkLevels?.[key]||1:0;
export const phaseName=(t,key='surface')=>key==='surface'?(ART_REGISTRY[t.type]?.phases||phases[t.type]||general)[Math.max(0,(t.level||1)-1)]||'Flagship':general[networkLevel(t,key)-1]||'Not installed';

export function growthStatus(city,t,key='surface'){
 const network=key!=='surface',zone=ZONE_TYPES.includes(t.type),natural=green.includes(t.type);
 const phase=network?networkLevel(t,key):t.level;
 const months=(network?6:zone?3:natural?4:6)+Math.max(0,(phase||1)-1)*2;
 const progress=network?t.networkProgress?.[key]||0:t.growthMonths||0;
 const blocked=[];
 if(network?!t[key]:t.type==='empty')return {phase:0,months,progress:0,blocked:['Nothing placed'],ready:false,complete:false};
 if(phase>=(city.progression?.phase||1)&&phase<MAX_PHASE){const gate=MILESTONES[phase];blocked.push('City era '+(phase+1)+' requires '+gate.population.toLocaleString()+' residents and year '+gate.year);}
 if(t.burning)blocked.push('Fire damage');
 if(network){
  const connected=key==='wire'?t.wireLive:key==='pipe'?t.pipeLive:key==='drain'?t.drainLive:key==='tunnel'?t.metroLive:t.elevatedLive;
  if(!connected)blocked.push('Connect this network to an active source or two stations');
 }else{
  if(!natural&&!t.access)blocked.push('Connect a road to the map edge');
  if(!natural&&!generators.includes(t.type)&&!['road','bridge','pump'].includes(t.type)&&!t.powered)blocked.push('Provide power');
  if(t.type==='pump'&&!t.powered)blocked.push('Power the pump');
  if(zone||['school','hospital','police','fire','port','airport','spaceport','landmark'].includes(t.type))if(!t.watered)blocked.push('Provide water');
  if(zone){
   if(t.happiness<45)blocked.push('Improve happiness to 45%');
   const demand=t.type==='arcology'?'residential':['skyscraper','mall','stripmall','hotel','casino','bank'].includes(t.type)?'commercial':t.type==='mixeduse'?'residential':t.type;
   if((city.metrics?.demand[demand]||0)<=0)blocked.push('Increase '+demand+' demand');
  }
 }
 if(!zone&&!natural){
  if(city.cash<0)blocked.push('Restore a positive treasury');
  if(city.operations.maintenance<50)blocked.push('Set maintenance to at least 50%');
 }
 return {phase,months,progress,blocked,ready:!blocked.length,complete:phase>=MAX_PHASE};
}

export function advanceDevelopment(city,t,onGrowth=()=>{}){
 if(t.type!=='empty'){
  const status=growthStatus(city,t);
  t.growthMonths=status.ready&&!status.complete?status.progress+1:status.blocked.every(b=>b.startsWith('City era'))?status.progress:0;
  if(status.ready&&!status.complete&&t.growthMonths>=status.months){t.level=Math.min(MAX_PHASE,t.level+1);t.growthMonths=0;onGrowth(t.type);}
 }
 t.networkLevels??={};t.networkProgress??={};
 for(const key of NETWORK_TYPES){
  if(!t[key]){delete t.networkLevels[key];delete t.networkProgress[key];continue;}
  t.networkLevels[key]??=1;
  const status=growthStatus(city,t,key);
  t.networkProgress[key]=status.ready&&!status.complete?status.progress+1:status.blocked.every(b=>b.startsWith('City era'))?status.progress:0;
  if(status.ready&&!status.complete&&t.networkProgress[key]>=status.months){t.networkLevels[key]=Math.min(MAX_PHASE,t.networkLevels[key]+1);t.networkProgress[key]=0;onGrowth(key);}
 }
}

// All ten phases have different geometry. This also supplies the inspector.
export function buildingForm(t){
 const phase=Math.max(1,Math.min(MAX_PHASE,t.level||1));
 const heights={residential:[2,8,14,23,35,51,70,94,124,160],commercial:[2,10,19,33,51,76,108,148,198,260],industrial:[2,8,12,17,22,29,36,44,53,64]};
 return {phase,height:(heights[t.type]||[2,16,22,29,37,46,56,67,79,92])[phase-1],width:Math.min(22,12+phase)*(t.id%3===0?.85:1),tiers:Math.max(0,phase-4)};
}
