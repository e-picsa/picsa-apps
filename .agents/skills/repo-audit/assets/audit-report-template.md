# Audit Report — <repo name>

> Generated with `.agents/skills/repo-audit/SKILL.md`. Do not commit unless asked.
> Author: <model name (harness/agent)> (restructured/updated by <model name>, if applicable).
> Date: <ISO date>. Base commit: <SHA>. Scope: <full | focused on X>.
> Context: `repo-context.md` <filled | partial | missing — assumptions flagged>.
> Previous audit: <date + commit | none>.
> Second opinion: <reviewer model/agent, claims checked + gaps hunted | skipped + reason>.

## Top summary

**Highest-leverage recommendation:**

- <single action, owner, and why it unlocks the rest>

**Priority issues (ordered by value relative to effort; tier `CONFIRMED | LIKELY | SUSPECTED`):**

| Rank | ID  | Sev | Tier      | V/E | Title   | Location    | Impact                                    |
| ---- | --- | --- | --------- | --- | ------- | ----------- | ----------------------------------------- |
| 1    | F0  | P0  | CONFIRMED | H/S | <title> | `path:line` | <one-line user or maintainability impact> |

**Structural / maintainability themes (1–3):**

| Theme                                 | Spread (census)         | Long-term drag                           | Phase-1 containment          |
| ------------------------------------- | ----------------------- | ---------------------------------------- | ---------------------------- |
| <e.g. Dual persistence / mixed state> | <N files across M apps> | <cognitive load / dual migration matrix> | <quarantine / lint ban / R#> |

**Strengths (3–7):**

| Strength   | Evidence    |
| ---------- | ----------- |
| <strength> | `path:line` |

## Roadmap (single source — ordered by priority)

Value `H/M/L`: `H` removes a crash, data loss, or primary-user blocker **or** eliminates major long-term maintenance / mental-model drag (competing stacks, systemic leakage, contributor/AI traps); `M` clears subset pain or meaningful toil / cognitive load; `L` is nice-to-have.
Effort `S/M/L` (never days): `S` likely one file + covered tests; `M` a few files or extra review; `L` many files or heavy human oversight. Every `P0`/`P1` finding (including `Effort L` consolidation items) maps to a row below.

| ID  | Type             | Title                                   | Beneficiary   | Value | Effort | Depends on | Done when                     | From |
| --- | ---------------- | --------------------------------------- | ------------- | ----- | ------ | ---------- | ----------------------------- | ---- |
| R0  | Example (delete) | Fix N+1 query in `src/api/users.ts:112` | API consumers | H     | S      | none       | Single query, covered by test | F0   |

- **Quick wins:** R1
- **Strategic (with Phase-1 steps):** R2

**Strategic notes:**

| ID  | What breaks / drags today             | What it unblocks          | Cost of deferral   |
| --- | ------------------------------------- | ------------------------- | ------------------ |
| R2  | <current failure or mental-model tax> | <downstream work enabled> | <compounding cost> |

### Task prompts

| ID  | Agent handoff prompt                                              |
| --- | ----------------------------------------------------------------- |
| R1  | "<one-line instruction naming file, change, and finding ID>"      |
| R2  | "<scoped Phase-1 brief executable without re-reading the report>" |

## Delta since last audit

- Summary: `<If no previous audit: No previous audit — this is the baseline.>` Otherwise `<X fixed, Y still open, Z invalid/superseded, N new>`.

| Prior finding  | Status                                    | Evidence                        |
| -------------- | ----------------------------------------- | ------------------------------- |
| <title + date> | Fixed / Still open / Invalid / Superseded | <`path:line` or command output> |

## Scope and coverage

| Area / Surface  | Status                   | Notes / Skip reason |
| --------------- | ------------------------ | ------------------- |
| <dir or module> | Read / Skimmed / Skipped | <reason>            |

- **Commands & checks:** `<command>` -> `<outcome>` (full logs in Appendix).
- **Issues mined (read-only):** <`gh issue list` top labels/complaints, or why skipped>.
- **Assumptions:** <what was inferred from missing context; archetype guesses flagged here, never downgrading verified bugs>.

## User impact and functionality

| Archetype     | Goal   | Constraint   | What "broken" means |
| ------------- | ------ | ------------ | ------------------- |
| <archetype 1> | <goal> | <constraint> | <outcome>           |

**Gap findings (missing, painful, or mismatched):**

| ID  | Sev | Tier   | V/E | Title   | Location    | User impact            | Next step |
| --- | --- | ------ | --- | ------- | ----------- | ---------------------- | --------- |
| F1  | P1  | LIKELY | M/S | <title> | `path:line` | <who it hurts and how> | <action>  |

## Architecture & dependencies

**Stack & migration inventory (competing paradigms):**

| Concern          | Canonical   | Legacy / Competing | Census (files / refs) | Contained or leaking?                               |
| ---------------- | ----------- | ------------------ | --------------------- | --------------------------------------------------- |
| <Backend / Auth> | <canonical> | <legacy>           | <N files>             | <Contained (module X) / Leaking (imported in libs)> |

**Dependency & manifest health (`package.json` / workspace manifests):**

| Package / Manifest | Issue (Dead / Duplicate / Outdated / Misplaced) | Evidence (imports / version) | Concrete cost                     | Next step                        |
| ------------------ | ----------------------------------------------- | ---------------------------- | --------------------------------- | -------------------------------- |
| <pkg@ver>          | <issue>                                         | <grep count + file:line>     | <CVE / bundle weight / peer lock> | <remove / consolidate / upgrade> |

**Architecture findings:**

| ID  | Sev | Tier      | V/E | Title   | Location    | System / maintainability impact | Next step |
| --- | --- | --------- | --- | ------- | ----------- | ------------------------------- | --------- |
| F2  | P1  | CONFIRMED | M/S | <title> | `path:line` | <impact>                        | <action>  |

## Maintainability & system understanding

**Declared rules vs codebase reality:**

| Standard / Doc              | Declared target     | Actual split (census)  | Copy-trap / comprehension risk       |
| --------------------------- | ------------------- | ---------------------- | ------------------------------------ |
| <e.g. framework skill/rule> | <canonical pattern> | <N legacy vs M modern> | <where agents/devs hit legacy first> |

**Maintainability findings:**

| ID  | Sev | Tier   | V/E | Title   | Location    | Maintainability / onboarding impact | Next step |
| --- | --- | ------ | --- | ------- | ----------- | ----------------------------------- | --------- |
| F3  | P2  | LIKELY | M/S | <title> | `path:line` | <mental-model drag / doc drift>     | <action>  |

- **Grouped style note (at most one):** <optional single grouped note, or "None — findings above are structural.">

## Bugs

| ID  | Sev | Tier      | V/E | Title   | Location    | Observed behaviour & impact        | Next step |
| --- | --- | --------- | --- | ------- | ----------- | ---------------------------------- | --------- |
| F4  | P0  | CONFIRMED | H/S | <title> | `path:line` | <observed behaviour + user impact> | <action>  |

## Security

| ID  | Sev | Tier   | V/E | Title   | Source → Sink            | Impact   | Next step |
| --- | --- | ------ | --- | ------- | ------------------------ | -------- | --------- |
| F5  | P1  | LIKELY | H/M | <title> | `src:line` → `sink:line` | <impact> | <action>  |

- **Hardening ideas (no reachable path found):** <brief list or "None.">

## AI-first workflow

| ID  | Sev | Tier      | V/E | Gap   | Command / File               | Cadence cost | Smallest fix |
| --- | --- | --------- | --- | ----- | ---------------------------- | ------------ | ------------ |
| F6  | P2  | CONFIRMED | M/S | <gap> | `path:line` / `<quoted cmd>` | <cost>       | <fix>        |

## Second opinion (one-shot, no debate)

| Claim         | Verdict                   | Reviewer note | Human double-check         |
| ------------- | ------------------------- | ------------- | -------------------------- |
| <P0/P1 title> | Agree / Disagree / Unsure | <one line>    | <what to verify in person> |

**Gap candidates (misses the draft may have):**

| Candidate                    | Location    | Why it matters | Resolution                    |
| ---------------------------- | ----------- | -------------- | ----------------------------- |
| <candidate or "none raised"> | `path:line` | <impact>       | <Added as F# / Left to human> |

- Reviewer: <model/agent, date>. Checked: <top claims spot-checked against code + stack census + surfaces hunted for gaps>.
- Conflicts and gaps are left to the human; draft was changed only for: <none | targeted evidence fix>.

## Appendix — commands and outputs

```text
<paste exact outputs>
```
