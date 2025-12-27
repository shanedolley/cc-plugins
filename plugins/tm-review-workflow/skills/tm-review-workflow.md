---
name: tm-review-workflow
description: Dispatch code reviewer subagent to review task implementation against requirements
---

# Review Task

## Overview

Dispatch code-reviewer subagent to review implementation quality after /tm-implement.

**Announce at start:** "I'm using the tm-review skill to review this implementation."

**REQUIRED SUB-SKILL:** Uses superpowers:requesting-code-review

## The Process

### Step 1: Get Git Context

```bash
# Get SHAs for diff
base_sha=$(cat .taskmaster/session.json | jq -r '.currentTask.baseSha')
head_sha=$(git rev-parse HEAD)

# Get diff stats
git diff --stat ${base_sha}..${head_sha}
```

### Step 2: Get Task Requirements

```bash
task-master show {task_id} --format json
```

### Step 3: Dispatch Code Reviewer

```
Task tool dispatch:
  subagent_type: "superpowers:code-reviewer"
  prompt: |
    Review the implementation of task {id}.

    WHAT_WAS_IMPLEMENTED: {implementation_report_from_session}
    PLAN_OR_REQUIREMENTS: {task details from task-master show}
    BASE_SHA: {base_sha}
    HEAD_SHA: {head_sha}
    DESCRIPTION: {task_title}

    SEVERITY DEFINITIONS:
    - Critical: Security risks, failing tests, broken builds, crashes
    - Important: Missing error handling, unclear naming, code duplication, edge cases
    - Minor: Optional comments, stylistic preferences, suggestions

    Review against:
    - Task requirements fully met?
    - TDD followed (if code task)?
    - Tests comprehensive?
    - No security vulnerabilities?
    - Code quality acceptable?

    Return: Strengths, Issues (with severity), Assessment (approve/request-changes)
```

### Step 4: Handle Review Outcome

| Outcome | Action |
|---------|--------|
| No issues | Proceed to verify and complete |
| Minor only | Note them, proceed |
| Important issues | Dispatch fix subagent, re-review (max 2 retries) |
| Critical issues | Dispatch fix subagent, re-review (max 2 retries) |
| Still failing after retries | Mark blocked, check dependencies |

### Step 5: Fix Subagent (if needed)

```
Task tool dispatch:
  subagent_type: "developer"
  prompt: |
    Fix the following issues from code review for task {id}:

    ISSUES:
    {list of important/critical issues}

    Working directory: {worktree_path}

    Fix each issue, run tests, commit with message:
    "fix({task_id}): address review feedback"
```

### Step 6: Report

```
Review Complete
───────────────
Task:       {id} - {title}
Assessment: {APPROVED | CHANGES REQUESTED}

Strengths:
{list of strengths}

Issues:
{list of issues with severity}

{Next action: proceed to verify OR fixing issues}
```

## Security Review Integration

**When security-review is required:**
- Authentication or authorization changes
- Cryptographic operations or hashing
- User input handling or validation
- Database queries with user data
- External API integrations
- File system operations (especially with user input)
- Environment variable usage or secret management

**How to invoke security-review:**

After Step 1 (Get Git Context), evaluate if security review is needed:

```markdown
**Security Review Triggers:**
- [ ] Authentication or authorization changes
- [ ] Cryptographic operations
- [ ] User input handling
- [ ] Database queries with user data
- [ ] External API integrations
- [ ] File system operations
- [ ] Environment variable usage

If ANY box checked → invoke security-review skill BEFORE code review
```

When triggers are matched, dispatch security review:

```
Task tool dispatch:
  subagent_type: "security-auditor"
  prompt: |
    Security review for task {id}.

    BASE_SHA: {base_sha}
    HEAD_SHA: {head_sha}
    DESCRIPTION: {task_title}

    Run full security analysis including:
    - Dependency scan
    - Secret detection
    - OWASP Top 10 checklist
    - Code pattern analysis

    See security-review skill for process.
```

**Combining findings:**

After both security-review and code-review complete:
1. Merge security findings into Issues section
2. Security CRITICAL/HIGH = auto-fail review
3. Include security verdict in final Assessment
4. List security issues with [SECURITY] prefix

Example combined report:
```
Review Complete
───────────────
Task:       3.2 - Add login endpoint
Assessment: CHANGES REQUESTED

Security Scan: ⚠️ ISSUES FOUND
- [SECURITY] [HIGH] Missing rate limiting on login
- [SECURITY] [MEDIUM] JWT without expiration

Strengths:
- Clean code structure
- Comprehensive tests

Issues:
- [SECURITY] [HIGH] Missing rate limiting on login (line 45)
- [SECURITY] [MEDIUM] JWT without expiration (line 78)
- [IMPORTANT] Missing error context in catch block

Next action: Fixing security and code issues
```

## Severity Reference

See `reference/severity-definitions.md` for full classification guide.

**Security-specific severities** (from security-review skill):

| Level | Examples | Action |
|-------|----------|--------|
| CRITICAL | SQL injection, auth bypass, RCE, committed secrets | Block immediately - auto-fail |
| HIGH | Missing rate limiting, weak crypto, input validation gaps | Should fix before merge |
| MEDIUM | Missing security headers, verbose error messages | Fix soon |
| LOW | Could use better security alternative | Track for later |

**Note:** Security CRITICAL and HIGH issues automatically trigger CHANGES REQUESTED assessment.
