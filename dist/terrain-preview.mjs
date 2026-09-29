import {terrainSurvey,terrainAtlas,terrainColor,terrainSignature} from './terrain-style.mjs';
import {terrainHeight} from './geo.mjs';
// A CPU-rendered survey of the actual city height field. Works without another GL
// context and does not manufacture a separate illustrative map for the selection UI.
export function drawTerrainPreview(canvas,city,{mode='relief',detail=true}={}){
 const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d'),s=terrainSurvey(city),atlas=terrainAtlas(city),plan=document.createElement('canvas');plan.width=atlas.width;plan.height=atlas.height;
 const p=plan.getContext('2d');p.drawImage(atlas,0,0);const im=p.getImageData(0,0,plan.width,plan.height),pix=im.data,scale=plan.width/s.width,cell=city.cellSize||64;
 const H=(x,y)=>s.heights[Math.max(0,Math.min(s.height-1,y))*s.width+Math.max(0,Math.min(s.width-1,x))];
 for(let y=0;y<plan.height;y++)for(let x=0;x<plan.width;x++){const tx=Math.floor(x/scale),ty=Math.floor(y/scale),id=ty*s.width+tx,t=city.tiles[id],i=(y*plan.width+x)*4,sx=(H(tx+1,ty)-H(tx-1,ty))/(2*cell),sy=(H(tx,ty+1)-H(tx,ty-1))/(2*cell),light=.63+.44*Math.max(0,(-sx*-.55-sy*.65+.63)/Math.hypot(sx,sy,1));
  if(mode==='suitability'&&t.terrain!=='water'){const color=s.slope[id]<=.12?[132,167,96]:s.slope[id]<=.30?[190,166,95]:[155,111,94];for(let k=0;k<3;k++)pix[i+k]=color[k]*light;}
  else if(t.terrain!=='water')for(let k=0;k<3;k++)pix[i+k]*=light;
  if(mode==='contours'&&t.terrain!=='water'){const interval=s.maxElevation>700?100:25,a=Math.floor(H(tx,ty)/interval);if(a!==Math.floor(H(tx+1,ty)/interval)||a!==Math.floor(H(tx,ty+1)/interval))for(let k=0;k<3;k++)pix[i+k]*=.58;}
 }
 p.putImageData(im,0,0);
 // Roads and zoning are included when the starter district option is enabled.
 for(const t of city.tiles)if(t.type&&t.type!=='empty'){p.fillStyle=['road','toll'].includes(t.type)?'#bac4bb':t.type==='residential'?'#a9c18b':t.type==='commercial'?'#8ab7c2':'#c8b28c';p.fillRect(t.x*scale,t.y*scale,scale,scale);}
 ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#1c2e37');bg.addColorStop(1,'#0a1821');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 if(mode!=='relief'){
  const pad=detail?38:5,k=Math.min((w-pad*2)/s.width,(h-pad*2)/s.height),rw=s.width*k,rh=s.height*k;
  ctx.save();ctx.translate((w-rw)/2,(h+rh)/2);ctx.scale(1,-1);ctx.drawImage(plan,0,0,rw,rh);ctx.restore();
 }else{
  // Orthographic oblique camera: north recedes upward, elevation is in world metres.
  const margin=detail?25:6,unit=Math.min((w-margin*2)/(s.width+s.height*.44),(h-margin*2)/(s.height*.68+s.width*.15+s.maxElevation/cell)),ox=(w-(s.width+s.height*.44)*unit)/2,oy=(h-(s.height*.68+s.width*.15+s.maxElevation/cell)*unit)/2+s.maxElevation/cell*unit;
  const project=(x,y,z)=>[ox+(x+(s.height-y)*.44)*unit,oy+((s.height-y)*.68+x*.15-z/cell)*unit];
  // Rasterize triangles directly to avoid Canvas clip anti-alias seams. A depth
  // buffer keeps nearer slopes in front, even when a mountain hides a valley.
  const frame=ctx.getImageData(0,0,w,h),out=frame.data,depth=new Float32Array(w*h).fill(-Infinity),tex=p.getImageData(0,0,plan.width,plan.height).data,tw=plan.width,th=plan.height,step=detail?1:2;
  const tri=(a,b,c)=>{const A=project(...a),B=project(...b),C=project(...c),det=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(Math.abs(det)<1e-8)return;const minX=Math.max(0,Math.floor(Math.min(A[0],B[0],C[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(A[0],B[0],C[0]))),minY=Math.max(0,Math.floor(Math.min(A[1],B[1],C[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(A[1],B[1],C[1]))),za=-.44*a[0]-a[1]+.614*a[2]/cell,zb=-.44*b[0]-b[1]+.614*b[2]/cell,zc=-.44*c[0]-c[1]+.614*c[2]/cell;
   for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++){const u=((B[1]-C[1])*(px+.5-C[0])+(C[0]-B[0])*(py+.5-C[1]))/det,v=((C[1]-A[1])*(px+.5-C[0])+(A[0]-C[0])*(py+.5-C[1]))/det,q=1-u-v;if(u<-.00001||v<-.00001||q<-.00001)continue;const z=u*za+v*zb+q*zc,di=py*w+px;if(z<depth[di])continue;depth[di]=z;const tx=Math.max(0,Math.min(tw-1,Math.floor((u*a[0]+v*b[0]+q*c[0])*scale))),ty=Math.max(0,Math.min(th-1,Math.floor((u*a[1]+v*b[1]+q*c[1])*scale))),si=(ty*tw+tx)*4,oi=di*4;out[oi]=tex[si];out[oi+1]=tex[si+1];out[oi+2]=tex[si+2];out[oi+3]=255;}
  };
  for(let y=s.height-step;y>=0;y-=step)for(let x=0;x<s.width;x+=step){const a=[x,y,terrainHeight(city,x,y)],b=[x+step,y,terrainHeight(city,x+step,y)],c=[x,y+step,terrainHeight(city,x,y+step)],d=[x+step,y+step,terrainHeight(city,x+step,y+step)];tri(a,b,d);tri(a,d,c);}ctx.putImageData(frame,0,0);

 }
 if(detail){ctx.fillStyle='#d9e6dc';ctx.font='12px system-ui';ctx.fillText(mode==='relief'?'OBLIQUE TERRAIN SURVEY':mode==='contours'?`TOPOGRAPHIC · ${s.maxElevation>700?'100':'25'} m CONTOURS`:'BUILDING SUITABILITY · SLOPE',20,27);ctx.fillStyle='#b2c5c0';ctx.font='11px system-ui';ctx.fillText(mode==='relief'?'True elevation · no vertical exaggeration':'N ↑ · north at top',20,h-18);ctx.textAlign='right';ctx.fillText(`${(s.width*cell/1000).toFixed(1)} × ${(s.height*cell/1000).toFixed(1)} km`,w-20,h-18);ctx.textAlign='left';}
 canvas.dataset.signature=terrainSignature(city);canvas.dataset.seed=String(city.seed);canvas.dataset.mode=mode;
 return s;
}
