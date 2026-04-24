# Pricing Rules

## Pricing principle
Simple actions should use fixed cost.
Complex actions should use estimated cost with a ceiling.

## Fixed-cost pricing
Use fixed pricing when the system can reliably predict the cost before execution.

The user should see:
- action name
- mode
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

Example:
- Estimated Cost: 4 Credits
- This action will not exceed 4 credits without your approval.

If more is needed:
- This request requires more depth than estimated. Continue for 7 credits?

## General rate formula
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

### Interview
- Lite Session = low fixed cost
- Standard Session = medium fixed cost or capped estimate
- Advanced Session = higher capped estimate

### Job Radar
- Basic Search = Free
- Browse Signals = Free
- Basic Watchlist View = Free
- Salary Search = 2 Credits
- Advanced Employer Context = 2 Credits unless scope becomes multi-source and open-ended
- Advanced Radar Scan = 4 Credits or capped estimate depending on scope

## Free layer
Use free access for:
- very short warmup
- limited lightweight assistant use
- minimal discovery
- selected onboarding actions

## Paid / credit layer
Use credits for:
- deep coach sessions
- longer interview sessions
- negotiation sessions
- legal search synthesis
- advanced document processing
- report generation
- premium model execution
- deeper analysis
- Job Radar salary-condition search
- Job Radar advanced employer context

## Anti-surprise rule
The system must never spend credits in a hidden way.
The user must be able to understand:
- why they are being charged
- how much they may be charged
- whether the charge is fixed or estimated
