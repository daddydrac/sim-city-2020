import {makeEnvironment} from './materials.mjs';
import * as THREE from './vendor/three.module.min.js';
// Independent Three.js context. Geometry is derived from the same deck layer data,
// while camera/picking uses the identical Mercator viewport. No shared GL resources.
export function createThreeRenderer({canvas,runtime,onViewChange,onClick,onReady,onError,interaction,onContextLost}){
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){onError(e,false);return null;}
 renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 let environment=null;try{environment=makeEnvironment(THREE,renderer);}catch{}const scene=new THREE.Scene();scene.environment=environment?.texture||null;scene.environmentIntensity=.5;const camera=new THREE.PerspectiveCamera();camera.matrixAutoUpdate=false;
 const hemi=new THREE.HemisphereLight(0xdcecff,0x5b6654,2),sun=new THREE.DirectionalLight(0xffecd4,3);sun.up.set(0,0,1);scene.add(hemi,sun,sun.target);
 sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0003;
 let sizeKey='';let viewport,state,origin=null,unit=1,painting=false,pointer=null,down=null,moved=false,ready=false;
 const streetLights=Array.from({length:4},()=>{const light=new THREE.PointLight(0xffd19a,0,0,2);scene.add(light);return light;});
 const alienLight=new THREE.PointLight(0x64ff86,0,0,1);scene.add(alienLight);
 const cache=new Map(),ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),dummy=new THREE.Object3D();
 const get=(p,k,d,f)=>typeof p[k]==='function'?p[k](d):p[k]??f;
 const point=coords=>{const p=viewport.projectPosition(coords);return new THREE.Vector3(p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]);};
 const color=c=>new THREE.Color().setRGB((c?.[0]??180)/255,(c?.[1]??190)/255,(c?.[2]??180)/255,THREE.SRGBColorSpace);
 const material=(p,{unlit=false,colors=false,water=false}={})=>{
  const params={polygonOffset:!!p.parameters?.polygonOffsetFill,polygonOffsetFactor:p.parameters?.polygonOffset?.[0]??0,polygonOffsetUnits:p.parameters?.polygonOffset?.[1]??0,color:0xffffff,vertexColors:colors,side:THREE.DoubleSide,transparent:!!(p.opacity&&p.opacity<1),opacity:p.opacity??1,depthTest:p.parameters?.depthTest!==false,depthWrite:p.parameters?.depthMask!==false};
  return unlit?new THREE.MeshBasicMaterial({...params,toneMapped:!p.id?.startsWith('ufo-')}):new THREE.MeshStandardMaterial({...params,roughness:p.cityMaterial?.roughness??(water?.22:.65),metalness:p.cityMaterial?.metalness??(water?.3:.08)});
 };
 const dispose=group=>{group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});scene.remove(group);};
 function convert(layer){
  const p=layer.props,id=layer.id,data=Array.from(p.data||[]),group=new THREE.Group();group.name=id;
  if(!data.length)return group;
  if(p.mesh){
   const g=new THREE.BufferGeometry(),attrs=p.mesh.attributes||{};
   for(const [key,names] of Object.entries({position:['positions','POSITION'],normal:['normals','NORMAL'],uv:['texCoords','TEXCOORD_0'],color:['colors','COLOR_0']})){
    const a=names.map(n=>attrs[n]).find(Boolean);if(a?.value){let values=a.value;if(key==='color'&&id.includes('terrain')||key==='color'&&id==='regional-water'){values=new Float32Array(a.value.length);for(let i=0;i<values.length;i++){const v=a.value[i];values[i]=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}}g.setAttribute(key,new THREE.BufferAttribute(values,a.size||(key==='uv'?2:3)));}
   }
   if(!g.attributes.position)return group;if(p.mesh.indices?.value)g.setIndex(new THREE.BufferAttribute(p.mesh.indices.value,1));if(!g.attributes.normal)g.computeVertexNormals();
   const mat=material(p,{unlit:p.material===false,colors:!!p._useMeshColors,water:id==='regional-water'});
   if(p.texture?.data){const tex=new THREE.CanvasTexture(p.texture.data);tex.colorSpace=THREE.SRGBColorSpace;if(id==='regional-terrain')tex.flipY=false;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());mat.map=tex;}
   const mesh=new THREE.InstancedMesh(g,mat,data.length);mesh.castShadow=!id.includes('terrain')&&id!=='regional-water'&&!p.cityMaterial?.transparent;mesh.receiveShadow=true;mesh.userData={data,pickable:p.pickable};
   data.forEach((d,i)=>{dummy.position.copy(point(get(p,'getPosition',d,d.position)));const scale=get(p,'getScale',d,[1,1,1]),rotation=get(p,'getOrientation',d,[0,0,0]);dummy.scale.set(scale[0]*unit,scale[1]*unit,scale[2]*unit);dummy.rotation.set(...rotation.map(v=>v*Math.PI/180));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color(get(p,'getColor',d,[255,255,255])));});mesh.computeBoundingSphere();group.add(mesh);
  }else if(p.getPath){
   const vertices=[],colors=[];
   for(const d of data){const path=get(p,'getPath',d,[]).map(point),c=color(get(p,'getColor',d,[200,210,200])),w=Math.max(.15,get(p,'getWidth',d,1))*unit/2;
    for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ox=-dy/len*w,oy=dx/len*w;
     for(const v of [[a.x+ox,a.y+oy,a.z],[a.x-ox,a.y-oy,a.z],[b.x+ox,b.y+oy,b.z],[b.x+ox,b.y+oy,b.z],[a.x-ox,a.y-oy,a.z],[b.x-ox,b.y-oy,b.z]]){vertices.push(...v);colors.push(c.r,c.g,c.b);}
    }
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,material(p,{colors:true,unlit:true}));const alpha=get(p,'getColor',data[0],[255,255,255,255])[3]??255;if(alpha<255){mesh.material.transparent=true;mesh.material.opacity=alpha/255;mesh.material.depthWrite=false;}mesh.receiveShadow=true;group.add(mesh);
  }else if(p.getPolygon){
   const vertices=[],colors=[];for(const d of data){let polygon=get(p,'getPolygon',d,[]);if(!polygon.length)continue;if(Array.isArray(polygon[0]?.[0]))polygon=polygon[0];const poly=polygon.map(point),c=color(get(p,'getFillColor',d,[100,145,120]));
    for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]]){vertices.push(v.x,v.y,v.z);colors.push(c.r,c.g,c.b);}
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,material(p,{colors:true,water:id.includes('water'),unlit:id.includes('preview')||id.includes('selected')}));if(id.includes('preview')||id.includes('selected')){mesh.material.transparent=true;mesh.material.opacity=.3;mesh.material.depthWrite=false;}mesh.receiveShadow=true;group.add(mesh);
  }else if(p.getPosition){
   const g=layer.id.includes('pool')?new THREE.CircleGeometry(1,20):new THREE.SphereGeometry(1,6,4),mat=material(p,{unlit:true});const alpha=get(p,'getFillColor',data[0],[255,255,255,255])[3]??255;if(alpha<255){mat.transparent=true;mat.opacity=alpha/255;mat.depthWrite=false;}const mesh=new THREE.InstancedMesh(g,mat,data.length);
   data.forEach((d,i)=>{dummy.position.copy(point(get(p,'getPosition',d,d.position)));dummy.rotation.set(0,0,0);dummy.scale.setScalar(get(p,'getRadius',d,1)*unit);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color(get(p,'getFillColor',d,[220,225,210])));});group.add(mesh);
  }
  return group;
 }
 const local=e=>{const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
 const pick=p=>{mouse.set(p[0]/canvas.clientWidth*2-1,1-p[1]/canvas.clientHeight*2);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(scene.children,true).find(h=>h.object.userData.pickable&&h.object.userData.data?.[h.instanceId]?.tileId!==undefined);return hit?{object:hit.object.userData.data[hit.instanceId]}:null;};
 const locate=e=>{if(!viewport)return null;const over=canvas.ownerDocument.elementFromPoint(e.clientX,e.clientY);if(over&&over!==canvas&&over.closest('button,input,select,nav,aside,dialog,#opening,footer'))return null;const [x,y]=local(e);if(x<0||y<0||x>=canvas.clientWidth||y>=canvas.clientHeight)return null;return interaction.locate({x,y,viewport,pick:()=>pick([x,y])});};
 const finish=()=>{if(pointer!==null){if(painting)interaction.end();if(canvas.hasPointerCapture(pointer))canvas.releasePointerCapture(pointer);pointer=null;down=null;}};
 const handlers={
  pointerdown:e=>{if(!viewport)return;pointer=e.pointerId;down=local(e);moved=false;canvas.setPointerCapture(pointer);if(e.button===0&&interaction.enabled()){painting=true;interaction.start(locate(e));}else painting=false;},
  pointermove:e=>{if(!viewport)return;const p=local(e);interaction.hover(locate(e));if(pointer===null)return;if(!(e.buttons&3)){finish();return;}const dx=p[0]-down[0],dy=p[1]-down[1];if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
   if(painting)interaction.move(locate(e));else if(e.buttons===2||e.shiftKey)onViewChange({...state,bearing:state.bearing+dx*.4,pitch:Math.max(0,Math.min(80,state.pitch+dy*.3))});else{const a=viewport.unproject(down),b=viewport.unproject(p);onViewChange({...state,longitude:state.longitude+a[0]-b[0],latitude:state.latitude+a[1]-b[1]});}down=p;
  },
  pointerup:e=>{if(!painting&&!moved&&e.button===0){const p=local(e);onClick({...pick(p),viewport,pixel:p,coordinate:viewport.unproject(p)});}finish();},
  pointercancel:finish,lostpointercapture:finish,
  wheel:e=>{e.preventDefault();if(!viewport)return;if(e.shiftKey){onViewChange({...state,bearing:state.bearing+e.deltaY*.12});return;}if(e.altKey){onViewChange({...state,pitch:Math.max(0,Math.min(80,state.pitch+e.deltaY*.06))});return;}const p=local(e),a=viewport.unproject(p),next={...state,zoom:Math.max(8,Math.min(20,state.zoom-e.deltaY*.002))},v=new runtime.WebMercatorViewport({...next,width:canvas.clientWidth,height:canvas.clientHeight}),b=v.unproject(p);next.longitude+=a[0]-b[0];next.latitude+=a[1]-b[1];onViewChange(next);},
  contextmenu:e=>e.preventDefault(),webglcontextlost:e=>{e.preventDefault();onContextLost?.();}
 };
 for(const [event,fn]of Object.entries(handlers))canvas.addEventListener(event,fn,{passive:false});window.addEventListener('blur',finish);
 return {update({mapState,layers,cursor,effect,alienEvent}){
  try{
   state=mapState;const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
   viewport=new runtime.WebMercatorViewport({...mapState,width,height});unit=viewport.distanceScales.unitsPerMeter[2];if(!origin)origin=viewport.projectPosition([mapState.longitude,mapState.latitude,0]);
   const size=width+'x'+height;if(sizeKey!==size){renderer.setSize(width,height,false);sizeKey=size;}canvas.style.cursor=cursor;
   camera.projectionMatrix.fromArray(viewport.projectionMatrix);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.matrixWorldInverse.fromArray(viewport.viewMatrix).multiply(new THREE.Matrix4().makeTranslation(...origin));camera.matrixWorld.copy(camera.matrixWorldInverse).invert();camera.position.setFromMatrixPosition(camera.matrixWorld);camera.matrix.copy(camera.matrixWorld);
   const sunSource=effect?.directionalLights?.[0],ambient=effect?.ambientLight;
   const direction=sunSource?.direction||[-1,-2,-4],target=point([state.longitude,state.latitude,0]);sun.target.position.copy(target);sun.position.copy(target).add(new THREE.Vector3(-direction[0],-direction[1],-direction[2]).normalize().multiplyScalar(2200*unit));sun.intensity=sunSource?sunSource.intensity*2:3;sun.color.copy(color(sunSource?.color||[255,240,220]));hemi.intensity=ambient?ambient.intensity:1;
   sun.shadow.camera.left=sun.shadow.camera.bottom=-1800*unit;sun.shadow.camera.right=sun.shadow.camera.top=1800*unit;sun.shadow.camera.near=.1*unit;sun.shadow.camera.far=8000*unit;sun.shadow.camera.updateProjectionMatrix();sun.castShadow=!effect?.id?.includes('plain');renderer.shadowMap.enabled=sun.castShadow;
   const pointSources=effect?.pointLights||[];streetLights.forEach((light,i)=>{const source=pointSources[i];light.visible=!!source;if(source){light.position.copy(point(source.position));light.color.copy(color(source.color));light.intensity=source.intensity*.003;light.distance=40*unit;light.decay=1;}});
   alienLight.visible=!!alienEvent?.frame?.beam;if(alienLight.visible){const p=layers.find(l=>l?.id==='ufo-ground-pool')?.props?.data?.[0]?.position;if(p){alienLight.position.copy(point([p[0],p[1],p[2]+20]));alienLight.intensity=.01*alienEvent.frame.beam;alienLight.distance=100*unit;}}
   const night=sun.intensity<.8;scene.environmentIntensity=night?.08:.5;scene.background=new THREE.Color(night?0x101d30:0x9bb9c5);scene.fog=new THREE.FogExp2(scene.background,1/(14000*unit*2**state.zoom));
   const ids=new Set();for(const layer of layers){if(!layer)continue;ids.add(layer.id);const previous=cache.get(layer.id);if(previous?.data===layer.props.data)continue;if(previous)dispose(previous.group);const group=convert(layer);scene.add(group);cache.set(layer.id,{data:layer.props.data,group});}for(const [id,item]of cache)if(!ids.has(id)){dispose(item.group);cache.delete(id);}
   renderer.render(scene,camera);if(!ready){ready=true;onReady();}
  }catch(e){onError(e,ready);}
 },finalize(){finish();for(const [event,fn]of Object.entries(handlers))canvas.removeEventListener(event,fn);window.removeEventListener('blur',finish);for(const item of cache.values())dispose(item.group);environment?.dispose();renderer.dispose();}};
}
