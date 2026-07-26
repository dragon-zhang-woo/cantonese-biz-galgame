# GPT Image 2：实用情境训练库场景提示词

更新日期：2026-07-26

## 通用生成约束

所有场景均为《粤商通》原创训练案例。每次生成必须上传指定角色锚点；
如提示中列出既有场景图，则同时上传作为画风、材质和色彩参考。

统一要求：

- 1536×1024，横向 3:2；
- 高端半写实电影插画，不是照片，不是夸张动漫；
- 香港真实商务环境，克制、可信、无旅游明信片感；
- 主 NPC 位于画面右侧约 55%–82% 区域，面向左前方的第一人称玩家；
- 下方约 40% 不放脸、关键手势或重要道具，预留游戏对话控制台；
- 右上角保持低对比、无关键内容，预留状态面板；
- 眼平视角，35–50mm 电影镜头，人物比例真实；
- 延续深海军蓝、暖金、低饱和紫和青色体系；
- 同一角色必须保持锚点中的脸型、年龄、发型、肤色、身材和核心服装；
- 第一人称玩家不得出现清晰正脸；
- 画面内不得出现可读文字、品牌、商标、水印、签名或界面；
- 不要霓虹赛博朋克、塑料皮肤、企业图库感、过度景深、夸张姿势、
  荷兰角或多余人物抢镜。

---

## P01：Vincent｜先确认，再开工

目标文件：
`practice-vincent-clarify-brief-v01.png`

输入图片：

1. `char-vincent-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-onboarding-vincent.png`，画风、服装和办公室材质参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Vincent exactly from the supplied approved anchor: same Hong Kong
Chinese man, age, facial structure, hairstyle, body proportions, deep navy
suit, white shirt and restrained warm-gold tie. Do not redesign him.

Scene: 9:15 a.m. inside a compact Admiralty project war room after a daily
stand-up. A glass wall with soft, completely unreadable planning marks and a
table with a closed laptop, blank task cards and a dark project folder suggest
an ambiguous new assignment. Vincent stands on the right, holding a capped
marker loosely, looking toward the first-person player on the left with calm
expectation: he wants the newcomer to confirm the objective, deliverable and
deadline before starting. His expression is attentive rather than stern.

Composition: eye-level 40mm cinematic lens; Vincent occupies the right side
from roughly 58% to 82% of the frame and faces left-front. The player is never
shown with a clear face. Keep the lower 40% free from faces, hands and critical
props for the game dialogue console. Keep the upper-right quiet and low
contrast for a status panel. Use layered glass, dark navy surfaces, soft
morning window light, warm gold edge light and restrained cyan reflections.

High-end semi-realistic cinematic illustration, realistic anatomy and hands,
subtle film grain, believable Hong Kong office, premium visual novel quality.
No readable text, no brand, no logo, no watermark, no signature, no interface,
no stock-photo look, no cyberpunk neon, no exaggerated anime.
```

---

## P02：何太｜两件急事，只能先做一件

目标文件：
`practice-mrs-ho-priority-conflict-v01.png`

输入图片：

1. `char-mrs-ho-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-manager-lunch.png`，人物气质和画风参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Mrs Ho exactly from the supplied approved anchor: same Hong Kong
Chinese woman, age, facial structure, hairstyle, body proportions, deep plum
business outfit, beige details and restrained warm-gold accessories. Do not
redesign her.

Scene: 11:20 a.m. in a quiet corner of an Admiralty open office. Two competing
project folders and a softly lit desk calendar with no readable text imply
that two urgent deliverables now share the same deadline. Mrs Ho stands on the
right beside the desk, one hand resting near the two folders, looking toward
the first-person player on the left. Her expression is practical and composed:
she expects the player to explain the resource conflict, recommend which task
comes first and state the consequence for the other task.

Composition: eye-level 45mm cinematic lens; Mrs Ho occupies the right side
from roughly 58% to 82% and faces left-front. No clear player face. Keep the
lower 40% free of faces, hands and critical props for dialogue UI. Keep the
upper-right quiet. Soft late-morning window light, deep navy office materials,
warm gold highlights, muted plum and restrained cyan reflections.

High-end semi-realistic cinematic illustration, realistic anatomy and hands,
subtle film grain, believable Hong Kong office, premium visual novel quality.
No readable text, no brand, no logo, no watermark, no signature, no interface,
no stock-photo look, no cyberpunk neon, no exaggerated anime.
```

---

## P03：Vincent｜坏消息要几点讲

目标文件：
`practice-vincent-bad-news-v01.png`

输入图片：

1. `char-vincent-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-onboarding-vincent.png`，服装与视觉质感参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Vincent exactly from the supplied approved anchor: same Hong Kong
Chinese man, age, facial structure, hairstyle, body proportions, deep navy
suit, white shirt and restrained warm-gold tie. Do not redesign him.

Scene: 6:35 p.m. in the Admiralty project area at sunset. A laptop on the desk
shows only abstract, unreadable progress shapes; a delivery folder remains
open and a phone lies face down, suggesting the team has just confirmed a
delay before the client knows. Vincent stands on the right, jacket still neat
but sleeves slightly relaxed, looking toward the first-person player. His
expression is serious and supportive: he is asking when and how the player
will communicate the bad news, ownership and next update.

Composition: eye-level 45mm cinematic lens; Vincent occupies the right side
and faces left-front. The player has no visible face. Keep the lower 40% free
of faces, gestures and critical props for dialogue UI; keep the upper-right
quiet. Use blue-hour city light through glass, deep navy surfaces, warm sunset
edge light and restrained cyan monitor reflections. Tension without melodrama.

High-end semi-realistic cinematic illustration, realistic anatomy and hands,
subtle film grain, believable Hong Kong office, premium visual novel quality.
No readable text, no brand, no logo, no watermark, no signature, no interface,
no stock-photo look, no cyberpunk neon, no exaggerated anime.
```

---

## P04：阿朗｜午饭不是面试

目标文件：
`practice-ah-long-networking-lunch-v01.png`

输入图片：

1. `char-ah-long-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-pantry-colleague.png`，人物气质和画风参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Ah Long exactly from the supplied approved anchor: same Hong Kong
Chinese man, age, facial structure, hairstyle, body proportions and teal-navy
smart-casual business clothing. Do not redesign him.

Scene: 12:45 p.m. in a clean, believable Central cha chaan teng booth during
the lunch rush. Background patrons are soft silhouettes only. Two simple
drinks and shared dishes with no logos sit away from the lower UI area. Ah
Long sits on the right, body angled naturally toward the first-person player,
holding a cup casually. His expression is open and observant: this is a first
informal cross-team lunch where the player must start a natural conversation,
explain the reason for connecting and leave the colleague room to disengage.

Composition: eye-level 40mm lens, intimate but not romantic; Ah Long occupies
the right side and faces left-front. Never show the player's clear face. Keep
the lower 40% free of faces, key gestures and critical dishes for dialogue UI;
keep the upper-right quiet. Warm practical lights, deep navy shadows, aged
teal surfaces, muted red accents and restrained golden highlights.

High-end semi-realistic cinematic illustration, realistic anatomy and hands,
subtle film grain, authentic contemporary Hong Kong lunch atmosphere, premium
visual novel quality. No readable text, brand, logo, watermark, signature or
interface. No tourist postcard, stock-photo look, neon cyberpunk or exaggerated
anime.
```

---

## P05：阿朗｜“得闲搞”到底几时搞

目标文件：
`practice-ah-long-soft-followup-v01.png`

输入图片：

1. `char-ah-long-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-pantry-colleague.png`，服装、色彩和办公室画风参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Ah Long exactly from the supplied approved anchor: same Hong Kong
Chinese man, age, face, hairstyle, body proportions and teal-navy smart-casual
business outfit. Do not redesign him.

Scene: 7:05 p.m. in a glass office corridor near the lift lobby, Admiralty.
Most desks behind the glass are dim, while one meeting room remains softly
lit. Ah Long stands on the right with a closed notebook under one arm and a
phone in the other hand, screen unreadable. He looks toward the first-person
player with a slightly apologetic but friendly expression. A cross-team task
is still described only as “when free”; the player must follow up politely and
turn the vague promise into an owner and time without damaging the relationship.

Composition: eye-level 50mm cinematic lens; Ah Long right-weighted, facing
left-front. Player face never visible. Keep the lower 40% free of faces, hands
and important props for dialogue UI and keep upper-right low contrast. Blue
hour through glass, dark navy and teal office materials, warm lift-lobby
lights, restrained cyan reflections, quiet end-of-day tension.

High-end semi-realistic cinematic illustration, realistic hands and anatomy,
subtle film grain, believable Hong Kong office, premium visual novel quality.
No readable text, no brands, logo, watermark, signature or interface. No
stock-photo look, no cyberpunk neon, no exaggerated anime.
```

---

## P06：何太｜客户临时加需求

目标文件：
`practice-mrs-ho-scope-creep-v01.png`

输入图片：

1. `char-mrs-ho-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-manager-lunch.png`，人物气质和电影插画质感参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Mrs Ho exactly from the supplied approved anchor: same Hong Kong
Chinese woman, age, face, hairstyle, proportions, deep plum business outfit,
beige details and restrained gold accessories. Do not redesign her.

Scene: 3:40 p.m. inside a compact glass project meeting pod in Admiralty. An
open scope folder, a second blank request sheet and a tablet with abstract
unreadable blocks imply the client has just requested extra functionality for
free. Mrs Ho sits or stands on the right, calm and grounded, looking toward the
first-person player. Her expression invites a professional answer: do not
reject the client bluntly, but name the original scope, impact and a fair
exchange condition before committing.

Composition: eye-level 45mm cinematic lens; Mrs Ho occupies the right side and
faces left-front. No clear player face. Keep the lower 40% free from faces,
hands and critical documents for dialogue UI. Keep upper-right quiet. Deep navy
glass pod, muted plum, warm gold edge light and subtle cyan reflections,
controlled afternoon atmosphere.

High-end semi-realistic cinematic illustration, realistic anatomy and hands,
subtle film grain, believable Hong Kong office, premium visual novel quality.
No readable text, brand, logo, watermark, signature or interface. No generic
corporate stock photo, cyberpunk neon or exaggerated anime.
```

---

## P07：陈嘉敏｜高层只给你一分钟

目标文件：
`practice-chen-executive-brief-v01.png`

输入图片：

1. `char-chen-jiamin-anchor-candidate-[a-d]-v01.png`，身份绝对参考；
2. `scene-central-client.png`，跨场景身份、服装和会议室画风参考。

直接提示词：

```text
Create one original 1536×1024 horizontal 3:2 cinematic game background
for a Hong Kong workplace Cantonese visual novel.

Preserve Chen Jiamin exactly from the supplied approved anchor and reference:
same Hong Kong Chinese woman, age, facial structure, hairstyle, body
proportions, charcoal business suit and ivory blouse. Do not redesign her.

Scene: 10:55 a.m. in a high-level Central decision room overlooking a bright
Victoria Harbour skyline. A concise pilot-results folder, a closed pen and a
single abstract chart with no readable text suggest management is ready to
decide. Chen Jiamin stands on the right beside the table, looking toward the
first-person player. Her expression is focused and time-conscious, not hostile:
the player has one minute to state the conclusion, strongest evidence and one
specific decision request instead of retelling the full project background.

Composition: eye-level 45mm cinematic lens; Chen occupies the right side from
roughly 58% to 82%, facing left-front. Never show the player's clear face.
Keep the lower 40% free of faces, key gestures and critical documents for
dialogue UI. Keep upper-right quiet. Clean daylight, deep navy glass and stone,
warm gold edge accents, restrained cyan reflections, senior decision-making
atmosphere.

High-end semi-realistic cinematic illustration, realistic anatomy and hands,
subtle film grain, believable Hong Kong executive meeting environment, premium
visual novel quality. No readable text, brand, logo, watermark, signature or
interface. No stock-photo look, no cyberpunk neon, no exaggerated anime.
```

## 验收标准

每张图进入代码前必须检查：

1. 角色身份与锚点一致；
2. NPC 位于右侧且视线朝向左前方玩家；
3. 下方 40% 和右上角满足 UI 避让；
4. 手、文件、手机和餐具无明显畸变；
5. 没有可读文字、品牌、水印或签名；
6. 香港环境可信，不是泛化欧美办公室；
7. 与现有五幕场景的色彩、颗粒和半写实质感连续；
8. 记录生成日期、提示词版本、输入锚点及生成 ID。
