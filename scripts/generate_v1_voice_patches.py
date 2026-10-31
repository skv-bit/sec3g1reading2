import asyncio
from pathlib import Path
import edge_tts
P=Path("voice_patch_v1")
P.mkdir(exist_ok=True)
texts={
"question":"现在阅读问题，根据题目来作答。",
"vocab":"点击词语提示，查看词语的拼音和意思。",
"assistant":"再打开我的阅读助手，查看刚才收集的证据。",
}
async def generate(name,txt):
    for n in range(3):
        try:
            await edge_tts.Communicate(txt,voice="zh-CN-XiaoxiaoNeural",rate="+8%",volume="-15%").save(str(P/f"{name}.mp3"))
            assert (P/f"{name}.mp3").stat().st_size>500
            print(name,(P/f"{name}.mp3").stat().st_size,flush=True)
            return
        except Exception as e:
            print("retry",name,n,str(e),flush=True)
            await asyncio.sleep(2)
    raise RuntimeError(name)
async def main():
    await asyncio.gather(*(generate(name,txt) for name,txt in texts.items()))
asyncio.run(main())
