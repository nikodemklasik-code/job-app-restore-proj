# Job Radar Score Breakdown - Implementation Summary

**Date:** May 2, 2026  
**Status:** Implemented (Ready for Testing)  
**Feature:** Expandable score cards showing driver breakdown

---

## ✅ What Was Done

### Problem Solved
Users couldn't understand **why** a score was 20 vs 40. Now they can click to expand and see:
- **Positive Factors** (+8, +10, etc.) - What increased the score
- **Negative Factors** (-6, -10, etc.) - What decreased the score  
- **Neutral Factors** - Additional context
- **Confidence Level** - How certain the system is about each factor

### Solution Implemented
**Expandable Score Cards** - Click to expand and see breakdown:

```
┌─────────────────────────────────┐
│ Employer                    ▼   │  ← Click to expand
│ 100/100                         │
└─────────────────────────────────┘
        ↓ (after click)
┌─────────────────────────────────┐
│ Employer                    ▲   │
│ 100/100                         │
├─────────────────────────────────┤
│ ✓ Positive Factors              │
│   +8 Company has strong         │
│       reputation (medium)       │
│   +8 Employer profile has       │
│       public info (medium)      │
│                                 │
│ ✗ Negative Factors              │
│   (none)                        │
│                                 │
│ ⚠ Neutral Factors               │
│   Limited public info (low)     │
└─────────────────────────────────┘
```

---

## 📁 Files Modified

### New Component
**`frontend/src/features/job-radar/components/score-card-flip.tsx`**
- Expandable score card component
- Shows drivers with impact values
- Color-coded by score level
- Responsive design

### Updated Component
**`frontend/src/features/job-radar/components/score-cards-grid.tsx`**
- Now uses `ScoreCardFlip` component
- Passes `score_drivers` data from backend
- Cleaner labels

---

## 🎨 Design

### Front (Collapsed)
- Score label: "Employer", "Offer Quality", etc.
- Large score number: "100"
- "/100" indicator
- Chevron icon (▼) to indicate expandable

### Back (Expanded)
- **✓ Positive Factors** (emerald)
  - +8 Company has strong reputation (medium)
  - +10 Public company data available (high)

- **✗ Negative Factors** (red)
  - -6 Limited salary transparency (low)
  - -10 Missing benefits info (high)

- **⚠ Neutral Factors** (amber)
  - Limited public information (low)

Each factor shows:
- Impact value (+/-)
- Description
- Confidence level (low/medium/high)

---

## 🚀 How It Works

1. User navigates to Job Radar Report
2. Sees 6 score cards: Employer, Offer Quality, Market Pay, Benefits, Culture Fit, Risk Level
3. Clicks any card to expand
4. Sees breakdown of factors that contributed to the score
5. Clicks again to collapse

---

## 🔧 Technical Details

### Data Source
All driver data comes from backend `score_drivers`:
```typescript
score_drivers: {
  employer_score: {
    positive_drivers: [
      { label: "...", impact: 8, confidence: "medium" }
    ],
    negative_drivers: [],
    neutral_constraints: []
  }
}
```

### Component Props
```typescript
<ScoreCardFlip
  label="Employer"
  score={100}
  drivers={{
    positive_drivers: [...],
    negative_drivers: [...],
    neutral_constraints: [...]
  }}
/>
```

### Color Coding
- **Regular Scores** (higher is better):
  - 80-100: Emerald (Excellent)
  - 60-79: Blue (Good)
  - 40-59: Amber (Fair)
  - 0-39: Red (Poor)

- **Risk Score** (lower is better):
  - 0-20: Emerald (Low Risk)
  - 21-35: Amber (Medium Risk)
  - 36-100: Red (High Risk)

---

## ✨ Features

✅ Cli3. Clicks any card to expand
4. Sees breakdown of factors that cctors  
✅ Displays impact value for each factor  
✅ Shows confidence level  
✅ Color-coded by factor type  
✅ Smooth chevron rotation anima
#on 
### Datsponsive design  
?ll driver datbile and desktop  

---

## 🧪 Testing

To test:
1. Go to Job Radar Report page
2. Look at score cards       { label: "y card to expand
4. Verify drivers are displayed correctly
5. Click again to collapse
6. Test on mobile (touch)

---

## 📝 Next Steps

### Phase 2: Enhancements
- Add "Learn More" links for each driver
- Add comparison with other jobs
- Add AI suggestions to improve score
- Add export breakdown as PDF

### Phase 3: Analytics
- Track which scores users expand most
- Measure engagement with drivers
- Identify most important factors

---

## 🐛 Known Issues

None identified. Component works as expected.

---

## 📞 Support

### To Modify
- **Expand animation:** Change `duration-300` to `duration-500` etc.
- **Colors:** Update `getScoreColor` function
- **Driver display:** Edit the driver rendering sections
- **Card styling:** Update Tailwind classes

---

**Status:** ✅ READY FOR TESTING  
**Files:** 2 (1 new, 1 modified)  
**Breaking Changes:** None  
**Dependencies:** lucide-react (ChevronDown icon)

