# Daily Warmup — refactor spec (v1.0)

Parent index: [`README.md`](./README.md)

---

## Canonical name

**Daily Warmup**

## File change

**Kanoniczna ścieżka pliku:**

```text
frontend/src/app/warmup/DailyWarmupPage.tsx
```

*(Wcześniej: `InterviewWarmup.tsx` — rename wykonany w repo.)*

## Purpose

A short, repeatable daily practice ritual designed to build momentum, speed, and consistency.

## Emotional effect

The user should feel:

- light  
- quick  
- energised  
- low-friction  
- capable of starting immediately  

## What Daily Warmup is

Daily Warmup is:

- fast practice  
- daily repetition  
- short-answer mode  
- timed  
- credit-light  
- low setup  

## What Daily Warmup is not

Daily Warmup is not:

- full interview simulation  
- deep coaching  
- negotiation strategy  
- long-form reflection  
- session-based case practice  

## Main sections

- **Hero Header**  
- **Choose Duration**  
- **Duration Cost Cards**  
- **Quick Practice Start**  
- **Your Pace**  
- **Progress**  
- **Recent Warmups**  

## Duration logic

- **15 Seconds** = **Free**  
- **30 Seconds** = **1 Credit**  
- **45 Seconds** = **2 Credits**  
- **60 Seconds** = **3 Credits**  

### User-facing rule

Display: **As many questions and answers as fit in the selected time**

## Required components

- **PracticeHeroHeader**  
- **PracticeModeCard**  
- **PracticeCostCard**  
- **PracticeActionBar**  
- **PracticeProgressBadge**  

## Primary CTA

- **Start 15 Seconds**  
- **Start 30 Seconds**  
- **Start 45 Seconds**  
- **Start 60 Seconds**  

## Secondary CTA

- **View Progress**  
- **Repeat Last Warmup**  

## Required states

- **Loading**  
- **Empty**  
- **Error**  
- **Ready**  
- **Running**  
- **Completed**  

## What must never be mixed into Daily Warmup

- interview lobby  
- deep coaching prompts  
- negotiation counter-offers  
- long answer reviews  
- complex strategic framing  
