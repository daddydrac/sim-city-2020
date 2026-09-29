# v0.5.1

Automatic bounded random seeds, 12 terrain presets, a new relief/contour/slope atlas, shared terrain materials and forest detail, clipped water geometry, exact preview/start matching, and stable map seeds across simulation events. See `docs/RELEASE_0.5.1.md`.

# 0.5.0 — population/time progression and architectural kit

- January 1900, zero-resident starts; eight active minutes per year at normal speed.
- Ten jointly gated year/population eras, ending at 500,000 residents in 2071 or later; gradual per-asset upgrades.
- Persistent residents/jobs driven by capacity, supplies, demand, jobs, happiness and effective sector taxes.
- Original shared architectural recipes for 42 categories × ten phase variants, three LODs, seasonal/night states and an interactive Architecture Studio.
- Complete reservations for large facilities, full-site previews, edge utility access and safe whole-site demolition.
- Rare ten-second UFO visits with saved timing, camera restoration and skip controls.
- Save migration, fractional calendar persistence, immediate fire-save correction and underground duplicate-layer fix.
- Real application-module, SQLite HTTP/restart, architectural-contract and browser tests; see docs/VALIDATION_0.5.0.md.

# 0.4.0 — Three.js, checkpoints, destinations and economy

- Three.js 0.180.0 visual renderer, shared camera/picking coordinates, instanced models, shadows, fog and night materials. Native deck.gl remains available for specialized analytics and imported scenes.
- Architectural trim, balconies, roof equipment, facade fins, planted lots, sidewalks, two-way vehicle models and illustrative pedestrians.
- Buildable malls, strip centers, mixed-use residences, hotels, casinos, banks, Ferris wheel and toll-road upgrades.
- SQLite named checkpoints with a non-root Python Docker service and persistent volume; old JSON save imports retained.
- Sector taxes, progressive value surcharge, toll receipts, ledger, population-weighted approval and gradual infrastructure condition.
- Seven distinct synthesized soundtrack compositions, independent Music/SFX controls and differentiated construction cues.
- 43 tests pass, SQLite restart/integrity checks pass, Chromium software-WebGL interaction checks pass. See current validation notes and remaining scope.

# 0.3.0 — regions, continuous construction, parking and live analytics

- Start screen, six region presets, deterministic terrain seeds and kepler-processed terrain import. Default 49,152-parcel regions cover 16.384 × 12.288 km.
- Continuous terrain mesh and surrounding landscape; underground survey grid. Region overview and full-circle orbit buttons.
- Hold-and-drag automatic construction, four-connected interpolation, deduplicated charging, CSS-coordinate terrain picking and per-stroke undo. Labels no longer intercept map input.
- Buildable parking lots and garages, occupancy/income, heat/runoff and construction carbon. More façade floor bands and roof equipment.
- Staged launch with camera tracking, hinged doors, satellite separation and unfolding solar arrays.
- Live traffic TripsLayer, utility pulses, terrain/building metric overlays, population aggregation, wind streamlines, interactive filters/opacity/playhead and twelve session snapshots. Native kepler map export.
- Rectangular simulation grids and compact v3 saves; v1/v2 imports retained. Fixed removed WebGL readiness variable in I3S loading and vertical-axis orientation for cylinders/cones.
- 38 automated tests pass. Browser UI verified; cloud WebGL and Docker execution remain unavailable. Photorealistic visual acceptance remains open.

# 0.2.0

- Full-window city view; transparent fixed icon rail; collapsible menu, statistics, inspector, analytics, and build settings.
- A single deck.gl runtime owns the city WebGL context, layers, textures, and effects. Kepler remains the map-state and dataset host.
- Removed the deliberate startup context loss; added real context-loss feedback, pause, and reload. Firefox defaults to shadows off, with a saved opt-in.
- Explicit single-level facade textures, cleaned-up shadow-mode transitions, and refreshed mutable parcel attributes.
- Colored construction plots and foundations appear at placement. Zoned objects progress through ten phases; infrastructure and green spaces also mature.
- Phase-aware geometry, occupancy, utilities, service reach, and environmental accounting; visible growth blockers and progress.
- Simulation starts running; dialogs resume the preceding play state when closed. Old saves migrate while preserving occupancy.
- 28 automated tests passed; browser controls and phase progression checked. Hardware WebGL and Docker execution remain unverified in the build environment.
