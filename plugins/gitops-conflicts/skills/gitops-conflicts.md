---
name: gitops-conflicts
description: Conflict resolution with classification and escalation - classifies conflicts as simple (auto-resolve) or complex (user required), verifies via tests
category: GitOps
visibility: public
dependencies:
  - verification-runner
version: 1.0.0
---

# GitOps Conflicts

## Overview

This skill provides intelligent conflict resolution during git operations. It classifies conflicts into two categories:

1. **Simple conflicts** - Auto-resolved using deterministic rules
2. **Complex conflicts** - Presented to user with context for manual resolution

After resolution, the skill verifies changes by running tests to ensure correctness.

## When to Use This Skill

Use this skill when:
- Git merge or rebase operations result in conflicts
- The gitops-engineer skill encounters conflicts during branch operations
- You need to resolve conflicts programmatically before proceeding
- Automated conflict resolution is preferred over immediate user intervention

Do NOT use this skill when:
- No conflicts are present
- User has explicitly requested to handle conflicts manually
- Conflicts are in binary files (requires manual resolution)

## Conflict Classification

All conflicts are classified according to this table:

| Simple (Auto-resolve) | Complex (User Required) |
|-----------------------|-------------------------|
| Import ordering | Logic changes in same function |
| Whitespace/formatting | Conflicting feature implementations |
| Non-overlapping additions | Schema/API changes |
| Package lock updates | Business logic conflicts |

### Classification Algorithm

1. **Detect conflicts:**
   ```bash
   git status --porcelain | grep '^UU'
   git diff --check
   ```

2. **For each conflicted file:**
   - Parse conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
   - Extract both versions (ours vs theirs)
   - Analyze conflict context

3. **Classification rules:**
   - **Simple if:**
     - Changes are only in import statements
     - Changes are only whitespace/formatting
     - Changes are non-overlapping additions to different sections
     - File is a package lock file (package-lock.json, yarn.lock, etc.)

   - **Complex if:**
     - Changes modify logic within the same function
     - Both versions implement different features in the same code path
     - Changes affect database schemas or API contracts
     - Changes modify business logic with different intent

## Workflow

### Phase 1: Detection

```bash
# Check for merge conflicts
git status --porcelain
```

Expected output for conflicts:
```
UU path/to/file.js
UU path/to/other.py
```

### Phase 2: Classification

For each conflicted file:

1. **Read conflict markers:**
   ```bash
   git diff path/to/file.js
   ```

2. **Extract conflict regions:**
   - Identify line ranges between markers
   - Determine file context (imports, functions, schemas)

3. **Apply classification rules:**
   - Check if all conflicts are in import blocks
   - Check if conflicts are pure whitespace
   - Check if conflicts are in lock files
   - Check if conflicts modify same function body
   - Check for schema/API patterns (CREATE TABLE, interface, type definitions)

4. **Categorize:**
   - If all conflicts in file are simple → Auto-resolve
   - If any conflict is complex → User required

### Phase 3A: Auto-Resolution (Simple Conflicts)

#### Import Ordering
```bash
# For JavaScript/TypeScript imports
# 1. Extract all import lines from both versions
# 2. Sort and deduplicate
# 3. Write back to file
```

Strategy:
- Combine all imports from both versions
- Remove duplicates
- Sort alphabetically by module name
- Preserve import style (named, default, namespace)

#### Whitespace/Formatting
Strategy:
- Accept either version (prefer ours)
- Run formatter after resolution (prettier, black, gofmt)

#### Non-overlapping Additions
Strategy:
- Keep both changes
- Merge additions in logical order
- Preserve original structure

#### Package Lock Files
Strategy:
- Regenerate lock file from package.json
```bash
# npm
npm install

# yarn
yarn install

# go
go mod tidy
```

### Phase 3B: User Presentation (Complex Conflicts)

For complex conflicts, present structured information to user:

```
CONFLICT DETECTED: path/to/file.js

File: path/to/file.js
Lines: 45-67
Type: Logic changes in same function

YOUR VERSION (current branch):
  function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

INCOMING VERSION (merge source):
  function calculateTotal(items) {
    return items.reduce((sum, item) => {
      const price = item.discounted ? item.salePrice : item.price;
      return sum + price * item.quantity;
    }, 0);
  }

EXPLANATION:
Both versions modify the calculateTotal function with different business logic.
Your version uses simple price multiplication, while the incoming version
adds discount handling. These cannot be automatically merged.

OPTIONS:
1. Keep your version (ignore discount logic)
2. Accept incoming version (add discount logic)
3. Manually resolve (open editor)
```

Use interactive prompt to get user decision.

### Phase 4: Verification

After resolution (auto or manual):

1. **Mark files as resolved:**
   ```bash
   git add path/to/resolved/file.js
   ```

2. **Run verification:**
   Use the `verification-runner` skill to execute project tests:
   - Run full test suite
   - Run linter
   - Run build (if applicable)

3. **Evaluate results:**
   - **If all pass:** Conflict resolution successful
   - **If any fail:** Present failure to user with options:
     - Review and fix manually
     - Revert resolution and try different approach
     - Skip verification (dangerous, requires explicit confirmation)

### Phase 5: Completion

Once verification passes:

1. **Report resolution:**
   ```
   CONFLICT RESOLUTION COMPLETE

   Resolved files:
   - path/to/file.js (auto-resolved: import ordering)
   - path/to/other.py (user-resolved: logic conflict)

   Verification: PASSED
   - Tests: 127 passed
   - Linter: no issues
   - Build: success

   Ready to continue with merge/rebase operation.
   ```

2. **Continue git operation:**
   - If in merge: `git merge --continue`
   - If in rebase: `git rebase --continue`
   - If in cherry-pick: `git cherry-pick --continue`

## Integration

This skill is called by:
- **gitops-engineer** - When merge/rebase operations encounter conflicts
- **gitops-branch-operations** - During branch synchronization

This skill calls:
- **verification-runner** - To verify resolution via tests

## Error Handling

### Binary File Conflicts
```
ERROR: Cannot auto-resolve binary file conflict
File: path/to/image.png

Binary files require manual resolution.
Please choose one version:
- git checkout --ours path/to/image.png
- git checkout --theirs path/to/image.png
```

### Verification Failures
```
WARNING: Conflict resolution introduced test failures

Failed tests:
- test/integration/checkout.test.js
  ✗ should calculate total with discounts

RECOMMENDED ACTIONS:
1. Review resolved code in path/to/file.js
2. Check if resolution combined logic incorrectly
3. Run tests individually: npm test -- checkout.test.js
```

### Ambiguous Classification
If classification is uncertain (edge case):
- Default to COMPLEX
- Present to user with explanation
- Let user decide if manual resolution needed

## Examples

See `reference/conflict-patterns.md` for detailed examples of:
- Simple conflict patterns with auto-resolution
- Complex conflict patterns requiring user input
- Decision tree for classification

## Best Practices

1. **Always verify:** Never skip verification after resolution
2. **Preserve intent:** When auto-resolving, maintain original purpose of both changes
3. **Clear communication:** Explain classification decisions to user
4. **Fail safe:** When uncertain, escalate to user rather than guess
5. **Document patterns:** Add new conflict patterns to reference when encountered

## Limitations

- Cannot resolve conflicts in binary files
- Cannot resolve semantic conflicts (code that compiles but has wrong behavior)
- Cannot resolve conflicts requiring domain knowledge
- Limited to patterns in classification table (expand as needed)

## Future Enhancements

- ML-based conflict classification
- Project-specific conflict resolution rules
- Conflict pattern learning from user resolutions
- Integration with code review tools for complex conflicts
