import {noise,terrainHash,clamp} from './terrain.mjs';
import {dimensions} from './grid.mjs';
const cache=new WeakMap();
export function terrainSurvey(city){
 const key=`${city.terrainRevision||0}:${city.terrainConfig?.forest??1}`,old=cache.get(city);if(old?.key===key)return old;
 const {width:w,height:h,cellSize}=dimensions(city),n=w*h,heights=new Float32Array(n),slope=new Float32Array(n),forest=new Float32Array(n),coast=new Float32Array(n),wet=city.tiles.map(t=>t.terrain==='water');
 for(let i=0;i<n;i++){heights[i]=(city.tiles[i].elevation||0)*6;coast[i]=1e4;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;for(const j of [x?i-1:i,x<w-1?i+1:i,y?i-w:i,y<h-1?i+w:i])if(wet[j]!==wet[i])coast[i]=.5;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x)coast[i]=Math.min(coast[i],coast[i-1]+1);if(y)coast[i]=Math.min(coast[i],coast[i-w]+1);}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(x<w-1)coast[i]=Math.min(coast[i],coast[i+1]+1);if(y<h-1)coast[i]=Math.min(coast[i],coast[i+w]+1);}
 let water=0,gentle=0,woodland=0,maxElevation=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,t=city.tiles[i],z=heights[i],sx=(heights[y*w+Math.min(w-1,x+1)]-heights[y*w+Math.max(0,x-1)])/(cellSize*2),sy=(heights[Math.min(h-1,y+1)*w+x]-heights[Math.max(0,y-1)*w+x])/(cellSize*2);slope[i]=Math.hypot(sx,sy);maxElevation=Math.max(maxElevation,z);if(wet[i]){water++;continue;}if(slope[i]<=.12)gentle++;
 const moisture=noise(x*.042,y*.042,city.seed+601)*.65+noise(x*.13,y*.13,city.seed+97)*.35;
 forest[i]=clamp((moisture-.30)*2.8)*(city.terrainConfig?.forest??1)*clamp(1-slope[i]*.8)*clamp((1700-z)/500)*clamp(coast[i]/2)*(city.biome==='desert'?.08:1);
 if(t.type&&t.type!=='empty'||t.siteRoot!==undefined)forest[i]=0;if(forest[i]>.35)woodland++;
 }
 const result={key,width:w,height:h,heights,slope,forest,coast,waterPercent:water/n*100,gentlePercent:gentle/n*100,forestPercent:woodland/n*100,maxElevation,areaKm2:n*cellSize*cellSize/1e6};cache.set(city,result);return result;
}
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*clamp(t));
export function terrainColor(city,id,{snow=false,survey=terrainSurvey(city)}={}){
 const t=city.tiles[id],z=survey.heights[id],slope=survey.slope[id],coast=survey.coast[id],forest=survey.forest[id],grain=terrainHash(t.x,t.y,city.seed)*10-5;
 if(t.terrain==='water'){return mix([63,130,143],[26,57,78],Math.min(1,coast/8)).map(v=>v+grain*.25);}
 const sand=city.biome==='desert'?[191,161,110]:[167,162,121],grass=city.biome==='desert'?[155,131,88]:city.biome==='alpine'?[111,122,78]:[116,133,74];
 let c=mix(sand,grass,coast/2.3);c=mix(c,city.biome==='desert'?[124,111,72]:[52,79,43],forest*.80);
 if(slope>.20||z>650)c=mix(c,city.biome==='desert'?[154,114,81]:[139,138,121],Math.max((slope-.2)*1.7,(z-650)/1250));
 if(snow||city.biome==='alpine'&&z>1100)c=mix(c,[224,230,221],snow?.83:clamp((z-1100)/380)*(1-clamp(slope-.7)));
 return c.map(v=>clamp(v+grain,0,255));
}
export function terrainSignature(city){let a=2166136261;for(const t of city.tiles){a=Math.imul(a^Math.round(t.elevation*10),16777619);a=Math.imul(a^(t.terrain==='water'?1:0),16777619);}return (a>>>0).toString(16).padStart(8,'0');}
// Browser-only atlas. Shared by the CPU map atlas and the actual 3D ground material.
export function terrainAtlas(city,snow=false){const s=terrainSurvey(city),key=snow?'snowAtlas':'atlas';if(s[key])return s[key];const scale=4,c=document.createElement('canvas');c.width=s.width*scale;c.height=s.height*scale;const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);
 const rgb=new Float32Array(city.tiles.length*3);for(let id=0;id<city.tiles.length;id++)rgb.set(terrainColor(city,id,{survey:s,snow}),id*3);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const gx=x/scale-.5,gy=y/scale-.5,x0=Math.floor(gx),y0=Math.floor(gy),u=gx-x0,v=gy-y0,get=(dx,dy,k)=>rgb[(Math.max(0,Math.min(s.height-1,y0+dy))*s.width+Math.max(0,Math.min(s.width-1,x0+dx)))*3+k],grain=(terrainHash(x,y,city.seed+512)-.5)*7,i=(y*c.width+x)*4;for(let k=0;k<3;k++)im.data[i+k]=((get(0,0,k)*(1-u)+get(1,0,k)*u)*(1-v)+(get(0,1,k)*(1-u)+get(1,1,k)*u)*v)+grain;im.data[i+3]=255;}
 // Raster canopy flecks avoid hundreds of thousands of Canvas draw calls.
 for(const t of city.tiles){const d=s.forest[t.id];if(d<.15||t.type&&t.type!=='empty')continue;for(let k=0;k<Math.floor(d*7);k++){const x=Math.min(c.width-2,Math.floor((t.x+terrainHash(t.id,k,city.seed+13))*scale)),y=Math.min(c.height-2,Math.floor((t.y+terrainHash(t.id,k,city.seed+47))*scale)),i=(y*c.width+x)*4,j=((y+1)*c.width+x+1)*4;for(let channel=0;channel<3;channel++){im.data[j+channel]*=.75;im.data[i+channel]=im.data[i+channel]*.7+(snow?[210,224,205]:[86,111,55])[channel]*.3;}}}
 ctx.putImageData(im,0,0);
 s[key]=c;return c;
}
