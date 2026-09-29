# Sim City 2020 — v0.5.1

Open a terminal in this folder and run:

    docker compose up --build -d

Open **http://localhost:8080**. On Windows, `START-WINDOWS.cmd` runs the same command. Stop the previous container if it is using port 8080. Hard-refresh with Ctrl+Shift+R after replacing a release.

Without Docker, use Python 3.10 or later:

    python server/server.py

No npm install, CDN, API key, or separate graphics download is needed to play. Do not double-click `dist/index.html`: browser modules and database saves require the local HTTP server. Windows users can also use `START-WINDOWS-PYTHON.cmd`.

## Maps in v0.5.1

The new regional atlas includes **12 terrain presets** with elevation, coasts, rivers, lakes and woodland. New selections and **Regenerate** choose a fresh random seed automatically (1–2,147,483,647). Use **Apply seed** only to reproduce a particular map. Relief, Water and Forest sliders tune the generator; Relief / Contours / Buildable tabs explain the land. Build here starts the terrain actually previewed. The starter district is optional and off by default.

See `docs/RELEASE_0.5.1.md` for the reference study, changes and current graphics limits, and `docs/VALIDATION_0.5.1.md` for validation.

## The new campaign

Every new game starts in January **1900**, with **0 residents** and **phase 1** available. The optional starter district contains roads, utilities and unoccupied zoning. One year takes **8 minutes of active play at 1×**: 40 seconds per month. Pause and hidden tabs stop the calendar. 3× and 6× accelerate it; `+1 month` advances one month immediately. Partial months survive save/load.

Both year AND current population must meet the next milestone. Open **City menu → City eras** to see the table. The final era requires **500,000 residents in 2071 or later**. An era unlock permits gradual local construction; it does not instantly upgrade everything. Earned eras stay unlocked if population subsequently declines.

People now occupy housing independently of its phase. Vacancies, jobs, commercial/industrial demand, road access, power, water, happiness and effective taxes control migration. Lower taxes attract residents faster, high taxes slow growth, and effective rates of 18% or more drive departures. The land-value surcharge counts toward the effective rate. These are explicit game-balance rules, not economic forecasts.

## Building and artwork

Hold the left mouse button and drag to lay connected roads, pipes, cables or other tools continuously. Inspect mode pans; right-drag or Shift+scroll rotates; Alt+scroll tilts. Large facilities reserve their complete sites. The placement outline shows the footprint; a red outline indicates an invalid site. Bulldozing any reserved parcel removes the entire facility while preserving buried utilities.

The original parametric architectural kit contains 42 categories and 420 phase variants: recessed windows, jambs, balcony slabs, roof equipment, recognizable civic facilities, parking stalls, shops, utilities, transport entrances, planted towers and forest domes. Close, district and regional detail levels control scene cost. Models are shared by Three.js and deck.gl; daylight, night windows, wet materials and seasonal foliage are represented. There is no upside-down mirrored copy beneath the city.

**City menu → Architecture Studio** opens `http://localhost:8080/gallery.html`. Inspect any category and phase, change LOD/weather/time, orbit, play the evolution sequence, and export a PNG. This viewer uses the production model generator. It does not change campaign unlocks. Procedural geometry is included; this is not a pack of 420 individually hand-sculpted photorealistic GLB models.

Rare cosmetic UFO visits occur after 18–45 active play minutes. They focus the camera for a 10-second sequence, return the resident, then restore the previous camera and play state. Escape skips the visit. Find settings and a preview in **City menu → City surprises**.

## Saves and existing games

**Saved cities** stores independent named SQLite checkpoints. **Save / Load** exports and imports portable JSON. Python stores checkpoints in `data/cities.sqlite3`; Docker uses the `city-saves` volume. `docker compose down` preserves that volume; `docker compose down -v` deletes it. Preserve your old folders and export JSON saves before changing installations: a differently named Compose folder may use a different volume.

Old v1/v2/v3 game saves retain their existing calendar (2020 plus their saved month), population and earned development. Only newly created campaigns reset to 1900. The save container remains v2/v3 for compatibility, with `simulationVersion: 5` recording the new calendar, progression, occupancy and reservations.

## Graphics and scope

Three.js is the default. Switch to **deck.gl analytics renderer** for imported GLB buildings, external I3S scenes and specialized analytic layers. External scenes need internet access. A dedicated GPU is not mandatory; browser WebGL availability is. Software rendering was tested with Chromium/SwiftShader, but high-detail city performance varies by hardware and browser. Current Three.js requires WebGL 2; shadows can be disabled for compatibility.

The HTML catalogue is included in `docs/art/Building-Art-Catalogue.html`. The implementation uses original procedural models inspired by its briefs, with bounded detail and simplified material states. It does not provide ray-traced reference-image fidelity, a validated engineering/climate solver, or new economic behavior merely because an art stage names one. Full release scope and validation are in `docs/RELEASE_0.5.0.md` and `docs/VALIDATION_0.5.0.md`.

For development, `npm test` runs real application-module tests, including the local SQLite HTTP service. Node.js and Python are required for testing; Python alone is enough to play.
