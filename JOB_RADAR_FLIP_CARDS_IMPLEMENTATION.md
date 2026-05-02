# Job Radar Flip Cards - Score Breakdown Implementation

**Date:** May 2, 2026  
**Status:** Implemented & Ready for Testing  
**Feature:** Interactive flip cards showing score drivers

---

## 🎯 What Was Implemented

### Problem
Users couldn't understand **why** a score was 20 vs 40. They only saw the final number without explanation of:
- What factors contributed to the score
- How much each factor impacted the score
- The confidence level of each factor

### Solution
**Flip Cards** - Click on any score card to see the breakdown:

**Front Side:**
- Score label (e.g., "Employer")
- Score number (e.g., "100")
- Color-coded by score level
- "Click to see breakdown →" hint

**Back Side (Flipped):**
- **Positive Drivers** (✓) - Factors that increased the score
  - Label: "Company has strong reputation"
  - Impact: +8 points
  - Confidence: medium
  
- **Negative Drivers** (✗) - Factors that decreased the score
  - Label: "Missing salary transparency"
  - Impact: -10 points
  - Confidence: high
  
- **Neutral Constraints** (⚠) - Factors that don't directly impact but are relevant
  - Label: "Limited public information"
  - Confidence: low

---

## 📁 Files Created/Modified

### New Files
1. **frontend/src/features/job-radar/components/score-card-flip.tsx** (NEW)
   - Flip card component with 3D rotation animation
   - Shows drivers with impact values and confidence levels
   - Responsive design

### Modified Files
1. **frontend/src/features/job-radar/components/score-cards-grid.tsx** (UPDATED)
   - Now uses ScoreCardFlip component instead of static cards
   - Passes score_drivers data from backend
   - Cleaner labels ("Employer" instead of "Employer score")

---

## 🎨 Design Details

### Flip Animation
- CSS 3D transform: rotateY(180deg)
- Smooth 500ms transition
- backfaceVisibility: hidden for proper 3D effect
- Cursor pointer on hover

### Color Coding

**For Regular Scores (higher is better):**
- 80-100: Emerald (Excellent)
- 60-79: Blue (Good)
- 40-59: Amber (Fair)
- 0-39: Red (Poor)

**For Risk Score (lower is better):**
- 0-20: Emerald (Low Risk)
- 21-35: Amber (Medium Risk)
- 36-100: Red (High Risk)

---

## ✅ Features

### Front Side
- Score label
- Large score number
- Color-coded by score level
- "/100" indicator
- "Click to see breakdown →" hint

### Back Side
- "Score Breakdown" header
- Positive drivers with +impact
- Negative drivers with -impact
- Neutral constraints
- Confidence level for each driver
- Scrollable if many drivers
- "← Click to close" hint

### Interaction
- Click to flip
- Smooth 3D animation
- Cursor feedback
- Works on mobile (touch)

---

## 🚀 How to Use

1. Navigate to Job Radar Report
2. Look at Score Cards Grid - Shows 6 cards:
   - Employer
   - Offer Quality
   - Market Pay
   - Benefits
   - Culture Fit
   - Risk Level

3. Click any card to flip and see breakdown
4. Read the drivers to understand the score
5. Click again to flip back

---

**Status:** ✅ READY FOR TESTING  
**Files:** 2 (1 new, 1 modified)  
**Lines Added:** ~200  
**Breaking Changes:** None
