# Model boundaries and assumptions

All city data is synthetic. Monetary figures and capacity units are gameplay quantities. Factors below are deliberately transparent **assumptions**, not validated coefficients for any particular city or technology. In particular, the map origin near San Francisco does not make this a San Francisco climate or demographic model.

## Networks and economy

New regions use 256 × 192 parcels of 64 m. Legacy saves retain 32 × 32 nominal 50 m parcels. Four-neighbor flood fill finds roads connected to the map edge or the starter district’s designated regional connection. Separate cable, pipe, metro, drainage, and elevated-rail graphs determine connectivity. Utilities reach zones within two Manhattan steps. Rail service needs at least two stations on a connected track component.

Power and water capacity are pooled globally across active source-connected components; demand is allocated deterministically in parcel order. This simplification can let isolated components share capacity conceptually. There is no per-component load dispatch, Kirchhoff circuit solve, voltage/phase/frequency model, pipe diameter/friction/pressure calculation, pump head, or fluid flow integration. Cable utilization color is a global proxy, not segment loading. Deep drainage connectivity is recorded but flood hydraulics are not solved.

Maximum unadjusted source capacities: thermal 16,000; solar 4,500; hydrogen 8,500; hydro 10,000. Dispatch, maintenance, weather/time, and reservoir stock scale supply. A pump provides 15,000 water units before losses. Each reservoir/dam adds 50,000 storage units. Wet-weather inflow is 18,000 units/month and other inflow 5,000; release scales with its control. A dam does not impound a physical topographic watershed.

Solar generation is proportional to positive solar elevation and weather attenuation; it is zero at night. Hydrogen is treated as imported fuel with a nonzero assumed upstream footprint. No electrolysis production chain or energy-storage balance is implemented. Electric vehicle policy adds a simplified emissions contribution, not explicit charger demand to the power graph. Capacity coupling needs refinement before planning decisions.

Loss percentages increase with network length and reduced maintenance. Operations sliders have immediate effects. The discrete optimizer checks thermal 25/50/75/100% and pump 50/75/100%, preserving at least 99% power/water coverage. Its candidate is only appropriate for the current state. It makes no claim of global optimality or reliability under future demand.

Growth requires positive demand, connected roads, power, water, and adequate approval. Taxes, service upkeep, jobs, and population use toy formulas. Parks/services use neighborhood distance cutoffs. Building phases stop at ten. There is no calibrated land appraisal or construction cost estimator. Initial starter-city assets are inherited stock and their historical construction emissions are not backfilled.

## Carbon ledger

Monthly emissions include electricity, passenger vehicles, airports, industry, shipping, new construction, and launches; modeled tree removal is subtracted. The cumulative ledger begins at scenario creation. Changing policies does not delete emissions already booked.

| Assumption | Value |
|---|---:|
| Vehicle travel | 20 km/person/day, 30 days/month, reduced by transit and EV share |
| Combustion vehicle factor | 0.18 kg CO₂/km |
| Airport activity | 60 generic flights/month/airport |
| Generic flight factor | 3 t CO₂/flight |
| Harbor shipping | 45 t CO₂/month/harbor |
| Rocket launch | 75 t CO₂/launch, booked once |
| Tree removal | 0.021 t CO₂/tree/year |
| Concrete proxy | 0.13 t CO₂/t material |
| Construction diesel proxy | 2.68 kg CO₂/liter |

Construction uses assumed material masses by tool; the low-carbon-material slider reduces the concrete proxy by up to 50%. New development levels also book construction. Initial planted trees have immediate constant removal in this prototype; tree maturation, mortality, soil carbon, permanence, and saturation are absent. These factors are especially unsuitable for offsets or accounting certification.

Thermal and hydrogen dispatch have different assumed footprints. Industrial emissions scale with development level. Vehicle emissions respond to transit/EV policies; airport, shipping, and launch factors are generic. Launch emissions are one-time entries separate from construction. Non-CO₂ aviation effects, upstream supply chains beyond the simplified electricity/hydrogen terms, waste, methane, refrigerants, and many city sectors are not yet modeled.

The spatial carbon overlay allocates **operational** emissions by parcel tax contribution. It is not a source-location inventory or an atmospheric dispersion model. Commercial harbor/satellite income is not a parcel tax, so allocated map values may not sum to the full operational total. Use the sector ledger for totals.

## Local urban heat

Greenhouse-gas totals and local thermal conditions are separate. There is no conversion of city CO₂ into an instantaneous local temperature. Future global climate scenarios should provide external regional boundary conditions.

Each parcel receives a seasonal background air temperature, solar elevation/irradiance, material albedo, estimated vegetation shade, evaporative cooling, a built-surface waste-heat term, wind-dependent convection, and linearized thermal radiation. Its equilibrium surface temperature is approximated as:

```
T_surface = T_background +
  (absorbed_solar + waste_heat - evaporation) /
  (convection_coefficient + radiation_coefficient)
```

Radiation uses the Stefan–Boltzmann constant, emissivity 0.95, and a linearization around background temperature. Evaporation is a fixed surface-category proxy and is not water-limited. Surface temperature is bounded. Local air temperature uses a small fraction of surface excess heat and three neighbor-averaging passes as a ventilation proxy. Wind is not a full vector flow field.

This is a quasi-steady educational approximation. There is **no** thermal mass time integration, nighttime release of stored heat, building-resolved shading/sky-view factor, humidity, human thermal comfort index, urban canyon CFD, soil moisture, groundwater, or microclimate calibration. Rendering shadows do not feed back into the heat calculation. Nighttime values should not be interpreted as a realistic urban heat island prediction.

Reflective surfaces, trees, and green roofs reduce absorbed heat or increase the cooling proxy; roofs/trees also lower runoff potential. Runoff is a dimensionless potential index, not a precipitation-volume or flood forecast. Operating and retrofit costs expose tradeoffs, but this is not a life-cycle optimization model.

The physical mechanisms motivating this structure are described in the EPA's [heat island overview](https://www.epa.gov/heatislands/what-are-heat-islands) and [trees and vegetation guidance](https://www.epa.gov/heatislands/using-trees-and-vegetation-reduce-heat-islands). These sources support the mechanisms; they do **not** validate this game's equations or coefficients.

## Next engineering work

1. Assign generation/demand budgets per connected component and visualize real edge flows.
2. Couple building cooling, EV charging, pumps, hydrogen production, and storage to energy balance.
3. Replace fixed water stock rules with catchment runoff, level-area-volume curves, spillways, and water balance.
4. Add material thermal capacitance and hourly energy integration; calibrate against a declared dataset.
5. Use explicit emissions activities/factors with uncertainty and regional electricity scenarios.
6. Compare candidate plans over multiple weather/demand scenarios, with reliability and environmental objectives.


## Ten-phase development (0.2.0)

Version-2 saves store phases 1–10 and consecutive-month development counters. Phase 1 is an unoccupied foundation for the five zoned building types; occupied capacity is `(phase - 1) × base capacity`. Version-1 saves migrate zone levels by adding one, preserving occupied population/jobs. Fire-damaged phase-zero parcels rebuild when conditions allow.

Zoned development advances after three consecutive supplied, happy, positive-demand months. Green spaces mature every four months. Facilities and networks upgrade every six eligible months; infrastructure needs a nonnegative treasury and maintenance ≥50%. Facility generating/pumping/storage capacity scales by `1 + 0.12 × (phase - 1)`; associated utility costs and generating emissions scale with capacity. Power-cable and pipe network losses decline by that factor at upgraded parcels. Service radii, green-space maturity, and harbor income also reflect phase. These are game balance assumptions, not engineering capacity calculations.

Geometry evolves procedurally. Bridge fixtures and conduit thickness convey upgrades without relocating the network or changing a designed bridge's span. Rail capacity, drainage hydraulics, and structural load analysis are still abstract; a higher phase does not imply a validated infrastructure design.


## Regional overlays and parking (0.3.0)

Landmarks, utilities, roads, terrain, and analytics share one region projection. Terrain picking intersects the same triangulated height field used for rendering; underground tools offset the intersection to their conduit depth. Construction interpolation is four-connected so diagonal mouse movement cannot leave disconnected pipe corners. Each parcel is visited once per stroke, including failures; release and begin a new stroke to revisit it. Terraforming operates on a height field, not an earth-volume or slope-stability model.

Parking capacity is `16 + phase × 4` for a lot and `80 + phase × 24` for a garage. A bounded local demand proxy determines occupied spaces when road access exists; income is $0.60 per occupied space per month. Rendered cars/bays represent occupancy rather than a calibrated stall-layout or parking-search simulation. Garages and lots count as built surfaces in the heat/runoff model and use assumed construction masses of 1,700 / 140 tonnes.

Monthly analytics retain twelve metric snapshots in memory. Geometry remains current. Traffic trails sample connected roads rather than solving origins/destinations; cable/pipe pulses show service rather than physical flow. Hexagons sum parcel population, while heatmap colors are relative to the viewport. Climate and wind animations remain illustrative; the model boundaries above still apply.
