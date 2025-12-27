---
name: gitops-release
description: Release preparation with version bump, changelog, and tagging
---

# GitOps Release

## Overview

This skill handles the git-side responsibilities in the release workflow. It prepares a release by analyzing conventional commits to determine the appropriate version bump, generating a changelog, updating version files, and creating a tagged release commit.

**Key Responsibility:** Prepare the git repository for release and create the version tag that triggers CI/CD automation.

## Operations

### 1. Determine Version Bump

Analyze conventional commits since the last release to determine the semantic version bump:

```bash
# Get commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges

# Determine bump type based on commit messages:
# - BREAKING CHANGE: → MAJOR bump
# - feat: → MINOR bump
# - fix: → PATCH bump
# - Other types (docs, chore, style, refactor, perf, test) → PATCH bump
```

**Decision Logic:**
- Any commit with `BREAKING CHANGE:` in body or footer → MAJOR
- Any `feat:` commit → MINOR (if no BREAKING CHANGE)
- Any `fix:` or other commit → PATCH (if no feat or BREAKING CHANGE)

### 2. Generate Changelog

Generate a changelog from conventional commits grouped by type:

```bash
# Group commits by type
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --no-merges

# Organize into sections:
# - Breaking Changes (BREAKING CHANGE in body/footer)
# - Features (feat:)
# - Bug Fixes (fix:)
# - Performance Improvements (perf:)
# - Other (docs, chore, style, refactor, test)
```

Use the changelog template in `reference/changelog-template.md` for formatting.

### 3. Create Release Branch (GitFlow Strategy)

If using GitFlow branching strategy:

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v{VERSION}
```

For trunk-based development, skip this step and work on main.

### 4. Update Version Files

Update version numbers in project files:

**Node.js / npm:**
```bash
npm version {MAJOR}.{MINOR}.{PATCH} --no-git-tag-version
```

**Rust / Cargo:**
```bash
# Edit Cargo.toml
sed -i '' 's/^version = ".*"/version = "{MAJOR}.{MINOR}.{PATCH}"/' Cargo.toml
```

**Python / Poetry:**
```bash
poetry version {MAJOR}.{MINOR}.{PATCH}
```

**Python / setuptools:**
```bash
# Edit pyproject.toml or setup.py
sed -i '' 's/version = ".*"/version = "{MAJOR}.{MINOR}.{PATCH}"/' pyproject.toml
```

**Go:**
```bash
# Update version constant in version.go or similar
sed -i '' 's/const Version = ".*"/const Version = "{MAJOR}.{MINOR}.{PATCH}"/' version.go
```

### 5. Create Release Commit

Commit the version updates and changelog:

```bash
git add package.json CHANGELOG.md  # or appropriate files
git commit -m "chore(release): v{MAJOR}.{MINOR}.{PATCH}"
```

**Commit Message Format:**
- Type: `chore`
- Scope: `release`
- Subject: Version number with `v` prefix
- No body or footer needed for release commits

### 6. Create and Push Git Tag

Create an annotated tag with changelog excerpt:

```bash
# Create annotated tag
git tag -a v{MAJOR}.{MINOR}.{PATCH} -m "Release v{MAJOR}.{MINOR}.{PATCH}

{CHANGELOG_EXCERPT}"

# Push commit and tag
git push origin {BRANCH_NAME}
git push origin v{MAJOR}.{MINOR}.{PATCH}
```

**Tag Format:**
- Name: `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v1.2.3`)
- Type: Annotated tag (not lightweight)
- Message: Version and changelog excerpt

## Conventional Commits

This skill relies on Conventional Commits specification for determining version bumps.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat:` - New feature (triggers MINOR bump)
- `fix:` - Bug fix (triggers PATCH bump)
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring without feature changes
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, tooling

### Breaking Changes

Add `BREAKING CHANGE:` in commit body or footer to trigger MAJOR bump:

```
feat(api): redesign authentication system

BREAKING CHANGE: Old API tokens are no longer valid.
Users must generate new tokens using the new auth flow.
```

Or use `!` after type/scope:

```
feat(api)!: redesign authentication system
```

### Examples

**Feature (MINOR bump):**
```
feat(auth): add OAuth2 support for Google login
```

**Bug Fix (PATCH bump):**
```
fix(parser): handle edge case with empty input
```

**Breaking Change (MAJOR bump):**
```
feat(api)!: change response format to use camelCase

BREAKING CHANGE: API responses now use camelCase instead of snake_case.
Update client code to use new field names.
```

## Handoff Point

**After tag push, the `cicd-release` skill takes over.**

The git tag triggers CI/CD pipelines that:
- Build and sign artifacts
- Publish to registries
- Create GitHub/Azure DevOps releases
- Run release validation

This skill's responsibility ends at tag creation. The CI/CD system handles all build and publish operations.

## Integration

This skill is invoked by the **gitops-engineer agent** when:
- User requests a release: "Create a release"
- Automated release schedule triggers (e.g., weekly releases)
- Release PR is merged (in GitFlow)

The gitops-engineer agent:
1. Calls this skill to prepare the release
2. Reviews the generated changelog and version bump
3. Confirms the release tag creation
4. Monitors for successful CI/CD pipeline trigger

## Workflow Example

```bash
# 1. Agent analyzes commits since last tag (v1.2.3)
git log v1.2.3..HEAD --oneline --no-merges
# Finds: 3 feat commits, 2 fix commits, no BREAKING CHANGE
# Decision: MINOR bump (1.2.3 → 1.3.0)

# 2. Generate changelog
# Groups commits into Features and Bug Fixes sections

# 3. Update version files
npm version 1.3.0 --no-git-tag-version

# 4. Update CHANGELOG.md with new section

# 5. Commit changes
git add package.json CHANGELOG.md
git commit -m "chore(release): v1.3.0"

# 6. Create and push tag
git tag -a v1.3.0 -m "Release v1.3.0

## Features
- Add OAuth2 support
- Implement rate limiting
- Add health check endpoint

## Bug Fixes
- Fix memory leak in worker pool
- Correct timezone handling in date parser"

git push origin main
git push origin v1.3.0

# 7. Handoff: CI/CD pipeline triggered by v1.3.0 tag
# cicd-release skill takes over from here
```

## Error Handling

**No commits since last release:**
- Abort with message: "No commits found since last release. Nothing to release."

**Dirty working directory:**
- Abort with message: "Working directory has uncommitted changes. Commit or stash changes before release."

**Tag already exists:**
- Abort with message: "Tag v{VERSION} already exists. Use force flag to override or choose different version."

**Push failures:**
- Provide clear error message with suggested remediation
- Ensure commit is pushed before tag (prevents orphaned tags)

## Reference Documentation

See `reference/` directory for detailed guides:
- `semver.md` - Semantic Versioning 2.0.0 specification
- `changelog-template.md` - Changelog generation and formatting
