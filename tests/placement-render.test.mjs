import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,build,index,tick} from '../dist/engine.mjs';

// Inspect the layer contract without claiming a GPU rendering test.
class Layer{constructor(props){this.props=props;this.id=props?.id;}}
class Geometry{}
globalThis.window={deck:new Proxy({},{get:()=>Layer}),cityLuma:new Proxy({},{get:()=>Geometry})};
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},createLinearGradient:()=>({addColorStop(){}})})})};
const {cityLayers,position,lighting}=await import('../dist/render.mjs');

test('map parcel picking places one residential plot and immediately supplies visible foundation geometry',()=>{
 const c=createCity(false),id=index(20,20);let calls=0;
 const before=cityLayers(c,{onPick:p=>{calls++;assert(build(c,p,'residential').ok);}});
 const ground=before.find(l=>l.id==='city-parcels');
 assert.equal(ground.props.onClick({object:c.tiles[id],coordinate:position(20.5,20.5)}),true);
 assert.equal(calls,1);assert.equal(c.tiles[id].level,1);
 const after=cityLayers(c),plot=after.find(l=>l.id==='zoned-plots');
 assert(plot.props.data.some(t=>t.id===id));
 assert(after.filter(l=>l.id.startsWith('art-')).some(l=>l.props.data.some(b=>b.tileId===id&&b.role==='foundation-slab')));
 assert.notEqual(after.find(l=>l.id==='city-parcels').props.data,ground.props.data);
 assert.equal(c.metrics.population,0);
});

test('growing a supplied zone replaces the construction plot with taller occupied buildings',()=>{
 const c=createCity(false);c.tax=4;
 for(let x=26;x<32;x++)for(const tool of ['road','wire','pipe'])build(c,index(x,16),tool);
 build(c,index(27,15),'power');build(c,index(28,15),'pump');const id=index(29,17);build(c,id,'residential');
 for(let i=0;i<3;i++)tick(c);
 const layers=cityLayers(c),building=layers.filter(l=>l.id.startsWith('art-')).flatMap(l=>l.props.data).find(b=>b.tileId===id&&b.role==='walls');
 assert(building);assert(building.scale[2]>=1.8);assert(!layers.find(l=>l.id==='zoned-plots').props.data.some(t=>t.id===id));
});

test('turning shadows off or entering night replaces the shadow effect so it is finalized',()=>{
 const c=createCity();c.environment.hour=12;
 const day=lighting(c,{shadows:true}),plain=lighting(c,{shadows:false});
 assert.notEqual(day.id,plain.id);c.environment.hour=0;
 assert.equal(lighting(c,{shadows:true}).id,plain.id);
});

test('underground rendering hides surface architecture and never emits duplicate layer IDs',()=>{
 const c=createCity();const layers=cityLayers(c,{underground:true,cameraZoom:17,cameraCenter:[16,16]});assert.equal(new Set(layers.map(l=>l.id)).size,layers.length);assert(!layers.filter(l=>l.id.startsWith('art-')).flatMap(l=>l.props.data).some(d=>d.role==='walls'||d.role==='foundation'));assert(layers.filter(l=>l.id.startsWith('art-')).flatMap(l=>l.props.data).some(d=>d.role==='network-conduit'));
});
