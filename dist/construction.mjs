import {dimensions,gridIndex} from './grid.mjs';
import {build,terraform,removeNetwork} from './engine.mjs';
export const isPaintTool=tool=>!['inspect','bridge'].includes(tool);
// Grid traversal visits a four-connected path, including cells crossed between events.
export function gridLine(a,b){let x=a.x,y=a.y;const dx=b.x-x,dy=b.y-y,nx=Math.abs(dx),ny=Math.abs(dy),sx=Math.sign(dx),sy=Math.sign(dy),cells=[[x,y]];let ix=0,iy=0;
 while(ix<nx||iy<ny){if(ix<nx&&(iy===ny||(1+2*ix)*ny<=(1+2*iy)*nx)){x+=sx;ix++;}else{y+=sy;iy++;}cells.push([x,y]);}return cells;
}
export function beginStroke(city,tool,{radius=0,demolition='surface',height=0}={}){return {city,tool,radius,demolition,height,visited:new Set(),last:null,placed:0,cost:0,reason:''};}
export function extendStroke(stroke,id){const {city,tool,radius}=stroke,t=city.tiles[id];if(!t){stroke.last=null;return 0;}const {width,height}=dimensions(city),line=stroke.last===null?[[t.x,t.y]]:gridLine(city.tiles[stroke.last],t);let changed=0;
 for(const [cx,cy]of line)for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++){
  if(x<0||y<0||x>=width||y>=height)continue;const target=gridIndex(x,y,city);if(stroke.visited.has(target))continue;stroke.visited.add(target);const before=city.cash;
  const result=tool==='bulldoze'&&stroke.demolition!=='surface'?removeNetwork(city,target,stroke.demolition,{analyzeAfter:false}):['flatten','raise','lower','reclaim'].includes(tool)?terraform(city,target,tool,stroke.height,{analyzeAfter:false}):build(city,target,tool,{analyzeAfter:false});
  if(result.ok){changed++;stroke.placed++;stroke.cost+=before-city.cash;}else stroke.reason=result.message;
 }
 stroke.last=id;return changed;
}
