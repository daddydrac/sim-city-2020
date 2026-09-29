export const SECTORS=['residential','commercial','industrial','tourism','space'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function normalizeFinance(city){const f=city.finance||{};city.finance=Object.assign(f,{rates:Object.fromEntries(SECTORS.map(k=>[k,clamp(Number.isFinite(f.rates?.[k])?f.rates[k]:city.tax,0,25)])),progressive:clamp(Number.isFinite(f.progressive)?f.progressive:2,0,8),toll:clamp(Number.isFinite(f.toll)?f.toll:2,0,10)});return city.finance;}
export function sector(t){return ['residential','arcology','mixeduse'].includes(t.type)?'residential':['hotel','casino','ferris'].includes(t.type)?'tourism':t.type==='industrial'?'industrial':t.type==='spaceport'?'space':'commercial';}
export function applyEconomy(city){
 const f=normalizeFinance(city),ledger=Object.fromEntries(SECTORS.map(k=>[k,0]));let previous=0,toll=0,condition=0,roads=0,weighted=0,voters=0;
 for(const t of city.tiles){
  previous+=t.taxRevenue||0;const s=sector(t),base=(t.population*.38+t.jobs*.55)||0;
  const surcharge=f.progressive*clamp(((t.landValue||0)-80)/70,0,1),rate=f.rates[s]+surcharge;
  t.taxRevenue=Math.round(base*rate/9);ledger[s]+=t.taxRevenue;
  if(t.population){const sentiment=clamp(t.happiness-(rate-city.tax)*2,0,100);weighted+=sentiment*t.population;voters+=t.population;}
  if(['road','toll','bridge','bus','subway','elevatedStation'].includes(t.type)){roads++;condition+=t.condition??100;
   if(t.type==='toll'){t.tollVolume=t.access?Math.round((20+(t.traffic||0)*4)*Math.exp(-f.toll*.12)):0;t.tollRevenue=t.tollVolume*f.toll;toll+=t.tollRevenue;}
  }
 }
 // Satellite contract receipts are taxable only once; property receipts are summed from parcels.
 const satellite=(city.satellites||0)*180,spaceTax=Math.round(satellite*f.rates.space/100);ledger.space+=spaceTax;
 const taxes=Object.values(ledger).reduce((a,b)=>a+b,0),receipts=Math.round((city.metrics.portIncome||0)+(city.metrics.parkingIncome||0)+satellite);
 const newUpkeep=city.tiles.reduce((v,t)=>v+({mall:95,stripmall:25,mixeduse:45,hotel:75,casino:120,bank:50,ferris:30,toll:8}[t.type]||0),0);
 city.metrics.income=taxes+receipts+Math.round(toll);city.metrics.expenses+=newUpkeep;city.metrics.net=city.metrics.income-city.metrics.expenses;
 city.metrics.ledger={...ledger,tolls:Math.round(toll),services:receipts,upkeep:city.metrics.expenses,total:city.metrics.income};
 city.metrics.condition=roads?Math.round(condition/roads):100;if(voters)city.metrics.approval=Math.round(weighted/voters);
 for(const s of ['residential','commercial','industrial'])city.metrics.demand[s]=clamp(city.metrics.demand[s]-(f.rates[s]-city.tax)*5,-100,100);
}
export function wearInfrastructure(city){for(const t of city.activeTiles||city.tiles){if(!['road','toll','bridge','bus','subway','elevatedStation'].includes(t.type)&&!t.pipe&&!t.wire&&!t.tunnel)continue;const use=(t.traffic||0)/100,wear=.12+use*.42,repair=(city.operations.maintenance||0)/100*.4;t.condition=clamp((t.condition??100)-wear+repair,0,100);}}
