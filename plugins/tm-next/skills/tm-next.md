---
name: tm-next-workflow
description: Get and display the next task from task-master without executing it - preview what's coming without starting implementation
---

# Get Next Task

## Overview

Query task-master for the next available task and display details without starting implementation.

**Announce at start:** "I'm using the tm-next skill to preview the next task."

## The Process

### Step 1: Check Task-Master Status

```bash
task-master list --with-subtasks 2>/dev/null | head -20
```

If no tasks found, display:
```
No tasks found. Run /taskmaster first to parse a PRD.
```

### Step 2: Get Next Task

```bash
task-master next --format json
```

Parse the JSON response to extract:
- `id`: Task ID (e.g., "3" or "3.2" for subtask)
- `title`: Task title
- `description`: Task description
- `status`: Current status
- `priority`: Task priority
- `dependencies`: Array of dependency IDs

### Step 3: Detect Task Type

Analyze title and description to classify:
- **code**: Contains words like "implement", "create function", "add endpoint", "build", "write"
- **config**: Contains words like "configure", "setup", "environment", "settings"
- **docs**: Contains words like "document", "readme", "write guide", "update docs"

### Step 4: Display Task Preview

```
Next Task Preview
─────────────────
ID:           {id}
Title:        {title}
Type:         {type} (TDD: {yes/no})
Priority:     {priority}
Dependencies: {deps or "none"}

Description:
{description}

To start implementation, run /tm-execute or /tm-implement
```

### Step 5: Update Session (Optional)

If `.taskmaster/session.json` exists, update with preview:

```json
{
  "preview": {
    "id": "{id}",
    "title": "{title}",
    "type": "{type}",
    "previewedAt": "{timestamp}"
  }
}
```

## When No Task Available

If `task-master next` returns empty or error:

1. Check for blocked tasks: `task-master list blocked`
2. Check if all done: `task-master list done`

Display appropriate message:
- "All tasks complete! Run /tm-finish to wrap up."
- "Next task blocked by: {blocked-task-ids}. Resolve blockers first."
- "No pending tasks. Parse a new PRD with /taskmaster."
