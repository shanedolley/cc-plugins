#!/usr/bin/env node

/**
 * Claude Plugins Migration Script
 *
 * Migrates skills and agents from claude-setup format to claude-plugins marketplace format.
 *
 * Usage:
 *   node scripts/migrate.js --source /path/to/claude-setup
 *   node scripts/migrate.js --source /path/to/claude-setup --dry-run
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PLUGINS_DIR = join(ROOT_DIR, 'plugins');

// Category mapping from old format to new format
const CATEGORY_MAP = {
  'Debugging': 'debugging',
  'Development': 'development',
  'Testing': 'testing',
  'CI/CD': 'cicd',
  'GitOps': 'gitops',
  'Security': 'security',
  'Documentation': 'documentation',
  'Architecture': 'architecture',
  'Database': 'database',
  'Performance': 'monitoring',
  'Code Review': 'code-review',
  'Learning': 'learning',
  'Productivity': 'productivity',
  'default': 'development'
};

// Essential plugins for the "essential" collection
const ESSENTIAL_PLUGINS = [
  'developer',
  'systematic-debugging',
  'test-driven-development',
  'requesting-code-review',
  'architect'
];

// DevOps plugins for the "devops" collection
const DEVOPS_PLUGINS = [
  'cicd-pipelines',
  'cicd-deployments',
  'cicd-release',
  'gitops-branching',
  'gitops-worktrees',
  'gitops-completion',
  'gitops-engineer'
];

// Testing plugins for the "testing" collection
const TESTING_PLUGINS = [
  'test-driven-development',
  'testing-anti-patterns',
  'test-analyst-expert',
  'verification-before-completion',
  'verification-runner'
];

// Debugging plugins for the "debugging" collection
const DEBUGGING_PLUGINS = [
  'systematic-debugging',
  'debugger',
  'root-cause-tracing',
  'condition-based-waiting',
  'defense-in-depth'
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    dryRun: args.includes('--dry-run'),
    skillsOnly: args.includes('--skills-only'),
    agentsOnly: args.includes('--agents-only')
  };

  const sourceIndex = args.indexOf('--source');
  if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    options.source = args[sourceIndex + 1];
  }

  return options;
}

function readJSON(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function writeJSON(filePath, data, dryRun = false) {
  const content = JSON.stringify(data, null, 2) + '\n';
  if (dryRun) {
    console.log(chalk.gray(`  [DRY RUN] Would write: ${filePath}`));
    return;
  }
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content);
}

function copyFile(src, dest, dryRun = false) {
  if (dryRun) {
    console.log(chalk.gray(`  [DRY RUN] Would copy: ${src} -> ${dest}`));
    return;
  }
  const dir = dirname(dest);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  copyFileSync(src, dest);
}

function mapCategory(oldCategory) {
  if (!oldCategory) return CATEGORY_MAP.default;
  return CATEGORY_MAP[oldCategory] || oldCategory.toLowerCase().replace(/\s+/g, '-');
}

function migrateSkill(skillName, sourceDir, dryRun) {
  const skillDir = join(sourceDir, 'skills', skillName);

  if (!existsSync(skillDir)) {
    console.log(chalk.yellow(`  ⚠ Skill directory not found: ${skillDir}`));
    return null;
  }

  const metadataPath = join(skillDir, 'metadata.json');
  const skillMdPath = join(skillDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.log(chalk.yellow(`  ⚠ SKILL.md not found for: ${skillName}`));
    return null;
  }

  // Read old metadata
  const oldMetadata = existsSync(metadataPath) ? readJSON(metadataPath) : {};

  // Create new plugin structure
  const pluginDir = join(PLUGINS_DIR, skillName);
  const pluginJsonDir = join(pluginDir, '.claude-plugin');
  const skillsDir = join(pluginDir, 'skills');

  // Create plugin.json
  const pluginJson = {
    name: skillName,
    version: oldMetadata.version || '1.0.0',
    description: oldMetadata.description || `Claude Code skill: ${skillName}`,
    author: {
      name: 'Shane Dolley',
      github: 'shanedolley'
    },
    category: mapCategory(oldMetadata.category),
    license: 'MIT',
    keywords: generateKeywords(skillName, oldMetadata)
  };

  // Add dependencies if present
  if (oldMetadata.dependencies?.skills?.length > 0) {
    pluginJson.dependencies = oldMetadata.dependencies.skills;
  }

  // Write files
  writeJSON(join(pluginJsonDir, 'plugin.json'), pluginJson, dryRun);

  // Copy SKILL.md
  copyFile(skillMdPath, join(skillsDir, `${skillName}.md`), dryRun);

  // Create README.md
  const readme = generateSkillReadme(skillName, oldMetadata, pluginJson);
  if (!dryRun) {
    const readmePath = join(pluginDir, 'README.md');
    mkdirSync(dirname(readmePath), { recursive: true });
    writeFileSync(readmePath, readme);
  } else {
    console.log(chalk.gray(`  [DRY RUN] Would create README.md`));
  }

  console.log(chalk.green(`  ✓ Migrated skill: ${skillName}`));

  return {
    name: skillName,
    description: pluginJson.description,
    category: pluginJson.category,
    source: `./plugins/${skillName}`,
    tags: pluginJson.keywords
  };
}

function migrateAgent(agentName, sourceDir, dryRun) {
  const agentDir = join(sourceDir, 'agents', agentName);

  if (!existsSync(agentDir)) {
    console.log(chalk.yellow(`  ⚠ Agent directory not found: ${agentDir}`));
    return null;
  }

  const metadataPath = join(agentDir, 'metadata.json');
  const agentMdPath = join(agentDir, 'AGENT.md');

  if (!existsSync(agentMdPath)) {
    console.log(chalk.yellow(`  ⚠ AGENT.md not found for: ${agentName}`));
    return null;
  }

  // Read old metadata
  const oldMetadata = existsSync(metadataPath) ? readJSON(metadataPath) : {};

  // Create new plugin structure
  const pluginDir = join(PLUGINS_DIR, agentName);
  const pluginJsonDir = join(pluginDir, '.claude-plugin');
  const agentsDir = join(pluginDir, 'agents');

  // Create plugin.json
  const pluginJson = {
    name: agentName,
    version: oldMetadata.version || '1.0.0',
    description: oldMetadata.description || `Claude Code agent: ${agentName}`,
    author: {
      name: 'Shane Dolley',
      github: 'shanedolley'
    },
    category: mapCategory(oldMetadata.category),
    license: 'MIT',
    keywords: generateKeywords(agentName, oldMetadata)
  };

  // Add dependencies if present
  if (oldMetadata.dependencies?.agents?.length > 0) {
    pluginJson.dependencies = oldMetadata.dependencies.agents;
  }

  // Write files
  writeJSON(join(pluginJsonDir, 'plugin.json'), pluginJson, dryRun);

  // Copy AGENT.md
  copyFile(agentMdPath, join(agentsDir, `${agentName}.md`), dryRun);

  // Create README.md
  const readme = generateAgentReadme(agentName, oldMetadata, pluginJson);
  if (!dryRun) {
    const readmePath = join(pluginDir, 'README.md');
    mkdirSync(dirname(readmePath), { recursive: true });
    writeFileSync(readmePath, readme);
  } else {
    console.log(chalk.gray(`  [DRY RUN] Would create README.md`));
  }

  console.log(chalk.green(`  ✓ Migrated agent: ${agentName}`));

  return {
    name: agentName,
    description: pluginJson.description,
    category: pluginJson.category,
    source: `./plugins/${agentName}`,
    tags: pluginJson.keywords
  };
}

function generateKeywords(name, metadata) {
  const keywords = new Set();

  // Add from name (split by hyphens)
  name.split('-').forEach(part => {
    if (part.length > 2) keywords.add(part);
  });

  // Add category
  if (metadata.category) {
    keywords.add(metadata.category.toLowerCase());
  }

  // Add some common contextual keywords
  if (name.includes('test')) keywords.add('testing');
  if (name.includes('debug')) keywords.add('debugging');
  if (name.includes('git')) keywords.add('git');
  if (name.includes('cicd') || name.includes('ci-cd')) keywords.add('automation');
  if (name.includes('review')) keywords.add('code-review');

  return Array.from(keywords).slice(0, 6);
}

function generateSkillReadme(name, oldMetadata, pluginJson) {
  return `# ${name}

${pluginJson.description}

## Installation

\`\`\`bash
/plugin install ${name}
\`\`\`

## Usage

This skill is automatically activated when relevant contexts are detected.

## Category

${pluginJson.category}

## Author

${pluginJson.author.name} ([@${pluginJson.author.github}](https://github.com/${pluginJson.author.github}))

## License

${pluginJson.license}
`;
}

function generateAgentReadme(name, oldMetadata, pluginJson) {
  return `# ${name}

${pluginJson.description}

## Installation

\`\`\`bash
/plugin install ${name}
\`\`\`

## Usage

Invoke this agent using the Task tool with \`subagent_type="${name}"\`.

## Category

${pluginJson.category}

## Author

${pluginJson.author.name} ([@${pluginJson.author.github}](https://github.com/${pluginJson.author.github}))

## License

${pluginJson.license}
`;
}

function updateMarketplace(plugins, dryRun) {
  const marketplacePath = join(ROOT_DIR, '.claude-plugin', 'marketplace.json');
  const marketplace = readJSON(marketplacePath) || {
    name: 'claude-plugins',
    version: '1.0.0',
    description: 'Curated collection of Claude Code skills and agents',
    owner: { name: 'Shane Dolley', github: 'shanedolley' },
    plugins: [],
    collections: []
  };

  // Add plugins
  marketplace.plugins = plugins.filter(p => p !== null);

  // Update collections
  const pluginNames = new Set(marketplace.plugins.map(p => p.name));

  marketplace.collections = [
    {
      name: 'essential',
      description: 'Core development workflow plugins for everyday use',
      plugins: ESSENTIAL_PLUGINS.filter(p => pluginNames.has(p))
    },
    {
      name: 'devops',
      description: 'CI/CD, GitOps, and infrastructure automation plugins',
      plugins: DEVOPS_PLUGINS.filter(p => pluginNames.has(p))
    },
    {
      name: 'testing',
      description: 'Test-driven development and quality assurance plugins',
      plugins: TESTING_PLUGINS.filter(p => pluginNames.has(p))
    },
    {
      name: 'debugging',
      description: 'Debugging, troubleshooting, and root cause analysis plugins',
      plugins: DEBUGGING_PLUGINS.filter(p => pluginNames.has(p))
    }
  ];

  writeJSON(marketplacePath, marketplace, dryRun);
  console.log(chalk.green(`\n✓ Updated marketplace.json with ${marketplace.plugins.length} plugins`));
}

async function main() {
  const options = parseArgs();

  if (!options.source) {
    console.log(chalk.yellow('Usage: node scripts/migrate.js --source /path/to/claude-setup [--dry-run]'));
    console.log(chalk.yellow('\nExample: node scripts/migrate.js --source ~/Development/personal/claude-setup'));
    process.exit(1);
  }

  if (!existsSync(options.source)) {
    console.log(chalk.red(`Source directory not found: ${options.source}`));
    process.exit(1);
  }

  console.log(chalk.bold('\nClaude Plugins Migration'));
  console.log('='.repeat(50));
  console.log(`Source: ${options.source}`);
  console.log(`Destination: ${PLUGINS_DIR}`);
  if (options.dryRun) {
    console.log(chalk.yellow('Mode: DRY RUN (no files will be modified)'));
  }
  console.log();

  const allPlugins = [];

  // Migrate skills
  if (!options.agentsOnly) {
    const skillsDir = join(options.source, 'skills');
    if (existsSync(skillsDir)) {
      const skills = readdirSync(skillsDir).filter(f =>
        !f.startsWith('.') &&
        existsSync(join(skillsDir, f, 'SKILL.md'))
      );

      console.log(chalk.bold(`\nMigrating ${skills.length} skills...`));

      for (const skill of skills) {
        const result = migrateSkill(skill, options.source, options.dryRun);
        if (result) allPlugins.push(result);
      }
    }
  }

  // Migrate agents
  if (!options.skillsOnly) {
    const agentsDir = join(options.source, 'agents');
    if (existsSync(agentsDir)) {
      const agents = readdirSync(agentsDir).filter(f =>
        !f.startsWith('.') &&
        existsSync(join(agentsDir, f, 'AGENT.md'))
      );

      console.log(chalk.bold(`\nMigrating ${agents.length} agents...`));

      for (const agent of agents) {
        const result = migrateAgent(agent, options.source, options.dryRun);
        if (result) allPlugins.push(result);
      }
    }
  }

  // Update marketplace.json
  console.log(chalk.bold('\nUpdating marketplace.json...'));
  updateMarketplace(allPlugins, options.dryRun);

  console.log('\n' + '='.repeat(50));
  console.log(chalk.green.bold('Migration complete!'));
  console.log(`Total plugins: ${allPlugins.length}`);
  console.log();
}

main().catch(err => {
  console.error(chalk.red('Migration failed:'), err);
  process.exit(1);
});
