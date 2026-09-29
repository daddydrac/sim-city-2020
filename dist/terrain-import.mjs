import {createRegion,analyze} from './engine.mjs';
import {REGION} from './terrain.mjs';
const numeric=v=>v!==null&&v!==''&&Number.isFinite(Number(v));
const water=v=>v===true||v===1||['true','water','1'].includes(String(v).toLowerCase());
export function importTerrain(data,{name='Imported region'}={}){
 let samples=[],polygons=[],geographic=false;
 if(data?.type==='FeatureCollection'){
  if(!Array.isArray(data.features)||data.features.length>100000)throw Error('Use at most 100,000 terrain features.');geographic=true;let coordinates=0;
  for(const f of data.features){const g=f.geometry,p=f.properties||{};if(!g)continue;if(g.type==='Point'&&numeric(p.elevation_m??g.coordinates[2]))samples.push({x:g.coordinates[0],y:g.coordinates[1],h:Number(p.elevation_m??g.coordinates[2]),water:water(p.water)});else if(g.type==='Polygon'&&water(p.water)){coordinates+=g.coordinates.flat().length;if(coordinates>20000||polygons.length>=100)throw Error('Simplify water polygons to 100 features and 20,000 vertices.');if(!Array.isArray(g.coordinates)||g.coordinates.some(r=>!Array.isArray(r)||r.length<4||r.some(p=>!Array.isArray(p)||p.length<2||!p.slice(0,2).every(Number.isFinite))))throw Error('Invalid water polygon.');polygons.push(g.coordinates);}}
 }else if(data?.fields&&Array.isArray(data.rows)){
  const names=data.fields.map(f=>f.name.toLowerCase()),field=name=>names.indexOf(name);let xi=field('x'),yi=field('y'),hi=field('elevation_m'),wi=field('water');if(xi<0||yi<0){xi=field('longitude');yi=field('latitude');geographic=true;}if(xi<0||yi<0||hi<0)throw Error('CSV needs x,y,elevation_m or longitude,latitude,elevation_m. Optional water: 0/1.');
  if(data.rows.length>100000)throw Error('Use at most 100,000 elevation samples.');samples=data.rows.map(r=>({x:Number(r[xi]),y:Number(r[yi]),h:Number(r[hi]),water:wi>=0&&water(r[wi]),valid:numeric(r[xi])&&numeric(r[yi])&&numeric(r[hi])}));
 }else throw Error('Use a CSV table or GeoJSON FeatureCollection.');
 if(samples.length<4||samples.some(s=>s.valid===false||![s.x,s.y,s.h].every(Number.isFinite)||s.h<0||s.h>3000))throw Error('Provide at least four valid samples. Elevations must be 0–3,000 meters.');
 const xs=samples.map(s=>s.x),ys=samples.map(s=>s.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);if(maxX<=minX||maxY<=minY)throw Error('Elevation samples must span an area in both directions.');
 let origin=[-122.42,37.77],width=REGION.width,height=REGION.height,cellSize=REGION.cellSize;
 if(geographic){if(minX< -179||maxX>179||minY< -75||maxY>75)throw Error('Use local longitude/latitude coordinates within ±75° latitude.');origin=[(minX+maxX)/2,(minY+maxY)/2];const xm=(maxX-minX)*111320*Math.cos(origin[1]*Math.PI/180),ym=(maxY-minY)*111320;cellSize=Math.max(25,xm/256,ym/192);if(cellSize>100)throw Error('Use a region no larger than 25.6 × 19.2 km.');width=Math.max(32,Math.round(xm/cellSize));height=Math.max(32,Math.round(ym/cellSize));}
 else if(samples.some(s=>s.x<0||s.y<0||s.x>255||s.y>191))throw Error('Grid coordinates must be x: 0–255 and y: 0–191.');
 const city=createRegion('estuary',{starter:false,width,height,cellSize,origin,name:name.slice(0,40)});city.preset='imported';city.biome='temperate';
 const convert=s=>geographic?{...s,x:(s.x-minX)/(maxX-minX)*(width-1),y:(s.y-minY)/(maxY-minY)*(height-1)}:s;
 samples=samples.map(convert);const bins=new Map(),bucket=8;for(const s of samples){const key=`${Math.floor(s.x/bucket)},${Math.floor(s.y/bucket)}`;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(s);}
 const candidateCache=new Map();
 const nearest=(x,y)=>{const bx=Math.floor(x/bucket),by=Math.floor(y/bucket);const cacheKey=`${bx},${by}`;let candidates=candidateCache.get(cacheKey);if(!candidates){candidates=samples.length<=32?samples:[];for(let r=0;r<40&&samples.length>32;r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(r===0||Math.abs(dx)===r||Math.abs(dy)===r)candidates.push(...(bins.get(`${bx+dx},${by+dy}`)||[]));if(candidates.length>=4&&r>0)break;}candidateCache.set(cacheKey,candidates);}return candidates.map(s=>({...s,d:Math.hypot(s.x-x,s.y-y)})).sort((a,b)=>a.d-b.d).slice(0,4);};
 const ringContains=(ring,x,y)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 for(const t of city.tiles){const closest=nearest(t.x,t.y);if(!closest.length)throw Error('Terrain samples could not be interpolated.');let h=0,w=0;for(const s of closest){const weight=1/Math.max(.0001,s.d*s.d);h+=s.h*weight;w+=weight;}t.elevation=Math.round(h/w/6*10)/10;t.terrain=closest[0].water?'water':'land';if(polygons.length){const x=minX+t.x/(width-1)*(maxX-minX),y=minY+t.y/(height-1)*(maxY-minY);if(polygons.some(rings=>ringContains(rings[0],x,y)&&!rings.slice(1).some(r=>ringContains(r,x,y))))t.terrain='water';}if(t.terrain==='water')t.elevation=0;}
 const land=city.tiles.filter(t=>t.terrain==='land');if(!land.length)throw Error('The imported map has no buildable land.');const center=land.reduce((a,t)=>Math.hypot(t.x-width/2,t.y-height/2)<Math.hypot(a.x-width/2,a.y-height/2)?t:a);city.center=[center.x,center.y];city.terrainRevision++;analyze(city);return city;
}
