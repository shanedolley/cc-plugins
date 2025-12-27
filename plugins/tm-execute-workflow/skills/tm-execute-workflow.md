---
name: tm-execute-workflow
description: Orchestrate task-master task execution with TDD, code review, and worktree isolation - the main entry point for implementing task-master tasks
---

# Execute Task-Master Tasks

## Overview

Orchestrate the full task-master execution cycle. This is the main entry point after running /taskmaster.

**Announce at start:** "I'm using the tm-execute skill to implement task-master tasks."

**Workflow:** `/taskmaster` → `/tm-execute` → implemented features

## Orchestrator Boundaries

**THE ORCHESTRATOR DOES NOT IMPLEMENT**

This skill orchestrates. It does NOT:
- Write code
- Create files (except session state)
- Run tests (delegates to verification-runner)
- Make commits (delegates to subagents)

If you find yourself about to write code: STOP. Dispatch a subagent instead.

## Quick Reference

| Phase | Skill Used | Purpose |
|-------|------------|---------|
| Get next task | /tm-next | Query task-master for next task |
| Setup workspace | /tm-worktree | Create worktree for parent task |
| Implement | /tm-implement | Dispatch implementation subagent |
| Review | /tm-review | Dispatch code reviewer |
| Complete | /tm-finish | Verify and finish branch |

## Skill Integration

### When to Invoke New Skills

This skill orchestrates by delegating to specialized skills. Here's the decision tree:

**During Implementation (Step 2.3):**
- Task classification → invoke `task-classifier` via `/tm-implement`
- Agent selection → use classifier output for subagent dispatch
- Implementation → delegate via `/tm-implement`

**During Review (Step 2.4):**
- Code review → invoke `/tm-review`
- Security-sensitive tasks → `/tm-review` automatically uses `security-review` when applicable

**During Verification (Step 2.5):**
- ALL verification → invoke `verification-runner` (read-only)
- NEVER run test/lint/build commands directly
- Parse verification-runner output for pass/fail

**Specialized Operations:**
- Git conflicts/complex merges → use `gitops-engineer` agent
- Database migrations → specialized database skills (future)
- Performance checks → specialized performance skills (future)

### Decision Tree for Skill Selection

```
Get next task
  ↓
Is new parent task?
  Yes → /tm-worktree
  No  → Continue
  ↓
Implementation needed?
  Yes → /tm-implement (uses task-classifier internally)
  ↓
Implementation complete?
  Yes → /tm-review (uses security-review when applicable)
  ↓
Review passed?
  Yes → verification-runner (technical verification)
  No  → Return to /tm-implement for fixes
  ↓
Technical verification passed?
  Yes → Verify requirements against task definition
  No  → Ask: fix or block?
  ↓
Requirements verified?
  Yes → Mark task done (subtask or parent when all subtasks done)
  No  → Return to /tm-implement with requirement gap details
  ↓
Continue loop
```

## The Process

### Phase 1: Initialize

1. Check for existing session state in `.taskmaster/session.json`
2. If resuming: display current state, ask to continue or restart
3. If new: create session state with status `idle`

```bash
# Verify task-master has tasks
task_count=$(task-master list --format json | jq 'length')
if [ "$task_count" -eq 0 ]; then
  echo "No tasks found. Run /taskmaster first."
  exit 1
fi
```

Display:
```
Starting Task-Master Execution
──────────────────────────────
Tag:    {current tag}
Tasks:  {pending_count} pending, {total_count} total

Beginning execution loop...
```

### Phase 2: Execution Loop

Repeat until all tasks done or blocked:

#### Step 2.1: Get Next Task

Invoke: `/tm-next`

If no task available:
- Check if all complete → go to Phase 3
- Check if blocked → report blockers, ask how to proceed

#### Step 2.2: Setup Worktree (if new parent task)

Check if task is parent (no "." in ID) and different from current:

Invoke: `/tm-worktree {task_id}`

#### Step 2.3: Implement

Invoke: `/tm-implement {task_id}`

- Uses `task-classifier` to determine best subagent
- Sets status to in-progress
- Dispatches implementation subagent (selected by classifier)
- Captures implementation report

#### Step 2.4: Review

Invoke: `/tm-review {task_id}`

- Dispatches code reviewer
- Uses `security-review` when task involves authentication, encryption, or sensitive data
- Handles fix cycles if needed
- May mark task as blocked after retries

#### Step 2.5: Verify Technical Implementation

Invoke `verification-runner` skill (read-only):

```
Use the verification-runner skill to verify the implementation.
```

Check verification-runner output:
- If status is "pass" and all checks green → proceed to Step 2.6
- If status is "fail":
  - Report failures with actual output from verification-runner
  - Keep task in-progress
  - Ask: "Fix and retry, or mark blocked?"

**CRITICAL:** verification-runner is READ-ONLY. If it reports failures, return to tm-implement for fixes. Do NOT attempt to fix directly.

#### Step 2.6: Verify Requirements

After technical verification passes:

1. Retrieve task requirement:
   ```bash
   task-master get {task_id} --format json | jq -r '.requirement'
   ```

2. Cross-reference with PRD acceptance criteria:
   - Check that implementation fulfills stated requirement
   - Verify no scope creep (did what was asked, not more)
   - Confirm tests verify the requirement behavior

3. If requirement verification fails:
   - Report gap: "Implementation passes tests but doesn't fulfill requirement: {gap}"
   - Return to tm-implement with specific guidance
   - Do NOT proceed to marking task complete

#### Step 2.7: Mark Task Complete

After both technical and requirement verification pass:

**For subtasks:**
```bash
# Mark subtask as done
task-master set-status {subtask_id} done
```

**For parent tasks:**
```bash
# Check if ALL subtasks are complete
subtasks=$(task-master list --parent {parent_id} --format json)
incomplete=$(echo "$subtasks" | jq '[.[] | select(.status != "done")] | length')

if [ "$incomplete" -eq 0 ]; then
  # All subtasks done, mark parent done
  task-master set-status {parent_id} done
else
  # Still have incomplete subtasks, continue loop
  echo "Parent task has $incomplete remaining subtasks"
fi
```

**CRITICAL:** Only mark parent task done when ALL subtasks are done. Marking a parent done prematurely breaks the dependency chain.

#### Step 2.8: Parallel Check (at dependency boundaries)

When completing a task, check for independent tasks:

```bash
# Get tasks at same dependency level
task-master list pending --format json | jq '[.[] | select(.dependencies | length == 0)]'
```

If multiple independent tasks available:
```
{N} independent tasks available at this level.
Parallelize execution? (Yes/No)
```

If yes: dispatch multiple subagents concurrently.

### Phase 3: Finish

When no more tasks available:

Invoke: `/tm-finish`

- Runs final verification
- Invokes gitops-engineer agent for branch completion
- Cleans up session

**For complex git operations (conflicts, rebase):**
Use the `gitops-engineer` agent to handle:
- Merge conflicts during branch completion (gitops-conflicts skill)
- Rebase operations for clean history (gitops-recovery skill)
- Cherry-pick when needed
- Conflict resolution strategies

## Failure Handling

When a task fails (review rejects after retries, verification fails):

1. Mark task as blocked: `task-master set-status {id} blocked`
2. Get next candidate: `task-master next`
3. Check if blocked task is in next task's dependencies
4. If blocking: STOP, ask for guidance
5. If not blocking: CONTINUE with next task

```
Task {id} blocked.
Checking dependencies...

{Next task IS blocked by this task}
→ Cannot proceed. Options:
  1. Retry with guidance
  2. Skip and defer dependent tasks
  3. Exit and address manually

{Next task is NOT blocked}
→ Continuing with independent task {next_id}
```

## Session State Management

Session is saved after each phase transition:

```json
{
  "version": "1.0",
  "tag": "{tag}",
  "status": "executing",
  "currentTask": { ... },
  "history": {
    "completed": [...],
    "blocked": [...]
  },
  "lastUpdated": "{timestamp}"
}
```

## Resuming Execution

When session exists with status `executing`:

```
Existing session found
──────────────────────
Current task: {id} - {title}
Status:       {last known status}
Completed:    {count} tasks

Resume this session? (Yes/No/Restart)
```

- Yes: Continue from current task
- No: Exit without changes
- Restart: Clear session, start fresh

## Sub-Skills Used

| Skill | When |
|-------|------|
| tm-next | Each iteration to get next task |
| tm-worktree | When starting new parent task |
| tm-implement | To implement each task (uses task-classifier) |
| tm-review | After each implementation (uses security-review when applicable) |
| verification-runner | After review passes (read-only verification) |
| tm-finish | When all tasks complete |
| test-driven-development | Enforced by tm-implement for code |
| task-classifier | Used by tm-implement for agent selection |
| security-review | Used by tm-review for security-sensitive tasks |
| requesting-code-review | Used by tm-review |
| gitops-engineer (gitops-completion) | Used by tm-finish for branch completion |
| verification-before-completion | Used by tm-finish |
| gitops-engineer (gitops-conflicts/recovery) | Used by tm-finish for complex git operations |
