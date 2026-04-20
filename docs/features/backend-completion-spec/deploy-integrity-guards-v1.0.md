# Deploy integrity guards — backend / ops spec

Index: [`README.md`](./README.md) · Monolit §7: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Status

This currently appears more like a required policy direction than a fully complete implementation.

---

## Required features

Implement:
- **.canonical-repo-key**
- **remote deploy marker**
- **local canonical path validation**
- **remote canonical path validation**
- **deploy target host validation**
- **deploy target domain validation**
- **DNS mismatch guard**
- **wrong-folder deploy block**

---

## Required rules

Deploy must fail if:
- local working directory is non-canonical
- repo marker is missing
- remote target path is wrong
- remote marker is missing
- host or domain mismatch is detected
- copied folder tries to deploy

---

## QC must validate

- deploy from copied repo is blocked
- canonical path rules are enforced
- remote target validation exists
- no deploy path relies only on user memory
