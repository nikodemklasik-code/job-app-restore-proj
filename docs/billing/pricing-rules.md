# Pricing Rules

## Principle
Simple actions use fixed cost. Complex actions use estimated cost with a ceiling.

## Fixed-cost pricing
Use fixed pricing when the system can reliably predict cost before execution.

The user should see:
- action name
- exact cost
- confirmation CTA where required

## Estimated-cost pricing
Use estimated pricing when cost depends on execution complexity.

The user should see:
- estimated cost
- maximum approved cost
- selected mode
- selected depth
- model tier if relevant
- source scope if relevant

## Credit ceiling rule
Every estimated action must have a visible maximum approved cost.

If execution would exceed the estimate, the backend must pause and request a new approval.

## Rate formula
Estimated Credits = Base Action Cost + Depth Cost + Source Complexity Cost + Model Tier Cost

## Suggested pricing bands

### Daily Warmup
- 15 sec = Free
- 30 sec = 1 Credit
- 45 sec = 2 Credits
- 60 sec = 3 Credits

### Coach
- Quick Reframe = 2 Credits
- Structured Guidance = 4 to 5 Credits
- Deep Coaching = 7 to 9 Credits

### Negotiation
- Short Tactical Run = 3 Credits
- Standard Session = 5 to 6 Credits
- Advanced Session = 8 to 10 Credits

### Legal Search
- Core Sources = 2 Credits
- Core + Tribunal Layer = 4 Credits
- Deep Multi-Source Review = 6 to 8 Credits

### Job Radar
- Basic Search = Free
- Browse Signals = Free
- Basic Watchlist View = Free
- Salary Search = 2 Credits
- Advanced Employer Context = 2 Credits unless scope becomes open-ended
- Advanced Radar Scan = 4 Credits or capped estimate depending on scope

## Anti-surprise rule
The system must never spend credits in a hidden way.
The user must be able to understand why they are being charged, how much they may be charged, and whether the charge is fixed or estimated.
