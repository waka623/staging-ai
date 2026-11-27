# ショットリスト v1（「もしも、他人の評価が見えたら。」）

## 共通ルール
- 縦型9:16。生成は通常の色で行い、色の変化は編集で付ける
- **頭上の数字・テロップ・通知音は、すべて編集で後から重ねる**（AIに数字を描かせると、桁が崩れたりカットごとに形がずれたりしやすいため）。生成プロンプトには数字を入れない
- 主人公の外見は下の「CHAR」を毎回そのまま使う。各カットは「最初のフレーム画像（gpt_image_2_6）→ 動画化（Kling v3.0 std・音なし・5秒）」の順で作る
- 使うのは5秒のうち必要な秒数だけ（3秒未満のカットも5秒で生成して切る）

## 決定事項（2026-11-25）
- 主人公：茶髪のセンターパート、明るく人当たりがいい。着替える前はグレーの無地スウェット。参考画像は使わず、生成した基準画像を全カットの参考にする
- 場所：都心の現代的なキャンパス／秋／昼→夕方（40秒以降は夕方）。子どもの場面はキャンパスの外の小さな公園
- C03の流行りの服：韓国風のレイヤードコーデ
- C05：カフェのラテアート
- C06：スケッチブックをやめ、「自作のダンス動画を投稿しかけて、下書きのまま削除する」に変更
- C13：スマホを見る学生を正面から撮り、その頭上に数字を出す（＝リールを見ている視聴者自身）
- 生成：画像も動画も、主催者の回答を待たずにClaudeが生成してよい（応募資格のリスクは本人が負う）
- 主人公の基準画像は4案から選ぶ。動画用のクレジットは、画像が固まってから決める

- 2026-11-27：映像のトーンを**実写風からアニメ風**に変更（Google Vidsで制作）。実写風の基準画像・C01の最初のフレームは使わない
- 2026-11-27：参考動画に合わせ、アニメ風の中でも**3DCGアニメ風**（丸みのある顔・大きな目・大げさな表情・暖かい逆光）にする

## CHAR（主人公の固定設定）
```
a 20-year-old Japanese male university student, slim build, friendly and approachable face,
light brown hair in a center-part (Korean-style two-block) cut, natural skin, no glasses,
wearing a plain heather-gray crewneck sweatshirt and beige chinos, white sneakers, black canvas tote bag
```
STYLE（全カット共通）：
```
photorealistic, shot on 35mm, shallow depth of field, autumn in Tokyo,
modern urban university campus with glass buildings and an open plaza, autumn leaves,
vertical 9:16, cinematic, no text, no numbers, no logos
（C01〜C09は昼の自然光、C10〜C13は夕方の暖かい光：warm golden hour light）
```

## カット一覧
| # | 秒 | 映像（AIで生成） | 編集で足すもの |
|---|---|---|---|
| C01 | 0-3 | 主人公がキャンパスを歩いていると、周りの学生が一斉に振り向く | 頭上「0」／テロップ「もしも、他人の評価が見えたら。」／ピコン |
| C02 | 3-5 | 引きの画で、キャンパスの広場に大勢の学生 | 全員の頭上に数字 |
| C03 | 5-10 | 鏡の前で、韓国風のレイヤードコーデに着替える | 12→500 |
| C04 | 10-15 | 友人の輪の中で、周りに合わせて笑う | 通知音の連打／→2,000 |
| C05 | 15-20 | カフェでラテをスマホで撮る | 数字が紙吹雪のように舞う／→9,800 |
| C06 | 20-25 | ベンチで自作のダンス動画を投稿しかけ、周りを気にして下書きのまま削除する | 数字が赤く点滅 |
| C07 | 25-30 | 鏡に映った自分の顔がぼやけている | ※顔のぼかしは編集で付けてもよい |
| C08 | 30-35 | 下から見上げる構図で、周りの学生が主人公を見下ろす | 数字が迫ってくる |
| C09 | 35-40 | 頭の上を手で振り払おうとする | 数字が消えない／BGMが歪む |
| C10 | 40-45 | 公園で、子どもが泥遊びをしている | 無音にして子どもの笑い声だけ |
| C11 | 45-50 | 泥だらけのボールが転がってきて、主人公が受け取る | ― |
| C12 | 50-55 | 主人公が素で笑う（アップ） | 数字が初めて消える |
| C13 | 55-60 | スマホを見る学生を正面から（夕方） | テロップ「その数字、誰のため？」／ピコン |

## 動画化プロンプト（Kling用・最初のフレーム画像と組み合わせる）
- C01: `[CHAR] walks across the campus plaza; several students around him suddenly stop and turn their heads toward him at the same time; slow push-in, [STYLE]`
- C02: `wide high-angle shot of a crowded Japanese university plaza, many students walking and chatting, gentle drone drift, [STYLE]`
- C03: `[CHAR] in front of a full-length mirror changes into a trendy Korean-style layered outfit (cream knit vest over a white shirt, wide-leg slacks) and checks himself, satisfied smile, [STYLE]`
- C04: `[CHAR] stands in a circle of friends who are laughing; he laughs along a beat late, slightly forced, handheld, [STYLE]`
- C05: `[CHAR] in a stylish cafe holds up his smartphone to photograph a latte art cup, carefully adjusting the angle, [STYLE]`
- C06: `[CHAR] sits on a campus bench watching a video of himself dancing on his smartphone, his thumb hovers over the post button, he glances around at nearby students, hesitates, then deletes it, [STYLE]`
- C07: `close-up of a restroom mirror reflection of [CHAR]; the reflection is out of focus and blurry while the mirror frame is sharp, still and quiet, [STYLE]`
- C08: `low-angle shot from below, [CHAR] small in the center; surrounding students standing over him look down at him with blank faces, slow rotation, [STYLE]`
- C09: `[CHAR] frantically swats at the empty air above his own head with both hands, frustrated, handheld, [STYLE]`
- C10: `in a sunny neighborhood park, a 5-year-old Japanese child happily plays in a mud puddle, laughing freely, warm natural light, [STYLE]`
- C11: `a muddy ball rolls across the ground and [CHAR] instinctively catches it, his hands getting dirty, he looks at it surprised, [STYLE]`
- C12: `close-up of [CHAR] holding a muddy ball, he breaks into a genuine unguarded smile, soft warm light, [STYLE]`
- C13: `front-facing medium close-up of a Japanese university student looking down at a smartphone held at chest height, face lit by the screen, evening, looking slightly up toward the camera at the end, [STYLE]`

## 費用の見込み（2026-11-25時点の見積もり）
- 最初のフレーム画像：0.75クレジット/枚 × 13カット × 2回 ≒ 20クレジット
- 動画：7.5クレジット/本 × 12カット × 2.5回 ≒ 225クレジット
- 合計 約245クレジット（現在の残高10クレジット）
