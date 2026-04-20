# Traceability matrix — `<release or slice name>`

**Updated:** YYYY-MM-DD  
**Source screen specs:** `screens/*.md`

**Every column must be filled or explicitly `N/A` + reason.** No “TBD” at Ready for QC.

| Screen ID | Screen name | SQL / migration paths | Schema file paths | Backend implementation paths | Router index touch? | FE page / route paths | FE components + tRPC call sites | BE test cmd + result | FE test cmd + result | BE build exit | FE build exit | QC artefact | Status |
|-----------|-------------|----------------------|-------------------|-------------------------------|---------------------|----------------------|--------------------------------|---------------------|---------------------|---------------|---------------|-------------|--------|
| SCR-… | | | | | | | | | | | | | |

**Status values:** Not started | In progress | Ready for QC | Approved | Blocked  

**Rule:** Row is **Approved** only when code paths and build/test columns match the merged PR for that slice.
