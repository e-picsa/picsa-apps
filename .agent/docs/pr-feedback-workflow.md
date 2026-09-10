# Automated PR Feedback & Agent Review Workflows

In modern GitHub workflows, open pull requests regularly receive automated code feedback from tools like **PR-Agent** and **SonarQube / SonarCloud**. When using **T3 Code** or AI agent threads to manage worktrees and pull requests, you can leverage the dedicated `address-pr-feedback` skill to quickly inspect feedback, implement validated fixes, and push back on inappropriate suggestions without getting stuck in re-work loops.

---

## The Challenge: Why Push-Back is Mandatory

Automated review tools are great at flagging subtle bugs, concurrency issues, and unhandled nulls. However, generic bots have notable weaknesses:

1. **Outdated Framework Knowledge:** Bots may suggest Angular 16-style `@Input()` / `@Output()` decorators or `*ngIf` structural directives instead of Angular 21 Signals (`input()`, `output()`) and native control flow (`@if`, `@for`).
2. **Ignorance of Monorepo Architecture:** Bots might recommend raw SCSS instead of Tailwind CSS, direct REST calls instead of offline-first RxDB/Dexie synchronization, or hardcoded strings that bypass our i18n translation system.
3. **Cosmetic Nits & Bikeshedding:** Bots often suggest variable renaming or arbitrary aesthetic refactors that violate our [.pr_agent.toml](file:///.pr_agent.toml) guidelines.
4. **False Positives on Suppressed Rules:** SonarQube frequently flags rules we explicitly ignore in [sonar-project.properties](file:///sonar-project.properties) (such as `typescript:S2933` regarding `readonly` on injected services).

> [!WARNING]
> **Critical Rule:** Never let an AI assistant blindly accept all bot suggestions. Every suggestion must be triaged against our architectural standards. If a suggestion violates repo rules, the assistant **must push back** with technical justification rather than changing code.

---

## The `address-pr-feedback` Skill

The skill is stored at `.agent/skills/address-pr-feedback/SKILL.md` (and symlinked to `.agents/skills` and `.gemini/skills`).

It enforces a 5-phase structured lifecycle:

1. **Inspect PR & Fetch Comments (`gh` CLI)**: Queries PR metadata, PR comments, inline review suggestions, and CI checks.
2. **Triage Matrix**: Classifies each finding into `ACCEPT & FIX`, `PUSH BACK`, or `ESCALATE`.
3. **Present Plan**: Adheres to Planning Mode by providing a structured decision table before touching code.
4. **Local Fixes & Verification**: Implements accepted fixes surgically and verifies locally (`yarn nx affected --target=lint` and `yarn nx affected --target=test`).
5. **Batch Commit, Push & Post Responses**: Pushes a single batched commit, provides polite, technically sound reply comments for rejected items, and reminds the user of the manual re-review procedure.

### The Triage Decision Matrix

| Decision | When to Apply | What the Agent Does |
| :--- | :--- | :--- |
| **ACCEPT & FIX** | Concrete bugs, null safety issues, unhandled errors, broken tests, real security risks, or failing Sonar Quality Gate blockers. | Edits the code surgically, adds tests if needed, and marks the item resolved. |
| **PUSH BACK** | • Violates Angular 21 Signals / Control Flow conventions.<br/>• Uses raw SCSS or inline styles instead of Tailwind CSS.<br/>• Introduces hardcoded text instead of i18n translation.<br/>• Breaches offline-first principles.<br/>• Cosmetic or stylistic nits excluded by `.pr_agent.toml`.<br/>• Suppressed rules in `sonar-project.properties` (e.g. `S2933`). | Refuses code changes and drafts a concise, technical explanation citing repo policy. |
| **ESCALATE** | High-risk architectural modifications, breaking public APIs, or ambiguous trade-offs. | Flags the decision to the developer before proceeding. |

---

## Preventing Re-Work Loops

A common failure mode in AI-driven PR workflows is the **re-work loop**:
1. Bot comments on PR.
2. AI applies a fix and pushes.
3. CI triggers a new bot run.
4. Bot comments on the new commit with slightly different suggestions.
5. AI applies new changes and pushes again.

### How Our Stack Prevents Loops

1. **PR-Agent Workflow Configuration:**  
   In [.github/workflows/pr-agent.yml](file:///.github/workflows/pr-agent.yml), `github_action_config.handle_push_trigger` is set to `'false'`. Pushing commits will **not** trigger a new automated review. Automated reviews only execute on the initial PR open or when manually triggered via a `/review` or `/improve` comment.
2. **Agent Self-Restraint:**  
   The `address-pr-feedback` skill explicitly forbids the model from automatically posting `/review` or `/improve` comments. Re-review triggers remain in developer hands.
3. **Local-First Verification Gate:**  
   The agent must run `yarn nx affected --target=lint` and `yarn nx affected --target=test` locally before pushing to avoid triggering CI test failure loops.
4. **Single Batch Push:**  
   All accepted fixes are batched into a single commit (`fix: address PR review feedback [pr-agent/sonar]`) rather than pushed incrementally.
5. **Mandatory User Notice on Manual Re-Review:**  
   After completing fixes or pushes, the agent must notify the developer that PR-Agent will not re-run on its own. To get an updated review, the developer must manually comment `/review` on GitHub and re-invoke the skill once the bot finishes.

---

## How to Use the Skill in T3 Code

When you open a PR in GitHub and automated feedback arrives, switch to your T3 Code thread on that branch and use one of the following prompt patterns:

### 1. Triage & Review Plan (Recommended First Step)
> *"Use the `address-pr-feedback` skill to inspect the review comments and CI checks on this PR. Present your triage table with push-back rationale without modifying code yet."*

The model will query GitHub CLI (`gh`), format a clear table of all comments, and explain which items should be accepted, pushed back on, or escalated.

### 2. Full Resolve & Verified Push
> *"Please run `address-pr-feedback` on this branch. Implement verified fixes for valid issues, push back on invalid bot recommendations, run local tests, and push the commit."*

The model will:
1. Fetch PR comments and checks.
2. Apply changes for accepted items only.
3. Run `yarn nx affected --target=lint` and `yarn nx affected --target=test`.
4. Create a single commit and push to the remote branch.
5. Provide the drafted reply comments for pushed-back items.
6. Provide the reminder notice for manually triggering `/review`.

### 3. Targeted Push-Back
> *"Look at comment #3 from PR-Agent suggesting we switch this to an `@Input()`. Post a response explaining our project's Angular 21 Signal convention."*

The model will formulate an appropriate response referencing the project's [Angular Best Practices](file:///.agent/skills/angular/SKILL.md) and post it directly to the comment thread using GitHub CLI.

---

## Helpful CLI Commands Reference

If you need to inspect or interact with the PR manually, the skill utilizes these commands:

```bash
# View PR info, title, and branch
gh pr view --json number,url,title,headRefName

# View PR-level comments (e.g. PR-Agent summary table)
gh pr view --json comments --jq '.comments[] | {author: .author.login, body: .body}'

# View inline line-level review comments
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
pr_number="$(gh pr view --json number -q .number)"
gh api "repos/${repo}/pulls/${pr_number}/comments" \
  --jq '.[] | {id: .id, path: .path, line: .line, author: .user.login, body: .body}'

# Check status of SonarCloud / GitHub Actions checks
gh pr checks

# Reply directly to an inline review comment
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
pr_number="$(gh pr view --json number -q .number)"
gh api "repos/${repo}/pulls/${pr_number}/comments/<comment_id>/replies" \
  -f body="Declined: Per our Angular 21 conventions, we use signal inputs rather than @Input decorators."
```
