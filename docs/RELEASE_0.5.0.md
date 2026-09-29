# v0.5.0 — population, eras and architectural identity

Based on the supplied v0.4.0 ZIP and Building Art Catalogue HTML. The new timing/population request supersedes the catalogue's old three/four/six-month-only progression descriptions.

## Campaign milestones

All conditions are conjunctive. These thresholds are game design values; “after 2070” means January 2071 at the earliest.

| Phase | Earliest year | Current residents | Era |
|---:|---:|---:|---|
| 1 | 1900 | 0 | Settlement |
| 2 | 1905 | 500 | Growing town |
| 3 | 1920 | 2,500 | Town center |
| 4 | 1935 | 10,000 | Small city |
| 5 | 1950 | 25,000 | City |
| 6 | 1970 | 50,000 | Regional city |
| 7 | 1990 | 100,000 | Metropolis |
| 8 | 2020 | 200,000 | Connected metropolis |
| 9 | 2050 | 350,000 | Green megacity |
| 10 | 2071 | 500,000 | Forest-dome era |

Unlocks are permanent; current population is checked when earning them. The unlock is a ceiling, not a building-level assignment. Each local upgrade requires the existing road/utility/demand/happiness/maintenance conditions, plus time: zones take `3 + 2 × (current phase − 1)` supplied months; parks/forests/wetlands take `4 + 2 × (phase − 1)`; other facilities and networks take `6 + 2 × (phase − 1)`. Thus a new plot placed in an advanced era still passes through intermediate stages. Service interruption resets local work; an era lock holds it. No uniform whole-building scaling is used to represent all ten stages.

`progression.mjs` is the authoritative clock/unlock module. `population.mjs` owns housing/job capacity and monthly occupancy. Rendering reads levels; it never writes population. The original level-to-population shortcut was removed. One year is 480,000 ms at 1×; one month is 40,000 ms. Game speed multiplies active elapsed time. Hidden/paused time is ignored; current month fraction is serialized.

## Migration and economy

Vacant homes fill only when roads, power and water are supplied. Positive demand, happiness, job availability and effective residential taxation influence the arrival rate. Commercial and industrial hiring uses sector demand, supply, tax and resident labor. Small towns receive a 200-worker regional employment allowance to avoid a zero-population bootstrap deadlock. Effective tax is the sector rate plus the chosen high-land-value surcharge. At 18% or above, occupied homes/businesses lose occupants monthly; water/power disconnection also causes departures. These are simplified, configurable game rules, not real-world forecasts.

Nominal housing capacity per residential parcel, phases 1–10: 24, 64, 144, 280, 520, 900, 1,600, 2,500, 3,600, 5,000. Arcologies have four times this capacity over a reserved 2×2 site; mixed-use lots have twice the residential capacity plus jobs. Capacity is not current population. All occupant counts persist independently and remain bounded. Mature-zone fire resets occupants immediately so an immediate save remains valid.

## Architectural implementation

`art-registry.mjs` maps all 42 buildable categories to the catalogue IDs and stage names. `asset-models.mjs` generates ten distinct close-detail variants per category, with three detail levels, stable entrance/service/utility sockets and metric geometry. `art-layers.mjs` batches shared shapes and attaches the original parcel ID to every selectable part. The same model data serves the Three.js and deck.gl views. `gallery.html` provides the production-model viewer with camera presets, phases, day/night playback, season/weather states, LOD selection and PNG export.

The kit includes pitched roofs and chimneys; geometric window jambs/sills and transoms; staggered balconies; parapets and HVAC; shops and awnings; distinct school, fire, police and hospital details; parking decks, ramps, stalls and EV points; pumps, solar arrays, hydrogen tanks, reservoir basins, dams; bus shelters and station entrances; launch, port and airport structures; utility inspection hardware; forest terraces and dome ribs. The Ferris wheel animates. Roads retain the network renderer and gain phase-based street furniture; bridges retain their connected-span renderer. Those contextual networks are not replaced by disconnected gallery road models.

The close-detail budget is limited to the eight nearest eligible assets at high zoom; the next detail level covers at most 48 nearby assets. Far assets use silhouettes. Shared geometry is instanced. Night lighting varies window occupancy; transparent dome material does not cast an opaque shadow. Rain changes roughness; snow adds upper-surface caps; foliage changes in autumn. A small generated sky environment supplies reflective highlights. It does not reflect or duplicate the city scene.

The implementation is an original procedural interpretation of the briefs, not 420 independently authored art files. Material channels use color/roughness/metalness and unlit window groups; there are no bespoke per-building normal-map atlases, ray tracing, simulated interiors, or photorealistic reference-matching claims. Imported GLB/I3S assets still use the deck.gl route. Current simplified climate, traffic, environmental and economic simulations remain in place.

## Footprints and placement

| Facility | Reserved parcels |
|---|---|
| Mall / harbor | 3×2 |
| Airport | 8×3 |
| Spaceport | 3×3 |
| Dam | 3×1 water span |
| Reservoir / arcology / future tower | 2×2 |

Placement validates the entire footprint, land/water class, height variation, occupancy and map bounds before charging. Adjacent roads and utilities may supply any edge of a reserved site. A root parcel owns the empty reserved children. Surface painting and terrain editing cannot overwrite those children. A whole-site demolition releases all reservations; buried networks remain. Save loading rejects inconsistent reservations. Pre-v0.5 facilities keep their existing single-parcel sites to avoid displacing surrounding buildings during import; newly placed facilities use the table above.

## UFO event

The catalogue's visitor is integrated from the reviewed v0.4.1 event module. Waiting time is sampled once between 18 and 45 active play minutes. Construction, launches, underground view, hidden tabs and paused play defer it. Its ten-second sequence approaches, hovers, raises and returns one cosmetic resident, then departs. It makes no changes to buildings, residents, taxes or economy. Completion/skip restores camera and prior play state. The setting and pending timer persist.

## Save compatibility

Container schemas v1/v2/v3 remain readable. `simulationVersion: 5` adds calendar, era, residents/workers and site reservations. Existing saves without this field retain their old 2020-based dates, occupied population and already-earned phases. This compatibility exception does not apply to new games. Sparse regional saves preserve reserved empty parcels. SQLite stores complete game snapshots and multiple independent campaigns; no application state is reconstructed from screenshots or artwork.

## Integration corrections

- Surface architectural batches are excluded from underground mode; layer IDs stay unique.
- Asphalt sits slightly above the sidewalk underlay to avoid coplanar flicker in Three.js.
- New window, foundation and lot parts retain parcel picking; held construction still uses terrain coordinates.
- Night effects, analytical colors, underground conduits and UFO lights retain the shared coordinate transform.
- New games and the interface identify v0.5.0 / January 1900. Old folders and original attachments are unchanged.
