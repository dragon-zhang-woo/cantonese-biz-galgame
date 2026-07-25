# 《粤商通》GPT Image 2 具体生产提示词 v1.0

更新日期：2026-07-24
适用范围：四名主要 NPC 角色锚点、五组反应参考、五张建立镜头、十二张剧情插图。
视觉规范：以 `VISUAL_BIBLE.md` 为准。

## 0. 使用方法

1. 每个代码块都是一次独立的 GPT Image 2 请求，不要一次粘贴多个代码块。
2. 先只执行 `P0-A01`–`P0-A04`。每个锚点提示词分别运行四次，得到 A/B/C/D 四个候选。
3. 每名角色只批准一个锚点。四个锚点全部批准前，不执行反应组和剧情资产。
4. 后续任务如注明输入图，先上传对应图片，再粘贴提示词。
5. 角色锚点候选尺寸为 1024×1536；其余剧情图为 1536×1024。
6. 所有输出先保存为 `candidate`，完成身份、构图、色板、手部/道具、文字/Logo/水印五项 QA 后才能改为 `approved`。
7. 不要求模型在图片里生成文件名、角色名、色值或任何标签；文件名由人工保存时填写。

### 输入图使用规则

| 角色/资产 | 输入图 | 使用方式 |
|---|---|---|
| Vincent | `public/assets/scene-onboarding-vincent.png` | 只参考项目画风、年龄气质和职业感；按角色圣经统一服装与五官结构 |
| 陈嘉敏 | `scene-central-client.png` + `scene-crisis-client.png` | 两张都作为身份连续性输入；第二幕图优先决定脸部身份 |
| 阿朗 | `scene-pantry-colleague.png` | 只参考项目画风和茶水间气质；建立与 Vincent 明显不同的新锚点 |
| 何太 | `scene-manager-lunch.png` | 只参考茶餐厅画风和角色气质；不得沿用与陈嘉敏相似的脸 |
| 建立镜头 | 同幕现有主场景 | 只参考色彩、材质和地点气质，不复制人物 |
| 剧情插图 | 同幕现有主场景 + 已批准角色锚点（如涉及角色） | 主场景控制风格，角色锚点控制身份 |

### 锚点候选命名

```text
char-vincent-anchor-candidate-a-v01.png
char-vincent-anchor-candidate-b-v01.png
char-vincent-anchor-candidate-c-v01.png
char-vincent-anchor-candidate-d-v01.png

char-chen-jiamin-anchor-candidate-a-v01.png
char-ah-long-anchor-candidate-a-v01.png
char-mrs-ho-anchor-candidate-a-v01.png
```

其余角色依此替换 `a` 为 `b`、`c`、`d`。

---

## 1. P0-A：四名角色锚点

### P0-A01 — Vincent 梁志诚

输入：`scene-onboarding-vincent.png`，仅作为画风和职业气质参考。
输出：`char-vincent-anchor-candidate-[a-d]-v01.png`

```text
Create an original fictional character anchor sheet for the premium Hong Kong business visual novel “CantoneseBiz”.

Character: Vincent Leung, a 36-year-old East Asian male project onboarding and mentoring manager. He is efficient, composed, observant, and quietly supportive. Give him a clearly defined long-oval face, calm almond-shaped dark eyes, straight brows, a clean jawline, short meticulously groomed black hair with a restrained side part, no facial hair, and no glasses. His build is lean and tall with upright posture. He must look experienced but not older than 40.

Canonical outfit: a tailored deep navy wool suit, warm ivory dress shirt, a restrained narrow tie with muted warm-gold and deep-navy micro stripes, black leather shoes, and a slim brushed-metal wristwatch. No badge, no visible company identity, no brand mark. Props: one unbranded dark document folder and one thin dark tablet.

Use the uploaded gameplay image only for the project’s high-end semi-realistic cinematic illustration style, natural skin texture, believable Hong Kong professional atmosphere, and restrained expression language. Do not copy the exact pose, badge, open-collar shirt, lobby background, or existing composition.

Produce one clean vertical 1024×1536 production reference sheet on a simple deep navy-black background (#050B18 to #091329), with exactly three consistent depictions of the same person:
1. one dominant full-body three-quarter view, including both shoes, facing slightly toward screen-left;
2. one neutral head-and-shoulders close view;
3. one clean left-facing profile view.
Add a small, neatly separated still-life arrangement of the same folder, tablet, tie fabric, watch, and shoe materials. Keep all three faces unmistakably identical in age, bone structure, hairstyle, skin tone, and proportions. Use realistic wool, cotton, leather, and brushed-metal materials. Soft warm-gold edge light (#F4BE55), deep blue fill, subtle cinematic grain.

No readable text, no captions, no name, no numbers, no logo, no watermark, no real person, no existing film/game/anime character, no extra people, no exaggerated anime eyes, no plastic skin, no fashion-ad glamour pose, no cyberpunk neon, no distorted hands, no duplicated props.
```

### P0-A02 — 陈嘉敏

输入 1：`scene-central-client.png`，身份主参考。
输入 2：`scene-crisis-client.png`，跨场景连续性参考。
输出：`char-chen-jiamin-anchor-candidate-[a-d]-v01.png`

```text
Create the canonical character anchor sheet for the same original fictional woman shown in both uploaded CantoneseBiz gameplay images.

Identity priority: use the woman in the Central sunset meeting-room image as the primary facial identity. Use the rainy crisis-room image only to confirm that she is the same person across time and pressure. Preserve her mature East Asian facial identity, approximately age 38, strong oval jawline, alert dark eyes, composed mouth, confident posture, and side-parted collarbone-length black hair. Refine the hair into polished straight hair with only a subtle natural bend at the ends; do not redesign her into a different person.

Character role: Chan Ka-man, regional business director and client decision-maker. She is rational, risk-aware, decisive, and never theatrical.

Canonical outfit: a fitted charcoal-gray business jacket, warm ivory silk blouse, dark straight-leg trousers, low-heeled black shoes, and small matte-metal earrings. Remove the pendant necklace and visible brand cues. Props: one unbranded dark proposal folder, one slim metal pen, and one plain dark smartphone. Keep the clothing contemporary, restrained, and credible for a Hong Kong regional business director.

Produce one clean vertical 1024×1536 production reference sheet on a simple deep navy-black background (#050B18 to #091329), with exactly three consistent depictions of the same woman:
1. one dominant full-body three-quarter view including both shoes, facing screen-left;
2. one neutral head-and-shoulders close view with calm scrutiny;
3. one clean left-facing profile view.
Add a small separated still-life arrangement of the folder, pen, phone, jacket fabric, silk blouse, earrings, and shoes. Every depiction must have exactly the same face, age, hair length, side part, body proportions, outfit, and earrings. Natural skin texture, realistic silk and wool, muted purple-gray nuance, warm-gold rim light and cool blue fill.

No readable text, no captions, no name, no numbers, no logo, no watermark, no real person, no celebrity resemblance, no existing character, no extra people, no exaggerated anime eyes, no beauty-filter skin, no fashion-editorial glamour, no cleavage emphasis, no cyberpunk neon, no distorted hands, no duplicated accessories.
```

### P0-A03 — 阿朗

输入：`scene-pantry-colleague.png`，仅作为画风和角色气质参考。
输出：`char-ah-long-anchor-candidate-[a-d]-v01.png`

```text
Create an original fictional character anchor sheet for the premium Hong Kong business visual novel “CantoneseBiz”.

Character: Ah Long, a 30-year-old East Asian male local project manager and workplace-culture interpreter. He is observant, approachable, socially perceptive, and direct without being rude. Make him clearly different from Vincent: a slightly rounder but well-defined face, softer brows, warmer dark eyes, a shorter nose, a relaxed mouth, and short textured black hair with a natural forward sweep. No facial hair and no glasses. Medium build, relaxed shoulders, credible office posture. He must not look like a model, a comedian, or a streetwear influencer.

Canonical outfit: a deep teal-blue lightweight business jacket, gray-blue fine-knit polo shirt with no logo, dark tailored trousers, and dark-brown casual leather shoes. Props: two plain unbranded paper coffee cups and one simple dark smartphone.

Use the uploaded pantry scene only for the project’s high-end semi-realistic cinematic illustration style, blue-hour atmosphere, restrained Hong Kong office mood, and natural material treatment. Do not copy the exact face, white shirt, pose, pantry background, or composition.

Produce one clean vertical 1024×1536 production reference sheet on a simple deep navy-black background (#050B18 to #091329), with exactly three consistent depictions of the same person:
1. one dominant full-body three-quarter view including both shoes, facing slightly toward screen-left;
2. one neutral head-and-shoulders close view with a subtle knowing expression;
3. one clean left-facing profile view.
Add a small separated still-life arrangement of the two cups, phone, jacket fabric, knit polo texture, and shoes. Keep all three faces identical in age, bone structure, hairstyle, skin tone, and proportions. Use cool cyan-blue fill (#6ADFE7) with restrained warm pantry edge light, natural skin and fabric texture, subtle cinematic grain.

No readable text, no captions, no name, no numbers, no logo, no watermark, no real person, no existing character, no extra people, no exaggerated grin, no gossiping caricature, no anime styling, no plastic skin, no streetwear styling, no cyberpunk neon, no distorted hands, no duplicated cups.
```

### P0-A04 — 何太

输入：`scene-manager-lunch.png`，仅作为茶餐厅画风和沉稳气质参考。
输出：`char-mrs-ho-anchor-candidate-[a-d]-v01.png`

```text
Create an original fictional character anchor sheet for the premium Hong Kong business visual novel “CantoneseBiz”.

Character: Mrs Ho, a 46-year-old East Asian female department line manager and final review owner. She is grounded, practical, emotionally steady, and able to close an ambiguous negotiation without theatrics. Create a face that is unmistakably different from Chan Ka-man: slightly broader mature facial structure, softer cheek line, subtly heavier upper eyelids, calm dark eyes, and a firm but warm mouth. Give her neat black hair cut just below the ears in a structured short bob with a clean side part. No glasses. She should look her real age, experienced and credible, never harsh or stereotypically severe.

Canonical outfit: a structured deep plum-purple jacket, warm beige inner top with a modest neckline, dark tailored lower garment, low-heeled dark shoes, and one restrained warm-gold wristwatch. No necklace and no large jewelry. Props: one plain ceramic tea cup, one folded one-page project summary with no readable text, and one slim metal pen.

Use the uploaded cha chaan teng scene only for the project’s high-end semi-realistic cinematic illustration style, warm practical lighting, Hong Kong night mood, and restrained managerial presence. Do not copy the existing woman’s face, shoulder-length hair, navy suit, pose, or restaurant composition; the new character must not resemble Chan Ka-man.

Produce one clean vertical 1024×1536 production reference sheet on a simple deep navy-black background (#050B18 to #091329), with exactly three consistent depictions of the same woman:
1. one dominant full-body three-quarter view including both shoes, facing screen-left;
2. one neutral head-and-shoulders close view with calm attentive authority;
3. one clean left-facing profile view.
Add a small separated still-life arrangement of the tea cup, folded summary, pen, plum jacket fabric, beige fabric, watch, and shoes. Keep all three faces exactly identical in age, bone structure, short hairstyle, skin tone, and proportions. Warm-gold edge light (#F4BE55), deep plum nuance, cool blue shadow, natural skin and fabric texture.

No readable text, no captions, no name, no numbers, no logo, no watermark, no real person, no celebrity resemblance, no existing character, no extra people, no severe villain expression, no exaggerated jewelry, no over-young face, no anime styling, no plastic skin, no cyberpunk neon, no distorted hands.
```

---

## 2. P0-B：五组反应参考

以下提示词必须上传对应的已批准锚点。每次输出一张 1536×1024 无字表情参考图；它用于确认角色连续性，之后再从批准锚点逐张生成正式半身立绘。

### P0-B01 — RP-01 Vincent

输入：批准后的 Vincent 锚点。
输出：`reaction-vincent-act1-reference-v01.png`

```text
Using the uploaded approved Vincent anchor as the only identity source, create one clean 1536×1024 expression reference image containing exactly four separate head-and-torso depictions of the same Vincent, evenly spaced on a flat deep navy background.

From left to right: neutral assessment; slight approval with only a restrained half-smile; polite correction with one hand lightly indicating the document folder; firm reminder with a straighter posture and focused eyes.

Keep exactly the same face, age 36, hairstyle, body proportions, deep navy suit, warm ivory shirt, muted warm-gold and navy tie, wristwatch, camera height, and lighting. Expressions remain intensity 0–3, never theatrical. All four figures face slightly toward screen-left.

No text, no labels, no logo, no watermark, no extra props, no redesign, no different suit, no facial-hair change, no distorted hands, no duplicated fingers.
```

### P0-B02 — RP-02 陈嘉敏／第二幕

输入：批准后的陈嘉敏锚点。
输出：`reaction-chen-jiamin-act2-reference-v01.png`

```text
Using the uploaded approved Chan Ka-man anchor as the only identity source, create one clean 1536×1024 expression reference image containing exactly four separate head-and-torso depictions of the same woman, evenly spaced on a flat deep navy background.

From left to right: neutral review while holding a closed folder; polite skepticism with a subtle brow movement; pressing for evidence while holding the slim metal pen; temporarily withholding commitment with composed lips and a slight backward shift.

Keep exactly the same face, age 38, side-parted collarbone-length black hair, body proportions, charcoal jacket, warm ivory silk blouse, matte earrings, camera height, and lighting. Expressions remain intensity 0–3. All figures face slightly toward screen-left.

No text, no labels, no logo, no watermark, no different hairstyle, no necklace, no glamour pose, no angry shouting, no redesign, no distorted hands.
```

### P0-B03 — RP-03 阿朗

输入：批准后的阿朗锚点。
输出：`reaction-ah-long-act3-reference-v01.png`

```text
Using the uploaded approved Ah Long anchor as the only identity source, create one clean 1536×1024 expression reference image containing exactly four separate head-and-torso depictions of the same Ah Long, evenly spaced on a flat deep navy background.

From left to right: subtle knowing recognition while holding two plain coffee cups; gentle probing curiosity; practical reminder with one cup lowered slightly; mild concern with a restrained gaze toward screen-left.

Keep exactly the same face, age 30, hairstyle, body proportions, deep teal-blue lightweight jacket, gray-blue knit polo, and lighting. Expressions remain intensity 1–3, warm and believable, never comic.

No text, no labels, no logo, no watermark, no broad grin, no gossip caricature, no streetwear redesign, no extra cups, no distorted hands, no duplicated fingers.
```

### P0-B04 — RP-04 陈嘉敏／第四幕

输入：与第二幕相同的批准陈嘉敏锚点。
输出：`reaction-chen-jiamin-act4-reference-v01.png`

```text
Using the exact same approved Chan Ka-man anchor used for Act 2, create one clean 1536×1024 crisis expression reference image containing exactly three separate head-and-torso depictions of the same woman on a deep navy rainy-night background.

From left to right: controlled high pressure while reading a phone; firm requirement with focused eyes and one hand resting beside the phone; brief restrained relief after receiving a concrete nine-o’clock update.

Keep the same face, age 38, side-parted collarbone-length hair, charcoal jacket, warm ivory blouse, earrings, and body proportions. The only allowed continuity changes are an open jacket, slightly loosened cuff, subtle fatigue, and cool cyan phone light. Add only a very small restrained #FF745E crisis reflection. Expressions remain intensity 2–5 without shouting or desk-slamming.

No text, no labels, no logo, no watermark, no new jewelry, no wardrobe redesign, no wet hair, no crying, no rage, no distorted phone or hands.
```

### P0-B05 — RP-05 何太

输入：批准后的何太锚点。
输出：`reaction-mrs-ho-act5-reference-v01.png`

```text
Using the uploaded approved Mrs Ho anchor as the only identity source, create one clean 1536×1024 expression reference image containing exactly four separate head-and-torso depictions of the same woman, evenly spaced on a flat deep navy and muted plum background.

From left to right: calm listening with hands near a plain tea cup; probing the project boundary; giving a clear practical requirement while touching the folded one-page summary; slight approval with only a softened gaze and minimal smile.

Keep exactly the same face, age 46, short structured black bob, body proportions, deep plum jacket, beige inner top, warm-gold watch, camera height, and warm-gold/cool-blue lighting. Expressions remain intensity 0–3.

No text, no labels, no logo, no watermark, no resemblance to Chan Ka-man, no severe stereotype, no large jewelry, no younger redesign, no distorted hands or tea cup.
```

---

## 3. P1-A：五张场景建立镜头

### P1-A01 — ES-01 金钟清晨

输入：`scene-onboarding-vincent.png`，仅作为色彩和材质参考。
输出：`establishing-admiralty-morning-act1-v01.png`

```text
Create an original 1536×1024 establishing shot for Act 1 of the premium Hong Kong business visual novel “CantoneseBiz”.

Location and time: Admiralty, Hong Kong, early weekday morning just after sunrise. Show a refined modern office-tower entrance, layered glass and dark stone, a covered pedestrian approach, subtle city depth, and warm morning reflections. A few small anonymous office-worker silhouettes may appear far in the background, but no identifiable face is visible.

Visual language: high-end semi-realistic cinematic illustration, 28–35mm eye-level view, deep navy shadows (#050B18, #091329), warm-gold sunrise edges (#F4BE55), restrained cyan glass reflections (#6ADFE7), believable brushed metal and stone. Keep the lower 40% visually calm and the upper-right low contrast for the game interface.

No readable signs, no company names, no logos, no brands, no watermarks, no famous exact building façade, no neon cyberpunk, no tourist-postcard composition, no central hero person.
```

### P1-A02 — ES-02 中环黄昏

输入：`scene-central-client.png`，仅作为色彩和材质参考。
输出：`establishing-central-sunset-act2-v01.png`

```text
Create an original 1536×1024 establishing shot for Act 2 of “CantoneseBiz”.

View from a high Central office floor at Hong Kong sunset: layered towers, harbor depth, a quiet executive meeting floor reflected in glass, and the final warm light fading into cool blue. No main character is present. Suggest that an important client decision is about to happen through an empty meeting table edge and a closed unbranded proposal folder in the distance.

High-end semi-realistic cinematic illustration, 28–35mm lens, deep navy interior, warm orange-gold horizon, muted purple-gray glass, realistic wood and metal. Keep the lower 40% calm and the upper-right visually quiet.

No readable skyline signage, no logos, no branded landmark emphasis, no text, no watermark, no extra people in focus, no cyberpunk neon, no exaggerated lens flare.
```

### P1-A03 — ES-03 茶水间蓝调时刻

输入：`scene-pantry-colleague.png`，仅作为色彩和材质参考。
输出：`establishing-pantry-bluehour-act3-v01.png`

```text
Create an original 1536×1024 establishing shot for Act 3 of “CantoneseBiz”.

An upscale but believable Hong Kong office pantry during blue hour, temporarily empty. Show a dark counter, two plain paper coffee cups waiting side by side, warm under-cabinet light, glass reflections, and a distant meeting room still lit beyond a corridor. The mood suggests an informal conversation carrying important subtext.

High-end semi-realistic cinematic illustration, 28–35mm lens, cool cyan-blue environment light (#6ADFE7), deep navy cabinetry, restrained warm-gold task lighting, subtle muted purple city reflection. Keep the lower 40% calm and the upper-right low contrast.

No people in focus, no brands, no cup logos, no readable labels, no text, no watermark, no messy kitchenette, no exaggerated neon, no comedy styling.
```

### P1-A04 — ES-04 中环雨夜

输入：`scene-crisis-client.png`，仅作为色彩和材质参考。
输出：`establishing-central-rain-act4-v01.png`

```text
Create an original 1536×1024 establishing shot for Act 4 of “CantoneseBiz”.

Rainy Central, Hong Kong at night, viewed through office glass with realistic rain trails. Show deep city layers, restrained traffic reflections, one distant office war-room light still on, and a subtle sense of time pressure. Do not include a visible main character.

High-end semi-realistic cinematic illustration, 28–35mm lens, deep navy-black city, cyan data-like reflections, muted purple glass, and only a very small restrained crisis orange-red accent (#FF745E). Keep the lower 40% dark and calm and the upper-right low contrast.

No readable signs, no logos, no famous-building hero shot, no text, no watermark, no police/emergency imagery, no violent storm, no cyberpunk neon overload, no extreme Dutch angle.
```

### P1-A05 — ES-05 湾仔夜街

输入：`scene-manager-lunch.png`，仅作为色彩和材质参考。
输出：`establishing-wanchai-night-act5-v01.png`

```text
Create an original 1536×1024 establishing shot for Act 5 of “CantoneseBiz”.

Wan Chai at night after light rain. Show a narrow but credible neighborhood street, warm light spilling from the silhouette of an old-style cha chaan teng entrance, dark teal pavement reflections, passing anonymous umbrellas in the far background, and a quieter emotional tone after a difficult client conversation.

High-end semi-realistic cinematic illustration, 28–35mm eye-level view, deep navy night, warm-gold practical light, muted plum and cyan reflections, realistic wet pavement and aged tile materials. Keep the lower 40% calm for UI and the upper-right low contrast.

No readable shop sign, no logo, no brand, no watermark, no famous storefront recreation, no tourist postcard clichés, no neon cyberpunk overload, no identifiable face.
```

---

## 4. P1-B：十二张剧情插图

### P1-B01 — IN-01 Vincent 推来文件夹

输入：批准后的 Vincent 锚点 + `scene-onboarding-vincent.png`。
输出：`insert-vincent-folder-act1-v01.png`

```text
Create an original 1536×1024 cinematic story insert for Act 1 of “CantoneseBiz”.

Use the approved Vincent anchor as the exact identity and wardrobe source, and the uploaded Admiralty scene only as the lighting and material reference. Show a 70–90mm close view of Vincent’s correct right hand calmly sliding one unbranded dark project folder across a refined reception counter toward the first-person player. Only part of Vincent’s canonical deep navy sleeve, warm ivory cuff, restrained tie edge, and metal watch may be visible. The gesture is instructional, not aggressive.

Deep navy and warm-gold palette, realistic wool, paper, leather and brushed metal, natural hand anatomy, shallow but not extreme depth of field. Keep important content above the lower UI-safe region.

No readable paper, no badge, no logo, no watermark, no extra hand, no duplicated folder, no broken fingers, no dramatic action pose.
```

### P1-B02 — IN-02 电梯反射整理领口

输入：`scene-onboarding-vincent.png`，仅作为画风参考。
输出：`insert-player-elevator-reflection-act1-v01.png`

```text
Create an original 1536×1024 first-person cinematic story insert for Act 1 of “CantoneseBiz”.

Inside a refined Hong Kong office elevator, show the player’s hands adjusting the collar of a warm ivory shirt under a deep gray or navy junior-business jacket. The brushed-metal elevator reflection reveals only an indistinct shoulder and partial jaw silhouette; never show a stable full face. The mood is focused pre-meeting preparation, not anxiety or vanity.

70–90mm close-view feeling, deep navy shadows, warm-gold ceiling reflection, realistic fabric and brushed metal, restrained cyan edge reflection. Keep the lower region calm.

No readable elevator labels, no brand, no logo, no watermark, no complete player face, no selfie pose, no extra hands, no distorted fingers.
```

### P1-B03 — IN-03 未签署方案

输入：`scene-central-client.png`，仅作为画风和环境参考。
输出：`insert-unsigned-proposal-act2-v01.png`

```text
Create an original 1536×1024 cinematic tabletop insert for Act 2 of “CantoneseBiz”.

On a dark walnut executive meeting table, show one unbranded proposal folder slightly open, several clean cream paper pages with abstract non-readable layout blocks, and one slim metal pen resting horizontally rather than signing. A subtle Central sunset reflection crosses the paper while cool glass-blue light holds the shadows. The image must communicate “reviewed but not yet committed”.

70–90mm close-view feeling, realistic paper, metal and wood, deep navy, warm gold and muted purple-gray palette, restrained depth of field.

No readable words, no signature, no numbers, no logo, no watermark, no hands, no duplicated pen, no legal seal, no brand.
```

### P1-B04 — IN-04 陈嘉敏停笔抬眼

输入：批准后的陈嘉敏锚点 + `scene-central-client.png`。
输出：`insert-chen-jiamin-pause-act2-v01.png`

```text
Create an original 1536×1024 cinematic character insert for Act 2 of “CantoneseBiz”.

Use the approved Chan Ka-man anchor as the exact identity and wardrobe source. Show a tight 50–65mm waist-up moment as she stops moving a slim metal pen and raises her eyes toward the first-person player. Her expression is polite skepticism and commercial judgment, intensity 2 of 5, not anger. Preserve the same face, age 38, side-parted collarbone-length hair, charcoal jacket, warm ivory blouse, and matte earrings.

Central sunset warm rim light, cool glass-blue fill, dark walnut table edge, lower UI-safe area calm, right-weighted composition.

No readable papers, no necklace, no logo, no watermark, no smile, no glare, no extra people, no distorted pen or fingers, no redesign.
```

### P1-B05 — IN-05 两杯咖啡

输入：`scene-pantry-colleague.png`，仅作为画风和环境参考。
输出：`insert-two-coffees-act3-v01.png`

```text
Create an original 1536×1024 cinematic tabletop insert for Act 3 of “CantoneseBiz”.

Show two plain unbranded paper coffee cups placed close but not touching on a dark office pantry counter. One cup is slightly nearer the first-person player, suggesting a colleague has brought it for them. Warm under-cabinet light meets blue-hour city reflections; a distant meeting-room light appears as a soft reflection in glass.

70–90mm close-view feeling, realistic paper cup rims, natural condensation and shadows, deep navy, cyan, muted purple and warm-gold palette.

No hands, no people, no readable marks, no cup logo, no watermark, no duplicated cup, no café branding, no exaggerated steam shape.
```

### P1-B06 — IN-06 远处会议室倒影

输入：`scene-pantry-colleague.png`，仅作为画风和环境参考。
输出：`insert-meeting-reflection-act3-v01.png`

```text
Create an original 1536×1024 cinematic reflection insert for Act 3 of “CantoneseBiz”.

Frame a dark pantry glass panel at blue hour. In the reflection, show a distant meeting room still illuminated with an empty table and indistinct anonymous silhouettes leaving the far corridor. The reflection should imply unresolved client business without revealing a face. A soft out-of-focus edge of two coffee cups may appear in the foreground.

50–70mm cinematic lens feeling, layered glass, deep navy, cyan and muted purple city light, restrained warm interior glow, subtle grain.

No readable screens, no signs, no logo, no watermark, no identifiable person, no ghostly supernatural effect, no cyberpunk neon, no clutter.
```

### P1-B07 — IN-07 两组不一致的数据

输入：`scene-crisis-client.png`，仅作为画风和环境参考。
输出：`insert-data-mismatch-act4-v01.png`

```text
Create an original 1536×1024 cinematic data-analysis insert for Act 4 of “CantoneseBiz”.

On a dark war-room table, show two separate cream paper sheets with abstract business charts. The first contains a calm cyan trend line; the second contains a visibly different trajectory with one restrained orange-red divergence. The mismatch must be visually obvious through shape and alignment only, with no readable business text, labels, numbers, company data or logos. A dark laptop edge and cool screen reflection may appear at the side.

70–90mm close-view feeling, deep navy shadows, cyan analytical light, tiny restrained #FF745E crisis accent, realistic paper and screen materials.

No words, no numbers, no recognizable dashboard product, no logo, no watermark, no hands, no duplicated sheets, no alarming red overload.
```

### P1-B08 — IN-08 手机冷光侧脸

输入：批准后的陈嘉敏锚点 + `scene-crisis-client.png`。
输出：`insert-chen-phone-light-act4-v01.png`

```text
Create an original 1536×1024 cinematic character insert for Act 4 of “CantoneseBiz”.

Use the exact same approved Chan Ka-man anchor as Act 2. Show a tight 65mm side-profile moment in the rainy Central war room: she reads a plain dark smartphone, and cool cyan phone light touches one side of her face. Her expression is controlled high pressure, intensity 4 of 5, never panic. Preserve the same face, age, side-parted collarbone-length hair, charcoal jacket, warm ivory blouse, and matte earrings. Only the cuff may be slightly loosened.

Rain-streaked glass and soft city bokeh behind her, deep navy and cyan palette, a tiny restrained warm-orange reflection, natural skin texture.

No readable phone screen, no logo, no watermark, no new jewelry, no wet hair, no crying, no shouting, no distorted phone or fingers, no redesign.
```

### P1-B09 — IN-09 玩家核对清单

输入：`scene-crisis-client.png`，仅作为画风和环境参考。
输出：`insert-player-checklist-act4-v01.png`

```text
Create an original 1536×1024 first-person cinematic story insert for Act 4 of “CantoneseBiz”.

Show the player’s correct hands writing a rapid but controlled verification checklist on one cream page at a dark war-room table. Represent four structured rows using abstract lines, boxes and check marks only: fact scope, responsible owner, impact, and update time. The content must not contain readable words or numbers. A dark sleeve, metal pen, edge of two mismatched chart sheets, and cool laptop light establish the context.

70–90mm close-view feeling, deep navy, cyan and restrained warm-gold palette, one tiny #FF745E reflection, realistic paper and hand anatomy.

No readable writing, no logo, no watermark, no extra fingers, no duplicated pen, no frantic scribble, no blood-red lighting.
```

### P1-B10 — IN-10 奶茶与一页计划

输入：`scene-manager-lunch.png`，仅作为画风和环境参考。
输出：`insert-tea-plan-act5-v01.png`

```text
Create an original 1536×1024 cinematic tabletop insert for Act 5 of “CantoneseBiz”.

On an aged dark cha chaan teng table, show one ceramic tea cup, one simple glass of Hong Kong-style milk tea without branding, one folded cream one-page project plan with abstract non-readable layout blocks, and one slim metal pen. The arrangement should feel practical and decisive, as if a vague agreement is about to become a written next step.

70–90mm close-view feeling, warm-gold practical light, deep navy shadows, muted plum reflection, believable ceramic, glass, paper and worn tabletop texture.

No readable menu, no words, no numbers, no shop logo, no watermark, no hands, no duplicated cups, no decorative food glamour.
```

### P1-B11 — IN-11 试点范围摘要

输入：`scene-manager-lunch.png`，仅作为画风和环境参考。
输出：`insert-pilot-scope-act5-v01.png`

```text
Create an original 1536×1024 cinematic business-document insert for Act 5 of “CantoneseBiz”.

Show one clean cream page on a dark restaurant table. The page uses abstract non-readable shapes to communicate a two-stage pilot: a smaller first block, three unchanged success-indicator symbols, a clear checkpoint arrow, and a larger second-stage block. The structure must be understandable visually but contain no readable words, letters, numbers, company data or logos. A metal pen and warm tea-cup edge may enter the frame.

70–90mm close-view feeling, warm-gold practical light, deep navy and muted plum shadows, restrained cyan indicator accents, realistic paper texture.

No text, no numbers, no logo, no watermark, no signature, no government form, no duplicated pen or cup.
```

### P1-B12 — IN-12 离开茶餐厅

输入：`scene-manager-lunch.png`，仅作为画风参考。
输出：`insert-player-leaves-wanchai-act5-v01.png`

```text
Create an original 1536×1024 first-person closing insert for Act 5 of “CantoneseBiz”.

From the first-person player’s viewpoint, step out from a warm old-style cha chaan teng into a lightly rain-wet Wan Chai night. Show one hand holding the folded unbranded one-page pilot plan at the lower edge, but never show the player’s face. Warm restaurant light falls behind; deep navy street depth, muted plum reflections and restrained cyan city light lead forward. The mood is earned confidence and a concrete next step, not triumphalism.

35–50mm eye-level cinematic view, high-end semi-realistic illustration, realistic wet pavement and paper, lower UI-safe area kept calm.

No readable storefront sign, no logo, no watermark, no famous exact location, no identifiable faces, no extra hands, no cyberpunk neon overload, no celebratory confetti.
```

---

## 5. 角色锚点选择标准

四个候选中只选择同时满足以下条件的一张：

1. 三个视图确实是同一张脸；
2. 年龄符合 36／38／30／46 岁；
3. 四名角色放在一起能立即区分；
4. 服装与 `VISUAL_BIBLE.md` 完全一致；
5. 手、鞋和主要道具完整；
6. 不出现文字、标签、Logo 或水印；
7. 没有明显仿真人物、影视角色或其他项目人物；
8. 适合继续制作朝画面左侧的半身立绘。

批准后命名：

```text
char-vincent-anchor-approved-v01.png
char-chen-jiamin-anchor-approved-v01.png
char-ah-long-anchor-approved-v01.png
char-mrs-ho-anchor-approved-v01.png
```

并将生成记录写入 `ASSET_GENERATION_LOG.csv`，状态先记为 `candidate`，完成 QA 后改为 `approved`。
