---
name: install-category
description: Batch install plugins by category from the cc-plugins marketplace
---

# Install Category

Batch install all plugins from a specific category in the cc-plugins marketplace.

## Overview

This skill allows you to install all plugins from a category at once, rather than installing them one at a time. It modifies your `~/.claude/settings.json` to enable the plugins.

## Available Categories

| Category | Description | Plugin Count |
|----------|-------------|--------------|
| `plan-implement` | Planning, shaping, and implementation workflows | 16 |
| `programming-languages` | Language-specific development skills | 8 |
| `architecture-design` | System architecture and API design | 6 |
| `git-version-control` | Git workflows, branching, and secrets | 9 |
| `debugging-testing` | Debugging, testing, and quality assurance | 8 |
| `code-review-quality` | Code review and quality gates | 4 |
| `devops-infrastructure` | CI/CD, Kubernetes, and infrastructure | 9 |
| `database-data` | Database design and data engineering | 4 |
| `security-compliance` | Security review and compliance | 3 |
| `documentation-learning` | Documentation and learning resources | 5 |
| `productivity-tools` | Memory, shortcuts, and productivity | 10 |

## The Process

### Phase 1: Validate Input

If no category was provided, list all available categories and ask the user to choose:

```bash
echo "Available categories:"
echo "  plan-implement, programming-languages, architecture-design,"
echo "  git-version-control, debugging-testing, code-review-quality,"
echo "  devops-infrastructure, database-data, security-compliance,"
echo "  documentation-learning, productivity-tools"
```

Use AskUserQuestion to prompt:
- Question: "Which category would you like to install?"
- Options: List all categories above

### Phase 2: Fetch Marketplace Data

Fetch the current marketplace.json from GitHub to get the latest plugin list:

```bash
curl -s https://raw.githubusercontent.com/shanedolley/cc-plugins/main/.claude-plugin/marketplace.json
```

Parse the JSON to find the requested category in the `collections` array.

### Phase 3: Read Current Settings

Read the user's current Claude Code settings:

```bash
cat ~/.claude/settings.json 2>/dev/null || echo "{}"
```

### Phase 4: Build Plugin List

From the marketplace data, extract the plugins for the requested category. The marketplace format is:

```json
{
  "collections": [
    {
      "name": "plan-implement",
      "description": "...",
      "plugins": ["shape", "verify", "execute-plan", ...]
    }
  ]
}
```

For each plugin in the category, create an entry in the format:
```
"plugin-name@cc-plugins": true
```

### Phase 5: Update Settings

Use `jq` to merge the new plugins into the existing settings. If `jq` is not available, construct the JSON manually.

**With jq:**
```bash
# Read existing settings
SETTINGS=$(cat ~/.claude/settings.json 2>/dev/null || echo "{}")

# Add new enabledPlugins (merging with existing)
echo "$SETTINGS" | jq --argjson new "$NEW_PLUGINS" '
  .enabledPlugins = (.enabledPlugins // {}) + $new
' > ~/.claude/settings.json.tmp && mv ~/.claude/settings.json.tmp ~/.claude/settings.json
```

**Without jq (manual approach):**
Read the file, parse the JSON structure, add the new enabledPlugins entries, and write back.

### Phase 6: Report Results

After updating settings, report to the user:

1. List all plugins that were enabled
2. Note any external dependencies required (from marketplace `requirements` field)
3. Remind user to restart Claude Code for changes to take effect

Example output:
```
Installed 16 plugins from category 'plan-implement':
  - shape@cc-plugins
  - verify@cc-plugins
  - execute-plan@cc-plugins
  ... (list all)

External dependencies required:
  - git: Version control system
  - task-master: TaskMaster CLI (npm install -g task-master-ai)
  - lincli: Linear CLI (see install instructions)

Please restart Claude Code for changes to take effect.
```

## Error Handling

### Category Not Found
If the specified category doesn't exist:
```
Error: Category 'invalid-name' not found.
Available categories: plan-implement, programming-languages, ...
```

### Network Error
If unable to fetch marketplace.json:
```
Error: Could not fetch marketplace data from GitHub.
Please check your internet connection and try again.
```

### Settings File Error
If unable to write to settings.json:
```
Error: Could not update ~/.claude/settings.json
Please check file permissions.
```

## Special Commands

### Install All
To install ALL plugins from the marketplace:
```
/install-category all
```

### List Categories
To see available categories without installing:
```
/install-category list
```

### Show Category Contents
To see what plugins are in a category before installing:
```
/install-category show plan-implement
```
