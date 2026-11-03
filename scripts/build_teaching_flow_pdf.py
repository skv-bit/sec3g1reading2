#!/usr/bin/env python3
"""Build a curated Chinese teaching-flow PDF from the newest headless gameplay recording."""
from pathlib import Path
import subprocess, json, re
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.utils import ImageReader
from PIL import Image

BASE=Path("recorded_demo")
BASE.mkdir(exist_ok=True)
VIDEO=BASE/"original_gameplay.webm"
CUES=BASE/"cues.json"
OUT=BASE/"手表_最新版_教学流程精选.pdf"
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
FONT="STSong-Light"
PAGE_W,PAGE_H=1260,810

STAGES=[
("游戏登入与学习目标","欢迎进入","启动学习", "输入学生代号，明确寻找言行线索的学习目标"),
("学习支持：拼音开关","点开拼音","差异化支持","展示拼音开启和关闭；只演示一次"),
("学习支持：音乐控制","音乐也可以","自主调节","减少背景音乐对阅读的干扰"),
("阅读助手：三步策略","打开我的阅读助手","元认知提示","根据题目来作答，找依据、作推论、联主题"),
("第一关：校园线索","第一关，从脚踏车","教师示范","教师出声思考，示范如何从动作找到证据"),
("看回原文","先点看回原文","回读文本","完整段落帮助学生核对证据"),
("朗读示范","这里示范一次朗读","多模态支持","仅展示第一道题的原文朗读"),
("词语提示","再打开一次词语提示","认读支援","按需查看词语的拼音、English 与意思"),
("题目与作答","阅读问题","形成性练习","学生依据第3段回答题目"),
("即时检查与继续","按完成检查答案","反馈与调节","作答后检查，正确才能解锁下一步"),
("阅读助手：证据回看","现在回到阅读助手","学习监控","回看已收集的证据，检查自己的理解"),
("丽华：受伤后的关心","接着看丽华","双证据整合","联系第3、4段辨识丽华关心朋友的言行"),
("第一关：作推论","把两处言行连起来","人物分析","从两处文本依据推论人物特点并说出原因"),
("第一关完成与解锁","第一关完成","学习路径","从校园场景进入丽华家门前"),
("第二关：门前场景","这里是丽华家门前","情境迁移","学生独立寻找下一个任务点"),
("第二关：手表","第二关先完成手表","礼物与心意","理解名贵手表与友谊的关系"),
("妈妈生气","接下来，根据第六段","人物冲突","根据妈妈言行理解换回手表的原因"),
("门铃前的犹豫","来到门铃","人物心理","从伸手又缩回的动作推论内心担忧"),
("丽华归还手表","根据第八段","深层推论","找出归还手表、安慰朋友的言行"),
("动作与语言分类","这题用拖放分类","证据分类","将行动和语言卡片放进正确框"),
("证据集合站","最后来到证据集合站","综合人物特点","连接第3、4、8段的前后表现"),
("侦探笔记：差异化鹰架","选用合适的鹰架","个性化支架","在三级支架中选择合适的帮助程度"),
("笔记提交","提交笔记后","学习成果","用两处言行和解释形成个人笔记"),
("自评检查表","再用三项学习标准","元认知与反馈","检查是否具备证据、人物特点及合理理由"),
("笔记展示与复制","最后显示刚才提交的笔记","可见的学习成果","复制笔记，带回课堂共同讨论和修改"),
("任务完成","两关任务完成","迁移准备","总结学习策略，为新文本运用做准备")
]

def duration(filename):
    p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(filename)],text=True,capture_output=True,check=True)
    return float(p.stdout.strip())

def screenshot(t,target):
    subprocess.run(["ffmpeg","-v","error","-y","-ss",str(round(t,3)),"-i",str(VIDEO),"-frames:v","1","-q:v","3",str(target)],check=True)
    return target.exists()

def write_wrapped(c,text,x,y,width=60,leading=24):
    # Chinese characters are roughly one character in STSong; for short notes, fixed line widths work well.
    for n in range(0,len(text),width):
        c.drawString(x,y-(n//width)*leading,text[n:n+width])

def section_page(c,index,title,le,focus,description,img,time_s):
    c.setFillColorRGB(.986,.986,.956);c.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
    c.setFillColorRGB(.18,.47,.38);c.rect(0,PAGE_H-12,PAGE_W,12,fill=1,stroke=0)
    c.setFillColorRGB(.13,.36,.30);c.setFont(FONT,29);c.drawString(45,PAGE_H-58,title)
    c.setFillColorRGB(.37,.48,.44);c.setFont(FONT,15);c.drawRightString(PAGE_W-46,PAGE_H-54,f"课堂学习体验 / {le}")
    with Image.open(img) as im:
        iw,ih=im.size
        avail_w=PAGE_W-90; avail_h=620
        scale=min(avail_w/iw,avail_h/ih);w,h=iw*scale,ih*scale
        xp=(PAGE_W-w)/2;yp=PAGE_H-90-h
        c.setStrokeColorRGB(.79,.84,.74);c.setLineWidth(2);c.roundRect(xp-2,yp-2,w+4,h+4,11,stroke=1,fill=0)
        c.drawImage(ImageReader(im),xp,yp,w,h)
    c.setFillColorRGB(.18,.38,.32);c.setFont(FONT,18)
    footer_y=max(52,yp-40)
    write_wrapped(c,"教学关注："+description,45,footer_y,width=66)
    c.setFillColorRGB(.49,.54,.50);c.setFont(FONT,12)
    c.drawRightString(PAGE_W-42,25,f"画面 {index:02d}  |  录像 {int(time_s//60):02d}:{int(time_s%60):02d}")
    c.showPage()

def main():
    if not VIDEO.exists() or not CUES.exists():
        raise SystemExit("No current gameplay recording or cues.json found")
    cues=json.loads(CUES.read_text(encoding="utf-8"))
    max_t=duration(VIDEO)
    outdir=BASE/"pdf_frames";outdir.mkdir(exist_ok=True)
    c=canvas.Canvas(str(OUT),pagesize=(PAGE_W,PAGE_H),pageCompression=1)
    c.setTitle("《手表》3D友情侦探：最新版教学流程精选")
    c.setAuthor("教学流程录屏精编")
    c.setFillColorRGB(.98,.986,.954);c.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
    c.setFont(FONT,43);c.setFillColorRGB(.14,.39,.32)
    c.drawString(92,620,"《手表》3D友情侦探")
    c.setFont(FONT,38);c.drawString(92,548,"最新版 · 教学流程精选")
    c.setFont(FONT,22);c.setFillColorRGB(.35,.46,.40)
    c.drawString(92,460,"I Do 教师示范  →  We Do 共同探究  →  侦探笔记与自评")
    c.setFont(FONT,17);c.drawString(92,385,"从言行寻找文本依据，整合证据作出推论，理解友谊与心意。")
    c.drawString(92,342,"图片全部截取自本次自动操作的真实游戏录屏；相同功能仅展示一次。")
    c.setFont(FONT,15);c.drawString(92,112,"取自 GitHub 最新游戏代码的演示录像（自动操作）")
    c.showPage()
    idx=0
    for title,needle,le,desc in STAGES:
        matches=[(i,q) for i,q in enumerate(cues) if needle in q["text"]]
        if not matches:continue
        i,q=matches[0]
        next_s=float(cues[i+1]["start"]) if i+1<len(cues) else max_t
        start=float(q["start"]);end=min(next_s,max_t-.2)
        # Sample late in the narration segment; task narration precedes the actual dialog.
        delta=(end-start)
        if "第一关，从脚踏车" in needle or title.startswith("第二关：手表") or title.startswith("妈妈生气"):
            t=max(start+.3,min(max_t-.25,end-.5))
        else:
            t=max(start+.25,min(max_t-.25,start+min(2.9,delta*.68)))
        if title=="侦探笔记：差异化鹰架":t=min(max_t-.25,start+min(3.2,delta*.75))
        if title=="笔记提交":t=min(max_t-.25,start+min(2.1,delta*.58))
        fn=outdir/f"frame_{idx+1:02}.jpg"
        if screenshot(t,fn):
            idx+=1
            section_page(c,idx,title,le,le,desc,fn,t)
    c.save()
    print("PDF_DONE",OUT,"pages",idx+1,"bytes",OUT.stat().st_size,flush=True)

if __name__=="__main__":
    main()
