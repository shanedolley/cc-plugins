---
name: tm-finish-workflow
description: Complete task-master execution - run final verification, clean up session, invoke branch completion
---

# Finish Execution

## Overview

Complete the task-master execution cycle. Run final verification, clean up session state, and invoke branch completion.

**Announce at start:** "I'm using the tm-finish skill to complete this execution."

**REQUIRED DEPENDENCIES:**
- superpowers:verification-before-completion skill
- gitops-engineer agent (for gitops-completion skill)

## The Process

### Step 1: Verify Completion Status

```bash
# Check task-master for remaining work
task-master list pending
task-master list in-progress
task-master list blocked
```

Display summary:
```
Execution Summary
─────────────────
Completed: {count}
Blocked:   {count}
Pending:   {count}

{List blocked tasks if any}
```

### Step 2: Run Final Verification

Announce: "I'm using the verification-before-completion skill."

Run full verification suite:
```bash
# Detect project type and run appropriate commands
npm test 2>/dev/null || pytest 2>/dev/null || go test ./... 2>/dev/null
npm run lint 2>/dev/null
npm run build 2>/dev/null
```

**If verification fails:** Stop, report failures, do not proceed.

### Step 3: Final Task Status Update

For any tasks still in-progress that passed verification:
```bash
task-master set-status {id} done
```

### Step 4: Git Complexity Detection

Before invoking branch completion, assess git complexity:

**Git Complexity Detection:**

Before merge/PR, check for:
- [ ] Conflicts with target branch
- [ ] Diverged history requiring rebase
- [ ] Submodule changes
- [ ] Large file handling needed

If ANY box checked → invoke gitops-engineer agent for complex git operations

**Detection Commands:**
```bash
# Check for conflicts with main
git fetch origin
git diff --name-only HEAD origin/main

# Check for diverged history
git log --oneline HEAD..origin/main
git log --oneline origin/main..HEAD

# Check for submodule changes
git diff --cached --submodule

# Check for large files
git ls-files -z | xargs -0 du -h | sort -rh | head -n 10
```

### Step 5: Invoke Branch Completion

Announce: "I'm using the gitops-engineer agent for branch completion."

Invoke the gitops-engineer agent with the gitops-completion skill to:
1. Verify all tests pass
2. Present options (merge, PR, cleanup)
3. Execute chosen action

### Step 6: Clean Up Session

After branch completion, reset session:

```json
{
  "version": "1.0",
  "tag": "{tag}",
  "status": "complete",
  "currentTask": null,
  "currentSubtask": null,
  "history": {
    "completed": ["{all completed task ids}"],
    "blocked": ["{any blocked task ids}"],
    "skipped": []
  },
  "lastUpdated": "{timestamp}"
}
```

### Step 7: Report Completion

```
Execution Complete
──────────────────
Tag:       {tag}
Tasks:     {completed_count} completed
Blocked:   {blocked_count} (if any)
Branch:    {action taken - merged/PR created/etc}

Session saved. Ready for next /taskmaster run.
```

## GitOps Engineer Integration

### When to Use gitops-engineer

Use the `gitops-engineer` agent for complex git scenarios:

**Merge Conflicts:**
- Announce: "I'm using the gitops-engineer agent for conflict resolution."
- Follow conflict resolution workflow (gitops-conflicts skill)
- Return to branch completion after resolution

**History Cleanup:**
- Interactive rebase for squashing commits
- Cherry-picking commits from other branches
- Complex history rewriting (gitops-recovery skill)

**Submodule Management:**
- Submodule updates affecting parent repo
- Submodule conflict resolution

**Standard Operations vs Complex Operations:**

| Scenario | Use |
|----------|-----|
| Clean merge to main | gitops-completion |
| Merge conflicts | gitops-conflicts → gitops-completion |
| Simple PR creation | gitops-completion |
| Squash before merge | gitops-recovery → gitops-completion |
| Submodule changes | gitops-engineer (check) → gitops-completion |

### Conflict Resolution Workflow

1. **Detect conflicts** (Step 4 git complexity detection)
2. **Invoke gitops-engineer** for resolution
3. **Verify resolution** via verification-runner
4. **Return to Step 5** (branch completion)

**Example Flow:**
```
tm-finish detects conflicts
  ↓
gitops-engineer (gitops-conflicts) resolves conflicts
  ↓
verification-runner validates
  ↓
gitops-engineer (gitops-completion) completes
```

## Partial Completion

If some tasks are blocked but independent work is done:

1. Report what was completed
2. List blocked tasks and their blockers
3. Ask: "Create PR for completed work, or wait to resolve blockers?"
