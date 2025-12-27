---
name: architecture-decisions
description: Document architectural decisions using ADRs with alternatives analysis, trade-offs, and decision rationale.
category: Quality Gates
---

# Architecture Decisions

## Overview

Capture architectural decisions with context, alternatives, and rationale using Architecture Decision Records (ADRs).

**Core principle:** Document decisions before implementing them.

**Announce at start:** "I'm using the architecture-decisions skill to document [decision topic]."

---

## The Iron Laws

```
1. DOCUMENT BEFORE IMPLEMENT
2. CONSIDER AT LEAST THREE OPTIONS
3. MAKE TRADE-OFFS EXPLICIT
4. LINK TO REQUIREMENTS
5. REVIEW WITH STAKEHOLDERS
6. DECISIONS ARE LIVING DOCUMENTS
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "The decision is obvious, skip documentation" | WRONG. Obvious now, forgotten later. |
| "I'll document it after implementation" | WRONG. Context is lost after. |
| "One option is clearly best" | WRONG. Explore alternatives anyway. |
| "This is a minor decision" | WRONG. Minor becomes major when questioned. |
| "I'll update the ADR when things change" | WRONG. Supersede, don't edit. |

---

## When to Create an ADR

**Required for:**
- New technology/framework selection
- Significant architectural change
- Cross-team integration patterns
- Security/compliance decisions
- Performance architecture
- Data model changes
- API contract decisions

---

## The Process

### Step 1: Identify Decision Needed

Triggers:
- "Should we use X or Y?"
- "How should we integrate with Z?"
- "What's the pattern for this?"

### Step 2: Gather Context

Document:
- What problem are we solving?
- What constraints exist?
- Who are stakeholders?
- What are decision drivers?

### Step 3: Explore Alternatives

**Minimum 2-3 options required.**

For each:
- Technical feasibility
- Effort estimate
- Risk identification
- Driver alignment

### Step 4: Evaluate Options

Create decision matrix:

| Criteria (weight) | Opt A | Opt B | Opt C |
|-------------------|-------|-------|-------|
| Driver 1 (3) | ++ (6) | + (3) | - (-3) |
| Driver 2 (2) | + (2) | ++ (4) | + (2) |
| **TOTAL** | **8** | **7** | **-1** |

### Step 5: Document Decision

Use template in `reference/adr-template.md`.

Save to: `docs/architecture/decisions/ADR-{NNNN}-{title}.md`

### Step 6: Review and Approve

- Share with stakeholders
- Address feedback
- Update status: Proposed → Accepted

---

## Status Lifecycle

```
Proposed → Accepted → Superseded (by ADR-XXX)
                   → Deprecated
```

**Never edit accepted ADRs.** Create new ADR that supersedes.

---

## Decision Categories

| Category | Examples |
|----------|----------|
| Technology | Database, framework, language |
| Integration | API style, messaging, auth |
| Data | Schema, partitioning, caching |
| Infrastructure | Cloud, deployment, scaling |
| Security | Auth mechanism, encryption |
| Process | Branching, releases, testing |

---

## Default Agent

Primary: `architect`
Alternatives: `architect-review`

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| unified-shaping-workflow | Significant arch choices |
| task-classifier | Flag arch decisions |

---

## Remember

- **Document first** - before implementing
- **Context matters** - capture why now
- **Alternatives required** - minimum 2-3
- **Trade-offs explicit** - no perfect solutions
- **Immutable records** - supersede, don't edit
