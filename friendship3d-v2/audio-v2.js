/* Original upbeat campus game soundtrack and answer effects. No audio files, no CDN. */
(function(){
  'use strict';
  class CampusAudio {
    constructor(){
      this.ctx=null; this.master=null; this.musicBus=null; this.fxBus=null;
      this.playing=false; this.musicEnabled=true; this.effectsEnabled=true;
      this.muted=false; this.tick=0; this.nextAt=0; this.timer=null; this.volume=.30;
      this.voices=[]; this.preferredVoiceName=localStorage.getItem('watchVoice')||'';
      this.onVoicesChanged=()=>this.voices=window.speechSynthesis?.getVoices()||[];
      if ('speechSynthesis' in window) {
        this.voices=window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener?.('voiceschanged',this.onVoicesChanged);
      }
    }
    ensure(){
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)return false;
      if(!this.ctx){
        this.ctx=new C();
        this.master=this.ctx.createGain();this.master.gain.value=.48;
        this.musicBus=this.ctx.createGain();this.musicBus.gain.value=this.volume;
        this.fxBus=this.ctx.createGain();this.fxBus.gain.value=.62;
        this.musicBus.connect(this.master);this.fxBus.connect(this.master);
        this.master.connect(this.ctx.destination);
      }
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
      return true;
    }
    tone(hz,when,duration=.12,vol=.09,wave='sine',bus=this.musicBus){
      if(!this.ctx||!bus||!this.ctx.createOscillator)return;
      const o=this.ctx.createOscillator(),a=this.ctx.createGain();
      o.type=wave;o.frequency.setValueAtTime(hz,when);
      a.gain.setValueAtTime(.0001,when);
      a.gain.exponentialRampToValueAtTime(Math.max(.0003,vol),when+.012);
      a.gain.exponentialRampToValueAtTime(.0001,when+duration);
      o.connect(a);a.connect(bus);o.start(when);o.stop(when+duration+.03);
    }
    freq(n){return 440*Math.pow(2,(n-69)/12)}
    musicStep(n,t){
      if(!this.musicEnabled||this.muted)return;
      // Original 136 BPM playful pentatonic sequence, gentle plucks plus quiet pulse.
      const lead=[72,null,76,79,76,null,74,72,69,null,72,76,74,null,69,67,
                  72,null,76,81,79,null,76,74,72,69,67,69,72,null,74,76];
      const pitch=lead[n%lead.length];
      if(pitch!=null){this.tone(this.freq(pitch),t,.145,.065,'triangle');
        this.tone(this.freq(pitch-12),t,.11,.018,'sine')}
      if(n%4===0){
        const roots=[48,53,50,55];
        let root=roots[Math.floor(n/8)%4];
        this.tone(this.freq(root),t,.27,.075,'sine');
        this.tone(this.freq(root+7),t+.04,.19,.025,'triangle');
      }
      if(n%2===0)this.tone(this.freq(84),t,.025,.018,'sine');
      if(n%8===4)this.tone(this.freq(79),t,.04,.026,'triangle');
    }
    schedule(){
      if(!this.ctx||!this.playing)return;
      const stepSeconds=60/136/2;
      while(this.nextAt<this.ctx.currentTime+.23){
        this.musicStep(this.tick,this.nextAt);
        this.tick++;this.nextAt+=stepSeconds;
      }
    }
    start(){
      if(!this.ensure())return false;
      if(this.playing)return true;
      this.playing=true;this.nextAt=this.ctx.currentTime+.05;
      this.timer=setInterval(()=>this.schedule(),65);
      this.schedule();this.updateButton();return true;
    }
    stop(){
      this.playing=false;if(this.timer)clearInterval(this.timer);
      this.timer=null;this.updateButton();
    }
    toggleMusic(){this.musicEnabled=!this.musicEnabled;if(this.musicEnabled)this.start();this.updateButton();return this.musicEnabled}
    correct(){
      if(!this.effectsEnabled||!this.ensure())return;
      const t=this.ctx.currentTime+.025;
      [79,83,86,91].forEach((m,i)=>{
        this.tone(this.freq(m),t+i*.105,.28,.23,'sine',this.fxBus);
        this.tone(this.freq(m+12),t+i*.105,.14,.055,'triangle',this.fxBus);
      });
    }
    chooseVoice(){
      this.onVoicesChanged();let v=this.voices;
      if(this.preferredVoiceName){
        const saved=v.find(x=>x.name===this.preferredVoiceName);
        if(saved)return saved;
      }
      const zh=v.filter(x=>/zh[-_]|Chinese|普通话|汉语|中文|Mandarin|粤语/i.test(x.lang+' '+x.name));
      const female=/(female|女|xiaoxiao|xiaoyi|xiaohan|xiaomeng|huihui|ting.?ting|mei.?jia|samantha|sin.?ji|lili|yaoyao|hanhan|xiaobei|yating|xiaoyun|yunxi|zhiyu|mei-ling)/i;
      return zh.find(x=>female.test(x.name))||zh.find(x=>female.test(x.voiceURI||''))||zh[0]||null;
    }
    speak(text,notify){
      if(!('speechSynthesis' in window)){notify?.('当前设备没有中文朗读功能。');return}
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      const choice=this.chooseVoice();
      u.lang=choice?.lang||'zh-CN';
      if(choice)u.voice=choice;
      else notify?.('设备没有提供中文女声音色，可能使用系统默认声音。');
      u.rate=.88;u.pitch=1.13;u.volume=1;
      if(this.musicBus&&this.ctx){this.musicBus.gain.setTargetAtTime(.045,this.ctx.currentTime,.08);u.onend=u.onerror=()=>this.musicBus?.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.2)}
      speechSynthesis.speak(u);
      return choice;
    }
    mountUI(){
      const host=document.querySelector('.topbuttons');if(!host||host.querySelector('#musicBtn'))return;
      const b=document.createElement('button');b.id='musicBtn';b.type='button';b.className='iconbtn';b.title='开启或关闭轻快的校园背景音乐';b.innerHTML='🎵<span>音乐</span>';
      b.onclick=()=>{this.toggleMusic();window.toast?.(this.musicEnabled?'🎵 已开启轻快校园音乐':'已暂停背景音乐')};
      host.insertBefore(b,document.getElementById('audioBtn'));this.musicBtn=b;this.updateButton();
      const voice=document.createElement('button');voice.className='iconbtn';voice.id='voicePickerBtn';voice.title='选择中文女声';voice.innerHTML='👩<span>女声</span>';
      voice.onclick=()=>{
        this.onVoicesChanged();
        const v=this.voices.filter(x=>/zh|chinese|mandarin|中文|汉语/i.test(x.lang+' '+x.name));
        if(!v.length){alert('此设备没有安装中文语音。请在操作系统的语音设置中添加中文女声。');return}
        const names=v.map((x,i)=>(i+1)+'. '+x.name+' ('+x.lang+')').join('\n');
        const ask=prompt('请选择中文女声（输入序号）：\n'+names+'\n\n推荐选择名称含 Xiaoxiao／Ting-Ting／女 的声音。');
        const n=parseInt(ask,10);if(n>=1&&n<=v.length){this.preferredVoiceName=v[n-1].name;localStorage.setItem('watchVoice',this.preferredVoiceName);this.speak('你好！欢迎来到《手表》友情侦探！')}
      };
      host.insertBefore(voice,document.getElementById('audioBtn'));
    }
    updateButton(){if(this.musicBtn){this.musicBtn.innerHTML=(this.musicEnabled?'🎵':'🔇')+'<span>音乐</span>';this.musicBtn.setAttribute('aria-pressed',String(this.musicEnabled))}}
  }
  window.GameAudio=new CampusAudio();
})();
