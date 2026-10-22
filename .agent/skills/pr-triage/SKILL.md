---
name: 'pr-triage'
description: 'Rapidly audits and triages open pull requests for senior engineers, providing at-a-glance visibility into merge health, blast radius, automated checks, and next actions while caching audits to avoid repetitive reviews.'
---

# PR: Triage Skill - Open Pull Request Auditing & Pipeline Health

Use this skill when auditing the repository's open pull request backlog, prioritizing PRs for senior engineer review, or deciding whose court the ball is in.

## Objectives & Triage Philosophy

The goal of this skill is **not** to conduct an exhaustive line-by-line code review (use the `pr-review` skill for that). Instead, it gives a senior engineer or tech lead **instant situational awareness** across the PR backlog:

1. **Avoid Repetitive Auditing (Smart Caching)**: Use commit-level delta detection to skip re-evaluating unchanged PRs within a 30-minute freshness TTL.
2. **Default Focused Window**: Inspect the **5 most recent** PRs by default, while explicitly cataloging older untriaged PRs in the backlog.
3. **Merge Health & Rebase Readiness**: Detect merge conflicts, measure how many commits a branch is behind `main`/`develop`, and identify if it can be cleanly auto-updated.
4. **Automated Gatekeeper Status**: Verify CI build passes, SonarCloud Quality Gate status, and check whether PR-Agent bot suggestions are fresh or already actioned.
5. **Monorepo Blast Radius**: Measure true cognitive churn (filtering out noise like lockfiles and seed data) and categorize impacted domains (App Shell, Native, Backend, Tools).
6. **Actionable Ownership**: Clearly tag whether each PR is **Ready for Senior Review**, **Blocked on Author**, **Checks Pending**, or in need of rebase.

---

## Phase 1: Execution & Cache-Aware Ingestion

Run the project-native triage script from the repository root:

```bash
# Triage the default 5 most recent active PRs:
.agent/skills/pr-triage/scripts/triage-prs.sh

# Or triage specific PRs:
.agent/skills/pr-triage/scripts/triage-prs.sh --prs 810,804

# Or triage all open PRs:
.agent/skills/pr-triage/scripts/triage-prs.sh --all

# Or customize the cache TTL (default 30 minutes):
.agent/skills/pr-triage/scripts/triage-prs.sh --ttl 15

# Or force refresh all cached PRs disregarding previous cache:
.agent/skills/pr-triage/scripts/triage-prs.sh --refresh
```

### Delta & Cache Management (`.agent/pr-triage-cache.json`)

The script records each triaged PR's `headSha` (commit hash), audit timestamp, and verdict:

- **`[UNCHANGED]`**: If a PR's `headSha` has not changed and the cached record is within the TTL window (< 30 min, and not previously pending), the triage outputs the cached assessment in `< 100ms` without making redundant API calls or re-reading diffs.
- **`[EXPIRED / STALE]`**: If a cached record exceeds the TTL or was in a `⏳ Checks Pending` state, it is automatically re-evaluated live.
- **`[UPDATED]`**: If new commits were pushed (`headSha` changed), a fresh evaluation runs automatically.
- **`[NEW]`**: First time encountering the PR.

---

## Phase 2: Senior Engineer Assessment Heuristics

### 1. Merge Health & Conflicts

For each PR, inspect:
- **`mergeable`**:
  - `true`: Branch can merge without conflicts.
  - `false` / `dirty`: Branch has merge conflicts with its base. Flag as **`🔴 Conflicts`**.
- **`behind_by`**: Number of commits the PR branch is behind target base (`main` or `develop`).
- **Auto-Update Capability**: If `mergeable: true` and `behind_by > 0`, GitHub can update the branch automatically:
  ```bash
  gh api repos/:owner/:repo/pulls/<PR_NUMBER>/update-branch -X PUT
  ```

### 2. Automated Gatekeepers & Bot Freshness

- **CI Build**: Workflow `Build Test` must pass.
- **SonarCloud Quality Gate**: Check status run and bot comments for `Quality Gate Failed`.
- **PR-Agent Review Freshness**:
  - PR-Agent stamps suggestions with a commit SHA: `<!-- <commit_sha> -->`.
  - If current branch `HEAD` matches `<commit_sha>`, suggestions are **Fresh** and awaiting author action.
  - If current branch `HEAD` is newer than `<commit_sha>`, commits were pushed after the bot review; verify if the suggestions were addressed.

### 3. Noise-Filtered Blast Radius & Sizing

Do not judge PR size by raw additions/deletions. Filter out non-cognitive churn:
- **Noise Exclusions**: `*.spec.ts`, `yarn.lock`, `deno.lock`, `apps/picsa-server/supabase/data/*.csv`, and generated files (`*.generated.ts`, `database.types.ts`).
- **Domain Footprint**:
  - 🔴 **High Blast Radius**: `Super App Shell` (`apps/picsa-apps/app/`), `Mobile Native` (`apps/picsa-apps/app-native/`), `Supabase / Backend` (`apps/picsa-server/`).
  - 🟡 **Medium Blast Radius**: `Pure Models` (`libs/models/`), `Pure Utils` (`libs/utils/`), `Shared Libs`.
  - 🟢 **Isolated**: `Domain Tools` (`apps/picsa-tools/<tool>/`), `Admin Dashboard`, `Docs & Tooling`.
- **Effort Sizing**:
  - 🟢 **S (< 15 min review)**: `< 100 net lines`, isolated domain, all green.
  - 🟡 **M (15–30 min review)**: `100–300 lines`, single component/service.
  - 🔴 **L (30–60 min review)**: `300–600 lines` or cross-cutting features.
  - 🟣 **XL (> 60 min / Architecture Session)**: `> 600 lines` or touching DB + Shell + Libs. Candidate for branch splitting.

### 4. Actionable Verdict Taxonomy

| Verdict | Criteria | Action Required |
| :--- | :--- | :--- |
| **🟢 READY_FOR_REVIEW** | CI passing, Sonar passed, no conflicts, bot suggestions actioned, not draft | Senior engineer can review and merge. |
| **🟡 BLOCKED_ON_AUTHOR** | Build test failing, SonarCloud failing, or unaddressed bot suggestions | Author must resolve failures before senior review. |
| **🟡 PENDING_BOT_FIXES** | PR-Agent suggestions pending on current commit | Author should review suggestions via `pr-address-feedback`. |
| **⏳ CHECKS_PENDING** | Automated CI or analysis checks are still in progress | Wait for CI workflows to finish. |
| **🔴 CONFLICTED** | Merge conflicts detected (`mergeable: false`) | Author must rebase or merge target branch. |
| **🔵 DRAFT** | `isDraft: true` | Work in progress; no review action required. |

---

## Phase 3: Output Format & Dashboard Layout

Always structure the output in three clear sections:

````markdown
# 🔍 Open PR Triage Dashboard (5 PRs evaluated)
*14 total open PRs in `e-picsa/picsa-apps` | 2 unchanged (cached), 3 evaluated live*

| PR | Title | Author | Size & Blast Radius | CI / Quality | Merge Health | Verdict / Next Step |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [#810](https://...) | [FEATURE] In-app download... | @author | 🟡 M (+280/-6)<br><sub>Mobile Native, Shared Libs</sub> | ✅ All CI Green | 🟡 Behind (21) | **🟢 Ready for Review** |
| [#804](https://...) | feat(climate): recommend... | @author | 🟢 S (+45/-10)<br><sub>Tool (climate-tool)</sub> | ❌ Sonar failed | 🟢 Clean | **🟡 Blocked on Author** |
| [#792](https://...) | feat(screenshot): integrate... | @author | 🟡 M (+264/-30)<br><sub>Admin Dashboard</sub> | ✅ All CI Green | 🟢 Up-to-date | **🟢 Ready for Review** <sub>[cached]</sub> |

---

## 🔎 Detailed PR Breakdown & Action Items

### [PR #810: [FEATURE] In-app download and share for Android users](https://...)
- **Author**: @author | **Branch**: `696-android-...` → `main` | **Updated**: 6d ago
- **Blast Radius**: 🟡 M (~15-30m) · Touches: **Mobile Native • Shared Libs** (6 files changed)
- **Merge Health**: Behind main by 21 commits. Can cleanly update-branch.
  > 💡 *Quick branch update command*: `gh api repos/e-picsa/picsa-apps/pulls/810/update-branch -X PUT`
- **CI & Quality**: ✅ All CI Green (Build Test, SonarCloud, Labels)
- **PR-Agent Review**: Code suggestions posted (Fresh on latest commit; author fixed APK memory issue).
- **Recommended Action**: **Ready for senior review. Use `pr-review` to inspect native storage hooks.**

---

### 📋 Untriaged Open PR Backlog (9 older PRs not evaluated)

- **[#729](https://...)**: Custom crop and activity cards (@Pamella014, updated 1mo ago)
- **[#728](https://...)**: feat(feedback): add admin dashboard module (@OchiengPaul442, updated 1mo ago)
- **[#680](https://...)**: [FEATURE] Forecasts manual update (@author, updated 2mo ago)

> **💡 Next Steps:**
> - To review any PR in depth, prompt: `"Review PR #<number> using pr-review"`
> - To triage backlog PRs, prompt: `"Triage PRs #729, #728"` or `"Triage top 10 PRs"`
> - To force refresh all PRs disregarding cache, prompt: `"Triage PRs --refresh"`
````

---

## Phase 4: Next-Step Skill Handoffs

- **To Review in Detail**: Run the **`pr-review`** skill for full architectural, Signal, and Angular 21 maintainability review.
- **To Help Author Fix Issues**: Run the **`pr-address-feedback`** skill in the PR's worktree to resolve SonarCloud or PR-Agent feedback.
