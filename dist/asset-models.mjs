import {ART_REGISTRY} from './art-registry.mjs';
// Original parametric architecture in meters, Z-up. Pure geometry data is shared by both renderers.
export const COLORS={stone:[187,182,165],brick:[145,91,69],plaster:[213,206,180],concrete:[158,170,165],glass:[63,112,131],frame:[193,196,179],roof:[62,73,79],metal:[104,129,135],wood:[130,102,70],grass:[77,119,66],leaf:[53,103,57],asphalt:[49,58,61],light:[255,205,129],blue:[47,106,165],red:[176,66,55],water:[43,115,141]};
export function assetModel(type,phase,{lotWidth=50,lotDepth=50,lod=0,season='summer',weather='sun',night=false,powered=true,id=0,age=12,time=0}={}){
 if(!ART_REGISTRY[type])throw Error('Unknown asset '+type);const p=Math.max(1,Math.min(10,phase|0)),parts=[],paths=[],sockets={entrance:[0,-lotDepth/2,0],service:[lotWidth/2,0,0],power:[-lotWidth/2,0,-3],water:[-lotWidth/2,0,-6]};
 const w=lotWidth/2-2,d=lotDepth/2-2,wet=['rain','hail'].includes(weather),snow=weather==='snow',detail=lod<2,fine=lod===0;
 function add(shape,role,x,y,z,sx,sy,sz,material='stone',rotation=[0,0,0],color){parts.push({shape,role,position:[x,y,z],scale:[sx/2,sy/2,sz/2],rotation,material,color:color||COLORS[material]||COLORS.stone});}
 const box=(role,x,y,z,sx,sy,sz,m='stone',rot)=>add('box',role,x,y,z,sx,sy,sz,m,rot);
 const cylinder=(role,x,y,z,r,h,m='metal')=>add('cylinder',role,x,y,z,r*2,r*2,h,m);
 const line=(role,points,width=.16,m='frame')=>paths.push({role,points,width,color:COLORS[m]||COLORS.frame});
 function tree(x,y,z=0,k=0){if(!detail)return;cylinder('tree-trunk',x,y,z+2,.23,4,'wood');for(let i=0;i<(fine?4:1);i++){const a=i*2.4;add('sphere','tree-crown',x+Math.cos(a)*.9,y+Math.sin(a)*.9,z+5+i*.55,4,4,4.5,'leaf',undefined,snow?[215,224,217]:season==='autumn'?[[175,102,44],[179,135,58],[115,89,46]][(k+i)%3]:[48+k%3*9,102+i*7,54]);}}
 function planter(x,y,z=0,sx=4,sy=4){box('planter',x,y,z+.6,sx,sy,1.2,'stone');box('planting',x,y,z+1.25,sx-.35,sy-.35,.15,'grass');if(fine)tree(x,y,z+1.3);}
 function windows(x,y,z,bw,bd,floors,{balcony=false,style='stone'}={}){
  if(!detail)return;const floorStep=lod===1?Math.max(1,Math.ceil(floors/6)):1,bayStep=lod===1?6:3.4;
  for(let f=0;f<floors;f+=floorStep){const zz=z+2+f*3.6;for(let side=0;side<4;side++){const length=side<2?bw:bd;for(let u=-length/2+2;u<length/2-1;u+=bayStep){const xx=side<2?x+u:x+(side===2?1:-1)*bw/2,yy=side<2?y+(side===0?-1:1)*bd/2:y+u;
   const lit=night&&powered&&(Math.floor(u*11+f*7+id)%5!==0),axis=side<2,off=side===0||side===3?-1:1;
   box('recessed-window',xx,yy,zz,axis?2.15:.10,axis?.10:2.15,2.3,lit?'light':'glass');
   if(fine){box('window-sill',xx+(axis?0:off*.14),yy+(axis?off*.14:0),zz-1.2,axis?2.5:.48,axis?.48:2.5,.14,'frame');for(const e of [-1,1])box('window-jamb',xx+(axis?e*1.18:off*.17),yy+(axis?off*.17:e*1.18),zz,axis?.20:.44,axis?.44:.20,2.6,style);box('window-transom',xx,yy,zz+.2,axis?2.1:.16,axis?.16:2.1,.07,'metal');
    if(balcony&&(f+Math.round(u)+id)%3===0){box('balcony-slab',xx+(axis?0:off*1),yy+(axis?off*1:0),zz-1.4,axis?2.9:2,axis?2:2.9,.22,'frame');box('balcony-rail',xx+(axis?0:off*1.9),yy+(axis?off*1.9:0),zz-.82,axis?2.9:.08,axis?.08:2.9,.9,'glass');}
   }
  }}}
 }
 function building(x,y,bw,bd,floors=2,{material='stone',pitched=false,balcony=false,green=false}={}){const h=floors*3.6;
  box('walls',x,y,.8+h/2,bw,bd,h,material);windows(x,y,1,bw+.03,bd+.03,floors,{balcony,style:material});
  if(pitched){add('gable','pitched-roof',x,y,h+2.2,bw+1.2,bd+1.2,3.3,snow?'frame':'roof');if(fine){box('chimney',x+bw*.25,y+bd*.15,h+3.5,1,1.2,3,'brick');line('roof-ridge',[[x,y-bd/2,h+3.85],[x,y+bd/2,h+3.85]],.18);}}
  else {box('roof-deck',x,y,h+1,bw+.4,bd+.4,.5,snow?'frame':green?'grass':'roof');if(detail){for(const side of [-1,1]){box('parapet',x+side*bw/2,y,h+1.5,.23,bd,.8,'stone');box('parapet',x,y+side*bd/2,h+1.5,bw,.23,.8,'stone');}if(!green)for(let k=0;k<Math.min(4,p);k++){box('rooftop-HVAC',x-bw*.25+k*3,y+bd*.17,h+2,2.2,3,1.6,'metal');if(fine)for(let a=0;a<4;a++)box('HVAC-louver',x-bw*.25+k*3,y+bd*.17-1.53,h+1.5+a*.25,1.8,.08,.09,'roof');}else for(const a of [-1,1])tree(x+a*bw*.3,y,h+1.3);}}
  if(detail){box('entrance',x,y-bd/2-.12,2.1,2.4,.18,3.1,night&&powered?'light':'glass');box('entrance-canopy',x,y-bd/2-1.5,4,5,3,.3,'metal');box('entrance-steps',x,y-bd/2-2,.4,5,3,.5,'concrete');}
  return h+1;
 }
 function parking(x,y,bw,bd,deckZ=0){box('parking-pavement',x,y,deckZ+.2,bw,bd,.3,'asphalt');if(!detail)return;const count=Math.max(2,Math.floor(bw/3));for(let i=0;i<count;i++){const xx=x-bw/2+(i+.5)*bw/count;line('parking-stall',[[xx-1.3,y-bd/2,deckZ+.38],[xx-1.3,y+bd/2,deckZ+.38]],.1);if(i===0)box('accessible-bay',xx,y,deckZ+.37,2.4,bd-.3,.025,'blue');if(fine&&(i+id)%3!==0){box('parked-car-body',xx,y,deckZ+1,1.7,3.9,1.1,['red','plaster','blue','metal'][(i+id)%4]);box('parked-car-glass',xx,y,deckZ+1.75,1.5,2.2,.55,'glass');}}}
 function fence(){if(!detail)return;for(const side of [-1,1]){line('fence',[[side*w,-d,1],[side*w,d,1]],.14,'wood');for(let y=-d;y<=d;y+=5)box('fence-post',side*w,y,.8,.2,.2,1.6,'wood');}}
 function lamps(){if(!detail)return;for(const x of [-w+2,w-2]){cylinder('street-lamp-post',x,-d+2,3,.12,6);box('street-lamp',x,-d+2,6.2,1.4,.65,.2,night&&powered?'light':'metal');}}
 function tower(floors,bw=26,bd=28,forest=false){let h=building(0,0,bw,bd,floors,{material:p>=8?'metal':'stone',balcony:true,green:forest});for(let f=5;forest&&f<floors;f+=5){box('garden-terrace',0,0,1+f*3.6,bw+5,bd+5,.6,'frame');box('terrace-lawn',0,0,1.4+f*3.6,bw+4,bd+4,.2,'grass');for(const side of [-1,1]){tree(side*(bw/2+1),bd*.25,1.5+f*3.6);tree(side*(bw/2+1),-bd*.25,1.5+f*3.6);}}
  if(p===10&&forest){const radius=Math.min(lotWidth,lotDepth)*.36;box('forest-deck',0,0,h+1,radius*2,radius*2,1.3,'metal');add('dome','forest-dome',0,0,h+2,radius*2,radius*2,radius*1.6,'glass-shell');for(let j=0;j<12;j++){const a=j*Math.PI/6;line('dome-rib',Array.from({length:19},(_,i)=>{const b=i/18*Math.PI/2;return [Math.cos(a)*radius*Math.cos(b),Math.sin(a)*radius*Math.cos(b),h+2+Math.sin(b)*radius*.8]}),.18);tree(Math.cos(a)*radius*.6,Math.sin(a)*radius*.6,h+2);}}
  return h;
 }
 // Site base and fixed street connections remain stable through every upgrade.
 if(!ART_REGISTRY[type].network){box('foundation',0,0,.12,lotWidth-1,lotDepth-1,.22,['park','forest','wetland'].includes(type)?'grass':'concrete');box('pedestrian-connection',0,-d/2,.3,2.8,d,.12,'stone');if(!['road','bridge','toll','dam','airport'].includes(type))lamps();}
 if(p===1&&age===0&&['residential','commercial','industrial','mixeduse','arcology','skyscraper','mall','stripmall','hotel','casino','bank'].includes(type)){box('foundation-slab',0,0,.8,Math.min(24,w*1.4),Math.min(24,d*1.4),1,'concrete');for(const x of [-10,10])box('construction-post',x,-10,2.4,.3,.3,4,'wood');return {assetId:ART_REGISTRY[type].id,type,phase:p,stage:ART_REGISTRY[type].phases[p-1],lod,footprint:[lotWidth,lotDepth],sockets,parts,paths,wet,night};}
 const low=p<=3;
 if(['residential','mixeduse','arcology','skyscraper','commercial'].includes(type)){
  if(p<=2){const n=p===1?1:3;for(let k=0;k<n;k++){const x=n===1?0:(k-1)*12;building(x,2,n===1?12:9,13,p===1?1:2,{material:(k+id)%2?'plaster':'brick',pitched:true});if(type==='commercial'||type==='mixeduse')box('shop-awning',x,-6,3.3,8,2,.35,'red');}parking(w-4,0,5,12);fence();}
  else if(p<=5){building(-w*.42,0,w*.66,d*1.35,p-1,{material:'brick',balcony:true});building(w*.42,0,w*.66,d*1.35,p,{material:'stone',balcony:true});planter(0,0);if(p===5){box('courtyard-bridge',0,d*.35,8,w*.6,4,2.4,'glass');}}
  else {const floors=[0,0,0,0,0,0,12,18,26,35,45][p];if(p===8){building(-w*.4,0,w*.75,d*1.4,18,{balcony:true});building(w*.4,0,w*.75,d*1.4,24,{balcony:true});box('skybridge',0,0,45,w,5,3,'glass');}else tower(floors,Math.min(32,w*1.4),Math.min(36,d*1.45),['arcology','residential','mixeduse'].includes(type)&&p>=7);}
  if(type==='mixeduse'||type==='commercial')for(let x=-w+5;x<w-3;x+=7){box('retail-shopfront',x,-d+5,2.4,5,.2,3,'glass');box('retail-sign-band',x,-d+4.8,4.5,5,.3,.6,night&&powered?'light':'wood');}
 }else if(['mall','stripmall','hotel','casino','bank'].includes(type)){
  if(type==='mall'||type==='stripmall'){const bw=w*1.75,bd=Math.min(d,p<4?15:22);const h=building(0,d*.3,bw,bd,1+Math.floor((p-1)/4),{material:'brick',green:p>=8});for(let x=-bw/2+4;x<bw/2;x+=8){box('individual-storefront',x,d*.3-bd/2-.15,2.5,6,.2,3,'glass');box('store-awning',x,d*.3-bd/2-1,4.2,6,2,.3,(Math.round(x)+id)%2?'red':'metal');}parking(0,-d*.6,w*1.8,7);if(p>=4)add('dome','mall-atrium',0,d*.3,h+1,Math.min(20,w),12,5,'glass-shell');}
  else{const floors=type==='bank'?2+Math.floor(p*1.1):2+p*2;building(0,2,w*1.25,d*1.25,floors,{material:type==='bank'?'stone':'plaster',balcony:type==='hotel',green:p>=8});if(type==='bank'){for(let x=-w*.55;x<w*.6;x+=4)cylinder('bank-column',x,-d*.63-1,4,.5,8,'stone');add('gable','bank-pediment',0,-d*.63-2,9,w*1.4,4,3,'stone');}if(type==='casino'){for(let i=0;i<6;i++)box('casino-neon',-w*.55+i*w*.22,-d*.64,7,.23,.23,11,night&&powered?'light':'red');}parking(0,-d+3,w*1.65,5);}
 }else if(type==='industrial'||type==='power'){
  const bw=w*1.3,bd=d*1.25;building(0,3,bw,bd,1+Math.floor(p/3),{material:'brick'});for(let i=0;i<2+Math.floor(p/3);i++){const x=-bw/2+3+i*bw/(3+Math.floor(p/3));add('gable','sawtooth-roof',x,3,6+Math.floor(p/3)*3.6,bw/(3+Math.floor(p/3)),bd,3,'metal');box('loading-door',x,3-bd/2-.1,2.4,3,.2,3.5,'roof');}for(let k=0;k<(type==='power'?2:1)+Math.floor(p/5);k++){cylinder('exhaust-stack',-w*.7+k*4,d*.6,10+p*.5,1.4,20+p,'brick');cylinder('stack-cap',-w*.7+k*4,d*.6,20+p,1.65,.6,'metal');}for(let j=0;j<Math.min(p,6);j++)box('service-machinery',w*.65,-d*.5+j*4,2.5,4,3,4,'metal');
 }else if(['school','hospital','police','fire'].includes(type)){
  const floor=type==='hospital'?1+Math.floor(p*.8):1+Math.floor(p/4);const h=building(0,4,w*1.55,d*1.05,floor,{material:type==='hospital'?'plaster':'brick',pitched:p<4&&type==='school',green:p>=8});
  if(type==='school'){if(p>=3)building(-w*.65,-d*.3,w*.4,d*.7,2,{material:'brick'});box('playground',w*.35,-d*.6,1,w*.7,9,.2,'grass');for(let k=0;k<3;k++){box('school-window',-8+k*8,-d*.12,3,3,.2,2,'glass');}if(p>=5){cylinder('clock-tower',0,d*.35,h+3,2.4,7,'stone');add('cone','clock-spire',0,d*.35,h+8,5,5,5,'roof');}}
  if(type==='hospital'){box('medical-cross-v',0,-d*.53+3,7,.8,.3,4,'red');box('medical-cross-h',0,-d*.53+3,7,3,.3,.8,'red');box('ambulance-canopy',0,-d*.6,4.2,13,7,.5,'frame');if(p>=6){cylinder('helipad',0,4,h+.8,7,.3,'roof');line('helipad-H',[[-2,2,h+1],[-2,6,h+1],[-2,4,h+1],[2,4,h+1],[2,2,h+1],[2,6,h+1]],.5);}}
  if(type==='fire'){for(let k=0;k<Math.min(2+Math.floor(p/3),4);k++){box('fire-appliance-bay',-10+k*7,-d*.53+3.9,2.5,5,.2,4,'red');box('fire-engine',-10+k*7,-d*.7,1.7,2.5,6,2.5,'red');}building(w*.62,d*.55,5,5,3+Math.floor(p/2),{material:'brick'});}
  if(type==='police'){parking(0,-d*.65,w*1.6,6);cylinder('communications-mast',w*.5,d*.4,h+5,.2,10);box('police-sign',0,-d*.53+3,4.7,8,.3,.6,'blue');}
 }else if(['bus','subway','elevatedStation'].includes(type)){
  const z=type==='elevatedStation'?18:0;box('platform',0,0,z+.5,w*1.6,8,1,'concrete');for(const x of [-12,12])box('canopy-pillar',x,0,z+2.8,.25,.25,5,'metal');box('station-roof',0,0,z+5.4,29,11,.45,p>=6?'grass':'metal');if(detail){for(const x of [-9,0,9])box('platform-bench',x,2,z+1.5,4,.7,.25,'wood');box('route-map',-12,3,z+3,2,.2,2,'blue');}if(p>=3)for(const x of [-14,14])box('station-glass',x,0,z+2.8,.08,8,4,'glass-shell');if(type==='subway'){box('stairwell',0,-6,.2,8,12,.3,'roof');for(let i=0;i<8;i++)box('metro-step',0,-10+i,Math.max(.1,1-i*.12),7,.85,.25,'stone');}if(type==='elevatedStation'){for(const x of [-10,10])box('station-pier',x,0,9,2,3,18,'concrete');for(let i=0;i<12;i++)box('access-stairs',w*.65,-10+i,1+i*1.5,4,1.4,1.5,'concrete');}
 }else if(type==='parking'||type==='garage'){
  const floors=type==='parking'?1:Math.max(1,p);for(let f=0;f<floors;f++){const z=f*3.4;box('parking-deck',0,0,z+.35,w*1.95,d*1.9,.5,'concrete');parking(0,-d*.6,w*1.8,5,z+.6);parking(0,d*.6,w*1.8,5,z+.6);if(type==='garage'){for(const x of [-w*.9,0,w*.9])for(const y of [-d*.8,d*.8])box('garage-column',x,y,z+1.8,.6,.6,3.4,'stone');box('garage-ramp',w*.67,0,z+1.7,4,12,.4,'concrete',[15,0,0]);line('deck-guard', [[-w,-d,z+2.1],[w,-d,z+2.1]],.18);}}if(p>=5){for(let x=-w+4;x<w;x+=8)box('solar-parking-canopy',x,d*.6,(floors-1)*3.4+5,6,7,.25,'blue');}if(type==='parking'){planter(-w*.8,0);planter(w*.8,0);}
 }else if(['solar','hydrogen','pump','reservoir','dam'].includes(type)){
  if(type==='solar'){const cols=2+Math.floor(p/2),rows=2+Math.floor(p/3);for(let x=0;x<cols;x++)for(let y=0;y<rows;y++){const xx=-w*.7+x*(w*1.4/(cols-1)),yy=-d*.7+y*(d*1.4/(rows-1));box('solar-support',xx,yy,1.3,.25,.25,2.6,'metal');box('solar-panel',xx,yy,2.8,w*1.2/cols,d*1.2/rows,.16,'blue',[20,0,0]);if(fine)line('solar-cell-grid',[[xx-2,yy,3],[xx+2,yy,3]],.06);}}
  if(type==='hydrogen'){building(0,-d*.5,w*1.6,9,1,{material:'plaster'});for(let k=0;k<2+Math.floor(p/2);k++){const xx=-w*.65+k*w*1.3/(1+Math.floor(p/2));cylinder('hydrogen-tank',xx,3,7,2.5,13,'frame');add('sphere','tank-dome',xx,3,13.5,5,5,3,'frame');line('hydrogen-pipe',[[xx,3,1],[xx,-6,1],[0,-6,1]],.4,'metal');}}
  if(type==='pump'){building(-4,3,w,20,1+Math.floor(p/5),{material:'brick'});for(let k=0;k<2+Math.floor(p/3);k++){cylinder('pump-housing',w*.5,-d*.6+k*5,2,2,3,'metal');line('pump-outlet',[[w*.5,-d*.6+k*5,2],[w,-d*.6+k*5,2],[w,-d*.6+k*5,-6]],.6,'blue');}if(p>=4)cylinder('water-tower',-w*.45,d*.5,12,5,7,'frame');}
  if(type==='reservoir'){cylinder('reservoir-wall',0,0,2.5,Math.min(w,d)*.94,5,'stone');cylinder('reservoir-water',0,0,5.03,Math.min(w,d)*.88,.1,'water');building(w*.7,-d*.7,8,9,1,{material:'brick'});for(let k=0;k<2+p;k++){const a=k/(2+p)*Math.PI*2;box('reservoir-fence',Math.cos(a)*w*.93,Math.sin(a)*d*.93,6,.2,.2,2,'metal');}}
  if(type==='dam'){box('dam-face',0,0,8+p,lotWidth-3,9,16+p*2,'stone');for(let i=0;i<2+p;i++){const x=-w+(i+.5)*2*w/(2+p);box('spillway-pier',x,0,10+p,2,12,20+p*2,'concrete');box('spillway-gate',x,-6,4+p,Math.max(2,lotWidth/(2+p)-2),.6,10,'metal');}box('dam-crest',0,0,20+2*p,lotWidth,13,.8,'concrete');}
 }else if(['park','forest','wetland'].includes(type)){
  const n=type==='forest'?6+p*2:4+p;for(let k=0;k<n;k++){const a=k*2.4,r=Math.sqrt((k+1)/n)*Math.min(w,d)*.8;tree(Math.cos(a)*r,Math.sin(a)*r,0,k);}if(type==='park'){line('park-path',[[-w,0,.3],[0,-4,.3],[w,0,.3]],2.8,'stone');if(p>=2){add('cone','gazebo-roof',0,0,5,9,9,3,'roof');for(const x of [-3,3])for(const y of [-3,3])box('gazebo-column',x,y,2.5,.25,.25,5,'wood');}if(p>=5)cylinder('park-fountain',0,d*.55,.6,4,1,'water');}if(type==='wetland'){add('sphere','wetland-pond',0,0,.2,w*1.3,d, .4,'water');line('boardwalk',[[-w,0,.6],[-w*.3,-d*.4,.6],[w*.6,d*.5,.6]],2,'wood');}
 }else if(type==='ferris'){
  const radius=Math.min(w*.91,9+p*1.7),z=radius+4;for(const y of [-2.5,2.5]){line('ferris-support',[[-10,y,0],[0,y,z],[10,y,0]],1.2,'metal');line('ferris-rim',Array.from({length:49},(_,i)=>[Math.cos(i/48*Math.PI*2)*radius,y,z+Math.sin(i/48*Math.PI*2)*radius]),.45);}for(let k=0;k<8+p;k++){const a=k/(8+p)*Math.PI*2+time*.12,x=Math.cos(a)*radius,zz=z+Math.sin(a)*radius;line('wheel-spoke',[[0,0,z],[x,0,zz]],.2);box('wheel-gondola',x,0,zz-1,2.5,4,2.6,k%2?'red':'blue');}
 }else if(type==='landmark'){
  cylinder('monument-plinth',0,0,1.8,Math.min(w,d)*.7,3.6,'stone');for(let i=0;i<3+p;i++){const x=(i-(2+p)/2)*2.7;line('sculptural-rib',Array.from({length:21},(_,j)=>{const a=j/20*Math.PI;return [x,Math.cos(a)*d*.65,3+Math.sin(a)*(9+p*2-Math.abs(x)*.2)]}),.55,'frame');}
 }else if(type==='spaceport'){
  cylinder('launch-apron',0,0,.7,Math.min(w,d)*.65,1.4,'roof');box('service-tower',w*.35,0,14+p,3,5,28+p*2,'metal');cylinder('parked-rocket',0,0,11,2.1,20,'frame');add('cone','rocket-nose',0,0,23,4.2,4.2,5,'frame');for(let j=0;j<2+p;j++)line('gantry-cross-brace',[[w*.35-1,0,j*3],[w*.35+1,0,j*3+3]],.16);building(-w*.6,-d*.5,w*.45,d*.3,1+Math.floor(p/4),{material:'plaster'});
 }else if(type==='port'){
  box('quay',0,0,.8,lotWidth-2,lotDepth-2,1.6,'concrete');for(let k=0;k<Math.min(2+p,9);k++){const x=-w*.7+k%3*w*.65,y=-d*.5+Math.floor(k/3)*7;box('cargo-container',x,y,2.2,9,5,3,['red','blue','metal'][k%3]);if(fine)for(let j=0;j<8;j++)box('container-corrugation',x-4+j,y-2.6,2.2,.07,.1,2.6,'frame');}for(let k=0;k<1+Math.floor(p/3);k++){const x=-w*.7+k*w*.5;line('harbor-crane',[[x,d*.6,0],[x,d*.6,20+p],[x,d-1,20+p]],1,'metal');line('crane-cable',[[x,d-1,20+p],[x,d-1,4]],.15);}
 }else if(type==='airport'){
  box('runway',0,0,.35,lotWidth-6,19,.35,'asphalt');for(let x=-w+10;x<w;x+=14)box('runway-centerline',x,0,.56,6,.35,.035,'frame');building(0,d*.58,w*1.1,d*.4,1+Math.floor(p/4),{material:'plaster'});building(-w*.75,d*.6,7,8,2+Math.floor(p/2),{material:'stone'});for(let i=0;i<2+Math.floor(p/2);i++){const x=-w*.5+i*w/(1+Math.floor(p/2));box('jet-bridge',x,d*.25,3,3,12,2.5,'frame');}if(p>=4)box('airport-hangar',w*.75,d*.6,5,w*.3,d*.4,10,'metal');
 }else if(['road','bridge','toll'].includes(type)){
  box('roadbed',0,0,.4,lotWidth,14+Math.min(p,6),.6,'asphalt');for(let x=-w;x<w;x+=7)box('road-marking',x,0,.72,3,.18,.025,'frame');if(p>=3)for(const y of [-10,10])box('sidewalk',0,y,.55,lotWidth,3,.8,'concrete');if(type==='toll'){for(const y of [-6,6])box('toll-booth',0,y,2.1,3,2.4,3.5,'plaster');box('toll-canopy',0,0,5.3,8,21,.45,'metal');if(p>=5)box('toll-sensor',0,0,4.9,.6,10,.2,night?'light':'blue');}
 }else if(ART_REGISTRY[type].network){
  const r=type==='drain'?2.5:type==='tunnel'?2:type==='elevated'?.45:.3;for(let i=0;i<1+Math.floor((p-1)/3);i++){const x=(i-Math.floor((p-1)/3)/2)*2;add('cylinder','network-conduit',x,0,0,r*2,r*2,lotDepth,'metal',[90,0,0]);}cylinder('network-inspection-cover',0,0,1,1+p*.06,.4,'metal');if(p>=3)box('network-sensor',2,0,1,1.2,1.2,1,night?'light':'blue');if(p>=6)line('network-bypass',[[-4,-d,0],[-4,d,0]],.3,'blue');
 }

 // Stage-specific site upgrades: real modules, never an overall scale multiplier.
 if(detail&&['mall','stripmall'].includes(type))for(let i=0;i<p+2;i++){const x=-w*.8+i*w*1.6/(p+1);box('shop-display-'+i,x,d*.3-Math.min(d,p<4?15:22)/2-.3,2.2,Math.min(3,w*1.3/(p+2)),.12,2.8,'glass');}
 if(detail&&['school','police','fire','hydrogen','pump','solar'].includes(type))for(let i=0;i<p;i++){const x=-w*.8+i*w*1.6/Math.max(1,p-1);box('service-module-'+i,x,d-2,1.2,1.4,2.4,2.4,i%2?'metal':'plaster');}
 if(type==='parking')for(let i=0;i<p;i++){const x=-w*.8+i*w*1.6/Math.max(1,p-1);box(p>=6?'EV-charge-point':'parking-meter',x,-2,1.3,.4,.4,2.6,p>=6?'blue':'metal');}
 if(type==='airport')for(let i=0;i<p+2;i++){const x=-w*.8+i*w*1.6/(p+1);box('runway-guidance-light',x,-11,.8,.5,.5,1,night&&powered?'light':'frame');}
 if(['bus','subway','elevatedStation'].includes(type)){
  const z=type==='elevatedStation'?18:0;
  if(type==='bus'&&p<=2){parts.splice(0,parts.length,...parts.filter(q=>['foundation','pedestrian-connection','street-lamp','street-lamp-post'].includes(q.role)));cylinder('bus-stop-pole',0,0,2.2,.12,4.4);box('bus-stop-sign',0,0,4,1.2,.15,1,'blue');if(p===2)box('bus-bench',3,0,1.2,4,.7,.3,'wood');}
  else for(let i=0;i<p;i++)box('passenger-gate-'+i,-10+i*20/Math.max(1,p-1),0,z+1.5,.28,1.3,2,'metal');
 }
 if(['road','bridge','toll'].includes(type)){
  if(p>=4)for(const x of [-w*.7,w*.7])tree(x,13);
  if(p>=5)for(let y=-7;y<=7;y+=2)box('crosswalk',-w*.7,y,.78,4,1,.035,'frame');
  if(p>=6)box('resurfaced-lane',w*.3,-3,.73,9,3,.03,'roof');
  if(p>=7)box('bus-priority-lane',0,-6,.75,lotWidth-2,1.4,.04,'red');
  if(p>=8)for(const x of [-w*.4,w*.4])box('rain-garden',x,-13,.8,8,3,.4,'grass');
  if(p>=9){cylinder('traffic-sensor',w*.6,-13,4,.15,8);box('traffic-controller',w*.6,-13,1,1,.8,2,'metal');}
  if(p>=10)box('cycle-track',0,15,.8,lotWidth-2,2.5,.05,'grass');
 }
 if(detail&&!ART_REGISTRY[type].network&&!['road','bridge','toll','park','forest','wetland','dam','airport','reservoir'].includes(type))for(const side of [-1,1])tree(side*(w-2),d-2);
 // Snow caps and wear are separate details, not destructive edits to structural geometry.
 if(snow&&fine)for(const part of parts.filter(q=>q.role==='roof-deck'||q.role==='entrance-canopy'))box('snow-cap',part.position[0],part.position[1],part.position[2]+part.scale[2]+.07,part.scale[0]*2,part.scale[1]*2,.14,'frame');
 return {assetId:ART_REGISTRY[type].id,type,phase:p,stage:ART_REGISTRY[type].phases[p-1],lod,footprint:[lotWidth,lotDepth],sockets,parts,paths,wet,night};
}
