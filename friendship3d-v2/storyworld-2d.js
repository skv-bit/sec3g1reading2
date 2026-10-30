/* 《手表》绘本式 2.5D 探索引擎
 * 真实插画场景 + 景深视差 + 点击线索 + 平滑镜头移动；不需要 WebGL 或 GLB。
 */
(function(){
"use strict";
class StoryWorld25D {
  constructor(canvas){
    this.isIllustrated=true;
    this.canvas=canvas;
    this.contextLost=false;
    this.gl={isContextLost:()=>false};
    this.level=1;
    this.hotspots=[];
    this.player={x:0,z:5.5,moving:false,face:0,bob:0};
    this.cursor={x:0,z:5.5};
    this.yaw=0;this.pitch=0;this.dist=1;this.time=0;
    this.keys=new Set();this.joy={x:0,y:0};
    this.onMove=()=>{};this.onInteract=()=>{};
    this.positions={
      1:{bike:{x:-4.6,z:1.4,y:0,s:1},watch:{x:4.2,z:1.4,y:0,s:1},lihua:{x:4.0,z:-4.5,y:0,s:1}},
      2:{mom:{x:-2.8,z:-.9,y:0,s:1},doorbell:{x:1.35,z:-4.8,y:0,s:1},lihua:{x:4.1,z:-3.6,y:0,s:1},evidence_station:{x:-5.2,z:2.2,y:0,s:1}}
    };
    // Scene image coordinates match artwork, not GLB world coordinates.
    this.anchors={
      1:{bike:[.456,.59],watch:[.682,.775],lihua:[.849,.526]},
      2:{mom:[.528,.585],doorbell:[.706,.369],lihua:[.854,.647],evidence_station:[.171,.57]}
    };
    this.scene=document.createElement('section');
    this.scene.id='storyStage';
    this.scene.setAttribute('aria-label','绘本式互动场景，直接点击发光线索开启阅读任务');
    this.picture=document.createElement('img');
    this.picture.className='story-art';
    this.picture.alt='《手表》第一关校园互动插画';
    this.picture.draggable=false;
    this.picture.src='assets/art/campus.webp';
    this.picture.decoding='async';
    this.scene.appendChild(this.picture);
    const sun=document.createElement('div');sun.className='story-sun';this.scene.appendChild(sun);
    const flourish=document.createElement('div');flourish.className='story-flourish';
    for(let k=0;k<16;k++){
      const particle=document.createElement('span');
      particle.style.setProperty('--left',((k*29+13)%97)+'%');
      particle.style.setProperty('--top',((k*43+9)%88)+'%');
      particle.style.setProperty('--delay',(-k*.63)+'s');
      particle.style.setProperty('--duration',(5+k%7)+'s');
      flourish.appendChild(particle);
    }
    this.scene.appendChild(flourish);
    this.marker=document.createElement('div');
    this.marker.className='story-marker';
    this.marker.innerHTML='<span class="marker-pulse"></span><span class="marker-symbol">✦</span><span class="marker-label">我的探索位置</span>';
    this.scene.appendChild(this.marker);
    this.caption=document.createElement('div');this.caption.id='sceneCaption';
    this.caption.innerHTML='<span class="caption-ornament">✿</span><div><strong>第一关 · 校园线索</strong><small>点击发光的线索，走进故事</small></div>';
    this.scene.appendChild(this.caption);
    canvas.insertAdjacentElement('afterend',this.scene);
    document.body.classList.add('illustrated-mode');
    this.loadReady={};
    this.panX=0;this.panY=0;this.mouseX=0;this.mouseY=0;
    this.picture.addEventListener('load',()=>{this.imageWidth=this.picture.naturalWidth||1672;this.imageHeight=this.picture.naturalHeight||941;});
    this.bindControls();
  }
  load(name){return Promise.resolve({name,illustrated:true})}
  setLevel(level){
    this.level=level;this.picture.src=level===1?'assets/art/campus.webp':'assets/art/home.webp';
    this.picture.alt=level===1?'温暖的校园，蓝色自行车、手表和丽华':'夕阳下的丽华家门前，妈妈、门铃、丽华和证据集合站';
    const title=level===1?'第一关 · 校园线索':'第二关 · 门前抉择';
    this.caption.querySelector('strong').textContent=title;
    this.caption.querySelector('small').textContent=level===1?'找依据 · 观察丽华的言行':'作推论 · 体会礼物背后的心意';
    this.player={x:0,z:5.5,moving:false,face:0,bob:0};
    this.cursor={x:0,z:5.5};this.resetCamera();
    this.scene.classList.toggle('level-two',level===2);
  }
  resetCamera(){
    this.yaw=0;this.pitch=0;this.dist=1;
    this.mouseX=this.mouseY=0;
    this.player.x=0;this.player.z=5.5;this.cursor.x=0;this.cursor.z=5.5;
    this.picture.style.transform='translate3d(0px,0px,0) scale(1.035)';
    this.moveMarker();
  }
  getNear(){
    const active=this.hotspots.find(h=>h.available&&!h.hidden);
    if(active)return {hotspot:active,dist:0};
    let first=this.hotspots.find(h=>!h.hidden);return {hotspot:first||null,dist:first?0:Infinity};
  }
  project(x,y,z){
    let name=Object.keys(this.positions[this.level]).find(k=>Math.abs(this.positions[this.level][k].x-x)<.05&&Math.abs(this.positions[this.level][k].z-z)<.05);
    if(!name)return null;
    const a=this.anchors[this.level][name];return this.pixel(a[0],a[1]);
  }
  pixel(xPercent,yPercent){
    const width=this.canvas.clientWidth||window.innerWidth;
    const height=this.canvas.clientHeight||window.innerHeight;
    const imageWidth=this.imageWidth||1672,imageHeight=this.imageHeight||941;
    const zoom=1.035;
    const scale=Math.max(width/imageWidth,height/imageHeight)*zoom;
    const w=imageWidth*scale,h=imageHeight*scale;
    return{x:width/2+(xPercent-.5)*w+this.panX,y:height/2+(yPercent-.5)*h+this.panY};
  }
  moveMarker(){
    const x=.53+this.player.x*.018;
    const y=.81+this.player.z*.004;
    const p=this.pixel(Math.min(.78,Math.max(.28,x)),Math.min(.90,Math.max(.71,y)));
    this.marker.style.transform='translate3d('+(p.x-16)+'px,'+(p.y-16)+'px,0)';
    this.marker.classList.toggle('is-walking',this.player.moving);
  }
  travelTo(h,callback){
    const p=this.positions[this.level][h.hotspotId];
    if(!p){callback?.();return}
    this.player.moving=true;
    this.marker.classList.add('is-travelling');
    this.player.x=p.x;this.player.z=p.z;
    this.cursor.x=p.x;this.cursor.z=p.z;
    this.moveMarker();
    const anchor=this.anchors[this.level][h.hotspotId];
    // Subtle camera drift without losing the important scene.
    this.mouseX=-(anchor[0]-.5)*18;
    this.mouseY=-(anchor[1]-.5)*12;
    this.render(performance.now());
    setTimeout(()=>{
      this.player.moving=false;
      this.marker.classList.remove('is-travelling');
      this.moveMarker();
      callback?.();
    },550);
  }
  update(dt,allow){
    if(!allow){this.player.moving=false;return}
    let x=0,z=0,k=this.keys;
    if(k.has('KeyW')||k.has('ArrowUp'))z-=1;
    if(k.has('KeyS')||k.has('ArrowDown'))z+=1;
    if(k.has('KeyA')||k.has('ArrowLeft'))x-=1;
    if(k.has('KeyD')||k.has('ArrowRight'))x+=1;
    x+=this.joy.x;z+=this.joy.y;
    let d=Math.hypot(x,z);this.player.moving=d>.05;
    if(d>.05){
      let speed=(k.has('ShiftLeft')||k.has('ShiftRight'))?4.8:2.7;
      this.player.x=Math.min(8,Math.max(-8,this.player.x+x/Math.max(1,d)*dt*speed));
      this.player.z=Math.min(8,Math.max(-8,this.player.z+z/Math.max(1,d)*dt*speed));
      this.player.bob+=dt*10;
    }
    this.cursor.x+=(this.player.x-this.cursor.x)*Math.min(1,dt*7);
    this.cursor.z+=(this.player.z-this.cursor.z)*Math.min(1,dt*7);
    this.onMove?.(this.player);
  }
  render(now){
    this.time=now/1000;
    const targetX=this.mouseX-this.cursor.x*1.9;
    const targetY=this.mouseY+(this.cursor.z-5.5)*.7;
    this.panX+=(targetX-this.panX)*.055;
    this.panY+=(targetY-this.panY)*.055;
    this.picture.style.transform='translate3d('+this.panX.toFixed(1)+'px,'+this.panY.toFixed(1)+'px,0) scale(1.035)';
    this.moveMarker();
  }
  bindControls(){
    window.addEventListener('keydown',e=>{
      if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
      this.keys.add(e.code);
      if(e.code==='KeyE'&&!e.repeat)this.onInteract?.();
      if(e.code==='KeyR'&&!e.repeat)this.resetCamera();
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.keys.clear());
    this.scene.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch')return;
      this.mouseX=((e.clientX/window.innerWidth)-.5)*-9;
      this.mouseY=((e.clientY/window.innerHeight)-.5)*-6;
    });
    const stick=document.getElementById('joystick');
    if(stick){
      let active=false;
      stick.addEventListener('pointerdown',e=>{active=true;stick.setPointerCapture?.(e.pointerId)});
      stick.addEventListener('pointermove',e=>{
        if(!active)return;
        const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.42),dy=(e.clientY-r.top-r.height/2)/(r.height*.42);
        this.joy={x:Math.max(-1,Math.min(1,dx)),y:Math.max(-1,Math.min(1,dy))};
        stick.querySelector('.thumb').style.transform='translate('+(this.joy.x*31)+'px,'+(this.joy.y*31)+'px)';
      });
      const end=()=>{active=false;this.joy={x:0,y:0};stick.querySelector('.thumb').style.transform=''};
      stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
    }
  }
}
window.World25D=StoryWorld25D;
})();