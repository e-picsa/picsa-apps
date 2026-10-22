#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return null;
  }
}

function runGhJson(cmd) {
  const out = runCmd(cmd);
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 5,
    prs: null,
    all: false,
    refresh: false,
    json: false,
    cacheTtlMinutes: 30, // Default 30 minute TTL for cached PR records
    cacheFile: path.resolve(process.cwd(), '.agent/pr-triage-cache.json'),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i], 10) || 5;
    } else if (arg === '--prs' && args[i + 1]) {
      options.prs = args[++i].split(',').map((p) => parseInt(p.trim().replace(/^#/, ''), 10));
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--refresh' || arg === '--no-cache') {
      options.refresh = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if ((arg === '--ttl' || arg === '--cache-ttl') && args[i + 1]) {
      options.cacheTtlMinutes = parseInt(args[++i], 10) || 30;
    } else if (arg === '--cache-file' && args[i + 1]) {
      options.cacheFile = path.resolve(process.cwd(), args[++i]);
    }
  }
  return options;
}

function loadCache(cachePath) {
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
  } catch {}
  return { lastRun: null, prs: {} };
}

function saveCache(cachePath, cache) {
  try {
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    // Cache write error should not fail triage
  }
}

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function classifyDomains(files) {
  const domains = new Set();
  for (const f of files) {
    const p = f.path;
    if (p.startsWith('apps/picsa-apps/app/')) domains.add('Super App Shell');
    else if (p.startsWith('apps/picsa-apps/app-native/')) domains.add('Mobile Native');
    else if (p.startsWith('apps/picsa-apps/dashboard/')) domains.add('Admin Dashboard');
    else if (p.startsWith('apps/picsa-tools/')) {
      const match = p.match(/^apps\/picsa-tools\/([^/]+)/);
      domains.add(match ? `Tool (${match[1]})` : 'Domain Tool');
    } else if (p.startsWith('apps/picsa-server/')) domains.add('Supabase / Backend');
    else if (p.startsWith('libs/models/')) domains.add('Pure Models');
    else if (p.startsWith('libs/utils/')) domains.add('Pure Utils');
    else if (p.startsWith('libs/theme/') || p.startsWith('libs/components/')) domains.add('UI & Theme');
    else if (p.startsWith('libs/')) domains.add('Shared Libs');
    else if (p.startsWith('.agent/') || p.endsWith('.md')) domains.add('Docs & Tooling');
    else if (p.includes('package.json') || p.includes('tsconfig') || p.includes('nx.json')) domains.add('Workspace Config');
  }
  return Array.from(domains);
}

function calculateSize(files) {
  let netLines = 0;
  let codeFilesCount = 0;

  for (const f of files) {
    const p = f.path;
    const isNoise =
      p.endsWith('.lock') ||
      p.endsWith('yarn.lock') ||
      p.endsWith('deno.lock') ||
      p.endsWith('.csv') ||
      p.endsWith('.spec.ts') ||
      p.includes('.generated.');

    if (!isNoise) {
      netLines += (f.additions || 0) + (f.deletions || 0);
      codeFilesCount++;
    }
  }

  let label = '🟢 S';
  let estMinutes = '10-15m';

  if (netLines > 600 || codeFilesCount > 20) {
    label = '🟣 XL';
    estMinutes = '> 60m (Arch/Split)';
  } else if (netLines > 300 || codeFilesCount > 10) {
    label = '🔴 L';
    estMinutes = '30-60m';
  } else if (netLines > 100 || codeFilesCount > 3) {
    label = '🟡 M';
    estMinutes = '15-30m';
  }

  return { label, netLines, codeFilesCount, estMinutes };
}

function evaluateChecks(checks) {
  if (!checks || checks.length === 0) {
    return { status: 'NO_CHECKS', badge: '⚪ No CI', failures: [] };
  }

  const failures = [];
  let pendingCount = 0;
  let hasBuild = false;
  let hasSonar = false;

  for (const c of checks) {
    const name = c.name || c.workflowName || 'Check';
    const conclusion = c.conclusion || c.status;
    if (conclusion === 'FAILURE' || conclusion === 'TIMED_OUT' || conclusion === 'CANCELLED') {
      failures.push(name);
    } else if (conclusion === 'IN_PROGRESS' || conclusion === 'QUEUED') {
      pendingCount++;
    }
    if (name.toLowerCase().includes('build')) hasBuild = true;
    if (name.toLowerCase().includes('sonar')) hasSonar = true;
  }

  if (failures.length > 0) {
    return {
      status: 'FAILURE',
      badge: `❌ ${failures.join(', ')} failed`,
      failures,
    };
  }
  if (pendingCount > 0) {
    return { status: 'PENDING', badge: '⏳ Checks Pending', failures: [] };
  }
  return { status: 'SUCCESS', badge: '✅ All CI Green', failures: [] };
}

function evaluateBotReview(comments, headSha) {
  let hasSuggestions = false;
  let latestSuggestionSha = null;
  let hasSonarFailureComment = false;

  if (!comments) return { hasSuggestions, isFresh: true, hasSonarFailureComment };

  for (const c of comments) {
    const author = c.author?.login || '';
    const body = c.body || '';

    if (author === 'sonarqubecloud' && body.includes('Quality Gate Failed')) {
      hasSonarFailureComment = true;
    }

    if (body.includes('pr-agent:improve:summary') || body.includes('PR Code Suggestions')) {
      hasSuggestions = true;
      const shaMatch = body.match(/<!-- ([0-9a-f]{7,40}) -->/);
      if (shaMatch) {
        latestSuggestionSha = shaMatch[1];
      }
    }
  }

  let isFresh = true;
  if (latestSuggestionSha && headSha) {
    // If suggestion SHA does not prefix the current headSha, the branch received new commits afterwards
    isFresh = headSha.startsWith(latestSuggestionSha);
  }

  return { hasSuggestions, isFresh, latestSuggestionSha, hasSonarFailureComment };
}

async function main() {
  const opts = parseArgs();
  const repo = runCmd('gh repo view --json nameWithOwner -q .nameWithOwner') || 'e-picsa/picsa-apps';
  const cache = loadCache(opts.cacheFile);

  // Fetch open PRs
  const rawPrs = runGhJson(
    'gh pr list --limit 50 --json number,title,author,headRefName,baseRefName,headRefOid,updatedAt,createdAt,isDraft,statusCheckRollup,additions,deletions,changedFiles,url'
  );

  if (!rawPrs || rawPrs.length === 0) {
    console.log('No open pull requests found in repository.');
    return;
  }

  let selectedPrs = [];
  let backlogPrs = [];

  if (opts.prs && opts.prs.length > 0) {
    selectedPrs = rawPrs.filter((p) => opts.prs.includes(p.number));
    backlogPrs = rawPrs.filter((p) => !opts.prs.includes(p.number));
  } else if (opts.all) {
    selectedPrs = rawPrs;
    backlogPrs = [];
  } else {
    selectedPrs = rawPrs.slice(0, opts.limit);
    backlogPrs = rawPrs.slice(opts.limit);
  }

  const triaged = [];

  for (const pr of selectedPrs) {
    const cached = cache.prs?.[pr.number];
    const cacheAgeMs = cached?.auditedAt ? Date.now() - new Date(cached.auditedAt).getTime() : Infinity;
    const cacheTtlMs = (opts.cacheTtlMinutes || 30) * 60 * 1000;
    const isCacheFresh = cacheAgeMs < cacheTtlMs;
    // Don't reuse cache if previous state was pending (checks likely concluded)
    const wasPending = cached?.verdict === '⏳ CHECKS_PENDING' || cached?.ciStatus === 'PENDING';
    const isUnchanged = cached && cached.headSha === pr.headRefOid && isCacheFresh && !wasPending && !opts.refresh;

    if (isUnchanged) {
      triaged.push({
        ...cached,
        isFromCache: true,
        title: pr.title,
        url: pr.url,
        author: pr.author?.login || 'unknown',
        headRefName: pr.headRefName,
        baseRefName: pr.baseRefName,
        updatedAt: pr.updatedAt,
      });
      continue;
    }

    // Evaluate live PR
    // 1. Mergeability
    const prDetails = runGhJson(`gh api repos/${repo}/pulls/${pr.number}`);
    const mergeable = prDetails?.mergeable;
    const mergeableState = prDetails?.mergeable_state || 'unknown';

    // 2. Behind/Ahead comparison
    const compare = runGhJson(`gh api repos/${repo}/compare/${pr.baseRefName}...${pr.headRefOid}`);
    const behindBy = compare?.behind_by ?? null;
    const aheadBy = compare?.ahead_by ?? null;

    // 3. Changed files & Domain classification
    const filesData = runGhJson(`gh pr view ${pr.number} --json files`);
    const files = filesData?.files || [];
    const domains = classifyDomains(files);
    const size = calculateSize(files);

    // 4. Check CI runs
    const ci = evaluateChecks(pr.statusCheckRollup);

    // 5. Check comments (PR-Agent & Sonar)
    const commentsData = runGhJson(`gh pr view ${pr.number} --json comments`);
    const botReview = evaluateBotReview(commentsData?.comments || [], pr.headRefOid);

    // 6. Merge health calculation
    let mergeStatusBadge = '🟢 Clean';
    let canAutoUpdate = false;
    let mergeNotes = '';

    if (mergeable === false || mergeableState === 'dirty') {
      mergeStatusBadge = '🔴 Conflicts';
      mergeNotes = 'Merge conflicts with base branch. Manual rebase required.';
    } else if (behindBy !== null && behindBy > 0) {
      canAutoUpdate = mergeable === true;
      mergeStatusBadge = `🟡 Behind (${behindBy})`;
      mergeNotes = `Behind ${pr.baseRefName} by ${behindBy} commits. ${
        canAutoUpdate ? 'Can cleanly update-branch.' : 'Rebase needed.'
      }`;
    } else if (behindBy === 0) {
      mergeStatusBadge = '🟢 Up-to-date';
      mergeNotes = `Up to date with ${pr.baseRefName}.`;
    }

    // 7. Overall Actionable Verdict
    let verdict = '🟢 READY_FOR_REVIEW';
    let verdictReason = ci.status === 'SUCCESS'
      ? 'Checks passing, mergeable, waiting on senior review.'
      : 'Mergeable, waiting on senior review.';

    if (pr.isDraft) {
      verdict = '🔵 DRAFT';
      verdictReason = 'PR is still marked draft by author.';
    } else if (mergeable === false || mergeableState === 'dirty') {
      verdict = '🔴 CONFLICTED';
      verdictReason = 'Merge conflicts detected. Blocked on author resolution.';
    } else if (ci.status === 'FAILURE' || botReview.hasSonarFailureComment) {
      verdict = '🟡 BLOCKED_ON_AUTHOR';
      verdictReason = `CI or Sonar failure: ${ci.failures.join(', ') || 'Quality Gate failed'}.`;
    } else if (ci.status === 'PENDING') {
      verdict = '⏳ CHECKS_PENDING';
      verdictReason = `Automated checks still in progress: ${ci.badge}.`;
    } else if (botReview.hasSuggestions && botReview.isFresh) {
      verdict = '🟡 PENDING_BOT_FIXES';
      verdictReason = 'Open PR-Agent suggestions pending on current commit.';
    }

    const triageRecord = {
      number: pr.number,
      title: pr.title,
      url: pr.url,
      author: pr.author?.login || 'unknown',
      headRefName: pr.headRefName,
      baseRefName: pr.baseRefName,
      headSha: pr.headRefOid,
      updatedAt: pr.updatedAt,
      isDraft: pr.isDraft,
      isFromCache: false,
      auditedAt: new Date().toISOString(),
      verdict,
      verdictReason,
      mergeStatusBadge,
      behindBy,
      aheadBy,
      mergeable,
      canAutoUpdate,
      mergeNotes,
      ciBadge: ci.badge,
      ciStatus: ci.status,
      ciFailures: ci.failures,
      domains,
      size,
      botReview,
      totalAdditions: pr.additions,
      totalDeletions: pr.deletions,
      totalFiles: pr.changedFiles,
    };

    cache.prs[pr.number] = triageRecord;
    triaged.push(triageRecord);
  }

  cache.lastRun = new Date().toISOString();
  saveCache(opts.cacheFile, cache);

  if (opts.json) {
    console.log(JSON.stringify({ triaged, backlog: backlogPrs }, null, 2));
    return;
  }

  // Render Markdown Dashboard
  const cachedCount = triaged.filter((t) => t.isFromCache).length;
  const liveCount = triaged.length - cachedCount;

  console.log(`# 🔍 Open PR Triage Dashboard (${triaged.length} PRs evaluated)`);
  console.log(`*${rawPrs.length} total open PRs in \`${repo}\` | ${cachedCount} unchanged (cached), ${liveCount} evaluated live*\n`);

  // Summary Table
  console.log('| PR | Title | Author | Size & Blast Radius | CI / Quality | Merge Health | Verdict / Next Step |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

  for (const t of triaged) {
    const prLink = `[#${t.number}](${t.url})`;
    const titleTrunc = t.title.length > 32 ? t.title.substring(0, 30) + '...' : t.title;
    const domainStr = t.domains && t.domains.length > 0 ? t.domains.slice(0, 2).join(', ') : 'General';
    const sizeStr = `${t.size?.label || '⚪'} (+${t.totalAdditions}/-${t.totalDeletions})<br><sub>${domainStr}</sub>`;
    const ciStr = t.ciBadge || '⚪';
    const mergeStr = t.mergeStatusBadge || '⚪';
    const cacheTag = t.isFromCache ? ' <sub>[cached]</sub>' : '';

    let verdictBadge = t.verdict;
    if (t.verdict === '🟢 READY_FOR_REVIEW') verdictBadge = `**🟢 Ready for Review**${cacheTag}`;
    else if (t.verdict === '🟡 BLOCKED_ON_AUTHOR') verdictBadge = `**🟡 Blocked on Author**${cacheTag}`;
    else if (t.verdict === '🟡 PENDING_BOT_FIXES') verdictBadge = `**🟡 Bot Fixes Pending**${cacheTag}`;
    else if (t.verdict === '⏳ CHECKS_PENDING') verdictBadge = `**⏳ Checks Pending**${cacheTag}`;
    else if (t.verdict === '🔴 CONFLICTED') verdictBadge = `**🔴 Conflicts**${cacheTag}`;
    else if (t.verdict === '🔵 DRAFT') verdictBadge = `**🔵 Draft**${cacheTag}`;

    console.log(`| ${prLink} | ${titleTrunc} | @${t.author} | ${sizeStr} | ${ciStr} | ${mergeStr} | ${verdictBadge} |`);
  }

  console.log('\n---\n');
  console.log('## 🔎 Detailed PR Breakdown & Action Items\n');

  for (const t of triaged) {
    const age = formatRelativeTime(t.updatedAt);
    const domainList = t.domains?.join(' • ') || 'Standard';
    console.log(`### [PR #${t.number}: ${t.title}](${t.url})`);
    console.log(`- **Author**: @${t.author} | **Branch**: \`${t.headRefName}\` → \`${t.baseRefName}\` | **Updated**: ${age}`);
    console.log(`- **Blast Radius**: ${t.size?.label} (~${t.size?.estMinutes}) · Touches: **${domainList}** (${t.totalFiles} files changed)`);
    console.log(`- **Merge Health**: ${t.mergeNotes}`);
    if (t.canAutoUpdate) {
      console.log(`  > 💡 *Quick branch update command*: \`gh api repos/${repo}/pulls/${t.number}/update-branch -X PUT\``);
    }
    console.log(`- **CI & Quality**: ${t.ciBadge}`);
    if (t.botReview?.hasSuggestions) {
      const freshText = t.botReview.isFresh ? 'Fresh (on latest commit)' : 'Older commit (potentially addressed)';
      console.log(`- **PR-Agent Review**: Code suggestions posted (${freshText}).`);
    }
    console.log(`- **Recommended Action**: **${t.verdictReason}**`);
    console.log('');
  }

  if (backlogPrs.length > 0) {
    console.log('---\n');
    console.log(`### 📋 Untriaged Open PR Backlog (${backlogPrs.length} older PRs not evaluated)\n`);
    for (const b of backlogPrs) {
      const age = formatRelativeTime(b.updatedAt);
      console.log(`- **[#${b.number}](${b.url})**: ${b.title} (@${b.author?.login || 'unknown'}, updated ${age})`);
    }
    console.log('\n> **💡 Next Steps:**');
    console.log(`> - To review any PR in depth, prompt: \`"Review PR #<number> using pr-review"\``);
    console.log(`> - To triage backlog PRs, prompt: \`"Triage PRs #${backlogPrs.slice(0, 3).map((p) => p.number).join(', #')}"\` or \`"Triage top 10 PRs"\``);
    console.log(`> - To force refresh all PRs disregarding cache, prompt: \`"Triage PRs --refresh"\``);
  }
}

main().catch((err) => {
  console.error('Error running triage:', err);
  process.exit(1);
});
