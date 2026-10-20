#!/usr/bin/env node
/**
 * AI error triage helper for Sentry and Firebase Crashlytics.
 *
 * Pulls, ranks, and correlates production runtime errors across
 * Sentry (@sentry/angular) and Firebase Crashlytics (@capacitor-firebase/crashlytics).
 *
 * Usage:
 *   yarn ai:triage --doctor               # check credentials and local connectivity
 *   yarn ai:triage list                   # list top unresolved errors
 *   yarn ai:triage list --limit 10 --source sentry
 *   yarn ai:triage inspect <issue-id>     # view de-minified stacktrace & breadcrumbs
 *   yarn ai:triage user <device-uuid>     # view events & breadcrumbs for a Device ID
 *   yarn ai:triage ignore <issue-id>      # mute issue in Sentry
 *   yarn ai:triage resolve <issue-id>     # mark issue resolved in Sentry
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitOutput, hasHelpFlag, REPO_ROOT } from './_shared.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

// Default PICSA project parameters
const DEFAULT_FIREBASE_PROJECT = 'picsa-apps';
const DEFAULT_PACKAGE_NAME = 'io.picsa.extension';
const DEFAULT_SENTRY_URL = 'https://e-picsa.sentry.io';
const DEFAULT_SENTRY_ORG = 'e-picsa';

// ---------------------------------------------------------------------------
// 0. Logging & Sanitization (prevents log injection S5145)
// ---------------------------------------------------------------------------

function sanitizeLog(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replaceAll(/[\r\n\t]/g, ' ')
    .trim();
}

function safeLog(...args) {
  const sanitized = args.map((arg) => (typeof arg === 'string' ? sanitizeLog(arg) : arg));
  console.log(...sanitized);
}

function safeError(...args) {
  const sanitized = args.map((arg) => (typeof arg === 'string' ? sanitizeLog(arg) : arg));
  console.error(...sanitized);
}

// ---------------------------------------------------------------------------
// 1. Environment Loading & Discovery
// ---------------------------------------------------------------------------

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  try {
    const content = readFileSync(filePath, 'utf8');
    const result = {};
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

function loadEnv() {
  const candidateFiles = [
    path.join(REPO_ROOT, '.env.local'),
    path.join(REPO_ROOT, 'apps/picsa-scripts/.env'),
    path.join(REPO_ROOT, 'apps/picsa-server/.env.local'),
    path.join(REPO_ROOT, 'apps/picsa-server/.env.server'),
  ];

  // If in a git worktree, also inspect the main repo checkout if distinct
  const commonDir = gitOutput('rev-parse --git-common-dir', REPO_ROOT);
  if (commonDir) {
    const absCommon = path.isAbsolute(commonDir) ? commonDir : path.join(REPO_ROOT, commonDir);
    if (path.basename(absCommon) === '.git') {
      const mainRoot = path.dirname(absCommon);
      if (mainRoot !== REPO_ROOT) {
        candidateFiles.push(path.join(mainRoot, 'apps/picsa-scripts/.env'), path.join(mainRoot, '.env.local'));
      }
    }
  }

  for (const file of candidateFiles) {
    const parsed = parseEnvFile(file);
    for (const [k, v] of Object.entries(parsed)) {
      if (!process.env[k] && v) {
        process.env[k] = v;
      }
    }
  }
}

loadEnv();

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN || '';
const SENTRY_URL = (process.env.SENTRY_URL || DEFAULT_SENTRY_URL).replace(/\/$/, '');
let SENTRY_ORG = process.env.SENTRY_ORG || DEFAULT_SENTRY_ORG;
let SENTRY_PROJECT = process.env.SENTRY_PROJECT || '';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT;

// ---------------------------------------------------------------------------
// 2. Sentry API Helpers (strictly validated against API Traversal / SSRF)
// ---------------------------------------------------------------------------

function buildSentryUrl(endpoint) {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (cleanEndpoint.includes('..') || cleanEndpoint.includes('%2e%2e')) {
    throw new Error(`Forbidden API traversal in path: ${endpoint}`);
  }
  const base = new URL('/api/0/', SENTRY_URL);
  const target = new URL(cleanEndpoint, base);
  if (target.origin !== new URL(SENTRY_URL).origin || !target.pathname.startsWith('/api/0/')) {
    throw new Error(`Forbidden API traversal: ${endpoint}`);
  }
  return target.href;
}

async function sentryFetch(endpoint, options = {}) {
  if (!SENTRY_AUTH_TOKEN) {
    throw new Error('SENTRY_AUTH_TOKEN is not configured.');
  }

  const url = buildSentryUrl(endpoint);
  const response = await fetch(url, {
    method: options.method || 'GET',
    body: options.body,
    headers: {
      Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errBody = '';
    try {
      errBody = await response.text();
    } catch {
      // ignore
    }
    throw new Error(`Sentry API HTTP ${response.status} (${response.statusText}): ${errBody || 'Unknown error'}`);
  }

  return response.json();
}

/** Auto-resolves SENTRY_ORG and SENTRY_PROJECT if not explicitly configured in env */
async function resolveSentryTarget() {
  if (SENTRY_ORG && SENTRY_PROJECT) {
    return { org: SENTRY_ORG, project: SENTRY_PROJECT };
  }

  if (!SENTRY_AUTH_TOKEN) {
    return { org: '', project: '' };
  }

  try {
    const orgs = await sentryFetch('organizations/');
    if (orgs && orgs.length > 0 && !SENTRY_ORG) {
      SENTRY_ORG = orgs[0].slug;
    }

    if (!SENTRY_PROJECT && SENTRY_ORG) {
      const projects = await sentryFetch(`organizations/${SENTRY_ORG}/projects/`);
      if (projects && projects.length > 0) {
        const matched = projects.find((p) => p.slug.includes('picsa') || p.slug.includes('app')) || projects[0];
        SENTRY_PROJECT = matched.slug;
      }
    }
  } catch {
    // Keep whatever was configured
  }

  return { org: SENTRY_ORG, project: SENTRY_PROJECT };
}

// ---------------------------------------------------------------------------
// 3. Crashlytics / Firebase / BigQuery Helpers
// ---------------------------------------------------------------------------

function checkToolCommand(cmd) {
  if (!/^[a-zA-Z0-9_-]+$/.test(cmd)) return false;
  try {
    const res = spawnSync('which', [cmd], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

function buildBigQuerySql({ table, whereClause, limit }) {
  return `
    SELECT
      issue_id,
      issue_title,
      COUNT(*) AS event_count,
      COUNT(DISTINCT user_id) AS user_count,
      MIN(event_timestamp) AS first_seen,
      MAX(event_timestamp) AS last_seen,
      is_fatal
    FROM \`${table}\`
    WHERE ${whereClause}
    GROUP BY issue_id, issue_title, is_fatal
    ORDER BY is_fatal DESC, user_count DESC, event_count DESC
    LIMIT ${Number(limit)}
  `;
}

async function queryCrashlyticsBigQuery({ limit = 10, isFatal = null } = {}) {
  if (!checkToolCommand('bq')) {
    return { error: 'bq CLI tool not found in PATH.' };
  }

  const dataset = `firebase_crashlytics`;
  const sanitizedPkg = DEFAULT_PACKAGE_NAME.replaceAll('.', '_');
  const table = `${FIREBASE_PROJECT_ID}.${dataset}.${sanitizedPkg}_ANDROID`;

  let whereClause = `event_timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)`;
  if (isFatal !== null) {
    whereClause += ` AND is_fatal = ${isFatal}`;
  }

  const query = buildBigQuerySql({ table, whereClause, limit });

  try {
    const res = spawnSync(
      'bq',
      ['query', '--use_legacy_sql=false', '--format=json', `--project_id=${FIREBASE_PROJECT_ID}`, query],
      { encoding: 'utf8' },
    );
    if (res.status !== 0) {
      const errOut = (res.stderr || res.stdout || '').trim();
      if (errOut.includes('Not found: Dataset') || errOut.includes('404')) {
        return {
          error: `BigQuery dataset '${dataset}' not found in project '${FIREBASE_PROJECT_ID}'. Export is not yet toggled in Firebase Console.`,
        };
      }
      if (errOut.includes('credentials') || errOut.includes('auth')) {
        return {
          error: `Application Default Credentials missing. Run 'gcloud auth application-default login' to authenticate bq.`,
        };
      }
      return { error: errOut.split('\n')[0] || `BigQuery query exited with status ${res.status}` };
    }
    const parsed = JSON.parse(res.stdout);
    return { data: parsed };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// 4. Subcommands: Doctor, List, Inspect, User, Ignore, Resolve
// ---------------------------------------------------------------------------

function printHelp() {
  safeLog(`ai-error-triage: unified Sentry + Firebase Crashlytics error triage

Usage:
  yarn ai:triage [command] [options]

Commands:
  --doctor                  Inspect credentials, API connectivity, and show setup steps
  list                      List top unresolved errors (default)
  inspect <issue-id>        Deep-inspect stacktrace, breadcrumbs, and tags for a Sentry issue
  user <device-uuid>        Show Sentry event history & breadcrumbs for a Device ID (Device.getId())
  ignore <issue-id>         Mute an issue in Sentry
  resolve <issue-id>        Mark an issue resolved in Sentry

List Options:
  --limit <n>               Max issues to display (default: 10)
  --source <source>         Filter by provider: 'sentry', 'crashlytics', or 'all' (default: all)
  --platform <p>            Filter platform: 'web', 'android', or 'all' (default: all)
  --release <v>             Filter by release version (e.g. 5.18.1)
  --json                    Output raw JSON instead of formatted table
  -h, --help                Show this help`);
}

async function runDoctor() {
  safeLog(`\n======================================================`);
  safeLog(`          AI Error Triage Doctor & Setup Check        `);
  safeLog(`======================================================\n`);

  // 1. Check Sentry
  safeLog(`[1/2] Sentry Configuration Check:`);
  safeLog(`  Sentry Base URL : ${SENTRY_URL}`);
  if (!SENTRY_AUTH_TOKEN) {
    safeLog(`  Auth Token      : ❌ MISSING (SENTRY_AUTH_TOKEN)`);
    safeLog(`\n  👉 How to set up Sentry:`);
    safeLog(`     1. Go to: ${SENTRY_URL}/settings/account/api/auth-tokens/`);
    safeLog(`     2. Create a User Auth Token with scopes:`);
    safeLog(`        - project:read, org:read, event:read (required for triage)`);
    safeLog(`        - event:write (optional, if you want CLI ignore/resolve support)`);
    safeLog(`     3. Add to 'apps/picsa-scripts/.env' or '.env.local':`);
    safeLog(`        SENTRY_AUTH_TOKEN=your_token_here`);
    safeLog(`        SENTRY_ORG=${SENTRY_ORG}  # optional, auto-detected if omitted`);
    safeLog(`        SENTRY_PROJECT=picsa-apps  # optional, auto-detected if omitted`);
  } else {
    safeLog(`  Auth Token      : ✅ Found (${SENTRY_AUTH_TOKEN.slice(0, 8)}...)`);
    try {
      const { org, project } = await resolveSentryTarget();
      safeLog(`  Organization    : ✅ ${org || 'Not resolved'}`);
      safeLog(`  Project         : ✅ ${project || 'Not resolved'}`);

      const issues = await sentryFetch(`projects/${org}/${project}/issues/?query=is:unresolved&limit=1`);
      safeLog(
        `  API Connection  : ✅ Connected successfully (accessible issues: ${Array.isArray(issues) ? 'yes' : 'no'})`,
      );
    } catch (err) {
      safeLog(`  API Connection  : ❌ Failed to query Sentry API: ${err.message}`);
    }
  }

  // 2. Check Firebase Crashlytics
  safeLog(`\n[2/2] Firebase Crashlytics Check:`);
  safeLog(`  Firebase Project: ${FIREBASE_PROJECT_ID}`);
  safeLog(`  Android Package : ${DEFAULT_PACKAGE_NAME}`);

  const hasGcloud = checkToolCommand('gcloud');
  const hasBq = checkToolCommand('bq');
  const hasFirebase = checkToolCommand('firebase');

  safeLog(`  gcloud CLI      : ${hasGcloud ? '✅ Found' : '⚠️ Not installed'}`);
  safeLog(`  bq CLI          : ${hasBq ? '✅ Found' : '⚠️ Not installed'}`);
  safeLog(`  firebase CLI    : ${hasFirebase ? '⚠️ Not installed' : '✅ Found'}`);

  if (hasBq) {
    const bqResult = await queryCrashlyticsBigQuery({ limit: 1 });
    if (bqResult.error) {
      safeLog(`  BigQuery Stream : ⚠️ ${bqResult.error}`);
      safeLog(`\n  👉 How to enable Crashlytics BigQuery Export:`);
      safeLog(
        `     1. Open Firebase Console: https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/settings/integrations`,
      );
      safeLog(`     2. Under 'BigQuery', click Link/Manage and toggle 'Crashlytics' ON (free tier).`);
      safeLog(`     3. Run locally: 'gcloud auth application-default login'`);
    } else {
      safeLog(`  BigQuery Stream : ✅ Connected! Found Crashlytics dataset table.`);
    }
  } else {
    safeLog(`\n  ℹ️ Note on Crashlytics:`);
    safeLog(`     For low-friction triage, Sentry captures all JS/TS errors and sourcemapped stack traces.`);
    safeLog(`     Crashlytics tracks fatal Android native OS/plugin crashes.`);
    safeLog(
      `     To enable programmatic Crashlytics querying, install Google Cloud SDK ('brew install google-cloud-sdk')`,
    );
    safeLog(`     and enable BigQuery export in the Firebase Console.`);
  }

  safeLog(`\n======================================================\n`);
}

function mapSentryIssue(item) {
  return {
    id: item.id,
    shortId: item.shortId || item.id,
    source: 'sentry',
    title: item.title || item.metadata?.value || 'Unknown error',
    culprit: item.culprit || '',
    eventCount: Number(item.count || 0),
    userCount: Number(item.userCount || 0),
    firstSeen: item.firstSeen ? new Date(item.firstSeen).toLocaleDateString() : 'N/A',
    lastSeen: item.lastSeen ? new Date(item.lastSeen).toLocaleDateString() : 'N/A',
    isFatal: false,
    permalink: item.permalink || '',
  };
}

async function fetchSentryIssues(options) {
  const { limit, platform, release } = options;
  if (!SENTRY_AUTH_TOKEN) {
    return {
      error: 'SENTRY_AUTH_TOKEN missing. Run `yarn ai:triage --doctor` for setup guide.',
      items: [],
    };
  }

  try {
    const { org, project } = await resolveSentryTarget();
    if (!org || !project) {
      throw new Error('Could not resolve Sentry organization or project.');
    }

    let query = 'is:unresolved';
    if (platform === 'web') query += ' platform:javascript !tag:isNative:true';
    if (platform === 'android') query += ' tag:isNative:true';
    if (release) query += ` release:${release}`;

    const issues = await sentryFetch(
      `projects/${org}/${project}/issues/?query=${encodeURIComponent(query)}&limit=${limit}&sort=user`,
    );

    return { items: issues.map(mapSentryIssue), error: null };
  } catch (err) {
    return { items: [], error: err.message };
  }
}

function mapCrashlyticsIssue(row) {
  return {
    id: row.issue_id,
    shortId: `crash-${row.issue_id?.slice(0, 8)}`,
    source: 'crashlytics',
    title: row.issue_title || 'Fatal Native Crash',
    culprit: '',
    eventCount: Number(row.event_count || 0),
    userCount: Number(row.user_count || 0),
    firstSeen: row.first_seen?.value ? new Date(row.first_seen.value).toLocaleDateString() : 'N/A',
    lastSeen: row.last_seen?.value ? new Date(row.last_seen.value).toLocaleDateString() : 'N/A',
    isFatal: Boolean(row.is_fatal),
    permalink: `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/crashlytics/app/android:${DEFAULT_PACKAGE_NAME}/issues/${row.issue_id}`,
  };
}

async function fetchCrashlyticsIssues(limit) {
  const bq = await queryCrashlyticsBigQuery({ limit });
  if (bq.error) {
    return { items: [], error: bq.error };
  }
  const items = Array.isArray(bq.data) ? bq.data.map(mapCrashlyticsIssue) : [];
  return { items, error: null };
}

function sortTriageIssues(items) {
  return [...items].sort((a, b) => {
    if (a.isFatal !== b.isFatal) return a.isFatal ? -1 : 1;
    if (b.userCount !== a.userCount) return b.userCount - a.userCount;
    return b.eventCount - a.eventCount;
  });
}

function printIssueTable(items, limit) {
  safeLog(`| # | Pri | Source | Users | Events | Last Seen | Issue Title & Culprit | Issue ID |`);
  safeLog(`|---|---|---|---|---|---|---|---|`);

  items.slice(0, limit).forEach((it, idx) => {
    const pri = it.isFatal ? '🚨 P0' : it.userCount > 5 ? '⚠️ P1' : 'ℹ️ P2';
    const cleanTitle = (it.title || '').replaceAll('|', '-').slice(0, 60);
    const culpritSuffix = it.culprit ? ` (${it.culprit.slice(0, 35)})` : '';
    safeLog(
      `| ${idx + 1} | ${pri} | ${it.source} | ${it.userCount} | ${it.eventCount} | ${it.lastSeen} | ${cleanTitle}${culpritSuffix} | \`${it.id}\` |`,
    );
  });

  safeLog(`\nNext step: Run \`yarn ai:triage inspect <issue-id>\` to view the stacktrace and breadcrumbs.`);
}

async function runList(options) {
  const { limit = 10, source = 'all', platform = 'all', release, json = false } = options;
  const items = [];
  const errors = [];

  if (source === 'all' || source === 'sentry') {
    const sentryRes = await fetchSentryIssues({ limit, platform, release });
    if (sentryRes.error) {
      errors.push({ source: 'Sentry', message: sentryRes.error });
    }
    items.push(...sentryRes.items);
  }

  if (source === 'all' || source === 'crashlytics') {
    const crashRes = await fetchCrashlyticsIssues(limit);
    if (crashRes.error && source === 'crashlytics') {
      errors.push({ source: 'Crashlytics', message: crashRes.error });
    }
    items.push(...crashRes.items);
  }

  const sorted = sortTriageIssues(items);

  if (json) {
    safeLog(JSON.stringify({ items: sorted, errors }, null, 2));
    return;
  }

  safeLog(`\n=== Production Error Triage (${sorted.length} issues found) ===\n`);

  for (const e of errors) {
    safeLog(`⚠️  ${e.source}: ${e.message}`);
  }
  if (errors.length > 0) safeLog('');

  if (sorted.length === 0) {
    safeLog(`✅ No unresolved issues found matching criteria.`);
    return;
  }

  printIssueTable(sorted, limit);
}

function formatBreadcrumbTimestamp(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) {
    return new Date(Number(timestamp) * 1000).toLocaleTimeString();
  }
  return d.toLocaleTimeString();
}

function renderTags(tags) {
  if (!tags || tags.length === 0) return;
  safeLog(`### Key Tags:`);
  const keyTags = ['release', 'platform', 'isNative', 'browser.name', 'os.name', 'user'];
  for (const t of tags) {
    if (keyTags.some((k) => t.key.includes(k))) {
      safeLog(`- **${t.key}**: \`${t.value}\``);
    }
  }
  safeLog('');
}

function renderStacktrace(entries) {
  const exceptions = entries?.find((e) => e.type === 'exception')?.data?.values || [];
  if (exceptions.length === 0) return;

  safeLog(`### Exception & Stacktrace:`);
  for (const ex of exceptions) {
    safeLog(`\n**${ex.type}**: ${ex.value}\n`);
    const frames = ex.stacktrace?.frames || [];
    for (const frame of frames.slice(-15)) {
      const inAppTag = frame.inApp ? '👉 [In-App]' : '   ';
      const fileLine = `${frame.filename || 'unknown'}:${frame.lineNo || '?'}:${frame.colNo || '?'}`;
      safeLog(`${inAppTag} ${frame.function || 'anonymous'} at ${fileLine}`);
      if (frame.context && frame.context.length > 0) {
        for (const [lineNum, lineContent] of frame.context) {
          const prefix = lineNum === frame.lineNo ? '  > ' : '    ';
          safeLog(`${prefix}${lineNum}: ${lineContent}`);
        }
      }
    }
  }
  safeLog('');
}

function renderBreadcrumbs(entries) {
  const breadcrumbEntries = entries?.find((e) => e.type === 'breadcrumbs')?.data?.values || [];
  if (breadcrumbEntries.length === 0) return;

  safeLog(`### Recent User Breadcrumbs (Last 10):`);
  for (const b of breadcrumbEntries.slice(-10)) {
    const timeStr = formatBreadcrumbTimestamp(b.timestamp);
    const category = b.category || b.type || 'info';
    const msg = b.message || JSON.stringify(b.data || {});
    safeLog(`- \`[${timeStr}] [${category}]\`: ${msg}`);
  }
  safeLog('');
}

async function runInspect(issueId) {
  if (!SENTRY_AUTH_TOKEN) {
    safeError('❌ SENTRY_AUTH_TOKEN is required. Run `yarn ai:triage --doctor` for setup.');
    return;
  }

  safeLog(`\nFetching Sentry issue details for: ${issueId}...`);

  try {
    const { org } = await resolveSentryTarget();
    const issue = await sentryFetch(`organizations/${org}/issues/${issueId}/`);
    const latestEvent = await sentryFetch(`organizations/${org}/issues/${issueId}/events/latest/`);

    safeLog(`\n======================================================`);
    safeLog(`  Issue: ${issue.title}`);
    safeLog(`  ID: ${issue.id} (${issue.shortId || ''})`);
    safeLog(`  Status: ${issue.status} | Events: ${issue.count} | Users: ${issue.userCount}`);
    safeLog(`  First Seen: ${issue.firstSeen} | Last Seen: ${issue.lastSeen}`);
    safeLog(`  Permalink: ${issue.permalink}`);
    safeLog(`======================================================\n`);

    renderTags(latestEvent.tags);
    renderStacktrace(latestEvent.entries);
    renderBreadcrumbs(latestEvent.entries);

    safeLog(`### 🤖 Triage Classification & Next Steps:`);
    safeLog(
      `1. **Bucket A (Code Bug)**: If in-app stack frames pinpoint a file in \`libs/\` or \`apps/\`, check root cause and create a test in \`*.spec.ts\`.`,
    );
    safeLog(
      `2. **Bucket B (Noise)**: If caused by browser extension, network drop, or benign WebView message, add filter in \`libs/shared/src/services/core/sentry.service.ts\` (\`beforeSend\`) or run \`yarn ai:triage ignore ${issueId}\`.`,
    );
    safeLog(
      `3. **Bucket C (Telemetry)**: If stacktrace is ambiguous, add \`SentryService.addBreadcrumb()\` or \`setExtra()\` in the calling service.`,
    );
  } catch (err) {
    safeError(`❌ Failed to inspect issue: ${err.message}`);
  }
}

async function runUser(deviceUuid) {
  if (!SENTRY_AUTH_TOKEN) {
    safeError('❌ SENTRY_AUTH_TOKEN is required. Run `yarn ai:triage --doctor` for setup.');
    return;
  }

  const { org, project } = await resolveSentryTarget();
  safeLog(`\nQuerying Sentry events for Device ID (\`user.id:${deviceUuid}\`)...`);

  try {
    const userQuery = `user.id:${deviceUuid}`;
    const events = await sentryFetch(
      `projects/${org}/${project}/events/?query=${encodeURIComponent(userQuery)}&limit=5`,
    );

    if (!events || events.length === 0) {
      safeLog(`No Sentry events found for device UUID: ${deviceUuid}`);
      return;
    }

    safeLog(`\nFound ${events.length} recent events for device: ${deviceUuid}\n`);
    for (const ev of events) {
      safeLog(
        `- **Event ID**: \`${ev.eventID}\` | **Date**: ${ev.dateCreated} | **Message**: ${ev.message || ev.title}`,
      );
    }
  } catch (err) {
    safeError(`❌ Failed to search user events: ${err.message}`);
  }
}

async function runUpdateStatus(issueId, newStatus) {
  if (!SENTRY_AUTH_TOKEN) {
    safeError('❌ SENTRY_AUTH_TOKEN is required.');
    return;
  }

  try {
    const { org } = await resolveSentryTarget();
    await sentryFetch(`organizations/${org}/issues/${issueId}/`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    safeLog(`✅ Issue ${issueId} successfully marked as: ${newStatus}`);
  } catch (err) {
    safeError(`❌ Failed to update issue status: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 5. CLI Entrypoint
// ---------------------------------------------------------------------------

function parseListOptions(rawArgs) {
  const limitIdx = rawArgs.indexOf('--limit');
  const limit = limitIdx >= 0 ? Number(rawArgs[limitIdx + 1]) || 10 : 10;
  const sourceIdx = rawArgs.indexOf('--source');
  const source = sourceIdx >= 0 ? rawArgs[sourceIdx + 1] : 'all';
  const platIdx = rawArgs.indexOf('--platform');
  const platform = platIdx >= 0 ? rawArgs[platIdx + 1] : 'all';
  const relIdx = rawArgs.indexOf('--release');
  const release = relIdx >= 0 ? rawArgs[relIdx + 1] : undefined;
  const json = rawArgs.includes('--json');

  return { limit, source, platform, release, json };
}

async function executeCommand(command, rawArgs) {
  switch (command) {
    case 'list': {
      await runList(parseListOptions(rawArgs));
      return 0;
    }
    case 'inspect': {
      const issueId = rawArgs[1];
      if (!issueId) {
        safeError('❌ Usage: yarn ai:triage inspect <issue-id>');
        return 1;
      }
      await runInspect(issueId);
      return 0;
    }
    case 'user': {
      const deviceUuid = rawArgs[1];
      if (!deviceUuid) {
        safeError('❌ Usage: yarn ai:triage user <device-uuid>');
        return 1;
      }
      await runUser(deviceUuid);
      return 0;
    }
    case 'ignore': {
      const issueId = rawArgs[1];
      if (!issueId) {
        safeError('❌ Usage: yarn ai:triage ignore <issue-id>');
        return 1;
      }
      await runUpdateStatus(issueId, 'ignored');
      return 0;
    }
    case 'resolve': {
      const issueId = rawArgs[1];
      if (!issueId) {
        safeError('❌ Usage: yarn ai:triage resolve <issue-id>');
        return 1;
      }
      await runUpdateStatus(issueId, 'resolved');
      return 0;
    }
    default:
      safeError(`❌ Unknown command: ${command}`);
      printHelp();
      return 1;
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  if (hasHelpFlag(rawArgs)) {
    printHelp();
    return 0;
  }

  if (rawArgs.includes('--doctor')) {
    await runDoctor();
    return 0;
  }

  const command = rawArgs[0] && !rawArgs[0].startsWith('-') ? rawArgs[0] : 'list';
  return executeCommand(command, rawArgs);
}

try {
  await main();
} catch (err) {
  safeError('\nUnexpected error:', err);
  process.exit(1);
}
