---
name: reviewing-github-prs
description: Use when reviewing any GitHub pull request - teammate PRs, external contributions, cross-team reviews, or self-review. Provides comprehensive analysis with flexible output modes via gh CLI.
---

# Reviewing GitHub Pull Requests

Comprehensive PR review skill supporting any GitHub pull request with configurable depth, parallel processing for large PRs, and flexible output modes.

**Core principle:** Thorough analysis with actionable feedback.

## When to Trigger

**Automatic:**
- User says "review PR 123" or "review this PR"
- User provides a GitHub PR URL
- User asks "what do you think of this PR?"
- User runs `/pr-review` command

**Invocation examples:**
```
/pr-review https://github.com/acme/api/pull/42
/pr-review 123
/pr-review  (auto-detects from current branch)
```

## Prerequisites

Before proceeding, verify `gh` CLI is installed and authenticated:

```bash
gh auth status
```

If this fails, stop with error:
> **Error:** `gh` CLI required. Install from https://cli.github.com and run `gh auth login`

## Input Resolution

Resolve PR reference in this order:

**1. Explicit URL:**
```
https://github.com/owner/repo/pull/123
```
Parse owner, repo, and number directly.

**2. PR Number (e.g., `123`):**
```bash
# Detect repo from current git remote
REMOTE_URL=$(git remote get-url origin)
# Extract owner/repo, then use: gh pr view 123 --repo owner/repo
```

**3. No Input (branch detection):**
```bash
gh pr view --json number,url
```
Uses current branch to find associated PR.

**4. Fallback:**
If none work, display clear error with examples:
> Could not resolve PR. Please provide:
> - PR URL: `/pr-review https://github.com/owner/repo/pull/123`
> - PR number: `/pr-review 123`
> - Or run from a branch with an open PR

## Phase 1: Context Gathering

### Step 1: Fetch PR Metadata

```bash
gh pr view {NUMBER} --json title,body,author,labels,baseRefName,headRefName,state,url,additions,deletions,changedFiles
```

Extract:
- PR title, description, author, labels
- Base branch and head branch
- PR state (open, draft, ready for review)
- Files changed count, lines added/removed

### Step 2: Fetch Linked Issues

```bash
gh pr view {NUMBER} --json body
```
Parse body for issue references: `#123`, `fixes #123`, `closes #123`

For each linked issue:
```bash
gh issue view {ISSUE_NUMBER} --json title,body,labels
```

### Step 3: Fetch Review Context

```bash
# Existing reviews and comments
gh pr view {NUMBER} --json reviews,comments

# CI status
gh pr checks {NUMBER}

# Reviewers
gh pr view {NUMBER} --json reviewRequests,reviewDecision
```

### Step 4: Fetch the Diff

```bash
gh pr diff {NUMBER}
```

Parse output to:
- List changed files
- Categorize by file type (code, tests, docs, config)
- Count total lines changed per file

### Step 5: Confirm Review Depth

Prompt user with AskUserQuestion:

```
Review depth?
1. Diff only (faster) - Analyze changed lines in context
2. Full file review (thorough) - Read entire files to understand changes in full context
```

If "Full file review" selected, for each changed file:
```bash
gh pr view {NUMBER} --json files
# Then read each file fully
```

### Step 6: Assess Scope

- If changedFiles ≤ 10: proceed with single-pass review
- If changedFiles > 10: chunk into batches of ~5 files, dispatch parallel subagents

## Phase 2: Review Analysis

### Review Dimensions

Analyze each dimension (configurable emphasis via `--focus` flag):

**Security Analysis:**
- Authentication/authorization issues
- Injection vulnerabilities (SQL, XSS, command injection)
- Secrets or credentials in code
- Insecure dependencies
- Input validation gaps

**Quality Analysis:**
- Architecture and design patterns
- Code clarity and maintainability
- Error handling completeness
- Test coverage for changes
- Performance implications
- DRY violations and code duplication

**Compliance Analysis:**
- Style guide adherence
- Documentation requirements
- Commit message format
- PR template completeness
- Breaking change documentation

**Contextual Analysis:**
- Does implementation match linked issue requirements?
- Are existing review comments addressed?
- Do changes align with PR description?
- CI failures related to the changes?

### Issue Severity Levels

- **Critical**: Security vulnerabilities, data loss risks, complete broken functionality
- **High**: Bugs, missing error handling, architectural problems
- **Medium**: Missing tests, suboptimal patterns, incomplete edge cases
- **Low**: Style issues, minor optimizations, documentation gaps
- **Info**: Observations, alternative approaches, questions for author

### Issue Format

For each issue found, provide ALL fields:

```
**[SEVERITY] Issue Title**
- **File:** path/to/file.ext:123
- **Problem:** What's wrong
- **Impact:** Why it matters
- **Fix:** Suggested solution (required)
```

## Chunked Review (>10 files)

When PR has more than 10 changed files:

### Step 1: Create Batches

Group files into batches of ~5, considering:
- Keep related files together (same directory/module)
- Prioritize high-risk files first (security-sensitive, core logic)

### Step 2: Dispatch Parallel Subagents

For each batch, dispatch a subagent using the Task tool:
- Subagent type: Use template at `reviewing-github-prs/pr-reviewer-subagent.md`
- Include: PR metadata, batch file list, review dimensions, severity levels
- Run in parallel for efficiency

### Step 3: Consolidation

After all subagents return, perform cross-reference analysis:

**Check for:**
- Function/method name mismatches across files
- Import/export inconsistencies
- Type definition misalignments
- API contract violations (caller expects different signature than callee)
- Shared state modifications without coordination

**Format consolidation issues as:**
```
**[SEVERITY] Cross-Reference: Issue Title**
- **Files:** file1.ext:123 ↔ file2.ext:456
- **Problem:** Description of mismatch
- **Impact:** Why this causes issues
- **Fix:** How to resolve
```

## Phase 3: Output & Actions

### Review Report Structure

```
## PR Review: #{number} - {title}

**Author:** @{author}
**Branch:** {head} → {base}
**Files Changed:** {count} | **Lines:** +{added} -{removed}
**CI Status:** {passing|failing|pending}

### Summary
{1-2 sentence overview of the PR and overall assessment}

### Strengths
{What's well done - be specific with file:line references}

### Issues

#### Critical ({count})
{issues}

#### High ({count})
{issues}

#### Medium ({count})
{issues}

#### Low ({count})
{issues}

#### Info ({count})
{issues}

### Cross-Reference Check
{Results from consolidation step if chunked review, or "N/A - single pass review"}

### Verdict
**Recommendation:** {Approve | Request Changes | Comment Only}
**Reasoning:** {1-2 sentences}
```

### Post-Report Actions

After displaying the report, prompt user with AskUserQuestion:

```
What would you like to do?
1. Post as GitHub review (approve)
2. Post as GitHub review (request changes)
3. Post as GitHub review (comment only)
4. Post individual inline comments
5. Copy report to clipboard
6. Done - no action
```

### GitHub Posting

**For overall review (options 1-3):**
```bash
# Approve
gh pr review {NUMBER} --approve --body "REVIEW_BODY"

# Request changes
gh pr review {NUMBER} --request-changes --body "REVIEW_BODY"

# Comment only
gh pr review {NUMBER} --comment --body "REVIEW_BODY"
```

**For inline comments (option 4):**
```bash
gh pr comment {NUMBER} --body "COMMENT"
# Note: For true inline comments, may need gh api
```

**Always confirm before posting:**
> Post review to PR #{number}? (y/n)

## Configuration

### Focus Flags

Override default review emphasis:
```
/pr-review 123 --focus security   # Prioritize security analysis
/pr-review 123 --focus quality    # Prioritize code quality
/pr-review 123 --focus compliance # Prioritize style/docs
/pr-review 123 --focus all        # All dimensions (default)
```

### Mode Flags

Control GitHub interaction:
```
/pr-review 123 --mode read-only    # No GitHub interaction
/pr-review 123 --mode draft        # Confirm before posting (default)
/pr-review 123 --mode interactive  # Post directly
```

### Error Handling

- **gh CLI failure:** Display troubleshooting steps
- **Rate limiting:** Backoff and notify user
- **Large diff (>5000 lines):** Warn and confirm before proceeding
- **Network issues:** Retry with exponential backoff

## Integration

- Uses `dispatching-parallel-agents` pattern for chunked reviews
- Follows `receiving-code-review` principles when consolidating feedback
- Adopts severity format from `requesting-code-review`
