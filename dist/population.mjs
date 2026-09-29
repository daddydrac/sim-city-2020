// Residents and jobs are independent occupancy values, never implied by a render level.
import {sector} from './economy.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const HOME_TYPES=['residential','mixeduse','arcology'];
const HOMES=[24,64,144,280,520,900,1600,2500,3600,5000];
const JOBS=[16,36,80,150,280,480,800,1300,1900,2800];
export function parcelCapacity(t){const p=clamp((t.level||1)-1,0,9),home=HOME_TYPES.includes(t.type),work=['commercial','industrial','skyscraper','mall','stripmall','hotel','casino','bank','mixeduse'].includes(t.type);return {homes:home?Math.round(HOMES[p]*(t.type==='arcology'?4:t.type==='mixeduse'?2:1)):0,jobs:work?Math.round(JOBS[p]*({industrial:1.4,mall:3,stripmall:1.1,mixeduse:1.2,hotel:2,casino:3,bank:2.5,skyscraper:5}[t.type]||1)):0};}
export function effectiveTax(city,t){const f=city.finance,rate=f?.rates?.[sector(t)]??city.tax;return rate+(f?.progressive||0)*clamp(((t.landValue||0)-80)/70,0,1);}
export function migrationRate({tax,demand,supplied,happiness,employment=1}){
 if(!supplied)return -.10;
 if(tax>=18)return -Math.min(.12,.012+(tax-18)*.012);
 if(happiness<30)return -.04;
 if(demand<0)return -Math.min(.06,.004+Math.abs(demand)*.0005);
 const taxFactor=clamp((18-tax)/9,.05,2),demandFactor=.25+clamp(demand,0,100)/100;
 return .032*taxFactor*demandFactor*clamp(employment,.12,1)*clamp(happiness/65,.25,1.3);
}
export function advancePopulation(city){
 const m=city.metrics,employment=clamp((m.jobs+200)/Math.max(200,m.population*.48),.12,1);
 for(const t of city.activeTiles||city.tiles){const cap=parcelCapacity(t);if(!cap.homes&&!cap.jobs)continue;
  const supplied=t.access&&t.powered&&t.watered&&!t.burning,tax=effectiveTax(city,t);
  if(cap.homes){const current=clamp(t.residents||0,0,cap.homes),rate=migrationRate({tax,demand:m.demand.residential,supplied,happiness:t.happiness,employment});t.residents=clamp(current+(rate>0?(cap.homes-current)*rate:current*rate),0,cap.homes);}
  if(cap.jobs){const key=t.type==='industrial'?'industrial':'commercial',rate=migrationRate({tax,demand:m.demand[key],supplied,happiness:t.happiness});const current=clamp(t.workers||0,0,cap.jobs),labor=clamp((m.population*.55+200)/Math.max(200,m.jobs),.15,1);t.workers=clamp(current+(rate>0?(cap.jobs-current)*rate*labor:current*rate),0,cap.jobs);}
  if(t.burning){t.residents=0;t.workers=0;}
 }
}
