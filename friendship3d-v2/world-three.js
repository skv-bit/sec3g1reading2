/* Three.js r128 reliable 3D renderer for HandWatch 3D V2.
   Loads the SAME real GLB models; camera and collision API matches the previous game.
   Uses same world positions, controls and reading tasks. */
(function(){
"use strict";
if(!window.THREE || !window.THREE.GLTFLoader){console.warn("Three renderer unavailable; retaining original renderer");return;}
const T=window.THREE;
class World3DThree {
 constructor(canvas){
  this.canvas=canvas;this.contextLost=false;this.assets={};this.level=1;
  this.positions={
    1:{bike:{x:-4.6,z:1.4,y:.02,s:1.6},watch:{x:4.2,z:1.4,y:0,s:1.13},lihua:{x:4.0,z:-4.5,y:0,s:1.35}},
    2:{mom:{x:-2.8,z:-.9,y:0,s:1.29},doorbell:{x:1.35,z:-4.8,y:1.12,s:1.18},lihua:{x:4.1,z:-3.6,y:0,s:1.36},evidence_station:{x:-5.2,z:2.2,y:0,s:1.34}}
  };
  this.yaw=0;this.pitch=.72;this.dist=19;this.time=0;this.hotspots=[];this.padKeys=new Set();
  this.player={x:0,z:5.5,face:Math.PI,moving:false,bob:0};this.cursor={x:0,z:5.5};
  this.keys=new Set();this.joy={x:0,y:0};this.onMove=()=>{};this.onInteract=()=>{};
  this.renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:false,powerPreference:"low-power"});
  this.renderer.setPixelRatio(Math.min(1.1,window.devicePixelRatio||1));
  this.renderer.outputEncoding=T.sRGBEncoding;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.40; // brighten pastel without flattening colours
  this.renderer.setClearColor(0xc7eff5,1);
  this.gl=this.renderer.getContext();
  this.scene=new T.Scene();this.scene.background=new T.Color(0xc7eff5);
  this.scene.fog=new T.Fog(0xdbf2e0,36,88);
  this.scene.add(new T.HemisphereLight(0xfff7df,0xb0d9a9,1.62));
  const sun=new T.DirectionalLight(0xfff5d4,2.05);sun.position.set(-7,13,8);this.scene.add(sun);
  const fill=new T.DirectionalLight(0xc2f0ff,.80);fill.position.set(8,8,-7);this.scene.add(fill);
  this.camera3D=new T.PerspectiveCamera(54,1,.1,120);
  this.loader=new T.GLTFLoader();
  this.worldGroup=new T.Group();this.scene.add(this.worldGroup);
  this.hotspotGroup=new T.Group();this.scene.add(this.hotspotGroup);
  this.avatarGroup=new T.Group();this.scene.add(this.avatarGroup);
  this.playerSprite=this.createPlayerSprite(); // only the moving protagonist is 2D; all NPCs, props and scenes remain 3D
  this.modelNodes=new Map();
  this.lihuaTexture=new T.TextureLoader().load('assets/lihua-chibi.svg',undefined,undefined,err=>console.warn('Lihua 2D asset:',err));
  this.lastRender=0;
  this.makeGround();
  this.bindControls();
  this.resize();
  if(window.ResizeObserver)new ResizeObserver(()=>this.resize()).observe(canvas);
  window.addEventListener('resize',()=>this.resize());
  canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();this.contextLost=true;const backup=document.getElementById('sceneBackup');if(backup)backup.hidden=false;window.toast?.('3D 显卡暂时停止绘图，请点击恢复按钮。')});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
 }
 createPlayerSprite(){
   // The protagonist is screen-facing, but her feet follow her REAL 3D world coordinates.
   // Keeping this lightweight sprite above WebGL prevents camera angle, depth occlusion,
   // mesh normals and GPU frustum issues from making the walking character disappear.
   const image=document.createElement('img');
   image.src='assets/player-chibi.svg';
   image.alt='';
   image.setAttribute('aria-hidden','true');
   image.draggable=false;
   Object.assign(image.style,{
     position:'absolute',left:'50%',top:'72%',height:'158px',width:'auto',
     transform:'translate(-50%,-96%)',
     transformOrigin:'50% 95%',
     pointerEvents:'none',userSelect:'none',zIndex:'1',
     filter:'drop-shadow(0 5px 4px rgba(55,77,49,.22))',
     willChange:'left,top,transform'
   });
   this.canvas.parentElement.appendChild(image);
   // In case a browser blocks SVG, the playable 3D world and tasks still work.
   image.onerror=()=>{image.style.visibility='hidden';console.warn('Player sprite failed to load');};
   return image;
 }
 updatePlayerSprite(){
   const image=this.playerSprite;if(!image)return;
   const p=this.player,foot=new T.Vector3(p.x,.02,p.z).project(this.camera3D),
         head=new T.Vector3(p.x,2.15,p.z).project(this.camera3D);
   const w=this.canvas.clientWidth,h=this.canvas.clientHeight;
   if(!w||!h)return;
   // Camera follows the avatar; clamp only as an emergency safety guard.
   const safe=v=>Number.isFinite(v)?v:0;
   const px=w*(.5+.5*safe(foot.x));
   const py=h*(.5-.5*safe(foot.y));
   const height=Math.max(92,Math.min(230,Math.abs(head.y-foot.y)*h*.52));
   image.style.left=Math.max(55,Math.min(w-55,px))+'px';
   image.style.top=Math.max(110,Math.min(h-8,py))+'px';
   image.style.height=height+'px';
   const wobble=p.moving?Math.sin(p.bob)*2.2:0;
   image.style.transform='translate(-50%,-96%) rotate('+wobble.toFixed(2)+'deg)';
   image.style.visibility='visible';
 }
 makeGround(){
   const ground=new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshLambertMaterial({color:0xabe294}));
   ground.rotation.x=-Math.PI/2;ground.position.y=-.95;this.scene.add(ground);
 }
 resize(){
   const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);
   if(w===this.lastW&&h===this.lastH)return;
   this.lastW=w;this.lastH=h;this.renderer.setSize(w,h,false);
   this.camera3D.aspect=w/h;this.camera3D.updateProjectionMatrix();
 }
 async load(name){
  if(this.assets[name])return this.assets[name];
  const src='assets/models/'+name+'.glb';
  const gltf=await new Promise((resolve,reject)=>this.loader.load(src,resolve,undefined,err=>reject(new Error(name+': '+(err?.message||err)))));
  this.assets[name]=gltf.scene;
  gltf.scene.traverse(child=>{if(child.isMesh){child.frustumCulled=false;}});
  return gltf.scene;
 }
 setLevel(level){
   this.level=level;
   while(this.worldGroup.children.length)this.worldGroup.remove(this.worldGroup.children[0]);
   while(this.hotspotGroup.children.length)this.hotspotGroup.remove(this.hotspotGroup.children[0]);
   this.modelNodes.clear();
   this.player={x:0,z:5.5,face:Math.PI,moving:false,bob:0};this.cursor={x:0,z:5.5};
   this.resetCamera();
   const name=level===1?'school_campus_v2':'scene2_house_clay',model=this.assets[name];
   if(model){
    const m=model.clone(true);m.scale.setScalar(level===1?1:1.77);
    m.position.set(0,level===1?0:-.16,0);
    this.worldGroup.add(m);
   }
   this.avatarGroup.clear?.();
   while(this.avatarGroup.children.length)this.avatarGroup.remove(this.avatarGroup.children[0]);
   // Keep the real girl.glb asset available, but draw ONLY the player as a stable
   // 2D camera-facing figure; 3D NPCs and all other scene assets are unchanged.
   this.syncHotspots();
 }
 syncHotspots(){
  const included=new Set();
  for(const h of this.hotspots){
   const p=this.positions[this.level]?.[h.hotspotId];if(!p)continue;
   included.add(h.id);
   if(!this.modelNodes.has(h.id)){
     const holder=new T.Group();
     holder.position.set(p.x,p.y,p.z);
     const key=h.hotspotId==='watch'&&this.level===1?'watch_display_v2':h.model.replace('.glb','');
     if(h.hotspotId==='lihua'){
      // A 2D camera-facing Lihua with her blue ponytail ribbon and bandage.
      const npc=new T.Sprite(new T.SpriteMaterial({map:this.lihuaTexture,transparent:true,depthWrite:false,alphaTest:.05}));
      npc.scale.set(1.63*p.s,2.45*p.s,1);
      npc.position.set(0,1.18*p.s-p.y,0);
      holder.add(npc);
     } else if(this.assets[key]){const obj=this.assets[key].clone(true);obj.scale.setScalar(p.s);holder.add(obj);}
     const ring=new T.Mesh(new T.TorusGeometry(.94,.055,9,48),new T.MeshBasicMaterial({color:0xffc966,transparent:true,opacity:.93,depthWrite:false}));
     ring.rotation.x=-Math.PI/2;ring.position.y=.06-p.y;holder.add(ring);
     this.hotspotGroup.add(holder);this.modelNodes.set(h.id,{holder,ring});
   }
   const n=this.modelNodes.get(h.id);
   n.h=h;
   n.holder.visible=!h.hidden;
   n.ring.material.color.set(h.done?0x83c8a0:h.available?0xffbd52:0xb4baba);
   n.ring.material.opacity=h.available?.95:h.done?.48:.24;
  }
  for(const [id,node] of this.modelNodes){
   if(!included.has(id)){this.hotspotGroup.remove(node.holder);this.modelNodes.delete(id);}
  }
 }
 resetCamera(){this.yaw=0;this.pitch=.72;this.dist=19;}
 getNear(){
  let best=null,d=Infinity,active=null,activeDistance=Infinity;
  for(const h of this.hotspots){
    if(h.hidden)continue;
    const p=this.positions[this.level]?.[h.hotspotId];if(!p)continue;
    const x=Math.hypot(this.player.x-p.x,this.player.z-p.z);
    if(x<d){d=x;best=h;}
    if(h.available&&x<activeDistance){active=h;activeDistance=x;}
  }
  // A nearby unlocked task takes priority over an overlapping completed/locked hotspot.
  if(active&&activeDistance<=2.65)return {hotspot:active,dist:activeDistance};
  return {hotspot:best,dist:d};
 }
 collision(x,z){
  if(Math.abs(x)>10.3||Math.abs(z)>10.3)return true; // walk to every reachable courtyard corner
  if(this.level===1&&Math.abs(x)<6.6&&z<-5.85)return true;
  const colliders=this.level===1?[[-4.6,1.4,.92],[4.2,1.4,.85]]:[[-5.2,2.2,1.35],[.8,-5.7,1.05]];
  return colliders.some(([a,b,r])=>Math.hypot(x-a,z-b)<r);
 }
 update(dt,allow){
  if(!allow){this.player.moving=false;return;}
  let x=0,z=0,k=this.keys;
  if(k.has('KeyW')||k.has('ArrowUp'))z--;
  if(k.has('KeyS')||k.has('ArrowDown'))z++;
  if(k.has('KeyA')||k.has('ArrowLeft'))x--;
  if(k.has('KeyD')||k.has('ArrowRight'))x++;
  if(this.padKeys.has('up'))z--;if(this.padKeys.has('down'))z++;if(this.padKeys.has('left'))x--;if(this.padKeys.has('right'))x++;
  x+=this.joy.x;z+=this.joy.y;
  const len=Math.hypot(x,z);this.player.moving=len>.08;
  if(len>.08){
    x/=Math.max(1,len);z/=Math.max(1,len);
    const speed=k.has('ShiftLeft')||k.has('ShiftRight')?5.3:3.1;
    const dx=(x*Math.cos(this.yaw)+z*Math.sin(this.yaw))*speed*dt;
    const dz=(-x*Math.sin(this.yaw)+z*Math.cos(this.yaw))*speed*dt;
    const nx=this.player.x+dx,nz=this.player.z+dz;
    if(!this.collision(nx,this.player.z))this.player.x=nx;
    if(!this.collision(this.player.x,nz))this.player.z=nz;
    this.player.face=Math.atan2(dx,dz);this.player.bob+=dt*(speed>4?18:12);
  }
  this.cursor.x+=(this.player.x-this.cursor.x)*Math.min(1,dt*7);
  this.cursor.z+=(this.player.z-this.cursor.z)*Math.min(1,dt*7);
  this.onMove?.(this.player);
 }
 render(now){
   if(this.contextLost||this.gl.isContextLost())return;
   this.time=now/1000;this.resize();
   // 30 FPS graphics cap; movement runs every animation frame.
   if(now-this.lastRender<27)return;this.lastRender=now;
   this.syncHotspots();
   for(const node of this.modelNodes.values()){
      const m=node.ring;
      const pulse=(node.h.available?1.1:.88)*(1+.07*Math.sin(this.time*3.5));
      m.scale.setScalar(pulse);
   }
   const p=this.player;
   this.avatarGroup.position.set(p.x,.03+(p.moving?Math.sin(p.bob)*.046:Math.sin(this.time*2)*.013),p.z);
   this.avatarGroup.rotation.y=p.face+Math.PI;
   let xx=0; // hold the camera above the COURTYARD, not the character
   let zz=.4; // now actual A/D/W/S world movement is visible on screen
   const target=new T.Vector3(xx,1.15,zz);
   this.camera3D.position.set(xx+Math.sin(this.yaw)*Math.cos(this.pitch)*this.dist,1.15+Math.sin(this.pitch)*this.dist,zz+Math.cos(this.yaw)*Math.cos(this.pitch)*this.dist);
   this.camera3D.lookAt(target);
   this.renderer.render(this.scene,this.camera3D);
   this.updatePlayerSprite();
 }
 project(x,y,z){
   const v=new T.Vector3(x,y,z).project(this.camera3D);
   if(v.z>1||v.z< -1||!Number.isFinite(v.x))return null;
   if(Math.abs(v.x)>1.4||Math.abs(v.y)>1.4)return null;
   return {x:(v.x*.5+.5)*this.canvas.clientWidth,y:(1-(v.y*.5+.5))*this.canvas.clientHeight};
 }
 bindControls(){
   const c=this.canvas;
   window.addEventListener('keydown',e=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)&&!e.target?.closest?.('input,textarea,button,[contenteditable]'))e.preventDefault();
      if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
      this.keys.add(e.code);
      if(e.code==='KeyE'&&!e.repeat)this.onInteract?.();
      if(e.code==='KeyR'&&!e.repeat)this.resetCamera();
   });
   window.addEventListener('keyup',e=>this.keys.delete(e.code));
   window.addEventListener('blur',()=>{this.keys.clear();this.padKeys.clear()});
   let sx=0,sy=0,dragging=false;
   c.addEventListener('pointerdown',e=>{if(e.button===0||e.button===2){sx=e.clientX;sy=e.clientY;dragging=true;c.setPointerCapture?.(e.pointerId)}});
   c.addEventListener('pointermove',e=>{if(!dragging)return;let dx=e.clientX-sx,dy=e.clientY-sy;sx=e.clientX;sy=e.clientY;this.yaw-=dx*.0055;this.pitch=Math.max(.25,Math.min(1.18,this.pitch+dy*.0038));});
   c.addEventListener('pointerup',()=>dragging=false);
   c.addEventListener('pointercancel',()=>dragging=false);
   c.addEventListener('contextmenu',e=>e.preventDefault());
   c.addEventListener('wheel',e=>{e.preventDefault();this.dist=Math.max(12,Math.min(28,this.dist+Math.sign(e.deltaY)*1.2))},{passive:false});
   // Large on-screen arrows: can be held continuously with mouse or touch.
   document.querySelectorAll('#movePad [data-dir]').forEach(el=>{
     const dir=el.dataset.dir;
     el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);this.padKeys.add(dir)});
     const stop=()=>this.padKeys.delete(dir);
     el.addEventListener('pointerup',stop);el.addEventListener('pointercancel',stop);el.addEventListener('lostpointercapture',stop);
   });
   const stick=document.querySelector('#joystick');
   if(stick){
    let active=false;stick.addEventListener('pointerdown',e=>{active=true;stick.setPointerCapture(e.pointerId)});
    stick.addEventListener('pointermove',e=>{if(!active)return;let r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.42),dy=(e.clientY-r.top-r.height/2)/(r.height*.42);this.joy={x:Math.max(-1,Math.min(1,dx)),y:Math.max(-1,Math.min(1,dy))};stick.querySelector('.thumb').style.transform='translate('+(this.joy.x*31)+'px,'+(this.joy.y*31)+'px)'});
    const off=()=>{active=false;this.joy={x:0,y:0};stick.querySelector('.thumb').style.transform='';};
    stick.addEventListener('pointerup',off);stick.addEventListener('pointercancel',off);
   }
 }
}
window.World3DThree=World3DThree;
console.info('HandWatch: robust Three.js renderer ready');
})();