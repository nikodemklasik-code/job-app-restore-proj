# Employment Tribunal Practice — Legal, Safety, Compliance And Risk Layer

## Purpose

This document defines guardrails for any **Employment Tribunal–oriented practice** inside the product (e.g. Case Practice scenarios, interview-style prep, or dedicated ET flows). It sits **alongside** `Case_Practice_Legal_Safety_Compliance_Risk_Layer.md`; where both apply, the **stricter** rule wins.

Goals:

- Keep the feature **practice and preparation**, not legal advice or representation.
- Avoid **outcome prediction**, **merits judgments**, or **jurisdiction overreach**.
- Treat **Early Conciliation**, **time limits**, and **procedure** as sensitive — describe possibilities and official routes, not certainties for the user’s case.
- Keep **marketing claims** accurate and defensible.

---

## 1. Legal Safety Layer

### 1.1 Not Legal Advice Rule

The product must not present itself as:

- legal advice or legal representation  
- a tribunal outcome predictor  
- a substitute for a qualified solicitor, barrister, trade union adviser, CAB, or ACAS on a specific claim  

The product **may** help the user:

- organise facts and a timeline  
- separate **facts**, **impact**, and **desired outcomes**  
- practise clarity under pressure  
- rehearse how to explain a concern calmly and precisely  
- understand that **Early Conciliation** and **tribunal procedure** exist as **general** concepts (with pointers to official sources)  

The product **must not** state:

- that the user **will win** or **will lose**  
- that conduct is **definitely unlawful** or **definitely lawful**  
- a **guaranteed** time limit or deadline for their claim without **qualified case-specific** input  
- that a particular ET1 wording or strategy **will succeed**  

**Preferred wording (Title Case for UI where used):**

- **This May Raise A Formal Workplace Or Legal Concern**  
- **This May Warrant Qualified Advice**  
- **Time Limits Are Strict In Many Jurisdictions — Confirm Yours With A Qualified Adviser**  
- **Early Conciliation Is Often A Required Step Before Many Tribunal Claims In England, Scotland, And Wales — Check Official Guidance**  
- **We Help You Practise; We Do Not Decide Your Case**  

### 1.2 Claim Caution Rule

The AI may help identify **types of concerns** that sometimes appear in workplace disputes (e.g. fairness, discrimination, harassment, victimisation, procedural issues) **as patterns in the user’s narrative**, phrased cautiously.

**Allowed (examples):**

- **The Facts You Described May Be Worth Reviewing With A Qualified Adviser.**  
- **If This Happened As Described, It May Be Appropriate To Document Dates, Witnesses, And Evidence Carefully.**  

**Not allowed:**

- **You Have A Winning Claim.**  
- **This Is Clearly Unlawful Discrimination.**  
- **You Will Get X Months’ Pay.**  

---

## 2. Jurisdiction And Tribunal Specificity

### 2.1 UK-First, Configurable

If the product is **UK-first**, default copy may reference:

- **Employment Tribunal (ET)** as a general forum for some employment disputes  
- **ACAS Early Conciliation** as a **common** pre-claim step for many claims in England, Scotland, and Wales  

The product **must**:

- support a **Primary Jurisdiction** setting where ET-style flows exist  
- use a **Jurisdiction Unknown** fallback that avoids precise procedural claims  

### 2.2 No False Precision

Do not state exact limitation periods, mandatory steps, or remedies **unless**:

- tied to a **documented official checklist** presented as **general information**, **and**  
- paired with **This Depends On Your Facts And Jurisdiction; Confirm With A Qualified Adviser**  

### 2.3 Region-Neutral Fallback

If jurisdiction is unknown:

- prefer **neutral** escalation language (documentation, HR, mediation, qualified advice)  
- avoid naming **ET1**, **CCD**, or other narrow procedure labels unless the user has set UK tribunal context  

---

## 3. Escalation And Referral Policy

### 3.1 Escalation Ladder (Tribunal-Aware)

Include, where appropriate, **non-exhaustive** routes:

- **Clarify Informally**  
- **Document And Date Key Events**  
- **Internal Grievance Or Equivalent**  
- **ACAS Early Conciliation (Where Applicable)**  
- **Qualified Legal Advice**  
- **Employment Tribunal Claim (Where Applicable And In Time)**  

The AI helps the user think about **proportionate** next steps; it does **not** choose the route for them.

### 3.2 When Not To Push “Tribunal First”

Avoid steering users toward tribunal claims when:

- safety, threats, or immediate harm are indicated → **signpost to emergency and human support**  
- the narrative suggests unresolved trauma or severe distress → **prioritise support and professional help**  
- facts are too thin → **encourage documentation and advice before escalation**  

**Allowed:**

- **A Tribunal Route May Exist In Some Cases; Whether It Fits Yours Needs Qualified Advice.**  

---

## 4. Live Session Moderation (Tribunal Roleplay)

Shared or live tribunal-style practice is **moderated simulation**, not adversarial litigation.

Same baseline as Case Practice:

- **Leave Session**, **Mute**, **Block**, **Report**, **End Session Early**  
- AI moderator keeps focus on **structure and facts**, not personal attacks  

**Additional rule:** Roleplay of **opposing counsel or judge** must remain **educational** — no humiliation, no “gotcha” cruelty, no fake binding rulings presented as real.

---

## 5. Privacy, Retention, And Sensitive Narratives

Tribunal-related narratives may include highly sensitive data (health, discrimination, sexual harassment, whistleblowing).

Apply `Case_Practice_Legal_Safety_Compliance_Risk_Layer.md` **§5** in full, with emphasis:

- minimise retention of **full** sensitive narratives where **signal-level** summaries suffice  
- clear disclosure if **shared sessions** are stored, transcribed, or visible to others  
- user deletion paths for session history where technically feasible  

---

## 6. Marketing And Product Integrity

### 6.1 Claims Guardrail

Do **not** claim that the product:

- wins tribunal cases  
- replaces solicitors or free specialist advice  
- predicts tribunal outcomes  
- calculates limitation periods for the user’s claim  
- proves discrimination or whistleblowing  

**Allowed positioning:**

- **Practise Explaining Your Case With Clarity**  
- **Prepare For Difficult Workplace And Formal Conversations**  
- **Organise Facts And Timelines Before Seeking Advice**  
- **Build Calm, Credible Communication Under Pressure**  

### 6.2 Integrity

Avoid gamified “verdict” scores that mimic a real tribunal decision. Any scoring must be framed as **communication / preparation quality**, not **legal merit**.

---

## 7. Safety Copy And Disclaimers

### 7.1 Persistent Module Message

**This Tool Helps You Practise And Organise Your Thinking About Workplace Disputes. It Does Not Provide Legal Advice And Does Not Replace A Qualified Employment Lawyer Or Other Regulated Adviser.**

### 7.2 Sensitive Case Nudge

**This Topic May Involve Tribunal Time Limits And Strict Procedures. Use Official Sources And Qualified Advice For Anything Time-Sensitive.**

### 7.3 Emergency Exclusion

If content indicates **immediate danger**, **threats**, or **urgent safeguarding**, stop normal tribunal roleplay and **signpost to appropriate emergency and human support** (no procedural trivia).

---

## 8. Implementation Checklist

Before shipping ET-oriented flows:

- [ ] Jurisdiction setting and copy fallback reviewed  
- [ ] All ET-related strings reviewed against **§1** and **§6**  
- [ ] Official links (e.g. GOV.UK, ACAS) verified; no stale procedural URLs in critical paths  
- [ ] Retention and shared-session policies documented for users  
- [ ] Marketing and app store copy run through **§6**  

---

## 9. Final Safety Statement

**Employment Tribunal practice features should help users communicate more clearly, organise facts, and understand that formal routes exist — without pretending to decide legal outcomes, replace regulated advice, or navigate time limits on their behalf.**

This layer keeps ET-related product areas **credible, cautious, and defensible** alongside the broader Case Practice safety model.
