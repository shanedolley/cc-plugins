---
name: verification-runner
description: Run verification commands (test, lint, build) in read-only mode with structured output. Prevents orchestrator scope creep from verification into fixing.
category: Foundation
---

# Verification Runner

## Overview

Run verification commands and return structured results. This skill is READ-ONLY - it checks status but NEVER makes changes.

**Core principle:** Verify and report, never fix.

**Announce at start:** "I'm using the verification-runner skill to check project status."

---

## The Iron Laws

```
1. READ-ONLY - NEVER MODIFY FILES OR STATE
2. RUN FRESH - NEVER TRUST CACHED OR PREVIOUS RESULTS
3. REPORT ACTUAL OUTPUT - NOT SUMMARIES OR CLAIMS
4. FAIL EXPLICITLY - DON'T HIDE FAILURES
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "I'll just fix this small thing while verifying" | WRONG. You are READ-ONLY. Report and exit. |
| "The formatter can auto-fix" | WRONG. Fixing is not verifying. Report the issue. |
| "It's just a typo, I'll correct it" | WRONG. Return the failure. Let the implementer fix it. |
| "This is faster than reporting back" | WRONG. Your job is to report, not to fix. |
| "The previous run was recent enough" | WRONG. Run FRESH every time. |

---

## The Process

### Step 1: Detect Verification Commands

Auto-detect based on project type:

```bash
# Node.js
if [ -f "package.json" ]; then
  [ -n "$(jq -r '.scripts.test // empty' package.json)" ] && cmds+=("npm test")
  [ -n "$(jq -r '.scripts.lint // empty' package.json)" ] && cmds+=("npm run lint")
  [ -n "$(jq -r '.scripts.build // empty' package.json)" ] && cmds+=("npm run build")
  [ -n "$(jq -r '.scripts.typecheck // empty' package.json)" ] && cmds+=("npm run typecheck")
fi

# Python
if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  cmds+=("pytest")
  [ -f "pyproject.toml" ] && grep -q "ruff" pyproject.toml && cmds+=("ruff check .")
  [ -f "pyproject.toml" ] && grep -q "mypy" pyproject.toml && cmds+=("mypy .")
fi

# Go
if [ -f "go.mod" ]; then
  cmds+=("go test ./...")
  cmds+=("go vet ./...")
fi

# Rust
if [ -f "Cargo.toml" ]; then
  cmds+=("cargo test")
  cmds+=("cargo clippy")
fi
```

### Step 2: Run Each Command

For each detected command:

1. Run the command
2. Capture stdout, stderr, and exit code
3. Parse output for metrics (pass/fail counts, coverage, etc.)
4. Store results

**CRITICAL:** Do NOT add `--fix`, `--write`, or any auto-correction flags.

### Step 3: Parse Results

Extract structured data from output:

```
Tests: Parse pass/fail/skip counts
Lint: Parse error/warning counts
Build: Parse success/failure + artifacts
Coverage: Parse line/branch percentages
```

### Step 4: Return Structured Report

```json
{
  "status": "pass|fail|error",
  "timestamp": "ISO-8601",
  "duration_ms": 1234,
  "commands_run": ["npm test", "npm run lint"],
  "results": {
    "tests": {
      "status": "pass|fail",
      "passed": 45,
      "failed": 2,
      "skipped": 0,
      "duration_ms": 890
    },
    "lint": {
      "status": "pass|fail",
      "errors": 0,
      "warnings": 3
    },
    "build": {
      "status": "pass|fail",
      "success": true,
      "artifacts": ["dist/"]
    },
    "typecheck": {
      "status": "pass|fail",
      "errors": 0
    },
    "coverage": {
      "line": 87.5,
      "branch": 72.3
    }
  },
  "failures": [
    {
      "type": "test",
      "name": "auth.test.ts::login should validate credentials",
      "message": "Expected 200, got 401",
      "file": "tests/auth.test.ts",
      "line": 45
    }
  ],
  "rawOutput": {
    "tests": "...",
    "lint": "...",
    "build": "..."
  }
}
```

### Step 5: Verify Task Requirements (Task-Master Path)

When called from Task-Master workflows:

1. Retrieve task requirement from task-master:
   ```bash
   task-master get {task_id} --format json | jq -r '.requirement'
   ```

2. Cross-reference implementation with requirement:
   - Read relevant test files to verify behavior matches requirement
   - Check that acceptance criteria from requirement are covered
   - Ensure no scope creep (implementation does what's required, not more)

3. Add requirement verification to report:
   ```json
   {
     "requirementVerification": {
       "taskId": "001.2",
       "requirement": "Add user authentication with JWT tokens",
       "covered": true,
       "gaps": [],
       "notes": "Tests cover login, token validation, and refresh flow"
     }
   }
   ```

4. Report requirement gaps explicitly:
   ```
   REQUIREMENT VERIFICATION:
   ─────────────────────────
   Task: 001.2 - Add user authentication

   ✓ Login endpoint implemented and tested
   ✓ JWT token generation verified
   ✗ Token refresh flow not covered in tests

   Requirement gap detected. Implementation incomplete.
   ```

**Note:** This verification is READ-ONLY analysis. Report gaps but never implement missing features.

---

## What This Skill Does NOT Do

**NEVER:**
- Run `--fix` or `--write` flags
- Edit any files
- Run `git add` or `git commit`
- Attempt to resolve failures
- Skip commands to "save time"
- Summarize instead of showing actual output

**If verification fails, your job is to REPORT THE FAILURE, not fix it.**

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| tm-execute Step 2.5 | Verify after implementation + requirement verification |
| tm-finish | Final verification before completion |
| tm-implement | Verify subagent output independently |
| security-review | Run security scanning tools |
| performance-profiling | Run benchmarks |

---

## Output Display Format

```
Verification Results
════════════════════
Status: FAIL
Duration: 4.2s

Tests:    45 passed, 2 failed, 0 skipped
Lint:     0 errors, 3 warnings
Build:    SUCCESS
Typecheck: 0 errors
Coverage: 87.5% line, 72.3% branch

FAILURES:
─────────
[TEST] auth.test.ts:45 - login should validate credentials
       Expected 200, got 401

[TEST] user.test.ts:89 - createUser should hash password
       Expected hash to start with '$2b$', got 'plaintext'

Raw output available in report.rawOutput
```

---

## Remember

- **READ-ONLY means READ-ONLY** - no exceptions, no "small fixes"
- **Fresh runs only** - never trust cached results
- **Report everything** - failures are information, not problems to hide
- **Structured output** - callers depend on the schema
- **You are infrastructure** - reliable, predictable, no surprises
