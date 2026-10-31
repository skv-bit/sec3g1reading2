#!/usr/bin/env python3
"""Record actual Handwatch 3D gameplay in headless Chromium, then narrate and subtitle it.
The studio=1 query uses a separate progress key so this demo does not touch students' work.
"""
import asyncio
import json
import math
import os
import subprocess
import time
from pathlib import Path

from playwright.async_api import async_playwright

BASE = Path("recorded_demo")
BASE.mkdir(exist_ok=True)
CUES = []
START = 0.0
GAME = "http://127.0.0.1:8765/friendship3d-v2/index.html?studio=1&ci=1"
PAGE = None
DONE = []

async def pause(seconds=0.8):
    await PAGE.wait_for_timeout(int(seconds * 1000))

async def narrate(line, extra=0):
    start = time.monotonic() - START
    wait = max(2.4, min(12.0, len(line) * .24 + .8)) + extra
    CUES.append(dict(start=round(start, 3), end=round(start + wait - .18, 3), text=line))
    print("NARRATE", round(start, 1), line, flush=True)
    await pause(wait)

async def click(selector, pause_s=.8):
    node = PAGE.locator(selector).first
    await node.scroll_into_view_if_needed(timeout=10000)
    await pause(.2)
    await node.click(timeout=10000)
    await pause(pause_s)

async def api(method, *args):
    return await PAGE.evaluate(
        """([method,args]) => {
            const a=window.WatchStudioAPI;
            if(!a || typeof a[method]!=='function')throw Error('Studio API unavailable: '+method);
            return a[method](...args);
        }""", [method, list(args)]
    )

async def progress():
    return await api("progress")

async def task(task_id, speech=False, vocabulary=False, source=False):
    target = await api("target", task_id)
    name = target["label"].split("：")[0]
    await narrate("我们走向" + name + "。观察金色任务标记，再点击互动。")
    await api("approach", task_id, 2100)
    await pause(.6)
    await api("openCurrent")
    await PAGE.locator("#overlay:not(.hidden)").wait_for(timeout=10000)
    await narrate("打开对话框后，先看故事图片和对应段落的原文依据。")
    if source:
        await narrate("点击看回原文，就能检查支持人物判断的完整句子。")
        await click("#revisitBtn",1.0)
        await click("#returnQuestion",.65)
    if speech:
        await narrate("接下来只演示一次朗读原文功能。它会念原文，而不是念题目。")
        await click("#speakBtn",2.5)
        await click("#stopSpeechBtn",.4)
    if vocabulary:
        await narrate("词语库会提供拼音、英文和意思，帮助认读有困难的学生。")
        await click(".vocab-panel summary",1.0)
        await pause(.7)
    for step_index in range(4):
        step_type = await api("currentStepType")
        if not step_type:
            break
        await PAGE.locator(".stem").first.scroll_into_view_if_needed()
        await narrate("现在阅读问题，先找具体证据，再思考它反映的人物特点。")
        if step_type in ("singleChoice", "multiSelect", "keywordFill"):
            # Read only the current step's correct option IDs from the game's own data.
            ids = await PAGE.evaluate("""()=>{
                const s=window.WatchStudioAPI;return s.currentStepType();
            }""")
            await api("answerCurrent")
            await pause(.7)
        elif step_type == "categorize":
            await narrate("这题要拖放分类：把丽华的动作和语言，放进相应的证据框。")
            # Browser-facing clicks operate the same category assignment used for drag-and-drop.
            # The game moves each card to its assigned bucket and checks the result.
            await api("answerCurrent")
            await pause(1.0)
        elif step_type == "openResponse":
            await narrate("最后完成侦探笔记，运用句式从人物言行推断特点，并解释理由。")
            await click("#taskScaffoldBtn",.9)
            await api("answerCurrent")
            await pause(1.0)
        await narrate("按下完成，检查答案与反馈。正确后，才可以继续下一步。")
        await click("#checkBtn",.65)
        button = await PAGE.locator("#checkBtn").inner_text()
        if button.strip() != "继续":
            await PAGE.screenshot(path=str(BASE / ("failed_"+task_id+"_"+str(step_index)+".png")))
            raise RuntimeError("Answer was not accepted: " + task_id + ", step " + str(step_index) + ", button " + button)
        await click("#checkBtn",.55)
        current = await progress()
        if current["task"] != task_id:
            DONE.append(task_id)
            break

async def reading_helper(collected):
    await narrate("现在打开我的阅读助手，回顾找依据、作推论、联主题的三个步骤。")
    await click("#readAssistantBtn",1.0)
    if collected:
        await narrate("再点击回看已收集的证据，确认刚才的文本证据已保存。")
        await click("#assistantReview",1.1)
    await click("#closePanel",.5)

async def walkthrough():
    await narrate("欢迎进入《手表》三维友情侦探。示范从输入名字开始，然后逐项完成阅读任务。")
    await PAGE.locator("#intro:not(.hidden)").wait_for(timeout=12000)
    await PAGE.locator("#alias").fill("演示学生")
    await PAGE.locator("#classCode").fill("3G1")
    await narrate("输入侦探代号和班级三G一，点击开始行走探索。")
    await click("#startBtn", 1.2)
    await narrate("先打开拼音按钮。原文、题目和答案都能显示词语拼音。")
    await click("#pinyinBtn",1.5)
    await narrate("再按一次拼音按钮，文字恢复正常显示。")
    await click("#pinyinBtn",.8)
    await narrate("背景音乐也能通过右上角按钮随时关闭或打开。")
    await click("#musicBtn",.7)
    await click("#musicBtn",.7)
    await reading_helper(False)
    await task("L1_BIKE",speech=True,vocabulary=True,source=True)
    await reading_helper(True)
    await task("L1_LIHUA",source=True)
    await task("L1_INFERENCE")
    assert (await progress())["current"]==3, "First level not completed"
    await narrate("第一关完成。我们沿着校园道路走向学校大门，解锁第二关。")
    await api("walkTo",0,-4.6,2200)
    await api("enterLevel2")
    await pause(1)
    assert (await progress())["level"]==2, "Second level failed to unlock"
    await narrate("第二关是丽华家门口，地图和人物位置都跟着关卡改变。")
    await task("L2_WATCH",vocabulary=True,source=True)
    await task("L2_MOM",vocabulary=True)
    await task("L2_DOORBELL")
    await reading_helper(True)
    await task("L2_LIHUA",source=True)
    await task("L2_STATION")
    current=await progress()
    assert current["current"]==8, "Not all eight tasks completed: " + str(current)
    await narrate("两关全部完成。我们学会从言行寻找证据，合理推论人物，并理解体谅与珍惜友谊。",extra=1.4)
    await pause(1.2)

def srt_clock(t):
    h=int(t//3600);m=int(t//60)%60;s=int(t)%60;ms=int(t*1000)%1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def cmd(*args):
    print("CMD",list(args),flush=True)
    subprocess.run(list(args),check=True)

async def browser_record():
    global PAGE, START
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=[
            "--no-sandbox","--enable-webgl","--ignore-gpu-blocklist",
            "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader",
            "--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"
        ])
        context=await browser.new_context(
            viewport={"width":1440,"height":810},device_scale_factor=1,
            record_video_dir=str(BASE/"raw"),record_video_size={"width":1440,"height":810},
            accept_downloads=True
        )
        PAGE=await context.new_page()
        PAGE.on("pageerror",lambda e:print("PAGEERROR:",str(e)[:500],flush=True))
        PAGE.set_default_timeout(15000)
        START=time.monotonic()
        await PAGE.goto(GAME,wait_until="domcontentloaded",timeout=60000)
        await PAGE.wait_for_function("window.WatchStudioAPI && window.WatchStudioAPI.ready()",timeout=120000)
        await PAGE.locator("#loading.hidden").wait_for(timeout=30000)
        try:
            await walkthrough()
        except Exception as err:
            print("WALKTHROUGH ERROR:",repr(err),flush=True)
            await PAGE.screenshot(path=str(BASE/"failure.png"),full_page=False)
            raise
        finally:
            video=PAGE.video
            await context.close()
            if video:
                try:
                    await video.save_as(str(BASE/"original_gameplay.webm"))
                except Exception as e:
                    print("VIDEO_SAVE_ERROR",e,flush=True)
            await browser.close()
    (BASE/"cues.json").write_text(json.dumps(CUES,ensure_ascii=False,indent=2),encoding="utf-8")
    (BASE/"done.json").write_text(json.dumps(DONE,ensure_ascii=False,indent=2),encoding="utf-8")
    with (BASE/"解说字幕.srt").open("w",encoding="utf-8") as f:
        for i,e in enumerate(CUES):
            f.write(f"{i+1}\n{srt_clock(e['start'])} --> {srt_clock(e['end'])}\n{e['text']}\n\n")
    print("RECORD_OK",len(CUES),len(DONE),flush=True)

async def make_tts():
    import edge_tts
    sem=asyncio.Semaphore(4)
    async def generate(i,line):
        out=BASE/f"narration_{i:03d}.mp3"
        async with sem:
            for attempt in range(2):
                try:
                    tts=edge_tts.Communicate(line,voice="zh-CN-XiaoxiaoNeural",rate="+8%",volume="-15%")
                    await tts.save(str(out))
                    if out.stat().st_size > 200:
                        return True
                except Exception as exc:
                    print("EDGE_TTS_RETRY",i,attempt,exc,flush=True)
                    await asyncio.sleep(1.5)
        return False
    success=await asyncio.gather(*(generate(i,e["text"]) for i,e in enumerate(CUES)))
    if sum(success)<len(CUES):
        print("EDGE_TTS_FALLBACK_ESPEAK",sum(success),len(CUES),flush=True)
        for i,ok in enumerate(success):
            if not ok:
                wav=BASE/f"narration_{i:03d}.wav"
                subprocess.run(["espeak-ng","-v","zh","-s","150","-w",str(wav),CUES[i]["text"]],check=True)
    return success

def add_audio():
    from pydub import AudioSegment
    from pydub.generators import Sine
    import numpy as np
    import wave
    src=BASE/"original_gameplay.webm"
    p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(src)],capture_output=True,text=True,check=True)
    duration=float(p.stdout.strip())+0.4
    soundtrack=AudioSegment.silent(duration=int(duration*1000),frame_rate=24000).set_channels(1)
    # Original soft, playful notes.  This is an edited backing track, not captured browser audio.
    loop_ms=11200
    melody=[(0,523,.26),(450,659,.20),(900,784,.27),(1800,659,.18),
            (2300,587,.29),(3200,698,.23),(4000,659,.21),(4900,523,.30),
            (6000,493,.22),(6600,587,.22),(7400,659,.26),(8300,784,.26),
            (9100,659,.22),(9800,587,.20)]
    phrase=AudioSegment.silent(duration=loop_ms,frame_rate=24000).set_channels(1)
    for at,hz,seconds in melody:
        tone=Sine(hz,sample_rate=24000).to_audio_segment(duration=int(seconds*1000)).fade_in(18).fade_out(min(220,int(seconds*1000)//2)).apply_gain(-33)
        phrase=phrase.overlay(tone,position=at)
    for at in range(0,int(duration*1000),loop_ms):
        soundtrack=soundtrack.overlay(phrase,position=at)
    # Narration loud enough for teaching but always lower than startling in-browser default.
    for i,e in enumerate(CUES):
        mp3=BASE/f"narration_{i:03d}.mp3"
        wav=BASE/f"narration_{i:03d}.wav"
        file=mp3 if mp3.exists() and mp3.stat().st_size>200 else wav
        if not file.exists():
            continue
        piece=AudioSegment.from_file(str(file)).set_frame_rate(24000).set_channels(1).apply_gain(-3.5)
        piece=piece.fade_in(30).fade_out(80)
        soundtrack=soundtrack.overlay(piece,position=int(e["start"]*1000))
    soundtrack=soundtrack.fade_in(1100).fade_out(1700)
    soundtrack.export(str(BASE/"audio_mix.wav"),format="wav")
    # Burn teaching subtitles as part of the final distributable MP4.
    subt=str(BASE/"解说字幕.srt")
    cmd("ffmpeg","-hide_banner","-y","-i",str(src),"-i",str(BASE/"audio_mix.wav"),
        "-vf","subtitles="+subt+":force_style='FontName=Noto Sans CJK SC,Fontsize=17,PrimaryColour=&H00FFFFFF,OutlineColour=&H00243D2D,BorderStyle=1,Outline=2,Shadow=1,MarginV=28,Alignment=2'",
        "-c:v","libx264","-preset","veryfast","-crf","24","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","128k","-map","0:v:0","-map","1:a:0",
        "-shortest","-movflags","+faststart",str(BASE/"手表_3D友情侦探_游戏解说.mp4"))
    print("VIDEO_FINAL",str(BASE/"手表_3D友情侦探_游戏解说.mp4"),flush=True)

async def main():
    await browser_record()
    await make_tts()
    add_audio()

if __name__=="__main__":
    asyncio.run(main())
