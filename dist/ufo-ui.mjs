import {createUfoClock,normalizeUfoSettings,chooseUfoTarget,ufoCamera} from './ufo.mjs';
import {position,terrainHeight} from './geo.mjs';
export function setupUfoEvents({getCity,view,getMapState,setView,getPlaying,setRunning,canStart,changed,modal,toast}){
 let current=null,clock=null,target=null,saved=null,last=null,elapsed=0,pointerHeld=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const hud=document.createElement('div');hud.id='ufo-status';hud.hidden=true;hud.innerHTML='<span role="status" id="ufo-caption"></span><button type="button" id="ufo-skip">Skip visit</button>';document.querySelector('.map-shell').append(hud);
 const caption=hud.querySelector('span');
 function sync(){const city=getCity();if(city!==current){if(clock)clock.cancel();saved=null;target=null;hud.hidden=true;current=city;current.ambientEvents=normalizeUfoSettings(city.ambientEvents);clock=createUfoClock({remaining:current.ambientEvents.remaining});last=null;}return city;}
 function finish(restore=true){if(!clock?.active&&!saved)return;clock?.cancel();hud.hidden=true;target=null;const prior=saved;saved=null;if(prior&&restore){Object.assign(view,prior.view);setView({...prior.camera,transitionDuration:0});setRunning(prior.playing);changed();}}
 function start(){sync();if(clock.active||pointerHeld||!canStart())return false;const tile=chooseUfoTarget(current);if(!tile){toast('Add a neighborhood before inviting a visitor.');return false;}
  const x=tile.x+.87,y=tile.y+.86;target={x,y,z:terrainHeight(current,x,y),tileId:tile.id};
  const camera=getMapState();saved={camera:{longitude:camera.longitude,latitude:camera.latitude,zoom:camera.zoom,pitch:camera.pitch,bearing:camera.bearing},view:{underground:view.underground,orbital:view.orbital,cutDepth:view.cutDepth,network:view.network,cameraAltitude:view.cameraAltitude||0,cameraGrid:view.cameraGrid?.slice()},playing:getPlaying()};
  setRunning(false);view.underground=false;view.orbital=false;view.cameraGrid=[x,y];elapsed=0;clock.start();current.ambientEvents.remaining=clock.remaining;hud.hidden=false;caption.textContent='An unexpected visitor';changed();return true;
 }
 function update(now){sync();if(last===null){last=now;return;}const dt=Math.max(0,now-last);last=now;const allowed=canStart()&&!pointerHeld;
  const result=clock.advance(dt,{eligible:current.ambientEvents.enabled&&getPlaying()&&allowed,visible:!document.hidden});current.ambientEvents.remaining=clock.remaining;
  if(result==='due'&&allowed)start();else if(result==='finished'){finish();return;}
  if(clock.active&&saved){elapsed=clock.frame.time;const [longitude,latitude]=position(target.x,target.y,0,current),destination={longitude,latitude,zoom:17.6,pitch:55,bearing:-25,cameraAltitude:target.z+40};const cam=ufoCamera({...saved.camera,cameraAltitude:saved.view.cameraAltitude},destination,elapsed,{reducedMotion:reduced});view.cameraAltitude=cam.cameraAltitude;delete cam.cameraAltitude;setView({...cam,transitionDuration:0});if(caption.textContent!==clock.frame.stage)caption.textContent=clock.frame.stage;}
 }
 const cancel=()=>finish();hud.querySelector('button').onclick=cancel;
 document.addEventListener('visibilitychange',()=>{last=null;});
 document.addEventListener('pointerdown',e=>{if(clock?.active&&e.target.closest('nav,aside,footer'))cancel();},{capture:true});
 const map=document.getElementById('map');
 for(const type of ['pointerdown','wheel'])map.addEventListener(type,e=>{if(clock?.active){e.preventDefault();e.stopImmediatePropagation();cancel();return;}if(type==='pointerdown')pointerHeld=true;},{capture:true,passive:false});
 for(const type of ['pointerup','pointercancel','blur'])window.addEventListener(type,()=>pointerHeld=false);
 document.addEventListener('keydown',e=>{if(clock?.active&&e.key==='Escape'){e.preventDefault();cancel();}});
 const button=document.createElement('button');button.id='ufo-open';button.textContent='City surprises';document.querySelector('nav').prepend(button);
 button.onclick=()=>{cancel();sync();modal('<h2>Unexpected visitors</h2><label><input id="ufo-enabled" type="checkbox"> Rare UFO visits</label><p>One harmless 10-second scene after a random 18–45 minutes of active play. The camera returns to your previous view. Construction strokes and launches are never interrupted.</p><button id="ufo-preview" type="button">Preview a visit</button><p class="modal-note">Escape, Skip visit, or touching the map ends the scene. Hidden tabs and paused play do not advance the waiting timer.</p>');const enabled=document.getElementById('ufo-enabled');enabled.checked=current.ambientEvents.enabled;enabled.onchange=()=>{current.ambientEvents.enabled=enabled.checked;};document.getElementById('ufo-preview').onclick=()=>{document.getElementById('modal').close();setTimeout(()=>{if(!start())toast('Return to a surface city view after finishing construction or launch tracking, then preview.');},0);};};
 return {update,cancel,get active(){return !!clock?.active;},get event(){return clock?.active?{frame:clock.frame,target}:null;}};
}
