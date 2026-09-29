# v0.5.1 — regional atlas and reliable map regeneration

## What changed

- **Regenerate chooses a new random integer automatically**, from 1 to 2,147,483,647. It excludes the current seed. The previous release reused the seed in the input, recreating identical terrain. New map selections also generate a seed automatically.
- **Apply seed** is a separate reproducibility action. The preset, seed, and three terrain settings determine the map. Invalid manual seeds are rejected without replacing the current map. A seed alone is not an imported heightmap.
- **12 included terrain presets**, replacing six: Meridian Estuary, Alpine Lakes, Emerald Delta, Sunstone Gulf, Highland Reservoirs, Pelagic Islands, Northreach Fjord, Redrock Canyon, Crescent Caldera, Silverwater Lakes, Fairhaven Coast, Cape Verde. These are original procedural landscapes; each can generate many variants. They are not imported historical SimCity scenarios.
- Seeds change river position, meanders, landform orientation, lake outlines, island placement and elevations. Every preset includes land and water. The playable region remains **16.384 × 12.288 km**, 49,152 parcels.
- A new regional atlas shows an oblique relief preview, elevation contours and building-slope suitability. Statistics derive from actual parcels: water %, gentle-land %, woodland %, and maximum altitude. All percentages use total region area; woodland and gentle land can overlap. Gentle land means grade at or below 12%, not guaranteed service access or a complete engineering assessment.
- Relief, water and forest sliders change generation settings. Both the large preview and selected card update. The sliders' percentages are generator strengths, not exact target coverage percentages.
- The ground now uses a shared grass/forest/beach/rock/snow texture atlas, terrain normals, distance-based shallow/deep water colors, a submerged visual seabed, and clipped shoreline geometry. Forest clusters vary with moisture, slope, height and biome; nearby trees use geometry and distant woodland uses the atlas. The terrain palette and forest textures are consistent between the preview and both game renderers.
- The map-selection preview uses CPU Canvas rendering and the actual height field; it does not require an additional WebGL context. Hidden game rendering pauses during selection, and static terrain geometry stays cached while playing.
- **Build here starts the exact previewed terrain.** The starter district is optional and off by default. Enabling it shows its site preparation and zoning before starting. Turning it off restores the generated terrain. Build does not secretly flatten the terrain a second time.
- Blank new cities initially show the regional view. Starter cities open at their prepared district. Existing 1900 start, eight-minute year, tax-sensitive growth and ten-era progression remain intact.
- Map seed and simulation random state are now separate. Fire events no longer change the map's seed or natural vegetation identity. Generation settings and the random simulation state survive save/load. Existing saved elevation arrays are loaded, not regenerated with the new algorithm.

## Controls

Start a city → choose one of the twelve landscape cards → adjust terrain if desired → **Regenerate** for a fresh random layout → **Build here**. No seed entry is required. To reproduce a layout, select the same landscape, restore its seed and slider values, then press **Apply seed**. Exporting the complete city JSON preserves all actual terrain edits as well.

Relief is an oblique survey with physical elevation proportions. Contours show 25 m intervals, or 100 m for regions higher than 700 m. Buildable colors distinguish ≤12%, 12–30%, and >30% slopes. The actual parcel grid still determines construction and collision, independently of the decorative shoreline smoothing.

## Reference study

The user's Google Images result pages could not be read directly. Indexed screenshots and the following public reference pages were inspected instead:

- [SC2000 slope screenshot in Boris the Brave's triangle-grid article](https://www.boristhebrave.com/2021/05/23/triangle-grids/): visible slope faces, water boundaries and tree distribution make the terrain legible. This informed the survey's slope/contour modes and visible ground relief.
- [SC4 Sain regional overview](https://sc4naturalgrowth.wordpress.com/2016/10/21/1-region-overall/): wooded lowlands, subdued dark water, coastal shelves, rocky ridges and snowy peaks informed the terrain palette and altitude/slope material changes.
- [Simtropolis: creating SC4 regions](https://community.simtropolis.com/omnibus/simcity-4/reference/creating-new-regions-in-simcity-4-sc4-r534/): the heightmap/water-level workflow reinforced separating the elevation field, water mask and displayed materials.

The unverified statement about 42 included SC2000 cities was not used as a dependency or acceptance criterion. This release includes twelve original landform presets as requested.

## Scope and limits

This is an improved procedural terrain renderer inspired by the references, **not a pixel-identical recreation of SimCity 4's renderer or art assets**. Existing building models have not been replaced in this patch. Ground parcels remain 64 m wide; very small streams and beaches are constrained by that resolution. Generated water uses a common regional datum; multi-altitude lake hydraulics and erosion simulation are not implemented. Woodland coverage is a procedural visual survey, not an inventory of individual simulated trees.

Three.js/deck.gl gameplay still needs browser WebGL. An integrated GPU or software implementation can work; the map atlas itself runs on Canvas. No new runtime network requests, asset subscriptions, GPU-only ray tracing or package downloads were added.

## Updated modules

| File | Role |
|---|---|
| `terrain.mjs` | Twelve seeded landforms, seed generator, validated settings, height/water construction |
| `terrain-style.mjs` | Shared slope/coast/forest survey, terrain materials, atlas and terrain fingerprint |
| `terrain-preview.mjs` | Canvas relief rasterizer, contours and slope view, starter-site visualization |
| `terrain-water.mjs` | Clipped shoreline mesh with smooth water colors |
| `terrain-render.mjs` | Shared deck/Three terrain layers, atlas mapping and geometry caches |
| `opening.mjs` | Automatic random regeneration, replay, twelve-map browser and exact preview/start flow |
| `render.mjs` | Clustered natural-tree geometry and bounded regional detail |
| `three-renderer.mjs` | Correct terrain texture orientation and linear-color conversion |
| `engine.mjs` | Generator configuration persistence, independent simulation RNG, gentler starter-site selection |
| `app.mjs`, `style.css` | Map chooser render suspension, blank-city regional camera and atlas layout |
| `tests/terrain-atlas.test.mjs` | Seeds, varied/reproducible maps, extremes, settings, mesh bounds and saves |
| `scripts/terrain-browser-check.cjs` | Actual browser regeneration, replay, controls, render and reload checks |
