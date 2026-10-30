/* Watch GLB clay diorama V19: rendering only. HTML/questions/movement remain authoritative. */
(function(global){'use strict';
global.WatchClayScene=function({THREE:T,canvas}){
 if(!T||!T.GLTFLoader)throw Error('GLTFLoader not loaded');
 const scene=new T.Scene();scene.background=new T.Color(0xe5e7eb);scene.fog=null;
 const camera=new T.PerspectiveCamera(45,1,.1,1000);
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,1.7));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 scene.add(new T.HemisphereLight(0xffffff,0xd0d5dd,.85));
 const sun=new T.DirectionalLight(0xfff5e6,1.1);sun.position.set(6,10,8);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-13;sun.shadow.camera.right=13;sun.shadow.camera.top=13;sun.shadow.camera.bottom=-13;sun.shadow.camera.far=50;sun.shadow.normalBias=.024;scene.add(sun);
 const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.ShadowMaterial({opacity:.16}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.47;floor.receiveShadow=true;scene.add(floor);
 const root=new T.Group();scene.add(root);const loader=new T.GLTFLoader(),cached=new Map();
 const urls={girl:'./girl.glb',lihua:'./lihua.glb',mom:'./mom.glb',bike:'./bike.glb',doorbell:'./doorbell.glb',watch:'./watch.glb',campus:'./scene1_campus_clay.glb',house:'./scene2_house_clay.glb'};
 let stage=-1,revision=0,avatar=null,pivot=null,width=1,height=1,filter=false,oldX=0,oldZ=0,ready='loading',lastTime=0;
 const rings=[],projected=new T.Vector3(),camTarget=new T.Vector3(),v3=new T.Vector3();
 function prep(obj){obj.traverse(c=>{if(!c.isMesh)return;c.castShadow=true;c.receiveShadow=true;
  if(c.geometry&&c.geometry.attributes.color){for(const m of (Array.isArray(c.material)?c.material:[c.material]))if(m){m.vertexColors=true;m.needsUpdate=true;}}
 });return obj;}
 function load(name){if(!cached.has(name)){const url=urls[name];
   cached.set(name,new Promise((ok,fail)=>loader.load(url,g=>ok(prep(g.scene)),undefined,e=>fail(Error('加载失败: '+url+' '+String(e?.message||e))))));}
  return cached.get(name);}
 function append(name,x,y,z,rx=0,ry=0,rz=0,scale=1){const req=revision;return load(name).then(g=>{
  if(req!==revision)return null;const obj=prep(g.clone(true));obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.setScalar(scale);root.add(obj);return obj;
 });}
 function disposeStage(){revision++;for(const {ring} of rings){ring.geometry.dispose();ring.material.dispose();}rings.length=0;root.clear();avatar=pivot=null;}
 function build(index,items){disposeStage();stage=index;ready='loading';
  for(const it of items||[]){const m=new T.MeshBasicMaterial({color:0x6ee7b7,side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false});
   const ring=new T.Mesh(new T.RingGeometry(.40,.52,48),m);ring.rotation.x=-Math.PI/2;ring.position.set(it.x,.035,it.z);root.add(ring);rings.push({ring,it});}
  const jobs=[append(index===1?'house':'campus',0,0,0)];
  const rev=revision;
  jobs.push(load('girl').then(g=>{if(rev!==revision)return;
    avatar=new T.Group();pivot=new T.Group();avatar.add(pivot);pivot.add(prep(g.clone(true)));root.add(avatar);
  }));
  if(index===1){
   jobs.push(append('doorbell',1.7,.03,-3.1,0,.15,0,.86));
   jobs.push(append('watch',-3.35,.02,-.9,0,-.3,0,.72));
   jobs.push(append('mom',3.35,.02,1.15,0,Math.PI*.92,0,.92));
   jobs.push(append('lihua',.25,.02,-3.95,0,Math.PI*.9,0,.97));
  }else{
   jobs.push(append('lihua',-2.3,.03,-2.2,0,Math.PI*.6,0,.96));
   jobs.push(append('bike',-3.45,.09,-1.65,0,.15,-.55,.90));
  }
  Promise.allSettled(jobs).then(out=>{if(rev!==revision)return;ready=out.some(x=>x.status==='rejected')?'error':'ready';
   if(ready==='error')console.warn('Some GLB models could not load',out.filter(x=>x.status==='rejected').map(x=>String(x.reason)));});
 }
 function updateAvatar(p,moving,dt,time){if(!avatar||!pivot)return;
  const x=Number(p.x)||0,z=Number(p.z)||0,dx=x-oldX,dz=z-oldZ;
  avatar.position.set(x,0,z);
  if(moving&&(Math.abs(dx)+Math.abs(dz))>.0002){const aim=Math.atan2(dx,dz),err=Math.atan2(Math.sin(aim-avatar.rotation.y),Math.cos(aim-avatar.rotation.y));avatar.rotation.y+=err*Math.min(1,dt*9);}
  else{camera.getWorldPosition(v3);v3.sub(avatar.position);const aim=Math.atan2(v3.x,v3.z)+T.MathUtils.degToRad(25),err=Math.atan2(Math.sin(aim-avatar.rotation.y),Math.cos(aim-avatar.rotation.y));avatar.rotation.y+=err*Math.min(1,dt*2.7);}
  pivot.position.y=moving?Math.abs(Math.sin(time*9))*.026:Math.sin(time*2)*.017;
  pivot.rotation.z=moving?Math.sin(time*9)*.027:Math.sin(time*1.3)*.006;
  oldX=x;oldZ=z;
 }
 function updateCamera(p,dt){const ratio=Math.max(.32,width/height),distance=ratio<.85?Math.min(31,19*.85/ratio):19;
  const target=new T.Vector3((p.x||0)*.08,1,(p.z||0)*.08);
  const desired=new T.Vector3(target.x+distance*.085,target.y+distance*.585,target.z+distance*.811),a=1-Math.exp(-Math.max(.001,dt)*3.5);
  camera.position.lerp(desired,a);camTarget.lerp(target,a);camera.lookAt(camTarget);camera.updateMatrixWorld();
 }
 function render(time,dt,index,items,p,moving,isLocked,isDone){dt=dt||.016;if(index!==stage)build(index,items);
  updateCamera(p,dt);updateAvatar(p,moving,dt,time);
  for(const {ring,it} of rings){const lock=isLocked(it.id),done=isDone(it.id);
   ring.material.color.setHex(done?0x73c991:lock?0xa8adb4:0x6ee7b7);
   ring.material.opacity=lock?.32:done?.42:(.72+Math.sin(time*2.5+it.x)*.1);
   ring.scale.setScalar(1+Math.sin(time*2.6+it.z)*.035);
  }renderer.render(scene,camera);
 }
 function project(x,y,z){projected.set(x,.75,z).project(camera);
  if(projected.z<=-1||projected.z>=1||Math.abs(projected.x)>1.12||Math.abs(projected.y)>1.15)return null;
  return {x:(projected.x*.5+.5)*width,y:(-projected.y*.5+.5)*height,d:projected.z,s:1/(projected.z+1.01)};
 }
 function resize(w,h){width=Math.max(1,w);height=Math.max(1,h);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
 function toggleFilter(){filter=!filter;const overlay=global.document.getElementById('painterly');if(overlay)overlay.style.opacity=filter?'.07':'0';return filter;}
 const overlay=global.document.getElementById('painterly');if(overlay)overlay.style.opacity='0';
 function dispose(){disposeStage();renderer.dispose();}
 return {render,resize,project,toggleFilter,dispose,get scene(){return scene;},get camera(){return camera;},get assetStatus(){return ready;}};
};
})(window);
