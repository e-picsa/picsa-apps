---
name: repo-audit
description: Performs structured repository audits separating architecture, code quality, bugs, security, and AI-first workflow readiness, with optional one-shot cross-model second opinion. Use when asked to audit a repo, assess codebase health or modernisation needs, or produce a prioritised audit report grounded in user impact.
---

# Repo Audit

Structured, evidence-backed audit of a repository. Diagnosis-first: observe and
prioritise, do not fix code in this pass unless explicitly asked.

## When to use

- User asks to audit, review health, assess modernisation, or produce an audit report.
- User names a whole repo or top-level area (plugin, app, service) for evaluation.

## When not to use

- Single-file debug, PR review, or incident response. Use a narrower workflow instead.
- User asks for implementation. Say so and do not run the audit implicitly.

## Step 0 — Load per-repo context (mandatory)

1. Read `.agents/skills/repo-audit/repo-context.md` if it exists. It is
   repo-owned and takes precedence over generic assumptions.
2. Note in particular: project summary, user archetypes, tech focus areas,
   scope overrides, audit file location, out-of-scope paths, and any
   second-opinion preference.
3. If the file is missing or has unfilled TODOs, infer users and focus from
   `readme.md`, `package.json`, docs, and code. Flag only the user-impact
   inferences as `SUSPECTED` (archetype assumptions in Scope and coverage).
   This never downgrades a technically verified finding: a bug backed by code
   read plus a run, test, or typecheck stays `CONFIRMED`. Never invent user
   archetypes silently.
4. Respect any `## Overrides` section: a repo may skip, emphasise, or replace
   specific audit dimensions. Overrides win over this skill's defaults.
5. Check for a previous audit file: default `AUDIT.md` at repo root, or the path
   named in `repo-context.md` or the user prompt. If one exists, read it as the
   baseline and record its date and base commit for the delta in phase 6 (Synthesise).
6. Protect the baseline before overwriting it: `git status` only proves the
   baseline was committed if the audit file is clean. Before writing a new
   report over an existing audit file, check `git status --porcelain` on that
   path. If it has uncommitted changes, warn the user and stop — do not
   overwrite. committed history is what makes a single-file audit safe.

## Step 1 — Confirm second-opinion reviewer (mandatory gate)

1. Check the user prompt and `repo-context.md` for a named reviewer. If the
   prompt already names a second-opinion model or agent, use it with no further
   asking.
2. Otherwise, before any audit work, ask the user: whether to run a one-shot
   cross-model second opinion, and if so which agent or model family to use.
   Propose a family different from the one producing the audit (the point is
   independent judgment). Do not hardcode model version IDs — let the user pick
   from currently available models, or record a standing preference in
   `repo-context.md`.
3. Do not spawn a reviewer without explicit agreement. If the user declines, or
   the harness has no subagent mechanism, skip the second opinion and note this
   in the report. Never treat a skipped second opinion as agreement.
4. Non-interactive fallback: if running where user input cannot be gathered
   (scheduled task, CI job, background agent, no TTY), do not block waiting.
   Proceed with the author pass, honour any standing preference in
   `repo-context.md`, and record the second opinion as skipped with the reason
   (e.g. non-interactive run).
5. Harness-agnostic invocation: use native subagent model selection when the
   harness supports it, else an alternate agent CLI when available, else record
   as skipped with the reason. Never invent a cross-model mechanism; state how
   the reviewer was (or was not) invoked.

## Workflow

Run phases in order. Keep each phase evidence-led; cite `path:line` for every
claim. Maintain a running findings ledger in `.agents/tmp/audit-ledger.md`
(IDs F1, F2… with `path:line`, tier, value, effort; git-ignored, deleted when
the audit is done); synthesis reads the ledger file, not memory. On large
repos this ledger file is what keeps later phases honest — do not rely on
recalled file contents. When fanning out, each subagent writes its own file
(`.agents/tmp/audit-ledger-<dimension>.md`) so parallel writers never clobber
each other; the lead agent merges them into the main ledger at synthesis.

1. **Orient** — List top-level dirs, entry points, languages, package manager,
   and how to build/test/lint. Bound deep reads to stay in context: prioritise
   public API entry points, lifecycle and API/IPC boundaries (e.g. plugin
   bridges in a Capacitor repo, route handlers in a service, commands in a
   CLI), and recent high-churn areas (default `git log --stat -20`; on larger
   repos optionally per-file frequency over ~6 months). Skim or skip the rest
   and record what was read vs skipped under Scope and coverage (coverage
   proof). Optionally fan out read-only exploration subagents per dimension on
   large repos (each writing its own ledger file); default is a single pass.
2. **Architecture** — Judge whether structure helps contributors ship safely.
   Prefer boring, explicit boundaries. Check: stack currency against current
   stable releases as of today (state the date checked and versions observed;
   flag only drift with concrete cost such as EOL, broken installs, or blocked
   APIs); module boundaries and API contracts; separation vs leakage (name
   the file where the boundary breaks); over-engineering (one-caller
   abstractions to delete) vs under-engineering (duplicated lifecycle handling,
   weakly-typed boundary APIs to consolidate — e.g. stringly-typed bridge APIs
   in a plugin repo); dependencies, lockfiles, and whether upgrades are tested
   in CI. Stack-specific checks (e.g. bridge teardown, media codecs,
   platform parity) belong in `repo-context.md` Tech focus, not as assumed
   defaults.
3. **User impact and functionality** — Identify consumers from `repo-context.md`
   first, else infer from README/docs/examples. Record each archetype as goal,
   constraint, and what "broken" means. Then actively hunt what is missing or
   painful, not just what is broken: compare documented capabilities and
   examples against actual implementation, note rough API/DX edges and confusing
   defaults, flag docs or examples that do not match behaviour, surface failure
   UX (what the user actually sees), and cluster `TODO`/`FIXME` and skipped
   tests on user-facing paths. When `gh` is available, mine open issues
   read-only (`gh issue list`, labels, most-commented) for recurring complaints
   and requested features; never post or mutate. Log all candidate findings to
   the ledger with value and effort left blank for now — do not rank or build
   roadmap items here. Ranking happens only in Synthesise once bugs, security,
   and AI workflow have been examined. Drop changes with no named beneficiary.
   Scales (applied at synthesis, never as time estimates — AI cadence makes
   days meaningless): value H = removes a crash, data loss, or blocker for a
   primary archetype or a major maintenance burden; M = clear pain for a
   subset of users or meaningful toil removed; L = nice-to-have with limited
   reach. Effort S = likely one file, covered by automated tests, easy to
   review; M = a few files or needs extra test/review care; L = many files
   touched or needs heavy human oversight (uncovered paths, native bridges,
   migrations). Severity (`P0` fix now, `P1` next, `P2` soon) is the urgency
   axis and does not replace the value/effort ranking.
4. **Bugs and security** — Assume inputs are hostile and lifecycle is chaotic.
   Check resource lifecycle and cleanup (creation, teardown, listener
   removal — e.g. pause/resume/destroy in a mobile plugin, connection handling
   in a service), null-safety and optionals at API boundaries, input validation,
   error paths (permission denial, missing capability such as a codec, offline),
   and environment parity (same method diverging across targets without docs —
   e.g. web vs native in a plugin repo). For security, quote source → sink
   (`path:line` each); no reachable path means hardening idea, not a finding.
   Never audit `dist/`, `build/`, lockfiles, or vendored code as source.
5. **AI-first workflow** — The repo should let an agent go from fresh checkout
   to safe PR without guessing. Check: short `AGENTS.md` with install, verify,
   format, and PR steps; reproducible setup; fast `lint`/`typecheck`/focused
   tests with copy-paste commands; CI parity with local verify scripts; README
   quickstart that works verbatim; generated API docs, not hand-edited drift.
   Safety bounds for setup: prefer sandbox, container, or isolated worktree
   where available; never run deploy, publish, or migration commands; use no
   real credentials; ask before anything that is not read-only or local; check
   `git status` before and after and report any workspace dirt. Quote the first
   failing command where feasible.
6. **Synthesise** — Merge any per-dimension ledger files into the main
   ledger, then rank it by value relative to effort (value H/M/L
   vs effort S/M/L, severity P0/P1/P2 as urgency only). If a previous
   audit exists, reconcile each prior P0/P1 as Fixed, Still open, Invalid
   (with reason), or Superseded, then add newly identified findings with
   first-seen date. Write the draft report from
   [report template](assets/audit-report-template.md) with an ISO date and base
   commit in the header so the next audit can build on this one. Every roadmap
   item (quick win and strategic) carries an ID, beneficiary, value (H/M/L),
   effort (S/M/L, files-impacted and review/test burden — never days),
   dependencies, done-when acceptance, one-line handoff Task prompt, and source
   finding refs so the next agent can execute without re-reading the report.
   Delete the ledger file when the report is written.

## Step 2 — One-shot second opinion (no back-and-forth)

1. After the draft report is written, spawn exactly one reviewer subagent using
   the agreed reviewer from Step 1, on a different model family from the audit
   author where possible. One pass only.
2. Give the reviewer: `repo-context.md`, the draft report path, the previous
   audit if one exists, and repo access — the draft is context, not a verdict.
   Brief: (a) independently sweep the top 5 high-risk surfaces from the
   Orient coverage list (or up to 5 files) before opening the draft; (b)
   spot-check the top 3–5 P0/P1 claims against
   the code (read the cited files, do not just re-read the report) with Agree /
   Disagree / Unsure per claim and one-line reasoning; (c) hunt for gaps the
   draft missed (unexamined surfaces, wrong severity, invalid prior-audit
   carryover) and name each as a candidate finding with `path:line`; (d) list
   what a human should double-check in person.
3. Do not debate the reviewer, do not re-prompt for revisions, and do not run
   a second round. Incorporate the verdict as a `Second opinion` appendix
   table in the report, including any gap candidates. Make at most one targeted
   correction to the draft if the reviewer exposes a clear evidence error;
   otherwise leave conflicts and gaps to the human. Record reviewer model,
   scope checked, and any skipped checks.

## Evidence rules (non-negotiable)

- Inspect files directly before synthesising. Never repeat prior claims unverified.
- Every finding needs: location (`path:line` or command output), severity
  (`P0` fix now, `P1` next, `P2` soon), verification tier (`CONFIRMED`,
  `LIKELY`, `SUSPECTED`), value (H/M/L) and effort (S/M/L, files-impacted
  plus review/test burden — never time estimates), user impact, and next step. No
  tier inflation. `CONFIRMED` is per finding type: a failing run, test, or
  typecheck; or a deterministic trace with `path:line` at every hop and no
  runtime ambiguity; or structural exhaustion (grep or reference count cited).
  Otherwise use `LIKELY` or `SUSPECTED`. Ephemeral read-only repro commands
  (e.g. `node -e`, `python -c`) are allowed; file edits to build a repro are
  not — that is implementation, save it for the roadmap Task prompt.
- Run cheap verification where feasible (`build`, `lint`, `typecheck`, focused
  tests) within the safety bounds in phase 5. Quote failures verbatim. If a
  check cannot run, say why.
- Separate observations (what the code does) from judgments (whether it matters).
- Prefer one concrete example over a general warning. No "follow best practices"
  without naming the file, the violation, and the fix.

## Output contract

- Reply in chat with a top-level summary: 3–7 strengths, 3–7 priority issues
  ordered by value relative to effort, the single highest-leverage
  recommendation, the delta since the previous audit (fixed / still open /
  invalid / new counts), and the second-opinion verdict in one line per top
  claim plus any gap candidates (or why it was skipped).
- Also write a full Markdown report (default: `AUDIT.md` at repo root, or the
  path in `repo-context.md` or the user prompt) using the report template.
  Header carries ISO date, base commit SHA, scope, and previous-audit date.
  Structure: summary, scope and coverage, delta since last audit, user impact
  and functionality, architecture, code quality, bugs, security, AI workflow,
  prioritised roadmap, second opinion, appendix with exact commands/outputs.
  Finding lines carry their ledger IDs (e.g. `F3 [P1, CONFIRMED, H/S]`) so
  roadmap `From` refs and the next audit's delta stay traceable after the
  ledger file is deleted. Roadmap items use the fixed
  schema (ID, beneficiary, effort, dependencies, done-when, task prompt,
  finding refs, value, and files-impacted effort). A single `AUDIT.md` always
  reflects the latest audit; committed git history preserves prior versions,
  so overwrite rather than appending or versioning filenames. If the existing
  audit file has uncommitted changes, warn and stop instead of overwriting.
- Do not commit the report unless the user explicitly asks. Say where it was written.
- If `repo-context.md` was missing or TODO, offer a draft (archetypes, focus,
  second-opinion preference, audit path) for human approval so the next audit
  starts frictionlessly. Do not overwrite an existing context file unasked.
- If scope was limited or context was missing, state limits and assumptions up front.

## Anti-patterns

- Do not fix code during the audit. Diagnose, rank, propose.
- Do not quote effort in days or hours. State files likely impacted and
  review/test burden (covered vs needs human oversight) instead.
- Do not propose rewrites or migrations without quantified user benefit and cost.
- Do not run reviewer rounds more than once or let agents debate. Human resolves.
- Do not create versioned audit filenames or append dated sections. Overwrite the
  single audit file with a fresh dated report containing a delta section.
- Do not pad with low-signal style nits. One grouped style note at most.
