# Validation — 0.4.0

43 automated Node tests pass. These cover existing growth, construction, pointer capture, terrain, networks, bridge/launch rules and save validation, plus new sector-ledger reconciliation, finance persistence, toll connectivity, use-sensitive wear/repair, new destination save roundtrips and soundtrack population boundaries.

SQLite API integration passed: two independent checkpoints; exact JSON restoration; persistence through server restart; correct JavaScript module MIME type; cross-origin POST rejection. No user database is included in the release ZIP.

Browser smoke checks ran in Chromium 138 with software WebGL (SwiftShader) at 1100×750. Verified start → region selection → city, Three.js day and night scene, underground scene, sector budget, named SQLite checkpoints, held-pointer road construction (three cells, $135), and retained deck.gl rendering. No uncaught JavaScript or browser-console errors were reported in the final interaction sequence. Screenshots are in docs/screenshots. They show actual gameplay, not generated art. This is not an FPS benchmark, a Firefox regression test, or proof of performance on every integrated GPU.

The initial Three.js fog conversion used world scale for an eye-space effect, obscuring the city. It was corrected to account for viewport zoom. The renderer avoids unnecessary drawing-buffer resize and caps pixel ratio at 1 to reduce fill cost. Shadows use a 1024 map; their established compatibility toggle remains under Weather & light. Night lighting and procedural material appearance remain approximate.

The supplied game attachment identifies itself as 0.2.0. The updated package was based on the newer local 0.3.0 iteration reviewed in the research report, retaining the larger regions, painting interaction and analytics added there. Old releases and uploaded archives were not overwritten.

Docker execution could not be tested because Docker is not installed in this environment. The Python service itself was exercised directly. Docker Compose defines a non-root Python container, localhost port binding, read-only application filesystem, and writable persistent database volume. The browser performs rendering; the container does not need GPU access.

Known limitations are listed in RELEASE_0.4.0.md. No assertion is made that every research recommendation has been implemented. In particular, specialized Kepler/deck analytics and imported I3S/GLB use the deck.gl renderer, and image-reference photorealism is not yet reached.
