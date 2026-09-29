import {position as worldPosition,tilePosition as worldTilePosition,terrainHeight} from './geo.mjs';
import {dimensions} from './grid.mjs';
import {launchState} from './launch.mjs';
import {analyticColor,eligible} from './analytics.mjs';
import {climate} from './climate.mjs';
import {neighbors} from './engine.mjs';
import {ZONE_TYPES,networkLevel} from './development.mjs';
const {deck,cityLuma:luma}=window;
const cube=new luma.CubeGeometry(),sphere=new luma.SphereGeometry({nlat:12,nlong:20}),cone=new luma.ConeGeometry({radius:1,height:2,verticalAxis:'z',nradial:12}),cylinder=new luma.CylinderGeometry({radius:1,height:2,verticalAxis:'z',nradial:16});
const special=new Set(['arcology','skyscraper','landmark','spaceport','port','solar','hydrogen','dam','reservoir','airport','elevatedStation','parking','garage']);
export const isSpecial=t=>special.has(t.type);
const objectFor=city=>(tile,dx,dy,z,scale,color,orientation=[0,0,0])=>({tileId:tile.id,position:worldTilePosition(tile,dx,dy,z,city),scale,color,orientation});
export function landmarkLayers(city,{onPick,underground=false,hiddenTypes=new Set(),overlay='city',analysis={}}={}){
 const object=objectFor(city),tilePosition=(t,x,y,z)=>worldTilePosition(t,x,y,z,city),nearby=id=>neighbors(id,city);
 if(underground)return [];
 const boxes=[],balls=[],cones=[],tubes=[],glass=[],paths=[];
 const white=[211,224,226],glassColor=[96,187,203,85],night=climate(city).night;
 const tree=(t,x,y,z=0)=>{tubes.push(object(t,x,y,z+3,[.6,.6,3],[101,83,55]));balls.push(object(t,x,y,z+8,[4,4,6],[49,148,91]));};
 for(const t of city.activeTiles||city.tiles){if(hiddenTypes.has(t.type)||ZONE_TYPES.includes(t.type)&&t.level<=1)continue;const firstPath=paths.length;
  if(t.type==='skyscraper'){
   const h=110+t.level*25;for(let k=0;k<10;k++){const a=k*.08,dx=.5+Math.sin(k*.5)*.045;boxes.push(object(t,dx,.5,k*h/10+h/20,[17-k*.5,14-k*.4,h/20],[76+k*3,119+k*3,137+k*3],[0,0,k*3]));boxes.push(object(t,dx,.5,k*h/10+1,[17.5-k*.5,14.5-k*.4,.55],night?[158,236,246]:white,[0,0,k*3]));}paths.push({path:[tilePosition(t,.5,.5,h),tilePosition(t,.5,.5,h+38)],color:white,width:1.5});
  }else if(t.type==='arcology'){
   for(let k=0;k<4;k++){tubes.push(object(t,.5,.5,8+k*21,[21-k,21-k,6],[115,149,139]));for(let j=0;j<7;j++){const a=j/7*Math.PI*2;tree(t,.5+Math.cos(a)*.25,.5+Math.sin(a)*.25,14+k*21);}}
   glass.push(object(t,.5,.5,88,[23,23,19],glassColor));for(let j=0;j<8;j++){const a=j*Math.PI/8;paths.push({path:Array.from({length:19},(_,i)=>{const b=i/18*Math.PI;return tilePosition(t,.5+Math.cos(b)*Math.cos(a)*.46,.5+Math.cos(b)*Math.sin(a)*.46,88+Math.sin(b)*19);}),color:white,width:.8});}
  }else if(t.type==='landmark'){
   boxes.push(object(t,.5,.5,3,[24,18,3],[190,203,199]));for(let k=0;k<12;k++)paths.push({path:Array.from({length:20},(_,i)=>{const a=i/19*Math.PI;return tilePosition(t,.1+k*.07,.5+Math.cos(a)*.36,5+Math.sin(a)*(20+22*Math.sin(k/11*Math.PI)));}),color:[233,240,234],width:2.4});
  }else if(t.type==='spaceport'){
   tubes.push(object(t,.5,.5,2,[22,22,2],[94,106,116]));boxes.push(object(t,.8,.5,25,[2.5,2.5,25],white));tubes.push(object(t,.5,.5,16,[3,3,14],[234,239,235]));cones.push(object(t,.5,.5,32,[3,3,4],white));
  }else if(t.type==='port'){
   boxes.push(object(t,.5,.5,2,[24,24,2],[134,149,150]));for(let k=0;k<3;k++){boxes.push(object(t,.2+k*.25,.35,6,[4,11,4],[166+k*22,117,82]));paths.push({path:[tilePosition(t,.2+k*.25,.75,0),tilePosition(t,.2+k*.25,.75,28),tilePosition(t,.2+k*.25,1,28)],color:[235,190,88],width:2});}
  }else if(t.type==='solar'){
   for(let panel=0;panel<Math.min(12,(t.level||1)+2);panel++){const x=panel%3,y=Math.floor(panel/3);boxes.push(object(t,.18+x*.3,.12+y*.24,4,[5.5,5,.6],[44,93,152],[20,0,0]));tubes.push(object(t,.18+x*.3,.12+y*.24,2,[.5,.5,2],white));}
  }else if(t.type==='hydrogen'){
   for(let k=0;k<Math.min(5,2+Math.floor((t.level||1)/3));k++){tubes.push(object(t,.15+k*.17,.45,13,[4,4,12],[194,230,225]));balls.push(object(t,.15+k*.17,.45,25,[4,4,3],[161,217,210]));}boxes.push(object(t,.5,.8,6,[17,4,6],[99,156,157]));
  }else if(t.type==='reservoir'){
   tubes.push(object(t,.5,.5,3,[23,23,3],[166,179,171]));tubes.push(object(t,.5,.5,6,[20,20,.6],[58,146,180]));
  }else if(t.type==='dam'){
   boxes.push(object(t,.5,.5,19,[24,7,19],[180,191,183]));for(let k=0;k<4;k++)boxes.push(object(t,.14+k*.23,.5,22,[2,10,22],[202,211,205]));
  }else if(t.type==='airport'){
   boxes.push(object(t,.5,.5,1,[8,24,1],[94,103,110]));boxes.push(object(t,.85,.5,7,[4,13,7],white));for(let k=0;k<5;k++)boxes.push(object(t,.5,.1+k*.18,2.2,[.6,2,.1],[237,234,217]));
  }else if(t.type==='parking'||t.type==='garage'){
   const garage=t.type==='garage',floors=garage?1+Math.floor(t.level/2):1,half=city.cellSize?28:22;
   const coords=(x,y)=>[.5+x/(city.cellSize||50),.5+y/(city.cellSize||50)];
   for(let floor=0;floor<floors;floor++){
    const z=1+floor*3.7;boxes.push(object(t,.5,.5,z,[half,half,.5],garage?[159,168,166]:[51,61,67]));
    for(const x of [-half+1,half-1])for(const y of [-half+1,0,half-1]){const [u,v]=coords(x,y);if(garage)boxes.push(object(t,u,v,z+1.8,[.6,.6,1.8],[202,212,205]));}
    const slots=8+Math.floor(t.level/3),occupied=Math.round(slots*4*(t.parkingUsed||0)/Math.max(1,t.parkingCapacity||1));
    for(let row=0;row<4;row++)for(let bay=0;bay<slots;bay++){
     const x=(bay-(slots-1)/2)*2.7,y=[-half+4,-7,7,half-4][row],[u,v]=coords(x,y),[lu,lv]=coords(x-1.35,y);
     boxes.push(object(t,lu,lv,z+.55,[.055,2.45,.025],[215,225,215]));
     if(bay<2&&row===0){boxes.push(object(t,u,v,z+.54,[1.12,2.2,.02],[49,120,182]));paths.push({path:[tilePosition(t,u-.015,v,z+.6),tilePosition(t,u+.015,v,z+.6)],color:[235,240,239],width:.4});}
     if((bay*11+row*7)% (slots*4)<occupied){const paint=[[196,60,44],[210,216,211],[49,106,147],[49,57,62],[211,170,69]][(bay+row+t.id)%5];boxes.push(object(t,u,v,z+1.15,[1,2.1,.6],paint));boxes.push(object(t,u,v,z+1.9,[.87,1.12,.4],[61,89,100]));for(const ox of [-1.04,1.04])for(const oy of [-1.25,1.25]){const [wx,wy]=coords(x+ox,y+oy);boxes.push(object(t,wx,wy,z+.85,[.16,.42,.36],[24,31,34]));}}
    }
    if(garage){const [u,v]=coords(half-4,0);boxes.push(object(t,u,v,z+1.85,[2.6,8,.25],[121,135,141],[13,0,0]));}
   }
   for(const x of [-half+3,half-3]){const [u,v]=coords(x,0);if(!garage){boxes.push(object(t,u,v,1,[2.2,5,1],[145,160,145]));tree(t,u,v,1);}boxes.push(object(t,u,v,4,[.16,.16,4],[155,168,172]));boxes.push(object(t,u,v,8,[2,.5,.15],night&&t.powered?[255,221,162]:white));}
  }else if(t.type==='elevatedStation')boxes.push(object(t,.5,.5,19,[22,9,3],white));
  for(let i=firstPath;i<paths.length;i++)paths[i].tileId=t.id;
 }
 for(const b of city.bridges||[]){const start=city.tiles[b.tiles[0]],end=city.tiles[b.tiles.at(-1)],elevation=18,a=tilePosition(start,.5,.5,elevation),z=tilePosition(end,.5,.5,elevation);paths.push({path:[a,z],color:[176,188,190],width:b.width,phase:Math.min(...b.tiles.map(id=>city.tiles[id].level||1))});
  const bridgePhase=Math.min(...b.tiles.map(id=>city.tiles[id].level||1));for(let k=0;k<bridgePhase;k++){const u=(k+1)/(bridgePhase+1),p=a.map((v,i)=>v+(z[i]-v)*u);paths.push({path:[[p[0],p[1],p[2]],[p[0],p[1],p[2]+2+bridgePhase*.2]],color:[143,193,187],width:1});}
  const midpoint=a.map((v,i)=>(v+z[i])/2),dx=z[0]-a[0],dy=z[1]-a[1];
  if(b.style==='cable'){const top=[midpoint[0]+dx*.07,midpoint[1]+dy*.07,midpoint[2]+b.height];paths.push({path:[midpoint,top],color:white,width:4});for(let k=0;k<=12;k++)paths.push({path:[top,[a[0]+dx*k/12,a[1]+dy*k/12,a[2]+(z[2]-a[2])*k/12]],color:[216,231,230],width:.8});}
  else paths.push({path:Array.from({length:41},(_,i)=>[a[0]+dx*i/40,a[1]+dy*i/40,a[2]+(z[2]-a[2])*i/40+Math.sin(i/40*Math.PI)*b.height]),color:white,width:3});
 }
 for(const t of (city.activeTiles||city.tiles).filter(t=>t.elevated)){boxes.push(object(t,.5,.5,8,[1,1,8],[174,188,186]));for(const i of nearby(t.id))if(i>t.id&&city.tiles[i].elevated)paths.push({path:[tilePosition(t,.5,.5,17),tilePosition(city.tiles[i],.5,.5,17)],color:[157,143,195],width:5+networkLevel(t,'elevated')*.2});}
 // Phases expand each facility without changing its plot or underground depth.
 for(const list of [boxes,balls,cones,tubes,glass])for(const item of list){const t=city.tiles[item.tileId];if(!special.has(t?.type))continue;if(t.type==='elevatedStation'){item.scale=[item.scale[0],item.scale[1]*(.7+t.level*.03),item.scale[2]*(.7+t.level*.03)];continue;}const p=t.level||1,xy=.72+p*.028,z=.55+p*.045,base=tilePosition(t,.5,.5,0)[2];item.scale=[item.scale[0]*xy,item.scale[1]*xy,item.scale[2]*z];item.position=[item.position[0],item.position[1],base+(item.position[2]-base)*z];}
 for(const item of paths){const t=city.tiles[item.tileId];if(!t||!special.has(t.type))continue;const z=.55+(t.level||1)*.045,base=tilePosition(t,.5,.5,0)[2];item.path=item.path.map(p=>[p[0],p[1],base+(p[2]-base)*z]);}
 if(overlay!=='city'&&!['traffic','transit','population','density','wind','load'].includes(overlay))for(const group of [boxes,tubes,cones,glass])for(const item of group)if(Number.isInteger(item.tileId)&&eligible(city.tiles[item.tileId],overlay))item.color=analyticColor(city.tiles[item.tileId],overlay,city,analysis);
 const props={pickable:true,onClick:i=>{if(Number.isInteger(i.object?.tileId)){onPick(i.object.tileId);return true;}},getPosition:d=>d.position,getScale:d=>d.scale,getColor:d=>d.color,getOrientation:d=>d.orientation,material:{ambient:.6,diffuse:.8,shininess:70,specularColor:[160,170,175]}};
 return [new deck.SimpleMeshLayer({id:'landmark-blocks',...props,data:boxes,mesh:cube}),new deck.SimpleMeshLayer({id:'landmark-cylinders',...props,data:tubes,mesh:cylinder}),new deck.SimpleMeshLayer({id:'landmark-cones',...props,data:cones,mesh:cone}),new deck.SimpleMeshLayer({id:'landmark-trees',...props,data:balls,mesh:sphere}),new deck.PathLayer({id:'architectural-cables',data:paths,getPath:d=>d.path,getColor:d=>d.color,getWidth:d=>d.width,widthMinPixels:1}),new deck.SimpleMeshLayer({id:'forest-glass-domes',...props,data:glass,mesh:sphere,parameters:{depthMask:false},opacity:.65})];
}
export function movingLayers(city,time,{underground=false,orbital=false,launches=[],cameraGrid=null}={}){
 const object=objectFor(city),position=(x,y,z=0)=>worldPosition(x,y,z,city),tilePosition=(t,x,y,z)=>worldTilePosition(t,x,y,z,city),nearby=id=>neighbors(id,city),{width,height}=dimensions(city),[cx,cy]=cameraGrid||city.center||[width/2,height/2];
 const e=climate(city),points=[],paths=[],vehicles=[],rocketBodies=[],rocketNoses=[],orbitLines=[];
 if(!underground){
  for(const t of (city.activeTiles||city.tiles).filter(t=>t.type==='port')){const water=nearby(t.id).map(i=>city.tiles[i]).find(a=>a.terrain==='water');if(water){const a=time*.13+t.id;vehicles.push(object(water,.5+Math.sin(a)*.2,.5+Math.cos(a)*.2,3,[2.5,6,1.5],[237,231,214],[0,0,-a*180/Math.PI]));}}
  for(const t of (city.activeTiles||city.tiles).filter(t=>t.type==='airport')){const u=(time*.03+t.id*.01)%1;vehicles.push(object(t,(u-.5)*15,.5,25+Math.sin(u*Math.PI)*210,[8,2,.8],[232,237,240]));}
  // Illustrative vehicles occupy opposite sides of actual connected road edges.
  for(const t of (city.activeTiles||city.tiles).filter(t=>['road','toll','bridge'].includes(t.type)&&Math.abs(t.x-cx)<32&&Math.abs(t.y-cy)<32))for(const id of nearby(t.id)){
   const n=city.tiles[id];if(id<t.id||!['road','toll','bridge','bus'].includes(n.type))continue;const dx=n.x-t.x,dy=n.y-t.y,cell=city.cellSize||50;
   for(const direction of [-1,1]){const u=(time*(.14-(t.traffic||0)*.0007)+t.id*.017)%1,v=direction===1?u:1-u,x=t.x+.5+dx*v-dy*direction*3/cell,y=t.y+.5+dy*v+dx*direction*3/cell,z=1.5+(t.type==='bridge'?18:0)+terrainHeight(city,x,y),p=position(x,y,z),angle=Math.atan2(dy*direction,dx*direction)*180/Math.PI;
    const c=[[187,65,49],[220,221,204],[51,105,147],[194,162,71],[65,73,78]][(t.id+id)%5];vehicles.push({position:p,scale:[2.3,1,.65],orientation:[0,0,angle],color:c});vehicles.push({position:position(x,y,z+.85),scale:[1.2,.9,.4],orientation:[0,0,angle],color:[63,88,103]});if(e.night)points.push({position:position(x+dx*direction*2.2/cell,y+dy*direction*2.2/cell,z+.3),radius:.65,color:[255,231,170]});
   }
   if(t.id%5===0){const u=(time*.025+t.id*.11)%1,x=t.x+.5+dx*u-dy*12/cell,y=t.y+.5+dy*u+dx*12/cell;vehicles.push({position:position(x,y,terrainHeight(city,x,y)+1.2),scale:[.35,.35,.9],color:[137,110,98]});}
  }
  for(const launch of launches){const age=time-launch.time,state=launchState(age);if(!state.active)continue;const t=city.tiles[launch.pad];if(!t)continue;const h=state.height,cell=city.cellSize||50;
   rocketBodies.push(object(t,.5,.5,24+h,[3,3,17],[237,243,241]));rocketNoses.push(object(t,.5,.5,49+h,[3,3,5],[216,228,235]));
   // Two panels hinge away from the payload bay; each stays attached at its base.
   for(const side of [-1,1]){const angle=state.door*Math.PI/180,dx=side*(3+Math.sin(angle)*5)/cell,z=42+h+Math.cos(angle)*5;vehicles.push(object(t,.5+dx,.5,z,[.4,2.8,5],[219,231,231],[0,side*state.door,0]));}
   const payloadZ=43+h+state.separation,px=.5+state.separation*.3/cell;vehicles.push(object(t,px,.5,payloadZ,[1.8,1.7,2.5],[214,176,74]));
   for(const side of [-1,1]){const angle=state.unfold*Math.PI/180,dx=side*(2+Math.sin(angle)*6)/cell,z=payloadZ+Math.cos(angle)*6;vehicles.push(object(t,px+dx,.5,z,[.2,2.2,6],[44,108,190],[0,side*state.unfold,0]));for(let k=0;k<5;k++)vehicles.push(object(t,px+dx+side*(k-2)*Math.sin(angle)*2/cell,.5,z+(k-2)*Math.cos(angle)*2,[.25,2.25,.05],[144,198,219],[0,side*state.unfold,0]));}
   if(age<17)paths.push({path:[tilePosition(t,.5,.5,h+7),tilePosition(t,.5,.5,Math.max(2,h-70))],color:[255,170,56,190],width:6+Math.sin(time*19)});
  }
  if(orbital){orbitLines.push({path:Array.from({length:97},(_,i)=>position(cx+Math.cos(i/96*Math.PI*2)*20,cy+Math.sin(i/96*Math.PI*2)*15,850)),color:[111,174,201,120],width:1});for(let i=0;i<Math.min(30,city.satellites||0);i++){const a=time*.08+i*2.4;const p=position(cx+Math.cos(a)*20,cy+Math.sin(a)*15,850);vehicles.push({position:p,scale:[8,5,5],color:[216,229,232],orientation:[0,0,a*180/Math.PI]});vehicles.push({position:p,scale:[26,3,.5],color:[44,119,219],orientation:[0,0,a*180/Math.PI]});}}
  const count=e.weather==='rain'?200:e.weather==='snow'?150:e.weather==='hail'?110:e.weather==='wind'?65:0;
  for(let i=0;i<count;i++){const x=cx-16+((i*7.17+time*e.wind*.009)%32+32)%32,y=cy-16+(i*13.31)%32,z=terrainHeight(city,x,y)+20+((i*19.91-time*(e.weather==='snow'?12:70))%220+220)%220;
   if(['rain','wind'].includes(e.weather))paths.push({path:[position(x,y,z),position(x+.04+e.wind*.001,y+.04,z-(e.weather==='rain'?18:0))],color:e.weather==='rain'?[112,179,220,155]:[190,215,219,90],width:e.weather==='rain'?.4:.8});
   else points.push({position:position(x,y,z),radius:e.weather==='hail'?1.4:.85,color:[236,245,248,220]});
  }
  if(e.weather==='meteor')for(let i=0;i<4;i++){const u=(time*.1+i*.27)%1;paths.push({path:[position(cx-20+u*40,cy+12-i*5-u*14,650-u*230),position(cx-24+u*40,cy+14-i*5-u*14,670-u*230)],color:[215,231,255,230],width:2.5});}
 }
 for(const t of (city.activeTiles||city.tiles).filter(t=>t.elevated&&t.id%7===0)){const next=nearby(t.id).map(i=>city.tiles[i]).find(a=>a.elevated);if(next&&!underground){const u=(time*.08+t.id*.1)%1;vehicles.push({position:position(t.x+.5+(next.x-t.x)*u,t.y+.5+(next.y-t.y)*u,21+terrainHeight(city,t.x+.5+(next.x-t.x)*u,t.y+.5+(next.y-t.y)*u)),scale:[7,2,2],orientation:[0,0,next.x===t.x?90:0],color:[199,197,230]});}}
 const shared={getPosition:d=>d.position,getScale:d=>d.scale,getColor:d=>d.color,getOrientation:d=>d.orientation||[0,0,0],material:false};
 return [new deck.PathLayer({id:'orbital-rings',data:orbitLines,getPath:d=>d.path,getColor:d=>d.color,getWidth:d=>d.width,widthMinPixels:1}),new deck.SimpleMeshLayer({id:'moving-vehicles',...shared,data:vehicles,mesh:cube}),new deck.SimpleMeshLayer({id:'launch-rockets',...shared,data:rocketBodies,mesh:cylinder}),new deck.SimpleMeshLayer({id:'launch-noses',...shared,data:rocketNoses,mesh:cone}),new deck.ScatterplotLayer({id:'weather-and-traffic-particles',data:points,getPosition:d=>d.position,getRadius:d=>d.radius,getFillColor:d=>d.color,radiusMinPixels:1,parameters:{depthMask:false}}),new deck.PathLayer({id:'weather-streaks',data:paths,getPath:d=>d.path,getColor:d=>d.color,getWidth:d=>d.width,widthMinPixels:.7,parameters:{depthMask:false}})];
}
