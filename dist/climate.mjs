export const SEASONS=['auto','spring','summer','autumn','winter'];
export const WEATHER=['auto','sun','rain','wind','snow','hail','meteor'];
export function climate(city){
 const e=city.environment||{},m=city.month%12;
 const season=e.season&&e.season!=='auto'?e.season:['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'][m];
 const choices={winter:['snow','sun','hail','wind'],spring:['rain','sun','wind','rain'],summer:['sun','sun','wind','rain'],autumn:['wind','rain','sun','rain']};
 const weather=e.weather&&e.weather!=='auto'?e.weather:choices[season][(city.month+city.seed)%4];
 const hour=e.lighting==='night'?22:(e.hour??13);
 const declination={winter:-.38,spring:0,summer:.38,autumn:0}[season],latitude=37.77*Math.PI/180,hourAngle=(hour-12)*Math.PI/12;
 const sunHeight=Math.sin(latitude)*Math.sin(declination)+Math.cos(latitude)*Math.cos(declination)*Math.cos(hourAngle);
 const night=sunHeight<=0||weather==='meteor';
 const sunDirection=[Math.sin(hourAngle),Math.cos(hourAngle)*Math.sin(latitude)-Math.tan(declination)*Math.cos(latitude),-Math.max(.08,sunHeight)];
 const wind=weather==='wind'?Math.max(65,e.wind??30):e.wind??30;
 return {season,weather,wind,night,hour,sunHeight,sunDirection,trafficFactor:weather==='snow'?1.4:weather==='hail'?1.5:weather==='rain'?1.2:1,powerFactor:season==='winter'?1.2:season==='summer'?1.1:1,launchable:!['rain','hail','snow','wind'].includes(weather)&&wind<55};
}
