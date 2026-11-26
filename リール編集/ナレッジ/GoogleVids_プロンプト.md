# Google Vids 用プロンプト（「もしも、他人の評価が見えたら。」60秒リール）

使い方
1. 新しい動画を作るときに、**① 全体の指示** を Vids の「Help me create（作成をサポート）」に貼る
2. ストーリーボードができたら、各シーンの映像を **② シーンごとの映像プロンプト** で生成し直す（AI動画生成の入力欄に、シーンごとに1つずつ貼る）
3. 頭上の数字・テロップ・効果音は **③ 編集で足すもの** を見ながら、Vids の編集画面で重ねる
- ②は英語のほうが意図どおりになりやすいので英語にしている（日本語でも動く可能性はあるが、未確認）
- 参考画像を使える場合は、主人公の基準画像 `リール編集/素材/主人公_基準画像/案A_47ce7c5d.png` を毎回添付する

---

## ① 全体の指示（Help me create に貼る）

```
縦型9:16、ちょうど60秒、セリフなし・ナレーションなしのショートドラマ動画を作ってください。
映像・音・短いテロップだけで伝えます。実写風（シネマティック、35mmフィルム風、浅い被写界深度）。

テーマ：「もしも、他人の評価が頭の上に数字で見えたら」
メッセージ：「その行動は、自分のためか、他人の目のためか」
ターゲット：ショート動画をよく見る大学生

主人公：20歳の日本人の男子大学生。細身、明るく人当たりのいい顔、明るい茶髪のセンターパート、眼鏡なし。
最初の服装はグレーの無地スウェット、ベージュのチノパン、白スニーカー、無地の黒いトートバッグ。全シーンで同じ人物にしてください。
舞台：秋の東京、都心の現代的な大学キャンパス（ガラス張りの校舎、紅葉）。0〜40秒は昼、40秒以降は夕方の暖かい光。

構成（冒頭3秒で掴み、以降5秒ごとに見せ場）：
0-3秒：主人公がキャンパスの広場を歩くと、周りの学生が一斉に振り向く。テロップ「もしも、他人の評価が見えたら。」
3-5秒：俯瞰で、学生が行き交う広場全体
5-10秒：鏡の前で、韓国風のレイヤードコーデ（白シャツにクリーム色のニットベスト、ワイドスラックス）に着替えて満足そうにする
10-15秒：友人の輪の中で、少し遅れて周りに合わせて笑う
15-20秒：おしゃれなカフェで、ラテアートをスマホで角度を変えながら撮る
20-25秒：ベンチで、自分が踊っている動画を投稿しかけるが、周りの目を気にして下書きのまま削除する
25-30秒：鏡に映った自分の顔がぼやけている
30-35秒：下から見上げる構図。周りの学生が無表情で主人公を見下ろす
35-40秒：主人公が自分の頭の上の空中を両手で必死に振り払う
40-45秒：夕方の小さな公園で、5歳くらいの子どもが泥遊びをして無邪気に笑っている
45-50秒：泥だらけのボールが転がってきて、主人公が思わず受け取る
50-55秒：主人公がボールを持ったまま、素の笑顔になる（アップ）
55-60秒：スマホを見ている学生を正面から撮る（視聴者自身に見立てる）。テロップ「その数字、誰のため？」

音：0〜35秒は明るくテンポのいいBGMと通知音「ピコン」。35〜40秒でBGMが歪む。40〜55秒はBGMを止め、子どもの笑い声だけ。最後は「ピコン」1回で終わる。
映像に文字・数字・ロゴ・看板を入れないでください（頭上の数字は後から編集で入れます）。
```

---

## ② シーンごとの映像プロンプト（AI動画生成に1つずつ貼る）

共通で末尾に付ける文：
`Photorealistic, cinematic, shot on 35mm, shallow depth of field, vertical 9:16, autumn in Tokyo. No text, no numbers, no logos, no signs.`

主人公の説明（[CHAR] の部分に入れる）：
`a 20-year-old Japanese male university student, slim, friendly face, light brown center-part hair, no glasses, plain heather-gray crewneck sweatshirt, beige chinos, white sneakers, plain black tote bag`

| # | 秒 | プロンプト |
|---|---|---|
| 1 | 0-3 | [CHAR] walks across the crowded plaza of a modern urban university campus with glass buildings and autumn leaves, daylight; the students around him suddenly stop and turn their heads toward him at the same time; slow push-in. |
| 2 | 3-5 | Wide high-angle shot of a busy modern Tokyo university plaza in autumn, many students walking and chatting, gentle drone drift, daylight. |
| 3 | 5-10 | [CHAR] in front of a full-length mirror changes into a trendy Korean-style layered outfit (cream knit vest over a white shirt, wide-leg slacks), checks himself and smiles, satisfied. |
| 4 | 10-15 | [CHAR] stands in a circle of laughing friends on campus; he laughs along a beat late, slightly forced, handheld camera. |
| 5 | 15-20 | [CHAR] in a stylish cafe holds up his smartphone and photographs a cup of latte art, carefully adjusting the angle. |
| 6 | 20-25 | [CHAR] sits on a campus bench watching a video of himself dancing on his phone; his thumb hovers over the post button, he glances at nearby students, hesitates, then deletes it. |
| 7 | 25-30 | Close-up of a restroom mirror: the reflection of [CHAR] is out of focus and blurry while the mirror frame is sharp; still and quiet. |
| 8 | 30-35 | Low-angle shot from below: [CHAR] small in the center, surrounding students stand over him and look down with blank faces; slow rotation. |
| 9 | 35-40 | [CHAR] frantically swats at the empty air above his own head with both hands, frustrated; handheld camera. |
| 10 | 40-45 | Small neighborhood park at golden hour: a 5-year-old Japanese child happily plays in a mud puddle, laughing freely; warm light. |
| 11 | 45-50 | Golden hour park: a muddy ball rolls across the ground and [CHAR] instinctively catches it, hands getting dirty, looking surprised. |
| 12 | 50-55 | Close-up of [CHAR] holding a muddy ball at golden hour; he breaks into a genuine, unguarded smile; warm soft light. |
| 13 | 55-60 | Front-facing medium close-up of a Japanese university student in the evening looking down at a smartphone held at chest height, face lit by the screen; at the end, slowly looks up toward the camera. |

---

## ③ 編集で足すもの（Vids の編集画面で重ねる）

| 秒 | 頭上の数字・テロップ | 音 |
|---|---|---|
| 0-3 | 主人公の頭上に「0」がポンと出る／テロップ「もしも、他人の評価が見えたら。」 | ピコン |
| 3-5 | 全員の頭上にばらばらの数字 | |
| 5-10 | 12 → 500 | ピコン |
| 10-15 | 500 → 2,000 | 通知音を連打 |
| 15-20 | 2,000 → 9,800（紙吹雪のように舞う） | ピコン |
| 20-25 | 9,800 が赤く点滅 | |
| 25-30 | 9,800（少し薄く） | |
| 30-35 | 周りの大きな数字が迫ってくる | |
| 35-40 | 9,800 が揺れて消えない | BGMが歪む |
| 40-50 | （主人公の数字は薄く残る） | 無音＋子どもの笑い声 |
| 50-55 | 数字がふっと消える | |
| 55-60 | 視聴者の頭上に黄色い数字／テロップ「その数字、誰のため？」 | ピコン |

色：0〜20秒は鮮やか、20〜40秒でだんだんグレーへ、40〜55秒は子どもの周りだけ色を戻す、55〜60秒は数字だけ鮮やか。
Vids で色の細かい調整ができない場合は、Vids から書き出した動画を `reel-contest/edit/` の編集スクリプトで仕上げる。

---

## 分からないこと（Vids で試して確認する）
- 縦型9:16で書き出せるか
- AI動画生成の1本の長さ（シーンの秒数と合わない場合は、編集で切る）
- 参考画像を添付して、主人公の顔をそろえられるか
- 日本語のテロップに使えるフォント
- 応募条件「尺の半分以上がAI生成動画」を満たすには、②で生成した映像が合計30秒以上必要
