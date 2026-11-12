# Audit Report — <repo name>

> Generated with `.agents/skills/repo-audit/SKILL.md`. Do not commit unless asked.
> Date: <ISO date>. Base commit: <SHA>. Scope: <full | focused on X>.
> Context: `repo-context.md` <filled | partial | missing — assumptions flagged>.
> Previous audit: <date + commit | none>.
> Second opinion: <reviewer model/agent, claims checked + gaps hunted | skipped + reason>.

## Top summary

**Strengths (3–7):**

- <strength with `path:line` evidence>

**Priority issues (ordered by value relative to effort):**

1. [P0/P1] <title> — <one-line user impact> (`path:line`, `CONFIRMED|LIKELY|SUSPECTED`, first seen <date|this audit>)

**Highest-leverage recommendation:**

- <single action, owner, and why it unlocks the rest>

## Scope and coverage

- Dirs read: <list>. Skipped: <list with reason>.
- Commands run: <e.g. `npm run build`, `npm run lint` + outcome>.
- Issues mined (read-only): <`gh issue list` top labels/complaints, or why skipped>.
- Assumptions: <what was inferred from missing context; archetype guesses flagged here, never downgrading verified bugs>.

## Delta since last audit

| Prior finding  | Status                                    | Evidence                                  |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| <title + date> | Fixed / Still open / Invalid / Superseded | <`path:line` or command output, one line> |

- New in this audit: <count + titles>.
- If no previous audit: state `No previous audit — this is the baseline.`

## User impact and functionality

Archetypes (goal, constraint, what "broken" means):

- <archetype 1> — <goal>; <constraint>; broken means <outcome>.
- <archetype 2> — <goal>; <constraint>; broken means <outcome>.

Gap findings (missing, painful, or mismatched — not just broken):

- F1 [P1, LIKELY, M/S] <title> — `path:line`, <who it hurts and how>, next step: <action>.

## Architecture

- F2 [P1, CONFIRMED, M/S] <finding> — `path:line`, impact, next step.

## Code quality

- F3 [P2, LIKELY, L/S] <finding> — separation, duplication, over/under-engineering. One grouped style note at most.

## Bugs

- F4 [P0, CONFIRMED, H/S] <title> — `path:line`, observed behaviour, impact, next step.

## Security

- F5 [P1, LIKELY, H/M] <title> — source `path:line` → sink `path:line`, impact, next step. Or "no reachable path found."

## AI-first workflow

- F6 [P2, CONFIRMED, M/S] <gap> — first failing command quoted, cadence cost, smallest fix.

## Roadmap (fixed schema — the table is the single source)

Value H/M/L: H removes a crash, data loss, or blocker for a primary archetype
or a major maintenance burden; M is clear pain for a subset of users or
meaningful toil removed; L is nice-to-have with limited reach. Effort S/M/L
(never days): S is likely one file, covered by automated tests, easy to
review; M is a few files or needs extra test/review care; L touches many
files or needs heavy human oversight.

| ID  | Type             | Title                                   | Beneficiary   | Value | Effort | Depends on | Done when                     | From |
| --- | ---------------- | --------------------------------------- | ------------- | ----- | ------ | ---------- | ----------------------------- | ---- |
| R0  | Example (delete) | Fix N+1 query in `src/api/users.ts:112` | API consumers | H     | S      | none       | Single query, covered by test | F0   |

**Quick wins:** R1

**Strategic:** R2

Strategic notes:

- R2 — what breaks today: <x>; what it unblocks: <y>; cost of deferral: <z>.

### Task prompts

- R1: "<one-line agent instruction naming the file, the change, and the finding ID>".
- R2: "<scoped brief an agent can execute without re-reading the report>".

## Second opinion (one-shot, no debate)

| Claim         | Verdict               | Reviewer note | Human double-check         |
| ------------- | --------------------- | ------------- | -------------------------- |
| <P0/P1 title> | Agree/Disagree/Unsure | <one line>    | <what to verify in person> |

**Gap candidates (misses the draft may have):**

- <candidate with `path:line` + why it matters, or "none raised">

- Reviewer: <model/agent, date>. Checked: <top claims spot-checked against code + surfaces hunted for gaps>.
- Conflicts and gaps are left to the human; draft was changed only for: <none | one targeted evidence fix>.

## Appendix — commands and outputs

```text
<paste exact outputs>
```
