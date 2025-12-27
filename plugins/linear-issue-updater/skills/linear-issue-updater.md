---
name: linear-issue-updater
description: Use when the user requests to update or sync Linear issues after completing design, planning, or implementation work. Handles attaching documents, updating status/estimates, linking issues, and adding progress comments. Triggered by phrases like "update Linear", "sync Linear issue", or after completing workflow stages.
---

# Linear Issue Updater

## Overview

Update Linear issues at different stages of the development workflow. Attach design and planning documents as comment links, update issue status and estimates, link related issues discovered during work, and document progress and outcomes.

## When to Use This Skill

Use this skill when:
- User completes design work with `/shape` and wants to update Linear
- User completes planning with `/write-plan` and wants to attach the plan
- User completes implementation and wants to document outcomes in Linear
- User explicitly requests "update Linear", "sync Linear issue MAR-123", or similar
- User wants to update issue status, estimates, or relationships after work

Trigger phrases:
- "Update Linear with design"
- "Update Linear with plan"
- "Update Linear - work complete"
- "Sync Linear issue MAR-123"

## Issue Folder Convention

Each Linear issue should have a dedicated folder following this pattern:
```
docs/issues/MAR-123/
```

Where `MAR-123` is the issue identifier from Linear.

**Temporary numeric IDs**: When design or planning is done without a Linear issue, temporary numeric IDs (001, 002, etc.) are used. This skill does NOT apply to temporary numeric folders - it only syncs folders with actual Linear issue identifiers (e.g., MAR-123, ENG-456).

**Important**: Filenames within issue folders follow **no fixed convention**. To find relevant documents:
1. List the issue folder contents
2. Look for recent markdown files with names suggesting "brainstorm", "plan", "design", or similar
3. Check file modification times to find most recent documents
4. Ask user for clarification if multiple plausible files exist

## Workflow Stages

### Stage 1: After Design

**Context**: User has completed `/shape` which creates a design document or PRD.

**Required steps**:
1. Identify the Linear issue identifier (ask user if not clear from context)
2. Find the issue folder: `docs/issues/{ISSUE-ID}/`
3. Search folder for the design document (look for recent .md files, common patterns: "design", "prd", date-stamped)
4. Use `lincli issue get {ISSUE-ID}` to verify the issue exists and check current state
5. Add a comment using `lincli comment create {ISSUE-ID} --body "..."` with:
   - Summary: "Design document created via shaping workflow"
   - Link format: `[View design document](https://github.com/{org}/{repo}/blob/main/docs/issues/{ISSUE-ID}/{filename})`
   - Note: Construct GitHub link using repository context - check git remote if needed
6. **Do not** change issue status at this stage (design complete ≠ work started)

**Example comment format**:
```markdown
## Design Complete

Design document created via shaping workflow.

📋 [View design document](https://github.com/user/repo/blob/main/docs/issues/MAR-123/2025-11-11-design.md)

**Next steps**: Implementation plan and execution
```

### Stage 2: After Plan Writing

**Context**: User has completed `/write-plan` which creates detailed implementation tasks.

**Required steps**:
1. Identify the Linear issue identifier
2. Find the issue folder: `docs/issues/{ISSUE-ID}/`
3. Search folder for the plan document (look for recent .md files, common patterns: "plan", "implementation", date-stamped)
4. Use `lincli issue get {ISSUE-ID}` to verify the issue exists and check current state
5. Add a comment using `lincli comment create {ISSUE-ID} --body "..."` with:
   - Summary: "Implementation plan created"
   - Link to plan document on GitHub
   - Brief highlight of key tasks or phases if plan is structured
6. **Update estimates** using `lincli issue update {ISSUE-ID} --estimate N` if the plan reveals scope:
   - Set estimate (typical values: 1, 2, 3, 5, 8 points)
   - Ask user for estimate if plan complexity doesn't make it obvious
7. **Update priority** using `lincli issue update {ISSUE-ID} --priority N` if plan reveals urgency or dependencies

**Example comment format**:
```markdown
## Implementation Plan Ready

Detailed implementation plan created with bite-sized tasks.

📝 [View implementation plan](https://github.com/user/repo/blob/main/docs/issues/MAR-123/2025-11-11-plan.md)

**Estimate**: 5 points
**Key phases**: Database migration, API updates, UI changes, testing
```

### Stage 3: After Implementation Complete

**Context**: User has completed implementation, testing passed, work is ready for review or deployment.

**Required steps**:
1. Identify the Linear issue identifier
2. Find the issue folder and check for test results, validation reports, or completion summaries
3. Use `lincli issue get {ISSUE-ID}` to verify the issue exists and check current state
4. Add a progress comment using `lincli comment create {ISSUE-ID} --body "..."` documenting:
   - What was completed
   - Test results or validation outcomes
   - Any important findings or changes from original plan
   - Links to relevant documents (test results, validation reports, etc.)
   - Use markdown formatting with headers, lists, checkboxes for readability
5. **Update issue status** using `lincli issue update {ISSUE-ID} --state "State Name"`:
   - Typical state transitions: "In Progress" → "In Review" or "Done"
   - Common states: "Todo", "In Progress", "In Review", "Done", "Blocked"
6. **Note related issues** in the comment if discovered during implementation:
   - Mention related issue IDs in the comment (e.g., "Related to MAR-124")
   - Linear will auto-link issue references in comments

**Example comment format**:
```markdown
## Implementation Complete

All planned tasks completed and tested.

✅ **Completed**:
- Database migration executed successfully
- API endpoints updated and tested
- UI changes implemented with responsive design
- Test suite passing (47/47 tests)

📊 **Validation**: [View test results](https://github.com/user/repo/blob/main/docs/issues/MAR-123/test-results.md)

**Status**: Ready for code review
**Related**: Discovered dependency on MAR-124 (linked as "related")
```

### Stage 4: Generic Sync

**Context**: User requests generic Linear sync without specifying stage.

**Required steps**:
1. Identify the Linear issue identifier
2. Check for recent work context (what was just completed?)
3. Determine appropriate stage based on context:
   - Recent design/shaping session → Use Stage 1 workflow
   - Recent plan writing → Use Stage 2 workflow
   - Recent implementation/testing → Use Stage 3 workflow
   - Unclear → Ask user which stage to sync
4. Proceed with appropriate stage workflow

## Finding Documents in Issue Folders

Since filenames follow no fixed convention, use this approach:

```bash
# List issue folder with timestamps
ls -lt docs/issues/MAR-123/
```

**Search patterns**:
- Design docs: Look for "design", "prd", "approach" in filename, or recent .md files after shaping session
- Plan docs: Look for "plan", "implementation", "tasks" in filename, or recent .md files after plan writing
- Validation docs: Look for "test", "validation", "results", "summary" in filename

**When uncertain**: Ask user to confirm which file is the correct document.

## Formatting GitHub Links

Construct GitHub links in format:
```
https://github.com/{org}/{repo}/blob/{branch}/docs/issues/{ISSUE-ID}/{filename}
```

To get repository info:
```bash
git remote get-url origin
```

Typical format: `git@github.com:org/repo.git` or `https://github.com/org/repo.git`

**Default branch**: Use `main` unless user's repository uses `master` or another default branch (check with `git branch --show-current` if uncertain).

## Linear CLI Tools Reference

**IMPORTANT**: This project uses `lincli` command-line tool, NOT Linear MCP tools.

Key commands used by this skill:

- `lincli issue search "keyword" --team MAR --json`: Search for issues by keyword or identifier
- `lincli issue get MAR-123`: Get issue details including current state, description, comments
- `lincli comment create MAR-123 --body "comment text"`: **Add comments to issues**
  - Supports full markdown formatting
  - Preserves code blocks, lists, headers, and links
  - Can pass multi-line text via heredoc or file
- `lincli comment list MAR-123`: List existing comments on an issue
- `lincli issue update MAR-123 --state "Done"`: Update issue state
- `lincli issue update MAR-123 --description "text"`: Update issue description
- `lincli issue update MAR-123 --priority 2`: Update priority (0=None, 1=Urgent, 2=High, 3=Normal, 4=Low)

**Adding comments with lincli**:
```bash
# Simple one-liner
lincli comment create MAR-123 --body "Implementation complete"

# Multi-line via heredoc
lincli comment create MAR-123 --body "$(cat <<'EOF'
## Implementation Complete

All tasks finished and tested.

✅ Database migration successful
✅ API endpoints updated
✅ Tests passing (47/47)
EOF
)"

# From file
lincli comment create MAR-123 --body "$(cat /tmp/comment.md)"
```

Always use `lincli issue get` first to verify the issue exists and check current state before updating.

## Best Practices

1. **Always verify the issue first**: Use `lincli issue get {ISSUE-ID}` to check the issue exists and see current state
2. **Be descriptive in comments**: Include context about what was done, not just links
3. **Use markdown formatting**: Make comments scannable with headers, lists, checkboxes, code blocks
4. **Use heredoc for multi-line comments**: Pass formatted markdown via `--body "$(cat <<'EOF' ... EOF)"`
5. **Link related work**: Mention related issue IDs in comments (e.g., "Related to MAR-124") - Linear auto-links
6. **Ask when uncertain**: If multiple documents exist or stage is unclear, ask user
7. **Respect user conventions**: Don't impose rigid file naming - adapt to what exists
8. **GitHub links over full content**: Post links to documents, not entire document text
9. **Status transitions**: Only change status when appropriate for the stage
10. **Comment before status change**: Add explanatory comment first, then update status in separate command
