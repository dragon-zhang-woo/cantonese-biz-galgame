# Architecture

## Design principle

The model performs a character; it does not direct the application.

The frontend owns the five-act story graph and the offline fallback payload.
DeepSeek performs the immediate NPC reaction and bounded score delta. HKChat
independently reviews the player's wording for naturalness, politeness and
Hong Kong business fit. Neither provider can choose a different next node.

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

## Trust boundaries

- API keys live only in `backend/.env`.
- The browser receives no provider credential.
- CORS is restricted through `ALLOWED_ORIGINS`.
- The backend does not persist request bodies.
- User identity, microphone audio and free-form personal data are outside the
  MVP.

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
