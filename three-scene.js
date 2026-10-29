/* 《手表》 WebGL 场景引擎 V15 · 深色夏日油画色板 — Three.js r128, 原游戏阅读逻辑不变。
 * Painting and characters are procedural 3D geometry. Character artwork is not a Sprite.
 * Environment textures are generated from a seed and painterly strokes.
 */
(function (global) {
  'use strict';
  global.WatchThreeScene = function WatchThreeScene(options) {
    const T = options.THREE || global.THREE;
    if (!T) throw new Error('Three.js r128 has not loaded');
    const canvas = options.canvas;
    const scene = new T.Scene();
    scene.background = new T.Color(0x3b78b5);
    scene.fog = new T.Fog(0x6ba3d6, 48, 165);
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new T.WebGLRenderer({canvas:canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,1.65));
    renderer.setSize(1, 1, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    const hemisphere = new T.HemisphereLight(0x8eaad2, 0x3c5725, .52);
    scene.add(hemisphere);
    const sunlight = new T.DirectionalLight(0xfff0cc,1.4);
    sunlight.position.set(-10,20,11);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048,2048);
    sunlight.shadow.camera.left=-26;sunlight.shadow.camera.right=26;
    sunlight.shadow.camera.top=30;sunlight.shadow.camera.bottom=-24;
    sunlight.shadow.camera.near=1;sunlight.shadow.camera.far=85;
    sunlight.shadow.bias=-0.00045;
    sunlight.shadow.normalBias=0.018;
    scene.add(sunlight);
    const fill = new T.DirectionalLight(0x8ea9d3,.20);
    fill.position.set(12,8,-9);scene.add(fill);
    let sceneRoot = new T.Group();scene.add(sceneRoot);
    let stage=-1, width=1,height=1;
    let activeGrass=null, grassInfo=[], currentPlayer=null, npcGirls=[], stageRings=[];
    let cameraReady=false;
    const tempMatrix=new T.Matrix4(),tempQuat=new T.Quaternion(),tempPos=new T.Vector3(),tempScale=new T.Vector3();
    const upAxis=new T.Vector3(0,1,0),forwardPoint=new T.Vector3(), projected=new T.Vector3();
    const bodyMaterial=new Map();const texCache=new Map();
    let idSeed=1337;
    function random(){idSeed=(1664525*idSeed+1013904223)>>>0;return idSeed/4294967296;}
    function makeRng(seed){let x=seed>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
    function shade(hex,delta){let c=new T.Color(hex), rgb=c.clone().multiplyScalar(1+delta);return '#'+rgb.getHexString();}
    function createPainterlyTexture(baseColor,strokeColor){
      // Impasto paint: 1040 rotated oval paint strokes per swatch, seeded and cacheable.
      const key=String(baseColor)+':'+String(strokeColor);
      if(texCache.has(key))return texCache.get(key);
      const c=document.createElement('canvas');c.width=c.height=512;
      const g=c.getContext('2d');const seed=Array.from(key).reduce((a,v)=>((a*33)^v.charCodeAt(0))>>>0,519);
      const rnd=makeRng(seed),base=new T.Color(baseColor),accent=new T.Color(strokeColor);
      g.fillStyle=baseColor;g.fillRect(0,0,512,512);
      for(let i=0;i<1040;i++){
        const x=rnd()*540-14,y=rnd()*540-14;
        const w=5+rnd()*24,h=1.65+rnd()*5.5,angle=(rnd()-.5)*2.2;
        const color=(i%4===0?base:accent).clone();
        const delta=i%9===0?-.37:i%6===0?.32:(rnd()-.5)*.26;
        color.multiplyScalar(1+delta);
        g.save();g.translate(x,y);g.rotate(angle);
        g.globalAlpha=.15+rnd()*.38;g.fillStyle='#'+color.getHexString();
        g.beginPath();g.ellipse(0,0,w,h,0,0,Math.PI*2);g.fill();
        if(i%5===0){g.globalAlpha=.19;g.strokeStyle=baseColor;g.lineWidth=.9+rnd()*2;
          g.beginPath();g.ellipse(0,0,w*.8,h*.56,0,.2,Math.PI*1.75);g.stroke();}
        g.restore();
      }
      g.globalAlpha=1;const texture=new T.CanvasTexture(c);
      texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.encoding=T.sRGBEncoding;
      texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
      texture.needsUpdate=true;texCache.set(key,texture);return texture;
    }
    function material(base,stroke,opts={}){
      const key=[base,stroke||base,opts.roughness||.96,opts.transparent||false].join('|');
      if(!bodyMaterial.has(key))bodyMaterial.set(key,new T.MeshStandardMaterial({color:0xffffff,map:createPainterlyTexture(base,stroke||base),roughness:opts.roughness||.96,metalness:0,side:T.FrontSide,transparent:!!opts.transparent}));
      return bodyMaterial.get(key);
    }
    const white=material('#f7f1e3','#d5c3a1'),wood=material('#6e4726','#a16b3d'),darkwood=material('#52331e','#82522e');
    const claySkin=material('#ffe0bd','#f3b79e'),brownHair=material('#3b2314','#68432b');
    const softCream=material('#f7f1e3','#dbcbb1'),blueCloth=material('#284b8a','#4a72ad');
    function add(parent,mesh,x=0,y=0,z=0){mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
    function mesh(geom,mat,x,y,z,parent=sceneRoot,shadow=true){const o=new T.Mesh(geom,mat);add(parent,o,x,y,z);o.castShadow=shadow;o.receiveShadow=true;return o;}
    function box(w,h,d,mat,x,y,z,parent=sceneRoot){return mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);}
    function ball(r,mat,x,y,z,parent=sceneRoot,seg=16){return mesh(new T.SphereGeometry(r,seg,12),mat,x,y,z,parent);}
    function cyl(rt,rb,h,mat,x,y,z,parent=sceneRoot,sides=12){return mesh(new T.CylinderGeometry(rt,rb,h,sides),mat,x,y,z,parent);}
    function torus(R,r,mat,x,y,z,parent=sceneRoot){return mesh(new T.TorusGeometry(R,r,7,40),mat,x,y,z,parent);}
    function tube(a,b,r,mat,parent=sceneRoot){let p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p);const obj=mesh(new T.CylinderGeometry(r,r,d.length(),8),mat,0,0,0,parent);obj.position.copy(p.add(q).multiplyScalar(.5));obj.quaternion.setFromUnitVectors(upAxis,d.normalize());return obj;}
    function roundedCloud(x,y,z,k=1){
      const mat=new T.MeshLambertMaterial({color:0xfffdf4,transparent:true,opacity:.96,fog:true});
      for(const [dx,dy,dz,r] of [[0,0,0,1.15],[-.95,-.13,.2,.85],[.95,-.12,.08,.9],[.1,.34,.1,.8]]){
        let o=ball(r*k,mat,x+dx*k,y+dy*k,z+dz*k,sceneRoot,12);o.castShadow=false;o.receiveShadow=false;
      }
    }
    function sky(){
 const c=document.createElement('canvas');c.width=2048;c.height=1024;const g=c.getContext('2d'),rnd=makeRng(781433);
 const grad=g.createLinearGradient(0,0,0,1024);
 for(const [t,col] of [[0,'#285c9a'],[.23,'#3b78b5'],[.45,'#8ab8d2'],[.52,'#fceabb'],[.57,'#3d81b0'],[.77,'#1c6ea4'],[1,'#16476f']])grad.addColorStop(t,col);
 g.fillStyle=grad;g.fillRect(0,0,2048,1024);
 function brush(x,y,rx,ry,col,alpha,angle=0){g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=alpha;g.fillStyle=col;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();g.restore();}
 for(let cluster=0;cluster<28;cluster++){const cx=rnd()*2048,cy=125+rnd()*260,sc=.55+rnd()*1.3;for(let j=0;j<18;j++)brush(cx+(rnd()-.5)*145*sc,cy+(rnd()-.5)*55*sc,(10+rnd()*32)*sc,(2+rnd()*10)*sc,j%6===0?'#aec7d6':j%4===0?'#f1d6b8':'#fffae9',.27+rnd()*.38,(rnd()-.5)*.35);}
 for(let layer=0;layer<3;layer++){g.beginPath();g.moveTo(0,580+layer*32);for(let x=-30;x<2100;x+=42)g.lineTo(x,445+layer*24+Math.sin(x*.008+layer*2)*32+(rnd()-.5)*54);g.lineTo(2048,640);g.lineTo(0,640);g.closePath();g.globalAlpha=.85;g.fillStyle=['#3a5f95','#4d648e','#294f7b'][layer];g.fill();for(let i=0;i<160;i++)brush(rnd()*2048,475+layer*25+rnd()*87,4+rnd()*21,1.3+rnd()*7,i%3===0?'#7770a0':i%3===1?'#224879':'#7195ad',.13+rnd()*.32,(rnd()-.5)*.9);}
 for(let i=0;i<310;i++){const x=rnd()*2048,y=545+rnd()*17;brush(x,y,5+rnd()*16,7+rnd()*20,i%3===0?'#2d5a45':'#254b55',.25+rnd()*.28);brush(x,628+rnd()*80,3+rnd()*10,12+rnd()*35,'#1d5b7f',.18+rnd()*.24);}
 for(let i=0;i<4200;i++){const x=rnd()*2048,y=rnd()*1024,palette=y<440?['#2b6099','#548cc0','#b0c7c6','#f2d8b0']:y<595?['#6f6b9a','#3b6595','#477c9d','#c3b48b']:['#164e7d','#277fb0','#a8b5a7','#32688f'];brush(x,y,2+rnd()*19,1+rnd()*5,palette[(rnd()*4)|0],.07+rnd()*.20,(rnd()-.5)*.95);}
 for(let i=0;i<650;i++)brush(rnd()*2048,595+rnd()*270,3+rnd()*23,1+rnd()*2,i%4===0?'#e4d6a8':'#75c5dc',.14+rnd()*.28,(rnd()-.5)*.12);
 g.globalAlpha=1;const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.needsUpdate=true;
 const dome=new T.Mesh(new T.SphereGeometry(325,64,32),new T.MeshBasicMaterial({map:tex,side:T.BackSide,fog:false,depthWrite:false}));dome.frustumCulled=false;sceneRoot.add(dome);
 const water=mesh(new T.PlaneGeometry(230,125),material('#1c6ea4','#246a96'),0,-.25,-95,sceneRoot,false);water.rotation.x=-Math.PI/2;water.receiveShadow=false;
 const waveMat=material('#4da2cf','#9bcee2');for(let i=0;i<126;i++){const x=(random()-.5)*96,z=-32-random()*100;const r=box(.5+random()*3.1,.009,.034,waveMat,x,-.16,z);r.castShadow=false;}
 const far=material('#3a5f95','#676099'),mid=material('#254b79','#3a668f');
 for(let i=0;i<19;i++){const x=-108+i*12+random()*5,y=8+random()*7;const m=mesh(new T.ConeGeometry(9+random()*8,y*2.4,5),i%3===0?far:mid,x,y*.48,-67-random()*17,sceneRoot,false);m.rotation.y=random()*Math.PI;m.scale.z=.52;}
 const forest=material('#315c43','#47734f');for(let i=0;i<25;i++){const x=-66+i*5.8,h=2+random()*5;const o=mesh(new T.ConeGeometry(.7+random()*.3,h,7),forest,x,h/2,-27-random()*6,sceneRoot,false);o.scale.x=1.25;}
}
    function makeTerrain(sceneIndex){
      const green=sceneIndex===1?material('#3a6b28','#5c9433'):material('#386a26','#5c9433');
      const geom=new T.PlaneGeometry(100,67,36,24);
      let pos=geom.getAttribute('position');
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getY(i);pos.setZ(i,.05*Math.sin(x*.45)*Math.cos(z*.3)+.035*Math.sin(x*.7+z*.33));
      }
      geom.computeVertexNormals();const o=mesh(geom,green,0,-.06,6,sceneRoot,false);o.rotation.x=-Math.PI/2;o.receiveShadow=true;
      function path(points,wide=1.7){
        const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],0.04,p[1])));
        const verts=[],uv=[],indices=[];
        for(let i=0;i<=90;i++){
          let u=i/90,point=curve.getPoint(u),tan=curve.getTangent(u),l=new T.Vector3(-tan.z,0,tan.x).normalize(),w=wide*(.87+.13*Math.sin(u*7));
          for(let sign of [-1,1]){let p=point.clone().addScaledVector(l,sign*w/2);verts.push(p.x,p.y,p.z);uv.push(sign===-1?0:1,u*7);}
          if(i<90){let a=2*i;indices.push(a,a+1,a+2,a+1,a+3,a+2)}
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
        let o=mesh(geo,material('#d4a359','#b37d36'),0,0,0,sceneRoot,false);o.receiveShadow=true;
      }
      path([[-5,8],[-4,3],[-2,-1],[-1,-4],[0,-8]],2.35);
      path([[-2,0],[1,-2],[3.5,-2],[5,1]],1.55);
      path([[-4,3],[-5,-1],[-4,-5]],1.15);
    }
    function makeGrass(){
      const verts=[-.108,0,0, .108,0,0, -.09,.38,.014, .09,.38,.014, -.045,.78,.13, .043,.78,.13, 0,1.11,.22];
      const faces=[0,1,2,1,3,2,2,3,4,3,5,4,4,5,6];
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex([...faces,...faces.slice().reverse()]);geo.computeVertexNormals();
      const m=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,side:T.DoubleSide,map:createPainterlyTexture('#d5e2ae','#b8ca96')});
      const count=3650;activeGrass=new T.InstancedMesh(geo,m,count);
      activeGrass.castShadow=false;activeGrass.receiveShadow=false;activeGrass.instanceMatrix.setUsage(T.DynamicDrawUsage);
      activeGrass.frustumCulled=false;sceneRoot.add(activeGrass);grassInfo=[];
      for(let i=0;i<count;i++){
        let x=-18+random()*36,z=-21+random()*39;
        // A small less-dense area follows the sandy walkway.
        const footpath=-4+(z-5)*.26;
        if(Math.abs(x-footpath)<1.35&&random()<.87) x+=(x>footpath?1:-1)*(1.3+random());
        const height=.38+random()*.87;
        const w=.7+random()*.8;
        const dir=random()*Math.PI*2;
        grassInfo.push({x,z,height,w,dir,phase:random()*6.28});
        const colors=['#2d5a1e','#68a832','#e8b838','#477a29','#83a632','#386b28'];const paint=new T.Color(colors[(random()*colors.length)|0]);
        activeGrass.setColorAt(i,paint);
      }
      activeGrass.instanceColor.needsUpdate=true;
      updateGrass(0);makeDaisies(115);
    }
    function makeDaisies(n){const petal=new T.MeshStandardMaterial({color:'#ffffff',roughness:.91,side:T.DoubleSide}),center=material('#f5a623','#e5a12d');const heads=new T.InstancedMesh(new T.SphereGeometry(.062,7,6),center,n),leaves=new T.InstancedMesh(new T.SphereGeometry(.070,7,5),petal,n*5);heads.castShadow=false;leaves.castShadow=false;const r=makeRng(55911);for(let i=0;i<n;i++){let x=-15+r()*30,z=-15+r()*29,h=.35+r()*.33;tempMatrix.makeTranslation(x,h,z);heads.setMatrixAt(i,tempMatrix);for(let j=0;j<5;j++){let a=j*2*Math.PI/5;tempPos.set(x+Math.cos(a)*.105,h,z+Math.sin(a)*.105);tempQuat.setFromAxisAngle(upAxis,a);tempScale.set(1,.23,.64);tempMatrix.compose(tempPos,tempQuat,tempScale);leaves.setMatrixAt(i*5+j,tempMatrix);}}heads.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;sceneRoot.add(heads,leaves);}
    function updateGrass(t){
      if(!activeGrass)return;
      for(let i=0;i<grassInfo.length;i++){
        let g=grassInfo[i];
        let sway=Math.sin(t*1.62+g.x*.57+g.z*.23+g.phase)*.11;
        const rotY=new T.Quaternion().setFromAxisAngle(upAxis,g.dir);
        const rotZ=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),sway);
        tempQuat.copy(rotY).multiply(rotZ);
        tempPos.set(g.x,.02,g.z);tempScale.set(g.w,g.height,g.w);
        tempMatrix.compose(tempPos,tempQuat,tempScale);activeGrass.setMatrixAt(i,tempMatrix);
      }
      activeGrass.instanceMatrix.needsUpdate=true;
    }
    function tree(x,z,h=5.5){
      const trunks=material('#6e4726','#986139');
      const leaf1=material('#2d5a1e','#477a29'),leaf2=material('#5c9433','#81a52d');
      cyl(.27,.37,h*.57,trunks,x,h*.29,z);
      tube([x,h*.42,z],[x+.48,h*.74,z+.18],.105,trunks);
      for(let i=0;i<7;i++){
        let a=i*6.28/7,r=.45+random()*.8;
        let blob=mesh(new T.DodecahedronGeometry(.75+random()*.45,1),i%3===0?leaf2:leaf1,x+Math.cos(a)*r,h*.73+random()*1.2,z+Math.sin(a)*r);
        blob.scale.y=.77+random()*.4;
      }
      const crown=ball(.95,leaf2,x,h*.89,z);crown.scale.y=.72;
    }
    function flowerBed(x,z){
      cyl(.45,.28,.44,material('#b76542','#d89765'),x,.22,z);
      for(let j=0;j<9;j++){
        const xx=x+(random()-.5)*.58,zz=z+(random()-.5)*.58,hh=.7+random()*.5;
        tube([xx,.39,zz],[xx,hh,zz],.027,material('#3b7b27','#69a23d'));
        ball(.12,j%3===0?material('#ffefd4','#ffffff'):material('#f8bdac','#f9e6d3'),xx,hh,zz,sceneRoot,10);
      }
    }
    function bunting(x,z,w=7){
      tube([x-w/2,3.2,z],[x+w/2,3.2,z],.018,material('#6e4726','#8c603b'));
      const bulbColors=[0xffc66e,0xe88c86,0x79c4c6,0xf3df8e,0x9fc78d];
      for(let i=0;i<10;i++){
        let xx=x-w/2+i*w/9;
        tube([xx,3.2,z],[xx,3.04-.08*Math.sin(i*.6),z],.012,wood);
        const light=new T.MeshStandardMaterial({color:bulbColors[i%5],emissive:bulbColors[i%5],emissiveIntensity:.65,roughness:.3});
        const b=ball(.105,light,xx,2.97-.08*Math.sin(i*.6),z,sceneRoot,10);b.castShadow=false;
      }
    }
    function roof(x,y,z,w,depth,color){
      const m=material(color,'#7a4327');
      const left=box(w*.56,.17,depth+.7,m,x-w*.22,y+.1,z);
      left.rotation.z=Math.PI*.13;
      const right=box(w*.56,.17,depth+.7,m,x+w*.22,y+.1,z);
      right.rotation.z=-Math.PI*.13;
    }
    function windows(x,y,z,cols=4,space=2.15){
      for(let i=0;i<cols;i++){
        const xx=x+(i-(cols-1)/2)*space;
        box(1.05,1.35,.15,material('#c79a5b','#d6b47f'),xx,y,z);
        box(.84,1.08,.16,material('#337ca5','#73b1c2'),xx,y,z+.065);
        box(.075,1.22,.20,wood,xx,y,z+.13);
        box(.95,.075,.20,wood,xx,y,z+.13);
        box(1.2,.1,.27,material('#6e4726','#9d6739'),xx,y-.75,z+.1);
      }
    }
    function building(type){
      const home=type===1;
      const bx=home?2.8:3.1,bz=home?-11:-11.4,bw=home?9:12;
      const warm=material(home?'#f2d6ae':'#ebb97c','#c98e58');
      box(bw,4.6,3.9,warm,bx,2.25,bz);
      roof(bx,4.72,bz,bw+1,4.2,home?'#b85d3b':'#9b4b30');
      windows(bx+(home?1.65:0),2.45,bz+2.04,home?2:4,home?2.25:2.2);
      const doorX=home?bx-2.3:bx-4.3;
      box(1.5,2.8,.21,material('#6e4726','#98613e'),doorX,1.42,bz+2.05);
      box(.14,2.9,.25,wood,doorX-.79,1.43,bz+2.1);
      box(.14,2.9,.25,wood,doorX+.79,1.43,bz+2.1);
      box(1.7,.18,.3,wood,doorX,2.9,bz+2.1);
      ball(.07,material('#e7c878','#ffed9d'),doorX+.52,1.45,bz+2.19);
      if(home){
        for(const xx of [bx-4.6,bx+4.7])cyl(.17,.18,2.65,wood,xx,1.37,bz+3.3);
        box(bw+1,.12,2.8,material('#d4a359','#b37d36'),bx,2.85,bz+3.0);
      }else{
        for(let i=0;i<5;i++)box(.28,.27,1.2,wood,bx-4+i*1.8,4.7,bz+1.5);
      }
      bunting(bx, bz+4.1, 7);
      flowerBed(bx-4.35,bz+3.3);flowerBed(bx+4.35,bz+3.25);
    }
    function bike(x,z){
      const black=material('#202e32','#40535a'),metal=material('#2d7dd2','#549ce5');
      for(let sign of [-1,1]){
        const w=torus(.55,.048,black,x+sign*.95,.55,z);
        w.rotation.y=Math.PI/2;
        for(let j=0;j<8;j++){
          let a=6.28*j/8;
          tube([x+sign*.95,.55,z],[x+sign*.95,.55+Math.cos(a)*.47,z+Math.sin(a)*.47],.012,metal);
        }
      }
      tube([x-.92,.55,z],[x+.15,1.30,z],.048,metal);
      tube([x+.15,1.30,z],[x+.92,.55,z],.048,metal);
      tube([x-.92,.55,z],[x+.92,.55,z],.038,metal);
      tube([x+.92,.55,z],[x+.86,1.48,z],.06,black);
      tube([x+.63,1.49,z],[x+1.05,1.49,z],.05,black);
      tube([x+.1,1.35,z],[x+.1,1.53,z],.06,black);
      box(.55,.09,.25,black,x+.05,1.55,z);const basket=material('#8c5828','#b48245');box(.64,.39,.38,basket,x-1.27,1.32,z+.04);for(let i=0;i<5;i++)box(.07,.29,.40,darkwood,x-1.51+i*.12,1.34,z+.04);
    }
    function parkFurniture(){
      const mat=material('#6e4726','#9c6934');
      for(const x of [-5.5,4.8]){
        box(2.4,.17,.67,mat,x,.68,-5.3);
        box(2.3,.85,.15,mat,x,1.2,-5.58);
        for(const s of [-.95,.95])box(.1,.72,.11,darkwood,x+s,.39,-5.4);
      }
      for(let x=-16;x<=16;x+=2.1){
        box(.19,1.2,.24,wood,x,.57,-13.9);
        box(2,.09,.21,wood,x,.78,-13.9);
      }
    }
    function makeSign(item){
      const group=new T.Group();group.position.set(item.x,0,item.z);sceneRoot.add(group);
      cyl(.095,.13,1.68,wood,0,.85,0,group);
      const plank=box(1.55,.58,.22,darkwood,0,1.87,0,group);
      plank.receiveShadow=true;
      box(1.45,.47,.06,material('#6e4726','#986239'),0,1.87,.125,group);
      for(const x of [-.58,.58])ball(.042,material('#e7c87a','#ffee9b'),x,1.87,.168,group,10);
      const ring=torus(.69,.075,new T.MeshStandardMaterial({color:0xffd879,emissive:0xf3c66d,emissiveIntensity:.9,transparent:true,opacity:.95,roughness:.3}),0,.15,0,group);
      ring.rotation.x=Math.PI/2;ring.castShadow=false;
      const inner=mesh(new T.CircleGeometry(.58,32),new T.MeshBasicMaterial({color:0xfff2b2,transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide}),0,.075,0,group,false);
      inner.rotation.x=-Math.PI/2;
      stageRings.push({ring,item});
    }
    function createGirl(type='narrator'){
 const g=new T.Group();g.userData={type,walkPhase:0};const isLi=type==='lihua';
 const skin=material('#ffe0bd','#f3b79e'),shirt=material('#ffffff','#d7e2e9'),skirt=material('#284b8a','#456dad'),hair=material('#3b2314','#65432c'),navy=material('#1e3f7a','#3a679b'),shoes=material('#272c34','#49505e'),socks=material('#fffdf6','#d7e1e7');
 cyl(.28,.32,.48,shirt,0,1.11,0,g,16);cyl(.14,.16,.11,skin,0,1.39,0,g);
 cyl(.29,.51,.48,skirt,0,.71,0,g,20);
 for(let j=0;j<10;j++){let a=j*2*Math.PI/10,o=box(.022,.255,.033,material('#1c3869','#34558e'),Math.cos(a)*.40,.66,Math.sin(a)*.40,g);o.rotation.y=-a;}
 g.userData.arms=[];g.userData.legs=[];
 for(let sign of [-1,1]){
  const leg=new T.Group();add(g,leg,sign*.19,.57,0);
  cyl(.093,.087,.4,skin,0,-.17,0,leg);cyl(.102,.10,.15,socks,0,-.37,0,leg);
  ball(.16,shoes,0,-.48,-.14,leg,16).scale.set(1.05,.63,1.30);g.userData.legs.push(leg);
  const arm=new T.Group();add(g,arm,sign*.35,1.29,0);
  ball(.18,shirt,0,-.075,0,arm,14).scale.set(.84,.77,.83);
  cyl(.09,.075,.38,skin,0,-.31,0,arm);ball(.088,skin,0,-.52,0,arm,12);
  arm.rotation.z=sign*.14;g.userData.arms.push(arm);
 }
 ball(.56,hair,0,1.81,.075,g,24).scale.set(1.07,1.06,.98);
 ball(.52,skin,0,1.82,-.085,g,28).scale.set(1.04,1.01,.93);
 for(let k=0;k<5;k++){let xx=(k-2)*.19,b=ball(.15,hair,xx,2.26,-.37,g,15);b.scale.set(.8,.95,.66);b.rotation.z=(k-2)*.15;}
 for(let side of [-1,1]){
  ball(.215,hair,side*.48,1.70,-.02,g,16).scale.set(.70,1.55,.86);
  ball(.20,hair,side*.48,1.42,.15,g,16).scale.set(.83,1.3,1.05);
  if(!isLi){ball(.23,hair,side*.36,1.46,.41,g,16).scale.set(.84,1.65,.73);let k=ball(.16,hair,side*.51,1.33,.39,g,12);k.rotation.z=side*.5;}
 }
 const eyes=new T.MeshPhysicalMaterial({color:0x10161e,roughness:.12,metalness:.05,clearcoat:1,clearcoatRoughness:.07});
 const glow=new T.MeshBasicMaterial({color:0xffffff}),blush=material('#ff9a8b','#ffb1a4');
 for(let side of [-1,1]){
  ball(.113,eyes,side*.217,1.89,-.539,g,18).scale.set(.83,1.24,.62);
  ball(.035,glow,side*.20,1.935,-.604,g,12);
  let brow=ball(.063,hair,side*.225,2.066,-.535,g,10);brow.scale.set(1.37,.21,.28);brow.rotation.z=-side*.12;
  ball(.105,blush,side*.363,1.69,-.489,g,16).scale.set(1.2,.48,.22);
  let wing=ball(.095,navy,side*.095,1.285,-.30,g,14);wing.scale.set(1.05,.7,.50);wing.rotation.z=side*.23;
 }
 ball(.065,material('#d9534f','#ec6f64'),0,1.63,-.566,g,16).scale.set(.83,.68,.38);
 ball(.041,navy,0,1.28,-.36,g);
 if(!isLi){
  const hat=material('#f7f1e3','#dbcbb1');
  cyl(.35,.46,.31,hat,0,2.45,0,g,28);
  let brim=cyl(.58,.565,.062,hat,0,2.30,0,g,32);brim.rotation.z=-.07;
  cyl(.405,.42,.047,material('#5b9bd5','#8dc0e6'),0,2.342,0,g,28);
  const bag=material('#d9c6a5','#bbaa89');box(.45,.48,.18,bag,0,1.04,.37,g);
  box(.29,.12,.042,material('#ad9674','#cfb890'),0,.91,.48,g);
  tube([-.20,1.29,.30],[-.23,.86,.38],.026,bag,g);tube([.20,1.29,.30],[.23,.86,.38],.026,bag,g);
 }else{
  ball(.21,hair,.41,2.06,.32,g,18).scale.set(.78,.8,1.02);
  ball(.30,hair,.50,1.88,.47,g,20).scale.set(.78,1.44,.84);
  ball(.20,hair,.54,1.60,.55,g,16).scale.set(.83,1.25,.79);
  ball(.15,material('#5b9bd5','#8cc2e8'),.39,2.11,.33,g,14).scale.set(.92,.55,.65);
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}
    function buildStage(index,items){
      scene.remove(sceneRoot);sceneRoot=new T.Group();scene.add(sceneRoot);
      idSeed=1013+index*733;activeGrass=null;grassInfo=[];stageRings=[];npcGirls=[];
      sky();makeTerrain(index);makeGrass();
      if(index===0){
        building(0);parkFurniture();bike(-5.7,-4.35);
        for(const [x,z,h] of [[-12,-4,6],[-10,-11,5.2],[11,-4.5,6.5],[13,5,6],[-12,7,7],[9,10,5.5],[-8,-16,6]])tree(x,z,h);
        const npc=createGirl('lihua');add(sceneRoot,npc,-5.05,.40,-3.30);npc.rotation.z=.96;npc.rotation.y=.25;npcGirls.push(npc);
      }else if(index===1){
        building(1);
        for(const [x,z,h] of [[-10,-4,6],[-11,7,5],[-8,-12,7],[12,-1,6.5],[12,9,6],[8,-15,5]])tree(x,z,h);
        flowerBed(-3.5,-7);flowerBed(6,-6);flowerBed(-6,-1);
        bunting(-4,-9,6);
        const npc=createGirl('lihua');add(sceneRoot,npc,.2,0,-6.6);npc.rotation.y=.15;npcGirls.push(npc);
      }else{
        building(0);
        for(const [x,z,h] of [[-11,2,6],[11,4,5.5],[-10,-13,5.7]])tree(x,z,h);
        box(3.6,2.4,.25,material('#fff5d0','#d9dbaf'),-1,1.6,-8.1);
        const npc=createGirl('lihua');add(sceneRoot,npc,1.5,0,-5.4);npcGirls.push(npc);
      }
      for(const item of items)makeSign(item);
      currentPlayer=createGirl('narrator');currentPlayer.scale.setScalar(1.09);sceneRoot.add(currentPlayer);
      sceneRoot.updateMatrixWorld(true);stage=index;cameraReady=false;
    }
    function updatePlayer(player,dt,moving){
      if(!currentPlayer)return;
      currentPlayer.position.set(player.x,0,player.z);
      const dx=player.x-(currentPlayer.userData.lastX??player.x),dz=player.z-(currentPlayer.userData.lastZ??player.z);
      if(Math.hypot(dx,dz)>.005){
        const want=Math.atan2(-dx,-dz);
        const diff=Math.atan2(Math.sin(want-currentPlayer.rotation.y),Math.cos(want-currentPlayer.rotation.y));
        currentPlayer.rotation.y+=diff*Math.min(1,dt*12);
      }
      else if(!moving){const want=2.52,diff=Math.atan2(Math.sin(want-currentPlayer.rotation.y),Math.cos(want-currentPlayer.rotation.y));currentPlayer.rotation.y+=diff*Math.min(1,dt*2.3);}
      currentPlayer.userData.lastX=player.x;currentPlayer.userData.lastZ=player.z;
      if(!currentPlayer.userData.arms)return;
      const ud=currentPlayer.userData;
      const movingAmt=moving?1:0;
      ud.walkPhase+=(moving?dt*11:dt*2);
      const swing=Math.sin(ud.walkPhase)*movingAmt;
      ud.legs.forEach((l,i)=>l.rotation.x=(i===0?1:-1)*swing*.44);
      ud.arms.forEach((a,i)=>a.rotation.x=(i===0?-1:1)*swing*.34);
      // Body bob is small, and all pieces remain a single coherent Three.Group.
      const base=moving?Math.abs(Math.sin(ud.walkPhase))*0.043:Math.sin(ud.walkPhase)*.013;
      currentPlayer.position.y=base;
    }
    function updateCamera(player,dt){
      const targetPos=new T.Vector3(player.x+1.1,3.52,player.z+6.9);
      if(!cameraReady){camera.position.copy(targetPos);cameraReady=true}
      const a=1-Math.exp(-dt*5.2);
      camera.position.lerp(targetPos,a);
      forwardPoint.set(player.x,.99,player.z-3.4);
      camera.lookAt(forwardPoint);
    }
    function animate(time,dt,index,items,player,moving,isLocked,isDone){
      if(index!==stage)buildStage(index,items);
      updatePlayer(player,dt,moving);
      updateCamera(player,dt);
      updateGrass(time);
      for(const r of stageRings){
        const done=isDone(r.item.id), locked=isLocked(r.item.id);
        const color=done?0x77c996:locked?0xabb6b5:0xffd177;
        r.ring.material.color.setHex(color);
        r.ring.material.emissive.setHex(color);
        r.ring.material.emissiveIntensity=done?.24:locked?.07:(.65+Math.sin(time*3+r.item.x)*.22);
        r.ring.rotation.z=Math.sin(time*1.1+r.item.x)*.02;
      }
      renderer.render(scene,camera);
    }
    function project(x,y,z){
      // Projection uses the real PerspectiveCamera matrix and visible DOM CSS dimensions.
      projected.set(x,y,z).project(camera);
      const inFront=projected.z>=-1&&projected.z<=1;
      if(!inFront||projected.x<-1.25||projected.x>1.25||projected.y<-1.28||projected.y>1.28)return null;
      const px=(projected.x*.5+.5)*width,py=(-projected.y*.5+.5)*height;
      return {x:px,y:py,d:projected.z,s:1/(Math.max(.03,projected.z+1))};
    }
    function resize(w,h){width=Math.max(1,w);height=Math.max(1,h);
      camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
    }
    // A subtle Canvas-generated canvas texture/Vignette overlay lives in existing #painterly DOM.
    function makeOverlay(){
      const el=document.getElementById('painterly');if(!el)return;
      const cn=document.createElement('canvas');cn.width=cn.height=512;
      const g=cn.getContext('2d');const rnd=makeRng(57288);
      g.clearRect(0,0,512,512);
      for(let i=0;i<1000;i++){
        let x=rnd()*512,y=rnd()*512;
        g.globalAlpha=.022+rnd()*.052;g.strokeStyle=i%3?'#f4ecd5':'#456b64';g.lineWidth=1+rnd()*2.7;
        g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x+5+rnd()*19,y+(rnd()-.5)*7);g.stroke();
      }
      g.globalAlpha=1;
      el.style.backgroundImage=`radial-gradient(ellipse at 50% 42%,transparent 18%,rgba(239,171,102,.035) 55%,rgba(68,62,43,.26) 100%),url("${cn.toDataURL('image/png')}")`;
      el.style.backgroundSize='100% 100%,512px 512px';
      el.style.mixBlendMode='multiply';el.style.opacity='.27';
    }
    makeOverlay();
    let filterOn=true;
    function toggleFilter(){filterOn=!filterOn;const el=document.getElementById('painterly');if(el)el.style.opacity=filterOn?'.27':'0';return filterOn;}
    function dispose(){renderer.dispose();}
    return {render:animate,resize,project,createPainterlyTexture,toggleFilter,dispose,get scene(){return scene},get camera(){return camera}};
  };
})(window);