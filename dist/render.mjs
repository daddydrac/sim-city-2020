import {SITE_SIZES,siteTiles,inspectSite} from './sites.mjs';
import {artLayers} from './art-layers.mjs';
import {ART_REGISTRY} from './art-registry.mjs';
import {architectureLayers} from './architecture.mjs';
import {SIZE,TOOLS,neighbors,index,clamp} from './engine.mjs';
import {HOME,position as worldPosition,tilePosition as worldTilePosition,tileAt,terrainHeight} from './geo.mjs';
import {dimensions} from './grid.mjs';
import {terrainSurvey} from './terrain-style.mjs';
import {terrainHash} from './terrain.mjs';
import {terrainLayers} from './terrain-render.mjs';
import {analyticsLayers,analyticColor,ANALYTICS} from './analytics.mjs';
import {climate} from './climate.mjs';
import {landmarkLayers,isSpecial} from './features.mjs';
import {TEXTURE_PARAMETERS} from './graphics.mjs';
import {ZONE_TYPES,buildingForm,networkLevel} from './development.mjs';
export {HOME,worldPosition as position};
const {deck,cityLuma:luma}=window;
const cube=new luma.CubeGeometry(),canopy=new luma.SphereGeometry({nlat:4,nlong:6});
export {ANALYTICS,tileAt};
const ramp=x=>{x=clamp(x,0,1);return x<.5?[40+x*170,130+x*180,195-x*230]:[225+(x-.5)*60,220-(x-.5)*340,80-(x-.5)*70];};
const metric=(t,o)=>({pollution:t.pollution/100,value:t.landValue/150,traffic:t.traffic/100,tax:t.taxRevenue/600,building:t.buildingValue/3e6,surface:(t.surfaceTemp+10)/70,air:(t.airTemp+10)/55,carbon:t.carbon/50,runoff:t.runoff,load:t.cableLoad/100}[o]??0);
function tint(t,o){if(t.burning)return [255,92,38];if(o==='power'||o==='water')return t[o==='power'?'powered':'watered']?[90,216,205]:[169,78,68];if(o==='transit')return t.transit?[193,141,231]:[75,89,105];return ramp(metric(t,o));}
// Procedural facade materials are an interim art pass. Real PBR assets use ScenegraphLayer below.
const textures=new Map();
function facade(night,type){const key=night+type;if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=type==='commercial'?'#a7b5b8':'#b7b4a9';ctx.fillRect(0,0,256,256);for(let y=0;y<16;y++)for(let x=0;x<12;x++){const lit=night&&(x*17+y*11)%7<3;const g=ctx.createLinearGradient(0,y*16,0,y*16+13);g.addColorStop(0,lit?'#ffd59b':night?'#10212d':'#849fa9');g.addColorStop(1,lit?'#c7aa76':night?'#1d3442':'#3e667d');ctx.fillStyle=g;ctx.fillRect(x*21+2,y*16+2,17,12);ctx.fillStyle='#d2d5cc';ctx.fillRect(x*21+10,y*16+2,1,12);}const texture={data:c,mipmaps:false};textures.set(key,texture);return texture;}
export function lighting(city,{shadows=true,selected=null}={}){const tilePosition=(t,x,y,z)=>worldTilePosition(t,x,y,z,city);const c=climate(city),warm=!c.night&&c.sunHeight<.35,lights={ambient:new deck.AmbientLight({color:c.night?[124,154,205]:[224,235,247],intensity:c.night?.45:.85}),sun:new deck.DirectionalLight({color:c.night?[147,179,219]:warm?[255,182,112]:[255,243,222],intensity:c.night?.25:['rain','snow','hail'].includes(c.weather)?.55:1.6,direction:c.night?[-1,-2,-4]:c.sunDirection,_shadow:shadows&&!c.night})};
 if(c.night){const target=city.tiles[selected??((city.center?.[1]||16)*(city.width||32)+(city.center?.[0]||16))];const nearest=city.tiles.filter(t=>t.type==='road'&&t.powered&&t.id%4===0).sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y)).slice(0,4);nearest.forEach((t,i)=>lights['street'+i]=new deck.PointLight({position:tilePosition(t,.3,.4,9),color:[255,203,141],intensity:2,attenuation:[1,0,.015]}));}const effect=new deck.LightingEffect(lights);effect.id=shadows&&!c.night?'city-lighting-shadow':'city-lighting-plain';effect.shadowColor=[0,0,.04,.34];return effect;}
export function cityLayers(city,{overlay='city',selected=null,flat=false,underground=false,network='all',cutDepth=45,models=[],hover=null,tool='inspect',brush=1,demolition='surface',analysis={},cameraZoom=15,cameraCenter=null,onPick=()=>{},onError=()=>{}}={}){
 const position=(x,y,z=0)=>worldPosition(x,y,z,city),tilePosition=(t,x=.5,y=.5,z=0)=>worldTilePosition(t,x,y,z,city),nearby=id=>neighbors(id,city),square=(t,inset=0,z=0)=>[[inset,inset],[1-inset,inset],[1-inset,1-inset],[inset,1-inset]].map(([x,y])=>position(t.x+x,t.y+y,terrainHeight(city,t.x+x,t.y+y)+z));
 const tiles=city.tiles,e=climate(city),snow=e.weather==='snow',analytical=overlay!=='city',colorBuildings=analytical&&!['traffic','transit','population','density','wind','parking','load'].includes(overlay);
 const pick=info=>{const id=info.object?.tileId??info.object?.id??tileAt(info.coordinate,city);if(Number.isInteger(id)){onPick(id);return true;}return false;};
 const roads=new Set(tiles.filter(t=>['road','toll','bus','subway','bridge','elevatedStation'].includes(t.type)).map(t=>t.id));
 const ground=new deck.PolygonLayer({id:'city-parcels',data:tiles.slice(),pickable:true,onClick:pick,autoHighlight:true,highlightColor:[166,232,198,70],getPolygon:t=>square(t,0,underground?-cutDepth:0),extruded:!underground,getElevation:t=>t.elevation?-.01:0,getFillColor:t=>underground?[26,36,44]:t.terrain==='water'?(e.night?[12,37,53]:[35,108,129]):snow?[206,220,222]:roads.has(t.id)?[50,57,61]:t.type==='empty'?[88+t.id%8,117+t.id%5,83]:[129,134,125],stroked:underground,lineWidthUnits:'pixels',getLineWidth:.5,getLineColor:[54,72,80],material:{ambient:.6,diffuse:.7,shininess:20}});
 const layers=city.width?terrainLayers(city,{underground,cutDepth,snow,onClick:pick}):[ground],blocks=[],caps=[],trees=[],trunks=[],paths=[],lanes=[],lamps=[];
 const survey=city.width?terrainSurvey(city):null;
 // A zone must be visible before it has residents or a completed building.
 if(!underground)layers.push(new deck.PolygonLayer({id:'zoned-plots',data:tiles.filter(t=>ZONE_TYPES.includes(t.type)&&(flat||t.level<=1&&t.age===0)),getPolygon:t=>square(t,.05,1),getFillColor:t=>t.type==='industrial'?[224,165,67,210]:['commercial','skyscraper'].includes(t.type)?[61,157,225,210]:[52,197,121,210],getLineColor:[222,245,225],stroked:true,getLineWidth:1.5,lineWidthUnits:'pixels',pickable:true,onClick:pick,material:false}));
 const customTypes=new Set(models.map(m=>m.type));
 for(const t of tiles){
  if(roads.has(t.id))for(const n of nearby(t.id))if(n>t.id&&roads.has(n)&&!(t.type==='bridge'&&tiles[n].type==='bridge')){paths.push({path:[tilePosition(t,.5,.5,t.type==='bridge'?18:1),tilePosition(tiles[n],.5,.5,tiles[n].type==='bridge'?18:1)],phase:Math.max(t.level||1,tiles[n].level||1)});lanes.push({path:[tilePosition(t,.5,.5,t.type==='bridge'?18.1:1.1),tilePosition(tiles[n],.5,.5,tiles[n].type==='bridge'?18.1:1.1)]});}
  if(underground)continue;
  if(ART_REGISTRY[t.type]&&!roads.has(t.id))continue;
  if(t.siteRoot!==undefined&&t.type==='empty')continue;
  if(t.type==='road'&&t.id%3===0){trunks.push({tileId:t.id,position:tilePosition(t,.28,.3,4.5),scale:[.2,.2,4.5],color:[96,108,111]});if(e.night&&t.powered)lamps.push({position:tilePosition(t,.28,.3,9),ground:tilePosition(t,.28,.3,1.3)});}
  const natural=survey&&t.type==='empty'&&t.terrain==='land'&&t.siteRoot===undefined&&survey.forest[t.id]>.20;
  const nearCamera=!cameraCenter||Math.hypot(t.x-cameraCenter[0],t.y-cameraCenter[1])*(city.cellSize||50)<1500;
  if(['park','forest','wetland','arcology'].includes(t.type)||natural&&(cameraZoom<13?t.id%17===0:nearCamera)||!city.width&&t.type==='empty'&&t.terrain==='land'&&t.id%11===0){
   const count=natural?(cameraZoom<13?1:Math.max(1,Math.round(survey.forest[t.id]*3))):3;
   for(let k=0;k<count;k++){const x=.08+terrainHash(t.id,k,city.seed+31)*.84,y=.08+terrainHash(t.id,k,city.seed+89)*.84,r=4+terrainHash(k,t.id,city.seed+7)*5,z=terrainHeight(city,t.x+x,t.y+y),color=snow?[195,211,195]:e.season==='autumn'?[[147,103,44],[160,123,54],[108,95,47]][k%3]:[[66,87,43],[55,78,39],[79,98,51]][k%3];
    trees.push({tileId:t.id,position:position(t.x+x,t.y+y,z+(flat?1:9)),scale:flat?[r,r,.5]:[r,r,8+terrainHash(t.id,k,city.seed)*5],color});
    if(cameraZoom>=14)trunks.push({tileId:t.id,position:position(t.x+x,t.y+y,z+4),scale:[.55,.55,4],color:[95,83,58]});
   }if(t.type!=='arcology')continue;
  }
  if(!flat&&ZONE_TYPES.includes(t.type)&&t.level<=1){blocks.push({tileId:t.id,type:'foundation',powered:false,position:tilePosition(t,.5,.5,1.6),scale:[14,12,1.5],color:[193,204,188]});for(let k=0;k<4;k++)caps.push({tileId:t.id,position:tilePosition(t,.24+k*.17,.25,3.8),scale:[.5,.5,2],color:[237,191,81]});continue;}
  if(!t.level||flat||isSpecial(t)||['mall','stripmall','mixeduse','hotel','casino','bank','ferris','toll'].includes(t.type)||roads.has(t.id)||customTypes.has(t.type))continue;
  const industrial=t.type==='industrial',commercial=t.type==='commercial',residential=t.type==='residential';
  const form=buildingForm(t),height=form.height,width=form.width;
  const color=colorBuildings?analyticColor(t,overlay,city,analysis):industrial?[149,145,129]:[185,194,191];
  blocks.push({tileId:t.id,type:t.type,powered:t.powered,position:tilePosition(t,.5,.5,height/2+1),scale:[width,width*.85,height/2],color});
  for(let tier=0;tier<form.tiers;tier++)caps.push({tileId:t.id,position:tilePosition(t,.5,.5,6+tier*height/(form.tiers+1)),scale:[width+1.5,width*.85+1.5,.6],color:tier%2?[113,156,132]:[207,214,205]});
  caps.push({tileId:t.id,position:tilePosition(t,.5,.5,height+1.3),scale:[width+.2,width*.85+.2,.8],color:snow?[232,239,239]:t.id%100<(city.design?.greenRoofs||0)?[84,139,85]:t.id%100<(city.design?.coolSurfaces||0)?[219,221,210]:[127,139,137]});
  caps.push({tileId:t.id,position:tilePosition(t,.57,.56,height+3),scale:[3,3,2],color:[147,153,151]});
  for(let floor=1;floor<Math.floor(height/3.8);floor++)caps.push({tileId:t.id,position:tilePosition(t,.5,.5,1+floor*3.8),scale:[width+.3,width*.85+.3,.13],color:[148,163,166]});
  for(let k=0;k<3;k++)caps.push({tileId:t.id,position:tilePosition(t,.37+k*.13,.4,height+2.2),scale:[1.6,2.1,.8],color:[184,192,185]});
  caps.push({tileId:t.id,position:tilePosition(t,.5,.21,3.4),scale:[width*.65,3,.3],color:[209,214,202]});
  if(industrial||t.type==='power')caps.push({tileId:t.id,position:tilePosition(t,.77,.63,25),scale:[2.2,2.2,24],color:[181,170,152]});
 }
 const shared={mesh:cube,getPosition:d=>d.position,getScale:d=>d.scale,getColor:d=>d.color,pickable:true,onClick:pick,material:{ambient:.5,diffuse:.8,shininess:e.weather==='rain'?100:35,specularColor:[100,125,135]}};
 if(!underground){layers.push(new deck.PathLayer({id:'street-sidewalks',data:paths,getPath:d=>d.path,getColor:snow?[212,220,216]:[155,161,153],getWidth:d=>23+(d.phase||1)*.5,capRounded:false}));layers.push(new deck.PathLayer({id:'streets',data:paths,getPath:d=>d.path.map(p=>[p[0],p[1],p[2]+.05]),getColor:snow?[179,190,192]:e.weather==='rain'?[36,47,54]:[49,57,62],getWidth:d=>15+(d.phase||1)*.5,capRounded:false}),new deck.PathLayer({id:'street-markings',data:lanes,getPath:d=>d.path,getColor:[185,179,137],getWidth:.45,widthMinPixels:.5}));
 for(const type of ['residential','commercial','other'])for(const powered of [false,true])layers.push(new deck.SimpleMeshLayer({id:'buildings-'+type+'-'+powered,...shared,data:blocks.filter(b=>b.powered===powered&&(type==='other'?!['residential','commercial'].includes(b.type):b.type===type)),texture:!colorBuildings&&type!=='other'?facade(e.night&&powered,type):null,textureParameters:TEXTURE_PARAMETERS,material:e.night&&powered?false:shared.material}));
 layers.push(new deck.SimpleMeshLayer({id:'roofs-and-equipment',...shared,data:caps}),new deck.SimpleMeshLayer({id:'tree-trunks',...shared,data:trunks}),new deck.SimpleMeshLayer({id:'tree-canopies',...shared,data:trees,mesh:canopy}));
 layers.push(new deck.ScatterplotLayer({id:'street-lamps',data:lamps,getPosition:d=>d.position,getRadius:.8,radiusMinPixels:1.2,getFillColor:[255,222,167],billboard:true}),new deck.ScatterplotLayer({id:'lamp-pools',data:lamps,getPosition:d=>d.ground,getRadius:10,getFillColor:[255,195,111,24],parameters:{depthMask:false}}));
 if(!flat&&!underground)layers.push(...artLayers(city,{onPick,overlay,analysis,cameraZoom,cameraCenter:cameraCenter||city.center||[17,17],hiddenTypes:customTypes}));
 if(!flat)layers.push(...landmarkLayers(city,{onPick,underground,hiddenTypes:new Set([...customTypes,...Object.keys(ART_REGISTRY)]),overlay,analysis}));
 if(!flat)for(const [i,m] of models.entries())layers.push(new deck.ScenegraphLayer({id:'custom-model-'+i,data:tiles.filter(t=>t.type===m.type&&t.level&&(!ZONE_TYPES.includes(t.type)||t.level>1)),scenegraph:m.url,getPosition:t=>tilePosition(t,.5,.5,0),getOrientation:[0,m.rotation||0,90],getScale:t=>[.7+t.level*.03,.7+t.level*.03,.35+t.level*.065],sizeScale:m.scale||1,_lighting:'pbr',pickable:true,onClick:pick,onError:error=>onError('Model could not render: '+error.message)}));
 }
 if(underground)layers.push(...artLayers(city,{onPick,overlay,analysis,cameraZoom,cameraCenter:cameraCenter||city.center||[17,17],underground,network,cutDepth}));
 // Separate engineering levels. Depth slider exposes conduits from shallow cables to deep tunnels.
 const defs={wire:{depth:3,color:[252,205,89],live:'wireLive'},pipe:{depth:6,color:[68,197,244],live:'pipeLive'},tunnel:{depth:18,color:[193,133,236]},drain:{depth:35,color:[230,132,80],live:'drainLive'},elevated:{depth:-18,color:[176,172,235]}};
 if(underground||['power','water','transit','load'].includes(overlay))for(const [key,v] of Object.entries(defs)){
  if(underground&&(network!=='all'&&network!==key||v.depth>cutDepth)||!underground&&(overlay==='water'?key!=='pipe':overlay==='transit'?!['tunnel','elevated'].includes(key):key!=='wire'))continue;
  const edges=[],nodes=[];for(const t of tiles.filter(t=>t[key])){const z=underground?-v.depth:3;const color=v.live&&!t[v.live]?[122,76,72]:v.color;nodes.push({id:t.id,position:tilePosition(t,.5,.5,z),color,phase:networkLevel(t,key)});for(const n of nearby(t.id))if(n>t.id&&tiles[n][key])edges.push({tileId:t.id,path:[tilePosition(t,.5,.5,z),tilePosition(tiles[n],.5,.5,z)],color,phase:networkLevel(t,key)});}
  layers.push(new deck.PathLayer({id:'network-'+key,data:edges,getPath:d=>d.path,getColor:d=>d.color,getWidth:d=>(key==='drain'?5:2)+d.phase*.25,widthMinPixels:2,pickable:true,onClick:pick,parameters:{depthTest:underground}}),new deck.ScatterplotLayer({id:'junction-'+key,data:nodes,getPosition:d=>d.position,getFillColor:d=>d.color,getRadius:d=>2+d.phase*.25,radiusMinPixels:3,pickable:true,onClick:pick}));
 }
 if(analytical)layers.push(...analyticsLayers(city,overlay,{...analysis,underground,cutDepth,onPick}));
 layers.push(new deck.PolygonLayer({id:'selected-parcel',data:selected===null?[]:siteTiles(city,tiles[tiles[selected].siteRoot??selected]).map(i=>tiles[i]),getPolygon:t=>square(t,0,underground?-cutDepth+.5:3),getFillColor:[223,255,239,35],getLineColor:[231,255,241],getLineWidth:2,lineWidthUnits:'pixels',stroked:true,parameters:{depthTest:false}}));
 if(hover!==null&&tiles[hover]&&tool!=='inspect'){
  const target=tool==='bulldoze'?demolition:tool,depth=underground?({pipe:6,wire:3,tunnel:18,drain:35,elevated:-18}[target]??cutDepth):0,r=brush===3?1:0,t=tiles[hover],{width,height}=dimensions(city),outline=[];
  const root=tiles[t.siteRoot??t.id],size=SITE_SIZES[tool],badSite=size&&!inspectSite(city,t.id,tool).ok;
  if(tool==='bulldoze'&&root.siteWidth)outline.push(...siteTiles(city,root).map(i=>tiles[i]));
  else if(size){for(let y=t.y;y<Math.min(height,t.y+size[1]);y++)for(let x=t.x;x<Math.min(width,t.x+size[0]);x++)outline.push(tiles[y*width+x]);}
  else for(let y=Math.max(0,t.y-r);y<=Math.min(height-1,t.y+r);y++)for(let x=Math.max(0,t.x-r);x<=Math.min(width-1,t.x+r);x++)outline.push(tiles[y*width+x]);
  layers.push(new deck.PolygonLayer({id:'construction-preview',data:outline,getPolygon:t=>square(t,0,-depth+.7),getFillColor:tool==='bulldoze'||badSite?[255,102,74,48]:[108,242,181,45],getLineColor:tool==='bulldoze'||badSite?[255,135,102]:[143,255,208],getLineWidth:2,lineWidthUnits:'pixels',stroked:true,parameters:{depthTest:false},pickable:false}));
 }
 return layers;
}
export function makeSceneLayer(url,{onLoad,onTile,onError}){return new deck.Tile3DLayer({id:'i3s-reference-scene',data:url,loader:window.cityLoaders.I3SLoader,pickable:false,loadOptions:{worker:false,CDN:'https://unpkg.com/@loaders.gl',i3s:{loadContent:true},tileset:{maximumMemoryUsage:192,maximumScreenSpaceError:12}},onTilesetLoad:onLoad,onTileLoad:onTile,onTileError:(_tile,_url,message)=>onError(message),onError:error=>onError(error.message)});}
