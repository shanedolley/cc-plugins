---
name: gitops-repo-structure
description: Repository structure detection and pattern recommendations for GitOps workflows
---

# GitOps Repository Structure

## Overview

Repository structure is foundational to successful GitOps implementations. The right structure impacts:

- **Deployment workflows**: How code moves from commit to production
- **Team autonomy**: How independently teams can work
- **Change blast radius**: How failures propagate
- **Tooling complexity**: What tools and processes you need
- **Security boundaries**: How you control access and secrets

This skill helps detect existing repository structures, recommend patterns for new projects, and generate scaffolding that aligns with GitOps best practices.

## Operations

### Detect Existing Repository Structure

Analyze current repository layout to identify:
- Monorepo vs polyrepo pattern
- App code vs config separation
- Service boundaries and organization
- Tooling signals (workspaces, build systems)

### Recommend Structure for New Projects

Based on team size, service count, and deployment requirements:
- Default to App+Config separation for GitOps alignment
- Consider monorepo vs polyrepo trade-offs
- Account for existing organizational patterns

### Handle App Repo vs Config Repo Separation

GitOps tools (ArgoCD, Flux) work best with separated concerns:
- **App repo**: Application source code, tests, Dockerfiles
- **Config repo**: Kubernetes manifests, Helm charts, Kustomize overlays

### Manage Monorepo vs Polyrepo Decisions

Evaluate based on:
- Team structure and autonomy needs
- Service coupling and shared dependencies
- CI/CD complexity tolerance
- Organizational maturity

### Generate Structure Scaffolding

Create directory structures and placeholder files:
- Standard directory layout for chosen pattern
- Example manifests for ArgoCD or Flux
- CI/CD pipeline templates
- README with pattern explanation

## Detection Logic

### Monorepo Signals

```bash
# Directory structure indicators
- services/ or packages/ directory with multiple subdirectories
- apps/ directory with multiple applications
- libs/ or shared/ directory for common code

# Package manager workspaces
- package.json with "workspaces" field (npm, yarn, pnpm)
- Cargo.toml with [workspace] section
- go.work file (Go workspaces)
- pyproject.toml with tool.poetry.dependencies

# Monorepo tooling
- nx.json or nx workspace configuration
- turborepo.json or turbo.json
- lerna.json
- bazel WORKSPACE file
- pants BUILD files
```

### Polyrepo Signals

```bash
# Single-purpose indicators
- Single service at repository root
- No services/ or packages/ directory
- Focused package.json/Cargo.toml/go.mod at root
- README describing single service

# Independent deployment
- Standalone Dockerfile at root
- Single deployment configuration
- No workspace configuration
```

### App+Config Separation Signals

```bash
# Separate config repository indicators
- k8s/, manifests/, or deploy/ directory at root
- ArgoCD Application manifests
- Flux Kustomization resources
- Dedicated gitops/, argocd/, or flux/ directory

# GitOps tooling configuration
- argocd-apps/ directory with Application definitions
- flux-system/ directory with Flux controllers
- kustomization.yaml files with remote bases
- helm/ directory with Chart.yaml files
```

## Repository Patterns

| Pattern | Description | Best For | Trade-offs |
|---------|-------------|----------|------------|
| **Monorepo** | All application code in one repository with multiple services/packages | Related services, shared code libraries, coordinated releases | Complex tooling setup, single point of failure, larger clone size, requires workspace tooling |
| **Polyrepo** | Separate repository per service or component | Independent teams, service isolation, different release cadences | Harder cross-repo coordination, dependency version management, duplicated tooling |
| **App+Config** | Application code and Kubernetes manifests in separate repositories | GitOps workflows, ArgoCD/Flux, separation of concerns | More repositories to manage, synchronization complexity, requires GitOps tooling |

## Recommendation Logic

### For New Projects

**Default recommendation**: App+Config separation with polyrepo for apps

Rationale:
- GitOps best practice separates code from config
- Clear security boundaries (code repo vs deploy repo)
- ArgoCD/Flux integration is straightforward
- Teams can adopt monorepo for app code if needed

### For Existing Monorepo

**Recommendation**: Keep monorepo for app code, add separate config repo

Rationale:
- No need to break apart existing monorepo
- Add GitOps benefits without major refactoring
- Config repo references Docker images from monorepo builds
- Maintains existing team workflows

### For Small Teams (1-5 developers)

**Recommendation**: Monorepo for app code + config repo

Rationale:
- Easier to manage fewer repositories
- Shared code management is simpler
- Team coordination overhead is low
- Can split later if needed

### For Large Organizations (independent teams)

**Recommendation**: Polyrepo for apps + separate config repo(s)

Rationale:
- Team autonomy and ownership
- Independent release cycles
- Clear service boundaries
- Scalable access control

## Integration

This skill is called by the **gitops-engineer** agent when:
- Analyzing existing projects for GitOps adoption
- Setting up new services with CI/CD pipelines
- Recommending structural improvements
- Generating deployment scaffolding

The gitops-engineer uses structure recommendations to:
1. Determine where to place Kubernetes manifests
2. Design CI/CD pipelines appropriate for the pattern
3. Configure ArgoCD or Flux Applications
4. Set up repository access and permissions

## Usage Example

When invoked, this skill should:

1. **Detect current structure** by analyzing directory layout and tooling files
2. **Present findings** with detected pattern and confidence level
3. **Recommend improvements** if current structure has anti-patterns
4. **Offer scaffolding** to implement recommended structure

```bash
# Detection output example
Detected Pattern: Monorepo (high confidence)
Signals:
  - services/ directory with 4 subdirectories
  - package.json with workspaces configuration
  - Shared libs/ directory

GitOps Readiness: Partial
  - No separate config repository
  - Kubernetes manifests in services/*/k8s/

Recommendation:
  - Keep monorepo for application code
  - Create separate config repository for GitOps
  - Use ArgoCD to deploy from config repo
  - Config repo references images built from monorepo
```

## See Also

- [Structure Patterns Reference](reference/structure-patterns.md) - Detailed examples and migration paths
- **gitops-engineer** - Main agent that uses this skill
- **gitops-cicd-patterns** - CI/CD pipeline patterns for different structures
