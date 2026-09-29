# v0.5.1 validation

## Automated checks

`npm test` runs 67 tests with no installed npm dependencies. All passed. The new terrain checks cover:

- 2,000 automatic seeds within 1–2,147,483,647, including the no-repeat-current rule and endpoint RNG inputs.
- Twelve distinct presets, changed water masks across seeds, and deterministic same-seed generation.
- All presets at seed/range extremes with finite elevations, dry land and water.
- Relief, water and forest controls changing the expected measurements.
- Survey invalidation after terraforming and finite, bounded shoreline mesh coordinates.
- Save/load round trips preserving terrain, generator settings, woodland and independent simulation RNG.
- Rejection of invalid generation seeds and imported terrain settings.

The existing campaign, placement, dragging, services, finances, SQLite service, migration, building stages and UFO checks continue to pass. The multi-angle cursor test uses controlled rolling slopes so its projected target remains visible; an actually occluded valley correctly picks the intervening ridge rather than the hidden target.

Full output: `test-results-v0.5.1.txt`.

## Browser integration

The included `scripts/terrain-browser-check.cjs` exercises the actual UI and the production modules under Chromium with software WebGL (SwiftShader). It is an optional test requiring Playwright/Chromium, not a runtime dependency.

Validated in both Three.js and deck.gl:

- Three consecutive clicks on Regenerate change the seed, terrain fingerprint, main preview and selected thumbnail.
- Replaying a seed reproduces the original map; invalid seed 0 leaves the current map unchanged.
- Build starts the exact previewed terrain in January 1900 at zero population.
- The game renders its chosen map rather than retaining the welcome-screen scene.
- Autosave reload restores the same terrain fingerprint.
- No browser page errors or console errors.

The Three.js run additionally clicks all twelve map cards, switches Relief/Contours/Buildable, changes terrain controls and enables/disables the starter district. Disabling the starter district restores the original terrain; no duplicate site preparation happens on Build.

Outputs: `browser-terrain-three-v0.5.1.txt`, `browser-terrain-deck-v0.5.1.txt`; final surface regression passes: `browser-final-three-v0.5.1.txt`, `browser-final-deck-v0.5.1.txt`. Actual screenshots are in `screenshots/v051-*.png`. Inspection includes the compact 1280×686 laptop layout and both in-game surfaces. A submerged visual seabed and water depth bias prevent distant coplanar flicker; the fine region boundary is joined to its coarse surroundings to close gaps.

## Package checks

The release archive is checked for ZIP CRC integrity, extracted to a clean directory, and every file compared against `RELEASE-MANIFEST.json`. The extracted project's offline test suite is run again. Vendor JavaScript, Three.js, audio, Python service, Docker configuration and launch scripts remain included.

Docker itself and the user's physical Dell/Firefox combination were not run in this environment. The server's existing HTTP/SQLite persistence checks run in the automated suite; browser checks use Chromium software WebGL. No claim of pixel-identical SimCity 4 visuals or hardware-independent frame rate is made.
