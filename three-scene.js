/* 《手表》V20 — glTF clay island scene. Drop-in WatchThreeScene renderer; lesson UI untouched. */
(function(global){
'use strict';
global.WatchThreeScene=function(options){
  const T=options.THREE||global.THREE;if(!T)throw Error('Three.js r128 missing');
  const canvas=options.canvas,scene=new T.Scene();
  scene.background=new T.Color(0xe5e7eb);scene.fog=null;
  const camera=new T.PerspectiveCamera(45,1,.1,120);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,1.6));
  renderer.setSize(1,1,false);renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  scene.add(new T.HemisphereLight(0xffffff,0xd0d5dd,.85));
  const sun=new T.DirectionalLight(0xfff5e6,1.1);
  sun.position.set(-6,16,11);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-16;sun.shadow.camera.right=16;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=60;sun.shadow.bias=-.00025;sun.shadow.normalBias=.015;
  scene.add(sun);const fill=new T.DirectionalLight(0xdceaff,.25);fill.position.set(9,8,-8);scene.add(fill);
  const studioMat=new T.MeshStandardMaterial({color:0xe5e7eb,roughness:1,metalness:0});
  const floor=new T.Mesh(new T.PlaneGeometry(160,160),studioMat);
  floor.rotation.x=-Math.PI/2;floor.position.y=-.50;floor.receiveShadow=true;scene.add(floor);
  const root=new T.Group();scene.add(root);
  let stage=-1,requestToken=0,width=1,height=1,disposed=false,playerGroup=null,visual=null;
  let previous=null,idlePhase=0,walkingPhase=0,cameraReady=false,filterOn=false,loadingStatus='pending';
  // A camera close enough to fill the viewport, with optional zoom and 3D orbit.
  const defaultDistance=13.0,minDistance=5.4,maxDistance=25;
  let zoomDistance=defaultDistance,orbitYaw=.54,orbitElevation=.62;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const defaultYaw=.54,defaultElevation=.62;
  const rings=[],projected=new T.Vector3(),cameraTarget=new T.Vector3(0,.38,0);
  const fallback={
    base:new T.MeshStandardMaterial({color:0xd8c6ac,roughness:.96}),
    turf:new T.MeshStandardMaterial({color:0xa4bf9f,roughness:.96}),
    shirt:new T.MeshStandardMaterial({color:0xf8f0e4,roughness:.9}),
    skirt:new T.MeshStandardMaterial({color:0x527eb4,roughness:.9})
  };
  let loaderPromise=null;
  function loader(){
    if(T.GLTFLoader)return Promise.resolve(new T.GLTFLoader());
    if(!loaderPromise)loaderPromise=new Promise((yes,no)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
      script.async=true;script.onload=()=>T.GLTFLoader?yes():no(Error('GLTFLoader failed to initialize'));
      script.onerror=()=>no(Error('GLTFLoader CDN unavailable'));document.head.appendChild(script);
    });
    return loaderPromise.then(()=>new T.GLTFLoader());
  }
  const cache=new Map(),assetBase=options.assetBase||'./';
  function load(name){
    if(!cache.has(name)){
      const url=new URL(assetBase+name,document.baseURI).href;
      cache.set(name,loader().then(l=>new Promise((yes,no)=>{
        l.load(url,gl=>{
          const object=gl.scene;
          object.traverse(c=>{
            if(!c.isMesh)return;
            c.castShadow=true;c.receiveShadow=true;
            if(c.geometry&&c.geometry.attributes&&c.geometry.attributes.color){
              const materials=Array.isArray(c.material)?c.material:[c.material];
              materials.forEach(m=>{if(m){m.vertexColors=true;m.metalness=0;m.roughness=.9;m.needsUpdate=true;}});
            }
          });
          yes(object);
        },undefined,no);
      })).catch(e=>{console.warn('[WatchClay] GLB failed:',name,e);throw e;}));
    }
    return cache.get(name);
  }
  function attach(name,x,y,z,scale,yaw,token,parent){
    return load(name).then(original=>{
      if(disposed||token!==requestToken)return null;
      const o=original.clone(true);o.position.set(x,y,z);o.scale.setScalar(scale||1);o.rotation.y=yaw||0;
      (parent||root).add(o);
      o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
      return o;
    }).catch(()=>null);
  }
  function standin(){
    const g=new T.Group();
    const skirt=new T.Mesh(new T.CylinderGeometry(.24,.38,.46,20),fallback.skirt);skirt.position.y=.55;g.add(skirt);
    const shirt=new T.Mesh(new T.SphereGeometry(.25,16,10),fallback.shirt);shirt.position.y=1.05;g.add(shirt);
    const face=new T.Mesh(new T.SphereGeometry(.39,24,16),fallback.shirt);face.position.y=1.5;g.add(face);
    const hat=new T.Mesh(new T.CylinderGeometry(.52,.52,.08,24),fallback.shirt);hat.position.y=1.86;g.add(hat);
    g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
    return g;
  }
  function buildStage(index,items){
    const token=++requestToken;root.clear();rings.length=0;stage=index;visual=null;previous=null;
    playerGroup=new T.Group();root.add(playerGroup);
    // Temporary unobstructed clay base is removed as soon as the uploaded GLB loads.
    const base=new T.Mesh(new T.CylinderGeometry(5.65,5.45,.66,64),fallback.base);
    base.position.y=-.16;base.castShadow=true;base.receiveShadow=true;root.add(base);
    const turf=new T.Mesh(new T.CylinderGeometry(5.6,5.6,.06,64),fallback.turf);
    turf.position.y=.18;turf.receiveShadow=true;root.add(turf);
    const islandName=index===0?'scene1_campus_clay.glb':'scene2_house_clay.glb';
    loadingStatus='loading';
    attach(islandName,0,0,0,1,0,token).then(o=>{
      if(o&&token===requestToken){root.remove(base,turf);loadingStatus='island-ready';}
    });
    const placeholder=standin();playerGroup.add(placeholder);
    attach('girl.glb',0,0,0,1,0,token,playerGroup).then(o=>{
      if(o&&token===requestToken){playerGroup.remove(placeholder);visual=o;loadingStatus='player-ready';}
    });
    for(const item of items){
      // Flat ground rings only: no signs, fences or tall foliage.
      const mat=new T.MeshBasicMaterial({color:0xffd177,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
      const ring=new T.Mesh(new T.RingGeometry(.4,.52,48),mat);
      ring.rotation.x=-Math.PI/2;ring.position.set(item.x,.235,item.z);ring.renderOrder=2;
      root.add(ring);rings.push({item,ring});
    }
    if(index===0){
      attach('lihua.glb',-3.1,.22,-1.95,1,.5,token);
      attach('bike.glb',-3.66,.41,-2.18,1,.55,token).then(o=>{if(o)o.rotation.z=-Math.PI*.45;});
    }else{
      attach('lihua.glb',-.1,.22,-3.4,1,Math.PI*.7,token);
      attach('mom.glb',3.6,.22,-3.15,.92,-.75,token);
      const bell=items.find(o=>o.id==='bell')||{x:1.7,z:-3};
      const watch=items.find(o=>o.id==='watch')||{x:-3.5,z:-.9};
      attach('doorbell.glb',bell.x,.28,bell.z-.23,.73,Math.PI/2,token);
      attach('watch.glb',watch.x,.28,watch.z,.64,0,token);
    }
    cameraReady=false;
  }
  
  // Separate zoom UI is appended by the renderer; existing lesson UI DOM stays unchanged.
  const zoomWidget=document.createElement('div');
  zoomWidget.setAttribute('role','group');zoomWidget.setAttribute('aria-label','3D场景缩放控制');
  zoomWidget.style.cssText='position:fixed;right:14px;top:clamp(110px,17vh,160px);z-index:35;display:flex;flex-direction:column;gap:6px;padding:7px;border-radius:17px;background:rgba(255,252,244,.90);box-shadow:0 4px 16px rgba(35,72,60,.19);backdrop-filter:blur(6px);pointer-events:auto';
  function zoomButton(label,description,callback){
    const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.title=description;
    btn.setAttribute('aria-label',description);
    btn.style.cssText='min-width:43px;min-height:42px;padding:5px;border:1px solid #c1d9c7;border-radius:12px;background:#f5faef;color:#235a49;font-size:23px;font-weight:700;line-height:1;cursor:pointer;touch-action:manipulation';
    btn.addEventListener('pointerdown',e=>e.stopPropagation());
    btn.addEventListener('click',e=>{e.stopPropagation();callback();});
    zoomWidget.appendChild(btn);return btn;
  }
  function setZoom(d){zoomDistance=clamp(d,minDistance,maxDistance);}
  function resetView(){setZoom(defaultDistance);orbitYaw=defaultYaw;orbitElevation=defaultElevation;}
  zoomButton('＋','放大3D场景',()=>setZoom(zoomDistance*.83));
  zoomButton('－','缩小3D场景',()=>setZoom(zoomDistance*1.2));
  zoomButton('⌂','返回完整岛屿全景',resetView);
  document.body.appendChild(zoomWidget);
  function onWheel(e){e.preventDefault();setZoom(zoomDistance*Math.exp(clamp(e.deltaY,-140,140)*.0017));}
  canvas.addEventListener('wheel',onWheel,{passive:false});
  // Right-mouse drag or Shift+left drag to orbit; normal left-click navigation remains untouched.
  let rotating=false,rotatePointerId=null,lastPointerX=0,lastPointerY=0;
  const touchPointers=new Map();let lastPinchDistance=0;
  function onPointerDown(e){
    if(e.pointerType==='touch'){
      touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(touchPointers.size===2){const pts=[...touchPointers.values()];lastPinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);}
    }else if(e.button===2||(e.button===0&&e.shiftKey)){
      rotating=true;rotatePointerId=e.pointerId;lastPointerX=e.clientX;lastPointerY=e.clientY;
      e.preventDefault();try{canvas.setPointerCapture(e.pointerId)}catch(_){}
    }
  }
  function onPointerMove(e){
    if(e.pointerType==='touch'&&touchPointers.has(e.pointerId)){
      touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(touchPointers.size===2){
        const pts=[...touchPointers.values()];
        const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        if(lastPinchDistance>0&&d>15){setZoom(zoomDistance*lastPinchDistance/d);e.preventDefault();}
        lastPinchDistance=d;
      }
      return;
    }
    if(!rotating||e.pointerId!==rotatePointerId)return;
    orbitYaw+=clamp(e.clientX-lastPointerX,-120,120)*.006;
    orbitElevation=clamp(orbitElevation+(e.clientY-lastPointerY)*.005,.30,1.12);
    lastPointerX=e.clientX;lastPointerY=e.clientY;e.preventDefault();
  }
  function onPointerUp(e){
    if(e.pointerType==='touch'){touchPointers.delete(e.pointerId);if(touchPointers.size<2)lastPinchDistance=0;}
    else if(rotating&&e.pointerId===rotatePointerId){rotating=false;rotatePointerId=null;try{canvas.releasePointerCapture(e.pointerId)}catch(_){}}
  }
  function onContextMenu(e){e.preventDefault();}
  canvas.addEventListener('pointerdown',onPointerDown);
  canvas.addEventListener('pointermove',onPointerMove);
  canvas.addEventListener('pointerup',onPointerUp);
  canvas.addEventListener('pointercancel',onPointerUp);
  canvas.addEventListener('contextmenu',onContextMenu);
  function updateCamera(dt,p){
    // Old camera radius ≈24 for an 11-wide island: dramatically underfilled the viewport.
    const aspect=Math.max(width/height,.32),responsive=Math.max(1,1.12/aspect);
    const distance=zoomDistance*responsive;
    const close=clamp((defaultDistance-zoomDistance)/(defaultDistance-minDistance),0,1);
    const focusWeight=close*.85;
    const px=clamp(p&&Number.isFinite(p.x)?p.x:0,-4.1,4.1);
    const pz=clamp(p&&Number.isFinite(p.z)?p.z:0,-4.1,4.1);
    const focus=new T.Vector3(px*focusWeight,.40,pz*focusWeight);
    const horizontal=Math.cos(orbitElevation)*distance;
    const goal=new T.Vector3(focus.x+Math.sin(orbitYaw)*horizontal,
      focus.y+Math.sin(orbitElevation)*distance,
      focus.z+Math.cos(orbitYaw)*horizontal);
    if(!cameraReady){camera.position.copy(goal);cameraTarget.copy(focus);cameraReady=true;}
    const t=1-Math.exp(-dt*4.5);
    camera.position.lerp(goal,t);cameraTarget.lerp(focus,t);camera.lookAt(cameraTarget);
  }
  function updatePlayer(p,dt,moving){
    if(!playerGroup)return;
    const next=new T.Vector3(p.x,.22,p.z),diff=new T.Vector3().subVectors(next,previous||next);
    previous=next.clone();playerGroup.position.copy(next);
    const walks=!!moving&&diff.lengthSq()>.000015;
    idlePhase+=dt*2.3;if(walks)walkingPhase+=dt*9;
    const towardsCamera=camera.position.clone().sub(next);
    const restingYaw=Math.atan2(-towardsCamera.x,-towardsCamera.z)+25*Math.PI/180;
    const intended=walks?Math.atan2(-diff.x,-diff.z):restingYaw;
    const difference=Math.atan2(Math.sin(intended-playerGroup.rotation.y),Math.cos(intended-playerGroup.rotation.y));
    playerGroup.rotation.y+=difference*(1-Math.exp(-dt*(walks?11:3.6)));
    if(visual){
      visual.position.y=walks?Math.abs(Math.sin(walkingPhase))*.038:Math.sin(idlePhase)*.008;
      visual.rotation.z=walks?Math.sin(walkingPhase)*.027:Math.sin(idlePhase*.52)*.005;
      visual.rotation.x=walks?Math.sin(walkingPhase)*.013:0;
      visual.scale.y=1+(walks?0:Math.sin(idlePhase)*.004);
    }
  }
  let lastBubbleUpdate=0;
  function softenLabels(p,items){
    const stamp=Date.now();if(stamp-lastBubbleUpdate<160)return;lastBubbleUpdate=stamp;
    document.querySelectorAll('.hotspot-label,.poi-label,.task-bubble,.marker-label,.scene-label,.hotspot-bubble').forEach(el=>{
      const txt=el.textContent||'',item=items.find(v=>txt.includes(v.label));if(!item)return;
      const d=Math.hypot(item.x-p.x,item.z-p.z);
      el.style.opacity=d<1.2?'.40':d<2?'.70':'1';
    });
  }
  function render(time,dt,index,items,player,moving,isLocked,isDone){
    if(disposed)return;
    if(index!==stage)buildStage(index,items||[]);
    dt=Math.min(Math.max(dt||0,0),.06);
    updateCamera(dt,player);updatePlayer(player,dt,moving);
    for(const {item,ring} of rings){
      const done=isDone(item.id),locked=isLocked(item.id);
      ring.material.color.setHex(done?0x83cfad:locked?0xb7bdc1:0xffd177);
      ring.material.opacity=done?.5:locked?.35:.82+Math.sin(time*2.3+item.x)*.08;
    }
    renderer.render(scene,camera);softenLabels(player,items||[]);
  }
  function project(x,y,z){
    projected.set(x,.75,z).project(camera);
    if(projected.z<-1||projected.z>1||Math.abs(projected.x)>1.2||Math.abs(projected.y)>1.18)return null;
    return {x:(projected.x*.5+.5)*width,y:(-.5*projected.y+.5)*height,d:projected.z,s:1/Math.max(.03,projected.z+1)};
  }
  function resize(w,h){width=Math.max(1,w);height=Math.max(1,h);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
  const oldOverlay=document.getElementById('painterly');if(oldOverlay)oldOverlay.style.opacity='0';
  function toggleFilter(){filterOn=!filterOn;if(oldOverlay)oldOverlay.style.opacity='0';return filterOn;}
  function dispose(){
    disposed=true;requestToken++;
    canvas.removeEventListener('wheel',onWheel);
    canvas.removeEventListener('pointerdown',onPointerDown);
    canvas.removeEventListener('pointermove',onPointerMove);
    canvas.removeEventListener('pointerup',onPointerUp);
    canvas.removeEventListener('pointercancel',onPointerUp);
    canvas.removeEventListener('contextmenu',onContextMenu);
    zoomWidget.remove();renderer.dispose();
  }
  return {render,resize,project,toggleFilter,dispose,get scene(){return scene;},get camera(){return camera;},get loadingStatus(){return loadingStatus;}};
};
})(window);
