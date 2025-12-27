---
name: tm-implement-workflow
description: Dispatch implementation subagent for a task-master task with TDD enforcement for code tasks
---

# Implement Task

## Overview

Dispatch a fresh subagent to implement a task-master task. Enforces TDD for code tasks.

**Announce at start:** "I'm using the tm-implement skill to implement this task."

## Task Classification

Before implementation, classify the task to select the optimal agent:

1. Use **task-classifier** skill to analyze task requirements
2. Consider project context (language, frameworks, patterns)
3. Match task characteristics to specialized agent capabilities
4. Default to developer agent when classification is uncertain

**Classification flow:**
```
Task → task-classifier → Agent Selection → Dispatch
```

See classification matrix in task-classifier skill for:
- Database operations → database-operations agent
- API work → api-development agent
- CI/CD → ci-cd-engineer agent
- Git complexity → gitops-engineer agent
- General code → developer agent

## Verification Integration

After implementation, verify the work using **verification-runner**:

1. Auto-detect project verification commands (test, lint, build)
2. Run all checks in **read-only mode** (no fixes)
3. Capture structured results with pass/fail metrics
4. Report verification status to orchestrator

**Critical:** Verification does NOT implement fixes. It only reports status.

## The Process

### Step 1: Get Task Details

```bash
task-master show {task_id} --format json
```

Extract: `id`, `title`, `description`, `details`, `testStrategy`

### Step 2: Classify Task

Use the task-classifier skill to determine the appropriate agent and approach:

```bash
# Classification will analyze:
# - Task content and requirements
# - Project context (language, frameworks)
# - Existing patterns in codebase
# - Dependencies and integration points

# Returns:
# - Recommended agent type
# - Rationale for selection
# - Special considerations
# - Required skills
```

**When to use specialized agents:**
- **database-operations**: Schema changes, migrations, queries, indexes
- **api-development**: REST/GraphQL endpoints, OpenAPI specs, API testing
- **ci-cd-engineer**: Pipeline configuration, deployment automation
- **gitops-engineer**: Complex branching, rebasing, conflict resolution
- **developer**: General code tasks, UI, business logic

**Default to developer agent when:**
- Task doesn't match specialized domains
- Multiple domains involved (coordinate in general context)
- Classification uncertain (with flag for careful attention)

**Low Confidence Handling:**
If classifier returns confidence < 0.7:
- Use fallback agent (usually "developer")
- Include uncertainty note in subagent prompt
- Request broader skill coverage in dispatch

### Step 3: Set Task Status

```bash
task-master set-status {task_id} in-progress
```

### Step 4: Update Session State

```json
{
  "status": "executing",
  "currentTask": {
    "id": "{task_id}",
    "type": "{detected_type}",
    "startedAt": "{timestamp}"
  }
}
```

### Step 5: Dispatch Subagent

Use Task tool with appropriate prompt from `reference/subagent-prompts.md`:

```
Task tool dispatch:
  subagent_type: "{developer | database-operations | api-development | ci-cd-engineer | gitops-engineer}"
  prompt: {specialized prompt for task type}

Include in dispatch:
  - Task classification result
  - Recommended agent: {from task-classifier}
  - Rationale: {why this agent was chosen}
  - Required skills: {from classification}
```

### Step 6: Run Verification

After subagent completes implementation, use verification-runner to check project status:

```bash
# Verification runner will:
# - Auto-detect project verification commands (test, lint, build)
# - Run all checks in read-only mode
# - Return structured results with pass/fail counts
# - Report failures WITHOUT attempting fixes

# Returns:
# - Test results (pass/fail counts)
# - Lint results (error/warning counts)
# - Build status (success/failure)
# - Coverage metrics (if available)
```

**Critical:** Verification is READ-ONLY. If verification fails:
1. Report failures to orchestrator
2. Do NOT attempt fixes in verification step
3. Keep task status as in-progress
4. Orchestrator decides next action (re-implement, debug, etc.)

### Step 7: Capture Report

When subagent returns, capture:
- Implementation summary
- Test results (from verification-runner)
- Lint results (from verification-runner)
- Build status (from verification-runner)
- Files changed
- Blockers/concerns

Store in session for review phase.

### Step 8: Report

```
Implementation Complete
───────────────────────
Task:     {id} - {title}
Agent:    {recommended_agent} (from task-classifier)
Tests:    {pass_count}/{total_count} passing
Lint:     {error_count} errors, {warning_count} warnings
Build:    {success|failed}
Files:    {file_count} changed

{summary from subagent}

Verification Status: {PASS|FAIL}
{verification details from verification-runner}

Ready for review. Run /tm-review to check quality.
```

## Skills Enforced by Type

| Task Type | Required Skills |
|-----------|-----------------|
| `code` | test-driven-development, testing-anti-patterns |
| `config` | verification-before-completion |
| `docs` | writing-clearly-and-concisely |

**RECOMMENDED SUB-SKILL:** For `docs` tasks, read `skills/writing-clearly-and-concisely/SKILL.md` for improved clarity.

## Error Handling

| Scenario | Action |
|----------|--------|
| Subagent fails | Capture error, don't update status, report failure |
| Tests fail | Report failures, keep status in-progress |
| Build fails | Report failures, keep status in-progress |
