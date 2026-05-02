/**
 * VideoCallSimulator.tsx
 *
 * Realistic video call simulation for live interviews.
 * Each recruiter persona is rendered as a full upper-body SVG human figure
 * seated in a realistic office environment — like a Zoom/Teams call.
 */

import { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterviewStage = 'INTRO' | 'WARMUP' | 'CORE_EXPERIENCE' | 'DEEP_DIVE' | 'CANDIDATE_QUESTIONS' | 'CLOSING';
export type RecruiterPersona = 'hr' | 'hiring-manager' | 'tech-lead';

export interface VideoCallSimulatorProps {
  recruiterName: string;
  recruiterRole: string;
  recruiterPersona: RecruiterPersona;
  interviewStage: InterviewStage;
  isRecruiterSpeaking: boolean;
  recruiterMessage: string;
  candidateTranscript: string;
  isCandidateSpeaking: boolean;
  isProcessing: boolean;
  turnCount: number;
  maxTurns: number;
  onMicToggle: (enabled: boolean) => void;
  onCameraToggle: (enabled: boolean) => void;
  onEndCall: () => void;
  onSendMessage?: (message: string) => void;
  micEnabled: boolean;
  cameraEnabled: boolean;
  elapsedSeconds: number;
}

// ─── Stage Labels ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<InterviewStage, { label: string; description: string }> = {
  INTRO: { label: 'Introduction', description: 'Getting to know each other' },
  WARMUP: { label: 'Warm-up', description: 'Building rapport' },
  CORE_EXPERIENCE: { label: 'Core Experience', description: 'Discussing your background' },
  DEEP_DIVE: { label: 'Deep Dive', description: 'Exploring key skills' },
  CANDIDATE_QUESTIONS: { label: 'Your Questions', description: 'Ask us anything' },
  CLOSING: { label: 'Closing', description: 'Final thoughts' },
};

// ─── Persona data ─────────────────────────────────────────────────────────────

interface PersonaData {
  name: string;
  role: string;
  skin: string;
  skinDark: string;
  hair: string;
  hairHi: string;
  shirt: string;
  shirtDark: string;
  collar: string;
  lip: string;
  iris: string;
  female: boolean;
}

const PERSONAS: Record<RecruiterPersona, PersonaData> = {
  hr: {
    name: 'Sarah',
    role: 'HR Business Partner',
    skin: '#F4C2A1',
    skinDark: '#D4956A',
    hair: '#3B1F0C',
    hairHi: '#7A3F1A',
    shirt: '#6366f1',
    shirtDark: '#3730a3',
    collar: '#ffffff',
    lip: '#C4605A',
    iris: '#5A8040',
    female: true,
  },
  'hiring-manager': {
    name: 'James',
    role: 'Engineering Manager',
    skin: '#FDDCB5',
    skinDark: '#E0A870',
    hair: '#1C0F06',
    hairHi: '#3D2010',
    shirt: '#1e3a5f',
    shirtDark: '#0d1f35',
    collar: '#f5f5f5',
    lip: '#B87060',
    iris: '#3A5F8A',
    female: false,
  },
  'tech-lead': {
    name: 'Alex',
    role: 'Senior Tech Lead',
    skin: '#C08040',
    skinDark: '#8B5522',
    hair: '#0D0D0D',
    hairHi: '#282828',
    shirt: '#1f2937',
    shirtDark: '#111827',
    collar: '#374151',
    lip: '#9A5040',
    iris: '#3A2010',
    female: false,
  },
};

// ─── Full-body video-call SVG ─────────────────────────────────────────────────
// viewBox 640×480 — standard 4:3 video feed
// Person seated, visible from ~upper thigh to top of head

function PersonVideoFeed({
  p,
  blink,
  mouth,
  speaking,
}: {
  p: PersonaData;
  blink: boolean;
  mouth: boolean;
  speaking: boolean;
}) {
  // Eye scaleY: closed when blinking
  const ey = blink ? 0.05 : 1;

  return (
    <svg
      viewBox="0 0 640 480"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ── Skin gradients ── */}
        <radialGradient id="sg" cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor={p.skin} />
          <stop offset="75%" stopColor={p.skin} />
          <stop offset="100%" stopColor={p.skinDark} />
        </radialGradient>

        {/* ── Wall gradient ── */}
        <linearGradient id="wg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D8CFBE" />
          <stop offset="100%" stopColor="#C8BCA8" />
        </linearGradient>

        {/* ── Window light ── */}
        <radialGradient id="wl" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFAE0" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFE890" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFD060" stopOpacity="0" />
        </radialGradient>

        {/* ── Desk gradient ── */}
        <linearGradient id="dg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9B7820" />
          <stop offset="100%" stopColor="#6B5010" />
        </linearGradient>

        {/* ── Shirt gradient ── */}
        <linearGradient id="tg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={p.shirt} />
          <stop offset="100%" stopColor={p.shirtDark} />
        </linearGradient>

        {/* ── Shadow for depth ── */}
        <filter id="soft">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="vsoft">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ════════════════ BACKGROUND ════════════════ */}

      {/* Wall */}
      <rect width="640" height="480" fill="url(#wg)" />

      {/* Baseboard */}
      <rect x="0" y="390" width="640" height="5" fill="#B0A490" opacity="0.7" />
      <rect x="0" y="395" width="640" height="85" fill="#BEB29E" />

      {/* ── Window (left bg) ── */}
      {/* Warm glow behind window */}
      <rect x="20" y="20" width="180" height="260" fill="#FFE080" opacity="0.18" filter="url(#vsoft)" />
      {/* Frame outer */}
      <rect x="28" y="28" width="170" height="255" fill="#E6DFCF" rx="3" stroke="#B8B0A0" strokeWidth="4" />
      {/* Glass */}
      <rect x="34" y="34" width="158" height="243" fill="url(#wl)" rx="1" />
      {/* Cross bar H */}
      <rect x="34" y="150" width="158" height="5" fill="#B8B0A0" opacity="0.8" />
      {/* Cross bar V */}
      <rect x="111" y="34" width="5" height="243" fill="#B8B0A0" opacity="0.8" />
      {/* Frame shadow */}
      <rect x="28" y="28" width="170" height="255" fill="none" rx="3" stroke="#8A7E6C" strokeWidth="4" />
      {/* Light bleed on wall */}
      <polygon points="34,34 192,34 340,480 0,480" fill="#FFF8E0" opacity="0.06" />

      {/* ── Bookshelf (right bg) ── */}
      <rect x="460" y="10" width="185" height="370" fill="#5A3A18" rx="4" />
      <rect x="464" y="14" width="177" height="362" fill="#7A5228" rx="2" />
      {/* Shelf boards */}
      {[100, 185, 270, 355].map((sy, i) => (
        <g key={i}>
          <rect x="464" y={sy} width="177" height="9" fill="#5A3A18" />
          <rect x="464" y={sy} width="177" height="3" fill="#9A7040" opacity="0.4" />
        </g>
      ))}
      {/* Row 1 books */}
      {[
        { x: 468, w: 16, h: 78, c: '#C0392B' }, { x: 485, w: 12, h: 74, c: '#E74C3C' },
        { x: 498, w: 18, h: 78, c: '#2C3E50' }, { x: 517, w: 14, h: 76, c: '#27AE60' },
        { x: 532, w: 20, h: 78, c: '#8E44AD' }, { x: 553, w: 11, h: 73, c: '#E67E22' },
        { x: 565, w: 17, h: 78, c: '#2980B9' }, { x: 583, w: 15, h: 75, c: '#1ABC9C' },
        { x: 599, w: 16, h: 78, c: '#D35400' }, { x: 616, w: 13, h: 73, c: '#7F8C8D' },
        { x: 630, w: 12, h: 78, c: '#C0392B' },
      ].map(({ x, w, h, c }, i) => (
        <rect key={i} x={x} y={100 - h} width={w} height={h} fill={c} rx="1" />
      ))}
      {/* Row 2 books */}
      {[
        { x: 468, w: 20, h: 72, c: '#16A085' }, { x: 489, w: 13, h: 68, c: '#F39C12' },
        { x: 503, w: 17, h: 72, c: '#9B59B6' }, { x: 521, w: 22, h: 70, c: '#2C3E50' },
        { x: 544, w: 13, h: 72, c: '#E74C3C' }, { x: 558, w: 16, h: 68, c: '#27AE60' },
      ].map(({ x, w, h, c }, i) => (
        <rect key={i} x={x} y={185 - h} width={w} height={h} fill={c} rx="1" />
      ))}
      {/* Small plant on shelf 2 */}
      <ellipse cx="600" cy="152" rx="16" ry="11" fill="#2D5A1B" />
      <ellipse cx="591" cy="145" rx="11" ry="9" fill="#3A7A24" />
      <ellipse cx="609" cy="144" rx="10" ry="8" fill="#3A7A24" />
      <rect x="596" y="152" width="8" height="22" fill="#7B5B14" />
      <ellipse cx="600" cy="172" rx="9" ry="4" fill="#5A4010" />
      {/* Row 3 books */}
      {[
        { x: 468, w: 15, h: 72, c: '#2980B9' }, { x: 484, w: 19, h: 68, c: '#BDC3C7' },
        { x: 504, w: 14, h: 72, c: '#D35400' }, { x: 519, w: 18, h: 70, c: '#1ABC9C' },
        { x: 538, w: 13, h: 72, c: '#9B59B6' }, { x: 552, w: 16, h: 68, c: '#34495E' },
      ].map(({ x, w, h, c }, i) => (
        <rect key={i} x={x} y={270 - h} width={w} height={h} fill={c} rx="1" />
      ))}
      {/* Trophy */}
      <rect x="600" y="244" width="12" height="20" fill="#F1C40F" rx="1" />
      <polygon points="606,242 612,258 600,258" fill="#F39C12" />
      <rect x="602" y="262" width="8" height="7" fill="#7B5B14" />
      <rect x="599" y="268" width="14" height="3" fill="#7B5B14" />
      {/* Row 4 books */}
      {[
        { x: 468, w: 17, h: 72, c: '#E74C3C' }, { x: 486, w: 14, h: 68, c: '#27AE60' },
        { x: 501, w: 21, h: 72, c: '#2C3E50' }, { x: 523, w: 13, h: 70, c: '#F39C12' },
        { x: 537, w: 18, h: 72, c: '#8E44AD' },
      ].map(({ x, w, h, c }, i) => (
        <rect key={i} x={x} y={355 - h} width={w} height={h} fill={c} rx="1" />
      ))}
      {/* Photo frame on bottom shelf */}
      <rect x="580" y="326" width="48" height="34" fill="#D4C4A8" rx="2" stroke="#A89070" strokeWidth="2" />
      <rect x="584" y="330" width="40" height="26" fill="#87CEEB" opacity="0.5" rx="1" />

      {/* ── Desk surface ── */}
      <rect x="0" y="430" width="640" height="12" fill="url(#dg)" />
      <rect x="0" y="428" width="640" height="5" fill="#B89030" opacity="0.5" />
      {/* Desk items */}
      {/* Notebook */}
      <rect x="60" y="408" width="88" height="28" fill="#FFF8E8" rx="2" transform="rotate(-2,60,408)" stroke="#D0C8A8" strokeWidth="1" />
      <line x1="66" y1="418" x2="138" y2="416" stroke="#C0B898" strokeWidth="1.5" opacity="0.6" />
      <line x1="66" y1="424" x2="130" y2="422" stroke="#C0B898" strokeWidth="1.5" opacity="0.6" />
      {/* Pen */}
      <rect x="152" y="415" width="3" height="28" fill="#2C3E50" rx="1.5" transform="rotate(15,152,415)" />
      {/* Coffee mug */}
      <rect x="484" y="404" width="26" height="30" fill="#F8F8F8" rx="3" />
      <path d="M510,410 Q520,410 520,420 Q520,430 510,430" fill="none" stroke="#E0E0E0" strokeWidth="2.5" />
      <rect x="486" y="406" width="22" height="7" fill="#C0392B" opacity="0.75" rx="1" />
      {/* Steam */}
      <path d="M492,402 Q494,397 492,392" fill="none" stroke="#D0D0D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M500,401 Q502,395 500,390" fill="none" stroke="#D0D0D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Laptop near desk */}
      <rect x="530" y="400" width="82" height="12" fill="#1A1A2E" rx="2" />
      <rect x="534" y="402" width="74" height="8" fill="#0D1117" rx="1" />

      {/* ════════════════ PERSON — full upper body ════════════════ */}
      {/* Seated, center of frame, visible from upper thigh to top of head */}

      {/* ── Shadow under person on desk ── */}
      <ellipse cx="320" cy="436" rx="110" ry="12" fill="#000" opacity="0.18" filter="url(#soft)" />

      {/* ── Lower body / lap (below desk, barely visible) ── */}
      <ellipse cx="320" cy="450" rx="105" ry="35" fill={p.shirtDark} opacity="0.6" />

      {/* ── Torso ── */}
      {/* Main body shape */}
      <path
        d={
          p.female
            ? 'M200,460 Q200,340 215,300 Q240,270 280,255 L320,252 L360,255 Q400,270 425,300 Q440,340 440,460 Z'
            : 'M195,460 Q195,340 210,300 Q235,268 278,252 L320,250 L362,252 Q405,268 430,300 Q445,340 445,460 Z'
        }
        fill="url(#tg)"
      />
      {/* Shirt side shadows */}
      <path
        d="M200,460 Q200,340 215,300 Q235,272 270,258 Q245,290 240,380 Q235,420 235,460 Z"
        fill={p.shirtDark}
        opacity="0.45"
      />
      <path
        d={p.female
          ? 'M440,460 Q440,340 425,300 Q405,272 370,258 Q395,290 400,380 Q405,420 405,460 Z'
          : 'M445,460 Q445,340 430,300 Q408,272 372,252 Q397,285 402,380 Q407,420 407,460 Z'}
        fill={p.shirtDark}
        opacity="0.45"
      />

      {/* ── Arms ── */}
      {/* Left arm */}
      <path
        d="M215,310 Q175,330 150,390 Q145,415 155,430 Q165,435 175,425 Q180,395 200,360 Q215,340 230,320 Z"
        fill={`url(#tg)`}
      />
      <path
        d="M215,310 Q175,330 150,390 Q145,415 155,430 Q165,435 175,425 Q180,395 200,360 Q215,340 230,320 Z"
        fill={p.shirtDark}
        opacity="0.3"
      />
      {/* Left hand on desk */}
      <ellipse cx="162" cy="432" rx="22" ry="12" fill="url(#sg)" />
      {/* Right arm */}
      <path
        d="M425,310 Q465,330 490,390 Q495,415 485,430 Q475,435 465,425 Q460,395 440,360 Q425,340 410,320 Z"
        fill={`url(#tg)`}
      />
      <path
        d="M425,310 Q465,330 490,390 Q495,415 485,430 Q475,435 465,425 Q460,395 440,360 Q425,340 410,320 Z"
        fill={p.shirtDark}
        opacity="0.3"
      />
      {/* Right hand on desk */}
      <ellipse cx="478" cy="432" rx="22" ry="12" fill="url(#sg)" />

      {/* ── Collar / neckline ── */}
      {p.female ? (
        /* Feminine blouse */
        <>
          <path d="M278,255 Q295,290 320,305 Q345,290 362,255 L370,260 L320,315 L270,260 Z" fill={p.collar} opacity="0.92" />
          <path d="M290,258 Q320,298 350,258" fill="none" stroke={p.shirtDark} strokeWidth="1.5" opacity="0.3" />
        </>
      ) : (
        /* Dress shirt + tie */
        <>
          <path d="M276,252 L320,295 L364,252 L374,265 L320,312 L266,265 Z" fill={p.collar} opacity="0.95" />
          {/* Tie */}
          <path d="M315,295 L325,295 L330,370 L320,382 L310,370 Z" fill="#8B1A1A" />
          <path d="M315,295 L325,295 L322,308 L318,308 Z" fill="#6B1010" />
          {/* Collar fold lines */}
          <line x1="276" y1="252" x2="293" y2="280" stroke="#D0C8C0" strokeWidth="1" opacity="0.4" />
          <line x1="364" y1="252" x2="347" y2="280" stroke="#D0C8C0" strokeWidth="1" opacity="0.4" />
        </>
      )}

      {/* ── Neck ── */}
      <rect x="294" y="215" width="52" height="52" fill="url(#sg)" rx="12" />
      {/* Neck side shadows */}
      <rect x="294" y="215" width="10" height="52" fill={p.skinDark} opacity="0.28" rx="5" />
      <rect x="336" y="215" width="10" height="52" fill={p.skinDark} opacity="0.28" rx="5" />

      {/* ── Head ── */}
      <ellipse cx="320" cy="148" rx="72" ry="84" fill="url(#sg)" />
      {/* Temple shadows */}
      <ellipse cx="254" cy="148" rx="22" ry="58" fill={p.skinDark} opacity="0.22" />
      <ellipse cx="386" cy="148" rx="22" ry="58" fill={p.skinDark} opacity="0.22" />
      {/* Chin shading */}
      <ellipse cx="320" cy="220" rx="32" ry="14" fill={p.skinDark} opacity="0.2" />

      {/* ── Hair ── */}
      {p.female ? (
        <>
          {/* Back volume */}
          <ellipse cx="320" cy="82" rx="78" ry="76" fill={p.hair} />
          {/* Long sides */}
          <ellipse cx="246" cy="170" rx="28" ry="82" fill={p.hair} />
          <ellipse cx="394" cy="170" rx="28" ry="82" fill={p.hair} />
          {/* Front hairline */}
          <path d="M252,98 Q274,62 320,58 Q366,62 388,98 Q370,74 348,66 Q320,56 292,66 Q270,74 252,98 Z" fill={p.hair} />
          {/* Highlights */}
          <path d="M272,66 Q296,50 320,54 Q344,50 368,66" fill="none" stroke={p.hairHi} strokeWidth="4" opacity="0.5" strokeLinecap="round" />
          <path d="M256,100 Q262,82 270,88" fill="none" stroke={p.hairHi} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Short professional */}
          <ellipse cx="320" cy="78" rx="74" ry="62" fill={p.hair} />
          {/* Side fade */}
          <rect x="248" y="88" width="20" height="60" fill={p.hair} rx="8" />
          <rect x="372" y="88" width="20" height="60" fill={p.hair} rx="8" />
          <rect x="248" y="128" width="20" height="24" fill={p.hair} opacity="0.5" rx="4" />
          <rect x="372" y="128" width="20" height="24" fill={p.hair} opacity="0.5" rx="4" />
          {/* Front hairline */}
          <path d="M255,98 Q278,64 320,60 Q362,64 385,98 Q368,78 348,68 Q320,58 292,68 Q272,78 255,98 Z" fill={p.hair} />
          {/* Highlights */}
          <path d="M280,60 Q300,50 320,53 Q340,50 360,60" fill="none" stroke={p.hairHi} strokeWidth="3.5" opacity="0.45" strokeLinecap="round" />
        </>
      )}

      {/* ── Ears ── */}
      <ellipse cx="250" cy="155" rx="11" ry="16" fill={p.skin} />
      <ellipse cx="250" cy="155" rx="7" ry="10" fill={p.skinDark} opacity="0.25" />
      <ellipse cx="390" cy="155" rx="11" ry="16" fill={p.skin} />
      <ellipse cx="390" cy="155" rx="7" ry="10" fill={p.skinDark} opacity="0.25" />
      {/* Earrings (female) */}
      {p.female && (
        <>
          <circle cx="250" cy="168" r="4" fill="#D4AF37" />
          <circle cx="390" cy="168" r="4" fill="#D4AF37" />
        </>
      )}

      {/* ── Eyebrows ── */}
      <path
        d={p.female ? 'M276,112 Q292,105 308,110' : 'M274,112 Q292,104 310,110'}
        fill="none"
        stroke={p.hair}
        strokeWidth={p.female ? 3.5 : 5}
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d={p.female ? 'M332,110 Q348,105 364,112' : 'M330,110 Q348,104 366,112'}
        fill="none"
        stroke={p.hair}
        strokeWidth={p.female ? 3.5 : 5}
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* ── Eyes ── */}
      {/* Whites */}
      <ellipse cx="291" cy="132" rx="15" ry={13 * ey} fill="white" />
      <ellipse cx="349" cy="132" rx="15" ry={13 * ey} fill="white" />
      {/* Iris */}
      {ey > 0.3 && (
        <>
          <circle cx="291" cy="132" r={10 * ey} fill={p.iris} />
          <circle cx="349" cy="132" r={10 * ey} fill={p.iris} />
          {/* Pupil */}
          <circle cx="291" cy="132" r={6 * ey} fill="#111" />
          <circle cx="349" cy="132" r={6 * ey} fill="#111" />
          {/* Catchlight */}
          <circle cx="295" cy="128" r={2.5 * ey} fill="white" opacity="0.9" />
          <circle cx="353" cy="128" r={2.5 * ey} fill="white" opacity="0.9" />
        </>
      )}
      {/* Upper lash line */}
      <path
        d={`M276,${132 - 12 * ey} Q291,${132 - 14 * ey * 1.1} 306,${132 - 12 * ey}`}
        fill="none"
        stroke={p.hair}
        strokeWidth={p.female ? 3 : 2.2}
        opacity="0.88"
      />
      <path
        d={`M334,${132 - 12 * ey} Q349,${132 - 14 * ey * 1.1} 364,${132 - 12 * ey}`}
        fill="none"
        stroke={p.hair}
        strokeWidth={p.female ? 3 : 2.2}
        opacity="0.88"
      />
      {/* Lower lash */}
      <path
        d={`M278,${132 + 11 * ey} Q291,${132 + 13 * ey} 304,${132 + 11 * ey}`}
        fill="none"
        stroke={p.skinDark}
        strokeWidth="1.2"
        opacity="0.38"
      />
      <path
        d={`M336,${132 + 11 * ey} Q349,${132 + 13 * ey} 362,${132 + 11 * ey}`}
        fill="none"
        stroke={p.skinDark}
        strokeWidth="1.2"
        opacity="0.38"
      />

      {/* ── Nose ── */}
      <path d="M320,138 Q316,162 310,172 Q314,177 320,175 Q326,177 330,172 Q324,162 320,138" fill={p.skinDark} opacity="0.2" />
      <ellipse cx="313" cy="172" rx="6" ry="5" fill={p.skinDark} opacity="0.2" />
      <ellipse cx="327" cy="172" rx="6" ry="5" fill={p.skinDark} opacity="0.2" />
      <circle cx="320" cy="169" r="4" fill="white" opacity="0.08" />

      {/* ── Cheeks ── */}
      <ellipse cx="272" cy="165" rx="17" ry="11" fill="#FF7A6A" opacity={p.female ? 0.17 : 0.09} />
      <ellipse cx="368" cy="165" rx="17" ry="11" fill="#FF7A6A" opacity={p.female ? 0.17 : 0.09} />

      {/* ── Mouth ── */}
      {mouth ? (
        /* Open — speaking */
        <>
          <path d="M298,188 Q320,202 342,188 Q336,210 320,212 Q304,210 298,188 Z" fill="#1A0808" />
          <path d="M298,188 Q308,183 320,185 Q332,183 342,188" fill={p.lip} />
          <path d="M298,188 Q306,208 320,210 Q334,208 342,188" fill={p.lip} opacity="0.65" />
          {/* Teeth */}
          <path d="M300,191 Q320,198 340,191 Q336,207 320,208 Q304,207 300,191 Z" fill="white" opacity="0.88" />
          <line x1="300" y1="200" x2="340" y2="200" stroke="#E0D8D0" strokeWidth="1" opacity="0.4" />
        </>
      ) : (
        /* Closed — neutral/listening */
        <>
          <path d="M300,189 Q310,183 320,185 Q330,183 340,189" fill={p.lip} />
          <path d="M300,189 Q310,198 320,199 Q330,198 340,189" fill={p.lip} opacity="0.6" />
          <path d="M299,189 Q320,197 341,189" fill="none" stroke={p.lip} strokeWidth="1.5" opacity="0.5" />
          {/* Smile corners */}
          <path d="M297,190 Q300,186 305,188" fill="none" stroke={p.skinDark} strokeWidth="1" opacity="0.28" />
          <path d="M343,190 Q340,186 335,188" fill="none" stroke={p.skinDark} strokeWidth="1" opacity="0.28" />
        </>
      )}

      {/* Chin dimple (male) */}
      {!p.female && (
        <path d="M317,210 Q320,214 323,210" fill="none" stroke={p.skinDark} strokeWidth="1.3" opacity="0.22" />
      )}

      {/* ════════════════ SPEAKING INDICATORS ════════════════ */}
      {speaking && (
        <>
          {/* Subtle green rim on entire frame */}
          <rect width="640" height="480" fill="none" stroke="#22C55E" strokeWidth="3" opacity="0.5" />
          {/* Animated ring around person */}
          <ellipse cx="320" cy="300" rx="140" ry="195" fill="none" stroke="#22C55E" strokeWidth="2" opacity="0.3">
            <animate attributeName="rx" values="140;155;140" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="ry" values="195;210;195" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.08;0.3" dur="1.4s" repeatCount="indefinite" />
          </ellipse>
        </>
      )}
    </svg>
  );
}

// ─── Animated Avatar Component ────────────────────────────────────────────────

function RecruiterAvatar({
  persona,
  isSpeaking,
  isListening,
}: {
  persona: RecruiterPersona;
  isSpeaking: boolean;
  isListening: boolean;
}) {
<<<<<<< HEAD
  const p = PERSONAS[persona];
  const [blink, setBlink] = useState(false);
  const [mouth, setMouth] = useState(false);

  // Natural blinking
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    const schedule = () => {
      tid = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 125);
        schedule();
      }, 2800 + Math.random() * 2600);
    };
    schedule();
    return () => clearTimeout(tid);
  }, []);

  // Mouth flap when speaking
=======
  const config = PERSONA_CONFIG[persona];
  const [speakingAnimation, setSpeakingAnimation] = useState(0);

  // Speaking animation - mouth movement
>>>>>>> 7717c1d (Fix remaining TypeScript errors: add interviewStage prop, remove unused functions and variables)
  useEffect(() => {
    if (!isSpeaking) { setMouth(false); return; }
    let active = true;
    const flap = () => {
      if (!active) return;
      setMouth((v) => !v);
      setTimeout(flap, 160 + Math.random() * 220);
    };
    flap();
    return () => { active = false; };
  }, [isSpeaking]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#C8BCAA]">
      <PersonVideoFeed p={p} blink={blink} mouth={mouth} speaking={isSpeaking} />

      {/* Listening border */}
      {isListening && !isSpeaking && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{ boxShadow: 'inset 0 0 0 2px rgba(96,165,250,0.4)' }}
        />
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <div className="text-white font-semibold text-sm leading-tight">{p.name}</div>
          <div className="text-gray-300 text-xs">{p.role}</div>
        </div>
        {isSpeaking && (
          <div className="flex items-center gap-1 bg-green-600/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
            {[3, 5, 2, 4, 3].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full"
                style={{
                  height: `${h * 3}px`,
                  animation: `soundBar ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes soundBar {
          from { transform: scaleY(0.35); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Candidate Camera Preview ─────────────────────────────────────────────────

function CandidateCameraPreview({
  cameraEnabled,
  isSpeaking,
}: {
  cameraEnabled: boolean;
  isSpeaking: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!cameraEnabled || !videoRef.current) return;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error('Camera access denied:', e);
      }
    };
    start();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraEnabled]);

  return (
    <div
      className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border-2 transition-colors ${isSpeaking ? 'border-green-400' : 'border-gray-600'
        }`}
    >
      {cameraEnabled ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {isSpeaking && (
            <>
              <div className="absolute inset-0 border-4 border-green-400 rounded-xl animate-pulse pointer-events-none" />
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
                Speaking
              </div>
            </>
          )}

          {/* Name tag - Zoom style */}
          <div className="absolute bottom-3 left-3 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700">
            <div className="text-white text-sm font-semibold">You</div>
          </div>

          {/* Mic indicator */}
          <div className="absolute bottom-3 right-3">
            {isSpeaking ? (
              <div className="bg-green-500 p-2 rounded-full shadow-lg">
                <Mic className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="bg-gray-700 p-2 rounded-full">
                <MicOff className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <VideoOff className="w-10 h-10 text-gray-500" />
            </div>
            <div className="text-gray-400 text-sm font-medium">Camera is off</div>
            <div className="text-gray-600 text-xs mt-1">Click camera button to turn on</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transcription Overlay ────────────────────────────────────────────────────

function TranscriptionOverlay({
  recruiterMessage,
  candidateTranscript,
  isRecruiterSpeaking,
  isCandidateSpeaking,
}: {
  recruiterMessage: string;
  candidateTranscript: string;
  isRecruiterSpeaking: boolean;
  isCandidateSpeaking: boolean;
}) {
  return (
    <div className="space-y-2">
      {isRecruiterSpeaking && recruiterMessage && (
        <div className="bg-blue-900/80 text-white p-3 rounded-lg text-sm border-l-4 border-blue-400 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-semibold text-xs text-blue-300 mb-1">Recruiter</div>
          <div className="line-clamp-3">{recruiterMessage}</div>
        </div>
      )}
      {isCandidateSpeaking && candidateTranscript && (
        <div className="bg-green-900/80 text-white p-3 rounded-lg text-sm border-l-4 border-green-400 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-semibold text-xs text-green-300 mb-1">You</div>
          <div className="line-clamp-3">{candidateTranscript}</div>
        </div>
      )}
    </div>
  );
}

// ─── Call Controls ────────────────────────────────────────────────────────────

function CallControls({
  micEnabled,
  cameraEnabled,
  onMicToggle,
  onCameraToggle,
  onEndCall,
}: {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onMicToggle: (enabled: boolean) => void;
  onCameraToggle: (enabled: boolean) => void;
  onEndCall: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 bg-gray-900/90 px-6 py-4 rounded-full backdrop-blur-sm border border-gray-700">
      <button
        onClick={() => onMicToggle(!micEnabled)}
        className={`p-3 rounded-full transition-all ${micEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white`}
        title={micEnabled ? 'Mute' : 'Unmute'}
      >
        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
      <button
        onClick={() => onCameraToggle(!cameraEnabled)}
        className={`p-3 rounded-full transition-all ${cameraEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white`}
        title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
        title="End call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Interview Progress ───────────────────────────────────────────────────────

function InterviewProgress({
  turnCount,
  maxTurns,
  stage,
  elapsedSeconds,
}: {
  turnCount: number;
  maxTurns: number;
  stage: InterviewStage;
  elapsedSeconds: number;
}) {
  const progress = (turnCount / maxTurns) * 100;
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const ss = String(elapsedSeconds % 60).padStart(2, '0');
  const info = STAGE_LABELS[stage];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-white text-sm">{info.label}</div>
          <div className="text-gray-400 text-xs">{info.description}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-300 text-sm font-mono">{mm}:{ss}</div>
          <div className="text-gray-500 text-xs">{turnCount} / {maxTurns} questions</div>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VideoCallSimulator({
  recruiterName: _recruiterName,
  recruiterRole: _recruiterRole,
  recruiterPersona,
  interviewStage,
  isRecruiterSpeaking,
  recruiterMessage,
  candidateTranscript,
  isCandidateSpeaking,
  isProcessing,
  turnCount,
  maxTurns,
  onMicToggle,
  onCameraToggle,
  onEndCall,
  micEnabled,
  cameraEnabled,
  elapsedSeconds,
}: VideoCallSimulatorProps) {
  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col">
      {/* Video area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Recruiter (main feed) */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          <RecruiterAvatar
            persona={recruiterPersona}
            isSpeaking={isRecruiterSpeaking}
            isListening={!isRecruiterSpeaking && !isProcessing}
          />
        </div>

        {/* Candidate PiP */}
        <div className="w-64 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <CandidateCameraPreview cameraEnabled={cameraEnabled} isSpeaking={isCandidateSpeaking} />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 space-y-4">
        <TranscriptionOverlay
          recruiterMessage={recruiterMessage}
          candidateTranscript={candidateTranscript}
          isRecruiterSpeaking={isRecruiterSpeaking}
          isCandidateSpeaking={isCandidateSpeaking}
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <InterviewProgress
              turnCount={turnCount}
              maxTurns={maxTurns}
              stage={interviewStage}
              elapsedSeconds={elapsedSeconds}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-700/30">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                Processing...
              </div>
            )}
            {isRecruiterSpeaking && (
              <div className="flex items-center gap-2 text-blue-400 text-sm bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-700/30">
                <Volume2 className="w-4 h-4" />
                Recruiter speaking
              </div>
            )}
            {isCandidateSpeaking && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-700/30">
                <Mic className="w-4 h-4" />
                You're speaking
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <CallControls
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            onMicToggle={onMicToggle}
            onCameraToggle={onCameraToggle}
            onEndCall={onEndCall}
          />
        </div>
      </div>
    </div>
  );
}
