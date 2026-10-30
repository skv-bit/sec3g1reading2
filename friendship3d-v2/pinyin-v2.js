/* Accessible, selective word-level pinyin throughout the reading game.
 * No cloud services or student-data transmission. Frequent function words are intentionally omitted.
 * Only text display is enhanced; story passages, choices and grading remain unchanged. */
(function(){
'use strict';
const DICT=[
 ['移居海外','yí jū hǎi wài'],['不知不觉','bù zhī bù jué'],['人物特点','rén wù tè diǎn'],
 ['脚踏车','jiǎo tà chē'],['原文依据','yuán wén yī jù'],['动作语言','dòng zuò yǔ yán'],
 ['朋友','péng you'],['丽华','lì huá'],['犹豫','yóu yù'],['推开','tuī kāi'],['冲向','chōng xiàng'],
 ['摔倒','shuāi dǎo'],['擦伤','cā shāng'],['纱布','shā bù'],['关心','guān xīn'],
 ['保护','bǎo hù'],['证据','zhèng jù'],['推论','tuī lùn'],['推测','tuī cè'],
 ['原因','yuán yīn'],['理解','lǐ jiě'],['联结','lián jié'],['联系','lián xì'],
 ['完整','wán zhěng'],['段落','duàn luò'],['原文','yuán wén'],['朗读','lǎng dú'],
 ['词语','cí yǔ'],['意思','yì si'],['分析','fēn xī'],['任务','rèn wu'],
 ['校园','xiào yuán'],['危险','wēi xiǎn'],['时刻','shí kè'],['受伤','shòu shāng'],
 ['手臂','shǒu bì'],['连忙','lián máng'],['自己','zì jǐ'],['害怕','hài pà'],
 ['担心','dān xīn'],['失去','shī qù'],['门铃','mén líng'],['缩回','suō huí'],
 ['伸手','shēn shǒu'],['心想','xīn xiǎng'],['生气','shēng qì'],['意外','yì wài'],
 ['安慰','ān wèi'],['肩膀','jiān bǎng'],['归还','guī huán'],['体谅','tǐ liàng'],
 ['宽容','kuān róng'],['包容','bāo róng'],['善良','shàn liáng'],['无私','wú sī'],
 ['友善','yǒu shàn'],['礼物','lǐ wù'],['珍贵','zhēn guì'],['珍惜','zhēn xī'],
 ['名贵','míng guì'],['心意','xīn yì'],['友谊','yǒu yì'],['感动','gǎn dòng'],
 ['流泪','liú lèi'],['眼泪','yǎn lèi'],['回应','huí yìng'],['选择','xuǎn zé'],
 ['正确','zhèng què'],['答题','dá tí'],['解释','jiě shì'],['词义','cí yì'],
 ['说明','shuō míng'],['证明','zhèng míng'],['回忆','huí yì'],['帮忙','bāng máng'],
 ['教师','jiào shī'],['示范','shì fàn'],['完成','wán chéng'],['返回','fǎn huí'],
 ['观察','guān chá'],['寻找','xún zhǎo'],['失败','shī bài'],['成功','chéng gōng'],
 ['收集','shōu jí'],['检查','jiǎn chá'],['性格','xìng gé'],['心理','xīn lǐ'],
 ['动作','dòng zuò'],['语言','yǔ yán'],['言行','yán xíng'],['判断','pàn duàn'],
 ['对照','duì zhào'],['整合','zhěng hé'],['观点','guān diǎn'],['理由','lǐ yóu'],
 ['句式','jù shì'],['支架','zhī jià'],['提示','tí shì'],['线索','xiàn suǒ'],
 ['重置','chóng zhì'],['自评','zì píng'],['修改','xiū gǎi'],['草稿','cǎo gǎo'],
 ['独立','dú lì'],['挑战','tiǎo zhàn'],['想法','xiǎng fǎ'],['情绪','qíng xù'],
 ['尊重','zūn zhòng'],['沟通','gōu tōng'],['温柔','wēn róu'],['失落','shī luò'],
 ['照顾','zhào gù'],['道谢','dào xiè'],['打算','dǎ suàn'],['道歉','dào qiàn'],
 ['误会','wù huì'],['换回','huàn huí'],['手表','shǒu biǎo'],['后来','hòu lái']
].sort((a,b)=>b[0].length-a[0].length);
const IDS=['#overlay','#panelOverlay','#questPanel','#hotspotLayer','#intro'];
let enabled=false,scheduled=false,observer=null;
const inField=(n)=>Boolean(n.parentElement?.closest('script,style,textarea,input,select,option,ruby,rt,rp,[contenteditable],.pinyin-exempt'));
function transformText(node){
 if(!node.nodeValue||!node.nodeValue.trim()||inField(node))return;
 const str=node.nodeValue;let i=0,start=0,found=false,fr=document.createDocumentFragment();
 while(i<str.length){
  let match=null;for(const entry of DICT)if(str.startsWith(entry[0],i)){match=entry;break}
  if(!match){i++;continue}
  if(i>start)fr.appendChild(document.createTextNode(str.slice(start,i)));
  const ruby=document.createElement('ruby');ruby.dataset.pinyin='v2';
  ruby.appendChild(document.createTextNode(match[0]));
  const rt=document.createElement('rt');rt.textContent=match[1];ruby.appendChild(rt);fr.appendChild(ruby);
  i+=match[0].length;start=i;found=true;
 }
 if(!found)return;
 if(start<str.length)fr.appendChild(document.createTextNode(str.slice(start)));
 node.replaceWith(fr);
}
function transformRoot(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
   return n.nodeValue?.trim()&&!inField(n)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT
 }});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes)transformText(n);
}
function refresh(){
 if(!enabled)return;document.body.classList.add('pinyin-enabled');
 for(const id of IDS)transformRoot(document.querySelector(id));
}
function schedule(){if(scheduled||!enabled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})}
function resetAnnotations(){
 document.querySelectorAll('ruby[data-pinyin="v2"]').forEach(n=>n.replaceWith(document.createTextNode(n.firstChild?.textContent||'')));
 document.body.classList.remove('pinyin-enabled');
}
function toggle(){
 enabled=!enabled;try{localStorage.setItem('handwatch-pinyin-enabled',enabled?'1':'0')}catch(e){}
 const btn=document.getElementById('pinyinBtn');if(btn){btn.setAttribute('aria-pressed',String(enabled));btn.textContent=enabled?'拼音 ✓':'拼音';}
 if(enabled)refresh();else resetAnnotations();
}
function init(){
 const btn=document.getElementById('pinyinBtn');if(!btn)return;
 btn.addEventListener('click',toggle);
 try{enabled=localStorage.getItem('handwatch-pinyin-enabled')==='1'}catch(e){}
 btn.setAttribute('aria-pressed',String(enabled));if(enabled)btn.textContent='拼音 ✓';
 observer=new MutationObserver(schedule);
 observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:false});
 if(enabled)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
