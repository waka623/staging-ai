#!/usr/bin/env python3
"""リール動画の編集スクリプト。

timeline.json の指示どおりに、クリップの切り出し → 色の調整 → 頭上の数字・テロップの合成 →
音の配置 → 書き出し までを行う。

使い方:
  python3 build.py                     # clips/ と audio/ の素材で本番書き出し
  python3 build.py --placeholder       # テスト用の仮素材（make_placeholders.py で作成）で書き出し
  python3 build.py --only C03 C05      # 指定したカットだけ作り直す（確認用）
  python3 build.py --stills            # 書き出し後に確認用の静止画（1秒ごと）も作る
"""
import argparse
import json
import math
import random
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent


# ---------------------------------------------------------------- 共通の小道具
def lerp_keys(keys, t, default=None):
    """[[t, v], ...] を t で直線補間する。keys が無ければ default。"""
    if not keys:
        return default
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            if t1 == t0:
                return v1
            a = (t - t0) / (t1 - t0)
            return v0 + (v1 - v0) * a
    return keys[-1][1]


def ease_keys(keys, t):
    """数字のカウントアップ用。区間ごとに ease-out で補間する。"""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            a = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            a = 1 - (1 - a) ** 3
            return v0 + (v1 - v0) * a
    return keys[-1][1]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit(f"ffmpeg が失敗しました: {' '.join(cmd[:6])} ...")
    return r


def probe_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None


# ---------------------------------------------------------------- 数字（バッジ）
class BadgeRenderer:
    def __init__(self, font_path, style):
        self.font_path = font_path
        self.style = style
        self.cache = {}

    def image(self, text, size, color):
        key = (text, size, color)
        if key in self.cache:
            return self.cache[key]
        font = ImageFont.truetype(str(self.font_path), size)
        l, t, r, b = font.getbbox(text)
        tw, th = r - l, b - t
        px, py = int(size * 0.45), int(size * 0.28)
        w, h = tw + px * 2, th + py * 2
        pad = int(size * 0.5)  # 光彩のぶんの余白
        img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        bg = tuple(self.style["pill_rgba"])
        d.rounded_rectangle([pad, pad, pad + w, pad + h], radius=h // 2, fill=bg)
        rgb = hex_rgb(color)
        # 光彩
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).text((pad + px - l, pad + py - t), text, font=font, fill=rgb + (200,))
        glow = glow.filter(ImageFilter.GaussianBlur(size * 0.18))
        img = Image.alpha_composite(img, glow)
        ImageDraw.Draw(img).text((pad + px - l, pad + py - t), text, font=font, fill=rgb + (255,))
        self.cache[key] = img
        return img


def expand_crowds(badges, seed_base=0):
    """{"crowd": {...}} を、ランダムな位置と値を持つ複数のバッジに展開する。"""
    out = []
    for i, b in enumerate(badges):
        c = b.get("crowd")
        if not c:
            out.append(b)
            continue
        rnd = random.Random(c.get("seed", seed_base + i))
        x0, y0, x1, y1 = c["region"]
        for k in range(c["n"]):
            v = int(math.exp(rnd.uniform(math.log(c["min"]), math.log(c["max"]))))
            appear = c.get("appear", 0) + rnd.uniform(0, c.get("stagger", 0))
            nb = {k2: v2 for k2, v2 in b.items() if k2 != "crowd"}
            nb.update({
                "x": rnd.uniform(x0, x1), "y": rnd.uniform(y0, y1),
                "values": [[0, v]],
                "size": int(c.get("size", 36) * rnd.uniform(0.8, 1.2)),
                "alpha": [[appear, 0], [appear + 0.25, 1]] if "alpha" not in b else b["alpha"],
            })
            out.append(nb)
    return out


def draw_badges(canvas, badges, t, renderer, W, H):
    for b in badges:
        if "values" in b:
            v = ease_keys(b["values"], t)
            text = b.get("prefix", "") + f"{int(round(v)):,}"
        else:
            text = b["text"]
        alpha = lerp_keys(b.get("alpha"), t, 1.0)
        if alpha <= 0.01:
            continue
        color = b.get("color", "#FFFFFF")
        bl = b.get("blink")
        if bl and bl["t0"] <= t <= bl["t1"]:
            if int((t - bl["t0"]) * bl.get("hz", 4) * 2) % 2 == 0:
                color = bl.get("color", "#FF2A2A")
        scale = lerp_keys(b.get("scale"), t, 1.0)
        x, y = b["x"], b["y"]
        if "path" in b:
            x = lerp_keys([[p[0], p[1]] for p in b["path"]], t)
            y = lerp_keys([[p[0], p[2]] for p in b["path"]], t)
        conv = lerp_keys(b.get("converge"), t, 0.0)
        if conv:
            cx, cy = b.get("center", [0.5, 0.5])
            x, y = x + (cx - x) * conv, y + (cy - y) * conv
        sx = sy = 0
        sh = b.get("shake")
        if sh and sh.get("t0", 0) <= t <= sh.get("t1", 1e9):
            sx = math.sin(t * 53.1) * sh["px"]
            sy = math.cos(t * 47.3) * sh["px"]
        img = renderer.image(text, max(8, int(b.get("size", 64) * scale)), color)
        if alpha < 1:
            a = img.getchannel("A").point(lambda p: int(p * alpha))
            img = img.copy()
            img.putalpha(a)
        cx, cy = int(x * W + sx - img.width / 2), int(y * H + sy - img.height / 2)
        canvas.paste(img, (cx, cy), img)

        cf = b.get("confetti")
        if cf and t >= cf["t0"]:
            draw_confetti(canvas, cf, t - cf["t0"], x * W, y * H, renderer)


def draw_confetti(canvas, cf, dt, ox, oy, renderer):
    life = cf.get("dur", 1.6)
    if dt > life:
        return
    rnd = random.Random(cf.get("seed", 7))
    for _ in range(cf.get("n", 40)):
        ang = rnd.uniform(-math.pi, 0)  # 上方向へ散る
        spd = rnd.uniform(500, 1300)
        vx, vy = math.cos(ang) * spd, math.sin(ang) * spd
        g = 1800
        px = ox + vx * dt
        py = oy + vy * dt + 0.5 * g * dt * dt
        txt = rnd.choice(cf.get("texts", ["+1", "+12", "+48", "+120", "+300", "♥"]))
        col = rnd.choice(cf.get("colors", ["#FFFFFF", "#FFD84A", "#FF6FA8", "#59D8FF"]))
        img = renderer.image(txt, rnd.randint(22, 40), col)
        a = max(0.0, 1 - dt / life)
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda p: int(p * a)))
        canvas.paste(img, (int(px - img.width / 2), int(py - img.height / 2)), img)


# ---------------------------------------------------------------- テロップ
def draw_captions(canvas, caps, t, font_path, W, H, cache):
    for c in caps:
        if not (c["t0"] <= t <= c["t1"]):
            continue
        fade = c.get("fade", 0.3)
        a = min(1.0, (t - c["t0"]) / fade if fade else 1, (c["t1"] - t) / fade if fade else 1)
        key = (c["text"], c.get("size", 72))
        if key not in cache:
            font = ImageFont.truetype(str(font_path), c.get("size", 72))
            tmp = Image.new("RGBA", (W, H // 2), (0, 0, 0, 0))
            d = ImageDraw.Draw(tmp)
            d.multiline_text((W // 2, H // 4), c["text"], font=font, fill=(255, 255, 255, 255),
                             anchor="mm", align="center", spacing=int(c.get("size", 72) * 0.35),
                             stroke_width=max(3, c.get("size", 72) // 14), stroke_fill=(0, 0, 0, 230))
            cache[key] = tmp
        img = cache[key]
        if a < 1:
            img = img.copy()
            img.putalpha(img.getchannel("A").point(lambda p: int(p * a)))
        canvas.paste(img, (0, int(c.get("y", 0.7) * H - H // 4)), img)


# ---------------------------------------------------------------- 色
def grade(frame, gt, cut, color_cfg, mask_cache):
    """frame: HxWx3 uint8。gt: 作品全体での経過秒。"""
    f = frame.astype(np.float32)
    sat = lerp_keys(color_cfg["saturation"], gt, 1.0)
    bri = lerp_keys(color_cfg.get("brightness"), gt, 1.0)
    gray = (f[..., 0] * 0.299 + f[..., 1] * 0.587 + f[..., 2] * 0.114)[..., None]
    m = cut.get("color_mask")
    if m:
        H, W = frame.shape[:2]
        key = (cut["id"], W, H)
        if key not in mask_cache:
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            d = np.sqrt(((xx / W - m["cx"]) * W / H) ** 2 + (yy / H - m["cy"]) ** 2)
            r, soft = m.get("r", 0.25), m.get("soft", 0.12)
            mask_cache[key] = np.clip((r + soft - d) / soft, 0, 1)[..., None]
        mk = mask_cache[key]
        s = sat + (m.get("sat", 1.0) - sat) * mk
    else:
        s = sat
    out = gray + (f - gray) * s
    out *= bri
    return np.clip(out, 0, 255).astype(np.uint8)


def blur_region(img, br, W, H):
    x0, y0, x1, y1 = [int(v * (W if i % 2 == 0 else H)) for i, v in enumerate(br["box"])]
    region = img.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(br.get("radius", 20)))
    mask = Image.new("L", region.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, region.width, region.height], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(br.get("radius", 20)))
    img.paste(region, (x0, y0), mask)


# ---------------------------------------------------------------- カットの書き出し
def render_cut(cut, gstart, cfg, clips_dir, tmp_dir, renderer):
    W, H, fps = cfg["width"], cfg["height"], cfg["fps"]
    dur = cut["dur"]
    nframes = int(round(dur * fps))
    src = clips_dir / cut["file"]
    out = tmp_dir / f"{cut['id']}.mp4"

    if src.exists():
        vf = (f"fps={fps},scale={W}:{H}:force_original_aspect_ratio=increase,"
              f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*{cut.get('crop_y', 0.5)},"
              f"tpad=stop_mode=clone:stop_duration={dur}")
        dec = ["ffmpeg", "-v", "error", "-ss", str(cut.get("in", 0)), "-i", str(src),
               "-vf", vf, "-frames:v", str(nframes), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    else:
        print(f"  ! {src} が無いため、{cut['id']} は黒い画面で仮作成します")
        dec = ["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"color=c=0x202020:s={W}x{H}:r={fps}",
               "-frames:v", str(nframes), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]

    enc = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", str(out)]

    pd = subprocess.Popen(dec, stdout=subprocess.PIPE)
    pe = subprocess.Popen(enc, stdin=subprocess.PIPE)
    badges = expand_crowds(cut.get("badges", []))
    caps = cut.get("captions", [])
    mask_cache, cap_cache = {}, {}
    fsize = W * H * 3
    last = None
    for i in range(nframes):
        buf = pd.stdout.read(fsize)
        if len(buf) < fsize:
            buf = last if last is not None else bytes(fsize)
        last = buf
        t = i / fps
        frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        frame = grade(frame, gstart + t, cut, cfg["color"], mask_cache)
        img = Image.fromarray(frame).convert("RGBA")
        br = cut.get("blur")
        if br and br.get("enabled"):
            blur_region(img, br, W, H)
        draw_badges(img, badges, t, renderer, W, H)
        draw_captions(img, caps, t, HERE / cfg["font_caption"], W, H, cap_cache)
        pe.stdin.write(img.convert("RGB").tobytes())
    pd.stdout.close()
    pd.wait()
    pe.stdin.close()
    if pe.wait() != 0:
        raise SystemExit(f"{cut['id']} の書き出しに失敗しました")
    return out


# ---------------------------------------------------------------- 音
def build_audio(cfg, audio_dir, total, out_path):
    inputs, chains, labels = [], [], []
    for cue in cfg["audio"]:
        src = audio_dir / cue["file"]
        if not src.exists():
            print(f"  ! 音声 {src} が無いため、{cue['at']}秒の音を省きます")
            continue
        idx = len(labels)
        inputs += ["-i", str(src)]
        f = [f"atrim=start={cue.get('in', 0)}" + (f":duration={cue['dur']}" if cue.get("dur") else ""),
             "asetpts=PTS-STARTPTS", "aresample=48000", "aformat=channel_layouts=stereo"]
        if cue.get("af"):
            f.append(cue["af"])
        if cue.get("fade_in"):
            f.append(f"afade=t=in:d={cue['fade_in']}")
        if cue.get("fade_out") and cue.get("dur"):
            f.append(f"afade=t=out:st={cue['dur'] - cue['fade_out']}:d={cue['fade_out']}")
        f.append(f"volume={cue.get('gain_db', 0)}dB")
        ms = int(cue["at"] * 1000)
        f.append(f"adelay={ms}|{ms}")
        chains.append(f"[{idx}:a]{','.join(f)}[a{idx}]")
        labels.append(f"[a{idx}]")
    if not labels:
        run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
             "-t", str(total), "-c:a", "pcm_s16le", str(out_path)])
        return
    # 無音の土台を最初に入れて、全体の長さを total にそろえる
    inputs += ["-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=48000:cl=stereo"]
    base = len(labels)
    mix = (";".join(chains) + f";[{base}:a]anull[base];"
           f"[base]{''.join(labels)}amix=inputs={len(labels) + 1}:normalize=0:duration=first,"
           f"atrim=duration={total},loudnorm=I={cfg.get('loudness_lufs', -14)}:TP=-1.5:LRA=11,"
           f"aresample=48000[out]")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", mix, "-map", "[out]",
         "-c:a", "pcm_s16le", str(out_path)])


# ---------------------------------------------------------------- 本体
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", default=str(HERE / "timeline.json"))
    ap.add_argument("--placeholder", action="store_true", help="テスト用の仮素材を使う")
    ap.add_argument("--only", nargs="*", help="作り直すカットID（他は前回の結果を使う）")
    ap.add_argument("--stills", action="store_true", help="確認用の静止画を書き出す")
    a = ap.parse_args()

    cfg = json.loads(Path(a.timeline).read_text(encoding="utf-8"))
    clips_dir = HERE / ("placeholder/clips" if a.placeholder else "clips")
    audio_dir = HERE / ("placeholder/audio" if a.placeholder else "audio")
    out_dir = HERE / "out"
    tmp_dir = out_dir / ("tmp_placeholder" if a.placeholder else "tmp")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    renderer = BadgeRenderer(HERE / cfg["font_badge"], cfg["badge_style"])

    total = round(sum(c["dur"] for c in cfg["cuts"]), 3)
    limit = cfg.get("max_seconds", 60)
    if total > limit:
        raise SystemExit(f"合計 {total} 秒が上限 {limit} 秒を超えています")
    print(f"合計 {total} 秒 / {len(cfg['cuts'])} カット")

    parts, g = [], 0.0
    for cut in cfg["cuts"]:
        p = tmp_dir / f"{cut['id']}.mp4"
        if a.only is None or cut["id"] in a.only or not p.exists():
            print(f"- {cut['id']} ({g:.1f}〜{g + cut['dur']:.1f}秒) を作成中")
            p = render_cut(cut, g, cfg, clips_dir, tmp_dir, renderer)
        parts.append(p)
        g += cut["dur"]

    lst = tmp_dir / "concat.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\n" for p in parts), encoding="utf-8")
    video = tmp_dir / "video.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video)])

    print("- 音を作成中")
    audio = tmp_dir / "audio.wav"
    build_audio(cfg, audio_dir, total, audio)

    name = "reel_placeholder.mp4" if a.placeholder else "reel.mp4"
    final = out_dir / name
    run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-i", str(audio),
         "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-t", str(total), "-movflags", "+faststart", str(final)])
    d = probe_duration(final)
    print(f"書き出し完了: {final}（{d:.2f}秒）")

    if a.stills:
        sd = out_dir / ("stills_placeholder" if a.placeholder else "stills")
        shutil.rmtree(sd, ignore_errors=True)
        sd.mkdir()
        run(["ffmpeg", "-v", "error", "-y", "-i", str(final), "-vf", "fps=1,scale=360:-2",
             str(sd / "t%02d.jpg")])
        print(f"静止画: {sd}")


if __name__ == "__main__":
    main()
