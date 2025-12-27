---
name: gitops-branching
description: Branching strategy selection, enforcement, and documentation for git repositories
---

# GitOps Branching Strategy

## Overview

This skill helps teams select, enforce, and document git branching strategies. It analyzes existing branch patterns to detect current strategies, recommends appropriate strategies for new projects, validates branch names against chosen conventions, and generates comprehensive branching documentation.

## Operations

### Strategy Detection

Analyze existing branch patterns to detect the current branching strategy:

1. List all branches (local and remote)
2. Analyze branch naming patterns and structure
3. Identify strategy based on patterns:
   - Presence of `develop`, `release/*`, `hotfix/*` indicates GitFlow
   - Presence of `staging`, `production`, environment-named branches indicates Environment Branches
   - Short-lived feature branches with frequent merges to main indicates Trunk-Based
4. Report detected strategy with confidence level

### Strategy Recommendation

Recommend an appropriate branching strategy for new projects or teams looking to change:

1. **Default Recommendation**: Trunk-Based Development
   - Best for modern CI/CD workflows
   - Simplest to understand and maintain
   - Fastest feedback loops
   - Works well with feature flags

2. Consider GitFlow if:
   - Team maintains multiple versions in production simultaneously
   - Strict release schedules with dedicated release managers
   - Need explicit support for hotfixes to production

3. Consider Environment Branches if:
   - Working with legacy systems with established patterns
   - Strict environment separation requirements
   - Team is transitioning from older workflows

### Convention Enforcement

Validate branch names against the chosen branching strategy:

1. Read BRANCHING.md (if exists) to determine active strategy
2. Check current branch name against strategy conventions
3. Report violations with correction suggestions
4. Optionally block operations on invalid branch names

Example validations:
- **Trunk-Based**: `feature/PROJ-123-add-login` ✓, `my-feature` ✗
- **GitFlow**: `feature/user-dashboard` ✓, `feat/dashboard` ✗
- **Environment**: Only `main`, `staging`, `develop` allowed for direct commits

### Strategy Documentation

Generate comprehensive branching strategy documentation:

1. Create `BRANCHING.md` in repository root
2. Include:
   - Chosen strategy name and description
   - Branch naming conventions
   - Workflow diagram
   - Merge rules and requirements
   - When to create different branch types
   - PR requirements and review process
3. Reference appropriate strategy document from `reference/`
4. Customize for team-specific rules

## Branching Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Trunk-Based** | Short-lived feature branches merged frequently to main | Continuous delivery, small to medium teams, microservices, **DEFAULT for new projects** |
| **GitFlow** | Structured develop/release/hotfix branches with explicit support for versions | Versioned releases, multiple versions in production, strict release schedules |
| **Environment Branches** | Separate branch per environment (develop → staging → main) | Legacy systems, strict environment separation, transitional workflows |

## Strategy References

Detailed documentation for each strategy is available in the `reference/` directory:

- `reference/trunk-based.md` - Trunk-Based Development patterns and rules
- `reference/gitflow.md` - GitFlow workflow and branch types
- `reference/environment-branches.md` - Environment-based branching

## Integration

This skill is called by the `gitops-engineer` agent to:
- Set up branching strategy for new repositories
- Validate branch names during workflow operations
- Generate or update branching documentation
- Recommend strategy changes for teams

## Examples

### Detect Current Strategy

```bash
# Analyze existing branches
git branch -a

# Returns:
# Detected Strategy: Trunk-Based Development
# Confidence: High
# Evidence:
# - All feature branches follow pattern: feature/{issue}-{description}
# - Average branch lifetime: 1.5 days
# - Main branch receives frequent merges
```

### Validate Branch Name

```bash
# Current strategy: Trunk-Based (from BRANCHING.md)
# Current branch: my-new-feature

# Returns:
# INVALID: Branch name does not match Trunk-Based convention
# Expected pattern: feature/{issue-id}-{short-description}
# Suggestion: Rename to: feature/PROJ-123-my-new-feature
```

### Generate Documentation

```bash
# Generate BRANCHING.md for Trunk-Based strategy
# Creates: /repo-root/BRANCHING.md

# File includes:
# - Strategy overview
# - Branch naming rules
# - Workflow diagram
# - Merge requirements
# - Team-specific customizations
```

## Best Practices

1. **Start Simple**: Default to Trunk-Based unless you have specific needs
2. **Document Early**: Create BRANCHING.md before first feature branch
3. **Enforce Consistently**: Use git hooks or CI checks to validate branch names
4. **Review Regularly**: Reassess strategy as team and product evolve
5. **Educate Team**: Ensure all team members understand chosen strategy

## Anti-Patterns to Avoid

- Using GitFlow when you don't need explicit version support
- Creating long-lived feature branches in Trunk-Based approach
- Mixing strategies (e.g., develop branch + environment branches)
- Changing strategy without team agreement and documentation update
- Allowing branch name violations "just this once"
