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

## Speech lifecycle

The campaign response, every practice response, the custom-scenario intake and
each custom round share one `UtteranceInput` module. The practice-library search
box remains text-only.

```text
microphone
├── MediaRecorder → original Blob → IndexedDB / playback / download
├── browser SpeechRecognition → experimental interim/final captions
└── AudioWorklet → 16 kHz mono PCM → guarded HKChat WebSocket path (disabled today)

uploaded audio → IndexedDB → FastAPI validation/PyAV normalization
               → JSON/Base64 → HKChat Speech file transcription

editable transcript → explicit learner submit → existing dual-model turn
```

`SpeechTranscriptionModule` is independent of `GameEngine`. It validates file
headers, size, duration, scope, client concurrency and WebSocket Origin, then
normalizes audio to 16 kHz mono. HKGAI Studio documents Bearer authentication
and the JSON/Base64 `speech_recognize` HTTP response contract, so a Speech key
enables file transcription through that verified endpoint. Studio currently
documents only a TTS WebSocket; HKChat server-side live ASR stays disabled until
the organiser supplies a distinct streaming-recognition contract. The production
module does not construct a live adapter from a URL: server live capability can
only be exposed by an explicitly injected adapter whose upstream contract has
been implemented and verified.

On desktop Chrome/Edge, `UtteranceInput` separately uses the browser Web Speech
API when available. It requests Cantonese with `yue-Hant-HK` and falls back to
`zh-HK`, keeps interim text outside the editable field, and reports provenance as
`browser-speech`. This client capability is intentionally independent of the
backend `live_supported` flag. Browser recognition may use a browser-vendor cloud
service, so the consent dialog discloses that audio can leave the device.

If a real HKChat ASR WebSocket contract is supplied, its live interim/final events
use increasing sequence numbers. Both live paths keep interim text separate from
the editable field and only adopt a completed transcript. If browser or server
live recognition fails, the finished recording is retained and HKChat file
transcription is attempted once when available.
Speech provenance is shown separately from DeepSeek scene provenance and
HKChat text-review provenance.

## Public deployment and spend guard

GitHub Pages hosts the static application under `/cantonese-biz-galgame/`.
`VITE_PUBLIC_DEMO_MODE=true` never implies an API endpoint: only an explicit
HTTPS `VITE_API_BASE_URL` enables remote calls. With no endpoint, turn requests,
scenario composition and Speech capability checks short-circuit locally, while
the deterministic game, local inference, keyboard input, recordings and judge
showcase remain usable.

An optional public FastAPI deployment enables `PUBLIC_AI_BUDGET_CNY=5`.
`PublicApiBudget` atomically reserves a conservative fixed amount before each
dual-model turn in SQLite, caps each hashed client at five turns, and exposes
only aggregate status through `GET /api/public/quota`. It never stores raw IPs,
prompts or responses. A separate provider account funded with no more than the
approved amount is still required as the final billing hard stop because an
application database cannot protect against every platform reset or multi-
instance misconfiguration.

## Trust boundaries

- API keys live only in `backend/.env`.
- The browser receives no provider credential.
- CORS is restricted through `ALLOWED_ORIGINS`.
- The backend does not persist request bodies.
- Audio is stored only in the dedicated browser IndexedDB, for at most the
  latest 20 assets and no longer than 30 days. It is never written to campaign
  storage, training progress, `localStorage` or `TurnCache`.
- The audio store records an anonymous generated label and technical metadata;
  it does not record the original upload filename, transcript, scenario text or
  model result. The learner can play, download, retranscribe or delete each
  asset and clear the store.
- Uploaded audio is decoded from request memory and `UploadFile` is closed in a
  `finally` block. The backend has no audio library or long-term audio storage.
- Before the first recording or upload, the browser discloses that Chrome/Edge
  may send microphone audio to its recognition service and that fallback/file
  audio is sent to HKChat Speech. In the custom-scenario intake, audio can leave
  the browser before the resulting text can receive browser-side redaction.
- Custom-scenario raw text is replaced by the anonymised draft after
  composition and cleared when the experience unmounts; neither form is
  written to storage.
- Source records are reviewed metadata, not scraped page bodies.
- User accounts, cloud audio storage and cross-device audio sync remain outside
  the MVP. Keyboard input and every deterministic offline path remain usable
  when speech is unavailable.

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
