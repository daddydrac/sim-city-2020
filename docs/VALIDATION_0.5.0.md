# v0.5.0 validation

## Automated application tests

`npm test`: **60 passed, 0 failed, 0 skipped**. Tests import the production modules directly. The coordinate tests include a bundled, unmodified @math.gl/web-mercator 3.6.3 dependency so the test suite also runs without npm installation. Rendering contract tests inspect real layer-building functions using lightweight deck/luma constructor doubles; these are not counted as GPU tests.

Coverage includes:

- Exact 480,000 ms year, pause/visibility/speed behavior, partial-month save/resume, January 1900 zero-population regional starts.
- All ten year/population AND gates, the 2070/2071 boundary, the 499,999/500,000 boundary, retained earned eras, and blocked-counter bypass prevention.
- Real monthly arrivals, slower growth at higher tax, departures under excessive tax or lost supply, sequential gradual upgrades and the phase-ten cap.
- Legacy population/date/phase migration, deterministic continuation after loading, invalid input rejection and immediate post-fire saves.
- All 42 catalogue categories × ten distinct close-view geometry variants, three LOD contracts, finite dimensions, stable sockets and bounded horizontal model extents.
- Night windows, power outages, snow caps, autumn foliage, forest domes and Ferris wheel animation.
- Multi-parcel reservation, edge utility access, invalid-site/no-charge behavior, whole-site demolition and save validation.
- Continuous held-pointer strokes, skipped-cell interpolation, deduplication, terrain picking, undo and network-specific removal.
- Underground surface exclusion and unique layer IDs; analytical snapshots, traffic routes, launches, utility/climate controls and the ten-second UFO event clock/camera behavior.
- A real Python HTTP/SQLite process: two independent game saves, process restart, exact state restoration, deterministic continuation, static module serving and invalid-save handling.

## Browser validation

Headless Chromium with **ANGLE/SwiftShader software WebGL** at 900–1280 px viewport widths. No hardware GPU was used in this validation environment.

- Production app loads from locally bundled files, with no CDN fetches.
- Three.js surface/day and night architecture, underground view and analytic coloring were exercised; screenshots are under `docs/screenshots`.
- The deck.gl route was exercised with detailed buildings, night lighting, underground utility geometry, the real +1-month control and a surface-temperature overlay. No page or console errors were recorded.
- Architecture Studio was exercised at phases 6 and 10, day/night, snow, a fire station, the Ferris wheel and day/night playback. No page or console errors were recorded.
- A production-game UFO preview completed its ten-second timeline and restored the exact camera and paused state. A second preview was skipped with Escape. No page or console errors were recorded.
- An initial Three.js underground screenshot timeout exposed duplicate surface/underground layer IDs. The production renderer was corrected and a regression test now asserts that surface architecture is excluded from underground mode.

`node scripts/browser-check.cjs three` and `node scripts/browser-check.cjs deck` reproduce the production-view checks when Playwright and Chromium are installed. Optional `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` variables select existing installations. Browser test setup injects an inspection bridge into served test responses only; it is not part of the shipped application.

## Distribution

The release includes source, bundled vendor scripts, audio, the supplied HTML catalogue, asset registry, documentation, tests, SQLite server and Docker/Python startup files. No development node_modules, personal database, caches or temporary saves are packaged. Every file is listed by SHA-256 in `RELEASE-MANIFEST.json`; the archive is CRC-checked before delivery.

## Practical limits

The Docker files retain the existing Python service and were statically reviewed; a Docker daemon and Windows GUI were not available for launch testing. Firefox was not available for a live browser run; its renderer compatibility settings are covered by application tests. SwiftShader validation confirms software-WebGL execution in this environment, not a promise of high-detail frame rates on every device. The asset kit is procedural and original; the supplied reference images are art direction rather than a delivered photorealism benchmark.
