import {icon} from './icons.mjs';
export function setPanel(id,open){
 const panel=document.getElementById(id),button=document.querySelector(`[aria-controls="${id}"]`);
 if(!panel)return;panel.hidden=!open;button?.setAttribute('aria-expanded',String(open));
}
export function setupHud(){
 for(const [id,panel,shape] of [['toggle-menu','city-menu','menu'],['toggle-stats','city-stats','stats'],['toggle-inspector','city-inspector','info'],['toggle-layers','city-layers','layers'],['toggle-build','build-options','settings']]){
  const button=document.getElementById(id);button.innerHTML=icon(shape);
  button.onclick=()=>setPanel(panel,document.getElementById(panel).hidden);
 }
 document.getElementById('city-menu').addEventListener('click',e=>{if(e.target.closest('button'))setPanel('city-menu',false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){
  for(const id of ['city-menu','city-stats','city-inspector','city-layers','build-options'])setPanel(id,false);
  document.querySelectorAll('#tools details[open]').forEach(d=>d.open=false);
 }});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.build-panel')){
  setPanel('build-options',false);document.querySelectorAll('#tools details[open]').forEach(d=>d.open=false);
 }});
}
