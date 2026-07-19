# Architecture

## Design principle

The model performs a character; it does not direct the application.

The frontend owns the three-act story graph and the offline fallback payload.
The backend may rewrite the immediate NPC reaction, translation, coaching
feedback and bounded score delta. It cannot choose a different next node.

## Turn lifecycle

1. The player selects one of two authored actions.
2. Standard mode resolves locally.
3. AI mode sends the scene, action, current status and authored fallback to
   `POST /api/game/turn`.
4. The selected provider returns a `ModelTurn`.
5. Pydantic rejects missing, oversized or out-of-bounds fields.
6. Any provider failure returns the authored fallback.
7. The browser applies the validated delta and advances along the fixed graph.

## Trust boundaries

- API keys live only in `backend/.env`.
- The browser receives no provider credential.
- CORS is restricted through `ALLOWED_ORIGINS`.
- The backend does not persist request bodies.
- User identity, microphone audio and free-form personal data are outside the
  MVP.

## Provider extension

`AIProvider` exposes one method:

```python
async def generate_turn(request: TurnRequest) -> ModelTurn
```

An HKGAI Studio provider can implement the same contract without changing the
game engine or UI.
