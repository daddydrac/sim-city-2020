import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityRenderer,graphicsSettings} from '../dist/graphics.mjs';

test('Firefox gets the compatibility default while explicit user choices take precedence',()=>{
 assert.equal(graphicsSettings('Mozilla Firefox/143.0').shadows,false);
 assert.equal(graphicsSettings('Mozilla Chrome/140.0').shadows,true);
 assert.equal(graphicsSettings('Firefox/143.0','{"shadows":true}').shadows,true);
 assert.equal(graphicsSettings('Chrome/140.0','{"shadows":false}').shadows,false);
 assert.equal(graphicsSettings('Firefox/143.0','broken').shadows,false);
});

test('city renderer owns its runtime, forwards picking and camera updates, and cleans up context listeners',()=>{
 const canvas=new EventTarget();let instance,camera,picked,losses=0,restores=0;
 class Deck{constructor(props){this.props=props;instance=this;}setProps(props){this.props={...this.props,...props};}finalize(){this.finalized=true;}}
 class MapView{constructor(props){this.props=props;}}
 const renderer=createCityRenderer({runtime:{Deck,MapView},canvas,onViewChange:v=>camera=v,onClick:v=>picked=v,onContextLost:()=>losses++,onContextRestored:()=>restores++});
 const ownLayer={},ownEffect={};renderer.update({mapState:{longitude:1,latitude:2,zoom:16,pitch:45,bearing:30,width:200,effects:['foreign']},layers:[ownLayer],effect:ownEffect,cursor:'crosshair'});
 assert.deepEqual(instance.props.layers,[ownLayer]);assert.deepEqual(instance.props.effects,[ownEffect]);assert.equal(instance.props.viewState.width,undefined);
 instance.props.onViewStateChange({viewState:{zoom:17}});assert.equal(camera.zoom,17);
 instance.props.onClick({coordinate:[1,2]});assert.deepEqual(picked.coordinate,[1,2]);
 const lost=new Event('webglcontextlost',{cancelable:true});canvas.dispatchEvent(lost);assert(lost.defaultPrevented);assert.equal(losses,1);
 canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(restores,1);
 renderer.finalize();assert(instance.finalized);canvas.dispatchEvent(new Event('webglcontextlost'));assert.equal(losses,1);
});

test('unsupported WebGL reports initialization failure without leaving context listeners',()=>{
 let error,losses=0;const canvas=new EventTarget();
 const result=createCityRenderer({runtime:{Deck:class{constructor(){throw Error('WebGL unavailable');}},MapView:class{}},canvas,onError:(e,ready)=>error={e,ready},onContextLost:()=>losses++});
 assert.equal(result,null);assert.equal(error.ready,false);canvas.dispatchEvent(new Event('webglcontextlost'));assert.equal(losses,0);
});

test('pointer capture builds continuously in canvas CSS coordinates and finalizes outside release or cancellation once',()=>{
 const canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:137,top:81,width:800,height:600});canvas.setPointerCapture=id=>canvas.capture=id;canvas.hasPointerCapture=id=>canvas.capture===id;canvas.releasePointerCapture=()=>canvas.capture=null;
 let instance,starts=[],moves=[],ends=0,enabled=true;
 class Deck{constructor(props){this.props=props;instance=this;}setProps(props){Object.assign(this.props,props);}getViewports(){return [{}];}finalize(){}}
 const renderer=createCityRenderer({runtime:{Deck,MapView:class{}},canvas,onViewChange:()=>{},interaction:{enabled:()=>enabled,locate:({x,y})=>[x,y],start:id=>starts.push(id),move:id=>moves.push(id),end:()=>ends++,hover:()=>{}}});
 renderer.update({mapState:{longitude:0,latitude:0,zoom:14},layers:[],painting:true});assert.equal(instance.props.controller.dragPan,false);assert.equal(instance.props.controller.dragRotate,true);
 const event=(type,x,y,buttons=1)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{button:0,pointerId:7,clientX:x,clientY:y,buttons});canvas.dispatchEvent(e);};
 event('pointerdown',237,281);event('pointermove',387,381);event('pointermove',537,481);event('pointerup',1000,900,0);assert.deepEqual(starts,[[100,200]]);assert.deepEqual(moves,[[250,300],[400,400]]);assert.equal(ends,1);event('lostpointercapture',1000,900,0);assert.equal(ends,1);
 event('pointerdown',237,281);event('pointercancel',237,281);assert.equal(ends,2);enabled=false;event('pointerdown',237,281);assert.equal(starts.length,2);renderer.finalize();
});
