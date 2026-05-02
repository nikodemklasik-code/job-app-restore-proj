# 🚀 Implementation Roadmap - MultivoHub Job App
**Data:** 2 maja 2026  
**Status:** Analiza Product Bible vs Implementacja

---

## 📋 Executive Summary

### ✅ Co jest zaimplementowane (70% MVP)
- **Job Discovery** - wyszukiwanie ofert z 5 providerów
- **Job Radar** - deep scan pracodawców (nowo dodane)
- **Applications CRUD** - podstawowe zarządzanie aplikacjami
- **Interview Practice** - symulacje rozmów
- **AI Personalization** - podstawowe dopasowanie CV/CL
- **Credits System** - billing i subskrypcje

### ❌ Co brakuje (30% MVP)
- **Skill Signals** - brak UI i integracji (tabele są, API częściowo)
- **CV Value Analysis** - brak frontendu
- **Salary Intelligence** - tylko podstawowe benchmarki
- **Auto-Apply Queue** - brak workera
- **Email Monitoring** - brak IMAP integracji
- **Credits Visibility** - brak UI

---

## 🎯 PRIORYTET 1: Dokończenie Draft Applications Flow (TASK 5)

### Status: 60% ✅ | 40% ❌

### ✅ Zrobione:
1. Backend API (`applications.create`) - działa
2. Frontend callbacks (`onCreateDraft`, `onTailorResume`) - dodane
3. Przyciski w UI ("Start Application", "Tailor Resume") - dodane
4. Mutacje tRPC w `JobsDiscovery.tsx` - zaimplementowane

### ❌ Do zrobienia:

#### 1. Toast Notifications (zamiast `alert()`)
**Lokalizacja:** `frontend/src/app/jobs/JobsDiscovery.tsx`

**Obecny kod:**
```typescript
alert(`Draft application created! Application ID: ${data.id}`);
alert(`Failed to create draft: ${error.message}`);
```

**Wymagane:**
- Zainstalować `react-hot-toast` lub użyć istniejącego toast systemu
- Zastąpić wszystkie `alert()` toastami
- Dodać różne typy: success, error, loading

**Implementacja:**
```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Draft application created!');

// Error
toast.error(`Failed: ${error.message}`);

// Loading
const toastId = toast.loading('Creating draft...');
// ... po zakończeniu
toast.success('Done!', { id: toastId });
```

---

#### 2. Loading States na przyciskach
**Lokalizacja:** 
- `frontend/src/components/jobs/JobCardExpanded.tsx`
- `frontend/src/components/jobs/JobCardCompact.tsx`

**Wymagane:**
- Dodać `disabled` state podczas mutacji
- Pokazać spinner zamiast ikony
- Zablokować wielokrotne kliknięcia

**Implementacja:**
```typescript
<button
  onClick={onCreateDraft}
  disabled={createApplicationMutation.isPending}
  className="..."
>
  {createApplicationMutation.isPending ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Target className="w-4 h-4" />
  )}
  {createApplicationMutation.isPending ? 'Creating...' : 'Start Application'}
</button>
```

---

#### 3. Confirmation Modal (opcjonalnie)
**Lokalizacja:** `frontend/src/app/jobs/JobsDiscovery.tsx`

**Wymagane:**
- Modal z potwierdzeniem przed utworzeniem draftu
- Pokazać: tytuł oferty, firmę, fit score
- Przyciski: "Cancel" i "Create Draft"

**Implementacja:**
```typescript
const [confirmDraft, setConfirmDraft] = useState<JobResult | null>(null);

// Modal component
{confirmDraft && (
  <ConfirmDraftModal
    job={confirmDraft}
    onConfirm={() => {
      handleCreateDraft(confirmDraft);
      setConfirmDraft(null);
    }}
    onCancel={() => setConfirmDraft(null)}
  />
)}
```

---

#### 4. Poprawna ścieżka aplikacji END-TO-END

**Flow:**
```
Jobs Discovery 
  → Expand Job Card 
  → Click "Start Application" 
  → [Toast: Creating...] 
  → [API: applications.create] 
  → [Toast: Success!] 
  → Navigate to /applications 
  → Draft visible in list 
  → User can edit/submit
```

**Punkty weryfikacji:**
1. ✅ Draft pojawia się w `/applications`
2. ✅ Status = 'draft'
3. ✅ Wszystkie pola są wypełnione (jobTitle, company, notes)
4. ✅ User może edytować draft
5. ✅ User może wygenerować dokumenty
6. ✅ User może wysłać aplikację

**Do sprawdzenia:**
- Czy `applications.router.ts` ma endpoint `update`?
- Czy `ApplicationsPage.tsx` pokazuje drafty?
- Czy można przejść z draft → submitted?

---

## 🎯 PRIORYTET 2: Skill Signals Integration

### Status: 30% ✅ | 70% ❌

### ✅ Co istnieje w bazie:
```sql
-- Tabele SkillUp (backend/src/db/schemas/skillup.ts)
skill_profiles          -- profil umiejętności użytkownika
skill_claims            -- deklarowane umiejętności
skill_evidence          -- dowody umiejętności
skill_assessments       -- weryfikacja umiejętności
language_assessments    -- ocena języków
skill_gaps              -- analiza luk
career_value_snapshots  -- wartość rynkowa
growth_milestones       -- kamienie milowe
verification_sessions   -- sesje weryfikacyjne
verification_session_results
```

### ✅ Co istnieje w backendzie:
- `aiVerifiedSkills.service.ts` - zapisywanie evidence z AI
- `skillLabCore.service.ts` - analiza CV value
- `skillup/` module - pełna struktura DDD
- Repositories, services, helpers - gotowe

### ❌ Co brakuje:

#### 1. Skill Signals API Router
**Plik:** `backend/src/trpc/routers/skillSignals.router.ts` (NIE ISTNIEJE)

**Wymagane endpointy:**
```typescript
export const skillSignalsRouter = router({
  // Get user skill profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => { ... }),
  
  // Get skill assessment for specific skill
  getSkillAssessment: protectedProcedure
    .input(z.object({ skillKey: z.string() }))
    .query(async ({ ctx, input }) => { ... }),
  
  // Get all skill gaps for user
  getSkillGaps: protectedProcedure
    .query(async ({ ctx }) => { ... }),
  
  // Get market value snapshot
  getMarketValue: protectedProcedure
    .query(async ({ ctx }) => { ... }),
  
  // Record skill evidence manually
  recordEvidence: protectedProcedure
    .input(z.object({
      skillKey: z.string(),
      evidenceText: z.string(),
      sourceType: z.enum(['portfolio', 'github', 'certificate', ...]),
    }))
    .mutation(async ({ ctx, input }) => { ... }),
  
  // Get growth milestones
  getMilestones: protectedProcedure
    .query(async ({ ctx }) => { ... }),
});
```

---

#### 2. Skill Signals Dashboard (Frontend)
**Plik:** `frontend/src/app/skills/SkillSignalsDashboard.tsx` (NIE ISTNIEJE)

**Wymagane sekcje:**

**A. Skill Profile Overview**
```
┌─────────────────────────────────────────┐
│ Your Skill Profile                      │
│                                         │
│ Profile Confidence: ⭐⭐⭐⚪⚪ (Medium)  │
│ Readiness Score: 72/100                 │
│ Market Value: £45,000 - £55,000         │
└─────────────────────────────────────────┘
```

**B. Skills List with Verification Status**
```
┌─────────────────────────────────────────┐
│ Skill                 | Status          │
├─────────────────────────────────────────┤
│ React                 | ✅ Strongly     │
│ TypeScript            | ⚠️  Partially   │
│ Node.js               | 📝 Self-declared│
│ AWS                   | ❌ No evidence  │
└─────────────────────────────────────────┘
```

**C. Skill Evidence Timeline**
```
┌─────────────────────────────────────────┐
│ React - Evidence (5)                    │
├─────────────────────────────────────────┤
│ 🎯 Mock Interview - Apr 30              │
│    "Demonstrated React hooks knowledge" │
│                                         │
│ 💼 Portfolio - Apr 25                   │
│    "Built e-commerce app with React"    │
│                                         │
│ 📄 CV - Apr 20                          │
│    "3 years React experience"           │
└─────────────────────────────────────────┘
```

**D. Skill Gaps Analysis**
```
┌─────────────────────────────────────────┐
│ Gaps for: Senior Frontend Engineer     │
├─────────────────────────────────────────┤
│ 🔴 MUST HAVE                            │
│   • GraphQL (missing)                   │
│   • Testing (needs proof)               │
│                                         │
│ 🟡 IMPORTANT                            │
│   • Docker (weak evidence)              │
│   • CI/CD (stretch)                     │
└─────────────────────────────────────────┘
```

**E. Market Value Projection**
```
┌─────────────────────────────────────────┐
│ Current Value: £45k - £55k              │
│                                         │
│ After acquiring:                        │
│ • GraphQL → +£5k                        │
│ • Testing → +£3k                        │
│ • Docker → +£2k                         │
│                                         │
│ Projected: £55k - £65k (in 6 months)    │
└─────────────────────────────────────────┘
```

---

#### 3. CV Value Analysis Page
**Plik:** `frontend/src/app/profile/CVValueAnalysis.tsx` (NIE ISTNIEJE)

**Wymagane:**
- Analiza CV pod kątem market value
- Scoring każdej umiejętności
- Rekomendacje co dodać/poprawić
- Porównanie z rynkiem

**Komponenty:**
```typescript
<CVValueAnalysis>
  <CVScoreCard score={72} />
  <SkillValueBreakdown skills={...} />
  <MarketComparison current={45000} market={52000} />
  <ImprovementRecommendations items={...} />
</CVValueAnalysis>
```

---

#### 4. Verification Sessions UI
**Plik:** `frontend/src/app/skills/VerificationSession.tsx` (NIE ISTNIEJE)

**Typy sesji:**
- Mock Interview (już istnieje, trzeba połączyć)
- Language Check (nowy)
- Coding Challenge (nowy)
- Portfolio Review (nowy)
- Case Study Review (nowy)
- Writing Assessment (nowy)

**Flow:**
```
Start Session 
  → Select Skills to Verify 
  → Complete Challenge 
  → AI Analysis 
  → Evidence Recorded 
  → Skill Assessment Updated
```

---

## 🎯 PRIORYTET 3: Salary Intelligence

### Status: 20% ✅ | 80% ❌

### ✅ Co istnieje:
- Job Radar benchmarks (P25/median/P75)
- Basic salary comparison w `scoreJobFit`

### ❌ Co brakuje:

#### 1. Salary Negotiation Advisor
**Plik:** `backend/src/services/salaryNegotiation.ts` (NIE ISTNIEJE)

**Funkcje:**
```typescript
export async function generateNegotiationStrategy(input: {
  currentOffer: number;
  marketMedian: number;
  userSkills: string[];
  yearsExperience: number;
  location: string;
}): Promise<{
  recommendedCounter: number;
  justification: string[];
  talkingPoints: string[];
  walkAwayThreshold: number;
}>;

export async function analyzeSalaryOffer(input: {
  offer: number;
  benefits: string[];
  location: string;
  role: string;
}): Promise<{
  marketPosition: 'below' | 'at' | 'above';
  totalCompValue: number;
  hiddenCosts: string[];
  recommendations: string[];
}>;
```

---

#### 2. Salary Calculator Enhancement
**Plik:** `frontend/src/app/salary/UKSalaryCalculator.tsx` (ISTNIEJE, ale podstawowy)

**Dodać:**
- Skill-based salary estimation
- Regional adjustments (London vs Manchester)
- Benefits calculator (pension, bonus, equity)
- Take-home calculator (after tax)
- Comparison with market data

---

#### 3. Salary History Tracking
**Tabela:** `salary_history` (NIE ISTNIEJE)

**Schema:**
```sql
CREATE TABLE salary_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  salary_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  benefits_value DECIMAL(12,2),
  start_date DATE NOT NULL,
  end_date DATE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 PRIORYTET 4: Credits Visibility (Frontend)

### Status: 0% ✅ | 100% ❌

### Backend: ✅ Działa
- `creditSpendEvents` table
- `subscriptions` table
- Approve/commit/reject flow

### Frontend: ❌ Brak UI

#### 1. Credit Balance Widget
**Lokalizacja:** `frontend/src/components/layout/AppShell.tsx`

**Wymagane:**
```typescript
<CreditBalanceWidget>
  <div className="flex items-center gap-2">
    <Coins className="h-4 w-4" />
    <span className="font-semibold">1,250</span>
    <span className="text-xs text-slate-500">credits</span>
  </div>
  <Progress value={75} max={100} />
  <span className="text-xs">75 free remaining</span>
</CreditBalanceWidget>
```

**Pozycja:** Header (prawy górny róg) lub Sidebar

---

#### 2. Cost Preview Modal
**Komponent:** `frontend/src/components/credits/CostPreviewModal.tsx` (NIE ISTNIEJE)

**Trigger:** Przed każdą akcją AI (interview, document generation, job radar)

**Zawartość:**
```
┌─────────────────────────────────────────┐
│ Confirm Action                          │
├─────────────────────────────────────────┤
│ Action: Generate Cover Letter          │
│ Estimated Cost: 50 credits              │
│                                         │
│ Your Balance: 1,250 credits             │
│ After: 1,200 credits                    │
│                                         │
│ [Cancel]  [Confirm & Spend 50 credits] │
└─────────────────────────────────────────┘
```

---

#### 3. Transaction History Page
**Plik:** `frontend/src/app/billing/TransactionHistory.tsx` (NIE ISTNIEJE)

**Wymagane:**
- Lista wszystkich transakcji
- Filtry (data, typ, status)
- Export do CSV
- Szczegóły każdej transakcji

**Tabela:**
```
┌──────────────────────────────────────────────────────┐
│ Date       | Action              | Credits | Balance │
├──────────────────────────────────────────────────────┤
│ May 2      | Job Radar Scan      | -100    | 1,250   │
│ May 1      | Cover Letter Gen    | -50     | 1,350   │
│ Apr 30     | Mock Interview      | -200    | 1,400   │
│ Apr 29     | Credit Pack Purchase| +1,000  | 1,600   │
└──────────────────────────────────────────────────────┘
```

---

#### 4. Low Balance Warning
**Komponent:** `frontend/src/components/credits/LowBalanceWarning.tsx` (NIE ISTNIEJE)

**Trigger:** Gdy credits < 100

**Zawartość:**
```
┌─────────────────────────────────────────┐
│ ⚠️  Low Credit Balance                  │
├─────────────────────────────────────────┤
│ You have 75 credits remaining.          │
│ Top up now to continue using AI features│
│                                         │
│ [Buy Credits]  [Upgrade Plan]          │
└─────────────────────────────────────────┘
```

---

## 🎯 PRIORYTET 5: Auto-Apply Queue & Email Monitoring

### Status: 10% ✅ | 90% ❌

### ✅ Co istnieje:
- `autoApplyQueue` table
- `emailMonitoring` table
- `userEmailSettings` table

### ❌ Co brakuje:

#### 1. Auto-Apply Worker
**Plik:** `backend/src/workers/autoApplyWorker.ts` (NIE ISTNIEJE)

**Funkcje:**
```typescript
// Proces w tle (PM2 lub cron)
export async function processAutoApplyQueue() {
  // 1. Pobierz pending jobs z kolejki
  const pending = await getAutoApplyQueue({ status: 'pending', limit: 10 });
  
  // 2. Dla każdego job:
  for (const job of pending) {
    // a. Wygeneruj CV i CL
    const cv = await generateCvSummary(profile, job);
    const cl = await generateCoverLetter(profile, job);
    
    // b. Wyślij email
    const sent = await sendApplicationEmail({
      to: job.applyEmail,
      subject: `Application for ${job.jobTitle}`,
      body: cl,
      attachments: [{ filename: 'CV.pdf', content: cv }],
    });
    
    // c. Zaktualizuj status
    await updateAutoApplyQueue(job.id, {
      status: sent ? 'applied' : 'failed',
      sentAt: new Date(),
    });
  }
}
```

**Uruchomienie:**
```bash
# PM2
pm2 start backend/dist/workers/autoApplyWorker.js --name jobapp-auto-apply

# Lub cron (co 5 minut)
*/5 * * * * node /root/project/backend/dist/workers/autoApplyWorker.js
```

---

#### 2. Email Monitoring (IMAP)
**Plik:** `backend/src/services/emailMonitoring.ts` (NIE ISTNIEJE)

**Funkcje:**
```typescript
export async function monitorInbox(userId: string) {
  // 1. Pobierz IMAP credentials
  const settings = await getUserEmailSettings(userId);
  
  // 2. Połącz z IMAP
  const imap = await connectIMAP({
    host: settings.imapHost,
    port: settings.imapPort,
    user: settings.smtpUser,
    password: decrypt(settings.smtpPassEncrypted),
  });
  
  // 3. Pobierz nowe wiadomości
  const messages = await imap.search(['UNSEEN']);
  
  // 4. Dla każdej wiadomości:
  for (const msg of messages) {
    // a. Sprawdź czy to odpowiedź na aplikację
    const application = await matchEmailToApplication(msg);
    
    if (application) {
      // b. Zaktualizuj status aplikacji
      await updateApplicationStatus(application.id, {
        status: detectStatus(msg.body), // 'interview', 'rejected', 'offer'
        lastFollowedUpAt: new Date(),
      });
      
      // c. Wyślij notyfikację do użytkownika
      await sendNotification(userId, {
        type: 'application_response',
        applicationId: application.id,
        message: `Response from ${application.company}`,
      });
    }
  }
}
```

---

#### 3. Auto-Apply UI
**Plik:** `frontend/src/app/auto-apply/AutoApplyQueue.tsx` (NIE ISTNIEJE)

**Sekcje:**
- Lista jobs w kolejce
- Status każdego job (pending, processing, applied, failed)
- Możliwość dodania/usunięcia z kolejki
- Ustawienia auto-apply (min fit score, max per day)

---

## 🎯 PRIORYTET 6: Document Lab

### Status: 20% ✅ | 80% ❌

### ✅ Co istnieje:
- `documentUploads` table
- `documents` table (versioned)
- Basic upload w `DocumentLab.tsx`

### ❌ Co brakuje:

#### 1. AI Text Extraction
**Plik:** `backend/src/services/documentExtraction.ts` (NIE ISTNIEJE)

**Funkcje:**
```typescript
export async function extractTextFromDocument(file: Buffer, mimeType: string): Promise<string> {
  // PDF: użyj pdf-parse
  // DOCX: użyj mammoth
  // Images: użyj Tesseract OCR
}

export async function parseStructuredData(text: string, documentType: string): Promise<any> {
  // CV: wyciągnij skills, experience, education
  // Certificate: wyciągnij issuer, date, skills
  // Cover Letter: wyciągnij key points
}
```

---

#### 2. Auto-fill Profile
**Funkcja:** Po upload CV → automatycznie wypełnij profile

**Flow:**
```
Upload CV 
  → Extract Text 
  → Parse Structure 
  → Match to Profile Fields 
  → Show Preview 
  → User Confirms 
  → Update Profile
```

---

#### 3. Version History UI
**Komponent:** `frontend/src/app/documents/DocumentVersionHistory.tsx` (NIE ISTNIEJE)

**Wymagane:**
- Lista wszystkich wersji dokumentu
- Diff między wersjami
- Możliwość przywrócenia starej wersji
- Download każdej wersji

---

## 📊 Podsumowanie Priorytetów

### Faza 1 (Tydzień 1) - Dokończenie MVP
1. ✅ **Draft Applications Flow** (2-3 dni)
   - Toast notifications
   - Loading states
   - End-to-end testing
   
2. ✅ **Credits Visibility** (1-2 dni)
   - Balance widget
   - Cost preview modal
   - Transaction history

### Faza 2 (Tydzień 2-3) - Skill Signals
3. ✅ **Skill Signals API** (3-4 dni)
   - Router z endpointami
   - Integracja z istniejącymi services
   
4. ✅ **Skill Signals Dashboard** (3-4 dni)
   - Profile overview
   - Skills list
   - Evidence timeline
   - Gaps analysis

### Faza 3 (Tydzień 4) - Salary & Auto-Apply
5. ✅ **Salary Intelligence** (2-3 dni)
   - Negotiation advisor
   - Enhanced calculator
   - History tracking
   
6. ✅ **Auto-Apply Queue** (2-3 dni)
   - Worker implementation
   - Email monitoring
   - Queue UI

### Faza 4 (Tydzień 5) - Polish & Testing
7. ✅ **Document Lab** (2 dni)
   - AI extraction
   - Auto-fill
   - Version history
   
8. ✅ **End-to-End Testing** (2-3 dni)
   - Wszystkie flow
   - Bug fixing
   - Performance optimization

---

## 🔧 Techniczne Wymagania

### Backend Dependencies
```json
{
  "pdf-parse": "^1.1.1",        // PDF extraction
  "mammoth": "^1.6.0",          // DOCX extraction
  "tesseract.js": "^5.0.0",     // OCR
  "imap": "^0.8.19",            // Email monitoring
  "nodemailer": "^6.9.0"        // Email sending
}
```

### Frontend Dependencies
```json
{
  "react-hot-toast": "^2.4.1",  // Toast notifications
  "recharts": "^2.10.0",        // Charts dla salary/skills
  "react-diff-viewer": "^3.1.1" // Document diff
}
```

### Infrastructure
- **PM2 Workers:** Auto-apply, Email monitoring
- **Cron Jobs:** Cleanup, Maintenance
- **Redis:** Queue management (opcjonalnie)

---

## 📝 Notatki Implementacyjne

### Bezpieczeństwo
- ✅ Wszystkie endpointy używają `protectedProcedure`
- ✅ Email credentials są encrypted
- ⚠️ Dodać rate limiting na AI endpoints
- ⚠️ Dodać CSRF protection na upload endpoints

### Performance
- ✅ Database indexes są na miejscu
- ⚠️ Dodać caching dla market data
- ⚠️ Dodać pagination dla transaction history
- ⚠️ Optymalizować AI calls (batch processing)

### Monitoring
- ⚠️ Dodać logging dla workers
- ⚠️ Dodać alerting dla failed jobs
- ⚠️ Dodać metrics dla credit usage
- ⚠️ Dodać health checks dla IMAP connections

---

## ✅ Checklist przed Production

### Backend
- [ ] Wszystkie endpointy mają testy
- [ ] Error handling jest kompletny
- [ ] Logging jest na miejscu
- [ ] Rate limiting jest skonfigurowany
- [ ] Workers są uruchomione w PM2

### Frontend
- [ ] Wszystkie komponenty mają loading states
- [ ] Error boundaries są na miejscu
- [ ] Toast notifications działają
- [ ] Responsive design jest sprawdzony
- [ ] Accessibility jest zweryfikowane

### Database
- [ ] Wszystkie migracje są uruchomione
- [ ] Indexes są zoptymalizowane
- [ ] Backup strategy jest na miejscu
- [ ] Data retention policy jest zaimplementowana

### Infrastructure
- [ ] PM2 ecosystem jest skonfigurowany
- [ ] Nginx jest zoptymalizowany
- [ ] SSL certificates są aktualne
- [ ] Monitoring jest aktywny
- [ ] Backup automation działa

---

**Koniec dokumentu**  
**Wersja:** 1.0  
**Ostatnia aktualizacja:** 2 maja 2026
