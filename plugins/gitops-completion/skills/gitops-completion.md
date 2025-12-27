---
name: gitops-completion
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# GitOps Completion

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the gitops-completion skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify all checks pass:**

Invoke the `verification-runner` skill to run tests, lint, and build checks.

**If verification fails:**
```
Verification failed (<N> failures). Must fix before completing:

[Show failures from verification-runner output]

Cannot proceed with merge/PR until all checks pass.
```

Stop. Don't proceed to Step 2.

**If verification passes:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

**Check for conflicts first:**

```bash
# Fetch latest
git fetch origin <base-branch>

# Check if merge would conflict
git merge-base --is-ancestor origin/<base-branch> HEAD || {
    # Need to check for conflicts
    git merge-tree $(git merge-base HEAD origin/<base-branch>) origin/<base-branch> HEAD
}
```

**If conflicts detected:**
- Present conflict information to user
- Provide AI recommendation for each conflict
- Offer resolution options:
  - Accept recommendation
  - Keep ours
  - Keep theirs
  - Manual edit

**Select merge strategy:**

```
Select merge strategy:

• Squash merge (recommended) - Combine into single clean commit
• Merge commit - Preserve full commit history
• Rebase + fast-forward - Linear history, no merge commit

Your choice [squash]:
```

**Execute merge:**

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Apply selected strategy:
# Squash:
git merge --squash <feature-branch>
git commit -m "<message>"

# OR Merge commit:
git merge --no-ff <feature-branch>

# OR Rebase + fast-forward:
git rebase <base-branch> <feature-branch>
git checkout <base-branch>
git merge --ff-only <feature-branch>

# Push to origin
git push origin <base-branch>
```

**Verify tests on merged result:**

Invoke `verification-runner` skill again to verify merged code.

**If tests pass:**

```bash
# Delete feature branch
git branch -d <feature-branch>

# Delete remote if exists
git push origin --delete <feature-branch> 2>/dev/null || true
```

Then: Cleanup worktree (Step 5)

**Merge commit message format (for squash):**

```
<PR title or branch description>

<Summary of changes>

Implements: <issue-id>

🤖 Generated with Claude Code
```

#### Option 2: Push and Create PR

**Push branch:**

```bash
# Push branch (if not already pushed)
git push -u origin <feature-branch>
```

**Detect PR template:**

```bash
# Check for template
test -f .github/PULL_REQUEST_TEMPLATE.md
```

**Generate PR content:**

If template exists:
- Use template
- Fill in known fields:
  - Title from branch description
  - Summary from commits
  - Related issue from branch name
  - Testing notes from verification output
  - Link to design doc/PRD

If no template:
```
## Summary
<commit summaries>

## Related Issue
<issue-id>

## Design Document
<link to docs/designs/ or docs/prds/>

## Testing
- [x] All tests pass
- [x] Lint passes
- [x] Build succeeds

🤖 Generated with Claude Code
```

**Assign reviewers:**

```bash
# Check for CODEOWNERS
if test -f .github/CODEOWNERS; then
    # Auto-assign matching owners for changed files
    gh pr create --title "<title>" --body "<body>" --assignee-from-codeowners
else
    # Get recent contributors and present list
    # "Suggested reviewers based on recent activity:"
    # User selects or skips
    gh pr create --title "<title>" --body "<body>" --reviewer <selected>
fi
```

**Create PR:**

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
<PR body content>
EOF
)"
```

**Output PR URL:**

```
✓ Pull Request created: <PR URL>
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

**Don't delete branch.**

#### Option 4: Discard

**Confirm first:**
```
⚠️  You are about to abandon this work.

This will:
• Delete branch '<name>' (local and remote)
• Remove worktree at '<path>'
• Discard all uncommitted changes

This action cannot be undone.

Type 'DISCARD' to confirm:
```

Wait for exact confirmation (typed "DISCARD").

If confirmed:
```bash
# Switch to base branch (in main workspace)
cd <original-workspace>
git checkout <base-branch>

# Force delete branch
git branch -D <feature-branch>

# Delete remote if exists
git push origin --delete <feature-branch> 2>/dev/null || true
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

**For Options 1, 2, 4:**

Delegate to `gitops-worktrees` skill for cleanup:

```
Invoke gitops-worktrees skill with cleanup operation:
- Worktree path: <path>
- Operation: remove
```

The `gitops-worktrees` skill will:
- Verify worktree exists
- Change to main workspace
- Remove worktree directory
- Verify removal

**For Option 3:** Keep worktree (no cleanup).

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | ✓ (base) | - | ✓ |
| 2. Create PR | - | ✓ (branch) | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Merge Strategies

| Strategy | Result | Best For |
|----------|--------|----------|
| Squash merge | Single commit on base | Clean history, feature complete |
| Merge commit | Merge commit + all original commits | Preserving detailed history |
| Rebase + fast-forward | Linear history, commits rebased | Linear history preference |

## Conflict Resolution

**Detection:**
- During `git merge` operations
- During `git rebase` operations
- During PR creation (GitHub reports conflicts)

**Resolution policy:** Always ask, but provide AI recommendation

**For each conflict:**
1. Classify conflict type:
   - Whitespace/formatting → Auto-resolve (prefer consistent)
   - Import ordering → Auto-resolve (sort)
   - Version bumps → Recommend newer
   - Non-overlapping additions → Auto-merge both
   - Logic changes → **Requires user decision**
   - Schema changes → **Requires user decision**

2. Generate recommendation with rationale

3. Present to user:
   ```
   Conflict in <file> (lines <range>):

   Conflict type: <type>
   Ours: <description>
   Theirs: <description>
   Recommendation: <action> (<rationale>)

   Options:
   • Accept recommendation
   • Keep ours
   • Keep theirs
   • Manual edit
   ```

4. Apply user's choice

5. Verify file is valid after resolution

**After all conflicts:**
1. Stage resolved files
2. Run verification-runner to verify resolution
3. If verification fails: warn user, must fix
4. Complete merge/rebase

## Post-Merge Cleanup

### Branch Deletion

After successful merge, branches are automatically deleted:
- Local: `git branch -d <feature-branch>`
- Remote: `git push origin --delete <feature-branch>`

### Worktree Cleanup

Delegated to `gitops-worktrees` skill (see Step 5).

### Linear Issue Completion

After successful merge to main, update Linear status:

**For SIMPLE path (with sub-issues):**
1. Verify all sub-issues marked Done
2. Mark parent issue Done
3. Add comment: "Merged to main in <commit>"

**For COMPLEX path (parent only):**
1. Mark parent issue Done
2. Add completion comment with summary

**For TRIVIAL path (if tracked):**
1. Mark issue Done

Use `lincli` for Linear updates:
```bash
# Mark issue done
lincli issue update <issue-id> --status done

# Add comment
lincli issue comment <issue-id> "Merged to main in <commit>"
```

**Note:** For PR path (Option 2), Linear status remains "In Progress" until PR is merged.

### Rollback Information

After successful merge, display rollback information:

```
✓ Merged to main

Merge commit: <commit-hash>
To rollback if needed:
  git revert <commit-hash>

Linear issue: <issue-id> marked Done
```

## Common Mistakes

**Skipping verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always invoke verification-runner before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "DISCARD" confirmation

**Missing conflict detection**
- **Problem:** Merge fails unexpectedly
- **Fix:** Check for conflicts before attempting merge

**Ignoring merge strategy**
- **Problem:** Wrong history structure
- **Fix:** Always ask for merge strategy preference

## Red Flags

**Never:**
- Proceed with failing verification
- Merge without verifying tests on result
- Delete work without typed confirmation
- Force-push without explicit request
- Auto-resolve logic conflicts without user input

**Always:**
- Invoke verification-runner before offering options
- Present exactly 4 options
- Get typed "DISCARD" confirmation for Option 4
- Check for conflicts before merge
- Ask for merge strategy preference
- Delegate worktree cleanup to gitops-worktrees skill

## Integration

**Called by:**
- **gitops-engineer agent** - After implementation and review complete

**Pairs with:**
- **gitops-worktrees** - For worktree cleanup operations
- **verification-runner** - For pre-completion and post-merge verification
- **Linear CLI (lincli)** - For issue status updates
