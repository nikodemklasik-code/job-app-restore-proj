# Quality control method — three layers

Index: [`README.md`](./README.md) · Monolit §10: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

QC must validate backend work across three layers for each module.

---

## A. Functional validation

Check:
- does it run
- does it persist
- does it return correct outputs
- does it influence dependent modules where required

---

## B. Product validation

Check:
- does it match the product spec
- does it support the intended user value
- is it more than a technical placeholder
- does it actually change behaviour in the product

---

## C. Risk validation

Check:
- does cost logic behave honestly
- do source restrictions hold
- do approvals really protect the user
- do deploy guards actually block dangerous actions
- do settings and preferences actually constrain behaviour
