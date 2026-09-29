import {dimensions} from './grid.mjs';
export const REGION={width:256,height:192,cellSize:64};
export const PRESETS=[
 {id:'estuary',name:'Meridian Estuary',tag:'RIVER · COAST · PLAINS',description:'A winding river opens into a sheltered bay. Broad alluvial plains leave room for a connected metropolis.',biome:'temperate',seed:2020},
 {id:'alpine',name:'Alpine Lakes',tag:'MOUNTAINS · LAKE · PASSES',description:'Rocky mountain spines frame a glacial basin. Follow the valley floor and reserve the steep slopes for forest.',biome:'alpine',seed:4317},
 {id:'delta',name:'Emerald Delta',tag:'CHANNELS · WETLANDS · ISLANDS',description:'Branching waterways separate fertile low islands. Short bridge crossings can link waterfront districts.',biome:'lush',seed:8312},
 {id:'desert',name:'Sunstone Gulf',tag:'DUNES · OASIS · GULF',description:'A warm sandy gulf, an inland oasis and sandstone escarpments. The flatter coastal strip offers an accessible start.',biome:'desert',seed:6921},
 {id:'highlands',name:'Highland Reservoirs',tag:'WOODLAND · LAKES · RIVER',description:'Two connected lake basins wind through wooded hills. Sheltered shores alternate with more demanding ridges.',biome:'temperate',seed:1957},
 {id:'archipelago',name:'Pelagic Islands',tag:'ISLANDS · BEACHES · HARBORS',description:'A chain of rugged islands surrounded by shallow shelves and deep water. Shoreline space and crossings shape the city.',biome:'tropical',seed:5014},
 {id:'fjord',name:'Northreach Fjord',tag:'FJORD · CLIFFS · VALLEYS',description:'A long sea inlet cuts between dramatic ridges. Small shore terraces lead inland to wider mountain valleys.',biome:'alpine',seed:7403},
 {id:'canyon',name:'Redrock Canyon',tag:'CANYON · MESA · RIVER',description:'A meandering river cuts a deep passage through dry plateaus. Elevated mesas provide distinct building districts.',biome:'desert',seed:9207},
 {id:'caldera',name:'Crescent Caldera',tag:'CRATER LAKE · RIDGE · FOREST',description:'A breached volcanic ring wraps around a lake. The outer plains and the opening in the rim offer gentler approaches.',biome:'tropical',seed:3217},
 {id:'lakecountry',name:'Silverwater Lakes',tag:'LAKES · STREAMS · MEADOWS',description:'Several irregular lakes and connecting streams sit in rolling meadowland, with wooded hills between them.',biome:'temperate',seed:6143},
 {id:'coastalplain',name:'Fairhaven Coast',tag:'BEACHES · PLAINS · CREEK',description:'A sweeping sandy coast, a creek and generous flat land. A forgiving starting region with foothills inland.',biome:'temperate',seed:1181},
 {id:'peninsula',name:'Cape Verde',tag:'PENINSULA · COVES · HEADLAND',description:'A long green headland divides two bays. Build on its central spine and connect neighborhoods around sheltered coves.',biome:'lush',seed:8821}
];
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const terrainHash=(x,y,seed)=>{let n=Math.imul(x+seed,374761393)^Math.imul(y-seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
export function noise(x,y,seed=2020){const x0=Math.floor(x),y0=Math.floor(y),u=smooth(x-x0),v=smooth(y-y0),a=terrainHash(x0,y0,seed),b=terrainHash(x0+1,y0,seed),c=terrainHash(x0,y0+1,seed),d=terrainHash(x0+1,y0+1,seed);return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;}
function fbm(x,y,s){return noise(x,y,s)*.5+noise(x*2,y*2,s+13)*.27+noise(x*4,y*4,s+71)*.14+noise(x*8,y*8,s+127)*.06+noise(x*16,y*16,s+271)*.03;}
export function terrainConfig(config={}){return {relief:clamp(Number(config.relief)||1,.4,1.8),water:clamp(Number(config.water)||1,.5,1.5),forest:clamp(Number.isFinite(Number(config.forest))?Number(config.forest):1,0,1.8)};}
export function nextTerrainSeed(current,random){let v;if(random)v=random();else if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);globalThis.crypto.getRandomValues(a);v=a[0]/4294967296;}else v=Math.random();const next=1+Math.floor(clamp(v,0,1-Number.EPSILON)*2147483647);return next===Number(current)?next%2147483647+1:next;}
// Signed shore distance defines connected landforms; the seed changes their position,
// width, orientation and tributaries, not just the surface color or elevation noise.
export function sampleTerrain(preset,x,y,seed=2020,config={}){
 const cfg=terrainConfig(config),r=i=>terrainHash(i,97,seed),angle=(r(1)-.5)*.6,xx=x-.5,yy=y-.5;
 x=.5+xx*Math.cos(angle)-yy*Math.sin(angle);y=.5+xx*Math.sin(angle)+yy*Math.cos(angle);
 if(r(2)>.5)x=1-x;
 const n=fbm(x*5,y*5,seed),detail=fbm(x*23,y*23,seed+87),rough=Math.abs(noise(x*11,y*11,seed+23)-.5)*2;
 const phase=r(3)*6.28,riverX=v=>.35+(r(4)-.5)*.19+(.055+r(5)*.07)*Math.sin(v*(5+r(6)*5)+phase)+.018*Math.sin(v*23+phase),river=Math.abs(x-riverX(y));
 const coast=.16+(r(7)-.5)*.1+.035*Math.sin(x*11+phase)+(n-.5)*.065;
 const ellipse=(cx,cy,rx,ry)=>Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2)-1+(n-.5)*.62+(noise(x*17,y*17,seed+712)-.5)*.18;
 let shore=1,h=30;
 switch(preset){
 case 'alpine':{const ridge=Math.exp(-(((x-.16-(noise(y*5,1,seed)-.5)*.12)/.115)**2))+.9*Math.exp(-(((x-.83-(noise(y*5,3,seed)-.5)*.10)/.13)**2));shore=Math.min(ellipse(.50+(r(8)-.5)*.14,.47,.14+r(9)*.06,.23)*.15,Math.abs(x-(.50+.035*Math.sin(y*12+phase)))-.013);h=25+ridge*(450+n*1300)*( .72+noise(x*14,y*10,seed+20)*.6)+Math.max(0,detail-.42)*180;break;}
 case 'delta':{const fork=.61+.075*Math.sin(y*8+phase),cross=.37+.10*Math.sin(x*5+phase);shore=Math.min(y-coast,river-.027,Math.abs(x-fork)-.024,Math.abs(y-cross)-.014);h=5+n*30+detail*9;break;}
 case 'desert':{shore=Math.min(x-(.21+.05*Math.sin(y*8+phase)+(n-.5)*.1),ellipse(.61+(r(8)-.5)*.14,.57,.055,.09)*.08);h=9+n*55+smooth((n-.47)*5)*(160+detail*220);break;}
 case 'highlands':{const line=.47+.16*Math.sin(x*5+phase);shore=Math.min(ellipse(.30,.47+.16*Math.sin(1.5+phase),.11+r(8)*.035,.18)*.13,ellipse(.70,.47+.16*Math.sin(3.5+phase),.15,.12+r(9)*.03)*.12,Math.abs(y-line)-.013);h=22+n*130+smooth((detail-.35)*2)*(90+rough*260);break;}
 case 'archipelago':{let island=-2;for(let i=0;i<5;i++){const cx=[.26,.67,.20,.84,.46][i]+(r(10+i)-.5)*.10,cy=[.28,.62,.82,.19,.40][i]+(r(20+i)-.5)*.1,rad=[.23,.29,.13,.13,.10][i]*(.83+r(30+i)*.34);island=Math.max(island,1-Math.hypot((x-cx)/rad,(y-cy)/(rad*.88)));}shore=(island+(n-.5)*.45)*.17;h=8+Math.max(0,island)**1.2*(170+n*430)+detail*18;break;}
 case 'fjord':{const inlet=.48+.085*Math.sin(y*6+phase),width=.025+.14*(1-y)+.035*n;shore=Math.min(y-.08,Math.abs(x-inlet)-width);const ridge=Math.exp(-(((Math.abs(x-inlet)-.20)/.13)**2));h=40+ridge*(450+900*n)+detail*120;break;}
 case 'canyon':{shore=river-.017;const mesa=smooth((river-.025)/.09);h=12+mesa*(280+130*n)+smooth((detail-.45)*6)*115;break;}
 case 'caldera':{const rad=Math.hypot((x-.5-(r(8)-.5)*.1), (y-.48)*1.13),rim=Math.exp(-(((rad-.28)/.10)**2)),breach=Math.abs(x-(.51+.04*Math.sin(y*10+phase)));shore=Math.min((rad-.185+(n-.5)*.03), y<.48?Math.max(breach-.025,y-.43):1,y-.045);h=18+rim*(340+n*510)*(y<.48?smooth(breach/.12):1)+detail*48;break;}
 case 'lakecountry':{shore=1;for(let i=0;i<5;i++){const cx=.16+i*.165,cy=.5+.19*Math.sin(cx*8+phase);shore=Math.min(shore,ellipse(cx,cy,.065+r(10+i)*.05,.09+r(20+i)*.08)*.09);}shore=Math.min(shore,Math.abs(y-(.5+.19*Math.sin(x*8+phase)))-.009);h=8+n*70+smooth((detail-.40)*3)*110;break;}
 case 'coastalplain':{shore=Math.min(y-(.20+.06*Math.sin(x*5+phase)+(n-.5)*.04),river-.010);h=3+n*18+smooth((y-.62)*3)*(90+detail*130);break;}
 case 'peninsula':{const width=.08+.28*y,spine=.5+.08*Math.sin(y*5+phase);shore=Math.min(width-Math.abs(x-spine)+(n-.5)*.10,y-.12);h=7+smooth(shore/.18)*(35+n*150)+detail*25;break;}
 default:shore=Math.min(y-coast,river-(.014+.025*(1-y)),ellipse(.76+(r(8)-.5)*.12,.73,.08,.12)*.10);h=6+n*38+smooth((y-.60)*3)*(140+detail*190);
 }
 shore-=(cfg.water-1)*.036;
 const water=shore<=0;
 // Gentle banks remove sheer tile walls; mountains retain ridges away from water.
 const bank=smooth(Math.max(0,shore)/(preset==='fjord'?.027:preset==='canyon'?.018:.055));
 h=(1.2+h*bank)*cfg.relief;
 return {elevation:water?0:Math.round(clamp(h,.6,2900)/.6)/10,terrain:water?'water':'land'};
}
export function makeTerrain(preset='estuary',options={}){
 const spec=PRESETS.find(p=>p.id===preset)||PRESETS[0],map={...REGION,...options,preset:spec.id,biome:spec.biome,seed:options.seed??spec.seed,name:options.name||spec.name,origin:options.origin||[-122.42,37.77],terrainConfig:terrainConfig(options.terrainConfig),terrainGenerator:2};
 if(!Number.isInteger(map.seed)||map.seed<1||map.seed>2147483647)throw Error('Terrain seed must be an integer from 1 to 2,147,483,647.');
 map.tiles=Array.from({length:map.width*map.height},(_,id)=>{const x=id%map.width,y=Math.floor(id/map.width);return {id,x,y,...sampleTerrain(spec.id,(x+.5)/map.width,(y+.5)/map.height,map.seed,map.terrainConfig)};});return map;
}
export function regionLabel(city){const {width,height,cellSize}=dimensions(city);return `${(width*cellSize/1000).toFixed(1)} × ${(height*cellSize/1000).toFixed(1)} KM`;}
export function waterRuns(tiles){const out=[];let last=-1,count=0;for(const t of tiles){const v=t.terrain==='water'?1:0;if(v!==last&&count){out.push(last,count);count=0;}last=v;count++;}if(count)out.push(last,count);return out;}
export function decodeWater(runs,n){if(!Array.isArray(runs)||runs.length>n*2||runs.length%2)throw Error('Invalid terrain mask.');const out=new Uint8Array(n);let at=0;for(let i=0;i<runs.length;i+=2){const v=runs[i],count=runs[i+1];if(![0,1].includes(v)||!Number.isInteger(count)||count<=0||at+count>n)throw Error('Invalid terrain mask.');out.fill(v,at,at+count);at+=count;}if(at!==n)throw Error('Incomplete terrain mask.');return out;}
