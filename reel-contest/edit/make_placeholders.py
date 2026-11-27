#!/usr/bin/env python3
"""編集スクリプトの動作確認用に、仮のクリップと仮の音を placeholder/ に作る。

本物の素材（clips/ と audio/）には触れない。
"""
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
cfg = json.loads((HERE / "timeline.json").read_text(encoding="utf-8"))
font = HERE / cfg["font_caption"]
clips = HERE / "placeholder/clips"
audio = HERE / "placeholder/audio"
clips.mkdir(parents=True, exist_ok=True)
audio.mkdir(parents=True, exist_ok=True)


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


for c in cfg["cuts"]:
    label = f"{c['id']}（仮）"
    ff("-f", "lavfi", "-i", "testsrc2=s=720x1280:r=30", "-t", "5",
       "-vf", f"drawtext=fontfile={font}:text='{label}':fontsize=64:fontcolor=white:"
              "box=1:boxcolor=black@0.5:x=(w-tw)/2:y=h*0.85",
       "-c:v", "libx264", "-pix_fmt", "yuv420p", str(clips / c["file"]))

# 明るいBGMの代わり（和音）、子どもの笑い声の代わり（ピンクノイズ）、ピコン
ff("-f", "lavfi", "-i", "sine=f=523:d=60", "-f", "lavfi", "-i", "sine=f=659:d=60",
   "-f", "lavfi", "-i", "sine=f=784:d=60", "-filter_complex", "amix=inputs=3,volume=0.6",
   str(audio / "bgm.mp3"))
ff("-f", "lavfi", "-i", "anoisesrc=c=pink:d=15:a=0.2", str(audio / "child_laugh.mp3"))
ff("-f", "lavfi", "-i", "sine=f=1760:d=0.12", "-af", "afade=t=out:st=0.04:d=0.08", str(audio / "pico.wav"))
print(f"仮素材を作成しました: {HERE / 'placeholder'}")
