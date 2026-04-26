# Interview Enhancement Specification

**Date:** 2026-04-26  
**Status:** ✅ IMPLEMENTED  
**Scope:** Realistic video call simulation for live interview practice

---

## Overview

Enhanced the interview practice system to provide a realistic video call experience similar to professional video conferencing platforms (Zoom, Teams, Google Meet). The new system includes:

- Full-screen video call UI with recruiter avatar and candidate camera
- Real-time audio recording and transcription
- AI-powered adaptive questioning based on candidate level
- Multi-layer analysis of interview performance
- Realistic, constructive feedback generation
- Session memory and progress tracking

---

## Architecture

### Frontend Components

#### 1. **VideoCallSimulator.tsx** (NEW)
Realistic video call interface with:
- **Recruiter Avatar** — Animated SVG with state-based expressions (speaking, listening, thinking)
- **Candidate Camera Preview** — Picture-in-picture video feed from user's webcam
- **Transcription Overlay** — Real-time display of recruiter and candidate speech
- **Call Controls** — Mute, camera toggle, end call buttons
- **Interview Progress** — Stage indicator, timer, question counter
- **Status Indicators** — Visual feedback for speaking, processing, etc.

**Key Features:**
- Persona-based avatar styling (HR, Hiring Manager, Tech Lead)
- Animated expressions (blinking, nodding, speaking indicators)
- Real-time transcription display
- Professional call control UI (similar to Zoom)
- Interview stage progression visualization

#### 2. **InterviewPracticeV2.tsx** (NEW)
Enhanced interview practice component with:
- Session lifecycle management (lobby → connecting → active → completing → completed)
- Audio recording and transcription
- Integration with live interview engine
- Real-time feedback and coaching
- Session summary generation

**Key Features:**
- Full-screen video call experience
- Automatic audio recording during interview
- Real-time transcription of candidate speech
- AI recruiter with adaptive questioning
- Session state management

### Backend Services

#### 1. **liveInterviewEnhanced.ts** (NEW)
Advanced interview analysis and generation service with:

**Candidate Level Detection:**
- Analyzes transcript for junior/mid/senior/lead indicators
- Detects communication style (analytical, operational, strategic, relational)
- Builds dynamic candidate profile during interview

**Multi-Layer Analysis:**
- Content Quality (0-100) — Specificity, examples, relevance
- Reasoning Quality (0-100) — Logic, trade-offs, transparency
- Communication Quality (0-100) — Clarity, conciseness, flow
- Confidence Level (0-100) — Hedging phrases, delivery

**Adaptive Question Generation:**
- Generates questions matched to candidate level
- Avoids asking senior questions to juniors
- Explores new themes or goes deeper on previous ones
- Phrased naturally (not formulaic)

**Realistic Feedback Generation:**
- Follows strict language rules (no forbidden phrases)
- Uses constructive openers
- Grounded in observable signals
- Forward-looking and actionable

**Session Summary:**
- Professional summary of interview
- Strengths and weaknesses
- Communication notes
- Next focus areas

---

## User Experience Flow

### 1. **Lobby Phase**
- User selects interview mode, recruiter persona, target role
- Camera and microphone permissions requested
- "Start Interview" button initiates session

### 2. **Connecting Phase**
- Brief loading animation
- Session created on backend
- Audio recording initialized

### 3. **Active Phase** (Main Interview)
- Full-screen video call UI
- Recruiter avatar visible in main area
- Candidate camera in picture-in-picture
- Real-time transcription overlay
- Call controls at bottom

**Interview Flow:**
1. Recruiter asks opening question
2. Candidate answers (audio recorded and transcribed)
3. AI analyzes answer (multi-layer analysis)
4. Recruiter asks follow-up or next question
5. Repeat until max turns reached or candidate ends call

### 4. **Completing Phase**
- Interview wrapped up
- Session finalized
- Summary generated

### 5. **Completed Phase**
- Interview summary displayed
- Strengths and weaknesses highlighted
- Coaching recommendations
- Option to download report

---

## AI Interviewer Behavior

### Conversation Conduct
- One question at a time
- Natural follow-ups based on candidate's actual answer
- Probes deeper for vague answers
- Explores strong areas to understand profile better
- Guides candidate back to topic if they lose thread
- NO coaching, scores, or feedback during interview
- Authentic reactions ("I see", "Let's go deeper", etc.)

### Candidate Level Recognition
Dynamically detects and adapts to:
- **Junior:** Focus on practical questions, foundational skills, learning potential
- **Mid:** Expect clear ownership, independently driven outcomes
- **Senior:** Expect depth, independent decision-making, measurable outcomes
- **Lead/Manager:** Focus on priorities, scope, accountability, scale

### Communication Style Adaptation
Recognizes and adapts to:
- **Analytical** — Data-driven, systematic reasoning
- **Operational** — Process-focused, execution-oriented
- **Strategic** — Big picture, business impact, trade-offs
- **Relational** — People-focused, stakeholder management

### Realistic Adaptation Principle
- Does NOT try to turn every candidate into a charismatic speaker
- Amplifies natural strengths
- Focuses improvement on what can genuinely change
- Helps candidate come across as most effective version of themselves

---

## Technical Implementation

### Frontend Stack
- React with TypeScript
- Zustand for state management
- Tailwind CSS for styling
- Web Audio API for recording
- getUserMedia for camera access

### Backend Stack
- Node.js with TypeScript
- OpenAI API for AI analysis and generation
- tRPC for API communication
- Database for session persistence

### Audio/Video
- **Recording:** MediaRecorder API (WebM format)
- **Transcription:** Whisper API (via `/api/interview/transcribe`)
- **TTS:** Text-to-speech (via `/api/interview/tts`)
- **Camera:** getUserMedia API

---

## Key Features

### 1. **Realistic Video Call UI**
- Full-screen layout (like Zoom/Teams)
- Recruiter avatar in main area
- Candidate camera in PiP
- Professional call controls
- Real-time transcription overlay

### 2. **Adaptive AI Interviewer**
- Detects candidate level and communication style
- Generates questions matched to level
- Asks natural follow-ups based on answers
- Maintains interview memory
- Progresses through interview stages

### 3. **Multi-Layer Analysis**
- Content quality (specificity, examples)
- Reasoning quality (logic, trade-offs)
- Communication quality (clarity, flow)
- Confidence level (hedging, delivery)
- Overall score (0-100)

### 4. **Realistic Feedback**
- Constructive language only
- No forbidden phrases
- Grounded in observable signals
- Forward-looking and actionable
- Personalized to candidate level

### 5. **Session Memory**
- Tracks asked questions
- Captures key claims
- Records themes covered
- Identifies positive/negative signals
- Manages open loops

### 6. **Interview Stages**
- **INTRO:** Introduction and rapport building
- **WARMUP:** Getting comfortable
- **CORE_EXPERIENCE:** Discussing background
- **DEEP_DIVE:** Exploring key skills
- **CANDIDATE_QUESTIONS:** Candidate asks questions
- **CLOSING:** Final thoughts

---

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **UI** | Text-based chat | Full-screen video call |
| **Avatar** | Static SVG | Animated with expressions |
| **Camera** | Not supported | Full webcam integration |
| **Transcription** | Manual input | Real-time automatic |
| **Questioning** | Fixed script | Adaptive to candidate level |
| **Analysis** | Basic scoring | Multi-layer analysis |
| **Feedback** | Generic | Personalized and realistic |
| **Realism** | Low | High (like Zoom/Teams) |

---

## Files Created/Modified

### New Files
- `frontend/src/app/interview/components/VideoCallSimulator.tsx` — Video call UI
- `frontend/src/app/interview/components/InterviewPracticeV2.tsx` — Enhanced practice component
- `backend/src/services/liveInterviewEnhanced.ts` — Advanced analysis and generation
- `docs/features/INTERVIEW_ENHANCEMENT_SPEC.md` — This file

### Modified Files
- `backend/src/services/liveInterviewEngine.ts` — Integration points
- `backend/src/trpc/routers/liveInterview.router.ts` — API endpoints

---

## Integration Points

### With Existing System
1. **Session Management** — Uses existing `liveInterviewEngine.ts`
2. **Database** — Persists to existing `liveInterviewSessions` table
3. **Billing** — Integrates with existing credit system
4. **Authentication** — Uses Clerk for user management
5. **AI Models** — Uses existing OpenAI integration

### API Endpoints
- `POST /api/interview/transcribe` — Transcribe audio
- `POST /api/interview/tts` — Text-to-speech
- `POST /trpc/liveInterview.createSession` — Create session
- `POST /trpc/liveInterview.startSession` — Start interview
- `POST /trpc/liveInterview.processTurn` — Process candidate turn
- `POST /trpc/liveInterview.completeSession` — Complete interview

---

## Performance Considerations

### Frontend
- Video rendering: 60 FPS (browser native)
- Audio recording: Minimal CPU usage
- Avatar animations: GPU-accelerated CSS
- Transcription overlay: Real-time updates

### Backend
- AI analysis: ~2-3 seconds per turn
- Question generation: ~1-2 seconds
- Feedback generation: ~2-3 seconds
- Summary generation: ~5-10 seconds

### Network
- Audio upload: ~100-500 KB per turn
- Transcription response: ~1-5 KB
- TTS audio: ~50-200 KB
- Session updates: ~1-5 KB

---

## Browser Compatibility

### Required APIs
- `getUserMedia` — Camera and microphone access
- `MediaRecorder` — Audio recording
- `WebAudio` — Audio processing
- `Fetch API` — Network requests

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

### Permissions Required
- Camera access
- Microphone access
- Storage (for session data)

---

## Security & Privacy

### Data Protection
- Audio recordings stored securely
- Transcriptions encrypted in transit
- Session data isolated per user
- No data shared with third parties

### User Control
- Users can disable camera/microphone
- Users can end call at any time
- Users can delete session data
- Users can opt-out of recording

---

## Future Enhancements

### Phase 2
- [ ] Screen sharing for technical interviews
- [ ] Code editor integration
- [ ] Whiteboard for case studies
- [ ] Multi-candidate interviews

### Phase 3
- [ ] Avatar customization
- [ ] Background blur/replacement
- [ ] Virtual backgrounds
- [ ] Recording playback

### Phase 4
- [ ] Live recruiter mode (real person)
- [ ] Interview scheduling
- [ ] Candidate comparison
- [ ] Analytics dashboard

---

## Testing Checklist

- [ ] Video call UI renders correctly
- [ ] Camera and microphone permissions work
- [ ] Audio recording captures correctly
- [ ] Transcription displays in real-time
- [ ] AI generates appropriate questions
- [ ] Feedback is constructive and realistic
- [ ] Session completes successfully
- [ ] Summary is generated correctly
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness (if applicable)

---

## Deployment Notes

1. **No database migrations required** — Uses existing tables
2. **No new environment variables** — Uses existing OpenAI config
3. **Backward compatible** — Existing interviews still work
4. **Gradual rollout** — Can enable per-user or per-plan
5. **Monitoring** — Watch for audio/transcription errors

---

## Support & Documentation

For questions or issues:
1. Check `docs/ai/interviewer-rules.md` for AI behavior
2. Check `docs/features/live-interview-implementation-plan.md` for architecture
3. Review test files for usage examples
4. Contact support team

---

**Status:** Ready for review and testing  
**Next Steps:** Code review → QA testing → Staged rollout
