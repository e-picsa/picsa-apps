#!/usr/bin/env node

/**
 * Checks for the latest LiteLLM-compatible Google Gemini Flash and Luna
 * models, then updates only .pr_agent.toml.
 *
 * If a primary or fallback model changes, the script checks whether a newer
 * PR-Agent action release is available. It reports that update through
 * GitHub Actions outputs so the workflow can post a PR conversation comment.
 * This script never modifies workflow files.
 *
 * Usage:
 *   node .github/workflows/pr-agent-update-check.mjs [--dry-run] [--output-github]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '../../');

const workflowPath = path.join(rootDir, '.github/workflows/pr-agent.yml');
const configPath = path.join(rootDir, '.pr_agent.toml');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isGitHubOutput = args.includes('--output-github');

const ALLOWED_HOSTS = new Set(['api.github.com', 'openrouter.ai', 'raw.githubusercontent.com']);

function validateUrl(input) {
  let url;

  try {
    url = new URL(input);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`HTTPS required for URL: ${input}`);
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Unexpected URL host: ${url.hostname}`);
  }

  return url;
}

async function fetchJson(input, options = {}) {
  const url = validateUrl(input);
  const headers = {
    'User-Agent': 'picsa-pr-agent-checker',
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.pathname}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function parseVersionNumbers(value) {
  const match = value.match(/(\d+(?:\.\d+)*)/);
  return match ? match[1].split('.').map(Number) : [];
}

function compareVersions(a, b) {
  const partsA = parseVersionNumbers(a);
  const partsB = parseVersionNumbers(b);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA !== partB) {
      return partA - partB;
    }
  }

  return 0;
}

async function getOpenRouterModels() {
  const response = await fetchJson('https://openrouter.ai/api/v1/models');
  return response.data || [];
}

async function getLiteLlmCatalog() {
  return fetchJson('https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json');
}

function isLiteLlmModel(modelKey, catalog) {
  const lowerKey = modelKey.toLowerCase();
  const withoutProvider = lowerKey.replace(/^(openrouter|gemini)\//, '');

  return Boolean(catalog[lowerKey] || catalog[withoutProvider] || catalog[modelKey]);
}

function findLatestGeminiFlash(models, catalog) {
  const candidates = models.filter((model) => {
    const id = model.id.toLowerCase();

    if (
      !id.startsWith('google/gemini-') ||
      !id.includes('flash') ||
      id.includes('image') ||
      id.includes('batch') ||
      id.includes('preview')
    ) {
      return false;
    }

    const directModel = `gemini/${model.id.replace(/^google\//, '')}`;
    return isLiteLlmModel(directModel, catalog);
  });

  candidates.sort((a, b) => {
    const versionOrder = compareVersions(b.id, a.id);

    if (versionOrder !== 0) {
      return versionOrder;
    }

    // Prefer standard Flash over Flash-Lite at the same version.
    const aIsLite = a.id.includes('flash-lite');
    const bIsLite = b.id.includes('flash-lite');

    if (aIsLite !== bIsLite) {
      return aIsLite ? 1 : -1;
    }

    return (b.created || 0) - (a.created || 0);
  });

  return candidates[0] || null;
}

function findLatestLuna(models, catalog) {
  const candidates = models.filter((model) => {
    const id = model.id.toLowerCase();
    const isLuna =
      /(?:^|[-/])luna(?:$|[-/])/.test(id) && !id.includes('batch') && (model.context_length || 0) >= 128000;

    return isLuna && isLiteLlmModel(`openrouter/${model.id}`, catalog);
  });

  candidates.sort((a, b) => {
    const versionOrder = compareVersions(b.id, a.id);

    if (versionOrder !== 0) {
      return versionOrder;
    }

    return (b.created || 0) - (a.created || 0);
  });

  return candidates[0] || null;
}

function writeNoChangesOutput() {
  if (isGitHubOutput && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'has_changes=false\n');
  }
}

async function getLatestPrAgentRelease() {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const release = await fetchJson('https://api.github.com/repos/the-pr-agent/pr-agent/releases/latest', { headers });
  const tag = String(release.tag_name || '');

  if (!/^[a-zA-Z0-9._-]+$/.test(tag)) {
    throw new Error(`Unexpected PR-Agent release tag: ${tag}`);
  }

  const commit = await fetchJson(
    `https://api.github.com/repos/the-pr-agent/pr-agent/commits/${encodeURIComponent(tag)}`,
    { headers },
  );
  const sha = String(commit.sha || '');

  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error(`Unexpected commit SHA for PR-Agent release ${tag}`);
  }

  return { tag, sha, htmlUrl: release.html_url };
}

function getCurrentActionPin(workflowContent) {
  const match = workflowContent.match(/uses:\s+the-pr-agent\/pr-agent@([a-f0-9]{40})\s*#\s*([^\s\n]+)/);

  return match ? { sha: match[1], tag: match[2] } : null;
}

function makeActionUpdateNote(currentPin, latestRelease) {
  if (!currentPin) {
    return 'Could not parse the current action pin in ' + '`.github/workflows/pr-agent.yml`; please check it manually.';
  }

  if (currentPin.sha === latestRelease.sha && currentPin.tag === latestRelease.tag) {
    return '';
  }

  return (
    `PR-Agent action update available: this workflow currently uses ` +
    `\`${currentPin.tag}\` (\`${currentPin.sha.slice(0, 7)}\`), while the ` +
    `latest release is [\`${latestRelease.tag}\`](${latestRelease.htmlUrl}) ` +
    `(\`${latestRelease.sha.slice(0, 7)}\`). Consider updating the pinned ` +
    `action in \`.github/workflows/pr-agent.yml\` separately.`
  );
}

function writeGitHubOutputs({ title, body, actionNote }) {
  if (!isGitHubOutput || !process.env.GITHUB_OUTPUT) {
    return;
  }

  const output = process.env.GITHUB_OUTPUT;
  const bodyDelimiter = crypto.randomUUID();

  fs.appendFileSync(output, 'has_changes=true\n');
  fs.appendFileSync(output, `pr_title=${title}\n`);
  fs.appendFileSync(output, `pr_body<<${bodyDelimiter}\n${body}\n${bodyDelimiter}\n`);

  if (actionNote) {
    const noteDelimiter = crypto.randomUUID();

    fs.appendFileSync(output, 'action_update_available=true\n');
    fs.appendFileSync(output, `action_note<<${noteDelimiter}\n${actionNote}\n${noteDelimiter}\n`);
  } else {
    fs.appendFileSync(output, 'action_update_available=false\n');
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
  }
}

async function main() {
  console.log('--- Checking for PR-Agent model updates ---');

  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow file not found: ${workflowPath}`);
  }

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const configContent = fs.readFileSync(configPath, 'utf8');

  const modelRegex = /model\s*=\s*"(gemini\/[^"]+)"/;
  const fallbacksRegex = /fallback_models\s*=\s*\[([^\]]*)\]/;
  const tokensRegex = /custom_model_max_tokens\s*=\s*(\d+)/;

  const modelMatch = configContent.match(modelRegex);
  const fallbacksMatch = configContent.match(fallbacksRegex);
  const tokensMatch = configContent.match(tokensRegex);

  if (!modelMatch || !fallbacksMatch || !tokensMatch) {
    throw new Error('Could not parse model, fallback_models, or custom_model_max_tokens in .pr_agent.toml');
  }

  const currentModel = modelMatch[1];
  const currentFallbacks = fallbacksMatch[1]
    .split(',')
    .map((value) => value.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  const currentTokens = Number.parseInt(tokensMatch[1], 10);

  console.log(`Current Primary Model:   ${currentModel}`);
  console.log(`Current Fallback Models: ${JSON.stringify(currentFallbacks)}`);
  console.log(`Current Max Tokens:      ${currentTokens}`);

  const [models, catalog] = await Promise.all([getOpenRouterModels(), getLiteLlmCatalog()]);

  const gemini = findLatestGeminiFlash(models, catalog);
  const luna = findLatestLuna(models, catalog);

  if (!gemini) {
    throw new Error('Could not find a LiteLLM-compatible Google Gemini Flash model');
  }

  if (!luna) {
    throw new Error('Could not find a LiteLLM-compatible Luna model');
  }

  const geminiId = gemini.id.replace(/^google\//, '');
  const proposedModel = `gemini/${geminiId}`;
  const proposedFallbacks = [`openrouter/${luna.id}`];
  const proposedTokens = Math.min(gemini.context_length || 1048576, luna.context_length || 1048576);

  const modelChanged = currentModel !== proposedModel;
  const fallbacksChanged = JSON.stringify(currentFallbacks) !== JSON.stringify(proposedFallbacks);
  const tokensChanged = currentTokens !== proposedTokens;

  console.log(`\nProposed Primary Model:  ${proposedModel}`);
  console.log(`Proposed Fallback Models: ${JSON.stringify(proposedFallbacks)}`);
  console.log(`Proposed Max Tokens:      ${proposedTokens}`);

  if (!modelChanged && !fallbacksChanged && !tokensChanged) {
    console.log('\nModel configuration is already up-to-date.');
    writeNoChangesOutput();
    return;
  }

  const changes = [];

  if (modelChanged) {
    changes.push(`- **Primary Model:** \`${currentModel}\` → \`${proposedModel}\``);
  }

  if (fallbacksChanged) {
    changes.push(
      `- **Fallback Models:** \`${JSON.stringify(currentFallbacks)}\` → \`${JSON.stringify(proposedFallbacks)}\``,
    );
  }

  if (tokensChanged) {
    changes.push(`- **Max Context Tokens:** \`${currentTokens}\` → \`${proposedTokens}\``);
  }

  let updatedConfig = configContent;

  if (modelChanged) {
    updatedConfig = updatedConfig.replace(modelRegex, `model = "${proposedModel}"`);
  }

  if (fallbacksChanged) {
    const formattedFallbacks = JSON.stringify(proposedFallbacks).replace(/,/g, ', ');

    updatedConfig = updatedConfig.replace(fallbacksRegex, `fallback_models = ${formattedFallbacks}`);
  }

  if (tokensChanged) {
    updatedConfig = updatedConfig.replace(tokensRegex, `custom_model_max_tokens = ${proposedTokens}`);
    updatedConfig = updatedConfig.replace(/max_model_tokens\s*=\s*\d+/, `max_model_tokens = ${proposedTokens}`);
  }

  if (!isDryRun) {
    // Deliberately update only the TOML configuration.
    fs.writeFileSync(configPath, updatedConfig, 'utf8');
    console.log('\nUpdated .pr_agent.toml.');
  } else {
    console.log('\n[Dry Run] .pr_agent.toml was not modified.');
  }

  let actionNote = '';

  // Only suggest an action update when a primary or fallback model changes.
  if (modelChanged || fallbacksChanged) {
    try {
      const currentPin = getCurrentActionPin(workflowContent);
      const latestRelease = await getLatestPrAgentRelease();
      actionNote = makeActionUpdateNote(currentPin, latestRelease);
    } catch (error) {
      // An action-release lookup failure should not block a model PR.
      console.warn('Warning: Could not check the PR-Agent action release:', error.message);
    }
  }

  const titleParts = [];

  if (modelChanged) {
    titleParts.push(`primary ${geminiId}`);
  }

  if (fallbacksChanged) {
    titleParts.push(`fallback ${luna.id}`);
  }

  const title = `chore: update PR-Agent models (${titleParts.join(', ')})`;

  const body = `## 🤖 Automated PR-Agent Model Upgrade

Weekly automated check detected model or context configuration updates.

### Summary of Changes
${changes.join('\n')}

### Model Specifications
| Model | Context Window | Prompt Pricing | Completion Pricing |
|---|---|---|---|
| **Primary (Gemini)** \`${proposedModel}\` | ${gemini.context_length?.toLocaleString() ?? 'Unknown'} tokens | Free (Direct Gemini API) | Free (Direct Gemini API) |
| **Fallback (Luna)** \`${proposedFallbacks[0]}\` | ${luna.context_length?.toLocaleString() ?? 'Unknown'} tokens | $${Number(luna.pricing?.prompt || 0) * 1_000_000} / 1M | $${Number(luna.pricing?.completion || 0) * 1_000_000} / 1M |

---
*Auto-generated by \`.github/workflows/pr-agent-update-check.mjs\`*
`;

  writeGitHubOutputs({ title, body, actionNote });
}

main().catch((error) => {
  console.error('Error running pr-agent-update-check.mjs:', error);
  process.exit(1);
});
