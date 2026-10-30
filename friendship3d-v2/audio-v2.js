/* Original upbeat campus game soundtrack and answer effects. No audio files, no CDN. */
(function(){
  'use strict';
  class CampusAudio {
    constructor(){
      this.ctx=null; this.master=null; this.musicBus=null; this.fxBus=null;
      this.playing=false; this.musicEnabled=true; this.effectsEnabled=true;
      this.muted=false; this.tick=0; this.nextAt=0; this.timer=null; this.volume=.23;
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
      // Original 154 BPM upbeat classroom-game motif (not a copy of any existing soundtrack).
      const melody=[76,79,null,83,79,76,74,79,81,null,79,76,74,71,74,null,
                    76,83,81,79,76,null,74,72,74,76,79,null,81,79,76,null];
      const bass=[52,57,50,55][Math.floor(n/8)%4],note=melody[n%melody.length];
      if(note!=null){this.tone(this.freq(note),t,.125,.082,'triangle');this.tone(this.freq(note+12),t+.008,.075,.016,'sine');}
      if(n%4===0){this.tone(this.freq(bass),t,.17,.095,'sine');this.tone(this.freq(bass+7),t+.016,.11,.034,'triangle');}
      if(n%4===2)this.tone(this.freq(bass-12),t,.10,.033,'triangle');
      if(n%2===0)this.tone(this.freq(91),t,.020,.024,'sine');
      if(n%8===4)this.tone(this.freq(58),t,.055,.030,'triangle');
    }
    schedule(){
      if(!this.ctx||!this.playing)return;
      const stepSeconds=60/154/2;
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
    stopSpeech(){
      this.voiceSession=(this.voiceSession||0)+1;
      try{window.speechSynthesis?.cancel()}catch(e){}
      if(this.musicBus&&this.ctx)this.musicBus.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.2);
    }
    speak(text,notify){
      if(!('speechSynthesis' in window)){notify?.('当前设备没有中文朗读功能。');return}
      this.stopSpeech();
      const content=String(text||'').trim();
      if(!content)return;
      const token=this.voiceSession;
      const choice=this.chooseVoice();
      if(!choice)notify?.('设备未提供中文女声音色，将使用系统默认声音。');
      // One utterance per sentence: pauses at full stops and questions are
      // more natural than reading an entire paragraph as a single breath.
      const chunks=(content.match(/[^。！？!?\n]+[。！？!?]?/g)||[])
        .map(x=>x.trim()).filter(Boolean);
      let index=0;
      if(this.musicBus&&this.ctx)this.musicBus.gain.setTargetAtTime(.045,this.ctx.currentTime,.08);
      const restore=()=>{if(token===this.voiceSession&&this.musicBus&&this.ctx)this.musicBus.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.2)};
      const readNext=()=>{
        if(token!==this.voiceSession)return;
        if(index>=chunks.length){restore();return}
        const u=new SpeechSynthesisUtterance(chunks[index++]);
        u.lang=choice?.lang||'zh-CN';
        if(choice)u.voice=choice;
        u.rate=.86;u.pitch=1.09;u.volume=1;
        u.onend=readNext;
        u.onerror=event=>{if(event?.error!=='canceled'&&event?.error!=='interrupted')notify?.('朗读暂时中断，可再点击播放。');restore()};
        speechSynthesis.speak(u);
      };
      readNext();
      return choice;
    }
    mountUI(){
      const host=document.querySelector('.topbuttons');if(!host||host.querySelector('#musicBtn'))return;
      const b=document.createElement('button');b.id='musicBtn';b.type='button';b.className='iconbtn';b.title='开启或关闭轻快的校园背景音乐';b.innerHTML='🎵<span>音乐</span>';
      b.onclick=()=>{this.toggleMusic();window.toast?.(this.musicEnabled?'🎵 已开启轻快校园音乐':'已暂停背景音乐')};
      host.insertBefore(b,document.getElementById('audioBtn'));this.musicBtn=b;this.updateButton();
      
    }
    updateButton(){if(this.musicBtn){this.musicBtn.innerHTML=(this.musicEnabled?'🎵':'🔇')+'<span>音乐</span>';this.musicBtn.setAttribute('aria-pressed',String(this.musicEnabled))}}
  }
  window.GameAudio=new CampusAudio();
})();
