// City-wide unlocks require BOTH calendar age and current population. Earned eras persist.
export const START_YEAR=1900;
export const YEAR_MS=8*60*1000;
export const MONTH_MS=YEAR_MS/12;
export const MILESTONES=Object.freeze([
 [1900,0,'Settlement'],[1905,500,'Growing town'],[1920,2500,'Town center'],
 [1935,10000,'Small city'],[1950,25000,'City'],[1970,50000,'Regional city'],
 [1990,100000,'Metropolis'],[2020,200000,'Connected metropolis'],
 [2050,350000,'Green megacity'],[2071,500000,'Forest-dome era']
].map(([year,population,name],i)=>Object.freeze({phase:i+1,year,population,name})));
export const calendarYear=city=>(city.calendar?.startYear??2020)+Math.floor(city.month/12);
export const calendarLabel=city=>new Date(Date.UTC(calendarYear(city),city.month%12,1)).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).toUpperCase();
export function eligiblePhase(year,population){let phase=1;for(const gate of MILESTONES)if(year>=gate.year&&population>=gate.population)phase=gate.phase;return phase;}
export function progressionStatus(city){const phase=city.progression?.phase??1,next=MILESTONES[phase];return {phase,name:MILESTONES[phase-1].name,year:calendarYear(city),population:city.metrics?.population||0,next:next?{...next,yearsRemaining:Math.max(0,next.year-calendarYear(city)),residentsRemaining:Math.max(0,next.population-(city.metrics?.population||0))}:null};}
export function unlockProgression(city){city.progression??={version:1,phase:1};const prior=city.progression.phase;city.progression.phase=Math.max(prior,eligiblePhase(calendarYear(city),city.metrics?.population||0));return city.progression.phase>prior;}
// Time fraction survives pausing, speed changes and saves; no background-tab catch-up.
export function advanceClock(city,elapsedMs,{speed=1,playing=true,visible=true,onMonth=()=>{}}={}){
 if(!playing||!visible||!Number.isFinite(elapsedMs)||elapsedMs<=0||!Number.isFinite(speed)||speed<=0)return 0;
 city.calendar??={startYear:START_YEAR,monthProgress:0};
 const total=city.calendar.monthProgress+elapsedMs*Math.max(0,speed),months=Math.floor(total/MONTH_MS);
 city.calendar.monthProgress=total-months*MONTH_MS;
 for(let i=0;i<months;i++)onMonth(city);
 return months;
}
