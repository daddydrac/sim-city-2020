export const AUDIO_STAGES=[['Settlement',0,'settlement'],['Village',1000,'village'],['Town',10000,'town'],['City',50000,'city'],['Metropolis',100000,'metropolis'],['Major metropolis',500000,'major'],['Megacity',1000000,'megacity']];
export const populationStage=n=>Math.max(0,AUDIO_STAGES.findLastIndex(s=>n>=s[1]));
export function setupAudio({getCity,getPlaying,modal,button,toast}){
 let prefs={music:.25,effects:.45,enabled:true};try{Object.assign(prefs,JSON.parse(localStorage.getItem('sc2020-audio-v2')||'{}'));}catch{}
 let ctx=null,current=null,old=null,stage=-1,candidate=-1,since=0,started=false,fade=1,lastEffect=0;
 const save=()=>{try{localStorage.setItem('sc2020-audio-v2',JSON.stringify(prefs));}catch{}};
 const unlock=()=>{if(!ctx){try{ctx=new AudioContext();}catch{}}ctx?.resume().catch(()=>{});started=true;};
 document.addEventListener('pointerdown',unlock,{once:true});
 function effect(kind){if(!ctx||!prefs.effects||document.hidden)return;const now=ctx.currentTime;if(now-lastEffect<.12)return;lastEffect=now;const gain=ctx.createGain();gain.connect(ctx.destination);const duration=kind==='bulldoze'?.6:kind==='pipe'?.24:kind==='wire'?.15:.09;gain.gain.setValueAtTime(prefs.effects*.12,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  if(['bulldoze','road','raise','lower'].includes(kind)){const b=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate),v=b.getChannelData(0);for(let i=0;i<v.length;i++)v[i]=(Math.random()*2-1);const s=ctx.createBufferSource(),filter=ctx.createBiquadFilter();s.buffer=b;filter.type='lowpass';filter.frequency.value=kind==='bulldoze'?500:1800;s.connect(filter).connect(gain);s.start();s.stop(now+duration);}
  else{const o=ctx.createOscillator();o.type=kind==='wire'?'sawtooth':'sine';o.frequency.setValueAtTime((kind==='pipe'?420:kind==='wire'?120:900)*(1+Math.random()*.12),now);o.frequency.exponentialRampToValueAtTime(kind==='pipe'?180:kind==='wire'?65:500,now+duration);o.connect(gain);o.start();o.stop(now+duration);}
 }
 document.addEventListener('city-build-audio',e=>effect(e.detail));document.addEventListener('click',e=>{if(e.target.closest('button'))effect('ui');});
 const choose=n=>{stage=n;old=current;current=new Audio('audio/'+AUDIO_STAGES[n][2]+'.mp3');current.loop=true;current.volume=0;fade=0;current.play().catch(()=>{});};
 setInterval(()=>{
  const hidden=document.hidden||!started||!prefs.enabled;const n=populationStage(getCity().metrics.population);
  if(stage<0&&started&&!hidden)choose(n);
  if(n!==candidate){candidate=n;since=performance.now();}
  if(n!==stage&&getPlaying()&&performance.now()-since>30000&&(!old||fade>=1)&&!hidden)choose(n);
  fade=Math.min(1,fade+.04);if(current){current.volume=hidden?0:prefs.music*fade;if(hidden)current.pause();else if(current.paused)current.play().catch(()=>{});}if(old){old.volume=hidden?0:prefs.music*(1-fade);if(fade===1){old.pause();old=null;}}
 },200);
 button('audio-open','Audio settings',()=>{modal('<h2>Music & sound</h2><p>Independent controls. The soundtrack changes with resident population.</p><label>Music <input id="music-volume" type="range" min="0" max="100"><output id="music-out"></output></label><label>Sound effects <input id="effect-volume" type="range" min="0" max="100"><output id="effect-out"></output></label><button id="audio-toggle"></button><button id="preview-sound">Preview pipe sound</button><p id="audio-stage" class="readout"></p><p class="modal-note">Seven new synthesized compositions with different tempos and instrumentation. Prototype soundtrack; not recorded orchestral music. Set either slider to zero to mute that channel. Background tabs are silent.</p>');
  for(const [id,key,out]of [['music-volume','music','music-out'],['effect-volume','effects','effect-out']]){const el=document.getElementById(id);el.value=prefs[key]*100;document.getElementById(out).textContent=el.value+'%';el.oninput=()=>{prefs[key]=+el.value/100;document.getElementById(out).textContent=el.value+'%';save();};}
  const toggle=document.getElementById('audio-toggle');const update=()=>toggle.textContent=prefs.enabled?'Pause music':'Enable music';update();toggle.onclick=()=>{unlock();prefs.enabled=!prefs.enabled;save();update();};document.getElementById('preview-sound').onclick=()=>{unlock();effect('pipe');};document.getElementById('audio-stage').textContent='Population stage: '+AUDIO_STAGES[populationStage(getCity().metrics.population)][0];
 });
}
