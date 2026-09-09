#!/usr/bin/env node

/**
 * Script to check for updates to:
 * 1. the-pr-agent GitHub Action releases & base GitHub actions (actions/checkout, actions/github-script)
 * 2. Latest Gemini Flash models (direct API & OpenRouter mirror)
 * 3. Latest low-cost intelligent fallback models (Luna / MiniMax)
 * 4. Context token limits and LiteLLM model support
 *
 * Usage:
 *   node tools/workflows/check-pr-agent-updates.mjs [--dry-run] [--output-github] [--prefer-family=luna|minimax]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const prAgentWorkflowPath = path.join(rootDir, '.github/workflows/pr-agent.yml');
const prAgentConfigPath = path.join(rootDir, '.pr_agent.toml');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isGitHubOutput = args.includes('--output-github');
const preferFamilyArg = args.find((a) => a.startsWith('--prefer-family='))?.split('=')[1];

async function fetchJson(url, options = {}) {
  const headers = {
    'User-Agent': 'picsa-pr-agent-checker',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch latest PR-Agent release from GitHub
 */
async function getLatestPrAgentRelease() {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const releaseUrl = 'https://api.github.com/repos/the-pr-agent/pr-agent/releases/latest';

  const release = await fetchJson(releaseUrl, { headers });
  const tag = release.tag_name;

  // Resolve commit sha for tag
  const refUrl = `https://api.github.com/repos/the-pr-agent/pr-agent/git/ref/tags/${tag}`;
  const refData = await fetchJson(refUrl, { headers });

  let sha = refData.object.sha;
  if (refData.object.type === 'tag') {
    const tagObj = await fetchJson(refData.object.url, { headers });
    sha = tagObj.object.sha;
  }

  return { tag, sha, htmlUrl: release.html_url };
}

/**
 * Fetch latest major version for a GitHub Action (e.g. 'actions/checkout' -> 'v7')
 */
async function getLatestActionMajorVersion(actionRepo) {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const data = await fetchJson(`https://api.github.com/repos/${actionRepo}/releases/latest`, { headers });
    const match = data.tag_name?.match(/^v?(\d+)/);
    return match ? `v${match[1]}` : null;
  } catch (err) {
    console.warn(`Warning: Could not fetch latest release for ${actionRepo}:`, err.message);
    return null;
  }
}

/**
 * Parse version numbers from string e.g. "gemini-3.8-flash" -> [3, 8]
 */
function parseVersionNumbers(str) {
  const match = str.match(/(\d+(?:\.\d+)*)/);
  if (!match) return [];
  return match[1].split('.').map(Number);
}

function compareVersions(v1, v2) {
  const parts1 = parseVersionNumbers(v1);
  const parts2 = parseVersionNumbers(v2);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 !== p2) return p1 - p2;
  }
  return 0;
}

/**
 * Check OpenRouter models catalog
 */
async function getOpenRouterCatalog() {
  const data = await fetchJson('https://openrouter.ai/api/v1/models');
  return data.data || [];
}

/**
 * Optionally check LiteLLM model database for PR-Agent compatibility
 */
async function getLiteLlmModelCatalog() {
  try {
    return await fetchJson('https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json');
  } catch (err) {
    console.warn('Warning: Could not fetch LiteLLM catalog:', err.message);
    return null;
  }
}

/**
 * Find latest Gemini Flash model
 */
function findLatestGeminiFlash(openRouterModels) {
  const candidates = openRouterModels.filter((m) => {
    const id = m.id.toLowerCase();
    return (
      id.startsWith('google/gemini-') &&
      id.includes('flash') &&
      !id.includes('image') &&
      !id.includes('batch') &&
      !id.includes('preview')
    );
  });

  candidates.sort((a, b) => {
    const vDiff = compareVersions(a.id, b.id);
    if (vDiff !== 0) return -vDiff; // Descending
    // Standard flash preferred over flash-lite at same version
    const aIsLite = a.id.includes('flash-lite');
    const bIsLite = b.id.includes('flash-lite');
    if (aIsLite !== bIsLite) return aIsLite ? 1 : -1;
    return (b.created || 0) - (a.created || 0);
  });

  return candidates[0] || null;
}

/**
 * Find latest low-cost intelligent fallback model (Luna or MiniMax)
 */
function findLowCostFallback(openRouterModels, preferredFamily) {
  // 1. Luna candidates
  const lunaCandidates = openRouterModels.filter((m) => {
    const id = m.id.toLowerCase();
    return (
      id.includes('luna') &&
      !id.includes('batch') &&
      !id.includes('pro') &&
      !id.includes('8b') &&
      (m.context_length || 0) >= 128000
    );
  });
  lunaCandidates.sort((a, b) => {
    const vDiff = compareVersions(a.id, b.id);
    if (vDiff !== 0) return -vDiff;
    return (b.created || 0) - (a.created || 0);
  });

  // 2. MiniMax candidates
  const minimaxCandidates = openRouterModels.filter((m) => {
    const id = m.id.toLowerCase();
    return (
      id.startsWith('minimax/minimax-') &&
      !id.includes('batch') &&
      !id.includes('her') &&
      (m.context_length || 0) >= 128000
    );
  });
  minimaxCandidates.sort((a, b) => {
    const vDiff = compareVersions(a.id, b.id);
    if (vDiff !== 0) return -vDiff;
    return (b.created || 0) - (a.created || 0);
  });

  const bestLuna = lunaCandidates[0];
  const bestMinimax = minimaxCandidates[0];

  if (preferredFamily === 'minimax') {
    return bestMinimax || bestLuna;
  }
  if (preferredFamily === 'luna') {
    return bestLuna || bestMinimax;
  }

  // If no explicit preference, choose whichever is newer / higher context
  if (bestLuna && bestMinimax) {
    return (bestLuna.created || 0) >= (bestMinimax.created || 0) ? bestLuna : bestMinimax;
  }
  return bestLuna || bestMinimax || null;
}

async function main() {
  console.log('--- Checking for PR-Agent & Model Updates ---');

  if (!fs.existsSync(prAgentWorkflowPath)) {
    throw new Error(`Workflow file not found at ${prAgentWorkflowPath}`);
  }
  if (!fs.existsSync(prAgentConfigPath)) {
    throw new Error(`Config file not found at ${prAgentConfigPath}`);
  }

  const currentWorkflowContent = fs.readFileSync(prAgentWorkflowPath, 'utf8');
  const currentConfigContent = fs.readFileSync(prAgentConfigPath, 'utf8');

  // Extract current PR-Agent tag and SHA
  const actionRegex = /uses:\s+the-pr-agent\/pr-agent@([a-f0-9]+)\s*#\s*([^\s\n]+)/;
  const actionMatch = currentWorkflowContent.match(actionRegex);
  const currentSha = actionMatch ? actionMatch[1] : null;
  const currentTag = actionMatch ? actionMatch[2] : null;

  // Extract current model & fallbacks
  const modelRegex = /model\s*=\s*"(gemini\/[^"]+)"/;
  const modelMatch = currentConfigContent.match(modelRegex);
  const currentModel = modelMatch ? modelMatch[1] : null;

  const fallbacksRegex = /fallback_models\s*=\s*\[([^\]]+)\]/;
  const fallbacksMatch = currentConfigContent.match(fallbacksRegex);
  const currentFallbacks = fallbacksMatch
    ? fallbacksMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    : [];

  const tokensRegex = /custom_model_max_tokens\s*=\s*(\d+)/;
  const tokensMatch = currentConfigContent.match(tokensRegex);
  const currentTokens = tokensMatch ? parseInt(tokensMatch[1], 10) : null;

  console.log(`Current PR-Agent Action: ${currentTag} (${currentSha})`);
  console.log(`Current Primary Model:   ${currentModel}`);
  console.log(`Current Fallback Models: ${JSON.stringify(currentFallbacks)}`);
  console.log(`Current Max Tokens:      ${currentTokens}`);

  // 1. Check latest PR-Agent action release
  const latestRelease = await getLatestPrAgentRelease();
  console.log(`\nLatest PR-Agent Action:  ${latestRelease.tag} (${latestRelease.sha})`);

  // 2. Check base actions in pr-agent.yml (e.g. actions/checkout, actions/github-script)
  const baseActionsRegex = /uses:\s+(actions\/[a-zA-Z0-9_-]+)@(v\d+)/g;
  const baseActionUpdates = [];
  let baseActionMatch;
  while ((baseActionMatch = baseActionsRegex.exec(currentWorkflowContent)) !== null) {
    const actionRepo = baseActionMatch[1];
    const currentVersion = baseActionMatch[2];
    const latestVersion = await getLatestActionMajorVersion(actionRepo);
    if (latestVersion && latestVersion !== currentVersion) {
      baseActionUpdates.push({ actionRepo, currentVersion, latestVersion });
    }
  }

  // 3. Query models
  const openRouterModels = await getOpenRouterCatalog();
  const litellmCatalog = await getLiteLlmModelCatalog();

  const latestGeminiFlash = findLatestGeminiFlash(openRouterModels);
  if (!latestGeminiFlash) {
    throw new Error('Could not find any suitable Gemini Flash model in catalog');
  }

  // Gemini model names: OpenRouter has "google/gemini-3.8-flash", direct is "gemini/gemini-3.8-flash"
  const directGeminiModelId = latestGeminiFlash.id.replace(/^google\//, '');
  const proposedPrimaryModel = `gemini/${directGeminiModelId}`;
  const proposedGeminiMirror = `openrouter/${latestGeminiFlash.id}`;

  // Determine low-cost fallback family preference
  let preferredFamily = preferFamilyArg;
  if (!preferredFamily) {
    if (currentFallbacks.some((f) => f.includes('minimax'))) {
      preferredFamily = 'minimax';
    } else if (currentFallbacks.some((f) => f.includes('luna'))) {
      preferredFamily = 'luna';
    } else {
      preferredFamily = 'luna'; // Default
    }
  }

  const lowCostModel = findLowCostFallback(openRouterModels, preferredFamily);
  if (!lowCostModel) {
    throw new Error('Could not find any low cost fallback model');
  }
  const proposedLowCostFallback = `openrouter/${lowCostModel.id}`;
  const proposedFallbacks = [proposedLowCostFallback, proposedGeminiMirror];

  // Calculate lowest common context tokens
  const contextWindows = [
    latestGeminiFlash.context_length || 1048576,
    lowCostModel.context_length || 1048576,
  ];
  const proposedTokens = Math.min(...contextWindows);

  // Check LiteLLM recognition
  if (litellmCatalog) {
    const geminiRecognized = Boolean(litellmCatalog[proposedPrimaryModel] || litellmCatalog[directGeminiModelId]);
    const lowCostRecognized = Boolean(litellmCatalog[proposedLowCostFallback] || litellmCatalog[lowCostModel.id]);
    console.log(`LiteLLM primary recognized: ${geminiRecognized ? 'yes' : 'via custom token override'}`);
    console.log(`LiteLLM fallback recognized: ${lowCostRecognized ? 'yes' : 'via custom token override'}`);
  }

  console.log(`\nProposed Primary Model:  ${proposedPrimaryModel}`);
  console.log(`Proposed Fallback Models: ${JSON.stringify(proposedFallbacks)}`);
  console.log(`Proposed Max Tokens:      ${proposedTokens}`);

  // Check for changes
  const actionChanged = currentTag !== latestRelease.tag || currentSha !== latestRelease.sha;
  const baseActionsChanged = baseActionUpdates.length > 0;
  const modelChanged = currentModel !== proposedPrimaryModel;
  const fallbacksChanged = JSON.stringify(currentFallbacks) !== JSON.stringify(proposedFallbacks);
  const tokensChanged = currentTokens !== proposedTokens;

  const hasChanges = actionChanged || baseActionsChanged || modelChanged || fallbacksChanged || tokensChanged;

  const changesList = [];
  if (actionChanged) {
    changesList.push(`- **PR-Agent Action**: \`${currentTag}\` (\`${currentSha?.slice(0, 7)}\`) → [\`${latestRelease.tag}\`](${latestRelease.htmlUrl}) (\`${latestRelease.sha.slice(0, 7)}\`)`);
  }
  for (const b of baseActionUpdates) {
    changesList.push(`- **Base Action (${b.actionRepo})**: \`${b.currentVersion}\` → \`${b.latestVersion}\``);
  }
  if (modelChanged) {
    changesList.push(`- **Primary Model**: \`${currentModel}\` → \`${proposedPrimaryModel}\``);
  }
  if (fallbacksChanged) {
    changesList.push(`- **Fallback Models**: \`${JSON.stringify(currentFallbacks)}\` → \`${JSON.stringify(proposedFallbacks)}\``);
  }
  if (tokensChanged) {
    changesList.push(`- **Max Context Tokens**: \`${currentTokens}\` → \`${proposedTokens}\``);
  }

  if (!hasChanges) {
    console.log('\n✅ All PR-Agent configurations and models are already up-to-date!');
    if (isGitHubOutput && process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'has_changes=false\n');
    }
    return;
  }

  console.log('\n⚠️ Updates detected:');
  changesList.forEach((c) => console.log(c));

  // Update workflow file
  let newWorkflowContent = currentWorkflowContent;
  if (actionChanged && actionMatch) {
    newWorkflowContent = newWorkflowContent.replace(
      actionRegex,
      `uses: the-pr-agent/pr-agent@${latestRelease.sha} #${latestRelease.tag}`
    );
  }
  for (const b of baseActionUpdates) {
    newWorkflowContent = newWorkflowContent.replace(
      new RegExp(`uses:\\s+${b.actionRepo}@${b.currentVersion}`, 'g'),
      `uses: ${b.actionRepo}@${b.latestVersion}`
    );
  }

  // Update .pr_agent.toml file
  let newConfigContent = currentConfigContent;
  if (modelChanged && modelMatch) {
    newConfigContent = newConfigContent.replace(modelRegex, `model = "${proposedPrimaryModel}"`);
  }
  if (fallbacksChanged && fallbacksMatch) {
    const formattedFallbacks = JSON.stringify(proposedFallbacks).replace(/,/g, ', ');
    newConfigContent = newConfigContent.replace(fallbacksRegex, `fallback_models = ${formattedFallbacks}`);
  }
  if (tokensChanged && tokensMatch) {
    newConfigContent = newConfigContent.replace(
      /custom_model_max_tokens\s*=\s*\d+/,
      `custom_model_max_tokens = ${proposedTokens}`
    );
    newConfigContent = newConfigContent.replace(
      /max_model_tokens\s*=\s*\d+/,
      `max_model_tokens = ${proposedTokens}`
    );
  }

  if (!isDryRun) {
    fs.writeFileSync(prAgentWorkflowPath, newWorkflowContent, 'utf8');
    fs.writeFileSync(prAgentConfigPath, newConfigContent, 'utf8');
    console.log('\n💾 Successfully wrote updates to disk.');
  } else {
    console.log('\n[Dry Run] Files were not modified on disk.');
  }

  let prTitle = 'chore: update PR-Agent configuration';
  if (actionChanged && (modelChanged || fallbacksChanged)) {
    prTitle = `chore: update PR-Agent to ${latestRelease.tag} and latest models`;
  } else if (actionChanged) {
    prTitle = `chore: update PR-Agent action to ${latestRelease.tag}`;
  } else if (modelChanged || fallbacksChanged) {
    prTitle = `chore: update PR-Agent models (${proposedPrimaryModel.replace('gemini/', '')})`;
  } else if (baseActionsChanged) {
    prTitle = 'chore: update base actions in PR-Agent workflow';
  }

  const prBody = `## 🤖 Automated PR-Agent & Model Upgrade

Weekly automated check detected newer versions or model releases.

### Summary of Changes
${changesList.join('\n')}

### Model Specifications
| Model | Context Window | Prompt Pricing | Completion Pricing |
|---|---|---|---|
| **Primary (Gemini)** \`${proposedPrimaryModel}\` | ${latestGeminiFlash.context_length?.toLocaleString()} tokens | Free (Direct Gemini API) | Free (Direct Gemini API) |
| **Fallback 1** \`${proposedLowCostFallback}\` | ${lowCostModel.context_length?.toLocaleString()} tokens | $${Number(lowCostModel.pricing?.prompt || 0) * 1_000_000} / 1M | $${Number(lowCostModel.pricing?.completion || 0) * 1_000_000} / 1M |
| **Fallback 2 (Mirror)** \`${proposedGeminiMirror}\` | ${latestGeminiFlash.context_length?.toLocaleString()} tokens | $${Number(latestGeminiFlash.pricing?.prompt || 0) * 1_000_000} / 1M | $${Number(latestGeminiFlash.pricing?.completion || 0) * 1_000_000} / 1M |

---
*Auto-generated by \`tools/workflows/check-pr-agent-updates.mjs\`*
`;

  if (isGitHubOutput) {
    if (process.env.GITHUB_OUTPUT) {
      const delimiter = crypto.randomUUID();
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=true\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr_title=${prTitle}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr_body<<${delimiter}\n${prBody}\n${delimiter}\n`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, prBody);
    }
  }
}

main().catch((err) => {
  console.error('Error running check-pr-agent-updates:', err);
  process.exit(1);
});
