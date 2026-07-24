# Asset Sources

This file records every non-code visual asset used by CantoneseBiz.

## Original AI-assisted scene art

The gameplay scenes were generated specifically for this project with OpenAI
ImageGen under the project author's direction. They do not intentionally depict
a real person, existing game character, trademark or franchise.

| File | Internal generation record | Purpose |
|---|---|---|
| `public/assets/scene-central-client.png` | `019f7a09-af72-7342-92ea-9ccddf9fa650` | Opening client meeting |
| `public/assets/scene-pantry-colleague.png` | `019f7a09-f568-7090-afc7-5b15c4d1f328` | Office pantry conversation |
| `public/assets/scene-manager-lunch.png` | `019f7a0a-6581-79a3-a62a-80089f6c3966` | Manager lunch debrief |
| `public/assets/scene-onboarding-vincent.png` | `019f79f4-b3ea-78a1-95da-4bba6f7af903 / exec-c49f8b46-960b-4ad6-bba9-1f2d609b0a55` | Admiralty onboarding |
| `public/assets/scene-crisis-client.png` | `019f79f4-b3ea-78a1-95da-4bba6f7af903 / exec-08adaf13-e760-40b3-97c4-b41e50d836b5` | Client crisis response |

Prompts and art direction were created for CantoneseBiz. Source generation
records are retained locally by the project author.

The 2026-07-22 onboarding prompt requested an original fictional manager in a
Hong Kong office reception, with a right-weighted subject, blue-and-warm-gold
cinematic lighting and a quiet lower area reserved for the game interface. The
crisis prompt used the project's fictional client image only as a continuity
reference and requested a rainy Central office war room, restrained urgency
accents and the same interface-safe composition. Both prompts explicitly
excluded brands, readable text, watermarks, real people and existing
franchises.

## Visual-production governance

The canonical visual rules are maintained in
[`docs/visual-production/VISUAL_BIBLE.md`](docs/visual-production/VISUAL_BIBLE.md).
The detailed, row-level generation and QA ledger is
[`docs/visual-production/ASSET_GENERATION_LOG.csv`](docs/visual-production/ASSET_GENERATION_LOG.csv).
This file remains the authoritative human-readable source and license ledger;
the CSV supplements it and must not replace or remove the provenance and
license notes below.

Every accepted generated or edited asset must record:

- asset ID and repository path;
- act, story beat, character and location;
- model, date, dimensions and quality setting;
- complete prompt version or prompt-file reference;
- character-anchor and style-reference inputs;
- parent asset and full generation/edit ID, including any `exec-...` record;
- selection rationale and reviewer;
- QA outcomes for character identity, composition/UI safe areas, palette,
  hands/props, and absence of unintended text, logos or watermarks;
- license and originality notes.

Allowed lifecycle values are `draft`, `candidate`, `approved`, `rejected`,
`superseded` and `archive`. Replaced files move to an archive path; their ledger
rows remain intact so the edit lineage is not lost.

## Interface icons

The interface uses `@phosphor-icons/react`, distributed under the MIT License.
No icon was copied or redrawn from another game.

## Fonts

The interface bundles Noto Sans Hong Kong through
`@fontsource-variable/noto-sans-hk`. Noto fonts are distributed under the SIL
Open Font License 1.1.

## Story and copy

All character names, dialogue, translations, scoring rules and story branches
in `src/data/scenes.js` were authored for this project. They are fictional and
do not reproduce a screenplay, television program or existing game.
