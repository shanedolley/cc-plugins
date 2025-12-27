---
name: task-classifier
description: Intelligently analyze tasks and route to the most appropriate specialized agent based on task content and project context.
category: Foundation
---

# Task Classifier

## Overview

Analyze task requirements and project context to recommend the best specialized agent. Replaces keyword-based detection with intelligent routing.

**Core principle:** Context-aware routing beats keyword matching.

**Announce at start:** "I'm using the task-classifier skill to determine the best agent for this task."

---

## The Iron Laws

```
1. ANALYZE BEFORE ROUTING - NEVER GUESS FROM TITLE ALONE
2. CONSIDER CONTEXT - PROJECT TYPE, DEPENDENCIES, EXISTING PATTERNS
3. PROVIDE RATIONALE - EXPLAIN WHY THIS AGENT WAS CHOSEN
4. DEFAULT CONSERVATIVELY - WHEN UNCERTAIN, USE GENERAL AGENT + FLAG
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "The title says 'API' so use api-documenter" | WRONG. Check project context first. |
| "This is obviously a Python task" | WRONG. Verify from project files. |
| "I'll just use the default developer agent" | WRONG. Check the matrix for better matches. |
| "Classification takes too long" | WRONG. Wrong agent wastes more time. |
| "The user probably wants X" | WRONG. Analyze, don't assume. |

---

## The Process

### Step 1: Gather Task Details

Extract from task-master or user request:
- Task ID
- Title
- Description
- Requirements/acceptance criteria
- Dependencies mentioned

### Step 2: Analyze Project Context

Detect project characteristics:

```bash
# Language detection
[ -f "package.json" ] && echo "javascript/typescript"
[ -f "pyproject.toml" ] || [ -f "setup.py" ] && echo "python"
[ -f "go.mod" ] && echo "go"
[ -f "Cargo.toml" ] && echo "rust"
[ -f "*.csproj" ] && echo "csharp"

# Framework detection
grep -q "fastapi" pyproject.toml 2>/dev/null && echo "fastapi"
grep -q "django" pyproject.toml 2>/dev/null && echo "django"
grep -q "react" package.json 2>/dev/null && echo "react"
grep -q "express" package.json 2>/dev/null && echo "express"

# Test framework detection
[ -f "jest.config.js" ] && echo "jest"
[ -f "pytest.ini" ] || grep -q "pytest" pyproject.toml && echo "pytest"
```

### Step 3: Match Against Agent Matrix

See `reference/agent-matrix.md` for full mapping.

Priority order:
1. Exact framework match (fastapi → fastapi-pro)
2. Language match (python → python-architect)
3. Task type match (database → database-optimizer)
4. Fallback (developer)

### Step 4: Identify Additional Requirements

Check for:
- Security sensitivity → add security-auditor review
- Database operations → consider database-optimizer
- Performance critical → consider performance-engineer
- Architecture decisions → consider architect

### Step 5: Return Classification

```json
{
  "taskId": "3.2",
  "classification": {
    "taskType": "api",
    "primaryAgent": "fastapi-pro",
    "fallbackAgent": "python-architect",
    "confidence": "high",
    "rationale": "Task involves FastAPI endpoints (detected from pyproject.toml with fastapi dependency), JWT auth pattern matches API development"
  },
  "additionalAgents": {
    "review": "security-auditor",
    "reason": "Authentication endpoints require security-focused review"
  },
  "skillsToEnforce": [
    "test-driven-development",
    "security-review"
  ],
  "projectContext": {
    "language": "python",
    "framework": "fastapi",
    "testFramework": "pytest",
    "hasTypeChecking": true
  }
}
```

---

## Confidence Levels

| Level | Meaning | Action |
|-------|---------|--------|
| high | Strong match on framework + task type | Use primary agent |
| medium | Language match but no framework specificity | Use primary, note fallback |
| low | Only keyword match, no project context | Use fallback, flag for human review |

---

## Task Type Keywords

| Type | Keywords in Title/Description |
|------|-------------------------------|
| code | implement, create, add, build, write, develop |
| api | endpoint, route, REST, GraphQL, API |
| database | query, migration, schema, model, database |
| frontend | component, UI, page, style, layout |
| config | configure, setup, environment, settings |
| docs | document, readme, guide, explain |
| test | test, coverage, spec, verify |
| security | auth, login, permission, encrypt, secure |
| performance | optimize, cache, speed, latency |

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| tm-implement | Route task to best agent |
| tm-review | Identify if security review needed |
| brainstorming | Suggest implementation approach |

---

## Output Display Format

```
Task Classification
═══════════════════
Task: 3.2 - Add user authentication endpoint
Type: api
Confidence: high

Primary Agent: fastapi-pro
  Rationale: Task involves FastAPI endpoints, JWT auth pattern

Additional Reviews:
  - security-auditor (auth endpoints require security review)

Skills to Enforce:
  - test-driven-development
  - security-review

Project Context:
  Language: python
  Framework: fastapi
  Tests: pytest
```

---

## Remember

- **Analyze the full context** - title alone is not enough
- **Check project files** - they reveal the tech stack
- **Provide rationale** - explain your reasoning
- **Flag uncertainty** - low confidence should involve human
- **Consider security** - auth/crypto tasks need security review
