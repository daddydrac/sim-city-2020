import {build} from 'esbuild';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await build({stdin:{contents:"export {CubeGeometry, SphereGeometry, ConeGeometry, CylinderGeometry} from '@luma.gl/core';",resolveDir:root},bundle:true,format:'iife',globalName:'cityLuma',minify:true,outfile:resolve(root,'dist/vendor/city-luma.min.js'),define:{__VERSION__:'"8.5.21"'}});
await build({stdin:{contents:"export {load, parse, registerLoaders} from '@loaders.gl/core'; export {I3SLoader} from '@loaders.gl/i3s';",resolveDir:root},bundle:true,format:'iife',globalName:'cityLoaders',minify:true,outfile:resolve(root,'dist/vendor/city-loaders.min.js'),define:{__VERSION__:'"3.4.15"'}});
