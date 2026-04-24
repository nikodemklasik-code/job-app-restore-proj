# Canonical Information Architecture

This file defines the canonical top-level module structure for the frontend app.

## Core rules

- One route = one canonical screen.
- Child flows stay attached to their parent module.
- Feature toggles and automation controls do not become top-level navigation items unless they represent a full standalone workflow.
- Legacy aliases should redirect into the canonical destination, not create parallel screens.

## Canonical top-level modules

1. Dashboard
2. Profile
3. Profile Documents
4. Jobs
5. Applications
6. Applications Review
7. AI Assistant
8. Daily Warm-up
9. Interview
10. Coach
11. Negotiation
12. Case Practice
13. Skill Lab
14. Job Radar
15. Reports
16. Salary Calculator
17. Legal Hub
18. Community Center
19. Settings
20. Billing
21. FAQ

## Child flows and ownership

### Profile Documents
- Document Intake
- Style Studio

Profile Documents is the canonical home for document upload, parsing, import, and style transformation work.

### Legal Hub
- Legal Search

Legal Search is part of the Legal Hub experience and should not be treated as a separate top-level product module.

### Settings
- Auto Apply

Auto Apply is a settings and automation control surface. It should not appear as a separate top-level screen.

## Naming conventions

Use the following user-facing labels consistently:

- Profile Documents
- Document Intake
- Style Studio
- Daily Warm-up
- Case Practice
- Community Center

Avoid mixing alternate labels such as:

- Document Hub vs Profile Documents
- Case Study vs Case Practice as parallel top-level products
- Community Centre vs Community Center in active navigation
- Report vs Reports as separate top-level modules

## Routing guidance

Recommended canonical routing shape:

- `/documents`
- `/documents/upload`
- `/documents/style-studio`
- `/legal`
- `/legal/search`
- `/settings`
- `/settings/auto-apply`

Top-level navigation should point only to canonical parent screens where appropriate.
