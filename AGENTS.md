# Prototype Instructions

Before continuing project work, read `MEMORY.md` for the latest compact implementation state, validation results, and recommended next steps.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable Product Decisions

- The selected visual target is ideation direction 3:
  `C:\Users\lenovo\.codex\generated_images\019f79f8-513d-7440-af2a-e8df86af7a6f\central-command-1440x1024.png`.
- Preserve the cinematic Hong Kong office composition: full-bleed scene art, the active NPC on the right, compact status readout in the upper-right, and the dialogue/choice console occupying the lower third.
- The core product is a five-act, desktop-first AI visual novel for Hong Kong business Cantonese and workplace culture. It must remain usable on a 390px-wide phone.
- The game must complete in standard story mode without any model or network. AI improvisation is an enhancement, never the only path.
- All story, character, and generated visual assets must be original and recorded in `ASSET_SOURCES.md`.
- Dialogue consoles, coaching/review panels, choices and modals use smooth restrained curves, layered translucent materials, subtle edge highlights and low-noise texture. Avoid both hard flat rectangles and oversized consumer-app bubble styling.

## Durable Visual Asset Decisions

- `docs/visual-production/VISUAL_BIBLE.md` is the canonical visual-production specification; supporting character, story-map and prompt documents must not contradict it.
- Character continuity is anchor-image based. Approve one anchor sheet per main NPC before generating portraits or scene variants, then reuse that anchor as an image input.
- Main NPCs are Vincent 梁志诚, 陈嘉敏, 阿朗 and 何太.
- Vincent is the project onboarding/mentoring manager (`项目带教经理`); 何太 is the player's department line manager and final review owner. Keep these roles distinct in code, prompts and documentation.
- The player remains a first-person, face-obscured protagonist in core gameplay art.
- Main scene assets stay at 1536×1024 with the active NPC right-weighted, the lower 40% free of critical content, and the upper-right status region visually quiet.
- Character anchor sheets stay at 1024×1536.
- Preserve the palette `#050B18`, `#091329`, `#0C1933`, `#F4BE55`, `#D79B29`, `#BA89FF`, `#6ADFE7`, with `#FF745E` reserved for restrained crisis accents.
- Use high-end semi-realistic cinematic illustration, not exaggerated anime, plastic photorealism, generic corporate stock imagery or neon cyberpunk.
- Record every accepted generated asset in both `ASSET_SOURCES.md` and `docs/visual-production/ASSET_GENERATION_LOG.csv`, including generation/edit IDs, input anchors, prompt version and QA results.
- Visual enrichment may add five establishing shots, twelve story inserts, five reaction-portrait groups and reusable overlays, but it must not change the deterministic five-act story graph or `nextSceneId`.
- Each act now uses the accepted establishing shot as a prelude and the accepted reaction sheet plus story inserts as a post-choice consequence sequence. Keep this cinematic rhythm when adding content.
- The four accepted character anchor sheets power the in-game relationship dossiers; do not replace them with text-only biographies or untracked portraits.
- Preserve the original five-act `nextSceneId` campaign as the short competition demo, but practical expansion may add standalone training cases outside that graph. Each main NPC should have at least three playable encounters across the campaign and training library.
- Standalone training cases must teach a transferable workplace task, expose a hidden relationship risk, support free response in dual-model mode, retain a deterministic offline path, and end with an actionable real-world template.
- Every non-home experience and blocking overlay must expose a clear, directly actionable “返回首页” control; icon-only close controls are not a sufficient home-navigation path.
- Treat “我的现实情境” as the long-term core training surface, not a small template picker: preserve user control over relationship, channel, focus, pressure and session length.
- Custom training must carry the anonymized conversation history across rounds; the latest bounded DeepSeek NPC reaction becomes the next turn rather than resetting to a generic scripted prompt.
- Show DeepSeek role simulation and 港话通 language review as distinct per-turn evidence, disclose fallback use, and let the learner end after a useful closure instead of forcing every planned round.
- Adaptive custom-scene art uses the approved six-scene batch recorded in `GPT_IMAGE_2_CUSTOM_SCENE_PROMPTS.md`; keep relationship, speaker and background identity aligned.

## Durable Repository Workflow

- Use `develop` as the ongoing integration and development branch.
- Keep `main` as the stable competition-submission and public-deployment branch.
- Base future feature branches on `develop`, then promote verified release-ready work from `develop` to `main`.
