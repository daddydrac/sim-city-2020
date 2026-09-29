import {tilePosition} from './geo.mjs';
import {buildingForm} from './development.mjs';
import {climate} from './climate.mjs';
import {analyticColor} from './analytics.mjs';
const bespoke=new Set(['mall','stripmall','mixeduse','hotel','casino','bank','ferris','toll']);
export function architectureLayers(city,{onPick,overlay='city',analysis={}}={}){
 const {deck,cityLuma}=window,cube=new cityLuma.CubeGeometry(),sphere=new cityLuma.SphereGeometry({nlat:6,nlong:8}),boxes=[],leaves=[],lines=[],glows=[];const env=climate(city),night=env.night;
 const pos=(t,x,y,z)=>tilePosition(t,.5+x/(city.cellSize||50),.5+y/(city.cellSize||50),z,city);
 const box=(t,x,y,z,s,c)=>boxes.push({tileId:t.id,position:pos(t,x,y,z),scale:s,color:overlay==='city'?c:analyticColor(t,overlay,city,analysis)});
 const line=(t,points,color,width=.3)=>lines.push({tileId:t.id,path:points.map(p=>pos(t,...p)),color,width});
 const tree=(t,x,y)=>{box(t,x,y,2,[.3,.3,2],[98,81,60]);leaves.push({tileId:t.id,position:pos(t,x,y,6),scale:[2.5,2.7,4],color:env.weather==='snow'?[219,226,215]:env.season==='autumn'?[181,122,56]:[67,125,69]});};
 for(const t of city.activeTiles||city.tiles){
  const special=bespoke.has(t.type);if(!special&&!['residential','commercial','industrial'].includes(t.type))continue;
  if(t.type==='toll'){for(const x of [-7,7])box(t,x,0,3,[1.6,3,3],[208,206,187]);box(t,0,0,7,[12,4,.6],[65,127,137]);for(const x of [-4,4])line(t,[[x,1,2],[x+3,1,2]],[230,202,107],.3);continue;}
  if(t.level<2&&!['ferris'].includes(t.type))continue;
  const lot=city.cellSize?27:23;box(t,0,0,.5,[lot,lot,.35],[158,162,151]);
  for(const x of [-lot+3,lot-3])for(const y of [-lot+3,lot-3]){box(t,x,y,1,[2.5,2.5,.4],[97,129,85]);tree(t,x,y);}
  if(t.type==='ferris'){
   const radius=19,center=24;for(const y of [-3,3]){line(t,[[-12,y,1],[0,y,center],[12,y,1]],[211,220,213],1.3);line(t,Array.from({length:49},(_,i)=>[Math.cos(i/48*Math.PI*2)*radius,y,center+Math.sin(i/48*Math.PI*2)*radius]),[225,225,209],.55);}
   for(let k=0;k<12;k++){const a=k/12*Math.PI*2,x=Math.cos(a)*radius,z=center+Math.sin(a)*radius;line(t,[[0,0,center],[x,0,z]],[185,203,204],.35);box(t,x,0,z-1,[1.5,3,1.5],k%2?[215,142,90]:[106,174,184]);}continue;
  }
  const form=buildingForm(t);let h=form.height,w=form.width,d=w*.85;
  if(special){h=['mall','stripmall'].includes(t.type)?7+t.level:18+t.level*(t.type==='hotel'?8:5);w=['mall','stripmall'].includes(t.type)?23:17;d=t.type==='stripmall'?9:17;
   box(t,0,0,h/2+1,[w,d,h/2],[164,177,176]);
   for(let floor=1;floor<h/3.5;floor++)box(t,0,0,1+floor*3.5,[w+.5,d+.5,.15],[210,213,201]);
   for(const side of [-1,1])for(let x=-w+2;x<w;x+=3.5)for(let z=4;z<h;z+=3.5){const lit=night&&t.powered&&(Math.floor(x+z)+t.id)%4!==0;box(t,x,side*(d+.05),z,[1.15,.09,1.1],lit?[245,197,118]:[64,106,122]);}
   box(t,0,0,h+1,[w+.5,d+.5,.6],[104,123,109]);
   if(t.type==='bank'){for(let x=-12;x<=12;x+=5)box(t,x,-d-1,5,[.7,.7,4],[222,220,199]);box(t,0,-d-2,9,[16,3,.5],[216,215,197]);}
   if(t.type==='casino'){for(const x of [-w,w])box(t,x,-d,8,[.35,.35,7],night?[226,105,183]:[143,85,133]);}
   if(t.type==='mall'||t.type==='stripmall'){for(let x=-18;x<22;x+=8){box(t,x,-d-1,4,[3.6,1,.3],[135+(x+18)*2,101,70]);box(t,x,-d-.1,2.2,[2.8,.15,1.7],[49,85,98]);}for(let x=-20;x<=20;x+=5)line(t,[[x,-25,1],[x,-19,1]],[224,223,205],.13);}
  }else{
   // Distinct podiums, projecting balconies and vertical facade fins.
   box(t,0,0,2,[w+2,d+2,1.5],[173,174,159]);
   if(t.type==='residential')for(let z=7;z<h-2;z+=7)for(const side of [-1,1]){box(t,side*(w+1),0,z,[1.7,d*.75,.25],[210,210,194]);line(t,[[side*(w+2.5),-d*.75,z+1],[side*(w+2.5),d*.75,z+1]],[132,159,159],.15);}
   if(t.type==='commercial')for(let x=-w;x<=w;x+=5)box(t,x,-d-.2,h/2,[.25,.25,h/2],[194,191,167]);
  }
  for(let i=0;i<3;i++){const x=-w*.55+i*w*.5;box(t,x,0,h+2.2,[2,3,1],[141,152,149]);for(let k=0;k<4;k++)line(t,[[x-1.5,-2+k,h+3.25],[x+1.5,-2+k,h+3.25]],[80,94,98],.16);}
  if(t.id%3===0){box(t,0,d*.6,h+2,[w*.6,2,.5],[54,98,142]);for(let x=-w*.6;x<w*.6;x+=3)line(t,[[x,d*.6-2,h+2.55],[x,d*.6+2,h+2.55]],[161,184,202],.08);}
  if(night&&t.powered)for(const x of [-lot+2,lot-2])glows.push({position:pos(t,x,-lot+2,1.5)});
 }
 const shared={mesh:cube,getPosition:d=>d.position,getScale:d=>d.scale,getColor:d=>d.color,pickable:true,onClick:info=>onPick?.(info.object.tileId),material:{ambient:.5,diffuse:.85,shininess:env.weather==='rain'?90:35}};
 return [new deck.SimpleMeshLayer({id:'architectural-details',...shared,data:boxes}),new deck.SimpleMeshLayer({id:'lot-trees',...shared,mesh:sphere,data:leaves}),new deck.PathLayer({id:'architecture-trim',data:lines,getPath:d=>d.path,getColor:d=>d.color,getWidth:d=>d.width,widthMinPixels:.4,pickable:false}),new deck.ScatterplotLayer({id:'entrance-light-pools',data:glows,getPosition:d=>d.position,getRadius:7,getFillColor:[255,200,130,45],parameters:{depthMask:false}})];
}
