# Google Vids 用プロンプト：10〜60秒（冒頭10秒の続き）

前提：0〜10秒（シーン1〜3）は生成済み。10秒以降は**シーン3で着替えた韓国風レイヤードコーデのまま**進める（同じ日の出来事なので服を戻さない）。

使い方
1. 冒頭10秒から、主人公の顔と服がよく見えるフレームを1枚書き出し、参考画像として毎回添付する（Vidsで添付できる場合）
2. **A** を Gemini（Help me create／シーンの追加）に貼り、続きのストーリーボードを作る
3. 映像が意図とずれたシーンだけ、**B** の英語プロンプトで1つずつ生成し直す

---

## A. 続きの全体指示（日本語）

```
今ある0〜10秒の動画の続きとして、10〜60秒の11シーン（合計50秒）を作ってください。
縦型9:16、セリフなし・ナレーションなし、実写風（シネマティック、35mmフィルム風、浅い被写界深度）。
冒頭10秒と同じ主人公・同じ画質・同じ色味でつなげてください。

主人公：冒頭と同じ20歳の日本人の男子大学生。細身、明るく人当たりのいい顔、明るい茶髪のセンターパート、眼鏡なし。
服装は冒頭10秒の最後で着替えた服のまま：白シャツにクリーム色のニットベスト、ワイドスラックス、白スニーカー、無地の黒いトートバッグ。
舞台：秋の東京、都心の現代的な大学キャンパス（ガラス張りの校舎、紅葉）。10〜40秒は昼、40秒以降は夕方の暖かい光。

物語の流れ：周りの目に合わせるほど評価は上がるが、だんだん自分を見失う（10〜40秒）。数字のない子どもと出会い、素の自分に戻る（40〜55秒）。最後に視聴者へ問いかける（55〜60秒）。

10-15秒：キャンパスで友人の輪の中、主人公は少し遅れて周りに合わせて笑う。作り笑い。
15-20秒：おしゃれなカフェで、ラテアートをスマホで角度を変えながら何度も撮る。
20-25秒：ベンチで、自分が踊っている動画を投稿しかけるが、近くの学生の視線を気にして迷い、下書きのまま削除する。
25-30秒：トイレの鏡に映った主人公の顔だけがぼやけている。静かな場面。
30-35秒：下から見上げる構図。周りの学生が無表情で主人公を見下ろし、主人公は小さく見える。
35-40秒：主人公が自分の頭の上の空中を両手で必死に振り払う。手持ちカメラで揺れる。
40-45秒：夕方の小さな公園。5歳くらいの子どもが泥遊びをして、無邪気に笑っている。
45-50秒：泥だらけのボールが転がってきて、主人公が思わず受け取る。手が泥で汚れる。
50-55秒：主人公がボールを持ったまま、素の笑顔になる（顔のアップ、夕日）。
55-60秒：スマホを見ている学生を正面から撮る（画面の向こうの視聴者に見立てる）。最後にゆっくりカメラの方を見上げる。テロップ「その数字、誰のため？」

音：10〜20秒は明るいBGMがテンポアップし、通知音「ピコン」が連打される。20〜35秒はBGMがだんだん暗くなる。35〜40秒でBGMが歪む。40〜55秒はBGMを止めて子どもの笑い声だけ。最後は「ピコン」1回で終わる。
映像に文字・数字・ロゴ・看板を入れないでください（頭上の数字は後から編集で入れます）。最後のテロップ以外の文字は不要です。
```

---

## B. シーンごとの映像プロンプト（英語・生成し直し用）

[CHAR]（10秒以降の主人公）：
`the same young man as in the reference image: a 20-year-old Japanese male university student, slim, friendly face, light brown center-part hair, no glasses, wearing a white shirt under a cream knit vest, wide-leg slacks, white sneakers, plain black tote bag`

共通で末尾に付ける文：
`Photorealistic, cinematic, shot on 35mm, shallow depth of field, vertical 9:16, autumn in Tokyo, same color grading as the previous shots. No text, no numbers, no logos, no signs.`

| # | 秒 | プロンプト |
|---|---|---|
| 4 | 10-15 | [CHAR] stands in a circle of laughing friends on a modern university campus plaza in daylight; he laughs along a beat late, a slightly forced smile; handheld camera. |
| 5 | 15-20 | [CHAR] in a stylish cafe holds up his smartphone and photographs a cup of latte art again and again, carefully adjusting the angle; daylight from the window. |
| 6 | 20-25 | [CHAR] sits on a campus bench watching a video of himself dancing on his phone; his thumb hovers over the post button, he glances at nearby students, hesitates, then deletes it. |
| 7 | 25-30 | Close-up of a restroom mirror: the reflection of [CHAR] is out of focus and blurry while the mirror frame is sharp; still and quiet, cool light. |
| 8 | 30-35 | Low-angle shot from below: [CHAR] small in the center of the campus plaza, surrounding students stand over him and look down with blank faces; slow rotation. |
| 9 | 35-40 | [CHAR] on the campus plaza frantically swats at the empty air above his own head with both hands, frustrated and anxious; shaky handheld camera. |
| 10 | 40-45 | Small neighborhood park at golden hour: a 5-year-old Japanese child happily plays in a mud puddle, laughing freely, mud on hands and clothes; warm light. |
| 11 | 45-50 | Golden hour park: a muddy ball rolls across the ground and [CHAR] instinctively catches it, his hands getting dirty, looking surprised. |
| 12 | 50-55 | Close-up of [CHAR] holding a muddy ball at golden hour; he breaks into a genuine, unguarded smile; warm soft sunset light. |
| 13 | 55-60 | Front-facing medium close-up of a Japanese university student in the evening looking down at a smartphone held at chest height, face lit by the screen; at the end, slowly looks up toward the camera. |

---

## 注意
- シーン13は主人公ではなく「視聴者に見立てた別の学生」。主人公の参考画像は添付しない
- 頭上の数字・色の変化は、`GoogleVids_プロンプト.md` の「③ 編集で足すもの」を参照
- 応募条件「尺の半分以上がAI生成動画」：冒頭10秒＋この50秒のうち、AI生成の映像が合計30秒以上あれば満たせる
