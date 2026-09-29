// Cosmetic event clock. Seconds are active wall time, independent of simulation speed.
export const UFO_DURATION=10;
export const UFO_MIN_WAIT=18*60;
export const UFO_MAX_WAIT=45*60;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function nextUfoWait(random=Math.random){return UFO_MIN_WAIT+clamp(random())*(UFO_MAX_WAIT-UFO_MIN_WAIT);}
export function normalizeUfoSettings(value,random=Math.random){return {enabled:value?.enabled!==false,remaining:Number.isFinite(value?.remaining)?clamp(value.remaining,0,UFO_MAX_WAIT):nextUfoWait(random)};}
export function ufoFrame(seconds){
 const t=clamp(seconds,0,UFO_DURATION),arrival=smooth(t/1.5),departure=smooth((t-7.5)/1),beam=smooth((t-2.5)/.6)*(1-smooth((t-7.1)/.4));
 const lift=t<6?smooth((t-3.3)/2.5):1-smooth((t-6)/1.1);
 return {active:seconds>=0&&seconds<UFO_DURATION,time:t,arrival,departure,beam,lift:clamp(lift),returning:smooth((t-8.5)/1.5),visible:t<8.5,offset:[(1-arrival)*-210+departure*250,(1-arrival)*110+departure*100,90+(1-arrival)*110+departure*190],spin:t*.8,stage:t<1.5?'An unexpected visitor':t<3.3?'Scanning for intelligent life':t<6?'Please keep your arms inside the beam':t<7.5?'Resident returned. Review: one star.':t<8.5?'Nothing to see here, Mayor.':'Returning to your city'};
}
export function createUfoClock({remaining,random=Math.random}={}){
 let wait=Number.isFinite(remaining)?clamp(remaining,0,UFO_MAX_WAIT):nextUfoWait(random),elapsed=null;
 return {get active(){return elapsed!==null;},get remaining(){return wait;},get frame(){return elapsed===null?null:ufoFrame(elapsed);},
  start(){if(elapsed!==null)return false;elapsed=0;wait=nextUfoWait(random);return true;},
  cancel(){elapsed=null;},
  advance(seconds,{eligible=true,visible=true}={}){if(!visible||!Number.isFinite(seconds)||seconds<=0)return null;if(elapsed!==null){elapsed+=seconds;if(elapsed>=UFO_DURATION){elapsed=null;return 'finished';}return null;}if(!eligible)return null;wait=Math.max(0,wait-seconds);if(wait===0)return 'due';return null;}
 };
}
export function chooseUfoTarget(city,random=Math.random){
 const live=city.activeTiles||city.tiles;
 let options=live.filter(t=>t.terrain==='land'&&!t.burning&&['park','forest'].includes(t.type));
 if(!options.length)options=live.filter(t=>t.terrain==='land'&&!t.burning&&t.type==='residential'&&t.level<=4);
 if(!options.length)options=city.tiles.filter(t=>t.terrain==='land'&&!t.burning&&t.type==='empty');
 return options[Math.min(options.length-1,Math.floor(clamp(random())*options.length))]||null;
}
export function ufoCamera(saved,target,seconds,{reducedMotion=false}={}){
 const f=ufoFrame(seconds);if(reducedMotion)return seconds<8.5?{...target}:{...saved};
 const a=seconds<1.5?smooth(seconds/1.5):1-f.returning,output={...saved};
 for(const key of ['longitude','latitude','zoom','pitch','bearing','cameraAltitude']){const from=Number(saved[key])||0,to=Number(target[key])||0;let delta=to-from;if(key==='bearing')delta=((delta+540)%360)-180;output[key]=from+delta*a;}
 return output;
}
