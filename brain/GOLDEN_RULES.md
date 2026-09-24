# Golden Rules — How the Brain Is Written and Kept

> **Purpose:** This governs every file in `brain/` — the engineering knowledge base for this frontend. It does not govern application code in `src/`.
>
> **Read this before:** creating a new doc, editing an existing one, or deciding a doc needs to be split.

---

## 1. What This Document Is

A working contract between the humans and the agents who write in `brain/`. Every rule here exists to prevent a specific failure mode: docs that drift from the real code, docs nobody can find, or docs so long nobody reads them before making a change.

---

## 2. Scope — What Counts as "The Brain"

The Brain is **how this app is built and why** — architecture, feature-folder conventions, data-fetching patterns, and step-by-step recipes for adding a new feature. Written so a human can review a change before it happens and an agent can execute the same change without re-deriving the codebase's conventions each time.

**Inside the Brain:**
- Architecture and conventions (`architecture/`)
- The shared UI component library (`ui/`)
- Business rules per feature area — inventory, sales, purchases (`domains/`)
- Step-by-step build recipes (`playbooks/`)
- Project orientation and local setup (`foundation/`)

**Not the Brain:**
- The code itself (`src/`) — the Brain describes it, never replaces it. If a doc and the code disagree, the code is right and the doc is stale (see Rule 8).
- The database schema itself — this app doesn't own the DB. The full schema and relationship map lives in the sibling backend repo at `houseOfSeyaInventoryManagementBackend/brain/database/schema-overview.md`; this repo's `domains/*.md` only documents the DTO shapes this app actually consumes.

---

## 3. Rule — Length

**Soft limit: ~250 lines per file.** This is a signal, not a wall.

If a file is short because the topic is genuinely small, leave it short. If a file is approaching or past 250 lines, split along a real seam. Never split a doc that isn't done yet just to hit a number.

---

## 4. Rule — Instruction-Based and Sectioned

Every doc is something a reader *acts on*, not background reading. Prefer:

- Numbered steps over prose paragraphs
- Tables over descriptive lists when there are 2+ comparable attributes
- An explicit **Exit condition** for anything describing a process step
- Headers that let someone jump straight to the part they need

### Formatting: One Line Per Paragraph or List Item

Write each paragraph and list item as a single line in the source file — no manual mid-sentence line breaks. Split at real topic shifts into short paragraphs, not mid-thought.

---

## 5. Rule — Dual Audience (Human + Agent)

Every doc must work for both:

- **A human reviewing a change** — plain language, the "why" next to the "what."
- **An agent executing against it** — unambiguous steps, exact file paths and component/hook names, no rule that only makes sense with context a machine can't infer.

---

## 6. Rule — Discoverability

- Every doc states its purpose and related docs in the first 5 lines.
- `brain/README.md` is the single entry point and map. Adding, renaming, splitting, or retiring a doc updates the map in the same change.
- A file's name tells you what's in it without opening it — lowercase, hyphenated, descriptive.

---

## 7. Rule — Folder Structure: Domain Units

```
brain/
├── README.md                 entry point + map
├── GOLDEN_RULES.md            this file
├── foundation/                 what the app is, how to run it
├── architecture/                cross-cutting patterns every feature follows
├── ui/                             the shared component library
├── domains/                          business rules + DTO shapes per feature area
└── playbooks/                          step-by-step build recipes
```

A new domain folder earns its existence once it has 2+ real files, or 1 file plus a named next one.

---

## 8. Rule — Keep In Sync With Code, or Flag It

This Brain describes a real, currently-running app, not a plan for one. The risk is drift, not fabrication.

- Whenever a change adds/removes a feature, changes routing, or changes a cross-cutting pattern (auth, data fetching, the shared component library), update the relevant Brain doc in the *same* change.
- If you notice a stale doc, fix it on the spot if small, or add a `> **Drift note:**` line naming exactly what's out of date.
- `domains/*.md`'s DTO shapes are the highest-risk files for drift against the backend — check them against `src/types/index.ts` and, when possible, the backend's `brain/database/schema-overview.md` whenever the API shape changes.

---

## 9. Rule — No Filler

- Every paragraph answers a question someone would actually ask before touching this code.
- Cut anything that restates the title in different words.
- No decorative structure (emoji headers, ASCII banners, badges).

---

## 10. Rule — Reusable Recipe for a New Feature

`domains/` and `playbooks/` are written to be feature-agnostic on purpose. Adding brain coverage for a new feature area should take a short pass:

1. Build the feature following `playbooks/add-a-new-feature.md`.
2. Write its business-rule doc in `domains/<area>.md` using the same shape as `domains/sales.md` (What it is → key screens/flows → related API calls → related backend domain doc).
3. Add it to `brain/README.md`'s map in the same change.

---

## 11. Before You Add or Edit a Doc — Checklist

1. Does this describe architecture/conventions/UI/business-rules, or does it belong in the backend Brain instead? (Rule 2)
2. Is there already a doc this belongs in?
3. Purpose + related docs stated in the first 5 lines? (Rule 6)
4. Structured as steps/rules/tables, not narrative? (Rule 4)
5. Would a human and an agent both know exactly what to do after reading it? (Rule 5)
6. Under ~250 lines? (Rule 3)
7. Does this change touch code? Is the matching Brain doc updated in the same change? (Rule 8)
8. Updated the map in `brain/README.md`?
