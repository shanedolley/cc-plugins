---
name: database-operations
description: Systematic workflows for database schema changes, migrations, query optimization, and dependency analysis. Includes Supabase MCP integration.
category: Operations
---

# Database Operations

## Overview

Safe, systematic database operations with dependency analysis and rollback planning.

**Core principle:** Understand dependencies before changing anything.

**Announce at start:** "I'm using the database-operations skill to handle [operation type]."

---

## The Iron Laws

```
1. NEVER RUN MIGRATIONS WITHOUT BACKUP VERIFICATION
2. TEST MIGRATIONS ON NON-PRODUCTION FIRST
3. ROLLBACK PLAN REQUIRED BEFORE APPLYING CHANGES
4. BREAKING CHANGES REQUIRE HUMAN APPROVAL
5. NO RAW SQL IN PRODUCTION WITHOUT PARAMETERIZATION
6. DEPENDENCY ANALYSIS REQUIRED BEFORE DROP/ALTER OPERATIONS
7. USE SUPABASE MCP TOOLS WHEN SUPABASE DETECTED
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "It's just adding a column, no need for analysis" | WRONG. Even adds can break views/functions. |
| "I'll test the migration in production" | WRONG. Test in staging first, always. |
| "The rollback is obvious" | WRONG. Document it explicitly. |
| "No one uses that table" | WRONG. Run dependency analysis. |
| "It's a small database, skip the backup" | WRONG. Size doesn't matter, data does. |

---

## Supabase MCP Integration

**Detection:**
```bash
# Check for Supabase project
[ -d ".supabase" ] || [ -n "$SUPABASE_URL" ] && echo "SUPABASE DETECTED"
```

**When Supabase detected, use MCP tools:**

1. Use MCPSearch to find Supabase tools:
   ```
   MCPSearch query: "supabase"
   ```

2. Prefer MCP tools over raw SQL/CLI:
   - Schema inspection → Supabase MCP schema tools
   - Migration creation → Supabase MCP migration tools
   - RLS policies → Supabase MCP RLS tools
   - Edge functions → Supabase MCP function tools

3. Fall back to `supabase` CLI only if MCP unavailable

---

## Operations

### 1. Schema Migrations

**Framework Detection:**
```bash
[ -f "alembic.ini" ] && echo "alembic"
[ -f "prisma/schema.prisma" ] && echo "prisma"
[ -f "knexfile.js" ] && echo "knex"
[ -f "flyway.conf" ] && echo "flyway"
[ -d "db/migrate" ] && echo "rails"
[ -d ".supabase" ] && echo "supabase"
```

**Process:**
1. Generate migration from diff or definition
2. Run safety analysis (see reference/migration-safety.md)
3. Generate rollback migration
4. Test on staging/dev
5. Apply with transaction (where supported)
6. Verify via verification-runner

### 2. Dependency Analysis (MANDATORY for DROP/ALTER)

See `reference/dependency-analysis.md` for full queries.

**Before ANY destructive operation:**

```sql
-- PostgreSQL: Find all dependencies
SELECT DISTINCT
  deptype,
  pg_describe_object(classid, objid, objsubid) as dependent_object
FROM pg_depend
WHERE refobjid = '{table}'::regclass;
```

**Must check:**
- Views referencing the object
- Functions using the object
- Triggers on the object
- Foreign keys
- Indexes
- RLS Policies
- Materialized views

**Output format:**
```
Dependency Analysis: DROP TABLE users
═════════════════════════════════════
WILL BREAK:
├── VIEW: user_profiles_view (users.id, users.email)
├── VIEW: active_users_summary (users.created_at)
├── FUNCTION: get_user_stats() (queries users)
├── TRIGGER: audit_user_changes ON users
└── POLICY: users_rls_policy

RECOMMENDED ORDER (if proceeding):
1. Drop policy: users_rls_policy
2. Drop trigger: audit_user_changes
3. Drop view: active_users_summary
4. Drop view: user_profiles_view
5. Drop function: get_user_stats()
6. Drop table: users

⚠️ REQUIRES HUMAN APPROVAL - 5 dependent objects affected
```

### 3. Query Optimization

**Process:**
1. Enable slow query logging (threshold: 100ms)
2. Identify slow queries
3. Analyze with EXPLAIN:
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
   {query};
   ```
4. Look for red flags:
   - Seq Scan on large tables
   - Nested Loop with high rows
   - Missing index usage
5. Apply optimization
6. Verify improvement

### 4. Backup/Restore

**Before migrations:**
```bash
# PostgreSQL
pg_dump -Fc {database} > backup-$(date +%Y%m%d-%H%M%S).dump

# Supabase
supabase db dump -f backup.sql
```

**Verify backup:**
```bash
# Check backup is readable
pg_restore --list backup.dump | head -20
```

---

## Safety Classification

| Level | Operations | Action |
|-------|------------|--------|
| SAFE | Add nullable column, add index, create table | Auto-approve |
| CAUTION | Add NOT NULL with default, rename, add FK | Warn + proceed |
| DANGEROUS | Drop column/table, change type, remove constraint | Dependency analysis + human approval |

---

## Default Agent

Primary: `database-optimizer`
Alternatives: `database-admin`, `sql-pro`

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| task-classifier | Route database tasks |
| verification-runner | Verify migrations |
| security-review | SQL injection checks |

---

## Remember

- **Dependencies first** - always analyze before destructive changes
- **Backup always** - size doesn't matter, data does
- **Test first** - never test migrations in production
- **Rollback ready** - document how to reverse
- **Supabase MCP** - use it when available
