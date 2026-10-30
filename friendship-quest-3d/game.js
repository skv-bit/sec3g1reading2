import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

/* 光之线索：从零编写的原创 Three.js 互动阅读游戏。
 * 场景和Q版角色全部由实时三维几何体组成，没有加载旧游戏代码、贴图背景或外来游戏模型。
 * 若将来需要更精细角色，可在不改变任务系统的情况下替换程序化角色。
 */
const $ = (id) => document.getElementById(id);
const WORDS = {
  "推":["tuī","用手让别人或东西离开原来的位置。","push"],
  "摔倒":["shuāi dǎo","跌倒在地上。","fall down"],
  "擦伤":["cā shāng","皮肤擦破，受了小伤。","graze"],
  "纱布":["shā bù","包扎伤口用的布。","gauze"],
  "珍惜":["zhēn xī","觉得重要，所以很在乎。","cherish"],
  "心意":["xīn yì","希望别人明白的真诚心情。","thoughtfulness"],
  "犹豫":["yóu yù","想做一件事，但又有些担心。","hesitate"],
  "体谅":["tǐ liàng","站在别人的角度，理解感受。","be considerate"]
};
const TASKS = [
  {id:"bike",level:1,icon:"🚲",name:"蓝色脚踏车",title:"线索一｜危险时刻",para:"第3段",quote:"丽华连忙推开我，结果自己却摔倒在地上。她擦伤了手臂，我反而没事。",words:["推","摔倒","擦伤"],steps:[
    {type:"single",q:"为什么丽华突然推开“我”？",options:["她想跟“我”开玩笑。","她想让“我”避开冲来的脚踏车。","她不愿意跟“我”做朋友。"],correct:[1],hint:"看看脚踏车冲向谁，谁又因此受伤。",success:"你找到第一处动作证据：丽华先想到朋友的安全。"}
  ]},
  {id:"watch",level:1,icon:"⌚",name:"手表",title:"线索二｜一份特别的礼物",para:"第1段",quote:"我把叔叔给我的名贵手表转送给丽华，妈妈知道了很生气。",words:["珍惜"],steps:[
    {type:"single",q:"根据第1段，这只手表原来是谁送给“我”的？",options:["妈妈","叔叔","丽华"],correct:[1],hint:"再读第1段的“叔叔给我的名贵手表”。",success:"你认出了关键物品。它承载的心意，会在第二关揭晓。"}
  ]},
  {id:"lihua",level:1,icon:"🌸",name:"丽华",title:"线索三｜受伤后的关心",para:"第3–4段",quote:"丽华手臂缠着纱布走进教室。……她却关心地问我：“你没事吧？”",words:["纱布"],steps:[
    {type:"multi",q:"哪两处言行能够证明丽华关心朋友？（选出2项）",options:["她推开“我”，自己却摔倒受伤。","她要求“我”把手表换回来。","她受伤后仍先问“我”有没有事。"],correct:[0,2],hint:"回想脚踏车事件，再看看第二天丽华说的话。",success:"两处证据相互支持：丽华善良，也会替朋友着想。"},
    {type:"word",q:"从丽华的这些言行，可以看出她是一个怎样的人？",options:["关心朋友","只顾自己","嫉妒朋友"],correct:[0],hint:"她虽然自己受伤，却仍先关心“我”。",success:"找依据 → 作推论：你掌握了第一把阅读钥匙。"}
  ]},
  {id:"mom",level:2,icon:"👩",name:"妈妈 · 回忆向导",title:"任务四｜手表背后的心意",para:"第5–6段",quote:"丽华说她要随父母移居海外，我非常难过。我想送她一份珍贵的礼物……最后选择了叔叔给我的那只手表。",words:["珍惜","心意"],steps:[
    {type:"single",q:"“我”为什么把名贵手表送给丽华？",options:["想炫耀自己有名贵手表。","很珍惜与丽华的友谊，想送她珍贵的礼物。","因为丽华要求“我”这样做。"],correct:[1],hint:"第5段先告诉我们丽华即将离开，“我”非常难过。",success:"你从送礼物的选择推论出“我”珍惜友谊。"},
    {type:"single",q:"妈妈要求“我”怎样做？“我”的反应是什么？",options:["妈妈要求换回手表；“我”不愿意，却还是照做。","妈妈亲自带着“我”去找丽华。","妈妈请丽华再送一块手表。"],correct:[0],hint:"根据第6段明写的事情判断，别添加故事里没有的情节。",success:"你区分了课文事实和没有依据的猜测。"}
  ]},
  {id:"bell",level:2,icon:"🔔",name:"发光门铃",title:"任务五｜门前的犹豫",para:"第7段",quote:"我犹豫了，几次伸手要去按门铃，几次又把手缩了回来。我心想：她会生气吗？我会不会失去这个朋友？",words:["犹豫"],steps:[
    {type:"single",q:"“我”为什么几次伸手，又把手缩回来？",options:["“我”忘记了门铃的位置。","“我”担心丽华生气，害怕失去朋友。","“我”不记得丽华家的地址。"],correct:[1],hint:"注意“她会生气吗？我会不会失去这个朋友？”",success:"你通过动作和内心想法，推论人物的担心与愧疚。"}
  ]},
  {id:"lihua2",level:2,icon:"💬",name:"丽华的回应",title:"任务六｜动作与语言",para:"第8段",quote:"她把表还给我，拍拍我的肩膀，对我说：“礼物是一份心意，只要是你送的，我都喜欢。我们永远是最好的朋友！”",words:["体谅","心意"],steps:[
    {type:"categorize",q:"把线索分为“动作”“语言”，还有一项不是丽华做的。",cards:[
      "把手表还给“我”，还拍拍“我”的肩膀。",
      "“我”几次伸手，又把手缩回来。",
      "说：“礼物是一份心意，只要是你送的，我都喜欢。”"
    ],buckets:["动作","语言","不是丽华的言行"],correct:[0,2,1],hint:"注意第7段按门铃的是“我”；第8段谁归还手表、谁说话？",success:"你成功区分动作与语言，也区分了两个人物。"}
  ]},
  {id:"station",level:2,icon:"🔎",name:"证据集合站",title:"最终任务｜理解真正的友谊",para:"第3–4、8–9段",quote:"丽华救“我”时受伤，第二天仍关心“我”；后来又归还手表，告诉“我”：“礼物是一份心意。”",words:["体谅","珍惜","心意"],steps:[
    {type:"single",q:"综合前后的证据，可以看出丽华是怎样的人？",options:["她友善、无私，懂得体谅朋友。","她只在乎手表贵不贵。","她因为害怕妈妈才归还手表。"],correct:[0],hint:"她先在意朋友的安全，最后又重视礼物背后的心意。",success:"你把不同段落的证据连起来，作出了有依据的推论。"},
    {type:"journal",q:"写下你的侦探笔记：丽华怎样对待朋友？为什么“我”感动得流泪？"}
  ]}
];
const TASK_BY_ID = Object.fromEntries(TASKS.map((t)=>[t.id,t]));
const DEFAULT_SAVE = {alias:"小侦探",classCode:"",done:[],answers:{},attempts:{},hints:{},draft:"",revision:"",support:1,selfChecks:[],lifeResponse:"",createdAt:new Date().toISOString()};
let save;
try {save = {...DEFAULT_SAVE,...JSON.parse(localStorage.getItem("handwatch-original-3d-v1")||"{}")};}
catch {save={...DEFAULT_SAVE};}
const persist = () => {try{localStorage.setItem("handwatch-original-3d-v1",JSON.stringify(save));}catch(e){console.warn(e);}};
let activeTask=null,stepIndex=0,selected=[],assignments={},pickedCard=null,feedback="",answered=false,hintLevel=0;
let level=1,playing=false,paused=false,isAudio=false,ctx=null,ambience=[];
const keys={},touchKeys={};let yaw=0,pitch=.35,camDist=10,orbiting=false,previousPointer={x:0,y:0},toastTimer;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa8d5c3);scene.fog=new THREE.Fog(0xa8d5c3,20,66);
const renderer=new THREE.WebGLRenderer({canvas:$("world"),antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
const camera=new THREE.PerspectiveCamera(54,1,.1,120);camera.position.set(0,5,12);
const hemi=new THREE.HemisphereLight(0xffffff,0x83b2a2,2.3);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe4ae,3.1);sun.position.set(-10,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;sun.shadow.bias=-.0002;scene.add(sun);
let world=null,avatar=null,markers=[],targets=[],colliders=[],npcs=[],effects=[],evidenceModel=null;
const mat=(color,rough=.96,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const M={grass:mat(0x91bd91),lawn:mat(0xa9cf9d),path:mat(0xf2d9b6),stone:mat(0xeacda9),wood:mat(0xa97052),woodLite:mat(0xd29f72),brick:mat(0xe9bda2),wall:mat(0xffe8c5),white:mat(0xfffaf0),blue:mat(0x80b9d4),skyblue:mat(0xa9d9ed),navy:mat(0x516d93),pink:mat(0xe9abb0),skin:mat(0xffd4ae),hair:mat(0x50372e),leaf:mat(0x73ac76),leaf2:mat(0x8fc58b),flower:mat(0xfffbec),yellow:mat(0xf3ca79),deep:mat(0x4a655a),dark:mat(0x2f393d),gold:mat(0xecc274,.35,.25)};
function mesh(geo,material,parent=world){const o=new THREE.Mesh(geo,material);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cube(w,h,d,x,y,z,material,parent=world){const m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m;}
function ball(r,x,y,z,material,parent=world,w=12,h=10){const m=mesh(new THREE.SphereGeometry(r,w,h),material,parent);m.position.set(x,y,z);return m;}
function cone(r,h,x,y,z,material,parent=world,sides=10){const o=mesh(new THREE.ConeGeometry(r,h,sides),material,parent);o.position.set(x,y,z);return o;}
function cyl(r,height,x,y,z,material,parent=world,segments=12){const o=mesh(new THREE.CylinderGeometry(r,r,height,segments),material,parent);o.position.set(x,y,z);return o;}
function rod(a,b,r,material,parent=world){const dir=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));const o=mesh(new THREE.CylinderGeometry(r,r,dir.length(),10),material,parent);o.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return o;}
function planeText(text,w=2.5,h=.6,fg="#35634e",bg="#fff7e5"){const c=document.createElement("canvas");c.width=512;c.height=128;const x=c.getContext("2d");x.fillStyle=bg;x.fillRect(0,0,512,128);x.fillStyle=fg;x.font="bold 52px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(text,256,67);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));return o;}
function tree(x,z,scale=1){cyl(.19*scale,2.1*scale,x,1*scale,z,M.wood);for(let i=0;i<5;i++){const a=i*2.4;const r=.83*scale;ball(r,x+Math.sin(a)*.49*scale,2.18*scale+(i%2)*.25*scale,z+Math.cos(a)*.4*scale,i%2?M.leaf:M.leaf2);}}
function flower(x,z,color=M.flower){cyl(.037,.16,x,.08,z,M.leaf);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(.082,x+Math.cos(a)*.1,.22,z+Math.sin(a)*.1,color);}ball(.06,x,.23,z,M.yellow);}
function plantPatch(x,z,size=1){ball(.3*size,x,.33*size,z,M.leaf);ball(.27*size,x+.24*size,.27*size,z+.10*size,M.leaf2);ball(.29*size,x-.17*size,.25*size,z-.1*size,M.leaf);}
function bench(x,z){cube(2.7,.14,.62,x,.62,z,M.woodLite);for(const dx of [-1,1])cube(.12,.62,.13,x+dx,.28,z,M.wood);cube(2.7,.66,.12,x,.95,z-.3,M.wood);}
function fence(){for(let x=-19;x<=19;x+=1.9){cube(.16,1.4,.18,x,.7,-16,M.white);cube(.16,1.4,.18,x,.7,17,M.white);}for(let z=-16;z<=17;z+=1.9){cube(.16,1.4,.18,-19,.7,z,M.white);cube(.16,1.4,.18,19,.7,z,M.white);}for(let z of [-16,17]){cube(38,.12,.12,0,.65,z,M.woodLite);cube(38,.12,.12,0,1.15,z,M.woodLite);}for(let x of [-19,19]){cube(.13,.12,33,x,.65,.5,M.woodLite);cube(.13,.12,33,x,1.15,.5,M.woodLite);}}
function lightPost(x,z){cyl(.07,2.4,x,1.2,z,M.deep);ball(.23,x,2.5,z,M.yellow);cone(.29,.23,x,2.77,z,M.deep);}
function cobbles(){for(let z=-13;z<=15;z+=1.7){for(let x=-4;x<=4;x+=1.65){const t=cube(1.52,.065,1.5,x,.035,z,Math.sin(x+z)>0?M.path:M.stone);t.rotation.y=Math.sin(x*3+z)*.027;}}}
function makeGround(){cube(40,.35,36,0,-.19,0,M.grass);cobbles();fence();}
function houseBuilding(){cube(22,5.4,5.2,0,2.7,-13.5,M.wall);const roof=cone(14,3.2,0,6.7,-13.5,M.brick);roof.rotation.y=Math.PI/4;cube(4.3,4.5,.2,2,2.3,-10.83,M.wood);cube(2.2,2.6,.2,-7,3,-10.77,M.blue);cube(2.2,2.6,.2,8,3,-10.77,M.blue);cube(2.35,.10,.35,-7,3,-10.55,M.white);cube(.10,2.6,.35,-7,3,-10.55,M.white);cube(2.35,.10,.35,8,3,-10.55,M.white);cube(.10,2.6,.35,8,3,-10.55,M.white);const sign=planeText("丽 华 家",3.4,.8);sign.position.set(2,5,-10.68);world.add(sign);cube(5.3,.35,2.4,1.9,.14,-9.4,M.stone);lightPost(-10,-10);lightPost(11,-10);for(let i=0;i<13;i++)plantPatch(-14+i*2.3,-10.3,.65);}
function schoolBuilding(){cube(25,7.1,4.5,0,3.55,-14.3,M.wall);cube(26,.5,5.2,0,7.3,-14.3,M.brick);cube(4.3,2.2,.45,0,1.25,-11.75,M.wood);cube(4.3,.2,.4,0,2.52,-11.7,M.white);for(let x=-10;x<=10;x+=4){if(Math.abs(x)<1)continue;for(let y of [2.5,5.1]){cube(2.2,1.35,.12,x,y,-11.98,M.blue);cube(.13,1.5,.15,x,y,-11.89,M.white);cube(2.4,.13,.15,x,y,-11.88,M.white);}}cube(5.8,1.6,3,0,8.3,-14.3,M.white);const t=planeText("友 谊 校 园",6.2,1);t.position.set(0,8.5,-12.68);world.add(t);cube(1,9,1,-14,4,-12,M.brick);cube(1,9,1,14,4,-12,M.brick);cube(1.4,.26,2,-14,8.4,-12,M.white);cube(1.4,.26,2,14,8.4,-12,M.white);}
function makeBike(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const wheel=mat(0x3f4846);for(const wx of [-.82,.82]){const tyre=new THREE.Mesh(new THREE.TorusGeometry(.47,.075,11,25),wheel);tyre.position.set(wx,.55,0);g.add(tyre);const axle=ball(.12,wx,.55,0,M.deep,g);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([wx,.55,0],[wx+Math.cos(a)*.39,.55+Math.sin(a)*.39,0],.014,M.white,g);}}rod([-.82,.55,0],[-.14,1.25,0],.07,M.blue,g);rod([-.14,1.25,0],[.25,.59,0],.07,M.blue,g);rod([-.82,.55,0],[.25,.59,0],.07,M.blue,g);rod([.25,.59,0],[.82,.55,0],.07,M.blue,g);rod([.25,.59,0],[-.14,1.25,0],.07,M.blue,g);rod([-.14,1.25,0],[-.14,1.46,0],.06,M.deep,g);cube(.58,.14,.29,-.3,1.5,0,M.wood,g);rod([.82,.55,0],[.66,1.6,0],.06,M.deep,g);rod([.36,1.62,0],[.99,1.62,0],.046,M.wood,g);cube(.55,.37,.45,.87,1.37,.08,M.woodLite,g);g.rotation.y=.18;return g;}
function makeWatch(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);cyl(.91,.35,0,.25,0,M.woodLite,g);const w=new THREE.Group();g.add(w);w.position.set(0,.72,0);w.rotation.x=-.25;const rim=new THREE.Mesh(new THREE.TorusGeometry(.34,.085,16,32),M.gold);w.add(rim);const dial=mesh(new THREE.CylinderGeometry(.31,.31,.055,28),M.white,w);dial.rotation.x=Math.PI/2;rod([0,0,.07],[.1,.16,.07],.014,M.deep,w);rod([0,0,.08],[-.14,-.045,.08],.014,M.deep,w);cube(.46,.48,.08,0,.49,0,M.blue,w);cube(.46,.48,.08,0,-.49,0,M.blue,w);return g;}
function makeEvidence(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);cube(3.3,.19,1.6,0,1,0,M.woodLite,g);for(const a of [-1.42,1.42])for(const b of [-.65,.65])cube(.15,1,.15,a,.5,b,M.wood,g);cube(3.3,1.65,.22,0,2.0,-.55,M.wood,g);cube(3.05,1.39,.06,0,2,-.39,M.stone,g);for(let i=0;i<3;i++){cube(.73,.81,.055,-1+i,.0+2.0,-.35,i===0?M.blue:i===1?M.pink:M.white,g);}const label=planeText("证 据 集 合 站",3.7,.65);label.position.set(0,3.05,-.30);g.add(label);ball(.12,-.36,1.22,.18,M.gold,g);cyl(.19,.12,.56,1.18,.20,M.white,g);return g;}
function makeBell(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);cube(.67,1.05,.24,0,1.5,0,M.woodLite,g);const c=cyl(.27,.10,0,1.47,.16,M.yellow,g);c.rotation.x=Math.PI/2;ball(.115,0,1.45,.225,M.white,g);return g;}
function makeChibi(kind="girl"){const root=new THREE.Group();const body=new THREE.Group();root.add(body);
 const mom=kind==="mom",lihua=kind==="lihua";const height=mom?1.1:1;const skin=mat(0xffd1ae),eyes=mat(0x27282a,.35),hair=mat(mom?0x6b4839:0x49342e),white=mat(0xfff8ed),navy=mat(0x4e6791),blue=mat(0x83b8de),pink=mat(0xf2b2ad);
 const torso=ball(mom?.43:.35,0,1.04,0,mom?M.woodLite:white,body);torso.scale.set(1,1.2,.75);
 const skirt=cone(mom?.57:.53,.65,0,.57,0,mom?M.wood:navy,body);skirt.rotation.z=Math.PI;
 const neck=cyl(.13,.23,0,1.35,.03,skin,body);
 const head=ball(mom?.51:.49,0,1.82,0,skin,body);head.scale.set(1.05,1.08,.91);
 ball(.53,0,1.93,-.20,hair,body).scale.set(1,1.10,.82);
 for (const xx of [-.19,.19]){ball(.065,xx,1.84,.425,eyes,body).scale.set(.87,1.25,.6);ball(.025,xx-.01,1.87,.475,white,body);}
 ball(.06,0,1.71,.46,pink,body).scale.set(1,.30,.38);
 for (const xx of [-.28,.28])ball(.12,xx,1.68,.37,pink,body).scale.set(1,.35,.5);
 for(let i=0;i<5;i++){ball(.13,-.3+i*.15,2.13,.24,hair,body).scale.set(.8,.95,.65);}
 if(kind==="girl"){const brim=cyl(.64,.09,0,2.32,0,white,body,30);brim.scale.set(1,.55,1);const cap=ball(.49,0,2.46,0,white,body);cap.scale.set(1,.61,1);ball(.30,0,2.1,-.43,hair,body).scale.set(1.2,1.8,.65);}
 if(lihua){ball(.32,.43,2.06,-.32,hair,body).scale.set(.68,1.7,.77);ball(.17,.34,2.19,-.25,blue,body);ball(.17,.44,1.67,-.43,hair,body);}
 if(mom){ball(.38,-.12,2.05,-.28,hair,body).scale.set(1,.88,.73);}
 if(!mom){ball(.15,0,1.29,.28,navy,body);cone(.14,.32,-.12,1.14,.28,navy,body).rotation.z=.6;cone(.14,.32,.12,1.14,.28,navy,body).rotation.z=-.6;}
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.36,1.29,0);body.add(arm);ball(.13,0,-.14,0,mom?M.woodLite:white,arm).scale.set(1,1.7,1);ball(.115,0,-.47,.01,skin,arm);if(lihua&&side===-1){const gauze=cyl(.141,.31,0,-.35,.015,M.white,arm,16);gauze.rotation.z=0;for(let k=0;k<3;k++)ball(.017,.125,-.47+k*.10,.085,M.stone,arm);}arm.rotation.z=-side*.18;arms.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.18,.45,0);body.add(leg);cube(.16,.37,.17,0,-.19,0,skin,leg);cube(.18,.20,.19,0,-.35,0,white,leg);ball(.17,0,-.46,.12,M.navy,leg).scale.set(.9,.62,1.28);legs.push(leg);
 }
 root.userData={arms,legs,body};root.scale.setScalar(height);return root;}
function addDecor(){const positions=[[-16,-11],[-17,9],[-12,12],[15,11],[16,-10],[-14,-2],[12,-2]];for(const [x,z] of positions)tree(x,z,.85+(Math.abs(x)%4)*.07);for(let i=0;i<50;i++){const x=-18+(i*13.73)%36,z=-14+(i*7.31)%29;if(Math.abs(x)<6&&z>-10)continue;if(i%3===0)plantPatch(x,z,.55);else flower(x,z,i%2?M.pink:M.flower);}}
function campus(){schoolBuilding();bench(8,-4);bench(-7,2);bench(11,7);addDecor();for(let i=0;i<8;i++)plantPatch(-12+i*.45,-3,.62);lightPost(-5,-8);lightPost(5,-8);colliders.push({x1:-13,x2:13,z1:-17,z2:-11.9});}
function courtyard(){houseBuilding();bench(-10,4);evidenceModel=makeEvidence(10,3);addDecor();for(let i=0;i<12;i++)flower(-13+i*.5,-7,M.pink);colliders.push({x1:-11,x2:11,z1:-17,z2:-10.95});colliders.push({x1:8.2,x2:11.7,z1:1.8,z2:4});}
function addHotspot(task,point,object){const ring=new THREE.Mesh(new THREE.TorusGeometry(.86,.045,8,52),new THREE.MeshBasicMaterial({color:0xffdb83,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;ring.position.set(point[0],.13,point[2]);world.add(ring);
 const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.12,.34,1,12,1,true),new THREE.MeshBasicMaterial({color:0xf5cb6c,transparent:true,opacity:.11,depthWrite:false}));pillar.position.set(point[0],.53,point[2]);world.add(pillar);
 const btn=document.createElement("button");btn.className="marker";btn.type="button";btn.innerHTML=task.icon+" "+task.name;btn.setAttribute("aria-label","调查"+task.name);btn.addEventListener("click",()=>openTask(task.id));$("markers").append(btn);
 const target={task,point:new THREE.Vector3(...point),ring,pillar,button:btn,obj:object};targets.push(target);markers.push(btn);
 if(object)object.traverse(o=>{if(o.isMesh)o.userData.hotspot=task.id;});
}
function setupLevel(next){if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose();});}for(const b of markers)b.remove();targets=[];markers=[];colliders=[];npcs=[];effects=[];world=new THREE.Group();scene.add(world);makeGround();level=next;const first=next===1;
 scene.background=new THREE.Color(first?0xb9e2cc:0xe9bdab);scene.fog.color.set(first?0xb9e2cc:0xe9bdab);
 sun.color.set(first?0xfff1ce:0xffc89e);sun.position.set(first?-10:-13,25,14);
 if(first){campus();const bike=makeBike(-10,0);const watch=makeWatch(.5,1);const n=makeChibi("lihua");n.position.set(10,0,-5);world.add(n);npcs.push(n);
  addHotspot(TASKS[0],[-10,0,0],bike);addHotspot(TASKS[1],[.5,0,1],watch);addHotspot(TASKS[2],[10,0,-5],n);
 }else{courtyard();const mom=makeChibi("mom");mom.position.set(-9,0,-5);world.add(mom);npcs.push(mom);const bell=makeBell(3,-10.2);const lihua=makeChibi("lihua");lihua.position.set(7,0,-9.8);world.add(lihua);npcs.push(lihua);
  addHotspot(TASKS[3],[-9,0,-5],mom);addHotspot(TASKS[4],[3,0,-10.2],bell);addHotspot(TASKS[5],[7,0,-9.8],lihua);addHotspot(TASKS[6],[10,0,3],evidenceModel);
 }
 if(!avatar){avatar=makeChibi("girl");scene.add(avatar);}avatar.position.set(0,0,13);avatar.rotation.y=Math.PI;yaw=0;
 $("phase").textContent=first?"I DO · 校园线索":"WE DO · 门前抉择";updateQuest();notify(first?"第一关：沿路寻找发光的故事线索。":"第二关：来到丽华家，理解友情背后的心意。");}
function currentIndex(){return TASKS.findIndex(t=>!save.done.includes(t.id));}
function currentTask(){const i=currentIndex();return i<0?null:TASKS[i];}
function doneLevel1(){return TASKS.filter(t=>t.level===1).every(t=>save.done.includes(t.id));}
function updateQuest(){const tasks=TASKS.filter(t=>t.level===level),cur=currentTask();$("taskList").innerHTML="";
 for(const t of tasks){const div=document.createElement("div");const done=save.done.includes(t.id),current=cur&&cur.id===t.id;div.className="task-row"+(done?" done":current?" current":"");const mark=document.createElement("span");mark.className="task-mark";mark.textContent=done?"✓":current?"✦":"○";div.append(mark,document.createTextNode(t.name));$("taskList").append(div);}
 $("questTitle").textContent=cur&&cur.level===level?"下一处线索："+cur.name:level===1&&doneLevel1()?"校园探索完成！":currentIndex()<0?"所有任务完成！":"沿着发光路线继续";
 $("questText").textContent=cur&&cur.level===level?"靠近它，点击发光标记或者按 E。":"这一关已经完成，可以进入下一阶段。";
 $("progressBar").style.width=(save.done.length/TASKS.length*100)+"%";$("progressLabel").textContent=save.done.length+" / "+TASKS.length;
 $("switchBtn").hidden=!(level===1&&doneLevel1());
 for(const t of targets){const done=save.done.includes(t.task.id),current=cur?.id===t.task.id;t.button.className="marker "+(done?"done":current?"current":"locked");t.button.innerHTML=(done?"✓ ":current?"✦ ":"🔒 ")+t.task.name;t.ring.material.color.set(done?0x87dcc0:current?0xffcd65:0xbbbbac);t.ring.material.opacity=current?.88:.5;}}
function notify(s){$("toast").textContent=s;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),3500);}
function openTask(id){if(!playing||paused)return;const t=TASK_BY_ID[id],current=currentTask();if(!t||t.level!==level)return;
 if(!save.done.includes(id)&&current?.id!==id){notify("还没解锁！先完成“"+(current?.name||"当前任务")+"”。");return;}
 const point=targets.find(x=>x.task.id===id)?.point;if(point&&avatar.position.distanceTo(point)>3.7){notify("再靠近一点“"+t.name+"”，就可以调查。");return;}
 activeTask=t;stepIndex=0;selected=[];assignments={};pickedCard=null;feedback="";answered=false;hintLevel=0;paused=true;$("dialog").classList.remove("hidden");renderDialog();tone(660,.10);}
function closeTask(){activeTask=null;paused=false;$("dialog").classList.add("hidden");}
function currentStep(){return activeTask?.steps[stepIndex];}
function renderDialog(){if(!activeTask)return;const t=activeTask,st=currentStep();$("dialogTag").textContent=(level===1?"I DO · 教师示范":"WE DO · 一起思考")+" · "+t.para+" · "+(stepIndex+1)+"/"+t.steps.length;
 $("dialogTitle").textContent=t.title;const body=$("dialogBody");body.innerHTML="";const src=document.createElement("div");src.className="source";const small=document.createElement("small");small.textContent="📖 课文依据 · "+t.para;src.append(small,document.createTextNode(t.quote));body.append(src);
 const word=Object.entries(WORDS).filter(([w])=>t.words.includes(w));if(word.length){const details=document.createElement("details");details.className="assistance";const sum=document.createElement("summary");sum.textContent="词语提示 · 拼音 / 浅白解释 / English";details.append(sum);for(const [w,info] of word){const el=document.createElement("div");el.textContent=w+"（"+info[0]+"）— "+info[1]+" / "+info[2];details.append(el);}body.append(details);}
 const q=document.createElement("div");q.className="question";q.textContent=st.q;body.append(q);
 if(st.type==="single"||st.type==="multi"||st.type==="word"){const group=document.createElement("div");group.className=st.type==="word"?"tags":"answers";st.options.forEach((opt,i)=>{const b=document.createElement("button");b.type="button";b.className=(st.type==="word"?"wordchip":"answer")+(selected.includes(i)?" selected":"");b.textContent=(st.type==="word"?"":String.fromCharCode(65+i)+".  ")+opt;
 b.addEventListener("click",()=>{if(answered)return;selected=st.type==="multi"?(selected.includes(i)?selected.filter(x=>x!==i):[...selected,i]):[i];renderDialog();});group.append(b);});body.append(group);}
 if(st.type==="categorize"){const intro=document.createElement("div");intro.className="small";intro.textContent="先点击线索卡，再点击下方分类框；也支持直接拖拽。";body.append(intro);const group=document.createElement("div");group.className="answers";st.cards.forEach((card,i)=>{if(assignments[i]!==undefined)return;const b=document.createElement("button");b.type="button";b.className="answer"+(pickedCard===i?" selected":"");b.textContent=card;b.draggable=true;b.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",String(i));pickedCard=i;});b.addEventListener("click",()=>{pickedCard=i;renderDialog();});group.append(b);});body.append(group);
 const buckets=document.createElement("div");buckets.className="bucket-wrap";st.buckets.forEach((v,j)=>{const b=document.createElement("div");b.className="bucket"+(pickedCard!==null?" active":"");const title=document.createElement("strong");title.textContent=v;b.append(title);const members=Object.entries(assignments).filter(([k,val])=>val===j);members.forEach(([k])=>{const token=document.createElement("div");token.className="token";token.textContent=st.cards[Number(k)];token.title="点击可重新分类";token.addEventListener("click",()=>{if(!answered){delete assignments[k];renderDialog();}});b.append(token);});b.addEventListener("dragover",e=>e.preventDefault());b.addEventListener("drop",e=>{e.preventDefault();const i=Number(e.dataTransfer.getData("text/plain"));if(Number.isInteger(i)&&i>=0&&i<st.cards.length){assignments[i]=j;pickedCard=null;renderDialog();}});b.addEventListener("click",()=>{if(pickedCard!==null&&!answered){assignments[pickedCard]=j;pickedCard=null;renderDialog();}});buckets.append(b);});body.append(buckets);}
 if(st.type==="journal"){renderJournal(body);}
 if(feedback){const f=document.createElement("div");f.className="feedback"+(!answered?" warn":"");f.textContent=feedback;body.append(f);}
 if(st.type!=="journal"&&!answered){const details=document.createElement("details");details.className="assistance";const sum=document.createElement("summary");sum.textContent="💡 线索提示（需要时再展开）";details.append(sum);const p=document.createElement("p");p.textContent=st.hint;details.append(p);details.addEventListener("toggle",()=>{if(details.open){save.hints[st.q]=(save.hints[st.q]||0)+1;persist();}});body.append(details);}
 const footer=$("dialogFooter");footer.innerHTML="";const back=document.createElement("button");back.className="minor";back.textContent="返回探索";back.addEventListener("click",closeTask);footer.append(back);
 const main=document.createElement("button");main.className="primary";main.textContent=st.type==="journal"?"保存侦探笔记":answered?"继续 →":"检查答案 →";main.addEventListener("click",()=>{if(st.type==="journal")submitJournal();else if(answered)nextStep();else submitAnswer();});footer.append(main);}
function renderJournal(body){const guide=document.createElement("div");guide.className="small";guide.textContent="选择一种支架来写作，切换支架不会丢失已输入的文字。开放性回答不会被自动判对错。";body.append(guide);
 const supports=document.createElement("div");supports.className="supports";["我需要更多帮助","我想自己试试","我要挑战自己"].forEach((v,i)=>{const b=document.createElement("button");b.className=save.support===i?"active":"";b.textContent="支架"+(i+1)+" · "+v;b.addEventListener("click",()=>{save.support=i;persist();renderDialog();});supports.append(b);});body.append(supports);
 const guideText=["从丽华（动作／语言）_______，可以看出她_______，因为_______。“我”流泪是因为_______。","请引用两处言行，再解释它们怎样说明丽华的特点。","自己找出两处证据，连起人物特点和友谊主题，解释结尾的眼泪。"][save.support||0];
 const sc=document.createElement("div");sc.className="assistance";sc.textContent=guideText;body.append(sc);
 const label=document.createElement("label");label.className="small";label.textContent=save.done.includes("station")?"✏️ 我的修改稿（上次内容仍保留）":"✏️ 我的侦探笔记";body.append(label);
 const ta=document.createElement("textarea");ta.className="response";ta.placeholder="写下你找到的两处依据，再说明自己的推论……";ta.value=save.done.includes("station")?(save.revision||save.draft):save.draft;ta.addEventListener("input",()=>{if(save.done.includes("station"))save.revision=ta.value;else save.draft=ta.value;persist();});body.append(ta);
 const transfer=document.createElement("label");transfer.className="small";transfer.textContent="🌷 联系生活（选填）：朋友送你一份亲手做的礼物，但不是你期待的，你会怎样回应？";body.append(transfer);
 const tb=document.createElement("textarea");tb.className="response";tb.placeholder="可以表达真实失望，也要想想怎样尊重朋友的心意。";tb.style.minHeight="65px";tb.value=save.lifeResponse||"";tb.addEventListener("input",()=>{save.lifeResponse=tb.value;persist();});body.append(tb);
 const checks=document.createElement("div");checks.className="selfcheck";const strong=document.createElement("strong");strong.textContent="我的三项自评（可继续修改）";checks.append(strong);
 ["找依据：引用课文中具体的动作或语言","做推论：解释证据为什么能说明特点","联主题：从故事思考真正的友谊"].forEach((s,i)=>{const l=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.checked=save.selfChecks.includes(i);check.addEventListener("change",()=>{save.selfChecks=check.checked?[...new Set([...save.selfChecks,i])]:save.selfChecks.filter(x=>x!==i);persist();});l.append(check,document.createTextNode(" "+s));checks.append(l);});body.append(checks);}
function submitAnswer(){const st=currentStep();let correct=false;if(st.type==="single"||st.type==="word")correct=selected.length===1&&selected[0]===st.correct[0];else if(st.type==="multi")correct=selected.length===st.correct.length&&selected.every(i=>st.correct.includes(i));else if(st.type==="categorize")correct=st.cards.every((_,i)=>assignments[i]===st.correct[i]);
 save.attempts[st.q]=(save.attempts[st.q]||0)+1;
 if(correct){answered=true;feedback="✓ "+st.success;save.answers[activeTask.id+"_"+stepIndex]={answer:st.type==="categorize"?{...assignments}:[...selected],attempts:save.attempts[st.q],correct:true};tone(780,.15);setTimeout(()=>tone(1050,.15),120);}
 else{feedback="再观察一下原文： "+st.hint;tone(300,.12);}persist();renderDialog();}
function nextStep(){if(!activeTask)return;if(stepIndex+1<activeTask.steps.length){stepIndex++;selected=[];assignments={};pickedCard=null;feedback="";answered=false;renderDialog();}else completeTask();}
function submitJournal(){const content=save.done.includes("station")?(save.revision||save.draft):save.draft;if((content||"").trim().length<10){feedback="请尝试写下至少一句有依据的解释；文字不由系统机械评分。";answered=false;renderDialog();return;}
 if(!save.done.includes("station")){save.draft=content;save.revision="";}else save.revision=content;
 persist();completeTask();}
function completeTask(){const id=activeTask.id;if(!save.done.includes(id))save.done.push(id);persist();const finished=activeTask;closeTask();updateQuest();victorySound();
 notify("✦ "+finished.name+" 已完成！"+(currentTask()?" 下一处："+currentTask().name:""));
 if(id==="lihua"){setTimeout(()=>notify("第一关完成！点左侧「进入第二关」开始新场景。"),650);}
 if(currentIndex()<0)setTimeout(showFinish,700);}
function showFinish(){$("summary").innerHTML="";const d=document.createElement("p");d.textContent="侦探 "+(save.alias||"小侦探")+" · 关卡 2 / 2 · 已完成 "+save.done.length+" 项探索";$("summary").append(d);$("finish").classList.remove("hidden");paused=true;}
function downloadReport(){const exportData={title:"光之线索｜《手表》3D阅读学习记录",alias:save.alias,classCode:save.classCode,completed:save.done,answers:save.answers,attempts:save.attempts,hintUse:save.hints,supportLevel:save.support+1,firstDraft:save.draft,revisedDraft:save.revision,selfChecks:save.selfChecks,lifeResponse:save.lifeResponse,exportedAt:new Date().toISOString(),note:"开放回答供教师讨论，不代表程序已自动评分。"};const blob=new Blob([JSON.stringify(exportData,null,2)],{type:"application/json;charset=utf-8"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="手表_侦探笔记_"+Date.now()+".json";link.click();URL.revokeObjectURL(link.href);}
function tone(freq=690,duration=.17){if(!isAudio)return;try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(freq,ctx.currentTime);g.gain.setValueAtTime(.045,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);}catch(e){console.warn(e);}}
function victorySound(){[550,730,880,1100].forEach((x,i)=>setTimeout(()=>tone(x,.23),i*95));}
function ambientToggle(){isAudio=!isAudio;$("audioBtn").textContent=isAudio?"♫ ✓":"♫";if(isAudio)tone(528,.25);}
function canMove(nx,nz){if(nx<-17.8||nx>17.8||nz<-14.9||nz>15.8)return false;for(const c of colliders){if(nx>c.x1-.37&&nx<c.x2+.37&&nz>c.z1-.37&&nz<c.z2+.37)return false;}return true;}
const clock=new THREE.Clock();const targetPos=new THREE.Vector3(),cameraAim=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
 if(playing&&!paused){const forward=(keys["w"]||keys["arrowup"]||touchKeys.up?1:0)-(keys["s"]||keys["arrowdown"]||touchKeys.down?1:0),right=(keys["d"]||keys["arrowright"]||touchKeys.right?1:0)-(keys["a"]||keys["arrowleft"]||touchKeys.left?1:0);
 let dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right),dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*right);const l=Math.hypot(dx,dz);if(l>0){dx/=l;dz/=l;const speed=(keys.shift?7.8:4.2)*dt;const nx=avatar.position.x+dx*speed,nz=avatar.position.z+dz*speed;if(canMove(nx,avatar.position.z))avatar.position.x=nx;if(canMove(avatar.position.x,nz))avatar.position.z=nz;
 const rot=Math.atan2(dx,dz);avatar.rotation.y+=Math.atan2(Math.sin(rot-avatar.rotation.y),Math.cos(rot-avatar.rotation.y))*.18;}
 const parts=avatar.userData;if(parts){parts.body.position.y=THREE.MathUtils.lerp(parts.body.position.y,l>0?.052*Math.sin(t*(keys.shift?16:10)):0,.2);parts.arms.forEach((a,i)=>a.rotation.x=THREE.MathUtils.lerp(a.rotation.x,l>0?Math.sin(t*(keys.shift?16:10)+i*Math.PI)*.36:0,.2));parts.legs.forEach((a,i)=>a.rotation.x=THREE.MathUtils.lerp(a.rotation.x,l>0?Math.sin(t*(keys.shift?16:10)+i*Math.PI)*.42:0,.2));}}
 const desired=new THREE.Vector3(avatar.position.x+Math.sin(yaw)*camDist*Math.cos(pitch),2.2+Math.sin(pitch)*camDist,avatar.position.z+Math.cos(yaw)*camDist*Math.cos(pitch));
 camera.position.lerp(desired,.11);cameraAim.set(avatar.position.x,1.45,avatar.position.z);camera.lookAt(cameraAim);
 for(const n of npcs){n.userData.body.position.y=Math.sin(t*1.7+n.position.x)*.025;}
 for(const m of targets){const active=currentTask()?.id===m.task.id;const done=save.done.includes(m.task.id);m.ring.scale.setScalar(active?1+.075*Math.sin(t*3.2):1);m.pillar.material.opacity=active?.12+.06*Math.sin(t*3):.03;m.ring.rotation.z=t*.15;
 const pt=m.point.clone();pt.y=3.2;pt.project(camera);const visible=pt.z>0&&pt.z<1&&Math.abs(pt.x)<1.2&&Math.abs(pt.y)<1.2;m.button.classList.toggle("offscreen",!visible);if(visible){m.button.style.left=((pt.x+1)*.5*innerWidth)+"px";m.button.style.top=((-pt.y+1)*.5*innerHeight)+"px";}}
 renderer.render(scene,camera);}
function interactionNearest(){if(!playing||paused)return;let chosen=null,d=3.8;for(const t of targets){const next=avatar.position.distanceTo(t.point);if(next<d){chosen=t;d=next;}}if(chosen)openTask(chosen.task.id);else notify("靠近发光的线索，就可以按 E 开始调查。");}
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown",(e)=>{if(!playing||paused)return;orbiting=true;previousPointer={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener("pointermove",e=>{if(!orbiting||paused)return;const dx=e.clientX-previousPointer.x,dy=e.clientY-previousPointer.y;if(Math.abs(dx)+Math.abs(dy)>2){yaw-=dx*.005;pitch=THREE.MathUtils.clamp(pitch+dy*.003,.05,.85);}previousPointer={x:e.clientX,y:e.clientY};});
window.addEventListener("pointerup",()=>{orbiting=false;});
renderer.domElement.addEventListener("click",e=>{if(!playing||paused)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-bounds.left)/bounds.width)*2-1,-((e.clientY-bounds.top)/bounds.height)*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(world.children,true);for(const hit of hits){let o=hit.object,id=null;while(o&&!id){id=o.userData.hotspot;o=o.parent;}if(id){openTask(id);return;}}});
renderer.domElement.addEventListener("wheel",e=>{camDist=THREE.MathUtils.clamp(camDist+e.deltaY*.01,5,16);e.preventDefault();},{passive:false});
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))e.preventDefault();if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;keys[k]=true;if(k==="e"&&!e.repeat)interactionNearest();if(k==="escape"&&activeTask)closeTask();});
window.addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;});
for(const b of document.querySelectorAll("[data-dir]")){const d=b.getAttribute("data-dir");for(const start of ["pointerdown","touchstart"])b.addEventListener(start,e=>{touchKeys[d]=true;e.preventDefault();});for(const end of ["pointerup","pointercancel","pointerleave","touchend"])b.addEventListener(end,e=>{touchKeys[d]=false;e.preventDefault();});}
$("mobileInteract").addEventListener("click",interactionNearest);
$("helpBtn").addEventListener("click",()=>{$("help").classList.remove("hidden");paused=true;});
$("closeHelp").addEventListener("click",()=>{$("help").classList.add("hidden");paused=!!activeTask;});
$("audioBtn").addEventListener("click",ambientToggle);
$("closeDialog").addEventListener("click",closeTask);
$("switchBtn").addEventListener("click",()=>{if(doneLevel1()){setupLevel(2);}});
$("startBtn").addEventListener("click",()=>{save.alias=$("aliasInput").value.trim()||"小侦探";save.classCode=$("classInput").value.trim();persist();$("welcome").classList.add("hidden");playing=true;paused=false;setupLevel(doneLevel1()?2:1);});
$("aliasInput").value=save.alias==="小侦探"?"":save.alias;$("classInput").value=save.classCode;
$("exportBtn").addEventListener("click",downloadReport);
$("restartBtn").addEventListener("click",()=>{if(!confirm("确定重新开始？会清除这台设备当前游戏的闯关记录。"))return;save={...DEFAULT_SAVE,alias:save.alias,classCode:save.classCode,done:[],answers:{},attempts:{},hints:{},draft:"",revision:"",support:1,selfChecks:[],lifeResponse:"",createdAt:new Date().toISOString()};persist();$("finish").classList.add("hidden");paused=false;setupLevel(1);});
$("closeFinish").addEventListener("click",()=>{$("finish").classList.add("hidden");paused=false;});
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
window.addEventListener("resize",resize);resize();
try{setupLevel(1);animate();}catch(e){console.error(e);$("error").textContent="3D 场景初始化失败："+e.message;$("error").classList.remove("hidden");}
