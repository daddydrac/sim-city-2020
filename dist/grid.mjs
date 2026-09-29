export const LEGACY_GRID={width:32,height:32,cellSize:50,origin:[-122.42,37.77]};
export const dimensions=city=>({width:city?.width||32,height:city?.height||32,cellSize:city?.cellSize||50});
export const gridIndex=(x,y,city)=>y*(city?.width||32)+x;
export function adjacent(id,city){
 const {width,height}=dimensions(city),x=id%width,y=Math.floor(id/width),out=[];
 if(x>0)out.push(id-1);if(x<width-1)out.push(id+1);if(y>0)out.push(id-width);if(y<height-1)out.push(id+width);return out;
}
export function eachNearby(city,t,r,fn){
 const {width,height}=dimensions(city);
 for(let y=Math.max(0,t.y-r);y<=Math.min(height-1,t.y+r);y++)for(let x=Math.max(0,t.x-r);x<=Math.min(width-1,t.x+r);x++){
  const distance=Math.abs(t.x-x)+Math.abs(t.y-y);if(distance<=r)fn(city.tiles[y*width+x],distance);
 }
}
export function influence(city,sources,radius,weight=()=>1){
 const result=new Float32Array(city.tiles.length);
 for(const source of sources){const r=typeof radius==='function'?radius(source):radius;eachNearby(city,source,Math.ceil(r),(tile,d)=>{if(d<r)result[tile.id]+=weight(source,d,r);});}
 return result;
}
