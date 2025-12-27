#!/usr/bin/env node

/**
 * Claude Plugins Marketplace Validator
 *
 * Validates marketplace.json and all plugin.json files for:
 * - Schema compliance
 * - Unique plugin names
 * - Reserved name restrictions
 * - Sensitive pattern detection
 * - Dependency existence
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Validation result types
const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Reserved plugin names that should not be used
const RESERVED_NAMES = [
  'claude',
  'anthropic',
  'claude-code',
  'official',
  'core',
  'system',
  'built-in',
  'internal'
];

// Patterns that might indicate secrets or sensitive data
const SENSITIVE_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /secret[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /token\s*[:=]\s*['"][^'"]+['"]/gi,
  /sk-[a-zA-Z0-9]{20,}/g,  // OpenAI-style keys
  /ghp_[a-zA-Z0-9]{36}/g,  // GitHub personal access tokens
  /ghr_[a-zA-Z0-9]{36}/g,  // GitHub refresh tokens
  /github_pat_[a-zA-Z0-9_]{22,}/g, // GitHub PATs (new format)
];

// Valid categories for plugins
const VALID_CATEGORIES = [
  'development',
  'productivity',
  'testing',
  'debugging',
  'database',
  'deployment',
  'monitoring',
  'design',
  'security',
  'learning',
  'cicd',
  'gitops',
  'documentation',
  'code-review',
  'architecture',
  'operations',
  'quality-gates',
  'core-workflow',
  'task-management',
  'verification',
  'foundation',
  'memory',
  'code-quality',
  'data',
  'ai-ml',
  'infrastructure',
  'integration'
];

// JSON Schemas
const marketplaceSchema = {
  type: 'object',
  required: ['name', 'description', 'owner', 'plugins'],
  properties: {
    $schema: { type: 'string' },
    name: { type: 'string', minLength: 1 },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
    description: { type: 'string', minLength: 10 },
    owner: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        github: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    },
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'source'],
        properties: {
          name: { type: 'string', minLength: 1, pattern: '^[a-z0-9-]+$' },
          description: { type: 'string', minLength: 10 },
          category: { type: 'string', enum: VALID_CATEGORIES },
          source: { type: 'string' },
          homepage: { type: 'string', format: 'uri' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    collections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'plugins'],
        properties: {
          name: { type: 'string', minLength: 1, pattern: '^[a-z0-9-]+$' },
          description: { type: 'string', minLength: 10 },
          plugins: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};

const pluginSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1, pattern: '^[a-z0-9-]+$' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
    description: { type: 'string' },
    author: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            url: { type: 'string', format: 'uri' }
          }
        }
      ]
    },
    homepage: { type: 'string', format: 'uri' },
    repository: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            type: { type: 'string' },
            url: { type: 'string' },
            directory: { type: 'string' }
          }
        }
      ]
    },
    license: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    category: { type: 'string', enum: VALID_CATEGORIES },
    dependencies: { type: 'array', items: { type: 'string' } }
  }
};

class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  add(severity, message, file = null) {
    const entry = { message, file };
    switch (severity) {
      case SEVERITY.ERROR:
        this.errors.push(entry);
        break;
      case SEVERITY.WARNING:
        this.warnings.push(entry);
        break;
      case SEVERITY.INFO:
        this.info.push(entry);
        break;
    }
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  get isValid() {
    return !this.hasErrors;
  }

  print() {
    console.log('\n' + chalk.bold('Validation Results'));
    console.log('='.repeat(50));

    if (this.errors.length > 0) {
      console.log(chalk.red.bold(`\nErrors (${this.errors.length}):`));
      this.errors.forEach(e => {
        console.log(chalk.red(`  ✗ ${e.message}`));
        if (e.file) console.log(chalk.gray(`    File: ${e.file}`));
      });
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold(`\nWarnings (${this.warnings.length}):`));
      this.warnings.forEach(w => {
        console.log(chalk.yellow(`  ⚠ ${w.message}`));
        if (w.file) console.log(chalk.gray(`    File: ${w.file}`));
      });
    }

    if (this.info.length > 0) {
      console.log(chalk.blue.bold(`\nInfo (${this.info.length}):`));
      this.info.forEach(i => {
        console.log(chalk.blue(`  ℹ ${i.message}`));
      });
    }

    console.log('\n' + '='.repeat(50));
    if (this.isValid) {
      console.log(chalk.green.bold('✓ Validation PASSED'));
    } else {
      console.log(chalk.red.bold('✗ Validation FAILED'));
    }
    console.log();
  }
}

function readJSON(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function validateMarketplace(result) {
  const marketplacePath = join(ROOT_DIR, '.claude-plugin', 'marketplace.json');

  if (!existsSync(marketplacePath)) {
    result.add(SEVERITY.ERROR, 'marketplace.json not found', marketplacePath);
    return null;
  }

  const marketplace = readJSON(marketplacePath);
  if (!marketplace) {
    result.add(SEVERITY.ERROR, 'marketplace.json is not valid JSON', marketplacePath);
    return null;
  }

  // Schema validation
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(marketplaceSchema);

  if (!validate(marketplace)) {
    validate.errors.forEach(err => {
      result.add(SEVERITY.ERROR, `Schema error: ${err.instancePath} ${err.message}`, marketplacePath);
    });
  }

  // Check for duplicate plugin names
  const pluginNames = marketplace.plugins?.map(p => p.name) || [];
  const duplicates = pluginNames.filter((name, i) => pluginNames.indexOf(name) !== i);
  duplicates.forEach(name => {
    result.add(SEVERITY.ERROR, `Duplicate plugin name in marketplace: ${name}`, marketplacePath);
  });

  // Check for reserved names
  pluginNames.forEach(name => {
    if (RESERVED_NAMES.includes(name.toLowerCase())) {
      result.add(SEVERITY.ERROR, `Reserved plugin name: ${name}`, marketplacePath);
    }
  });

  result.add(SEVERITY.INFO, `Found ${marketplace.plugins?.length || 0} plugins in marketplace.json`);
  result.add(SEVERITY.INFO, `Found ${marketplace.collections?.length || 0} collections in marketplace.json`);

  return marketplace;
}

async function validatePlugins(result, marketplace) {
  const pluginDirs = await glob('plugins/*/.claude-plugin/plugin.json', { cwd: ROOT_DIR });

  if (pluginDirs.length === 0) {
    result.add(SEVERITY.WARNING, 'No plugins found in plugins/ directory');
    return;
  }

  result.add(SEVERITY.INFO, `Found ${pluginDirs.length} plugin directories`);

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(pluginSchema);

  const allPluginNames = new Set();
  const marketplacePluginNames = new Set(marketplace?.plugins?.map(p => p.name) || []);

  for (const pluginPath of pluginDirs) {
    const fullPath = join(ROOT_DIR, pluginPath);
    const plugin = readJSON(fullPath);
    const pluginDir = dirname(dirname(fullPath));
    const pluginDirName = basename(pluginDir);

    if (!plugin) {
      result.add(SEVERITY.ERROR, `plugin.json is not valid JSON`, fullPath);
      continue;
    }

    // Schema validation
    if (!validate(plugin)) {
      validate.errors.forEach(err => {
        result.add(SEVERITY.ERROR, `Schema error: ${err.instancePath} ${err.message}`, fullPath);
      });
    }

    // Check plugin name matches directory
    if (plugin.name !== pluginDirName) {
      result.add(SEVERITY.WARNING, `Plugin name "${plugin.name}" doesn't match directory "${pluginDirName}"`, fullPath);
    }

    // Check for duplicate names
    if (allPluginNames.has(plugin.name)) {
      result.add(SEVERITY.ERROR, `Duplicate plugin name: ${plugin.name}`, fullPath);
    }
    allPluginNames.add(plugin.name);

    // Check for reserved names
    if (RESERVED_NAMES.includes(plugin.name.toLowerCase())) {
      result.add(SEVERITY.ERROR, `Reserved plugin name: ${plugin.name}`, fullPath);
    }

    // Check if plugin is in marketplace
    if (!marketplacePluginNames.has(plugin.name)) {
      result.add(SEVERITY.WARNING, `Plugin "${plugin.name}" not listed in marketplace.json`, fullPath);
    }

    // Check for README
    const readmePath = join(pluginDir, 'README.md');
    if (!existsSync(readmePath)) {
      result.add(SEVERITY.WARNING, `Missing README.md for plugin "${plugin.name}"`, pluginDir);
    }

    // Check for skills or agents directory
    const skillsDir = join(pluginDir, 'skills');
    const agentsDir = join(pluginDir, 'agents');
    const commandsDir = join(pluginDir, 'commands');

    if (!existsSync(skillsDir) && !existsSync(agentsDir) && !existsSync(commandsDir)) {
      result.add(SEVERITY.WARNING, `Plugin "${plugin.name}" has no skills/, agents/, or commands/ directory`, pluginDir);
    }

    // Check for sensitive patterns in plugin files
    await scanForSecrets(result, pluginDir);
  }

  // Check marketplace plugins exist
  for (const plugin of marketplace?.plugins || []) {
    const pluginDir = join(ROOT_DIR, plugin.source);
    if (!existsSync(pluginDir)) {
      result.add(SEVERITY.ERROR, `Marketplace plugin source not found: ${plugin.source}`, pluginDir);
    }
  }

  // Check collection plugins exist
  for (const collection of marketplace?.collections || []) {
    for (const pluginName of collection.plugins || []) {
      if (!allPluginNames.has(pluginName) && !marketplacePluginNames.has(pluginName)) {
        result.add(SEVERITY.WARNING, `Collection "${collection.name}" references unknown plugin: ${pluginName}`);
      }
    }
  }
}

async function scanForSecrets(result, dir) {
  const files = await glob('**/*.{md,json,js,ts}', { cwd: dir, ignore: 'node_modules/**' });

  for (const file of files) {
    const fullPath = join(dir, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');

      for (const pattern of SENSITIVE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          result.add(SEVERITY.ERROR, `Potential secret detected: ${pattern.source.substring(0, 30)}...`, fullPath);
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const marketplaceOnly = args.includes('--marketplace-only');
  const pluginsOnly = args.includes('--plugins-only');

  console.log(chalk.bold('\nClaude Plugins Marketplace Validator\n'));

  const result = new ValidationResult();

  let marketplace = null;
  if (!pluginsOnly) {
    console.log('Validating marketplace.json...');
    marketplace = validateMarketplace(result);
  }

  if (!marketplaceOnly) {
    console.log('Validating plugins...');
    await validatePlugins(result, marketplace);
  }

  result.print();

  process.exit(result.hasErrors ? 1 : 0);
}

main().catch(err => {
  console.error(chalk.red('Validation failed with error:'), err);
  process.exit(1);
});
