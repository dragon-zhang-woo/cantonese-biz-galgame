# Architecture

## Design principle

The model performs a character; it does not direct the application.

The frontend owns the five-act story graph and the offline fallback payload.
DeepSeek performs the immediate NPC reaction and bounded score delta. HKChat
independently reviews the player's wording for naturalness, politeness and
Hong Kong business fit. Neither provider can choose a different next node.

The training platform adds a second deterministic layer: a scenario composer
classifies a redacted workplace description, retrieves source-bound skill
cards, and assembles three to six rounds from controlled templates. Browser
and API inference share one JSON rule set and one conformance-fixture suite.

## Turn lifecycle

1. The player selects one of two authored actions.
2. Standard mode resolves locally.
3. AI mode sends the scene, action, current status and authored fallback to
   `POST /api/game/turn`.
4. DeepSeek and HKChat run concurrently behind separate provider contracts.
5. DeepSeek returns a `ModelTurn`; HKChat returns `LocalizationFeedback`.
6. Pydantic rejects missing, oversized or out-of-bounds fields.
7. Either provider may fall back independently without discarding the other.
8. The validated response is cached for repeated demo inputs.
9. The browser applies the bounded delta and advances along the fixed graph.

## Custom scenario lifecycle

1. The browser validates 20–1000 characters and redacts names, organisations,
   contact details, URLs, addresses and secret-like strings.
2. `POST /api/scenario/compose` classifies relationship, task, conflict,
   channel and pressure.
3. The backend retrieves relevant skill cards and their official sources.
4. The composer returns 3–6 bounded rounds, composition provenance, a visual
   scene ID and confidence-labelled relation/channel/focus inference.
5. The existing turn API performs each NPC response and language review.
6. The learner can correct low-confidence inference before starting; the
   browser retains only the anonymised draft during the mounted experience.
7. The browser scores six observable behaviours from 0–4, shows the per-round
   progression and produces an explicitly copied action card that excludes
   original input and round answers.
8. If the composer is unavailable, the browser matches the closest authored
   scenario without retaining the raw input.

## Trust boundaries

- API keys live only in `backend/.env`.
- The browser receives no provider credential.
- CORS is restricted through `ALLOWED_ORIGINS`.
- The backend does not persist request bodies.
- Custom-scenario raw text is replaced by the anonymised draft after
  composition and cleared when the experience unmounts; neither form is
  written to storage.
- Source records are reviewed metadata, not scraped page bodies.
- User identity and microphone audio are outside the MVP.

## Provider extension

`AIProvider` owns scene performance:

```python
async def generate_turn(request: TurnRequest) -> ModelTurn
```

`LocalizationProvider` owns Hong Kong workplace-language review:

```python
async def review(request: TurnRequest) -> LocalizationFeedback
```

The game engine composes both contracts into one `TurnResponse` while keeping
the fixed story graph authoritative.

## Judge showcase boundary

The judge showcase reads Act 1, 4 and 5 data through a separate React state
container. It does not call either API, invoke the campaign transition
functions or write session storage. “Enter full campaign” closes the showcase
and resumes the existing campaign scene rather than replacing its checkpoint.
