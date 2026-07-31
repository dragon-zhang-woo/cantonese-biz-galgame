# Architecture

## Design principle

The model performs a character; it does not direct the application.

The frontend owns the five-act story graph and the offline fallback payload.
DeepSeek performs the immediate NPC reaction and bounded score delta. HKChat
independently reviews the player's wording for naturalness, politeness and
Hong Kong business fit. Neither provider can choose a different next node.

The training platform adds a second deterministic layer: a scenario composer
classifies a redacted workplace description, retrieves source-bound skill
cards, and assembles two or three rounds from controlled templates. It never
stores the raw description.

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

1. The browser validates 20–500 characters and redacts names, organisations,
   contact details, URLs, addresses and secret-like strings.
2. `POST /api/scenario/compose` classifies relationship, task, conflict,
   channel and pressure.
3. The backend retrieves relevant skill cards and their official sources.
4. The composer returns two or three bounded rounds with an explicit goal.
5. The existing turn API performs each NPC response and language review.
6. The browser scores six observable behaviours from 0–4 and produces a
   reusable action template.
7. If the composer is unavailable, the browser matches the closest authored
   scenario without retaining the raw input.

## Trust boundaries

- API keys live only in `backend/.env`.
- The browser receives no provider credential.
- CORS is restricted through `ALLOWED_ORIGINS`.
- The backend does not persist request bodies.
- Custom-scenario raw text is cleared from component state after composition.
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
