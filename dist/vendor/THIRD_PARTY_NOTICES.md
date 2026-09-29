# Third-party software

The original application code in this prototype is separate from the following bundled libraries. Their licenses and notices remain applicable. `licenses/` contains fetched package license texts and the license files available in the exact local dependency tree. `manifest.json` records versions, license source URLs, and SHA-256 checksums of shipped JavaScript/CSS.

| Library | Version | License | Upstream |
|---|---|---|---|
| React / React DOM / react-is | 18.2.0 | MIT | https://github.com/facebook/react |
| Redux | 4.2.1 | MIT | https://github.com/reduxjs/redux |
| React Redux | 8.1.3 | MIT | https://github.com/reduxjs/react-redux |
| styled-components | 6.1.8 | MIT | https://github.com/styled-components/styled-components |
| kepler.gl | 3.1.0 | MIT | https://github.com/keplergl/kepler.gl |
| deck.gl | 8.9.36 | MIT | https://github.com/visgl/deck.gl |
| luma.gl | 8.5.21 | MIT | https://github.com/visgl/luma.gl |
| loaders.gl | 3.4.15 | MIT | https://github.com/visgl/loaders.gl |
| MapLibre GL JS CSS | 3.6.2 | BSD-3-Clause | https://github.com/maplibre/maplibre-gl-js |

kepler.gl and deck.gl bundles also include their upstream dependencies, including map rendering, math, loaders, shader, and UI components. Preserved embedded license comments remain part of the shipped bundles. The license folder includes additional math.gl, probe.gl, loaders.gl, luma.gl and other local dependency notices. This list is not a representation that the top-level projects authored all embedded code.

`city-luma.min.js` and `city-loaders.min.js` are compatibility bundles built from the pinned npm packages using the included script. Remaining UMD assets came from their versioned npm distributions. Browser script filenames were shortened locally. No original SimCity, Minecraft, or attached reference-image artwork is distributed as a game asset. Procedural meshes and façade textures are authored in the application. No external 3D asset pack is included.

An I3S service or user-imported GLB can have its own rights and attribution requirements. The optional public reference scene is streamed from its provider and is not redistributed in this archive.
