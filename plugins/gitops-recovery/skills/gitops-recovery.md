---
name: gitops-recovery
description: Complex git operations with safety measures (rebase, bisect, cherry-pick, stash)
category: GitOps
---

# GitOps Recovery

## Overview

Systematic workflows for complex git recovery and history operations with built-in safety measures.

**Core principle:** Safety first - backup before destructive operations, preview before applying, human approval for force operations.

**Announce at start:** "I'm using the gitops-recovery skill to handle [operation type]."

---

## The Iron Laws

```
1. NEVER FORCE PUSH WITHOUT EXPLICIT HUMAN APPROVAL
2. ALWAYS CREATE BACKUP BRANCH BEFORE HISTORY REWRITING
3. PREVIEW CHANGES BEFORE APPLYING (show diffs, list commits)
4. VERIFY BRANCH STATE BEFORE DESTRUCTIVE OPERATIONS
5. BISECT REQUIRES VERIFICATION COMMAND - NO MANUAL GOOD/BAD
6. RUN VERIFICATION AFTER HISTORY CHANGES
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "I'll just force push, it's my branch" | WRONG. Always verify no one else is using it and get approval. |
| "Backup branch is overkill for this rebase" | WRONG. Always backup before history changes. |
| "I know which commit is bad, skip bisect" | WRONG. Let bisect find it systematically. |
| "I'll apply the stash and figure it out" | WRONG. Review stash contents first. |
| "Cherry-picking is simple, no preview needed" | WRONG. Show what will be applied. |

---

## Safety Requirements

### Before History Rewriting

1. **Create timestamped backup:**
   ```bash
   git branch backup-{branch}-$(date +%Y%m%d-%H%M%S)
   ```

2. **Verify branch state:**
   ```bash
   git status
   git log --oneline -10
   git remote -v
   ```

3. **Check for collaborators:**
   ```bash
   git log --all --remotes --oneline -20
   ```

### Preview Changes

Always show what will happen:
- Rebase: List commits to be modified
- Cherry-pick: Show commit diff
- Stash: Display stash contents
- Bisect: Explain range and verification

### Force Push Approval

When force push is required:
1. Explain why it's necessary
2. Show what will be overwritten
3. Confirm no collaborators
4. **Request explicit human approval**
5. Only proceed after approval

---

## Operations

### 1. Interactive Rebase

See `reference/rebase-workflow.md` for detailed workflow.

**Process:**
1. **Backup:** `git branch backup-{branch}-{timestamp}`
2. **Identify commits:** `git log --oneline -n 20`
3. **Preview:** Show which commits will be modified
4. **Start rebase:** `git rebase -i {base}`
5. **Apply operations:** squash, fixup, reword, edit, drop
6. **Resolve conflicts** if any
7. **Verify:** Run tests via `verification-runner`
8. **Report result:** Offer to delete backup if successful

**Common Operations:**
- `pick` - Keep commit as-is
- `squash` - Combine commit into previous, edit message
- `fixup` - Combine commit into previous, discard message
- `reword` - Change commit message only
- `edit` - Pause to amend commit
- `drop` - Remove commit entirely

**Backup Naming Convention:**
```
backup-{branch-name}-{timestamp}
Example: backup-feature-auth-20251226-143022
```

### 2. Cherry-pick

**Process:**
1. **Verify target branch:** `git status` (must be clean)
2. **Identify commits:** `git log --oneline {source-branch}`
3. **Preview commit:** `git show {sha}`
4. **Cherry-pick:** `git cherry-pick {sha}`
5. **Handle conflicts** if any (same workflow as merge conflicts)
6. **Verify:** Run tests via `verification-runner`
7. **Report result**

**Single commit:**
```bash
git cherry-pick {sha}
```

**Range (exclusive start):**
```bash
git cherry-pick {sha1}..{sha2}
```

**Specific commits:**
```bash
git cherry-pick {sha1} {sha2} {sha3}
```

**Continue after conflict:**
```bash
git cherry-pick --continue
```

**Abort cherry-pick:**
```bash
git cherry-pick --abort
```

### 3. Stash Management

**Commands:**
- **Save:** `git stash push -m "description"`
- **List:** `git stash list`
- **Show:** `git stash show -p stash@{n}`
- **Apply:** `git stash apply stash@{n}`
- **Pop:** `git stash pop stash@{n}`
- **Drop:** `git stash drop stash@{n}`
- **Branch:** `git stash branch {name} stash@{n}`
- **Clear all:** `git stash clear` (requires approval)

**Process:**
1. **Always use descriptive messages** with `-m`
2. **Show stash list** before operations: `git stash list`
3. **Preview stash contents:** `git stash show -p stash@{n}`
4. **Prefer `apply` over `pop`** until verified
5. **Create branch from stash** for complex changes
6. **Clean up** after successful application

**Best Practices:**
- Use meaningful stash messages
- Don't accumulate stashes (clean regularly)
- Consider creating branch instead of long-lived stash
- Verify stash application with tests

### 4. Git Bisect

See `reference/bisect-workflow.md` for detailed workflow.

**Process:**
1. **Identify known-good commit** (tests pass)
2. **Identify known-bad commit** (current HEAD or specific commit)
3. **Define verification command** (automated test)
4. **Start bisect:** `git bisect start {bad} {good}`
5. **For each step:**
   - Run verification via `verification-runner`
   - Mark: `git bisect good` or `git bisect bad`
6. **Report culprit commit** with full details
7. **Reset:** `git bisect reset`

**Automated bisect (preferred):**
```bash
git bisect start HEAD {good-sha}
git bisect run npm test
```

**Manual bisect (when automation not possible):**
```bash
git bisect start HEAD {good-sha}
# At each step:
npm test
git bisect good  # or git bisect bad
```

**Bisect commands:**
- Skip commit: `git bisect skip`
- Visualize: `git bisect visualize`
- Log: `git bisect log`
- Replay: `git bisect replay {logfile}`

---

## Integration Points

| Called By | Purpose |
|-----------|---------|
| gitops-engineer | Delegates complex recovery operations |
| systematic-debugging | Bisect for regression hunting |
| tm-finish | Rebase/squash before completion |
| gitops-completion | Clean history before merge |

---

## Example Workflows

### Safe Interactive Rebase

```bash
# 1. Backup
git branch backup-feature-auth-20251226-143022

# 2. Preview commits
git log --oneline main..HEAD

# 3. Start rebase
git rebase -i main

# 4. After rebase, verify
npm test && npm run lint

# 5. If successful, clean backup
git branch -d backup-feature-auth-20251226-143022
```

### Automated Bisect

```bash
# 1. Find good commit
git log --oneline --all | grep "passing tests"

# 2. Start automated bisect
git bisect start HEAD abc123f

# 3. Run with verification
git bisect run npm test

# 4. Report culprit
# Git shows first bad commit

# 5. Reset
git bisect reset
```

### Cherry-pick with Conflict Resolution

```bash
# 1. Verify clean state
git status

# 2. Preview commit
git show abc123f

# 3. Cherry-pick
git cherry-pick abc123f

# 4. If conflict, resolve
git status
# Edit conflicted files
git add .
git cherry-pick --continue

# 5. Verify
npm test
```

---

## Remember

- **Backup before rewriting** - always have a restore point
- **Preview before applying** - show diffs and commit details
- **Verify after changes** - use verification-runner
- **Human approval for force** - never force push silently
- **Bisect needs automation** - manual good/bad is error-prone
- **Descriptive stash messages** - make stashes findable
- **Clean up backups** - after successful operations
