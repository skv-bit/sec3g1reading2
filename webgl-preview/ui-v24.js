/* 《手表》 V24 · UI simplification, optional Hanyu Pinyin, Space key, and success sound.
   Keeps lesson questions, grading, persistence and all existing modal handlers intact. */
(function(){
'use strict';
if(window.__watchV24Installed)return;
window.__watchV24Installed=true;
const HAN=/[\u3400-\u9fff]/;
const HAN_RUN=/[\u3400-\u9fff]+/g;
const successPattern=/(阅读证据正确|回答正确|答案正确|答对了|闯关成功|全部正确|恭喜.{0,6}(完成|答对)|关卡已解锁|解锁成功)/;
let enabled=false,libraryLoading=null,lastEval=0,lastSuccess=0,hasAudio=false,audioContext=null;
let scheduled=false,processing=false,paintButton=null,observer=null;
const watchMutationOptions={childList:true,subtree:true,characterData:true};
function isControl(el){return !!(el&&el.closest&&el.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'));}
function ensureStyle(){
 if(document.getElementById('watch-v24-style'))return;
 const st=document.createElement('style');st.id='watch-v24-style';
 st.textContent=[
 'body.reading-pinyin-on ruby{ruby-position:over;ruby-align:center;white-space:nowrap;}',
 'body.reading-pinyin-on ruby rt{font-size:.45em;font-weight:500;line-height:1.05;color:#357a75;letter-spacing:0;}',
 '.watch-v24-wordhint{padding:11px 14px;border:1px dashed #91c8a0;border-radius:13px;background:#eef8e9;margin:14px 0;color:#346452;font-size:.84em;line-height:1.55;}',
 '.watch-v24-wordhint summary{cursor:pointer;font-weight:700;list-style:revert;}',
 '.watch-v24-wordhint p{margin:8px 0 0;}',
 '@media(max-width:740px){body.reading-pinyin-on ruby rt{font-size:.42em}.watch-v24-wordhint{font-size:.76em}}'
 ].join('\n');
 document.head.appendChild(st);
}
function isLeafElement(e){return e&&e.nodeType===1&&!(e.tagName==='SCRIPT'||e.tagName==='STYLE'||e.tagName==='NOSCRIPT');}
function cleanText(s){
 return s.replace(/《手表》\s*[·•]\s*友谊侦探\s*[·•]\s*3D预览/g,'')
 .replace(/\s*[·•]\s*藏在言行里的心意/g,'')
 .replace(/看线索1[，,]\s*再看线索2[，,]\s*最后完成出口任务[。.]?/g,'先找两处线索，再闯关。')
 .replace(/看线索1[，,]\s*再看线索2/g,'依次寻找两处线索')
 .replace(/门铃前的犹豫停顿/g,'门铃前的犹豫')
 .replace(/下一个线索[：:][^\n]{0,45}进入第二关/g,'下一个线索：进入第二关')
 .replace(/下一个线索[：:]\s*进入第二关/g,'进入第二关')
 .replace(/找依据\s*1[：:]\s*脚踏车事件/g,'线索1：脚踏车事件')
 .replace(/找依据\s*2[：:]\s*纱布/g,'线索2：纱布')
 .replace(/按\s*[Ee]\s*(键)?\s*互动/g,'按空格键互动')
 .replace(/或按\s*[Ee]\s*(键)?/g,'或按空格键')
 .replace(/(\s*[✔✓√✅☑]\s*){1,3}(?=找依据|作推论|联主题|进入第二关|丽华的回应|门铃前)/g,'');
}
function walkText(root,visit){
 if(!root||!document.createTreeWalker)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
   const el=node.parentElement;if(!el||el.closest('script,style,noscript,svg,canvas,textarea,select,option,ruby,rt,rb,[contenteditable]'))continue;
   visit(node,el);
 }
}
function stripCheckPrefix(container){
 if(!container)return;
 const prefix=/^([\s\u00a0]*[✓✔√✅☑][\s\u00a0]*){1,4}/;
 // Do not alter completion status, only its decorative text prefix.
 walkText(container,(node,el)=>{
   const txt=node.nodeValue||'';
   if(!/[✓✔√✅☑]/.test(txt))return;
   let target=el.closest('button,[role="button"],.hotspot-label,.task-bubble,.marker-label,.hotspot-bubble,.poi-label');
   if(!target){
     const p=el.parentElement;
     if(/找依据|作推论|联主题|进入第二关|门铃前/.test(txt)&&txt.length<100)target=el;
     else if(p&&p.textContent.length<95&&/找依据|作推论|联主题/.test(p.textContent))target=p;
   }
   if(!target||!/找依据|作推论|联主题|进入第二关/.test(target.textContent||''))return;
   const after=txt.replace(prefix,'');
   if(after!==txt)node.nodeValue=after;
 });
}
function patchCopy(){
 const body=document.body;if(!body)return;
 walkText(body,(node,el)=>{
   const before=node.nodeValue||'',after=cleanText(before);
   if(after!==before)node.nodeValue=after;
   // The subtitle itself should disappear, including its empty reserved row.
   if(/^\s*《手表》\s*[·•]\s*友谊侦探\s*[·•]\s*3D预览\s*$/.test(before)){
     const p=el.closest('small,.subtitle,.brand-subtitle,.subheading')||el;
     if(p&&p!==body&&p.parentNode)p.style.display='none';
   }
 });
 stripCheckPrefix(body);
 // Remove nonfunctional environment sound control.
 document.querySelectorAll('button,[role="button"]').forEach(btn=>{
   if(/环境音/.test(btn.textContent||''))btn.style.setProperty('display','none','important');
 });
 // Rename oil-paint tool to an accessible Pinyin switch; intercept old handler in capture phase.
 if(!paintButton||!paintButton.isConnected){
   paintButton=[...document.querySelectorAll('button,[role="button"]')].find(e=>/油画滤镜/.test(e.textContent||''))||null;
   if(paintButton){paintButton.dataset.watchPinyinButton='true';paintButton.title='切换所有华文字的汉语拼音';}
 }
 if(paintButton){const desired='🔤 拼音：'+(enabled?'开':'关');if(paintButton.textContent!==desired)paintButton.textContent=desired;}
 installHints(body);
}
function installHints(root){
 if(!root)return;
 // Add a word hint to the first 3–4 paragraph evidence question, not the graded answers.
 const candidates=[...root.querySelectorAll('h1,h2,h3,h4,p,strong,.question-title,.question-text')];
 for(const el of candidates){
   if(el.closest('.watch-v24-wordhint'))continue;
   const txt=el.textContent||'';
   if(txt.length>220||!/第\s*3\s*[、–—-]\s*4\s*段|第3、4段/.test(txt)||!/丽华|证据|哪些/.test(txt))continue;
   if(el.dataset.watchHintInserted)continue;
   el.dataset.watchHintInserted='1';
   const note=document.createElement('details');note.className='watch-v24-wordhint';
   const sum=document.createElement('summary');sum.textContent='💡 词语提示（按需查看）';
   const words=document.createElement('p');
   words.textContent='推开 tuī kāi (push away) · 摔倒 shuāi dǎo (fall) · 擦伤 cā shāng (scrape) · 纱布 shā bù (gauze) · 关心 guān xīn (care)';
   note.append(sum,words);el.after(note);
   break;
 }
}
function renderPinyin(){
 if(!enabled||!window.pinyinPro||typeof window.pinyinPro.pinyin!=='function')return;
 const py=window.pinyinPro.pinyin,body=document.body;if(!body)return;
 const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT,null);
 const nodes=[];
 while(walker.nextNode()){
   const n=walker.currentNode,p=n.parentElement;
   if(!p||!HAN.test(n.nodeValue||''))continue;
   if(p.closest('script,style,noscript,svg,canvas,textarea,select,option,ruby,rt,rb,[contenteditable]'))continue;
   nodes.push(n);
   if(nodes.length>3800)break;
 }
 for(const node of nodes){
   if(!node.parentNode)continue;
   const txt=node.nodeValue||'',frag=document.createDocumentFragment();
   let last=0;HAN_RUN.lastIndex=0;
   for(const match of txt.matchAll(HAN_RUN)){
     if(match.index>last)frag.append(document.createTextNode(txt.slice(last,match.index)));
     const chars=Array.from(match[0]);let syllables=[];
     try{syllables=py(match[0],{type:'array'});}catch(e){}
     for(let j=0;j<chars.length;j++){
       const ruby=document.createElement('ruby'),rb=document.createElement('rb'),rt=document.createElement('rt');
       rb.textContent=chars[j];
       let pinyin=syllables.length===chars.length?syllables[j]:'';
       if(!pinyin){try{pinyin=py(chars[j]);}catch(e){}}
       rt.textContent=pinyin||'';
       ruby.className='watch-pinyin-char';
       ruby.append(rb,rt);frag.append(ruby);
     }
     last=match.index+match[0].length;
   }
   if(last<txt.length)frag.append(document.createTextNode(txt.slice(last)));
   node.replaceWith(frag);
 }
}
function clearPinyin(){
 document.querySelectorAll('ruby.watch-pinyin-char').forEach(ruby=>{
   const original=ruby.querySelector('rb');
   ruby.replaceWith(document.createTextNode(original?original.textContent:ruby.firstChild?.textContent||''));
 });
 document.body&&document.body.normalize();
}
function loadLibrary(){
 if(window.pinyinPro)return Promise.resolve(window.pinyinPro);
 if(libraryLoading)return libraryLoading;
 libraryLoading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/pinyin-pro@3.18.2/dist/index.js';
   script.async=true;
   script.onload=()=>window.pinyinPro?resolve(window.pinyinPro):reject(new Error('pinyinPro not found'));
   script.onerror=()=>reject(new Error('Pinyin CDN could not load'));
   document.head.appendChild(script);
 });
 return libraryLoading.catch(e=>{libraryLoading=null;throw e;});
}
async function togglePinyin(){
 if(enabled){enabled=false;document.body.classList.remove('reading-pinyin-on');clearPinyin();schedule();return;}
 try{
   if(paintButton)paintButton.textContent='🔤 拼音：加载中';
   await loadLibrary();
   enabled=true;document.body.classList.add('reading-pinyin-on');
   schedule();
 }catch(e){
   enabled=false;
   if(paintButton){paintButton.textContent='🔤 拼音：重试';paintButton.title='拼音资源未加载，请检查网络后重试';}
   console.warn('[Watch V24] Pinyin resources unavailable',e);
 }
}
function getAudio(){
 if(!audioContext){
   const AC=window.AudioContext||window.webkitAudioContext;
   if(AC)try{audioContext=new AC()}catch(e){}
 }
 if(audioContext&&audioContext.state==='suspended')audioContext.resume().catch(()=>{});
 return audioContext;
}
function correctSound(){
 const ctx=getAudio();if(!ctx||ctx.state==='suspended')return;
 const t=ctx.currentTime+.025;
 [659.25,784,1046.50].forEach((f,i)=>{
   const o=ctx.createOscillator(),g=ctx.createGain();
   o.type='sine';o.frequency.value=f;
   g.gain.setValueAtTime(.0001,t+i*.10);
   g.gain.exponentialRampToValueAtTime(.075,t+i*.10+.014);
   g.gain.exponentialRampToValueAtTime(.0001,t+i*.10+.27);
   o.connect(g).connect(ctx.destination);
   o.start(t+i*.10);o.stop(t+i*.10+.28);
 });
}
function isVisible(e){const r=e.getBoundingClientRect?.();return !!(r&&r.width&&r.height&&getComputedStyle(e).visibility!=='hidden');}
function detectSuccess(){
 if(!lastEval||Date.now()-lastEval>3400||lastSuccess===lastEval)return;
 const selectors='[role="status"],[role="alert"],.feedback,.result,.success,.toast,.modal,[class*="feedback"],[class*="correct"],[class*="success"]';
 const elements=document.querySelectorAll(selectors);
 for(const e of elements){
   if(!isVisible(e))continue;
   const v=(e.textContent||'').slice(-750);
   if(successPattern.test(v)){
     lastSuccess=lastEval;correctSound();return;
   }
 }
 // Some game feedback is rendered in a generic green note rather than an alert.
 for(const e of document.querySelectorAll('p,div,span')){
   if(!isVisible(e)||e.children.length>2)continue;
   const v=e.textContent||'';
   if(v.length<150&&successPattern.test(v)){
     lastSuccess=lastEval;correctSound();return;
   }
 }
}
function schedule(){
 if(scheduled||processing)return;
 scheduled=true;requestAnimationFrame(()=>{
   scheduled=false;if(processing)return;processing=true;
   if(observer)observer.disconnect();
   try{if(enabled)clearPinyin();patchCopy();if(enabled)renderPinyin();detectSuccess();}
   finally{processing=false;if(observer)observer.observe(document.body,watchMutationOptions);}
 });
}
function onClickCapture(e){
 const btn=e.target.closest?.('button,[role="button"]');
 if(btn&&(btn===paintButton||btn.dataset.watchPinyinButton==='true')){
   e.preventDefault();e.stopImmediatePropagation();getAudio();togglePinyin();return;
 }
 if(btn&&/检查|核对|提交|完成|收下|确认|闯关/.test(btn.textContent||'')){
   lastEval=Date.now();getAudio();
   // Let the lesson's own grading handlers complete, then inspect only their result.
   requestAnimationFrame(detectSuccess);
 }
}
function onKeydown(e){
 if(e.key!==' '&&e.code!=='Space')return;
 if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||isControl(e.target))return;
 if(e.target?.closest?.('button,a,[role="button"]'))return; // Native Space activates focused buttons.
 e.preventDefault();e.stopImmediatePropagation();
 const ev=new KeyboardEvent('keydown',{key:'e',code:'KeyE',keyCode:69,which:69,bubbles:true,cancelable:true});
 document.dispatchEvent(ev);
}
function init(){
 if(!document.body)return;
 ensureStyle();
 document.addEventListener('click',onClickCapture,true);
 document.addEventListener('keydown',onKeydown,true);
 document.addEventListener('drop',()=>{lastEval=Date.now();getAudio();requestAnimationFrame(detectSuccess)},true);
 observer=new MutationObserver(records=>{
   if(processing)return;
   // Do not reprocess a batch of only our own pinyin ruby changes.
   if(!enabled&&records.every(r=>(r.target.closest?.('ruby.watch-pinyin-char'))))return;
   schedule();
 });
 observer.observe(document.body,watchMutationOptions);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
