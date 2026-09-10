---
name: address-pr-feedback
description: Inspects PR review comments, PR-Agent feedback, and SonarQube quality gate checks, critically evaluates suggestions with strict push-back rules, implements verified fixes, and prevents re-work loops.
---

# Address PR Feedback Skill

Use this skill when instructed to review or resolve feedback on an open pull request in the current branch or worktree.

## Overview & Philosophy

Automated review tools (PR-Agent, SonarQube/SonarCloud) provide high-value catches for security bugs, unhandled nulls, and race conditions. However, they also produce false positives, cosmetic nits, and suggestions that contradict this project's architectural standards.

**Core Directives:**
1. **Never blindly accept bot suggestions.** Evaluate every item against repository conventions.
2. **Push back firmly with technical rationale** on suggestions that violate repo patterns, degrade readability, or represent stylistic bikeshedding.
3. **Prevent re-work loops.** Review in batch, plan upfront, verify locally, commit and push once. Never trigger automated bot re-reviews (`/review`, `/improve`) automatically.

---

## Phase 1: Fetch PR Context & Feedback

Run the following commands using native execution to inspect the current PR and its feedback:

```bash
# 1. Identify PR number and status
gh pr view --json number,url,title,headRefName,baseRefName

# 2. Inspect high-level PR comments (PR-Agent summaries, general feedback)
gh pr view --json comments --jq '.comments[] | {id: .id, author: .author.login, body: .body, createdAt: .createdAt}'

# 3. Inspect inline review comments (PR-Agent suggestions, Sonar findings, human reviews)
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
pr_number="$(gh pr view --json number -q .number)"
gh api "repos/${repo}/pulls/${pr_number}/comments" \
  --jq '.[] | {id: .id, path: .path, line: .line, author: .user.login, body: .body}'

# 4. Check CI and SonarQube status checks
gh pr checks
```

---

## Phase 2: Triage Matrix & Push-Back Criteria

Evaluate each finding against project standards (`AGENTS.md`, `.pr_agent.toml`, and `sonar-project.properties`).

Categorize each finding into one of three buckets:

### 1. ACCEPT & FIX
Implement when the feedback identifies:
- Genuine logic bugs, unhandled exceptions, null/undefined safety issues, or off-by-one errors.
- Unhandled async race conditions or memory/subscription leaks.
- Real Sonar blocker/critical bugs or actual security vulnerabilities.
- Broken test cases or missed edge cases specifically required by the linked issue.

### 2. PUSH BACK
Do NOT implement code changes if the suggestion:
- **Violates Modern Angular 21 conventions**: Suggests legacy decorators (`@Input`, `@Output`) instead of Signals (`input()`, `output()`, `computed()`), or recommends `*ngIf`/`*ngFor` over built-in control flow (`@if`, `@for`).
- **Violates Project UI/Theming rules**: Suggests inline styles or raw SCSS when Tailwind utility classes or theme tokens should be used.
- **Violates Internationalization (i18n)**: Introduces hardcoded user-facing strings or misses the translation pipe/service.
- **Violates Offline-First Architecture**: Suggests synchronous network calls or introduces online-only dependencies in offline workflows.
- **Violates `.pr_agent.toml` rules**: Suggests cosmetic renames, minor formatting adjustments, or stylistic refactoring explicitly excluded by project config.
- **Is a known Sonar false positive / suppressed rule**: For example, `typescript:S2933` (forcing `readonly` on injected services), which is intentionally ignored in `sonar-project.properties`.
- **Introduces unnecessary complexity**: Over-engineering simple utilities into multi-class abstractions.

### 3. ESCALATE
Flag for developer decision if the suggestion:
- Requires breaking public APIs or altering shared contracts across apps.
- Conflicts with undocumented product requirements or requires significant architectural redesign.

---

## Phase 3: Present Triage Plan (Planning Mode)

Before altering code, output a structured triage table to the user:

| # | Source | Location | Recommendation | Decision | Technical Justification |
|---|---|---|---|---|---|
| 1 | PR-Agent | `auth.service.ts:42` | Add null check on token payload | **ACCEPT** | Prevents runtime TypeError when session expires |
| 2 | PR-Agent | `user-card.component.ts:15` | Use `@Input()` decorator | **PUSH BACK** | Project requires Angular 21 Signal inputs (`input.required()`) |
| 3 | SonarQube | `sync.service.ts:88` | Make injected service `readonly` | **PUSH BACK** | Rule `typescript:S2933` is suppressed in `sonar-project.properties` |

*Note: If the user prompt explicitly requested "fix and push immediately", proceed to implementation while still documenting the rationale in your summary.*

---

## Phase 4: Implementation & Local Verification

1. **Apply Accepted Fixes**:
   - Use surgical file modifications to implement only the accepted fixes.
   - Keep comments concise: explain *why* something is done if non-obvious, never leave internal monologue or questions in code comments.

2. **Run Local Verification (Prevent CI Failure Loops)**:
   Never push untested code to GitHub. Run affected checks locally before committing:
   ```bash
   # Run tests for affected projects
   yarn nx affected --target=test

   # Run linter for affected projects
   yarn nx affected --target=lint
   ```
   *(Or run targeted checks for the touched library/app, e.g. `yarn nx test <project-name>`)*.

3. **Verify Build / TypeScript Compilation**:
   Ensure no type errors were introduced by the changes.

---

## Phase 5: Commit, Push & Feedback Response

1. **Commit & Push Once**:
   Batch all verified changes into a single clean commit:
   ```bash
   git add <modified-files>
   git commit -m "fix: address PR review feedback [pr-agent/sonar]"
   git push origin HEAD
   ```

2. **Respond to Review / Push-Backs**:
   - For items pushed back, draft polite, technically sound responses explaining why the recommendation was not adopted.
   - If user requests posting the response directly, use:
     ```bash
     gh pr comment --body "..."
     ```
     Or respond to specific inline review comments:
     ```bash
     repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
     pr_number="$(gh pr view --json number -q .number)"
     gh api "repos/${repo}/pulls/${pr_number}/comments/<comment_id>/replies" \
       -f body="Declined: In accordance with our Angular 21 guidelines, we use Signal inputs rather than @Input decorators."
     ```

3. **Anti-Loop Safety Rule (CRITICAL)**:
   - **DO NOT** post `/review` or `/improve` comments to trigger bot runs automatically.
   - New commits push without re-triggering PR-Agent automatically (`handle_push_trigger: 'false'`). Re-reviews should only be requested manually by the developer when desired.
