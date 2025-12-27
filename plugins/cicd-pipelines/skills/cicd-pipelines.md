---
name: cicd-pipelines
description: Pipeline creation, debugging, and management for GitHub Actions, Azure Pipelines, and Jenkins
category: CI/CD
---

# CI/CD Pipelines

## Overview

Create, debug, and manage CI/CD pipelines across multiple platforms with systematic workflows for syntax validation, error diagnosis, and pipeline variables management.

**Core principle:** Detect platform, select appropriate template, test in branch before main.

**Announce at start:** "I'm using the cicd-pipelines skill to [create/debug/manage] pipelines."

---

## The Iron Laws

```
1. NEVER COMMIT SECRETS TO PIPELINE FILES
2. TEST PIPELINE CHANGES IN BRANCH BEFORE MAIN
3. VALIDATE SYNTAX BEFORE COMMITTING
4. FAILED PIPELINES MUST BE DIAGNOSED BEFORE RETRY
5. USE PLATFORM-SPECIFIC SECRETS MANAGEMENT
6. DOCUMENT REQUIRED VARIABLES AND SECRETS
```

---

## Common Rationalizations That Mean You're About To Fail

| Rationalization | Reality |
|-----------------|---------|
| "I'll add the secret directly, just for testing" | WRONG. Use secrets manager. |
| "Let's test this pipeline change in main" | WRONG. Test in branch first. |
| "It's a simple YAML change, no validation needed" | WRONG. Always validate syntax. |
| "The pipeline failed, let me retry" | WRONG. Diagnose first. |
| "I'll document the secrets later" | WRONG. Document as you create. |

---

## Platform Detection

Detect CI/CD platform by checking for configuration files:

```bash
# GitHub Actions (primary)
[ -d ".github/workflows" ] && echo "github-actions"

# Azure Pipelines
[ -f "azure-pipelines.yml" ] && echo "azure-pipelines"

# Jenkins
[ -f "Jenkinsfile" ] && echo "jenkins"

# GitLab CI
[ -f ".gitlab-ci.yml" ] && echo "gitlab-ci"

# CircleCI
[ -d ".circleci" ] && echo "circleci"
```

**Default:** If no platform detected, recommend GitHub Actions.

---

## Operations

### 1. Pipeline Creation

**Process:**
1. Detect existing CI platform (or ask user preference)
2. Analyze project type (Node, Python, Go, Rust, etc.)
3. Identify required stages (test, lint, build, deploy)
4. Select appropriate template from reference/
5. Customize template for project needs
6. Add secret placeholders (NEVER actual secrets)
7. Validate syntax using platform-specific tools
8. Create pipeline in branch first
9. Document required secrets and variables
10. Test pipeline run in branch
11. Commit to branch, open PR if successful

**Project Type Detection:**

| Indicators | Project Type | Template |
|------------|--------------|----------|
| package.json | Node.js | reference/github-actions-templates.md#nodejs |
| requirements.txt, setup.py | Python | reference/github-actions-templates.md#python |
| go.mod | Go | reference/github-actions-templates.md#go |
| Cargo.toml | Rust | reference/github-actions-templates.md#rust |
| pom.xml | Java/Maven | reference/azure-pipelines-templates.md#java |

**Template Selection:**

- **GitHub Actions (primary):** reference/github-actions-templates.md
- **Azure Pipelines:** reference/azure-pipelines-templates.md
- **Jenkins:** reference/jenkins-templates.md

**Customization Checklist:**

- [ ] Update trigger branches
- [ ] Set correct runtime versions (Node 20, Python 3.11, etc.)
- [ ] Configure test commands
- [ ] Add build steps if needed
- [ ] Configure deployment targets
- [ ] Add secret placeholders
- [ ] Document required secrets in comments
- [ ] Set timeout values appropriately

### 2. Pipeline Debugging

**Process:**
1. Fetch pipeline logs from recent failed run
2. Classify failure type
3. Identify error patterns in logs
4. Analyze root cause
5. Suggest fix with specific rationale
6. Use verification-runner to test fix locally
7. Apply fix in branch
8. Validate pipeline passes

**Failure Classification:**

| Type | Indicators | Action |
|------|-----------|--------|
| **Dependency failure** | Module not found, version conflicts | Check lockfile, update dependencies |
| **Test failure** | Test X failed, assertion error | Run tests locally, identify flaky tests |
| **Build failure** | Compilation error, missing env vars | Check env vars, build paths |
| **Infrastructure** | Timeout, OOM, disk space | Retry or increase resources |
| **Secret/auth** | 401, 403, missing credential | Verify secret exists, check permissions |
| **Syntax error** | Invalid YAML, unknown key | Validate syntax, check documentation |

**GitHub Actions Debugging:**

```bash
# View workflow runs
gh run list --workflow=ci.yml

# View specific run
gh run view RUN_ID

# Download logs
gh run view RUN_ID --log

# Re-run failed jobs
gh run rerun RUN_ID --failed
```

**Azure Pipelines Debugging:**

```bash
# View recent runs
az pipelines runs list --pipeline-name "CI"

# Show specific run
az pipelines runs show --id RUN_ID

# Download logs
az pipelines runs show --id RUN_ID --open
```

**Jenkins Debugging:**

- Access Jenkins UI for detailed logs
- Check console output for specific build
- Review pipeline stage view for failure point

**Common Error Patterns:**

```bash
# Flaky test detection
grep -i "retry\|flaky\|timeout" logs.txt

# Environment variable issues
grep -i "undefined\|not set\|missing" logs.txt

# Permission issues
grep -i "permission denied\|403\|401" logs.txt

# Resource exhaustion
grep -i "out of memory\|oom\|disk full" logs.txt
```

### 3. Syntax Validation

Always validate pipeline syntax before committing.

**GitHub Actions:**

```bash
# Validate workflow syntax
gh workflow view .github/workflows/ci.yml --yaml

# Alternative: Use actionlint
actionlint .github/workflows/*.yml
```

**Azure Pipelines:**

```bash
# Validate pipeline YAML
az pipelines run --name "Pipeline Name" --yaml azure-pipelines.yml --dry-run

# Alternative: Use YAML linter
yamllint azure-pipelines.yml
```

**Jenkins:**

```bash
# Validate Jenkinsfile (requires Jenkins CLI)
java -jar jenkins-cli.jar declarative-linter < Jenkinsfile

# Alternative: Use local validation
jenkins-linter Jenkinsfile
```

### 4. Pipeline Variables Management

**GitHub Actions:**

**Secrets (sensitive):**
```bash
# Set repository secret
gh secret set SECRET_NAME

# Set environment secret
gh secret set SECRET_NAME --env production

# List secrets
gh secret list
```

**Variables (non-sensitive):**
```bash
# Set repository variable
gh variable set VAR_NAME --body "value"

# Set environment variable
gh variable set VAR_NAME --body "value" --env production

# List variables
gh variable list
```

**In workflow file:**
```yaml
env:
  # Variables
  NODE_VERSION: ${{ vars.NODE_VERSION }}

  # Secrets
  API_KEY: ${{ secrets.API_KEY }}
```

**Azure Pipelines:**

**Variables:**
```bash
# Set pipeline variable
az pipelines variable create --name VAR_NAME --value "value" --pipeline-name "CI"

# Set secret variable
az pipelines variable create --name SECRET_NAME --value "value" --secret true --pipeline-name "CI"

# List variables
az pipelines variable list --pipeline-name "CI"
```

**In pipeline file:**
```yaml
variables:
  # Non-secret
  nodeVersion: '20.x'

  # Secret (defined in Azure DevOps UI)
  # Reference as $(secretName)
```

**Jenkins:**

**Credentials:**
- Manage credentials through Jenkins UI: Manage Jenkins > Credentials
- Reference in Jenkinsfile using credentials() binding

**Environment Variables:**
```groovy
environment {
    NODE_VERSION = '20'
    // Secret from credentials
    API_KEY = credentials('api-key-credential-id')
}
```

**Security Rules:**

1. NEVER commit secrets to pipeline files
2. Use platform secrets manager for all sensitive data
3. Rotate secrets regularly
4. Use different secrets per environment (dev, staging, prod)
5. Document required secrets in README or pipeline comments
6. Use least-privilege principle for secret access

### 5. Platform-Specific Features

**GitHub Actions:**
- Matrix builds for multiple versions
- Reusable workflows
- Composite actions
- Environments with protection rules
- Concurrency control

**Azure Pipelines:**
- Multi-stage pipelines
- Template parameters
- Service connections
- Deployment groups
- Variable groups

**Jenkins:**
- Declarative vs scripted pipelines
- Shared libraries
- Pipeline as code
- Multibranch pipelines
- Blue Ocean UI

---

## Integration Points

### Called by ci-cd-engineer

When invoked by ci-cd-engineer agent:

1. Announce skill usage
2. Follow Iron Laws strictly
3. Detect platform automatically
4. Select appropriate template
5. Validate syntax before committing
6. Test in branch first
7. Report results to orchestrator

### verification-runner

Before committing pipeline changes:

```bash
# Use verification-runner to test locally
invoke verification-runner
# Only commit pipeline changes if verification passes
```

### systematic-debugging

If pipeline debugging becomes complex:

1. Use systematic-debugging skill
2. Investigate root cause methodically
3. Test hypotheses before applying fixes
4. Document findings for future reference

---

## Process Checklist

### Creating a New Pipeline

- [ ] Announce skill usage
- [ ] Detect CI platform (or ask user preference)
- [ ] Analyze project type and dependencies
- [ ] Select appropriate template from reference/
- [ ] Customize stages for project needs
- [ ] Add secret placeholders with documentation
- [ ] Validate syntax using platform tools
- [ ] Create pipeline in branch (NOT main)
- [ ] Document required secrets in README
- [ ] Commit to branch
- [ ] Push and verify pipeline runs successfully
- [ ] Open PR if successful
- [ ] Merge to main after approval

### Debugging a Failed Pipeline

- [ ] Announce skill usage
- [ ] Fetch logs from failed run
- [ ] Classify failure type
- [ ] Identify error patterns
- [ ] Analyze root cause
- [ ] Suggest specific fix with rationale
- [ ] Use verification-runner to test locally
- [ ] Apply fix in branch
- [ ] Validate pipeline passes
- [ ] Document fix in commit message
- [ ] Merge after verification

### Managing Pipeline Variables

- [ ] Identify variable type (secret vs non-secret)
- [ ] Use appropriate platform tool (gh secret, az pipelines variable, etc.)
- [ ] Never commit secrets to files
- [ ] Document required variables in README
- [ ] Verify variable is accessible in pipeline
- [ ] Test pipeline with new variable
- [ ] Rotate secrets regularly

---

## Anti-Patterns to Avoid

1. **Committing secrets** - Use platform secrets manager
2. **Testing in main** - Always test in branch first
3. **Skipping validation** - Always validate syntax
4. **Ignoring failures** - Diagnose before retrying
5. **Hardcoded values** - Use variables and secrets
6. **Undocumented secrets** - Document in README
7. **Single platform expertise** - Learn all supported platforms

---

## Success Criteria

- Pipeline validates successfully
- Syntax is correct for target platform
- All secrets managed through platform tools
- Required variables documented in README
- Pipeline tested in branch before main
- Logs provide clear error messages
- Variables are correctly referenced
- Pipeline runs successfully

---

## Reference Templates

- [GitHub Actions Templates](reference/github-actions-templates.md)
- [Azure Pipelines Templates](reference/azure-pipelines-templates.md)
- [Jenkins Templates](reference/jenkins-templates.md)
