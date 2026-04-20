# Negotiation — refactor spec (v1.0)

Parent index: [`README.md`](./README.md)

---

## Canonical name

**Negotiation**

## File change

Rename:

```text
frontend/src/app/negotiation/NegotiationPage.tsx
```

to:

```text
frontend/src/app/negotiation/NegotiationPage.tsx
```

## Purpose

A negotiation-focused module for salary, conditions, boundaries, terms, and response strategy.

## Emotional effect

The user should feel:

- clearer  
- stronger  
- less passive  
- more deliberate  
- more prepared to respond  

## What Negotiation is

Negotiation is:

- offer handling  
- counter-offer strategy  
- reply drafting  
- boundary setting  
- condition framing  
- negotiation simulation as a sub-mode  

## What Negotiation is not

Negotiation is not:

- generic coaching  
- full interview practice  
- warmup timer training  
- mixed coach + simulator identity  

## Main sections

- **Hero Header**  
- **Negotiation Context**  
- **Choose Mode**  
- **Estimated Cost**  
- **Suggested Positioning**  
- **Reply Drafts**  
- **Boundary Support**  
- **Counter Strategy**  

## Negotiation modes

- **Quick Reply Draft**  
- **Counter Offer**  
- **Strategy**  
- **Simulation**  

## Credit logic

- **Quick Reply Draft** = **2 Credits**  
- **Counter Offer** = **3 Credits**  
- **Strategy** = **5 Credits**  
- **Simulation** = **7 Credits**  

## Required components

- **PracticeHeroHeader**  
- **PracticeModeCard**  
- **PracticeCostCard**  
- **PracticeSessionPanel**  
- **PracticeSupportRail**  
- **PracticeActionBar**  

## Primary CTA

- **Continue For X Credits**  
- **Start Quick Reply Draft**  
- **Start Counter Offer**  
- **Start Strategy**  
- **Start Simulation**  

## Secondary CTA

- **Change Mode**  
- **Review Draft**  
- **Compare Replies**  

## Required states

- **Loading**  
- **Empty**  
- **Error**  
- **Ready**  
- **Estimate Shown**  
- **In Session**  
- **Completed**  

## What must never be mixed into Negotiation

- coach identity as the primary naming  
- interview question-bank flow  
- daily warmup time loop  
- generic multi-purpose simulator branding  
