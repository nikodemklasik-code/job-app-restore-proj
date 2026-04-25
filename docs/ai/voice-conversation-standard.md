# AI Voice Conversation Standard

## Principle

Every screen that is an AI conversation must behave like a real conversation.

If a screen is presented as an AI conversation, it must not rely on a slow manual record/review/process loop as the main experience.

The user should be able to speak naturally, see what was understood, and receive a timely AI response without operating the screen like a recorder.

## Required conversation loop

The standard conversational loop is:

1. AI move: the AI asks a question, gives a prompt, or continues the conversation.
2. User move: the user speaks naturally.
3. Voice detector listens automatically.
4. Recording starts automatically when speech is detected.
5. End-of-speech / silence detection closes the user turn.
6. Audio is transcribed.
7. The transcript is shown visibly to the user.
8. The AI processes the turn.
9. The AI streams or returns the response.
10. The next turn becomes ready automatically.

## Required UI states

All AI conversation screens should support these states, even if the visual treatment differs by module:

- `ai_speaking`
- `listening`
- `user_speaking`
- `transcribing`
- `processing`
- `ai_replying`
- `ready_for_next_turn`
- `error`

The UI must make the current state clear. Users should not be left staring at vague processing copy.

## Voice detector requirement

Conversation modules must use voice detection / auto turn-taking as the default voice flow.

The user should not need to repeatedly press start, stop, pause or submit as the main interaction model.

Manual controls may exist as fallback controls, but they must not be the primary experience for premium AI conversation modules.

## Transcript requirement

The transcript must be visible.

The system should show what it understood before or while the AI processes the response.

This protects the user from hidden transcription errors and makes the interaction feel transparent.

Recommended transcript behaviour:

- show `Listening...` before speech;
- show `Speaking detected...` during the user turn;
- show `Transcribing...` after end-of-speech;
- show the transcript as soon as available;
- allow retry/edit where practical;
- then continue to AI processing.

## Tier 1 modules: premium AI conversation

The highest interaction tier applies to every premium AI conversation module:

- AI Assistant;
- Interview;
- AI Coach;
- Negotiation.

These modules must use the same high-quality conversational standard.

They are expected to feel like normal interactive conversation with a live interlocutor, not like a recorder, form or delayed processing queue.

Required standard:

- natural turn-taking;
- voice detector by default;
- automatic end-of-speech handling;
- visible transcript;
- fast AI response;
- minimal waiting copy;
- streamed response where possible;
- no recorder-style main flow;
- no long silent processing state without explanation;
- consistent interaction quality across AI Assistant, Interview, AI Coach and Negotiation.

## Tier 2 modules: reflective AI routines

Daily Wrap and Daily Warmup may use a slower, more reflective rhythm.

These modules can allow more pause, review and deliberate response time.

They still must show:

- the AI prompt;
- the listening/recording state;
- transcription status;
- visible transcript;
- AI response status;
- clear completion or next-step state.

Daily Wrap can be calmer than Interview, Coach, Negotiation or AI Assistant, but it should not be confusing.

## Shared implementation direction

The product should move toward a shared voice conversation engine instead of each module maintaining its own recording logic.

Recommended shared hook/component:

```ts
useVoiceTurnEngine({
  onTranscript,
  onUserTurnComplete,
  onAIResponseStart,
  onAIResponseEnd,
  autoRestartListening: true,
})
```

The shared engine should handle:

- microphone permission;
- media recorder lifecycle;
- voice activity detection;
- silence detection;
- transcript submission;
- state transitions;
- restart after AI response;
- fallback controls;
- cleanup on unmount.

## Current audit notes

Interview Practice already has core building blocks:

- `MediaRecorder`;
- `/api/interview/transcribe`;
- `/api/interview/tts`;
- conversation phases such as AI speaking, user turn and processing;
- voice activity related refs.

Negotiation already has a strong VAD-style flow:

- voice mode;
- speech threshold;
- silence threshold;
- automatic transcript submission;
- streamed AI response.

Coach currently has recording, transcription and TTS, but the main experience is closer to question -> record/timer -> review -> evaluate.

Coach must be upgraded to the Tier 1 conversation standard.

AI Assistant must also share the same premium conversation interaction standard where voice mode is available.

Case Practice currently has listen-along and generation, but it is not yet a full voice conversation loop.

## Product rule

If it is an AI conversation screen, it must behave like a conversation.

AI Assistant, Interview, AI Coach and Negotiation must share the same high-quality interaction level.

If the product cannot support a real conversation loop for a screen, the screen should not be presented as a live AI conversation.
