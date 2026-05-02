# Analiza Przycisków w Modułach Job Discovery

**Data:** 2 maja 2026  
**Status:** Kompletna analiza wszystkich przycisków i ich połączeń z backendem

---

## 🎯 Executive Summary

Przeanalizowano **wszystkie przyciski** w komponentach Job Discovery (JobCardCompact, JobCardExpanded, JobsDiscovery, JobDetailPage). Znaleziono **3 krytyczne problemy** wymagające natychmiastowej naprawy oraz **5 przycisków bez rzeczywistego działania**.

---

## 📊 Kompletna Mapa Przycisków

### **JobCardCompact** (frontend/src/components/jobs/JobCardCompact.tsx)

| Przycisk | Ikona | Handler | Backend Endpoint | Status | Problem |
|----------|-------|---------|------------------|--------|---------|
| **Start Application** | `Target` | `onCreateDraft()` | `api.applications.create` | ✅ DZIAŁA | Używa `alert()` zamiast toast |
| **Save/Unsave Job** | `Bookmark/BookmarkCheck` | `onToggleSave()` | `api.jobs.saveJob` / `unsaveJob` | ✅ DZIAŁA | OK |
| **Expand/Collapse** | `ChevronDown/ChevronUp` | `onExpand()` | - (local state) | ✅ DZIAŁA | OK |

**Wnioski:**
- ✅ Wszystkie 3 przyciski mają działanie
- ⚠️ "Start Application" wymaga poprawy UX (toast notifications)

---

### **JobCardExpanded** (frontend/src/components/jobs/JobCardExpanded.tsx)

| Przycisk | Ikona | Handler | Backend Endpoint | Status | Problem |
|----------|-------|---------|------------------|--------|---------|
| **View Full Report** | `FileText` | Link to `/jobs/${job.id}` | - (routing) | ✅ DZIAŁA | OK |
| **Start Application** | `Target` | `onCreateDraft()` | `api.applications.create` | ✅ DZIAŁA | Używa `alert()` zamiast toast |
| **Quick Apply (External)** | `ExternalLink` | `<a href={job.applyUrl}>` | - (external link) | ✅ DZIAŁA | OK |
| **Tailor Resume** | `Sparkles` | `onTailorResume()` | `api.applications.create` + `generateDocuments` | ✅ DZIAŁA | Używa `alert()` zamiast toast |
| **Job Radar Scan** | `Radar` | `onStartRadarScan()` | `api.jobRadar.startScan` | ✅ DZIAŁA | OK |

**Wnioski:**
- ✅ Wszystkie 5 przycisków mają działanie
- ⚠️ 2 przyciski wymagają poprawy UX (toast notifications)

---

### **JobsDiscovery** (frontend/src/app/jobs/JobsDiscovery.tsx)

| Przycisk | Ikona | Handler | Backend Endpoint | Status | Problem |
|----------|-------|---------|------------------|--------|---------|
| **Sessions** | `Cookie` | `setShowSessions()` | - (local state) | ✅ DZIAŁA | OK |
| **Add Manual** | `Plus` | `setShowManualModal()` | `api.jobs.saveManual` | ✅ DZIAŁA | OK |
| **Search** | `Search` | `handleSearch()` | `api.jobs.search` | ✅ DZIAŁA | OK |
| **Save Search** | `Save` | `handleSaveSearch()` | `api.jobs.saveJobPreferences` | ✅ DZIAŁA | OK |
| **Source Checkboxes** | - | `toggleSource()` | - (local state) | ✅ DZIAŁA | OK |
| **Min Fit Slider** | - | `setMinJobFitPercent()` | - (localStorage) | ✅ DZIAŁA | OK |

**Wnioski:**
- ✅ Wszystkie 6 kontrolek mają działanie
- ✅ Wszystkie zapisują stan (localStorage lub backend)

---

### **JobDetailPage** (frontend/src/app/jobs/JobDetailPage.tsx)

| Przycisk | Ikona | Handler | Backend Endpoint | Status | Problem |
|----------|-------|---------|------------------|--------|---------|
| **Back** | `ArrowLeft` | `navigate(-1)` | - (routing) | ✅ DZIAŁA | OK |
| **Save/Unsave** | `Bookmark/BookmarkCheck` | `setIsSaved()` | ❌ BRAK | 🔴 NIE DZIAŁA | **Tylko local state, nie zapisuje do DB** |
| **Apply Now** | `ExternalLink` | `<a href={job.applyUrl}>` | - (external link) | ✅ DZIAŁA | OK |
| **Tailor Resume** | `Sparkles` | - | ❌ BRAK | 🔴 NIE DZIAŁA | **Brak handlera** |
| **Practice Interview** | `Briefcase` | Link to `/interview` | - (routing) | ✅ DZIAŁA | OK |

**Wnioski:**
- ⚠️ 3/5 przycisków działa
- 🔴 **2 przyciski nie mają rzeczywistego działania**

---

## 🚨 Krytyczne Problemy

### **Problem 1: JobDetailPage - Save Button nie zapisuje do bazy**

**Lokalizacja:** `frontend/src/app/jobs/JobDetailPage.tsx:17-18`

```typescript
const [isSaved, setIsSaved] = useState(false);

// Przycisk:
<button onClick={() => setIsSaved(!isSaved)} ...>
```

**Problem:**
- Przycisk zmienia tylko local state
- Nie wywołuje `api.jobs.saveJob` ani `api.jobs.unsaveJob`
- Po odświeżeniu strony stan się resetuje
- Nie synchronizuje się z JobsDiscovery

**Rozwiązanie:**
```typescript
const saveJobMutation = api.jobs.saveJob.useMutation();
const unsaveJobMutation = api.jobs.unsaveJob.useMutation();

const handleToggleSave = () => {
  if (isSaved) {
    unsaveJobMutation.mutate({ jobId: id! }, {
      onSuccess: () => setIsSaved(false),
    });
  } else {
    saveJobMutation.mutate({ jobId: id! }, {
      onSuccess: () => setIsSaved(true),
    });
  }
};
```

---

### **Problem 2: JobDetailPage - Tailor Resume nie ma handlera**

**Lokalizacja:** `frontend/src/app/jobs/JobDetailPage.tsx:289-294`

```typescript
<button className="w-full flex items-center justify-center gap-2 ...">
  <Sparkles className="w-4 h-4" />
  Tailor Resume
</button>
```

**Problem:**
- Przycisk nie ma `onClick` handlera
- Nie tworzy draft application
- Nie generuje dokumentów
- Jest tylko "martwy" element UI

**Rozwiązanie:**
```typescript
const createApplicationMutation = api.applications.create.useMutation();
const generateDocumentsMutation = api.applications.generateDocuments.useMutation();

const handleTailorResume = () => {
  if (!userId || !job) return;
  
  createApplicationMutation.mutate(
    {
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
    },
    {
      onSuccess: (data) => {
        generateDocumentsMutation.mutate(
          { userId, applicationId: data.id },
          {
            onSuccess: () => {
              toast.success('Documents generated!');
              navigate('/applications');
            },
          }
        );
      },
    }
  );
};
```

---

### **Problem 3: Alert() zamiast Toast Notifications**

**Lokalizacja:** 
- `frontend/src/app/jobs/JobsDiscovery.tsx:467-470` (handleCreateDraft)
- `frontend/src/app/jobs/JobsDiscovery.tsx:487-502` (handleTailorResume)

**Problem:**
- Używa natywnego `alert()` - zły UX
- Blokuje UI
- Nie pasuje do designu aplikacji
- Brak loading states na przyciskach

**Rozwiązanie:**
1. Zainstalować `react-hot-toast` lub użyć istniejącego systemu
2. Zastąpić wszystkie `alert()` przez `toast.success()` / `toast.error()`
3. Dodać loading states do przycisków:

```typescript
<button
  onClick={() => handleCreateDraft(job)}
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

## 🔗 Połączenie Saved Jobs → Draft Applications

### **Obecny Stan:**

1. **Saved Jobs** (zapisane oferty):
   - Tabela: `saved_jobs`
   - Endpoint: `api.jobs.saveJob` / `unsaveJob` / `getSavedJobs`
   - UI: Przycisk Bookmark w JobCardCompact/Expanded
   - ✅ **DZIAŁA POPRAWNIE**

2. **Draft Applications** (szkice aplikacji):
   - Tabela: `applications` (status='draft')
   - Endpoint: `api.applications.create`
   - UI: Przycisk "Start Application"
   - ✅ **DZIAŁA** ale używa alert()

### **Problem:**

**Brak połączenia między Saved Jobs a Draft Applications:**
- Użytkownik zapisuje ofertę (Bookmark)
- Później chce stworzyć aplikację z zapisanej oferty
- **Nie ma UI do przeglądania saved jobs i tworzenia z nich aplikacji**

### **Rozwiązanie:**

#### **Opcja A: Dodać zakładkę "Saved Jobs" w JobsDiscovery**

```typescript
// JobsDiscovery.tsx
const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');

<div className="flex gap-2 mb-4">
  <button onClick={() => setActiveTab('search')}>Search Results</button>
  <button onClick={() => setActiveTab('saved')}>Saved Jobs ({savedJobs.size})</button>
</div>

{activeTab === 'saved' && (
  <SavedJobsList 
    onCreateDraft={handleCreateDraft}
    onUnsave={handleToggleSave}
  />
)}
```

#### **Opcja B: Dodać stronę /jobs/saved**

```typescript
// router.tsx
<Route path="/jobs/saved" element={<SavedJobsPage />} />

// SavedJobsPage.tsx
const savedJobsQuery = api.jobs.getSavedJobs.useQuery();

return (
  <div>
    {savedJobsQuery.data?.map(saved => (
      <JobCardCompact
        key={saved.job.id}
        job={saved.job}
        isSaved={true}
        onToggleSave={() => handleUnsave(saved.job.id)}
        onCreateDraft={() => handleCreateDraft(saved.job)}
      />
    ))}
  </div>
);
```

#### **Opcja C: Dodać sekcję "Saved Jobs" w Applications Page**

```typescript
// ApplicationsPage.tsx
<Tabs>
  <Tab label="All Applications" />
  <Tab label="Drafts" />
  <Tab label="Saved Jobs" />
</Tabs>

// W zakładce "Saved Jobs":
- Lista zapisanych ofert
- Przycisk "Create Draft" przy każdej ofercie
- Po kliknięciu tworzy draft i przenosi do zakładki "Drafts"
```

---

## 📋 Plan Naprawy (Priorytet)

### **Faza 1: Krytyczne Naprawy (1-2h)**

1. ✅ **Naprawić JobDetailPage Save Button**
   - Dodać mutations do zapisywania/usuwania
   - Załadować stan z backendu przy montowaniu
   - Synchronizować z JobsDiscovery

2. ✅ **Naprawić JobDetailPage Tailor Resume**
   - Dodać handler tworzący draft + generujący dokumenty
   - Dodać loading state
   - Przekierować do /applications po sukcesie

3. ✅ **Zastąpić alert() przez toast notifications**
   - Zainstalować react-hot-toast
   - Zastąpić wszystkie alert() w JobsDiscovery
   - Dodać loading states do przycisków

### **Faza 2: Połączenie Saved Jobs → Drafts (2-3h)**

4. ✅ **Stworzyć stronę /jobs/saved**
   - Lista zapisanych ofert
   - Przycisk "Create Draft" przy każdej
   - Filtrowanie i sortowanie

5. ✅ **Dodać link "Saved Jobs" w nawigacji**
   - Badge z liczbą zapisanych ofert
   - Highlight gdy są nowe zapisane oferty

### **Faza 3: Testy End-to-End (1h)**

6. ✅ **Przetestować pełny flow:**
   - Job Discovery → Save Job → Saved Jobs → Create Draft → Applications
   - Job Discovery → Start Application → Applications
   - Job Detail → Save → Tailor Resume → Applications
   - Job Radar → Start Scan → View Report

---

## 🎯 Wnioski

### **Co Działa:**
- ✅ Wszystkie przyciski w JobCardCompact (3/3)
- ✅ Wszystkie przyciski w JobCardExpanded (5/5)
- ✅ Wszystkie kontrolki w JobsDiscovery (6/6)
- ✅ Backend API jest kompletne i działa
- ✅ Saved Jobs zapisują się do bazy
- ✅ Draft Applications tworzą się poprawnie

### **Co Nie Działa:**
- 🔴 JobDetailPage Save Button (tylko local state)
- 🔴 JobDetailPage Tailor Resume (brak handlera)
- ⚠️ Alert() zamiast toast notifications (zły UX)

### **Co Brakuje:**
- ❌ UI do przeglądania Saved Jobs
- ❌ Połączenie Saved Jobs → Create Draft
- ❌ Strona /jobs/saved
- ❌ Badge z liczbą saved jobs w nawigacji

---

## 📊 Statystyki

- **Przeanalizowane komponenty:** 4
- **Przeanalizowane przyciski:** 19
- **Działające przyciski:** 17 (89%)
- **Niedziałające przyciski:** 2 (11%)
- **Wymagające poprawy UX:** 3 (16%)
- **Brakujące funkcje:** 3

---

## 🚀 Następne Kroki

1. **Natychmiast:** Naprawić 2 niedziałające przyciski w JobDetailPage
2. **Priorytet:** Zastąpić alert() przez toast notifications
3. **Ważne:** Stworzyć stronę /jobs/saved
4. **Nice to have:** Dodać badge z liczbą saved jobs

---

**Dokument przygotowany:** 2 maja 2026  
**Autor:** Kiro AI Assistant  
**Wersja:** 1.0
