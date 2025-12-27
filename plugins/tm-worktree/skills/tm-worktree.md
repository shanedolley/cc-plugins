---
name: tm-worktree-workflow
description: Set up git worktree for a task-master parent task - creates isolated workspace for parent, subtasks share it
---

# Task Worktree Setup

## Overview

Create an isolated git worktree for a parent task. Subtasks share their parent's worktree.

**Announce at start:** "I'm using the tm-worktree skill to set up an isolated workspace for this task."

**REQUIRED AGENT:** Uses gitops-engineer agent for worktree operations (gitops-worktrees skill)

## The Process

### Step 1: Determine If Worktree Needed

Check if this is a parent task or subtask:

```bash
# If task ID contains ".", it's a subtask
task_id="$1"
if [[ "$task_id" == *.* ]]; then
  echo "Subtask - use parent's worktree"
  parent_id="${task_id%%.*}"
else
  echo "Parent task - create new worktree"
fi
```

**If subtask:** Read parent's worktree from session state, skip creation.

**If parent task:** Continue with worktree creation.

### Step 2: Generate Branch Name

```bash
# Get task title, slugify it
task_title=$(task-master show $task_id --format json | jq -r '.title')
slug=$(echo "$task_title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | head -c 30)
branch_name="task-${task_id}-${slug}"
```

### Step 3: Invoke gitops-engineer for worktree creation

Announce: "I'm using the gitops-engineer agent to create the isolated workspace."

Invoke the gitops-engineer agent with the gitops-worktrees skill:
1. Check for existing worktree directory (.worktrees or worktrees)
2. Verify .gitignore
3. Create worktree with branch

```bash
git worktree add .worktrees/${branch_name} -b ${branch_name}
```

### Step 4: Update Session State

Write to `.taskmaster/session.json`:

```json
{
  "currentTask": {
    "id": "{task_id}",
    "worktree": "{absolute_path_to_worktree}",
    "branch": "{branch_name}",
    "startedAt": "{ISO8601_timestamp}",
    "baseSha": "{current_git_sha}"
  }
}
```

### Step 5: Report Ready

```
Worktree ready for Task {task_id}
──────────────────────────────
Path:   {worktree_path}
Branch: {branch_name}
Status: Clean

Ready to implement. Run /tm-implement to start.
```

## Subtask Handling

When called for a subtask (ID like "3.2"):

1. Extract parent ID: `3`
2. Read session state for parent's worktree
3. Verify worktree still exists
4. Report: "Using existing worktree from parent task {parent_id}"

## Error Handling

| Scenario | Action |
|----------|--------|
| Worktree already exists for task | Reuse it, verify clean |
| Parent worktree missing for subtask | Error, suggest running parent first |
| Git conflicts | Report, ask for resolution |
