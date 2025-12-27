---
name: security-review
description: Security-focused code review with OWASP Top 10 checklist, dependency scanning, and secret detection.
category: Quality Gates
---

# Security Review

## Overview

Security-focused review that goes beyond generic code review. Identifies vulnerabilities, enforces secure patterns, and validates auth implementations.

**Core principle:** Security is not optional - it's a requirement.

**Announce at start:** "I'm using the security-review skill to check for vulnerabilities."

---

## The Iron Laws

```
1. NEVER APPROVE WITH KNOWN VULNERABILITIES
2. ASSUME ALL INPUT IS MALICIOUS
3. SECRETS MUST NEVER BE COMMITTED
4. AUTHENTICATION FAILURES MUST BE LOGGED
5. AUTHORIZATION CHECKS AT EVERY BOUNDARY
6. ENCRYPT SENSITIVE DATA AT REST AND IN TRANSIT
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "This is an internal tool, security doesn't matter" | WRONG. Internal tools get compromised too. |
| "I'll fix the vulnerability later" | WRONG. Fix it now or don't ship. |
| "The dependency vulnerability is theoretical" | WRONG. Theoretical becomes practical. |
| "It's just a low severity finding" | WRONG. Low severity still needs tracking. |
| "The tests pass, so it's secure" | WRONG. Tests don't test for security. |

---

## Trigger Conditions

**Automatic security review required when task involves:**
- Authentication or authorization
- Cryptography or hashing
- PII or sensitive data handling
- File uploads
- External API calls
- User input processing
- Database queries
- Session management

---

## The Process

### Step 1: Dependency Scan

| Ecosystem | Tool | Command |
|-----------|------|---------|
| Node.js | npm audit | `npm audit --json` |
| Python | pip-audit | `pip-audit --format json` |
| Go | govulncheck | `govulncheck ./...` |
| Rust | cargo audit | `cargo audit --json` |
| Java | OWASP DC | `mvn dependency-check:check` |

**Fail on:** Critical or High severity with known exploit

### Step 2: Secret Detection

```bash
# Using gitleaks
gitleaks detect --source . --report-format json

# Using trufflehog
trufflehog filesystem . --json
```

**Patterns to detect:**
- API keys: `[A-Za-z0-9_]{20,}`
- AWS keys: `AKIA[0-9A-Z]{16}`
- Private keys: `-----BEGIN.*PRIVATE KEY-----`
- Passwords in code: `password\s*=\s*['"][^'"]+['"]`

**Any secret detected = AUTOMATIC FAILURE**

### Step 3: OWASP Top 10 Checklist

See `reference/owasp-checklist.md` for full checklist.

Quick check:
- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A07: Auth Failures
- [ ] A09: Logging Failures

### Step 4: Code Pattern Analysis

| Vulnerability | Pattern | Example |
|---------------|---------|---------|
| SQL Injection | String concat in query | `"SELECT * FROM users WHERE id = " + id` |
| XSS | Unescaped output | `innerHTML = userInput` |
| Command Injection | Shell exec with input | `exec("ls " + userPath)` |
| Path Traversal | User input in path | `open(basePath + userFile)` |

### Step 5: Generate Report

```
Security Review: Task 3.2
═════════════════════════

DEPENDENCY SCAN: ✅ PASS
└── 0 critical, 0 high, 2 moderate

SECRET DETECTION: ✅ PASS
└── No secrets detected

OWASP CHECKLIST: ⚠️ ISSUES
├── A01: Access control ✅
├── A03: Injection ✅
└── A07: ⚠️ No rate limiting on login

CODE PATTERNS: ⚠️ ISSUES
└── Line 45: JWT without expiration

VERDICT: CHANGES REQUESTED
```

---

## Severity Classification

| Level | Examples | Action |
|-------|----------|--------|
| CRITICAL | SQL injection, auth bypass, RCE | Block immediately |
| HIGH | Missing rate limiting, weak crypto | Should fix before merge |
| MEDIUM | Missing headers, verbose errors | Fix soon |
| LOW | Could use better alternative | Track for later |

---

## Default Agent

Primary: `security-auditor`
Alternatives: `backend-security-coder`, `frontend-security-coder`

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| task-classifier | Identify security-sensitive tasks |
| tm-review | Additional security gate |
| api-development | Auth/injection checks |

---

## Remember

- **Security is mandatory** - not optional
- **Dependencies matter** - scan them
- **Secrets = failure** - no exceptions
- **OWASP checklist** - use it
- **Fix now** - not later
