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
DICT.push(...[["结果","jié guǒ"],["反而","fǎn ér"],["飞快","fēi kuài"],["道理","dào lǐ"],["原来","yuán lái"],["离开","lí kāi"],["提前","tí qián"],["当时","dāng shí"],["第二天","dì èr tiān"],["难过","nán guò"],["非常","fēi cháng"],["出门","chū mén"],["礼貌","lǐ mào"],["认真","rèn zhēn"],["故事","gù shi"],["人物","rén wù"],["词汇","cí huì"],["原句","yuán jù"],["事实","shì shí"],["题目","tí mù"],["朋友之间","péng you zhī jiān"],["好朋友","hǎo péng you"],["两处","liǎng chù"],["曾经","céng jīng"],["关键","guān jiàn"],["原文摘录","yuán wén zhāi lù"],["完整段落","wán zhěng duàn luò"],["作答","zuò dá"],["闯关","chuǎng guān"],["同学","tóng xué"],["主动","zhǔ dòng"],["关怀","guān huái"],["体贴","tǐ tiē"],["善解人意","shàn jiě rén yì"],["贪心","tān xīn"],["胆小","dǎn xiǎo"],["价格","jià gé"],["愿意","yuàn yì"],["在乎","zài hu"],["赶紧","gǎn jǐn"],["爸爸","bà ba"],["妈妈","mā ma"],["叔叔","shū shu"],["时候","shí hou"],["事情","shì qing"],["发生","fā shēng"],["最后","zuì hòu"],["最初","zuì chū"],["抱怨","bào yuàn"],["想念","xiǎng niàn"],["珍藏","zhēn cáng"],["身边","shēn biān"],["发现","fā xiàn"],["导致","dǎo zhì"],["因此","yīn cǐ"],["答案","dá àn"],["错过","cuò guò"],["留下","liú xià"],["拿着","ná zhe"],["拿出","ná chū"],["口袋","kǒu dài"],["换表","huàn biǎo"],["门口","mén kǒu"],["放弃","fàng qì"],["毫不犹豫","háo bù yóu yù"],["无法","wú fǎ"],["转送","zhuǎn sòng"],["感情","gǎn qíng"],["友情","yǒu qíng"],["态度","tài dù"],["表情","biǎo qíng"],["低声","dī shēng"],["脾气","pí qi"],["照做","zhào zuò"],["来不及","lái bu jí"],["反思","fǎn sī"],["自我检查","zì wǒ jiǎn chá"],["开头","kāi tóu"],["结尾","jié wěi"],["后面","hòu miàn"],["责任","zé rèn"],["负责","fù zé"],["修补","xiū bǔ"],["展示板","zhǎn shì bǎn"],["错误","cuò wù"],["承认","chéng rèn"],["感受","gǎn shòu"],["内心","nèi xīn"],["对方","duì fāng"],["证实","zhèng shí"],["已经","yǐ jīng"],["相同","xiāng tóng"],["不同","bù tóng"],["先后","xiān hòu"],["确实","què shí"],["所有","suǒ yǒu"],["任务点","rèn wu diǎn"],["完整原文","wán zhěng yuán wén"],["原文证据","yuán wén zhèng jù"],["朗读原文","lǎng dú yuán wén"],["再试一次","zài shì yí cì"],["需要帮助","xū yào bāng zhù"],["按照","àn zhào"],["移居","yí jū"],["海外","hǎi wài"],["伸","shēn"],["缩","suō"],["疼","téng"],["伤","shāng"],["摔","shuāi"],["推","tuī"],["脚踏车事件","jiǎo tà chē shì jiàn"]]);DICT.sort((a,b)=>b[0].length-a[0].length);
const IDS=['#overlay','#panelOverlay','#questPanel','#hotspotLayer','#intro','#levelTag','#questLevelTitle'];
const SIMPLE=new Set(['你','我','他','她','它','您','我的','你的','他的','她的','我们的','你们的','他们的','她们的','的','了','一','二','三','四','五','六','七','八','九','十','是','在','有','和','也','都','就','不','会','要','而','与','这','那','个','们','吧','呢','吗','啊','呀','哦','把','给','被','对','从','只','让','还','才','很','得','地','又','比','我们','你们','他们','她们','一个','这次','那个','这个','一只','一次','什么']);
let pinyinLib=null,loadRequested=false;
function loadOptionalPinyin(){if(loadRequested||window.pinyinPro)return;loadRequested=true;const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/pinyin-pro@3.18.2/dist/index.js';sc.async=true;sc.onload=()=>{pinyinLib=window.pinyinPro||null;if(pinyinLib&&enabled){resetAnnotations();refresh();}};sc.onerror=()=>{console.info('完整拼音词库暂不可用，使用本地重点词库。')};document.head.appendChild(sc);}
let enabled=false,scheduled=false,observer=null;
const inField=(n)=>Boolean(n.parentElement?.closest('script,style,textarea,input,select,option,ruby,rt,rp,[contenteditable],.pinyin-exempt,#pinyinBtn'));
function romanize(word){
 const pair=DICT.find(([w])=>w===word);
 if(pair)return pair[1];
 const lib=pinyinLib||window.pinyinPro;
 if(lib)try{
  const arr=lib.pinyin(word,{type:'array'});
  const value=Array.isArray(arr)?arr.join(' '):String(arr||'');
  return value&&/[a-zA-Z]/.test(value)?value:'';
 }catch(e){}
 return '';
}
const segmenter=(typeof Intl!=='undefined'&&Intl.Segmenter)?new Intl.Segmenter('zh',{granularity:'word'}):null;
function nextToken(str,i){
 for(const [word,pron] of DICT)if(str.startsWith(word,i))return [word,pron];
 if(segmenter){
  const segment=Array.from(segmenter.segment(str.slice(i)))[0];
  if(segment?.segment)return [segment.segment,romanize(segment.segment)];
 }
 const chunk=str.slice(i,i+2);return [chunk,romanize(chunk)];
}
function transformText(node){
 if(!node.nodeValue||!node.nodeValue.trim()||inField(node))return;
 const src=node.nodeValue,fr=document.createDocumentFragment();
 let pos=0,found=false;
 for(const m of src.matchAll(/[\u3400-\u9fff]+/g)){
  const at=m.index,run=m[0];
  if(at>pos)fr.append(document.createTextNode(src.slice(pos,at)));
  let p=0,rest='';
  while(p<run.length){
   const [word,pron]=nextToken(run,p);
   if(!word){rest+=run[p++];continue}
   p+=word.length;
   const omit=SIMPLE.has(word)||(word.length===1&&!['伸','缩','疼','伤','摔','推'].includes(word));
   if(omit||!pron){rest+=word;continue}
   if(rest){fr.append(document.createTextNode(rest));rest='';}
   const ruby=document.createElement('ruby');
   ruby.dataset.pinyin='v3';
   ruby.className='watch-pinyin-word';
   ruby.append(document.createTextNode(word));
   const rt=document.createElement('rt');rt.textContent=pron;ruby.append(rt);fr.append(ruby);
   // Allow a natural line break after each complete annotated word.
   // The <wbr> has no visible width and is removed when pinyin is switched off.
   const breakPoint=document.createElement('wbr');
   breakPoint.dataset.pinyinBreak='v3';
   fr.append(breakPoint);
   found=true;
  }
  if(rest)fr.append(document.createTextNode(rest));
  pos=at+run.length;
 }
 if(!found)return;
 if(pos<src.length)fr.append(document.createTextNode(src.slice(pos)));
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
 document.querySelectorAll('ruby[data-pinyin="v3"]').forEach(n=>n.replaceWith(document.createTextNode(n.firstChild?.textContent||'')));
 document.querySelectorAll('wbr[data-pinyin-break="v3"]').forEach(n=>n.remove());
 document.body.classList.remove('pinyin-enabled');
}
function toggle(){
 enabled=!enabled;try{localStorage.setItem('handwatch-pinyin-enabled',enabled?'1':'0')}catch(e){}
 const btn=document.getElementById('pinyinBtn');if(btn){btn.setAttribute('aria-pressed',String(enabled));btn.textContent=enabled?'🔤 拼音：开':'🔤 拼音：关';}
 if(enabled){refresh();loadOptionalPinyin()}else resetAnnotations();
}
function init(){
 const btn=document.getElementById('pinyinBtn');if(!btn)return;
 btn.addEventListener('click',toggle);
 try{enabled=localStorage.getItem('handwatch-pinyin-enabled')==='1'}catch(e){}
 btn.setAttribute('aria-pressed',String(enabled));btn.textContent=enabled?'🔤 拼音：开':'🔤 拼音：关';
 observer=new MutationObserver(schedule);
 observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:false});
 if(enabled){refresh();loadOptionalPinyin()}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
