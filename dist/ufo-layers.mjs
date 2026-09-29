import {position} from './geo.mjs';
// The same geometry/data feeds the Three.js converter and native deck.gl renderer.
let shapes;
function meshes(){if(shapes)return shapes;const L=window.cityLuma;return shapes={sphere:new L.SphereGeometry({nlat:18,nlong:48}),cone:new L.ConeGeometry({radius:1,height:2,verticalAxis:'z',nradial:48}),cylinder:new L.CylinderGeometry({radius:1,height:2,verticalAxis:'z',nradial:48}),cube:new L.CubeGeometry()};}
export function ufoLayers(city,event){
 if(!event?.frame?.visible)return [];const {frame:f,target}=event,{deck}=window,m=meshes(),cell=city.cellSize||50,boxes=[],balls=[],cones=[],tubes=[],lights=[],lines=[];
 const xyz=(x,y,z)=>position(target.x+x/cell,target.y+y/cell,target.z+z,city);
 const obj=(x,y,z,scale,color,orientation=[0,0,0])=>({position:xyz(x,y,z),scale,color,orientation});
 const [x,y,z]=f.offset;
 balls.push(obj(x,y,z,[19,19,3.2],[127,147,161]),obj(x,y,z+2.2,[13,13,4.5],[98,117,138]),obj(x,y,z+6,[5.1,5.1,3.9],[57,94,109]));
 tubes.push(obj(x,y,z-1.4,[16,16,.8],[57,69,82]),obj(x,y,z-3,[4,4,.7],[82,248,132]));
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2+f.spin,cs=Math.cos(a),sn=Math.sin(a);lights.push(obj(x+cs*19.3,y+sn*19.3,z+.3,[.82,.82,.52],i%3===0?[255,65,112]:i%3===1?[113,255,154]:[255,204,73]));if(i%2===0)lines.push({path:[xyz(x+cs*6,y+sn*6,z+6.3),xyz(x+cs*15,y+sn*15,z+2.6)],color:[182,210,212],width:.22});}
 lines.push({path:Array.from({length:65},(_,i)=>xyz(x+Math.cos(i/64*Math.PI*2)*19.2,y+Math.sin(i/64*Math.PI*2)*19.2,z+.25)),color:[255,45,92],width:.4});
 for(let i=0;i<8;i++){const a=i*Math.PI/4+f.spin*.5;lights.push(obj(x+Math.cos(a)*4.6,y+Math.sin(a)*4.6,z+7,[.7,.7,.7],[101,255,178]));}
 if(f.beam>.01){cones.push(obj(0,0,z/2,[11,11,z/2],[20,255,65]));const h=1.5+f.lift*24;balls.push(obj(0,0,h+2.2,[.65,.65,.65],[214,168,125]));boxes.push(obj(0,0,h+.8,[.65,.4,.85],[218,89,65]));for(const s of [-1,1]){boxes.push(obj(s*.35,0,h-.55,[.23,.3,.65],[61,74,97]),obj(s*.95,0,h+1.1,[.5,.2,.2],[218,89,65],[0,s*25,0]));}for(let k=0;k<7;k++){const height=(k*13+f.time*9)%82,r=3+height*.02;lines.push({path:Array.from({length:33},(_,i)=>xyz(Math.cos(i/32*Math.PI*2)*r,Math.sin(i/32*Math.PI*2)*r,height+2)),color:[116,255,154,100],width:.14});}}
 const shared={pickable:false,getPosition:d=>d.position,getScale:d=>d.scale,getColor:d=>d.color,getOrientation:d=>d.orientation,material:{ambient:.6,diffuse:.8,shininess:90}};
 return [new deck.SimpleMeshLayer({id:'ufo-hull',...shared,data:balls,mesh:m.sphere}),new deck.SimpleMeshLayer({id:'ufo-engine',...shared,data:tubes,mesh:m.cylinder}),new deck.SimpleMeshLayer({id:'ufo-resident',...shared,data:boxes,mesh:m.cube}),new deck.SimpleMeshLayer({id:'ufo-rim-lights',...shared,data:lights,mesh:m.sphere,material:false}),new deck.SimpleMeshLayer({id:'ufo-beam',...shared,data:cones,mesh:m.cone,material:false,opacity:.16*f.beam,parameters:{depthMask:false}}),new deck.PathLayer({id:'ufo-ribs',data:lines,getPath:d=>d.path,getColor:d=>d.color,getWidth:d=>d.width,widthMinPixels:.6,parameters:{depthMask:false}}),new deck.ScatterplotLayer({id:'ufo-ground-pool',data:f.beam>.01?[{position:xyz(0,0,.6)}]:[],getPosition:d=>d.position,getRadius:13,getFillColor:[76,255,105,Math.round(65*f.beam)],parameters:{depthMask:false}})];
}
