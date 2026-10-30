/* Shared reading accessibility for the original and 3D preview lesson entries.
 * Only annotates visible reading UI. Never changes questions, answers or game state. */
(function(){
'use strict';
if(window.__watchReadingA11y30)return;window.__watchReadingA11y30=true;
const EXCERPTS={"1":"我把叔叔给我的名贵手表转送给丽华，妈妈知道了很生气。","3":"丽华连忙推开我，结果自己却摔倒在地上。她擦伤了手臂，我反而没事。","4":"丽华手臂缠着纱布走进教室。我正想向她道谢，她却关心地问我：“你没事吧？”","5":"上个星期，丽华说她要随父母移居海外，我非常难过。我想送她一份珍贵的礼物，想来想去，最后选择了叔叔给我的那只手表。","6":"“我这里有一只新手表，你去把叔叔送的手表换回来吧！”妈妈说道。虽然非常不愿意，但我知道妈妈的脾气，只好照做。","7":"我犹豫了，几次伸手要去按门铃，几次又把手缩了回来。我心想：她会生气吗？我会不会失去这个朋友？","8":"丽华看了看我，转身进了屋里，没多久，她拿着那只表走了出来。她把表还给我，拍拍我的肩膀，对我说：“礼物是一份心意，只要是你送的，我都喜欢。我们永远是最好的朋友！”","9":"我望着她，眼泪竟不知不觉流了下来。"},FULL={"1":"我把叔叔给我的名贵手表转送给丽华，妈妈知道了很生气。其实，我这么做是有原因的。","3":"“我叫丽华，你呢？”她问道。我还没来得及回答，一辆脚踏车朝我飞快地冲过来。丽华连忙推开我，结果自己却摔倒在地上。她擦伤了手臂，我反而没事。","4":"第二天，丽华手臂缠着纱布走进教室。我正想向她道谢，她却关心地问我：“你没事吧？”她的善良让我很感动。从此，我们成了好朋友。","5":"上个星期，丽华说她要随父母移居海外，我非常难过。我想送她一份珍贵的礼物，想来想去，最后选择了叔叔给我的那只手表。","6":"“我这里有一只新手表，你去把叔叔送的手表换回来吧！”妈妈说道。虽然非常不愿意，但我知道妈妈的脾气，只好照做。","7":"来到丽华家门口，我犹豫了，几次伸手要去按门铃，几次又把手缩了回来。我心想：她会生气吗？我会不会失去这个朋友？这时，门忽然开了，正要出门的丽华看到我站在那里，有些意外。我从口袋里拿出妈妈给的那只表，低声说：“我……能不能换回送给你的那只手表？那其实是我叔叔送我的。”","8":"丽华看了看我，转身进了屋里，没多久，她拿着那只表走了出来。她把表还给我，拍拍我的肩膀，对我说：“礼物是一份心意，只要是你送的，我都喜欢。我们永远是最好的朋友！”","9":"我望着她，眼泪竟不知不觉流了下来。"}, DICT={"移居海外":"yí jū hǎi wài","不知不觉":"bù zhī bù jué","人物特点":"rén wù tè diǎn","脚踏车":"jiǎo tà chē","原文依据":"yuán wén yī jù","动作语言":"dòng zuò yǔ yán","朋友":"péng you","丽华":"lì huá","犹豫":"yóu yù","推开":"tuī kāi","冲向":"chōng xiàng","摔倒":"shuāi dǎo","擦伤":"cā shāng","纱布":"shā bù","关心":"guān xīn","保护":"bǎo hù","证据":"zhèng jù","推论":"tuī lùn","推测":"tuī cè","原因":"yuán yīn","理解":"lǐ jiě","联结":"lián jié","联系":"lián xì","完整":"wán zhěng","段落":"duàn luò","原文":"yuán wén","朗读":"lǎng dú","词语":"cí yǔ","意思":"yì si","分析":"fēn xī","任务":"rèn wu","校园":"xiào yuán","危险":"wēi xiǎn","时刻":"shí kè","受伤":"shòu shāng","手臂":"shǒu bì","连忙":"lián máng","自己":"zì jǐ","害怕":"hài pà","担心":"dān xīn","失去":"shī qù","门铃":"mén líng","缩回":"suō huí","伸手":"shēn shǒu","心想":"xīn xiǎng","生气":"shēng qì","意外":"yì wài","安慰":"ān wèi","肩膀":"jiān bǎng","归还":"guī huán","体谅":"tǐ liàng","宽容":"kuān róng","包容":"bāo róng","善良":"shàn liáng","无私":"wú sī","友善":"yǒu shàn","礼物":"lǐ wù","珍贵":"zhēn guì","珍惜":"zhēn xī","名贵":"míng guì","心意":"xīn yì","友谊":"yǒu yì","感动":"gǎn dòng","流泪":"liú lèi","眼泪":"yǎn lèi","回应":"huí yìng","选择":"xuǎn zé","正确":"zhèng què","答题":"dá tí","解释":"jiě shì","词义":"cí yì","说明":"shuō míng","证明":"zhèng míng","回忆":"huí yì","帮忙":"bāng máng","教师":"jiào shī","示范":"shì fàn","完成":"wán chéng","返回":"fǎn huí","观察":"guān chá","寻找":"xún zhǎo","失败":"shī bài","成功":"chéng gōng","收集":"shōu jí","检查":"jiǎn chá","性格":"xìng gé","心理":"xīn lǐ","动作":"dòng zuò","语言":"yǔ yán","言行":"yán xíng","判断":"pàn duàn","对照":"duì zhào","整合":"zhěng hé","观点":"guān diǎn","理由":"lǐ yóu","句式":"jù shì","支架":"zhī jià","提示":"tí shì","线索":"xiàn suǒ","重置":"chóng zhì","自评":"zì píng","修改":"xiū gǎi","草稿":"cǎo gǎo","独立":"dú lì","挑战":"tiǎo zhàn","想法":"xiǎng fǎ","情绪":"qíng xù","尊重":"zūn zhòng","沟通":"gōu tōng","温柔":"wēn róu","失落":"shī luò","照顾":"zhào gù","道谢":"dào xiè","打算":"dǎ suàn","道歉":"dào qiàn","误会":"wù huì","换回":"huàn huí","手表":"shǒu biǎo","后来":"hòu lái","结果":"jié guǒ","反而":"fǎn ér","飞快":"fēi kuài","道理":"dào lǐ","原来":"yuán lái","离开":"lí kāi","提前":"tí qián","当时":"dāng shí","第二天":"dì èr tiān","难过":"nán guò","非常":"fēi cháng","出门":"chū mén","礼貌":"lǐ mào","认真":"rèn zhēn","故事":"gù shi","人物":"rén wù","词汇":"cí huì","原句":"yuán jù","事实":"shì shí","题目":"tí mù","朋友之间":"péng you zhī jiān","好朋友":"hǎo péng you","两处":"liǎng chù","曾经":"céng jīng","关键":"guān jiàn","原文摘录":"yuán wén zhāi lù","完整段落":"wán zhěng duàn luò","作答":"zuò dá","闯关":"chuǎng guān","同学":"tóng xué","主动":"zhǔ dòng","关怀":"guān huái","体贴":"tǐ tiē","善解人意":"shàn jiě rén yì","贪心":"tān xīn","胆小":"dǎn xiǎo","价格":"jià gé","愿意":"yuàn yì","在乎":"zài hu","赶紧":"gǎn jǐn","爸爸":"bà ba","妈妈":"mā ma","叔叔":"shū shu","时候":"shí hou","事情":"shì qing","发生":"fā shēng","最后":"zuì hòu","最初":"zuì chū","抱怨":"bào yuàn","想念":"xiǎng niàn","珍藏":"zhēn cáng","身边":"shēn biān","发现":"fā xiàn","导致":"dǎo zhì","因此":"yīn cǐ","答案":"dá àn","错过":"cuò guò","留下":"liú xià","拿着":"ná zhe","拿出":"ná chū","口袋":"kǒu dài","换表":"huàn biǎo","门口":"mén kǒu","放弃":"fàng qì","毫不犹豫":"háo bù yóu yù","无法":"wú fǎ","转送":"zhuǎn sòng","感情":"gǎn qíng","友情":"yǒu qíng","态度":"tài dù","表情":"biǎo qíng","低声":"dī shēng","脾气":"pí qi","照做":"zhào zuò","来不及":"lái bu jí","反思":"fǎn sī","自我检查":"zì wǒ jiǎn chá","开头":"kāi tóu","结尾":"jié wěi","后面":"hòu miàn","责任":"zé rèn","负责":"fù zé","修补":"xiū bǔ","展示板":"zhǎn shì bǎn","错误":"cuò wù","承认":"chéng rèn","感受":"gǎn shòu","内心":"nèi xīn","对方":"duì fāng","证实":"zhèng shí","已经":"yǐ jīng","相同":"xiāng tóng","不同":"bù tóng","先后":"xiān hòu","确实":"què shí","所有":"suǒ yǒu","任务点":"rèn wu diǎn","完整原文":"wán zhěng yuán wén","原文证据":"yuán wén zhèng jù","朗读原文":"lǎng dú yuán wén","再试一次":"zài shì yí cì","需要帮助":"xū yào bāng zhù","按照":"àn zhào","移居":"yí jū","海外":"hǎi wài","伸":"shēn","缩":"suō","疼":"téng","伤":"shāng","摔":"shuāi","推":"tuī","脚踏车事件":"jiǎo tà chē shì jiàn"};
const WORDS=Object.keys(DICT).sort((a,b)=>b.length-a.length);
const EASY=new Set(['你','我','他','她','它','您','一','二','三','四','五','六','七','八','九','十','了','的','地','得','在','是','和','与','也','都','有','不','就','让','给','把','吧','呢','吗','啊','哦','要','会','来','去','这','那','个','他','们','我','你们','我们','他们','她们','这个','那个','什么','一个','一只','一次']);
const SEG=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh',{granularity:'word'}):null;
let enabled=false,scheduled=false,playing=false,lib=null,loading=false;
function getModal(){return document.getElementById('modal')}
function escapeText(v){const d=document.createElement('div');d.textContent=String(v||'');return d.innerHTML}
function isVisible(){const overlay=document.getElementById('overlay');return overlay&&!overlay.classList.contains('hidden')&&getModal()?.childElementCount}
function paragraphs(modal){
 const text=modal.textContent||'',out=new Set();
 for(const m of text.matchAll(/第\s*([1-9])\s*段/g))if(FULL[m[1]])out.add(Number(m[1]));
 if(!out.size){
  if(/危险时刻|脚踏车事件/.test(text))out.add(3);
  else if(/受伤后的关心|纱布/.test(text)){out.add(3);out.add(4)}
  else if(/犹豫|门铃/.test(text))out.add(7);
  else if(/名贵手表|送别礼物|心意线索/.test(text))out.add(5);
  else if(/真实回应|丽华的回应|归还手表/.test(text))out.add(8);
  else if(/线索连连看|人物特点|两条线索/.test(text)){out.add(3);out.add(4);out.add(8)}
 }
 return [...out].filter(p=>FULL[p]).sort((a,b)=>a-b);
}
function quoteText(modal,nums){
 const raw=[...modal.querySelectorAll('.quote')].map(x=>x.textContent||'').filter(Boolean).join('。');
 const cleaned=raw.replace(/第\s*[1-9]\s*段[：:\s]*/g,'').replace(/^\s*[“"]|[”"]\s*$/g,'').trim();
 const normalized=t=>String(t).replace(/[\s“”"'‘’]/g,'');
 const onlyOriginal=nums.some(p=>normalized(FULL[p]).includes(normalized(cleaned)));
 return cleaned&&onlyOriginal?cleaned:nums.map(p=>EXCERPTS[p]||FULL[p]).join('。');
}
function speak(text){
 if(!text?.trim())return;
 if(!('speechSynthesis' in window)){window.alert('当前浏览器不支持中文朗读。');return}
 speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(text);
 const voices=speechSynthesis.getVoices()||[];
 const zh=voices.filter(v=>/^zh/i.test(v.lang)||/mandarin|chinese|普通话|华语/i.test(v.name));
 const female=/(xiaoxiao|xiaoyi|huihui|tingting|meijia|female|woman|yating|xiaohan|sin.ji)/i;
 const preferred=zh.find(v=>female.test(v.name))||zh.find(v=>/^zh-(CN|SG)/i.test(v.lang))||zh[0];
 if(preferred)u.voice=preferred;u.lang=preferred?.lang||'zh-CN';u.rate=.87;u.pitch=1.08;u.volume=1;playing=true;
 u.onend=u.onerror=()=>{playing=false};speechSynthesis.speak(u);
}
function wordPinyin(t){
 if(DICT[t])return DICT[t];
 if(lib)try{
  const a=lib.pinyin(t,{type:'array'}),v=Array.isArray(a)?a.join(' '):String(a||'');
  return /[a-z]/i.test(v)?v:'';
 }catch(e){}
 return '';
}
function nextWord(text,i){
 for(const w of WORDS)if(text.startsWith(w,i))return [w,DICT[w]];
 const t=SEG?Array.from(SEG.segment(text.slice(i)))[0]?.segment:text.slice(i,i+2);
 const w=t||text[i];return [w,wordPinyin(w)];
}
function annotateNode(node){
 if(!node.parentNode||!node.nodeValue?.match(/[\u3400-\u9fff]/))return;
 const src=node.nodeValue,frag=document.createDocumentFragment();let last=0,found=false;
 for(const match of src.matchAll(/[\u3400-\u9fff]+/g)){
  if(match.index>last)frag.append(document.createTextNode(src.slice(last,match.index)));
  const str=match[0];let i=0,raw='';
  while(i<str.length){
   const [word,py]=nextWord(str,i);i+=word.length;
   if(EASY.has(word)||!py||(word.length===1&&!['推','摔','缩','疼','伤','伸'].includes(word))){raw+=word;continue}
   if(raw){frag.append(document.createTextNode(raw));raw=''}
   const ruby=document.createElement('ruby');ruby.setAttribute('data-reading-word','1');ruby.append(document.createTextNode(word));
   const rt=document.createElement('rt');rt.textContent=py;ruby.append(rt);frag.append(ruby);found=true;
  }
  if(raw)frag.append(document.createTextNode(raw));
  last=match.index+str.length;
 }
 if(!found)return;
 if(last<src.length)frag.append(document.createTextNode(src.slice(last)));
 node.replaceWith(frag);
}
function annotate(root){
 if(!enabled||!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];
 while(walker.nextNode()){
  const n=walker.currentNode,p=n.parentElement;
  if(!p||!n.nodeValue.trim())continue;
  if(p.closest('script,style,textarea,input,select,option,ruby,rt,rp,[contenteditable],.reading-controls,.reading-toolbar,#readingPinyinBtn'))continue;
  nodes.push(n);
 }
 for(const n of nodes)annotateNode(n);
}
function clearWords(){
 document.querySelectorAll('ruby[data-reading-word="1"]').forEach(n=>n.replaceWith(document.createTextNode(n.firstChild?.textContent||'')));
}
function startLibrary(){
 if(loading||lib||window.pinyinPro)return;loading=true;
 const src=document.createElement('script');src.src='https://cdn.jsdelivr.net/npm/pinyin-pro@3.18.2/dist/index.js';src.async=true;
 src.onload=()=>{lib=window.pinyinPro||null;if(lib&&enabled){clearWords();annotate(getModal());}};
 src.onerror=()=>console.info('拼音网络词库不可用，已使用本地重点词库');document.head.append(src);
}
function updateBtn(){
 const b=document.getElementById('readingPinyinBtn')||document.getElementById('paintBtn');if(!b)return;
 b.textContent='🔤 拼音：'+(enabled?'开':'关');b.setAttribute('aria-pressed',String(enabled));
}
function toggle(){
 enabled=!enabled;document.body.classList.toggle('watch-reading-pinyin',enabled);
 try{localStorage.setItem('watch-reading-pinyin-v30',enabled?'1':'0')}catch(e){}
 updateBtn();
 if(enabled){annotate(getModal());startLibrary()}else clearWords();
}
function injectStyles(){
 if(document.getElementById('reading-a11y-style'))return;
 const s=document.createElement('style');s.id='reading-a11y-style';
 s.textContent='.watch-reading-pinyin ruby{ruby-position:over;ruby-align:center;white-space:nowrap;line-height:2;display:inline-ruby;margin:0 2px}.watch-reading-pinyin ruby rt{font-size:clamp(14px,.76em,19px);color:#23695c;line-height:1.15;font-weight:750}.watch-reading-pinyin .modal .quote,.watch-reading-pinyin .modal .choice,.watch-reading-pinyin .modal h2,.watch-reading-pinyin .modal .question-title{line-height:2.12!important}.reading-toolbar{display:flex;gap:9px;margin:10px 0 12px;flex-wrap:wrap}.reading-controls{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.reading-controls.bottom-left{margin-right:auto}.reading-source-panel{position:absolute;z-index:4;inset:0;padding:24px;overflow:auto;background:#fffdf5;border-radius:22px;box-shadow:inset 0 0 0 2px #e6ebd8}.reading-source-panel h2{color:#226d55}.reading-source-panel blockquote{border-left:5px solid #5aa97c;background:#edf8eb;padding:12px 15px;margin:12px 0;border-radius:8px;line-height:1.95;font-size:16px}.reading-source-panel .source-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start;position:sticky;bottom:-24px;background:#fffdf5;padding:12px 0}.reading-source-panel p{font-size:13px;color:#567264}@media(max-width:600px){.watch-reading-pinyin ruby rt{font-size:clamp(12px,.72em,17px)}.reading-source-panel{padding:15px}}';
 document.head.append(s);
}
function showOriginal(modal,nums){
 if(modal.querySelector('.reading-source-panel'))return;
 const root=document.createElement('section');root.className='reading-source-panel';root.setAttribute('aria-label','看回完整原文');
 root.innerHTML='<h2>📖 看回原文 · 完整段落</h2><p>这里显示完整原文。与上方“朗读本题原文”的摘录朗读不同。</p>'+
 nums.map(p=>'<blockquote><b>第'+p+'段</b><p>'+escapeText(FULL[p])+'</p></blockquote>').join('')+
 '<div class="source-actions reading-controls"><button type="button" class="secondary" id="readingSourceVoice">🔊 朗读完整原文</button><button type="button" class="secondary" id="readingStopVoice">停止朗读</button><button type="button" class="secondary" id="readingSourceReturn">返回题目</button></div>';
 modal.append(root);
 root.querySelector('#readingSourceVoice').onclick=()=>speak(nums.map(p=>FULL[p]).join('。'));
 root.querySelector('#readingStopVoice').onclick=()=>{speechSynthesis?.cancel();playing=false};
 root.querySelector('#readingSourceReturn').onclick=()=>{speechSynthesis?.cancel();playing=false;root.remove()};
 annotate(root);
}
function decorate(){
 const modal=getModal();if(!modal||!isVisible())return;
 const nums=paragraphs(modal),hasQuote=!!modal.querySelector('.quote');
 const lesson=hasQuote||!!modal.querySelector('.question-title')||!!modal.querySelector('.story-illustration');
 if(!lesson||!nums.length){annotate(modal);return}
 if(!modal.querySelector('.reading-toolbar')){
  const bar=document.createElement('div');bar.className='reading-toolbar reading-controls';
  bar.innerHTML='<button type="button" class="secondary" id="readingExcerptVoice">🔊 朗读本题原文</button><button type="button" class="secondary" id="readingExcerptStop">停止朗读</button>';
  const quote=modal.querySelector('.quote');
  if(quote)quote.insertAdjacentElement('afterend',bar);
  else (modal.querySelector('.story-illustration')||modal.querySelector('.question-title')||modal).insertAdjacentElement('afterend',bar);
  bar.querySelector('#readingExcerptVoice').onclick=()=>speak(quoteText(modal,nums));
  bar.querySelector('#readingExcerptStop').onclick=()=>{speechSynthesis?.cancel();playing=false};
 }
 if(!modal.querySelector('#readingReviewButton')){
  const btn=document.createElement('button');btn.type='button';btn.id='readingReviewButton';btn.className='secondary';
  btn.textContent='📖 看回原文';btn.onclick=()=>showOriginal(modal,nums);
  let actions=modal.querySelector('.modal-actions:last-of-type');
  if(!actions){actions=document.createElement('div');actions.className='modal-actions reading-controls bottom-left';modal.append(actions)}
  actions.insertBefore(btn,actions.firstChild);btn.style.marginRight='auto';
 }
 annotate(modal);
}
function schedule(){
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()});
}
function init(){
 injectStyles();
 enabled=localStorage.getItem('watch-reading-pinyin-v30')==='1';
 document.body.classList.toggle('watch-reading-pinyin',enabled);
 const host=document.querySelector('#topbar .topgroup:last-child');
 const paint=document.getElementById('paintBtn');
 if(paint){
  // Reuse the existing oil-filter button as the requested Pinyin toggle.
  paint.title='按词语显示汉语拼音，省略常见简单字词';
  paint.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();toggle()},true);
 }else if(host&&!document.getElementById('readingPinyinBtn')){
  const b=document.createElement('button');b.className='control';b.id='readingPinyinBtn';b.type='button';
  b.title='按词语显示汉语拼音，省略常见简单字词';b.onclick=toggle;
  host.insertBefore(b,host.querySelector('#helperBtn')||host.firstChild);
 }
 updateBtn();if(enabled)startLibrary();
 const m=getModal();if(m)new MutationObserver(schedule).observe(m,{childList:true,subtree:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
