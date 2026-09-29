import {dimensions} from './grid.mjs';
import {terrainColor,terrainSurvey} from './terrain-style.mjs';
// Marching triangles clip a continuous shoreline through the tile-centre mask.
// The map still uses its exact parcel mask for construction and import/export.
export function waterMeshFor(city){
 const {width,height,cellSize}=dimensions(city),survey=terrainSurvey(city),p=[],n=[],colors=[],uv=[];
 const sample=(x,y)=>{const t=city.tiles[Math.max(0,Math.min(height-1,Math.floor(y)))*width+Math.max(0,Math.min(width-1,Math.floor(x)))];return {x,y,wet:t.terrain==='water'?1:0,color:terrainColor(city,t.id,{survey})};};
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,wet:.5,color:a.color.map((v,k)=>(v+b.color[k])/2)});
 const triangle=vertices=>{const poly=[];for(let k=0;k<3;k++){const a=vertices[k],b=vertices[(k+1)%3];if(a.wet>.5)poly.push(a);if((a.wet>.5)!==(b.wet>.5))poly.push(midpoint(a,b));}for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){p.push((v.x-width/2)*cellSize,(v.y-height/2)*cellSize,.42);n.push(0,0,1);colors.push(...v.color.map(q=>q/255));uv.push(v.x/width,v.y/height);}};
 // Border samples include the boundary so water continues to regional edges.
 const xs=[0,...Array.from({length:width},(_,i)=>i+.5),width],ys=[0,...Array.from({length:height},(_,i)=>i+.5),height],samples=ys.map(y=>xs.map(x=>sample(x,y)));
 for(let y=0;y<ys.length-1;y++)for(let x=0;x<xs.length-1;x++){const a=samples[y][x],b=samples[y][x+1],c=samples[y+1][x],d=samples[y+1][x+1];if(!a.wet&&!b.wet&&!c.wet&&!d.wet)continue;triangle([a,b,d]);triangle([a,d,c]);}
 return {attributes:{positions:{value:new Float32Array(p),size:3},normals:{value:new Float32Array(n),size:3},colors:{value:new Float32Array(colors),size:3},texCoords:{value:new Float32Array(uv),size:2}}};
}
