# Case Practice — specification pack

This folder contains the **Case Practice** product pack (consolidated spec, AI prompt pack, legal/safety layer, and game-mechanics principles).

| File | Contents |
|------|----------|
| [Case_Practice_Final_Consolidated_Spec.md](./Case_Practice_Final_Consolidated_Spec.md) | Full consolidated product specification |
| [Case_Practice_AI_Prompt_Pack.md](./Case_Practice_AI_Prompt_Pack.md) | AI / system prompt material for the module |
| [Case_Practice_Legal_Safety_Compliance_Risk_Layer.md](./Case_Practice_Legal_Safety_Compliance_Risk_Layer.md) | Legal, safety, compliance, moderation, privacy, and marketing guardrails |
| [Case_Practice_Legal_Safety_Compliance_Risk_Layer.pdf](./Case_Practice_Legal_Safety_Compliance_Risk_Layer.pdf) | Same legal/safety layer as **PDF** (import z `~/Downloads/`, 2026-04-16) |
| [Employment_Tribunal_Legal_Safety_Compliance_Risk_Layer.md](./Employment_Tribunal_Legal_Safety_Compliance_Risk_Layer.md) | Extra guardrails for **Employment Tribunal**–oriented practice (with Case Practice layer; stricter rule wins) |
| [Case_Practice_Game_Mechanics_Layer.md](./Case_Practice_Game_Mechanics_Layer.md) | Gamification **without** hollow XP: streaks, pressure rank, skill signals, unlocks, growth moments, anti-patterns |
| [case_practice_feature_page.html](./case_practice_feature_page.html) | Static marketing / feature-page reference (open in browser); same lineage as Spokkn export |

**Source:** Imported from `Case_Practice_Full_Pack_With_Legal_Safety.zip` (and aligned with the standalone legal/safety markdown from Downloads). The Employment Tribunal layer is **repo-authored** for UK-first ET flows. Game mechanics layer + HTML were imported from `~/Downloads/Spokkn/` (2026-04-16).

**PDF (game mechanics):** `Case_Practice_—_Game_Mechanics_Layer.pdf` from Spokkn export was **not** copied into git; canonical text is [Case_Practice_Game_Mechanics_Layer.md](./Case_Practice_Game_Mechanics_Layer.md).

**Implementation:** App route `/case-practice` exists (`frontend/src/app/case-practice/CasePracticePage.tsx`). Use these docs when extending the shell into full scenario lifecycle, mechanics persistence, and profile-linked signals; together with `docs/agent-prompts/ui-screen-foundation-agent-instruction.md` for shared UI patterns.
