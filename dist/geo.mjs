import {dimensions,gridIndex} from './grid.mjs';
export const ORIGIN=[-122.42,37.77],DX=.000568,DY=.000449;
export function projection(city){const {width,height,cellSize}=dimensions(city),origin=city?.origin||ORIGIN;return {width,height,origin,dx:city?.width?cellSize/(111320*Math.cos(origin[1]*Math.PI/180)):DX,dy:city?.width?cellSize/111320:DY};}
export function position(x,y,z=0,city){const {width,height,origin,dx,dy}=projection(city);return [origin[0]+(x-width/2)*dx,origin[1]+(y-height/2)*dy,z];}
export const tilePosition=(t,dx=.5,dy=.5,z=0,city)=>position(t.x+dx,t.y+dy,z+(city?.width?terrainHeight(city,t.x+.5,t.y+.5):(t.elevation||0)*6),city);
export function gridCoordinate(coord,city){const p=projection(city);return [(coord[0]-p.origin[0])/p.dx+p.width/2,(coord[1]-p.origin[1])/p.dy+p.height/2];}
export function tileAt(coord,city){if(!coord||!coord.every(Number.isFinite))return null;const [a,b]=gridCoordinate(coord,city),{width,height}=dimensions(city),x=Math.floor(a),y=Math.floor(b);return x>=0&&x<width&&y>=0&&y<height?gridIndex(x,y,city):null;}
export const HOME={longitude:ORIGIN[0]+DX,latitude:ORIGIN[1]+DY,zoom:14.75,pitch:50,bearing:-32,dragRotate:true,maxZoom:20,minZoom:8};
export function homeFor(city,regional=false){const {width,height}=dimensions(city),[x,y]=regional?[width/2,height/2]:city.center||[17,17],p=position(x,y,0,city);return {...HOME,longitude:p[0],latitude:p[1],zoom:regional&&city.width?11.7:14.7};}
// Same corner height field as the rendered terrain; coordinates are in parcels.
function cornerHeight(city,x,y){const {width,height}=dimensions(city);let sum=0;for(const dy of [-1,0])for(const dx of [-1,0]){const ix=Math.max(0,Math.min(width-1,x+dx)),iy=Math.max(0,Math.min(height-1,y+dy));sum+=(city.tiles[iy*width+ix]?.elevation||0)*6;}return sum/4;}
export function terrainHeight(city,x,y){const {width,height}=dimensions(city),ix=Math.max(0,Math.min(width-1,Math.floor(x))),iy=Math.max(0,Math.min(height-1,Math.floor(y))),u=Math.max(0,Math.min(1,x-ix)),v=Math.max(0,Math.min(1,y-iy)),a=cornerHeight(city,ix,iy),b=cornerHeight(city,ix+1,iy),c=cornerHeight(city,ix,iy+1),d=cornerHeight(city,ix+1,iy+1);return u>=v?a+(b-a)*u+(d-b)*v:a+(d-c)*u+(c-a)*v;}
export function cursorParcel(viewport,pixel,city,depth=0){
 if(!viewport?.unproject)return null;
 // Two points on the camera ray, in CSS pixels (never device pixels).
 const a=viewport.unproject(pixel,{targetZ:3006}),b=viewport.unproject(pixel,{targetZ:-100});
 if(!a||!b||![...a,...b].every(Number.isFinite))return null;
 const ga=gridCoordinate(a,city),gb=gridCoordinate(b,city),{width,height}=dimensions(city);
 let enter=0,exit=1;
 for(let k=0;k<2;k++){const d=gb[k]-ga[k],max=k?height:width;if(Math.abs(d)<1e-9){if(ga[k]<0||ga[k]>=max)return null;}else{let u=-ga[k]/d,v=(max-ga[k])/d;if(u>v)[u,v]=[v,u];enter=Math.max(enter,u);exit=Math.min(exit,v);}}
 if(enter>exit)return null;
 const point=u=>[ga[0]+(gb[0]-ga[0])*u,ga[1]+(gb[1]-ga[1])*u];
 const delta=u=>{const [x,y]=point(u);return 3006-3106*u-(terrainHeight(city,x,y)-depth);};
 const steps=Math.max(8,Math.ceil(Math.max(Math.abs(gb[0]-ga[0]),Math.abs(gb[1]-ga[1]))*(exit-enter)*3));
 let previous=enter,above=delta(enter);
 for(let i=1;i<=steps;i++){const u=enter+(exit-enter)*i/steps,d=delta(u);if(above>=0&&d<=0){let lo=previous,hi=u;for(let j=0;j<18;j++){const mid=(lo+hi)/2;if(delta(mid)>0)lo=mid;else hi=mid;}const [x,y]=point((lo+hi)/2);return x>=0&&x<width&&y>=0&&y<height?gridIndex(Math.floor(x),Math.floor(y),city):null;}previous=u;above=d;}
 return null;
}
