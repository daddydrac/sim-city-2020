# Visual target: a convincing city from every navigable view

The supplied architectural renders, waterfronts, futuristic towers, and 3D city captures are the target. They are not merely color references. The finished game should retain plausible scale, fine architectural detail, grounded lighting, atmospheric depth, vegetation, and water as the user zooms, pans, orbits, and changes weather or time.

**Acceptance is pending.** The current procedural render is an initial geometry/material pass. No claim is made that it matches the supplied images. WebGL is disabled in the available review browser, so even the initial 3D pass has not received visual acceptance.

## Reference-derived requirements

| Area | Required final behavior | Current implementation / gap |
|---|---|---|
| Architecture | Distinct silhouettes, façades, mullions, balconies, setbacks, roofs, HVAC, entrances and ground-floor detail | Instanced basic buildings, procedural window textures/roof equipment, several special forms; local GLB replacement pipeline. Detailed asset library missing |
| Futuristic city | Sculptural towers, forest terraces and domes, expressive bridges, landmarks | Procedural prototypes; no high-detail architectural production assets |
| Streets | Curbs, sidewalks, markings, vegetation, lamps, vehicles, intersections at believable scale | Paths, centerlines, trees, poles, animated points; detailed procedural parking lots/garages added. General street geometry needs refinement |
| Sun | Time/season-dependent direction, intensity and color, readable cast shadows | Simplified solar geometry, warm low sun, directional lighting and experimental shadows configured; GPU output unverified |
| Artificial lighting | Occupied windows, façade accents, street/pedestrian lights, signage; power availability affects lighting | Powered procedural window textures and lamps, four local point lights; no comprehensive light culling, area lights or global illumination |
| Night | Dark adaptation with readable materials, restrained bloom, no uniformly glowing blocks | Initial emissive-style window material and cool ambient light; exposure and bloom pipeline missing |
| Water | Correct scale, wave normals, Fresnel reflection, shoreline contact, moving wakes and reflected lights | Colored water parcels and schematic boats only; realistic water shader/reflections missing |
| Rain | Wet roughness response, puddles, runoff, ripples, believable streaks and visibility | Particles and shinier road/building material settings; accumulation and proper wet materials missing |
| Snow / hail | Exposure-aware accumulation, melt, roof/surface response, natural particle scale | White ground/foliage, snow/hail particles; accumulation and melt missing |
| Wind | Vegetation movement, water response, directionally consistent particles | Wind particles and model effects; tree deformation and waves missing |
| Fog / atmosphere | Distance and altitude-dependent scattering, coherent sun visibility and aerial perspective | Not implemented; a flat screen overlay would not meet this requirement |
| Seasons | Species-aware vegetation transitions, coherent weather/illumination, ground response | Seasonal colors and simulation effects; detailed vegetation models and seasonal materials missing |
| Terrain | Smooth terrain normals, plausible excavations, cliffs, slopes, reclaimed shores | Continuous regional mesh with terrain normals, biome colors and surrounding context; no erosion/slope solver |
| Underground | Legible layered networks with depth, connected supply state and selection | Cutaway terrain mesh, ghost surface survey grid and separate conduit levels; no detailed pipe fittings or volumetric excavation |
| Scale / LOD | Stable silhouettes and materials from city overview to close view; no abrupt popping | Instanced procedural meshes and I3S hierarchy streaming; game asset LOD selection missing |
| Analytics | Legible heatmaps and values without losing place/context | Terrain-aligned metric colors, traffic TripsLayer, animated utility paths, terrain-based hex columns, filters and snapshots; GPU legibility unverified |

## Lighting pipeline

Current source uses deck.gl LightingEffect, ambient and directional sources, optional `_shadow`, and local PointLights. [Directional shadows](https://deck.gl/docs/api-reference/core/directional-light) are explicitly experimental in deck.gl. The UI exposes a persistent shadow toggle for visual/performance diagnosis; Firefox defaults to shadows off. The renderer now owns all GPU resources within one standalone deck runtime, while kepler.gl supplies map state and datasets. The sun direction changes with the time slider and a simplified seasonal declination at 37.77° latitude.

Procedural powered windows use lit textures with lighting disabled on those window-bearing meshes at night. This makes windows visible but is not physically correct emissive transport. The separate street lamps have a small visible source and translucent ground pool; four nearby point lights provide actual local material lighting. Those pools are illustrative and must be replaced or improved for final realism. The special architectural meshes do not yet obey every night/outage lighting rule.

GLB files use [ScenegraphLayer's glTF PBR lighting](https://deck.gl/docs/api-reference/mesh-layers/scenegraph-layer). Asset-authored emissive materials remain as authored. The final pipeline needs exposure/tone mapping, sky/environment lighting, reflection probes or an appropriate real-time reflection approach, LOD-aware local-light culling, and separate control over emissive window occupancy. PBR alone does not provide photorealism.

Photogrammetric I3S scenes often contain baked lighting and may include capture artifacts. They can ground real-world context and scale, but cannot guarantee relightable night/rain/snow behavior. New game construction needs authored relightable materials. A photograph is not an editable 3D asset; the supplied images are inspiration, not source meshes.

## Asset contract for the next art pass

- Use original or appropriately licensed architectural assets, with scale in meters and an origin at ground level.
- Deliver self-contained GLB for the current importer; include base color, normal, metallic/roughness and emissive textures where appropriate.
- Separate glazing, solid façade, roof, vegetation, and light-emitting materials so weather, snow, and power states can modify them later.
- Provide at least three geometric detail levels plus an overview representation. Test silhouette transitions, normal continuity, texture mipmaps and material stability.
- Author realistic dimensions first; oversized features cannot be corrected by lighting.
- Include sidewalks, entrances and roofs, since orbiting exposes sides and aerial views expose roofs.
- Establish performance budgets on an agreed target GPU and resolution before selecting texture/mesh budgets. No frame-rate target has yet been validated here.

## Local acceptance sequence

Run the Docker package in Chrome with WebGL enabled. Record browser, OS, GPU, resolution and performance. Save actual gameplay captures; generated illustrations are not acceptance evidence.

1. Confirm the starter city renders without console/shader errors. Check shadows on ground and adjacent buildings. Disable shadows and compare if artifacts appear.
2. Hover each corner of the city and scroll in/out; verify the pointer location stays anchored. Pan, rotate through 360°, tilt from plan view to low oblique, focus a parcel and orbit it. Check clipping and depth ordering.
3. Inspect roofs, façades, roads, and tree contact at near, district, and city scales. Rotate to the previously hidden sides. Reject stretched materials, floating objects and incomplete back faces.
4. Review 06:00, 12:00, 17:00, and 22:00 in summer and winter. Observe sun direction, shadow length, warm low sun, powered windows and road lamps. Verify outages affect the supported lighting paths.
5. Repeat aerial and close views in sun, rain, wind, snow, hail, and falling stars. The current fog/reflection gaps remain failures against the final target, even if particle controls work.
6. Build each special structure; inspect the forest dome, bridge cables/arch, solar panels, reservoir, port, airport and launch pad. Launch once and review ascent and schematic satellites.
7. Enter underground mode. Vary excavation depth across 3/6/18/35 m, trace a network, remove a segment and verify its disconnected state. Return to the surface without losing selection.
8. Raise/lower/flatten/reclaim land and inspect the result from four bearings. Confirm structures follow elevation and bridges join their approaches; height-field edits and river/lake shore transitions require visual review.
9. Compare heatmap/hexagon and parcel overlays at multiple zooms. Confirm legends/inspector values, selection, and export attributes agree with simulation state.
10. Load a self-contained detailed GLB, adjust scale/rotation, and compare it with procedural geometry. Load an I3S reference scene and return. Confirm failed loads show useful messages.
11. Save/reload, advance time, inspect all major controls, and measure frame rate with weather/shadows enabled and disabled.

A failure in this sequence is a rendering or integration issue to fix, not evidence that the user's visual expectation should be lowered. This package supplies an inspectable foundation; final photorealism remains an open milestone.


## 0.2.0 interaction acceptance

- The left icon rail remains fixed and transparent; statistics, inspector, analytics, and menu panels toggle without resizing the map.
- Select Residential, click a clear land parcel, and verify a green construction plot and foundation appear immediately. A second click on the same occupied plot must reject the placement without charging again.
- With power, water, a connected road, happiness ≥45%, and positive residential demand, three monthly ticks should move phase 1 to phase 2 and replace the foundation with an occupied building.
- Repeat through all ten stages in a balanced test neighborhood; check the inspector, occupancy, geometry, services, and saved progress.
- Test zoom under the pointer, pan, orbit, picking on roofs and ground, terrain changes, and underground networks in Firefox and Chrome.
- Compare shadows off/on, noon/night, resize, and analytics changes. Confirm no framebuffer-feedback or incomplete-texture errors recur on the target GPU. Hardware acceptance is still pending.


## 0.3.0 local rendering checks

1. Start a new region; verify 16.4 × 12.3 km, terrain beyond the build boundary, and legible six-map previews. Existing small saves keep their footprint.
2. Hold the mouse and draw a long diagonal pipe/cable stroke at 0°, 90°, 180° and 270° bearings. Check preview/placement agreement on hills and underground; rotate and repeat. Move outside the canvas and release. No stuck brush, double charge, or pan should occur. One undo restores the whole stroke.
3. Build a parking lot and garage; inspect bays, cars, lamps, landscaped islands, slabs, ramps and night behavior. Verify parking occupancy in analytics/inspector.
4. Follow a launch through doors opening, satellite ejection, arrays unfolding, and Return to city. Test right-drag orbit during the tracked launch.
5. Inspect terrain materials, added floor bands/roof details, wind/rain/snow at mountain elevations, and the underground survey grid. Check for shader/texture warnings in Firefox with shadows off first.
6. Compare traffic trails and bridge decks, metric colors and terrain, power/water pulses, parking occupancy, and population hexagon aggregate readouts. Filter and change opacity, pause/scrub flow animation, and select past metric snapshots. Native kepler export is a live metric point layer, not the game scene.

The cloud browser still lacks WebGL. CPU geometry/placement tests and UI checks are evidence for those components only; appearance, GPU picking, camera interaction and frame rate remain pending on the user's local hardware.
