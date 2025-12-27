---
name: performance-profiling
description: Performance analysis, profiling, and optimization workflows with measurement-first approach.
category: Quality Gates
---

# Performance Profiling

## Overview

Systematic performance analysis and optimization workflows. Prevents premature optimization by enforcing measurement-first approach with baseline establishment.

**Core principle:** Measure before optimizing - data defeats intuition.

**Announce at start:** "I'm using the performance-profiling skill to analyze and optimize performance."

---

## The Iron Laws

```
1. MEASURE BEFORE OPTIMIZING
2. BENCHMARK WITH PRODUCTION-LIKE DATA
3. PROFILE THE ACTUAL BOTTLENECK
4. DOCUMENT BASELINE METRICS
5. VERIFY IMPROVEMENTS WITH SAME CONDITIONS
6. PREMATURE OPTIMIZATION IS THE ROOT OF ALL EVIL
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "This code looks slow, let me optimize it" | WRONG. Measure first, then optimize. |
| "I know what the bottleneck is" | WRONG. Profile to verify your assumption. |
| "Small dataset testing is good enough" | WRONG. Use production-like volumes. |
| "Optimization passed tests, it's faster" | WRONG. Show before/after metrics. |
| "I'll optimize everything at once" | WRONG. One change at a time to isolate impact. |
| "Performance doesn't need documentation" | WRONG. Document baseline and improvements. |

---

## The Process

### Step 1: Establish Baseline

**Before any optimization:**

1. Define metrics to track
   - Latency: p50, p95, p99
   - Throughput: requests/sec, operations/sec
   - Resource usage: CPU, memory, I/O
   - Application-specific: query time, render time

2. Capture baseline measurements

```bash
# Example baseline capture
echo "Baseline Performance Metrics"
echo "============================"
echo "Date: $(date)"
echo "Commit: $(git rev-parse HEAD)"
echo ""
echo "Running benchmark..."
npm run benchmark > baseline-$(date +%Y%m%d-%H%M%S).txt
```

3. Document test conditions
   - Data volume
   - Concurrent users
   - Environment specs
   - Test duration

**Without baseline = no optimization**

### Step 2: Identify Bottleneck

Use profiling tools to find actual hot paths.

See `reference/profiling-tools.md` for language-specific tools.

**Common bottleneck categories:**
- CPU: Hot loops, inefficient algorithms
- Memory: Large allocations, leaks
- I/O: Disk reads, network calls
- Database: Slow queries, N+1 problems
- Frontend: Large bundles, re-renders

### Step 3: Profile Systematically

| Language | Tool | Use Case |
|----------|------|----------|
| Python | cProfile | CPU profiling |
| Python | memory_profiler | Memory usage |
| Python | line_profiler | Line-by-line timing |
| Node.js | clinic | Production profiling |
| Node.js | 0x | Flame graphs |
| Go | pprof | CPU/memory profiling |
| Rust | flamegraph | Performance visualization |
| Java | JProfiler | Full profiling suite |

**Example profiling workflow:**

```bash
# Python CPU profiling
python -m cProfile -o profile.stats script.py
python -m pstats profile.stats
# > sort cumulative
# > stats 20

# Node.js flame graph
0x -- node server.js

# Go profiling
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof
```

### Step 4: Optimize One Change at a Time

**Process:**
1. Make single optimization
2. Run same benchmark
3. Compare to baseline
4. Document impact
5. Commit if improvement, revert if not
6. Repeat

**Example optimization commit:**

```
perf: cache user lookup results

Baseline:  p95 = 450ms, throughput = 100 req/s
Optimized: p95 = 180ms, throughput = 220 req/s

Improvement: 60% latency reduction, 2.2x throughput

Profiling showed 40% time in repeated DB lookups.
Added Redis cache with 5min TTL.
```

### Step 5: Verify No Regressions

**Critical:** Optimization must not break functionality.

1. Run full test suite
2. Verify behavior unchanged
3. Check edge cases
4. Document trade-offs

### Step 6: Generate Performance Report

```
Performance Analysis: Task 4.3
════════════════════════════

BOTTLENECK IDENTIFIED: Database queries
└── N+1 query pattern in user dashboard

BASELINE METRICS:
├── p50 latency: 120ms
├── p95 latency: 450ms
├── p99 latency: 890ms
└── Throughput: 100 req/s

OPTIMIZATION APPLIED:
└── Eager loading with JOIN query

RESULTS:
├── p50 latency: 45ms (-62%)
├── p95 latency: 180ms (-60%)
├── p99 latency: 320ms (-64%)
└── Throughput: 220 req/s (+120%)

TRADE-OFFS:
├── Increased query complexity
├── Higher memory per request (+2MB)
└── Acceptable: Memory cost worth latency gain

VERIFICATION:
└── ✅ All tests pass, no behavior changes

NEXT STEPS:
└── Monitor production metrics for 24h
```

---

## Profiling Tools by Language

See `reference/profiling-tools.md` for detailed usage.

**Quick reference:**

| Language | CPU | Memory | Database | Frontend |
|----------|-----|--------|----------|----------|
| Python | cProfile | memory_profiler | django-silk | - |
| Node.js | clinic | heapdump | - | webpack-bundle-analyzer |
| Go | pprof | pprof | - | - |
| Rust | flamegraph | valgrind | - | - |
| Java | JProfiler | JProfiler | - | - |

---

## Common Optimization Patterns

### Database
- Add indexes for slow queries
- Use connection pooling
- Implement query result caching
- Fix N+1 queries with eager loading
- Use database query explain plans

### API/Backend
- Cache expensive computations
- Reduce redundant database calls
- Use async I/O for concurrent operations
- Implement pagination for large datasets
- Add CDN for static assets

### Frontend
- Code splitting for large bundles
- Lazy loading for components
- Memoization for expensive renders
- Virtual scrolling for long lists
- Image optimization and lazy loading

---

## Trigger Conditions

**Automatic performance review when:**
- Task mentions performance optimization
- Response time SLAs exist
- High-traffic endpoints modified
- Database queries added/changed
- Large data processing implemented
- Frontend bundle size grows significantly

---

## Default Agent

Primary: `performance-engineer`
Alternatives: `database-optimizer`, `frontend-developer`

---

## Integration Points

| Caller | Purpose |
|--------|---------|
| task-classifier | Identify performance-sensitive tasks |
| verification-runner | Run benchmark as verification |
| database-operations | Query optimization workflow |
| api-development | API endpoint performance |

---

## Remember

- **Measure first** - intuition lies
- **Baseline required** - compare apples to apples
- **One change** - isolate impact
- **Production data** - small datasets hide problems
- **Document trade-offs** - performance vs maintainability
- **Verify no regressions** - tests must still pass
