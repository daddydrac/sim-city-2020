// Keep every GPU object in one deck.gl runtime. Kepler's UMD has a separate
// luma Texture class, even when its version matches the standalone bundle.
export const RELEASE='0.5.1';
export const GRAPHICS_KEY='sc2020-graphics';
export const TEXTURE_PARAMETERS=Object.freeze({
  10241:9729, // TEXTURE_MIN_FILTER: LINEAR (no mipmap dependency)
  10240:9729, // TEXTURE_MAG_FILTER: LINEAR
  10242:33071, // TEXTURE_WRAP_S: CLAMP_TO_EDGE
  10243:33071 // TEXTURE_WRAP_T: CLAMP_TO_EDGE
});

export function graphicsSettings(userAgent='',saved=null){
  let settings={};
  try{settings=JSON.parse(saved)||{};}catch{}
  return {shadows:typeof settings.shadows==='boolean'?settings.shadows:!/Firefox\//i.test(userAgent)};
}

export function createCityRenderer({runtime,canvas,onViewChange,onClick,onReady,onError,onContextLost,onContextRestored,interaction}){
  const lost=event=>{event.preventDefault();onContextLost?.();};
  const restored=()=>onContextRestored?.();
  canvas.addEventListener('webglcontextlost',lost);
  canvas.addEventListener('webglcontextrestored',restored);
  const detach=()=>{
    canvas.removeEventListener('webglcontextlost',lost);
    canvas.removeEventListener('webglcontextrestored',restored);
  };
  let renderer,ready=false,pointer=null;
  const local=event=>{const r=canvas.getBoundingClientRect();return [event.clientX-r.left,event.clientY-r.top];};
  const hit=event=>{const [x,y]=local(event),r=canvas.getBoundingClientRect();if(x<0||y<0||x>=r.width||y>=r.height)return null;const over=canvas.ownerDocument?.elementFromPoint?.(event.clientX,event.clientY);if(over&&over!==canvas&&over.closest('button,input,select,nav,aside,dialog,#opening,footer'))return null;const viewport=renderer?.getViewports?.()[0];return interaction?.locate({x,y,viewport,pick:()=>renderer?.pickObject({x,y,radius:0})});};
  const finish=event=>{if(pointer===null||event?.pointerId!==undefined&&event.pointerId!==pointer)return;const id=pointer;pointer=null;if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);interaction?.end();};
  const down=event=>{if(event.button!==0||!interaction?.enabled())return;event.preventDefault();pointer=event.pointerId;canvas.setPointerCapture?.(pointer);interaction.start(hit(event));};
  const move=event=>{if(pointer!==null&&!(event.buttons&1)){finish();return;}const id=hit(event);interaction?.hover(id);if(pointer!==null&&event.pointerId===pointer){event.preventDefault();interaction.move(id);}};
  const leave=()=>{if(pointer===null)interaction?.hover(null);};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);canvas.addEventListener('lostpointercapture',finish);canvas.addEventListener('pointerleave',leave);
  const host=canvas.ownerDocument?.defaultView;host?.addEventListener('blur',finish);
  try{
    renderer=new runtime.Deck({
      canvas,width:'100%',height:'100%',useDevicePixels:1,
      views:new runtime.MapView({id:'city-map',repeat:false}),
      controller:{dragRotate:true,doubleClickZoom:false},
      parameters:{clearColor:[.043,.09,.14,1]},
      onClick,
      onViewStateChange:({viewState})=>onViewChange(viewState),
      onLoad:()=>{ready=true;onReady?.();},
      onError:error=>onError?.(error,ready)
    });
  }catch(error){detach();for(const [name,fn]of [['pointerdown',down],['pointermove',move],['pointerup',finish],['pointercancel',finish],['lostpointercapture',finish],['pointerleave',leave]])canvas.removeEventListener(name,fn);host?.removeEventListener('blur',finish);onError?.(error,false);return null;}
  return {
    update({mapState,layers,effect,cursor,painting=false}){
      // Do not forward Kepler's layer/effect instances to this Deck instance.
      const {longitude,latitude,zoom,pitch,bearing,minZoom,maxZoom,position}=mapState;
      renderer.setProps({viewState:{longitude,latitude,zoom,pitch,bearing,minZoom,maxZoom,position},layers,effects:[effect],controller:{dragPan:!painting,dragRotate:true,doubleClickZoom:false,maxPitch:85},getCursor:()=>cursor});
    },
    finalize(){finish();detach();for(const [name,fn]of [['pointerdown',down],['pointermove',move],['pointerup',finish],['pointercancel',finish],['lostpointercapture',finish],['pointerleave',leave]])canvas.removeEventListener(name,fn);host?.removeEventListener('blur',finish);renderer.finalize();}
  };
}
