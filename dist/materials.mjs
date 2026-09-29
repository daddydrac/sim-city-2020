// Small original sky-light environment. Reflections are sampled from this static
// lighting texture; the city scene is never rendered a second time or mirrored.
export function makeEnvironment(THREE,renderer){
 const w=128,h=64,data=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=y/(h-1),u=x/w,sky=v<.5,m=sky?1-v*2:(v-.5)*2,base=sky?[.35+.4*(1-m),.55+.3*(1-m),.85+.1*(1-m)]:[.28-.12*m,.3-.15*m,.24-.10*m],sun=Math.exp(-((u-.18)**2*2600+(v-.26)**2*2400))*12,i=(y*w+x)*4;data[i]=base[0]+sun;data[i+1]=base[1]+sun*.84;data[i+2]=base[2]+sun*.6;data[i+3]=1;}
 const input=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.FloatType);input.mapping=THREE.EquirectangularReflectionMapping;input.needsUpdate=true;const gen=new THREE.PMREMGenerator(renderer),target=gen.fromEquirectangular(input);gen.dispose();input.dispose();return target;
}
