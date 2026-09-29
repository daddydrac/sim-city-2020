import {SITE_SIZES,inspectSite,reserveSite,clearSite,validateSites,siteTiles} from './sites.mjs';
import {normalizeUfoSettings} from './ufo.mjs';
import {START_YEAR,MONTH_MS,unlockProgression} from './progression.mjs';
import {parcelCapacity,advancePopulation} from './population.mjs';
import {applyEconomy,wearInfrastructure,normalizeFinance} from './economy.mjs';
import {dimensions,gridIndex,adjacent,eachNearby,influence} from './grid.mjs';
import {makeTerrain,decodeWater,waterRuns,REGION} from './terrain.mjs';
import {MAX_PHASE,ZONE_TYPES,NETWORK_TYPES,occupiedLevel,capacityFactor,advanceDevelopment,growthStatus,phaseName} from './development.mjs';
export {MAX_PHASE,growthStatus,phaseName};
import {environmentModel,recordConstruction,DESIGN} from './environment.mjs';
import {utilityNetworks,OPERATIONS} from './utilities.mjs';
import {climate,SEASONS,WEATHER} from './climate.mjs';
// Original, deterministic city simulation. No SimCity code or assets.
export const SIZE = 32;
export const TOOLS = {
  mall:{name:'Shopping mall',cost:9500,color:'#eab77a'},
  stripmall:{name:'Strip shopping center',cost:3200,color:'#d6b898'},
  mixeduse:{name:'Mixed-use residences',cost:8000,color:'#92cebb'},
  hotel:{name:'Hotel',cost:10000,color:'#d3bae3'},
  casino:{name:'Casino resort',cost:16000,color:'#eed088'},
  bank:{name:'Bank',cost:8000,color:'#b7c9d1'},
  ferris:{name:'Ferris wheel',cost:7500,color:'#f4cb93'},
  toll:{name:'Toll road',cost:900,color:'#edc976'},
  inspect: {name:'Inspect',cost:0,key:'V'},
  residential: {name:'Residential',cost:120,key:'R',color:'#54dea7'},
  commercial: {name:'Commercial',cost:180,key:'C',color:'#55bdff'},
  industrial: {name:'Industrial',cost:150,key:'I',color:'#f5ba5b'},
  road: {name:'Road',cost:45,key:'D',color:'#8b9ba9'},
  park: {name:'Park',cost:250,key:'G',color:'#2dba7d'},
  power: {name:'Power plant',cost:6500,key:'P',color:'#ffe88a'},
  pump: {name:'Water pump',cost:2400,key:'W',color:'#54d9e5'},
  pipe: {name:'Water pipe',cost:25,key:'U',color:'#54d9e5'},
  bus: {name:'Bus stop',cost:400,color:'#c5a0ff'},
  subway: {name:'Metro station',cost:1800,color:'#d994ee'},
  tunnel: {name:'Metro tunnel',cost:90,color:'#d994ee'},
  school: {name:'School',cost:2400,color:'#d7b9ff'},
  hospital: {name:'Hospital',cost:3200,color:'#f99cae'},
  police: {name:'Police station',cost:2400,color:'#a2b2ff'},
  fire: {name:'Fire station',cost:2400,color:'#ff856a'},
  arcology: {name:'Forest arcology',cost:14500,color:'#6de9bd'},
  skyscraper: {name:'Future tower',cost:12000,color:'#88cfea'},
  landmark: {name:'Sculptural landmark',cost:9000,color:'#e5eae1'},
  spaceport: {name:'Space launch pad',cost:24000,color:'#c8cff6'},
  port: {name:'Harbor',cost:7000,color:'#79bddc'},
  bridge: {name:'Custom bridge',cost:650,color:'#e5eae1'},
  reclaim: {name:'Reclaim land',cost:1500,color:'#cdb98e'},
  raise: {name:'Raise terrain',cost:350,color:'#96c582'},
  lower: {name:'Lower terrain',cost:350,color:'#84aacb'},
  solar: {name:'Solar farm',cost:4800,color:'#679fff'},
  hydrogen: {name:'Hydrogen fuel cells',cost:11000,color:'#acf0ec'},
  dam: {name:'Hydroelectric dam',cost:18500,color:'#c5d7dc'},
  reservoir: {name:'Reservoir',cost:6500,color:'#4dafd5'},
  wire: {name:'Power cable',cost:35,color:'#ffd978'},
  drain: {name:'Deep tunnel',cost:140,color:'#ee8c55'},
  elevated: {name:'Elevated rail',cost:220,color:'#b9a5ff'},
  elevatedStation: {name:'Elevated station',cost:2600,color:'#b9a5ff'},
  flatten: {name:'Level terrain',cost:450,color:'#96c582'},
  parking: {name:'Parking lot',cost:850,color:'#b6c4ce'},
  garage: {name:'Parking garage',cost:4800,color:'#b6c4ce'},
  airport: {name:'Airport',cost:22000,color:'#ccd8e6'},
  forest: {name:'Urban forest',cost:900,color:'#3dbb79'},
  wetland: {name:'Wetland',cost:1200,color:'#65ad91'},
  bulldoze: {name:'Bulldoze',cost:40,key:'B',color:'#ec7979'}
};
const ZONES=ZONE_TYPES;
const demandKey=t=>t==='arcology'?'residential':t==='skyscraper'?'commercial':t;
const CAP={residential:48,commercial:26,industrial:36,arcology:220,skyscraper:140,mall:90,stripmall:35,mixeduse:100,hotel:70,casino:100,bank:80};
const UPKEEP={road:2,park:8,power:320,pump:100,bus:16,subway:80,school:90,hospital:130,police:100,fire:90,elevatedStation:90,spaceport:260,port:120,landmark:70,arcology:50,skyscraper:25,bridge:7,airport:600,forest:15,wetland:18,parking:12,garage:45};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const index=gridIndex;
export const neighbors=adjacent;
const near=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function floodGrid(roots,pass,city){const seen=new Set(roots),q=[...roots];for(let k=0;k<q.length;k++)for(const n of neighbors(q[k],city))if(!seen.has(n)&&pass(n)){seen.add(n);q.push(n);}return seen;}
function blankTile(id,x,y,terrain={}){return {id,x,y,terrain:'land',type:'empty',level:0,pipe:false,wire:false,drain:false,elevated:false,tunnel:false,age:0,burning:0,elevation:0,growthMonths:0,networkLevels:{},networkProgress:{},...terrain};}
export function createRegion(preset='estuary',{starter=true,...options}={}){
 const map=makeTerrain(preset,options),city=createCity(false);
 Object.assign(city,{version:3,width:map.width,height:map.height,cellSize:map.cellSize,origin:map.origin,name:map.name,preset:map.preset,biome:map.biome,seed:map.seed,gateways:[],center:[Math.floor(map.width*.58),Math.floor(map.height*.45)],terrainRevision:0,terrainConfig:map.terrainConfig,terrainGenerator:map.terrainGenerator});
 city.tiles=map.tiles.map(t=>blankTile(t.id,t.x,t.y,t));
 if(starter)seedDistrict(city);
 analyze(city);city.history=[{month:0,population:city.metrics.population,cash:city.cash}];return city;
}
export function seedDistrict(city){
 const {width,height}=dimensions(city);let best=null;
 for(let y=24;y<height-24;y+=8)for(let x=24;x<width-24;x+=8){const t=city.tiles[gridIndex(x,y,city)];if(t.terrain==='water')continue;let water=0,low=Infinity,high=-Infinity;for(let dy=-12;dy<=12;dy+=6)for(let dx=-12;dx<=12;dx+=6){const p=city.tiles[gridIndex(x+dx,y+dy,city)];water+=p.terrain==='water'?1:0;low=Math.min(low,p.elevation);high=Math.max(high,p.elevation);}const score=water*80+(high-low)*2+Math.hypot(x-width*.58,y-height*.45)+t.elevation*.1;if(!best||score<best.score)best={x,y,score,elevation:t.elevation};}
 const cx=best?.x||Math.floor(width/2),cy=best?.y||Math.floor(height/2),ox=cx-17,oy=cy-17,level=best?.elevation||2;
 for(let y=oy+6;y<=oy+29;y++)for(let x=ox+7;x<=ox+31;x++){const t=city.tiles[gridIndex(x,y,city)];t.terrain='land';t.elevation=level;}
 const seed=createCity();for(const t of seed.tiles){if(t.type==='empty'&&!t.pipe&&!t.wire&&!t.tunnel)continue;const x=ox+t.x,y=oy+t.y;if(x<0||y<0||x>=width||y>=height)continue;const id=gridIndex(x,y,city);city.tiles[id]={...t,id,x,y,terrain:'land',elevation:level,networkLevels:{},networkProgress:{}};}
 city.center=[cx,cy];city.gateways=[gridIndex(ox+31,oy+16,city)];city.terrainRevision++;
 const landmarks=[[17,17,'residential',1],[18,17,'commercial',1],[21,17,'park',1],[10,17,'parking',1],[21,13,'school',1]];
 for(const [x,y,type,phase]of landmarks){const t=city.tiles[gridIndex(ox+x,oy+y,city)];t.type=type;t.level=phase;}
}
export function createCity(seed=true){
 const city={version:2,simulationVersion:5,calendar:{startYear:START_YEAR,monthProgress:0},progression:{version:1,phase:1},name:'New Meridian',month:0,cash:125000,tax:9,policies:{green:false,transit:false},seed:2020,environment:{season:'auto',weather:'sun',lighting:'day',hour:13,wind:30},operations:{...OPERATIONS},design:{...DESIGN},storage:0,embodiedCarbon:0,recentConstruction:0,cumulativeOperational:0,launchCarbonTotal:0,recentLaunchCarbon:0,carbonHistory:[],satellites:0,bridges:[],tiles:[],history:[],events:[{month:0,text:'Welcome, Mayor. Keep your city connected, supplied, and in balance.'}]};
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const river=4.1+Math.sin(y*.21)*1.5;city.tiles.push({id:index(x,y),x,y,terrain:y<2||Math.abs(x-river)<1.15?'water':'land',type:'empty',level:0,pipe:false,wire:false,drain:false,elevated:false,tunnel:false,age:0,burning:0,elevation:0,growthMonths:0,networkLevels:{},networkProgress:{}});}
 if(seed){
  for(const t of city.tiles){if(t.terrain==='water')continue;const {x,y}=t;
   if((x>=8&&x<=27&&y>=7&&y<=28&&(x%4===0||y%4===0))||(y===16&&x>=8)){t.type='road';t.level=1;t.pipe=true;t.wire=true;}
   else if(x>=9&&x<=26&&y>=9&&y<=26&&((x*7+y*11)%13!==0)){
    t.type=x>22?'industrial':(x>16&&y<21?'commercial':'residential');
    const d=Math.hypot(x-17,y-17);t.level=1;t.age=0;t.residents=0;t.workers=0;
   }
  }
  const put=(x,y,type)=>{const t=city.tiles[index(x,y)];t.type=type;t.level=1;};
  [[27,17,'power'],[9,8,'pump'],[13,13,'school'],[17,13,'hospital'],[21,21,'police'],[25,21,'fire'],[13,17,'park'],[14,17,'park'],[13,18,'park'],[14,18,'park'],[17,21,'park'],[17,22,'park'],[18,21,'park'],[18,22,'park'],[11,12,'bus'],[19,20,'bus'],[12,20,'subway'],[20,20,'subway']].forEach(a=>put(...a));
  for(let x=12;x<=20;x++)city.tiles[index(x,20)].tunnel=true;
  city.tiles[index(9,8)].pipe=true;
 }
 analyze(city);city.history.push({month:0,population:city.metrics.population,cash:city.cash});return city;
}
export function analyze(city){
 const {width,height}=dimensions(city),tiles=city.tiles,n=tiles.length,neighbors=i=>adjacent(i,city),byType={},climateState=climate(city);
 normalizeFinance(city);for(const t of tiles)(byType[t.type]??=[]).push(t);
 const roads=new Set(tiles.filter(t=>['road','toll','bus','subway','bridge','elevatedStation'].includes(t.type)).map(t=>t.id));
 const gateways=new Set(city.gateways||[]);
 const connected=floodGrid([...roads].filter(i=>{const t=tiles[i];return t.x===0||t.y===0||t.x===width-1||t.y===height-1||gateways.has(i);}),i=>roads.has(i),city);
 const network=utilityNetworks(city,connected);
 const metro=(byType.subway||[]).filter(t=>t.tunnel),elevatedStations=(byType.elevatedStation||[]).filter(t=>t.elevated);
 const rail=(stations,key)=>{const active=new Set(),checked=new Set();for(const station of stations){if(checked.has(station.id))continue;const group=floodGrid([station.id],i=>tiles[i][key],city);for(const id of group)checked.add(id);if(stations.filter(t=>group.has(t.id)).length>=2)for(const id of group)active.add(id);}return active;};
 const activeMetro=rail(metro,'tunnel'),activeElevated=rail(elevatedStations,'elevated');
 const access=new Uint8Array(n);for(const id of connected){access[id]=1;for(const i of neighbors(id))access[i]=1;}
 const supplied=set=>{const field=new Uint8Array(n);for(const id of set)eachNearby(city,tiles[id],2,t=>field[t.id]=1);return field;};
 const live=supplied(network.liveWire),wet=supplied(network.wet);
 const services=type=>(byType[type]||[]).filter(t=>access[t.id]&&!t.burning);
 const buses=services('bus'),schools=services('school'),hospitals=services('hospital'),police=services('police'),fires=services('fire');
 const parks=['park','arcology','landmark','forest','wetland'].flatMap(type=>byType[type]||[]);
 const green=influence(city,parks,5),safety=influence(city,police,t=>10+(t.level-1)*.3),health=influence(city,hospitals,t=>10+(t.level-1)*.3),education=influence(city,schools,t=>10+(t.level-1)*.3),fireCover=influence(city,fires,t=>9+(t.level-1)*.3);
 const busCover=influence(city,buses,5),metroCover=influence(city,metro.filter(t=>activeMetro.has(t.id)),6),elevatedCover=influence(city,elevatedStations.filter(t=>activeElevated.has(t.id)),6);
 const industryPollution=influence(city,byType.industrial||[],5,(t,d)=>Math.max(0,5-d)*t.level*.4),plantPollution=influence(city,byType.power||[],6,(_t,d)=>Math.max(0,6-d)*5);
 let population=0,jobs=0,units=0,servedPower=0,servedWater=0,pollution=0,approval=0,roadServed=0,powerRemaining=network.powerCapacity,waterRemaining=network.waterCapacity;
 for(const t of tiles){
  const pNeed=Math.ceil(Math.max(12,occupiedLevel(t)*20)*climateState.powerFactor),wNeed=Math.max(12,occupiedLevel(t)*18);
  const ids=t.siteWidth?siteTiles(city,t):[t.id];t.access=ids.some(id=>access[id]);t.powered=ids.some(id=>live[id])&&powerRemaining>=pNeed;t.watered=ids.some(id=>wet[id])&&waterRemaining>=wNeed;
  t.pollution=clamp(industryPollution[t.id]+plantPollution[t.id],0,100)*(city.policies.green?.65:1);
  t.metroLive=activeMetro.has(t.id);t.elevatedLive=activeElevated.has(t.id);t.transit=city.operations.transit>0&&!!(busCover[t.id]||metroCover[t.id]||elevatedCover[t.id]);
  t.safety=!!safety[t.id];t.health=!!health[t.id];t.education=!!education[t.id];t.fireCover=!!fireCover[t.id];
  t.happiness=Math.round(clamp(55+(t.powered?8:-18)+(t.watered?8:-18)+(t.access?5:-22)+(t.safety?5:0)+(t.health?5:0)+(t.education?4:0)+(green[t.id]?10:0)-t.pollution*.45-(city.tax-9)*3,0,100));
  t.landValue=Math.round(clamp(t.happiness*1.2+Math.max(0,10-Math.hypot(t.x-(city.center?.[0]??17),t.y-(city.center?.[1]??17)))*3,0,150));
  const capacity=parcelCapacity(t);t.housingCapacity=capacity.homes;t.jobCapacity=capacity.jobs;
  t.population=t.burning?0:Math.floor(clamp(t.residents||0,0,capacity.homes));t.jobs=t.burning?0:Math.floor(clamp(t.workers||0,0,capacity.jobs));
  if(ZONES.includes(t.type)){units++;if(t.powered){servedPower++;powerRemaining-=pNeed;}if(t.watered){servedWater++;waterRemaining-=wNeed;}if(t.access)roadServed++;population+=t.population;jobs+=t.jobs;pollution+=t.pollution;approval+=t.happiness;}
 }
 const density=influence(city,tiles.filter(t=>t.population||t.jobs),4,t=>(t.population+t.jobs)*.015);
 const traffic=Math.round(clamp((population*.18+jobs*.12)/Math.max(1,[...roads].reduce((v,id)=>v+capacityFactor(tiles[id].level),0))*climateState.trafficFactor*(city.policies.transit?.7:1)-(buses.length*2+metro.filter(t=>activeMetro.has(t.id)).length*2+elevatedStations.filter(t=>activeElevated.has(t.id)).length*3)*city.operations.transit/100,0,100));
 const portIncome=services('port').reduce((v,t)=>v+650*capacityFactor(t.level),0);
 let parkingIncome=0,parkingCapacity=0;
 for(const t of [...(byType.parking||[]),...(byType.garage||[])]){t.parkingCapacity=t.type==='garage'?80+t.level*24:16+t.level*4;const use=Math.min(1,(density[t.id]*12+traffic)/Math.max(1,t.parkingCapacity));t.parkingUsed=t.access?Math.round(t.parkingCapacity*use):0;parkingCapacity+=t.parkingCapacity;parkingIncome+=t.parkingUsed*.6;}
 const income=Math.round((population*.38+jobs*.55)*(city.tax/9)+portIncome+parkingIncome+(city.satellites||0)*180);
 let expenses=network.operatingCost+tiles.reduce((s,t)=>s+(['power','pump'].includes(t.type)?0:(UPKEEP[t.type]||0)*(1+Math.max(0,t.level-1)*.04)*(['bus','subway','elevatedStation'].includes(t.type)?.3+.7*city.operations.transit/100:1))+(t.tunnel?1:0)+(t.drain?1.5:0)+(t.elevated?2:0),0);
 if(city.policies.green)expenses+=population*.045;if(city.policies.transit)expenses+=population*.05;
 const unemployment=population?Math.round(clamp((population*.48-jobs)/(population*.48)*100,0,100)):0;
 const demand={residential:Math.round(clamp(60+(jobs-population*.48)/45-(city.tax-9)*8-traffic*.4,-100,100)),commercial:Math.round(clamp(35+(population*.18-tiles.reduce((s,t)=>s+(t.type!=='industrial'?t.jobs||0:0),0))/25-(city.tax-9)*5,-100,100)),industrial:Math.round(clamp(40+(population*.36-(byType.industrial||[]).reduce((s,t)=>s+(t.jobs||0),0))/30-(city.tax-9)*5,-100,100))};
 let propertyValue=0;for(const t of tiles){t.taxRevenue=Math.round((t.population*.38+t.jobs*.55)*(city.tax/9));t.landPrice=t.terrain==='land'?Math.round(25000+t.landValue*950):0;t.buildingValue=t.type==='empty'||['road','toll','bridge','bus','subway'].includes(t.type)?0:Math.round(t.level*(CAP[t.type]||8)*2200*(.5+t.landValue/150));t.traffic=roads.has(t.id)?Math.round(clamp(traffic+density[t.id]-8,0,100)):0;propertyValue+=t.landPrice+t.buildingValue;}
 city.activeTiles=tiles.filter(t=>t.type!=='empty'||t.pipe||t.wire||t.tunnel||t.drain||t.elevated);city.revision=(city.revision||0)+1;
 city.metrics={network:{...network,liveWire:undefined,wet:undefined},parkingIncome:Math.round(parkingIncome),parkingCapacity,activeElevated:elevatedStations.filter(t=>activeElevated.has(t.id)).length,propertyValue,portIncome,satellites:city.satellites||0,climate:climateState,population,jobs,income,expenses:Math.round(expenses),net:income-Math.round(expenses),traffic,unemployment,approval:units?Math.round(approval/units):70,pollution:units?Math.round(pollution/units):0,power:units?Math.round(servedPower/units*100):100,water:units?Math.round(servedWater/units*100):100,road:units?Math.round(roadServed/units*100):100,powerCapacity:network.powerCapacity,powerUsed:network.powerCapacity-powerRemaining,waterCapacity:network.waterCapacity,waterUsed:network.waterCapacity-waterRemaining,demand,activeMetro:metro.filter(t=>activeMetro.has(t.id)).length};
 city.metrics.environment=environmentModel(city);city.metrics.expenses+=city.metrics.environment.retrofitCost;city.metrics.net=city.metrics.income-city.metrics.expenses;applyEconomy(city);return city;
}
export function build(city,id,tool,{analyzeAfter=true}={}){
 const neighbors=i=>adjacent(i,city);
 if(tool==='bulldoze'&&city.tiles[id]?.siteRoot!==undefined)id=city.tiles[id].siteRoot;const t=city.tiles[id];if(!t||!TOOLS[tool]||tool==='inspect')return {ok:false,message:'Choose a construction tool.'};
 if(['reclaim','raise','lower','flatten'].includes(tool))return terraform(city,id,tool,0,{analyzeAfter});
 if(tool==='bridge')return {ok:false,message:'Choose the start and end of the bridge.'};
 if(tool==='bulldoze'&&t.type==='bridge'){const span=(city.bridges||[]).find(b=>b.tiles.includes(id));if(span){if(city.cash<TOOLS.bulldoze.cost)return {ok:false,message:'Insufficient treasury funds.'};city.cash-=TOOLS.bulldoze.cost;for(const i of span.tiles){city.tiles[i].type='empty';city.tiles[i].level=0;city.tiles[i].growthMonths=0;}city.bridges=city.bridges.filter(b=>b!==span);if(analyzeAfter)analyze(city);return {ok:true,message:'Bridge removed.'};}}
 if(tool==='port'&&!neighbors(id).some(i=>city.tiles[i].terrain==='water'))return {ok:false,message:'Place a harbor on land next to water.'};
 if(tool==='dam'&&(t.terrain!=='water'||!neighbors(id).some(i=>city.tiles[i].terrain==='land')))return {ok:false,message:'Place a dam in water beside land.'};
 if(t.terrain==='water'&&!['dam','bulldoze','wire','pipe','tunnel','drain'].includes(tool))return {ok:false,message:'Water cannot be developed in this prototype.'};
 if(['pipe','tunnel','wire','drain','elevated'].includes(tool)&&t[tool])return {ok:false,message:'Already connected here.'};
 if(tool==='bulldoze'&&t.type==='empty'&&!t.burning)return {ok:false,message:'This parcel is already clear.'};
 if(!['bulldoze','pipe','tunnel','wire','drain','elevated'].includes(tool)&&t.type!=='empty'&&!(tool==='toll'&&t.type==='road')&&!(['bus','subway','elevatedStation'].includes(tool)) )return {ok:false,message:'Bulldoze this parcel before replacing it.'};
 if(['bus','subway','elevatedStation'].includes(tool)&&!['road','empty'].includes(t.type))return {ok:false,message:'Place transit on a road or empty parcel.'};
 if(t.siteRoot!==undefined&&tool!=='bulldoze'&&!NETWORK_TYPES.includes(tool))return {ok:false,message:'This parcel belongs to a facility. Bulldoze the facility first.'};
 const site=SITE_SIZES[tool]?inspectSite(city,id,tool):null;if(site&&!site.ok)return site;
 if(city.cash<TOOLS[tool].cost)return {ok:false,message:'Insufficient treasury funds.'};
 city.cash-=TOOLS[tool].cost;
 if(NETWORK_TYPES.includes(tool)){t[tool]=true;(t.networkLevels??={})[tool]=1;(t.networkProgress??={})[tool]=0;}
 else if(tool==='bulldoze'){if(t.siteWidth)clearSite(city,t);t.residents=0;t.workers=0;t.type='empty';t.level=0;t.burning=0;t.age=0;t.growthMonths=0;}
 else{if(site)reserveSite(city,t,site);t.residents=0;t.workers=0;t.type=tool;t.level=1;t.age=0;t.growthMonths=0;t.burning=0;if(tool==='reservoir'||tool==='dam')city.storage+=15000;}
 if(tool!=='bulldoze')recordConstruction(city,tool);
 if(analyzeAfter)analyze(city);return {ok:true,message:tool==='bulldoze'?'Parcel cleared.':TOOLS[tool].name+' placed.'};
}
export function tick(city){
 analyze(city);city.cumulativeOperational+=(city.metrics.environment.operational-city.metrics.environment.removal);city.carbonHistory.push({month:city.month,...city.metrics.environment});city.carbonHistory=city.carbonHistory.slice(-60);city.recentConstruction=0;city.recentLaunchCarbon=0;const before=city.metrics.population;
 advancePopulation(city);analyze(city);if(unlockProgression(city))addEvent(city,'City era '+city.progression.phase+' unlocked. Connected buildings will evolve gradually.');
 for(const t of city.activeTiles||city.tiles){
  t.age++;
  if(t.burning){t.burning=Math.max(0,t.burning-(t.fireCover?2:1));t.level=1;t.residents=0;t.workers=0;t.growthMonths=0;continue;}
  advanceDevelopment(city,t,type=>recordConstruction(city,type,ZONE_TYPES.includes(type)?1:['park','forest','wetland'].includes(type)?0:.12));
  // Long service failures can reduce occupied development, but keep the visible plot.
  // Lost residents leave vacant capacity; earned architecture is retained.
 }
 const c=climate(city);const inflow=['rain','hail','snow'].includes(c.weather)?18000:5000;city.storage=clamp((city.storage||0)+inflow-(city.metrics.network.stockCapacity?city.operations.hydro*85:0),0,city.metrics.network.stockCapacity);
 wearInfrastructure(city);city.month++;analyze(city);if(unlockProgression(city))addEvent(city,'City era '+city.progression.phase+' unlocked.');city.cash+=city.metrics.net;
 city.history.push({month:city.month,population:city.metrics.population,cash:city.cash});city.history=city.history.slice(-60);
 if(city.metrics.population>before&&city.month%4===0)addEvent(city,'New residents are moving in. Keep room for jobs and services.');
 if(city.metrics.water<85&&city.month%3===0)addEvent(city,'Water service is limiting growth. Extend pipes from a connected pump.');
 if(city.cash<0&&city.month%3===0)addEvent(city,'The treasury is in deficit. Increase revenue or reduce upkeep.');
 return city;
}
export function addEvent(city,text){city.events.unshift({month:city.month,text});city.events=city.events.slice(0,8);}
export function disaster(city){city.randomState=(Math.imul(city.randomState??city.seed,1664525)+1013904223)>>>0;const candidates=city.tiles.filter(t=>ZONES.includes(t.type)&&t.level>0);if(!candidates.length)return false;const t=candidates[city.randomState%candidates.length];t.burning=t.fireCover?2:5;t.level=0;t.residents=0;t.workers=0;t.growthMonths=0;addEvent(city,`Fire reported at parcel ${t.x+1}, ${t.y+1}. ${t.fireCover?'Crews are responding.':'Build a nearby fire station.'}`);analyze(city);return t.id;}
export function serialize(city){const save={version:city.width?3:2,ambientEvents:city.ambientEvents,simulationVersion:5,calendar:city.calendar,progression:city.progression,width:city.width,height:city.height,cellSize:city.cellSize,origin:city.origin,preset:city.preset,biome:city.biome,terrainConfig:city.terrainConfig,terrainGenerator:city.terrainGenerator,center:city.center,gateways:city.gateways,terrainRevision:city.terrainRevision||0,name:city.name,month:city.month,cash:city.cash,tax:city.tax,finance:city.finance,policies:city.policies,seed:city.seed,randomState:city.randomState,environment:city.environment,operations:city.operations,design:city.design,embodiedCarbon:city.embodiedCarbon||0,recentConstruction:city.recentConstruction||0,cumulativeOperational:city.cumulativeOperational||0,launchCarbonTotal:city.launchCarbonTotal||0,recentLaunchCarbon:city.recentLaunchCarbon||0,carbonHistory:city.carbonHistory||[],storage:city.storage||0,satellites:city.satellites||0,bridges:city.bridges||[],tiles:city.tiles.map(({id,x,y,terrain,type,level,pipe,tunnel,age,burning,elevation,wire,drain,elevated,growthMonths,networkLevels,networkProgress,condition,residents,workers,siteRoot,siteWidth,siteHeight})=>({residents:residents||0,workers:workers||0,siteRoot,siteWidth,siteHeight,id,x,y,terrain,type,level,pipe,tunnel,age,burning,elevation:elevation||0,wire:!!wire,drain:!!drain,elevated:!!elevated,growthMonths:growthMonths||0,networkLevels:networkLevels||{},networkProgress:networkProgress||{},condition:condition??100})),history:city.history,events:city.events};if(city.width){save.terrain={heights:city.tiles.map(t=>t.elevation||0),water:waterRuns(city.tiles)};save.tiles=save.tiles.filter(t=>t.type!=='empty'||t.siteRoot!==undefined||t.pipe||t.wire||t.tunnel||t.drain||t.elevated||t.burning);}return JSON.stringify(save);}
export function deserialize(text){
 const c=JSON.parse(text);if(c.ambientEvents!==undefined)c.ambientEvents=normalizeUfoSettings(c.ambientEvents);const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 if(c.randomState!==undefined&&(!Number.isInteger(c.randomState)||!finite(c.randomState,0,4294967295)))throw Error('Invalid simulation random state.');
 if(c.terrainConfig!==undefined){const p=c.terrainConfig;if(!p||!finite(p.relief,.4,1.8)||!finite(p.water,.5,1.5)||!finite(p.forest,0,1.8))throw Error('Invalid terrain settings.');}
 if(c.version===3){
  if(!Number.isInteger(c.width)||!Number.isInteger(c.height)||c.width<32||c.height<32||c.width>384||c.height>256||!finite(c.cellSize,25,100)||!Array.isArray(c.origin)||c.origin.length!==2||!finite(c.origin[0],-179,179)||!finite(c.origin[1],-75,75))throw Error('Invalid map dimensions or origin.');
  const n=c.width*c.height,terrain=c.terrain,records=c.tiles;
  if(!terrain||!Array.isArray(terrain.heights)||terrain.heights.length!==n||terrain.heights.some(h=>!finite(h,0,500))||!Array.isArray(records)||records.length>n)throw Error('Invalid region terrain.');
  const mask=decodeWater(terrain.water,n),seen=new Set();
  c.tiles=Array.from({length:n},(_,id)=>blankTile(id,id%c.width,Math.floor(id/c.width),{terrain:mask[id]?'water':'land',elevation:terrain.heights[id]}));
  for(const t of records){if(!Number.isInteger(t.id)||t.id<0||t.id>=n||seen.has(t.id)||t.x!==t.id%c.width||t.y!==Math.floor(t.id/c.width))throw Error('Invalid region parcel.');seen.add(t.id);c.tiles[t.id]={...c.tiles[t.id],...t,elevation:terrain.heights[t.id],terrain:mask[t.id]?'water':'land'};}
  c.gateways??=[];if(!Array.isArray(c.gateways)||c.gateways.some(i=>!Number.isInteger(i)||i<0||i>=n))throw Error('Invalid regional connection.');
  if(!Array.isArray(c.center)||c.center.length!==2||!finite(c.center[0],0,c.width)||!finite(c.center[1],0,c.height))c.center=[c.width/2,c.height/2];
  delete c.terrain;
 }
 if(c.version!==3)for(const key of ['width','height','cellSize','origin','preset','biome','center','gateways'])delete c[key];
 const {width,height}=dimensions(c),neighbors=i=>adjacent(i,c);
 if(![1,2,3].includes(c.version)||!Array.isArray(c.tiles)||c.tiles.length!==width*height||!finite(c.cash,-1e12,1e12)||!Number.isInteger(c.month)||!finite(c.month,0,1e7)||!finite(c.tax,4,18)||!Number.isInteger(c.seed))throw Error('This is not a valid Sim City 2020 save.');
 for(let i=0;i<c.tiles.length;i++){const t=c.tiles[i];if(t.id!==i||t.x!==i%width||t.y!==Math.floor(i/width)||!['land','water'].includes(t.terrain)||!['empty',...Object.keys(TOOLS).filter(k=>!['inspect','bulldoze','pipe','tunnel','reclaim','raise','lower','flatten','wire','drain','elevated'].includes(k))].includes(t.type)||!Number.isInteger(t.level)||!finite(t.level,0,c.version===1?8:MAX_PHASE)||typeof t.pipe!=='boolean'||typeof t.tunnel!=='boolean'||!Number.isInteger(t.age)||!finite(t.age,0,1e7)||!Number.isInteger(t.burning)||!finite(t.burning,0,5)||t.terrain==='water'&&(!['empty','bridge','dam'].includes(t.type)))throw Error('The save contains an invalid parcel.');}
 if(c.version===1){for(const t of c.tiles){if(ZONES.includes(t.type)&&!t.burning)t.level=Math.min(MAX_PHASE,t.level+1);else if(t.type!=='empty'&&!t.burning)t.level=Math.max(1,t.level);}c.version=2;}
 for(const t of c.tiles){
  t.growthMonths??=0;t.networkLevels??={};t.networkProgress??={};
  if(!Number.isInteger(t.growthMonths)||!finite(t.growthMonths,0,120)||typeof t.networkLevels!=='object'||Array.isArray(t.networkLevels)||typeof t.networkProgress!=='object'||Array.isArray(t.networkProgress))throw Error('Invalid development progress.');
  for(const key of NETWORK_TYPES){
   const level=t.networkLevels[key],progress=t.networkProgress[key];
   if(level!==undefined&&(!Number.isInteger(level)||!finite(level,1,MAX_PHASE))||progress!==undefined&&(!Number.isInteger(progress)||!finite(progress,0,120)))throw Error('Invalid network development.');
  }
 }
 c.design={...DESIGN,...c.design};for(const key of Object.keys(DESIGN))if(!finite(c.design[key],0,100))throw Error('Invalid environmental policy.');for(const key of ['embodiedCarbon','recentConstruction','cumulativeOperational','launchCarbonTotal','recentLaunchCarbon']){c[key]??=0;if(!finite(c[key],-1e12,1e12))throw Error('Invalid carbon ledger.');}c.carbonHistory=Array.isArray(c.carbonHistory)?c.carbonHistory.filter(v=>Number.isInteger(v.month)&&finite(v.netCarbon,-1e12,1e12)).slice(-60):[];
 c.operations={...OPERATIONS,...c.operations};for(const key of Object.keys(OPERATIONS))if(!finite(c.operations[key],0,150))throw Error('Invalid operating settings.');c.storage??=0;if(!finite(c.storage,0,1e9))throw Error('Invalid water storage.');
 for(const t of c.tiles){t.wire??=['road','toll','bus','subway'].includes(t.type);t.drain??=false;t.elevated??=false;if([t.wire,t.drain,t.elevated].some(v=>typeof v!=='boolean'))throw Error('Invalid utility network.');t.elevation??=0;if(!Number.isFinite(t.elevation)||t.elevation<0||t.elevation>500)throw Error('Invalid terrain elevation.');}
 const e=c.environment||{};if(e.season&&!SEASONS.includes(e.season)||e.weather&&!WEATHER.includes(e.weather)||e.lighting&&!['day','night'].includes(e.lighting)||e.wind!==undefined&&!finite(e.wind,0,100)||e.hour!==undefined&&!finite(e.hour,0,24))throw Error('Invalid environment settings.');c.environment={season:e.season||'auto',weather:e.weather||'sun',lighting:e.lighting||'day',hour:e.hour??13,wind:e.wind??30};c.satellites??=0;if(!Number.isInteger(c.satellites)||!finite(c.satellites,0,10000))throw Error('Invalid satellite count.');c.bridges??=[];if(!Array.isArray(c.bridges)||c.bridges.length>100)throw Error('Invalid bridge list.');
 const bridgeTiles=new Set();for(const b of c.bridges){if(!Array.isArray(b.tiles)||b.tiles.length<2||b.tiles.length>24||!['cable','arch'].includes(b.style)||!finite(b.height,15,90)||!finite(b.width,8,30))throw Error('Invalid bridge.');for(const id of b.tiles){if(!Number.isInteger(id)||!c.tiles[id]||c.tiles[id].type!=='bridge'||bridgeTiles.has(id))throw Error('Invalid bridge parcel.');bridgeTiles.add(id);}for(let j=1;j<b.tiles.length;j++)if(!neighbors(b.tiles[j-1]).includes(b.tiles[j]))throw Error('Bridge span must be continuous.');}if(c.tiles.some(t=>t.type==='bridge'&&!bridgeTiles.has(t.id)))throw Error('Bridge definition is missing.');
 c.name=typeof c.name==='string'?c.name.slice(0,40):'New Meridian';c.policies={green:c.policies?.green===true,transit:c.policies?.transit===true};
 c.history=Array.isArray(c.history)?c.history.filter(v=>Number.isInteger(v.month)&&finite(v.population,0,1e8)&&finite(v.cash,-1e12,1e12)).slice(-60):[];
 c.events=Array.isArray(c.events)?c.events.filter(v=>typeof v.text==='string'&&Number.isInteger(v.month)).slice(0,8).map(v=>({month:v.month,text:v.text.slice(0,200)})):[];
 if(c.simulationVersion!==5){
  c.calendar={startYear:2020,monthProgress:0};c.progression={version:1,phase:c.tiles.reduce((phase,t)=>Math.max(phase,t.level||1,...Object.values(t.networkLevels||{})),1)};
  for(const t of c.tiles){t.residents=['residential','arcology','mixeduse'].includes(t.type)?Math.max(0,t.level-1)*CAP[t.type]:0;t.workers=t.type==='mixeduse'?Math.max(0,t.level-1)*30:ZONES.includes(t.type)&&!['residential','arcology','mixeduse'].includes(t.type)?Math.max(0,t.level-1)*CAP[t.type]:0;}
  c.simulationVersion=5;
 }
 if(!c.calendar||!Number.isInteger(c.calendar.startYear)||!finite(c.calendar.startYear,1800,3000)||!finite(c.calendar.monthProgress,0,MONTH_MS-.000001)||!c.progression||!Number.isInteger(c.progression.phase)||!finite(c.progression.phase,1,10))throw Error('Invalid calendar or city progression.');
 for(const t of c.tiles){t.residents??=0;t.workers??=0;const cap=parcelCapacity(t);if(!finite(t.residents,0,cap.homes)||!finite(t.workers,0,cap.jobs))throw Error('Invalid parcel occupancy.');}
 validateSites(c);normalizeFinance(c);for(const t of c.tiles){t.condition=Number.isFinite(t.condition)?clamp(t.condition,0,100):100;}return analyze(c);
}

export function terraform(city,id,tool,target=0,{analyzeAfter=true}={}){const t=city.tiles[id];if(!t||!['reclaim','raise','lower','flatten'].includes(tool))return {ok:false,message:'Invalid terrain operation.'};if(t.siteRoot!==undefined||t.type!=='empty'||t.pipe||t.tunnel||t.wire||t.drain||t.elevated)return {ok:false,message:'Clear this parcel and its utilities first.'};if(tool==='reclaim'&&t.terrain!=='water')return {ok:false,message:'Choose water to reclaim.'};if(tool!=='reclaim'&&t.terrain==='water')return {ok:false,message:'Reclaim the water first.'};if(tool==='raise'&&(t.elevation||0)>=500)return {ok:false,message:'Maximum elevation reached.'};if(city.cash<TOOLS[tool].cost)return {ok:false,message:'Insufficient treasury funds.'};if(tool==='flatten'&&(!Number.isFinite(target)||target<0||target>500))return {ok:false,message:'Choose a target height from 0 to 500.'};city.cash-=TOOLS[tool].cost;if(tool==='flatten')t.elevation=target;else if(tool==='reclaim'){t.terrain='land';t.elevation=0;}else if(tool==='raise')t.elevation=Math.min(500,(t.elevation||0)+1);else if((t.elevation||0)>0)t.elevation=Math.max(0,t.elevation-1);else t.terrain='water';city.terrainRevision=(city.terrainRevision||0)+1;recordConstruction(city,tool);if(analyzeAfter)analyze(city);return {ok:true,message:'Terrain updated.'};}
export function buildBridge(city,start,end,{style='cable',height=45,width=16}={}){const index=(x,y)=>gridIndex(x,y,city);const a=city.tiles[start],b=city.tiles[end];if(!a||!b||a.id===b.id||!['cable','arch'].includes(style)||!Number.isFinite(height)||height<15||height>90||!Number.isFinite(width)||width<8||width>30)return {ok:false,message:'Invalid bridge settings.'};if(a.x!==b.x&&a.y!==b.y)return {ok:false,message:'Align the bridge endpoints horizontally or vertically.'};const dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y),length=Math.abs(b.x-a.x)+Math.abs(b.y-a.y);if(length<2||length>23)return {ok:false,message:'A bridge must span 3 to 24 parcels.'};const ids=Array.from({length:length+1},(_,i)=>index(a.x+dx*i,a.y+dy*i));if(a.terrain!=='land'||b.terrain!=='land'||ids.some(id=>city.tiles[id].siteRoot!==undefined||city.tiles[id].type!=='empty'||city.tiles[id].pipe||city.tiles[id].tunnel))return {ok:false,message:'Choose clear land endpoints and a clear span.'};const cost=ids.length*TOOLS.bridge.cost+Math.round(height*20);if(city.cash<cost)return {ok:false,message:'Insufficient treasury funds.'};city.cash-=cost;for(const id of ids){city.tiles[id].type='bridge';city.tiles[id].level=1;city.tiles[id].growthMonths=0;}city.bridges.push({tiles:ids,style,height,width});recordConstruction(city,'bridge',ids.length);analyze(city);return {ok:true,message:'Bridge built.',cost};}
export function launchSatellite(city,id){const t=city.tiles[id];if(!t||t.type!=='spaceport')return {ok:false,message:'Select a space launch pad first.'};analyze(city);if(!t.access||!t.powered||!t.watered)return {ok:false,message:'The pad needs a connected road, power, and water.'};if(!climate(city).launchable)return {ok:false,message:'Weather hold. Launch in clear weather with wind below 55.'};if(city.cash<12000)return {ok:false,message:'A launch costs $12,000.'};city.cash-=12000;city.launchCarbonTotal=(city.launchCarbonTotal||0)+75;city.recentLaunchCarbon=(city.recentLaunchCarbon||0)+75;city.satellites=(city.satellites||0)+1;addEvent(city,'Satellite '+city.satellites+' deployed. Monthly lease income: $180.');analyze(city);return {ok:true,message:'Satellite launch initiated.',satellites:city.satellites};}

export function removeNetwork(city,id,network,{analyzeAfter=true}={}){const t=city.tiles[id];if(!t||!['pipe','wire','tunnel','drain','elevated'].includes(network)||!t[network])return {ok:false,message:'No selected utility to remove here.'};if(city.cash<15)return {ok:false,message:'Insufficient treasury funds.'};t[network]=false;delete t.networkLevels?.[network];delete t.networkProgress?.[network];city.cash-=15;if(analyzeAfter)analyze(city);return {ok:true,message:'Selected utility removed.'};}
export function optimizeOperations(city){analyze(city);const original=serialize(city),baseline={cost:city.metrics.expenses,power:city.metrics.power,water:city.metrics.water,emissions:city.metrics.network.emissions};let best=null;for(const thermal of [25,50,75,100])for(const water of [50,75,100]){const candidate=deserialize(original);candidate.operations.thermal=thermal;candidate.operations.water=water;analyze(candidate);const m=candidate.metrics;if(m.power<Math.max(99,baseline.power)||m.water<Math.max(99,baseline.water))continue;if(!best||m.expenses<best.cost)best={operations:{...candidate.operations},cost:m.expenses,power:m.power,water:m.water,emissions:m.network.emissions};}return {baseline,best,savings:best?baseline.cost-best.cost:0,scenarios:12};}
