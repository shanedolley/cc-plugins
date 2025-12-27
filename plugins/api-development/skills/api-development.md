---
name: api-development
description: Systematic workflows for API design (spec-first), documentation, versioning, and contract testing.
category: Operations
---

# API Development

## Overview

Design APIs spec-first, maintain backward compatibility, and validate contracts.

**Core principle:** Spec before code - define the contract first.

**Announce at start:** "I'm using the api-development skill to [design/version/document] the API."

---

## The Iron Laws

```
1. SPEC BEFORE CODE - DEFINE OPENAPI/GRAPHQL SCHEMA FIRST
2. BACKWARD COMPATIBILITY - NEVER BREAK EXISTING CLIENTS
3. VERSION EXPLICITLY - CLEAR VERSIONING STRATEGY REQUIRED
4. DOCUMENT EVERYTHING - NO UNDOCUMENTED ENDPOINTS
5. VALIDATE CONTRACTS - TEST AGAINST SPEC, NOT JUST IMPLEMENTATION
6. SECURE BY DEFAULT - AUTH REQUIRED UNLESS EXPLICITLY PUBLIC
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "I'll write the spec after the code" | WRONG. Spec first catches design issues early. |
| "This breaking change is small" | WRONG. Small breaks still break clients. |
| "Everyone knows how to use this endpoint" | WRONG. Document it anyway. |
| "Tests pass so the API is correct" | WRONG. Test against the spec. |
| "This is an internal API, skip auth" | WRONG. Internal APIs need auth too. |

---

## API Type Detection

```bash
[ -f "openapi.yaml" ] || [ -f "openapi.json" ] && echo "rest-openapi"
[ -f "swagger.json" ] && echo "rest-swagger"
ls *.graphql 2>/dev/null && echo "graphql"
ls proto/*.proto 2>/dev/null && echo "grpc"
```

---

## Operations

### 1. Spec-First Design

**Process:**
1. Gather requirements (resources, operations, auth)
2. Design schema (see reference/openapi-template.md)
3. Validate schema: `spectral lint openapi.yaml`
4. Generate artifacts (docs, stubs, SDKs)
5. Implement with contract tests

### 2. Breaking Change Detection

**BREAKING (require new version):**
- Remove endpoint
- Remove required response field
- Add required request field
- Change field type
- Change auth requirements
- Change error format

**NON-BREAKING (safe):**
- Add optional request field
- Add response field
- Add new endpoint
- Add optional query parameter
- Loosen validation

### 3. Versioning Strategies

| Strategy | Format | Use When |
|----------|--------|----------|
| URL Path | `/api/v1/users` | Major breaking changes |
| Header | `Accept: application/vnd.api.v1+json` | Cleaner URLs needed |
| Query | `/api/users?version=1` | Easy switching |

**Recommended:** URL Path for simplicity and cacheability.

### 4. Deprecation Workflow

1. Add `Sunset` header with date
2. Add `Deprecation` header with link
3. Log usage of deprecated endpoints
4. Notify known consumers
5. Remove after sunset date

```http
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Deprecation: true
Link: <https://api.example.com/docs/migration>; rel="deprecation"
```

---

## Default Agent

Primary: `api-documenter`
Alternatives: `graphql-architect`, `fastapi-pro`

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| task-classifier | Route API tasks |
| verification-runner | Validate specs and contracts |
| security-review | Auth and injection checks |

---

## Remember

- **Spec first** - design before implementing
- **Never break clients** - version for breaking changes
- **Document everything** - no undocumented endpoints
- **Test contracts** - not just implementation
- **Secure by default** - auth unless explicitly public
