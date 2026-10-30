/* 《手表》V20 — glTF clay island scene. Drop-in WatchThreeScene renderer; lesson UI untouched. */
(function(global){
'use strict';
global.WatchThreeScene=function(options){
  const T=options.THREE||global.THREE;if(!T)throw Error('Three.js r128 missing');
  const canvas=options.canvas,scene=new T.Scene();
  // V22: full-bleed pastel sky instead of empty gray photography backdrop.
  // The floor below extends the clay island's garden into a navigable 3D landscape.
  const skyCanvas=document.createElement('canvas');
  skyCanvas.width=64;skyCanvas.height=512;
  const skyCtx=skyCanvas.getContext('2d');
  const skyGradient=skyCtx.createLinearGradient(0,0,0,512);
  skyGradient.addColorStop(0,'#a7cdeb');
  skyGradient.addColorStop(.52,'#c6e0ef');
  skyGradient.addColorStop(.85,'#e5ebd7');
  skyGradient.addColorStop(1,'#dfe8c4');
  skyCtx.fillStyle=skyGradient;skyCtx.fillRect(0,0,64,512);
  const skyTexture=new T.CanvasTexture(skyCanvas);
  skyTexture.encoding=T.sRGBEncoding;
  scene.background=skyTexture;scene.fog=null;
  const camera=new T.PerspectiveCamera(50,1,.08,180);
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
  // Seamless, low-profile outdoor clay garden surrounding both 11x11 GLB islands.
  // This is not a distant backdrop: it is actual 3D ground that fills the viewport.
  const soilCanvas=document.createElement('canvas');
  soilCanvas.width=512;soilCanvas.height=512;
  const soilCtx=soilCanvas.getContext('2d');
  soilCtx.fillStyle='#b8d987';soilCtx.fillRect(0,0,512,512);
  let seed=73127;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const blades=['#acd17b','#c8e5a2','#a5cb72','#d5e5af','#b2d486'];
  for(let i=0;i<1350;i++){
    const x=rand()*512,y=rand()*512;
    soilCtx.fillStyle=blades[Math.floor(rand()*blades.length)];
    soilCtx.globalAlpha=.18+rand()*.21;
    soilCtx.beginPath();
    soilCtx.ellipse(x,y,1.2+rand()*3,.7+rand()*2,rand()*Math.PI,0,Math.PI*2);
    soilCtx.fill();
  }
  soilCtx.globalAlpha=1;
  const soilMap=new T.CanvasTexture(soilCanvas);
  soilMap.encoding=T.sRGBEncoding;
  soilMap.wrapS=soilMap.wrapT=T.RepeatWrapping;
  soilMap.repeat.set(12,12);
  soilMap.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const outdoorMat=new T.MeshStandardMaterial({map:soilMap,roughness:1,metalness:0});
  const floor=new T.Mesh(new T.PlaneGeometry(160,160),outdoorMat);
  floor.rotation.x=-Math.PI/2;floor.position.y=-.11;
  floor.receiveShadow=true;scene.add(floor);
  const root=new T.Group();scene.add(root);
  let stage=-1,requestToken=0,width=1,height=1,disposed=false,playerGroup=null,visual=null;
  let previous=null,idlePhase=0,walkingPhase=0,cameraReady=false,filterOn=false,loadingStatus='pending';
  // Full-screen, player-following third-person view (about 28-35 degrees elevation).
  // '⌂' retains a separate whole-island overview, so the default can be truly immersive.
  const defaultDistance=6.5,overviewDistance=13.6,minDistance=4.4,maxDistance=22;
  let zoomDistance=defaultDistance,orbitYaw=.42,orbitElevation=.55;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const defaultYaw=.42,defaultElevation=.55;
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

  // V24 enhancements are kept in a small separate file, without rewriting the
  // 1 MB HTML lesson file. Script is loaded once by the scene engine.
  if(!global.__watchV24Requested){
    global.__watchV24Requested=true;
    const addon=document.createElement('script');
    addon.src=new URL('ui-v24.js',document.baseURI).href;
    addon.defer=true;addon.onerror=()=>console.warn('V24 UI enhancer unavailable');
    document.head.appendChild(addon);
  }
  // V23: flat, illustration-style children in the 3D world. Self-contained CanvasTextures
  // avoid missing external PNG assets and keep the lesson's GLB props untouched.
  const spriteCache=new Map();
  function portraitTexture(who){
    if(spriteCache.has(who))return spriteCache.get(who);
    const paper=document.createElement('canvas');paper.width=512;paper.height=768;
    const c=paper.getContext('2d');c.lineJoin='round';c.lineCap='round';
    const isLihua=who==='lihua';
    const brown=isLihua?'#634031':'#34251e',shine=isLihua?'#91634a':'#604334';
    const skin='#ffddc2',pink='#ffaaa0',blue='#315b9a',blueShade='#25477f';
    function fill(color){c.fillStyle=color;c.fill();}
    function ell(x,y,rx,ry,color,rotation=0){
      c.save();c.translate(x,y);c.rotate(rotation);c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);fill(color);c.restore();
    }
    function path(points,color){
      c.beginPath();c.moveTo(points[0][0],points[0][1]);
      for(let i=1;i<points.length;i++){
        const p=points[i];if(p.length===2)c.lineTo(p[0],p[1]);
        else c.bezierCurveTo(p[0],p[1],p[2],p[3],p[4],p[5]);
      }
      c.closePath();fill(color);
    }
    function stroke(points,color,width){
      c.beginPath();c.moveTo(points[0][0],points[0][1]);
      for(let i=1;i<points.length;i++){
        const p=points[i];if(p.length===2)c.lineTo(p[0],p[1]);
        else c.bezierCurveTo(p[0],p[1],p[2],p[3],p[4],p[5]);
      }
      c.strokeStyle=color;c.lineWidth=width;c.stroke();
    }
    // Hair and accessories behind the body.
    if(isLihua){
      path([[312,170],[378,120,445,135,448,204],[480,254,440,337,392,322],[355,311,319,274,312,170]],brown);
      ell(417,198,66,96,brown,-.18);
      ell(432,200,51,78,shine,-.22);
      ell(426,195,13,23,'#78a7df');
    }else{
      path([[150,246],[121,360,112,501,142,569],[167,592,192,593,215,569],[240,560,270,559,302,574],[330,599,377,594,392,550],[375,449,379,334,344,244]],brown);
      stroke([[164,332],[153,420,154,494,164,555]],shine,9);
      stroke([[349,334],[361,430,360,491,346,552]],shine,9);
    }
    // Two little shoes and white socks: maintain recognisable full-body silhouette.
    ell(206,686,33,44,'#fff9ef');ell(312,686,33,44,'#fff9ef');
    ell(205,721,47,24,'#2d3545',-.06);ell(314,721,47,24,'#2d3545',.06);
    // School uniform skirt with folded triangular panels.
    path([[183,470],[333,470],[379,643],[139,643]],blue);
    path([[184,473],[210,642],[226,643],[227,477]],'#416eab');
    path([[245,474],[250,642],[271,642],[268,474]],blueShade);
    path([[315,475],[298,640],[325,641],[344,492]],'#4770ab');
    stroke([[142,640],[207,646,309,648,377,640]],'#25477f',7);
    // Beige backpack behind sleeve only, readable while walking.
    if(!isLihua){
      path([[162,418],[111,408,105,475,110,532],[115,570,148,587,166,562],[186,523,180,449,162,418]],'#d8c5aa');
      stroke([[130,438],[110,477,113,529,126,550]],'#aa9377',8);
      path([[126,516],[158,515],[157,550],[127,547]],'#c7ac8d');
    }
    // Arms, sleeves and torso.
    ell(164,470,30,95,skin,.17);ell(351,470,30,95,skin,-.17);
    path([[190,408],[319,408],[346,501],[170,501]],'#ffffff');
    ell(178,435,35,40,'#fffdf7',-.36);ell(333,435,35,40,'#fffdf7',.36);
    ell(152,530,24,29,skin);ell(365,530,24,29,skin);
    // A readable bandage around Lihua's forearm in the classroom scene.
    if(isLihua){
      c.save();c.translate(352,507);c.rotate(-.23);c.fillStyle='#fffdf7';c.fillRect(-26,-19,52,38);
      c.strokeStyle='#dad1c3';c.lineWidth=3;for(let k=-18;k<=16;k+=16){c.beginPath();c.moveTo(k,-18);c.lineTo(k+10,18);c.stroke();}
      c.restore();
    }
    // Collar and bow with sharp blue wings, not vague circular beads.
    path([[204,405],[251,433],[221,455]],'#f5f5f2');
    path([[309,405],[263,433],[295,455]],'#f5f5f2');
    path([[254,440],[210,428],[214,480],[254,453]],blue);
    path([[259,440],[304,427],[301,479],[259,453]],blue);
    ell(257,448,13,15,'#1e3f7a');
    // Main soft rounded head.
    ell(257,271,137,151,brown);
    ell(256,283,126,137,skin);
    ell(134,303,25,42,skin);ell(379,303,25,42,skin);
    // Side locks and airy fringe.
    path([[148,205],[181,157,223,166,236,186],[238,225,205,245,165,247],[147,261,142,236,148,205]],brown);
    path([[213,154],[272,135,331,165,358,213],[348,246,337,260,313,241],[294,226,289,215,263,226],[235,237,209,220,213,154]],brown);
    if(!isLihua){
      path([[131,292],[135,403,128,476,146,552],[180,563,190,507,173,408],[167,347,161,313,131,292]],brown);
      path([[371,285],[377,392,389,473,366,550],[326,550,321,483,339,399],[349,343,358,307,371,285]],brown);
    }else{
      stroke([[341,184],[365,212,379,254,374,294]],shine,11);
      ell(371,169,21,17,'#6698d5');
    }
    // Big glossy, expressive eyes; soft cheeks and a subtle smile.
    ell(207,302,17,26,'#271d1d');ell(305,302,17,26,'#271d1d');
    ell(201,294,6,8,'#ffffff');ell(299,294,6,8,'#ffffff');
    ell(179,338,27,13,pink,-.09);ell(332,338,27,13,pink,.09);
    stroke([[241,359],[255,372,271,373,285,359]],'#c46b68',5);
    if(!isLihua){
      // The white bucket hat with a black flower: narrator's strongest identifier.
      path([[141,204],[155,112,196,89,266,92],[332,93,365,132,372,204]],'#faf6ea');
      path([[129,203],[161,184,344,183,391,204],[404,227,349,244,260,249],[176,245,115,227,129,203]],'#e9dfcb');
      stroke([[132,207],[214,226,333,222,389,210]],'#d9cbb2',5);
      // Four dark petals on the hat's left-facing front.
      ell(189,151,9,16,'#313138');ell(189,151,9,16,'#313138',Math.PI/2);
      ell(189,151,6,6,'#f7f1e3');
    }
    // Small soft contour accents keep the illustration readable at game scale.
    const tex=new T.CanvasTexture(paper);tex.encoding=T.sRGBEncoding;
    tex.minFilter=T.LinearFilter;tex.magFilter=T.LinearFilter;
    tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    spriteCache.set(who,tex);return tex;
  }
  function flatGirl(who,parent,x,z,height){
    const mat=new T.SpriteMaterial({
      map:portraitTexture(who),transparent:true,alphaTest:.035,
      depthTest:false,depthWrite:false,toneMapped:false
    });
    const sprite=new T.Sprite(mat);
    const h=height||2.55;
    sprite.scale.set(h*512/768,h,1);
    // Player group's origin is already y=.22, while NPCs live directly under the root.
    const localGround=parent===playerGroup?0:.21;
    sprite.position.set(x,localGround,z);
    sprite.center.set(.5,0);sprite.renderOrder=45;
    sprite.userData.baseHeight=h;sprite.userData.isFlatGirl=true;
    parent.add(sprite);
    // Thin contact shadow: the characters remain grounded despite billboard rendering.
    const shadow=new T.Mesh(new T.CircleGeometry(.41,32),
      new T.MeshBasicMaterial({color:0x344b35,transparent:true,opacity:.19,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.1,.56,1);
    shadow.position.set(x,parent===playerGroup?0:.205,z);parent.add(shadow);
    return sprite;
  }
  // Build a genuine school, not the cottage baked into scene1_campus_clay.glb.
  // All building and tree geometry stays behind the two reading clue points.
  function createSchoolCampus(){
    const group=new T.Group();root.add(group);
    const mat=(hex)=>new T.MeshStandardMaterial({color:hex,roughness:.91,metalness:0});
    const grass=mat(0xb6d883),walkway=mat(0xe3c996),schoolWall=mat(0xf7dbb1);
    const trim=mat(0x6fa5c0),roof=mat(0x4e84ac),window=mat(0xa8d7ed);
    const windowFrame=mat(0xfbf3df),door=mat(0xa86e45);
    const treeBrown=mat(0x966a45),leaves=mat(0x84bc62);
    function mesh(geometry,material,x,y,z){
      const o=new T.Mesh(geometry,material);o.position.set(x,y,z);
      o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
    }
    function block(w,h,d,material,x,y,z){return mesh(new T.BoxGeometry(w,h,d),material,x,y,z);}
    // Low, unobstructed garden and warm campus walk.
    const lawn=mesh(new T.PlaneGeometry(14,13),grass,0,.194,-.15);
    lawn.rotation.x=-Math.PI/2;lawn.castShadow=false;
    function path(x1,z1,x2,z2,w){
      const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);
      const p=mesh(new T.PlaneGeometry(w,len),walkway,(x1+x2)/2,.207,(z1+z2)/2);
      p.rotation.set(-Math.PI/2,0,Math.atan2(dx,dz));p.castShadow=false;
    }
    path(-4.7,2.7,-2,-1.2,1.55);
    path(-2,-1.2,2.8,-2.9,1.35);
    // Proper rectangular school with blue fascia, windows and a corridor entrance.
    // Front facade faces +z, toward the third-person camera.
    block(5.7,2.8,1.65,schoolWall,2.1,1.62,-4.6);
    block(6.0,.26,1.9,roof,2.1,3.13,-4.6);
    block(5.7,.21,.19,trim,2.1,2.36,-3.72);
    block(5.7,.12,.18,windowFrame,2.1,.51,-3.72);
    for(const x of [-.05,1.30,2.65,4.0]){
      block(.83,1.00,.055,windowFrame,x,1.83,-3.73);
      block(.72,.88,.065,window,x,1.83,-3.69);
      block(.067,.96,.075,windowFrame,x,1.83,-3.65);
      block(.81,.063,.08,windowFrame,x,1.83,-3.63);
    }
    block(.89,1.70,.085,door,4.52,1.11,-3.67);
    const knob=mesh(new T.SphereGeometry(.055,10,8),mat(0xe2c45c),4.83,1.18,-3.60);
    block(2.5,.46,.09,windowFrame,2.05,2.69,-3.62);
    // School sign painted on school facade, never treated as text evidence.
    const nameCanvas=document.createElement('canvas');nameCanvas.width=640;nameCanvas.height=128;
    const cx=nameCanvas.getContext('2d');
    cx.fillStyle='#faf6e9';cx.fillRect(0,0,640,128);
    cx.font='bold 64px sans-serif';cx.textAlign='center';cx.textBaseline='middle';
    cx.fillStyle='#2d6a65';cx.fillText('校园 · 教学楼',320,70);
    const signTex=new T.CanvasTexture(nameCanvas);signTex.encoding=T.sRGBEncoding;
    const sign=mesh(new T.PlaneGeometry(2.32,.45),
      new T.MeshBasicMaterial({map:signTex,side:T.DoubleSide}),2.05,2.69,-3.558);
    sign.castShadow=false;
    // Trees are at the far backdrop, not above Lihua's hotspot.
    function tree(x,z){
      mesh(new T.CylinderGeometry(.14,.18,1.4,12),treeBrown,x,.87,z);
      for(const [ox,oy,oz,r] of [[0,1.75,0,.58],[-.40,1.65,0,.42],[.36,1.7,0,.45]])
        mesh(new T.SphereGeometry(r,14,10),leaves,x+ox,oy,z+oz);
    }
    tree(-5.8,-5.2);
    for(const [x,z] of [[-4.7,-.4],[-3.2,.9],[4.9,.55],[.2,1.4]]){
      mesh(new T.SphereGeometry(.22,10,8),leaves,x,.30,z);
    }
    return group;
  }

  function buildStage(index,items){
    const token=++requestToken;root.clear();rings.length=0;stage=index;visual=null;previous=null;
    playerGroup=new T.Group();root.add(playerGroup);
    // The first level is now a school campus; the second keeps Lihua's house.
    loadingStatus='loading';
    if(index===0){
      createSchoolCampus();loadingStatus='school-ready';
    }else{
      const base=new T.Mesh(new T.CylinderGeometry(5.65,5.45,.66,64),fallback.base);
      base.position.y=-.16;base.castShadow=true;base.receiveShadow=true;root.add(base);
      const turf=new T.Mesh(new T.CylinderGeometry(5.6,5.6,.06,64),fallback.turf);
      turf.position.y=.18;turf.receiveShadow=true;root.add(turf);
      attach('scene2_house_clay.glb',0,0,0,1,0,token).then(o=>{
        if(o&&token===requestToken){root.remove(base,turf);loadingStatus='house-ready';}
      });
    }
    // Transparent flat protagonist is rendered immediately; no temporary 3D doll.
    visual=flatGirl('girl',playerGroup,0,0,2.6);
    loadingStatus='characters-ready';
    for(const item of items){
      // Flat ground rings only: no signs, fences or tall foliage.
      const mat=new T.MeshBasicMaterial({color:0xffd177,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
      const ring=new T.Mesh(new T.RingGeometry(.4,.52,48),mat);
      ring.rotation.x=-Math.PI/2;ring.position.set(item.x,.235,item.z);ring.renderOrder=2;
      root.add(ring);rings.push({item,ring});
    }
    if(index===0){
      // Visible open-space placement: no trunk or building overlaps Lihua.
      flatGirl('lihua',root,-1.55,-1.25,2.5);
      // Place the actual blue bicycle on the first clue ring, in front of the students.
      const bicycleClue=items.find(item=>/脚踏车|自行车|bike/i.test(item.label||''))||items[0]||{x:-3.2,z:-1.8};
      attach('bike.glb',bicycleClue.x,.32,bicycleClue.z,.92,.64,token).then(o=>{
        if(o){o.rotation.z=-Math.PI*.34;o.traverse(m=>{if(m.isMesh)m.castShadow=true;});}
      });
    }else{
      flatGirl('lihua',root,-.28,-2.52,2.5);
      // Mother never appears at Lihua's doorway in paragraphs 7–8.
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
  function resetView(){setZoom(overviewDistance);orbitYaw=defaultYaw;orbitElevation=defaultElevation;}
  function returnToPlayer(){setZoom(defaultDistance);orbitYaw=defaultYaw;orbitElevation=defaultElevation;}
  zoomButton('＋','放大3D场景',()=>setZoom(zoomDistance*.83));
  zoomButton('－','缩小3D场景',()=>setZoom(zoomDistance*1.2));
  zoomButton('⌂','查看完整岛屿全景',resetView);
  const personButton=zoomButton('人','回到人物近景',returnToPlayer);
  personButton.style.fontSize='18px';
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
    const aspect=Math.max(width/height,.32);
    // On desktop the avatar occupies about 25-35% of viewport height, not 2-4%.
    // Narrow phone screens back the camera away slightly to keep navigation usable.
    const responsive=Math.max(1,Math.sqrt(1.12/aspect));
    const distance=zoomDistance*responsive;
    // Close-up: follow actual player x/z. Overview: frame the island centre.
    const followWeight=1-clamp((zoomDistance-8.9)/(overviewDistance-8.9),0,1);
    const px=p&&Number.isFinite(p.x)?p.x:0;
    const pz=p&&Number.isFinite(p.z)?p.z:0;
    const focus=new T.Vector3(px*followWeight,.94*followWeight+.40*(1-followWeight),pz*followWeight);
    const horizontal=Math.cos(orbitElevation)*distance;
    const goal=new T.Vector3(
      focus.x+Math.sin(orbitYaw)*horizontal,
      focus.y+Math.sin(orbitElevation)*distance,
      focus.z+Math.cos(orbitYaw)*horizontal);
    if(!cameraReady){camera.position.copy(goal);cameraTarget.copy(focus);cameraReady=true;}
    const blend=1-Math.exp(-dt*5.8);
    camera.position.lerp(goal,blend);
    cameraTarget.lerp(focus,blend);
    camera.lookAt(cameraTarget);
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
      const base=visual.userData.baseHeight||1;
      visual.position.y=walks?Math.abs(Math.sin(walkingPhase))*.05:Math.sin(idlePhase)*.008;
      // Flat character remains a camera-facing billboard, never a thin edge-on card.
      visual.scale.y=base*(1+(walks?Math.sin(walkingPhase)*.013:Math.sin(idlePhase)*.004));
      if(!visual.isSprite){
        visual.rotation.z=walks?Math.sin(walkingPhase)*.027:Math.sin(idlePhase*.52)*.005;
        visual.rotation.x=walks?Math.sin(walkingPhase)*.013:0;
      }
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
    // Lower hotspot labels to ground level and nudge the accident clue away from Lihua.
    const nx=stage===0&&Math.abs(x+3)<.08&&Math.abs(z+1.7)<.12?x-.42:x;
    projected.set(nx,.44,z).project(camera);
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
