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
