# Coach — refactor spec (v1.0)

Parent index: [`README.md`](./README.md)

---

## Canonical name

**Coach**

## File

Keep:

```text
frontend/src/app/coach/CoachPage.tsx
```

## Purpose

A deeper strategic support space that helps the user frame, reframe, understand, and strengthen their professional position.

## Emotional effect

The user should feel:

- guided  
- understood  
- sharpened  
- steadier  
- more strategic  

## What Coach is

Coach is:

- strategic guidance  
- narrative reframing  
- confidence support  
- career positioning  
- deeper reflection  
- action planning  

## What Coach is not

Coach is not:

- full interview simulation  
- daily timed practice  
- negotiation simulator  
- raw question bank  
- quick-fire drill mode  

## Main sections

- **Hero Header**  
- **Current Challenge**  
- **Choose Coaching Depth**  
- **Estimated Cost**  
- **Coach Guidance**  
- **Reframing**  
- **Action Plan**  
- **Growth Direction**  

## Coaching modes

- **Quick Reframe**  
- **Structured Guidance**  
- **Deep Coaching**  

## Credit logic

Coach uses estimated cost with approval before spend.

### Example cost bands

- **Quick Reframe** = **2 Credits**  
- **Structured Guidance** = **4 Credits**  
- **Deep Coaching** = **7 Credits**  
- **High Complexity Session** = **9 Credits**  

## Cost rule

Display:

- **Estimated Cost**  
- **Maximum Cost Without Further Approval**  
- **Continue For X Credits**  

### Required user protection

The system must not exceed the shown cost without explicit user confirmation.

## Required components

- **PracticeHeroHeader**  
- **PracticeModeCard**  
- **PracticeCostCard**  
- **PracticeSessionPanel**  
- **PracticeSupportRail**  
- **PracticeActionBar**  

## Primary CTA

- **Continue For X Credits**  
- **Start Quick Reframe**  
- **Start Structured Guidance**  
- **Start Deep Coaching**  

## Secondary CTA

- **Change Depth**  
- **Review Action Plan**  

## Required states

- **Loading**  
- **Empty**  
- **Error**  
- **Ready**  
- **Estimate Shown**  
- **In Session**  
- **Completed**  

## What must never be mixed into Coach

- live interview turn-taking  
- timer-first warmup logic  
- negotiation pricing / offers  
- interview question-bank identity  
- mock interview lobby behaviour  
