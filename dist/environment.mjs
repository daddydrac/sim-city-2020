import {dimensions,influence} from './grid.mjs';
import {capacityFactor,occupiedLevel} from './development.mjs';
import {climate} from './climate.mjs';
export const DESIGN={trees:20,greenRoofs:0,coolSurfaces:0,electricMobility:0,lowCarbonMaterials:0};
export const DESIGN_LABELS={trees:'Street tree program',greenRoofs:'Green roof coverage',coolSurfaces:'Reflective surfaces',electricMobility:'Electric vehicle share',lowCarbonMaterials:'Low-carbon materials'};
// Explicit game assumptions, not a calibrated emissions inventory or CFD solver.
export const FACTORS={vehicleKgPerKm:.18,vehicleKmPerPersonDay:20,flightTonnes:3,treeTonnesPerYear:.021,concreteTonnesCO2PerTonne:.13,dieselKgPerLitre:2.68};
const masses={parking:140,garage:1700,residential:180,commercial:280,industrial:350,road:65,bridge:350,arcology:6500,skyscraper:8000,dam:16000,reservoir:2200,spaceport:1300,airport:4500,landmark:400,hydrogen:600,power:1200,solar:160,port:1300};
export function recordConstruction(city,tool,scale=1){const design={...DESIGN,...city.design};const tonnes=((masses[tool]||15)*FACTORS.concreteTonnesCO2PerTonne*(1-design.lowCarbonMaterials*.005)+(tool==='raise'||tool==='lower'||tool==='reclaim'?100:30)*FACTORS.dieselKgPerLitre/1000)*scale;city.embodiedCarbon=(city.embodiedCarbon||0)+tonnes;city.recentConstruction=(city.recentConstruction||0)+tonnes;}
export function environmentModel(city){
 const e=climate(city),d={...DESIGN,...city.design},tiles=city.tiles,{width,height}=dimensions(city),base={winter:2,spring:17,summer:31,autumn:18}[e.season]-(e.night?7:0)-(['rain','snow','hail'].includes(e.weather)?3:0);
 const irradiance=e.night?0:900*Math.max(0,e.sunHeight)*(['rain','snow','hail'].includes(e.weather)?.28:1),windMs=e.wind/3.6,sigma=5.670374419e-8;
 const canopy=tiles.filter(t=>['park','forest','wetland','arcology'].includes(t.type));let totalTrees=canopy.reduce((v,t)=>v+(t.type==='forest'?48:18)*capacityFactor(t.level),0)+tiles.filter(t=>t.type==='road').length*d.trees*.08;
 const shadeField=influence(city,canopy,3,()=>.07);
 let maxSurface=-Infinity,sumAir=0,sumSurface=0,landCount=0,impervious=0;
 for(const t of tiles){const water=t.terrain==='water'||t.type==='reservoir',green=['park','forest','wetland'].includes(t.type),built=t.type!=='empty'&&!green&&!water;
  const neighborShade=shadeField[t.id];const roof=built?d.greenRoofs/100:0,shade=Math.min(.75,neighborShade+d.trees*.0035+(green?.45:0));
  const albedo=e.weather==='snow'?.7:water?.08:green?.22:built?.14+.42*d.coolSurfaces/100:.25;
  const evap=water?140:green?160:30+roof*120;
  const absorbed=(1-albedo)*irradiance*(1-shade),waste=built?18+(t.type==='industrial'?45:0):0;
  const convection=8+3*Math.sqrt(windMs),radiation=4*.95*sigma*(base+273.15)**3;
  const equilibrium=base+(absorbed+waste-(e.night?0:evap))/(convection+radiation);
  t.surfaceTemp=+Math.max(base-5,Math.min(base+42,equilibrium)).toFixed(1);
  t.airTemp=base+Math.max(0,t.surfaceTemp-base)*(water?.035:built?.17:.09)-shade*1.5;
  t.runoff=water?0:green?.12:built?Math.max(.2,.92-roof*.4-d.trees*.0015):.25;
  if(!water){landCount++;impervious+=built?1-roof*.3:0;}
 }
 // Three bounded neighbor-mixing passes: a visualization approximation of ventilation.
 let air=Float32Array.from(tiles,t=>t.airTemp),next=new Float32Array(tiles.length);
 for(let pass=0;pass<3;pass++){for(let id=0;id<tiles.length;id++){const x=id%width,y=Math.floor(id/width);let sum=0,count=0;if(x>0){sum+=air[id-1];count++;}if(x<width-1){sum+=air[id+1];count++;}if(y>0){sum+=air[id-width];count++;}if(y<height-1){sum+=air[id+width];count++;}next[id]=air[id]*.75+(sum/count)*.25;}[air,next]=[next,air];}
 tiles.forEach((t,id)=>t.airTemp=air[id]);
 for(const t of tiles){t.airTemp=+t.airTemp.toFixed(1);sumAir+=t.airTemp;sumSurface+=t.surfaceTemp;maxSurface=Math.max(maxSurface,t.surfaceTemp);}
 const m=city.metrics||{},population=m.population||0,transit=Math.min(.7,(city.operations?.transit||0)*.0015+(m.activeMetro||0)*.025+(m.activeElevated||0)*.03);
 const cars=population*FACTORS.vehicleKmPerPersonDay*30*(1-transit)*(1-d.electricMobility/100)*FACTORS.vehicleKgPerKm/1000;
 const electricity=(m.network?.emissions||0)*.7+population*d.electricMobility/100*.004;
 const aircraft=tiles.filter(t=>t.type==='airport').reduce((v,t)=>v+60*FACTORS.flightTonnes*capacityFactor(t.level),0);
 const industry=tiles.filter(t=>t.type==='industrial').reduce((v,t)=>v+occupiedLevel(t)*1.4,0);
 const shipping=tiles.filter(t=>t.type==='port').reduce((v,t)=>v+45*capacityFactor(t.level),0),launches=city.recentLaunchCarbon||0;
 const construction=city.recentConstruction||0,removal=totalTrees*FACTORS.treeTonnesPerYear/12,operational=electricity+cars+aircraft+industry+shipping;
 const meanAir=sumAir/tiles.length,heatIsland=meanAir-base;
 const runoff=tiles.reduce((v,t)=>v+t.runoff,0)/tiles.length;
 const retrofitCost=Math.round(population*(d.trees*.001+d.greenRoofs*.0018+d.coolSurfaces*.0008+d.electricMobility*.0005));
 const stats={baseAir:base,meanAir:+meanAir.toFixed(1),meanSurface:+(sumSurface/tiles.length).toFixed(1),peakSurface:+maxSurface.toFixed(1),heatIsland:+heatIsland.toFixed(2),irradiance,windMs:+windMs.toFixed(1),trees:Math.round(totalTrees),imperviousPercent:Math.round(impervious/Math.max(1,landCount)*100),runoffPercent:Math.round(runoff*100),electricity,cars,aircraft,industry,shipping,launches,construction,removal,operational,netCarbon:operational+construction+launches-removal,embodiedCarbon:city.embodiedCarbon||0,cumulativeCarbon:(city.embodiedCarbon||0)+(city.cumulativeOperational||0)+(city.launchCarbonTotal||0),retrofitCost};
 for(const t of tiles)t.carbon=t.taxRevenue?operational*t.taxRevenue/Math.max(1,m.income):0;
 return stats;
}
