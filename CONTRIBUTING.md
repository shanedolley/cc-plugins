# Contributing to Claude Plugins Marketplace

Thank you for your interest in contributing to the Claude Plugins Marketplace! This document provides guidelines for submitting new plugins and improving existing ones.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Quick Start](#quick-start)
- [Plugin Structure](#plugin-structure)
- [Submission Process](#submission-process)
- [Validation Requirements](#validation-requirements)
- [Common Issues](#common-issues)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- No malicious code or content
- Respect intellectual property

## Quick Start

### Creating a New Plugin

1. **Fork this repository**

2. **Create plugin directory**
   ```bash
   mkdir -p plugins/my-plugin/.claude-plugin
   mkdir -p plugins/my-plugin/skills  # or /agents, /commands
   ```

3. **Create plugin.json**
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "Brief description of what this plugin does",
     "author": {
       "name": "Your Name",
       "github": "your-username"
     },
     "category": "development",
     "license": "MIT",
     "keywords": ["keyword1", "keyword2"]
   }
   ```

4. **Add your skill/agent**
   - Skills: `plugins/my-plugin/skills/my-skill.md`
   - Agents: `plugins/my-plugin/agents/my-agent.md`

5. **Create README.md**
   ```markdown
   # my-plugin

   Description of your plugin.

   ## Installation

   \`\`\`bash
   /plugin install my-plugin
   \`\`\`

   ## Usage

   How to use this plugin...
   ```

6. **Submit PR**

## Plugin Structure

### Directory Layout

```
plugins/
└── my-plugin/
    ├── .claude-plugin/
    │   └── plugin.json       # Required: Plugin metadata
    ├── skills/               # Optional: Skill definitions
    │   └── my-skill.md
    ├── agents/               # Optional: Agent definitions
    │   └── my-agent.md
    ├── commands/             # Optional: Slash commands
    │   └── my-command.md
    └── README.md             # Recommended: Documentation
```

### plugin.json Schema

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique plugin name (lowercase, hyphens allowed) |
| `version` | No | Semantic version (e.g., "1.0.0") |
| `description` | No | Brief explanation (10+ characters recommended) |
| `author` | No | Author name, email, and/or URL |
| `category` | No | One of: development, productivity, testing, debugging, database, deployment, monitoring, design, security, learning, cicd, gitops, documentation, code-review, architecture, operations, quality-gates, core-workflow, task-management, verification, foundation, memory, code-quality, data, ai-ml, infrastructure, integration |
| `license` | No | License identifier (e.g., "MIT") |
| `keywords` | No | Array of discovery keywords |
| `dependencies` | No | Array of required plugin names |

### Skill Definition (SKILL.md)

Skills use Markdown format with optional YAML frontmatter:

```markdown
---
description: Brief description for auto-activation
triggers:
  - "keyword that triggers this skill"
---

# Skill Title

Detailed instructions for Claude when this skill is activated...
```

### Agent Definition (AGENT.md)

Agents define specialized personas:

```markdown
---
description: Role and expertise summary
capabilities:
  - Specific capability 1
  - Specific capability 2
---

# Agent Name

Detailed agent instructions, knowledge, and behavioral guidelines...
```

## Submission Process

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR-USERNAME/claude-plugins.git
cd claude-plugins
```

### 2. Create Plugin

Follow the [Plugin Structure](#plugin-structure) guidelines above.

### 3. Validate Locally

```bash
npm install
npm run validate
```

### 4. Submit PR

- Title: `feat: add [plugin-name] plugin`
- Description: Explain what the plugin does and why it's useful
- Ensure CI validation passes

### 5. Review Process

1. Automated validation runs on PR
2. Maintainer reviews for quality and safety
3. Feedback addressed (if any)
4. Merged and released automatically

## Validation Requirements

PRs must pass these automated checks:

### Required (Errors)

- [ ] Valid JSON in plugin.json and marketplace.json
- [ ] Plugin name is unique (no duplicates)
- [ ] Plugin name follows pattern: `^[a-z0-9-]+$`
- [ ] Plugin name is not reserved (claude, anthropic, official, etc.)
- [ ] No sensitive patterns detected (API keys, tokens, secrets)

### Recommended (Warnings)

- [ ] README.md exists for the plugin
- [ ] Description is at least 10 characters
- [ ] Plugin has skills/, agents/, or commands/ directory
- [ ] Dependencies (if declared) exist in marketplace

## Common Issues

### "Invalid JSON"

**Problem:** plugin.json has syntax errors.

**Solution:** Validate JSON using a linter:
```bash
cat plugins/my-plugin/.claude-plugin/plugin.json | jq .
```

### "Duplicate plugin name"

**Problem:** Another plugin already uses this name.

**Solution:** Choose a unique, descriptive name. Check existing plugins:
```bash
ls plugins/
```

### "Reserved name"

**Problem:** Using names like "claude", "anthropic", "official".

**Solution:** Use a descriptive name that doesn't suggest official status.

### "Missing skills/agents/commands"

**Problem:** Plugin has no content directories.

**Solution:** Add at least one of:
- `skills/` - for auto-activating skills
- `agents/` - for specialized subagents
- `commands/` - for slash commands

### "Potential secret detected"

**Problem:** Files contain patterns matching API keys or tokens.

**Solution:** Remove any secrets. Use environment variables or placeholders:
```markdown
<!-- BAD -->
api_key = "sk-abc123..."

<!-- GOOD -->
api_key = "${API_KEY}"
```

## Questions?

- Open an issue for help
- Check existing plugins for examples
- Review Claude Code plugin documentation

## License

By contributing, you agree that your contributions will be licensed under MIT.
