# CC Plugins Marketplace

A curated collection of Claude Code skills and agents for enhanced development workflows.

## Quick Start

### Add This Marketplace

```bash
/plugin marketplace add shanedolley/cc-plugins
```

### Install Individual Plugins

```bash
# Install a single plugin
/plugin install developer

# Install multiple plugins
/plugin install developer architect debugger
```

### Slash Commands

Many plugins include slash commands that invoke their skills:

```bash
# Debug with systematic four-phase framework
/debug

# Run TDD workflow
/tdd

# Shape an idea into implementation
/shape

# Review implementation against plan
/review
```

### Install Categories

Categories are curated bundles of related plugins. Some categories have dependencies that are automatically installed:

```bash
# Plan & Implement (16 plugins + auto-installs git, testing, review dependencies)
/plugin install collection:plan-implement

# Programming Languages (8 plugins)
/plugin install collection:programming-languages

# Architecture & Design (6 plugins)
/plugin install collection:architecture-design

# Git & Version Control (9 plugins)
/plugin install collection:git-version-control

# CI/CD & Infrastructure (11 plugins)
/plugin install collection:cicd-infrastructure

# Code Review & Quality (7 plugins)
/plugin install collection:code-review-quality

# Debugging & Testing (11 plugins)
/plugin install collection:debugging-testing

# Data & Analytics (5 plugins)
/plugin install collection:data-analytics

# Documentation & Writing (4 plugins)
/plugin install collection:documentation-writing

# Memory & Search (2 plugins)
/plugin install collection:memory-search

# Utility (3 plugins)
/plugin install collection:utility
```

## Available Categories

### Plan & Implement (16 plugins)

Planning, execution & task management workflows. **Auto-installs dependencies from:** git-version-control, debugging-testing, code-review-quality

- `shape` - Shape ideas to implementation (`/shape`)
- `verify` - Verify before claiming done (`/verify`)
- `execute-plan` - Execute plans in batches (`/execute-plan`)
- `write-plan` - Create implementation plans (`/write-plan`)
- `using-superpowers` - Mandatory skill workflows
- `task-classifier` - Route tasks to agents
- `verification-runner` - Run verification commands
- `taskmaster` - Initialize task-master (`/taskmaster`)
- `tm-execute` - Task execution orchestration (`/tm-execute`)
- `tm-implement` - Task implementation (`/tm-implement`)
- `tm-review` - Task review (`/tm-review`)
- `tm-finish` - Complete task execution (`/tm-finish`)
- `tm-next` - Get next task (`/tm-next`)
- `tm-worktree` - Task worktree setup (`/tm-worktree`)
- `linear-issue-manager` - Linear issue management
- `linear-issue-updater` - Update Linear issues

### Programming Languages (8 plugins)

Language-specific development experts:

- `golang-pro` - Go 1.21+ with modern patterns
- `java-pro` - Java 21+ with virtual threads, Spring Boot 3.x
- `javascript-pro` - Modern JavaScript ES6+, async patterns
- `python-pro` - Python 3.12+ with async, production practices
- `python-architect` - Python design and implementation
- `rust-pro` - Rust 1.75+ with async, systems programming
- `typescript-pro` - Advanced types, generics, strict type safety
- `prompt-engineer` - Advanced prompting techniques

### Architecture & Design (6 plugins)

System design, API architecture & ML engineering:

- `architect` - Lead architect, designs solutions, writes ADRs
- `architecture-decisions` - ADRs with alternatives analysis
- `graphql-architect` - GraphQL federation, performance
- `kubernetes-architect` - K8s, GitOps, cloud-native
- `api-development` - API design, documentation, versioning
- `ml-engineer` - Production ML with PyTorch, TensorFlow

### Git & Version Control (9 plugins)

Git operations, branching & release management:

- `gitops-engineer` - Centralized git operations agent
- `gitops-branching` - Branching strategy selection
- `gitops-conflicts` - Conflict resolution
- `gitops-recovery` - Complex git operations (rebase, bisect)
- `gitops-release` - Release preparation, changelog, tagging
- `gitops-repo-structure` - Repository structure patterns
- `gitops-secrets` - Repository secrets with SOPS, GitCrypt
- `gitops-worktrees` - Isolated git worktrees
- `finish` - Work completion guidance (`/finish`)

### CI/CD & Infrastructure (11 plugins)

Pipelines, deployments & infrastructure automation:

- `ci-cd-engineer` - Centralized pipeline/automation agent
- `cicd-pipelines` - GitHub Actions, Azure Pipelines, Jenkins
- `cicd-deployments` - Rolling, blue-green, canary
- `cicd-feature-flags` - Feature flags with PostHog
- `cicd-gitops-tools` - ArgoCD, Flux configuration
- `cicd-promotion` - Environment promotion pipelines
- `cicd-release` - Tag-triggered releases
- `cicd-secrets-infra` - External Secrets Operator
- `terraform-specialist` - Terraform/OpenTofu IaC
- `observability-engineer` - Monitoring, logging, tracing
- `performance-engineer` - Performance optimization

### Code Review & Quality (7 plugins)

Code review workflows & quality assurance:

- `code-reviewer` - Review against plan and standards
- `pr-review` - GitHub PR review (`/pr-review`)
- `quality-reviewer` - Reviews for security, performance
- `review` - Request code review (`/review`)
- `receiving-code-review` - Handle review feedback
- `security-auditor` - DevSecOps, compliance frameworks
- `security-review` - OWASP Top 10, secret detection

### Debugging & Testing (11 plugins)

TDD, debugging & troubleshooting:

- `tdd` - TDD enforcement RED-GREEN-REFACTOR (`/tdd`)
- `tdd-orchestrator` - Multi-agent TDD coordination
- `debug` - Four-phase debugging (`/debug`)
- `debugger` - Complex debugging agent
- `rca` - Trace bugs to source (`/rca`)
- `defense-in-depth` - Multi-layer validation
- `condition-based-waiting` - Fix race conditions
- `testing-anti-patterns` - Prevent bad testing practices
- `testing-skills-with-subagents` - Test skills with subagents
- `error-detective` - Error pattern analysis
- `test-analyst-expert` - Comprehensive testing analysis

### Data & Analytics (5 plugins)

Data science, database optimization & analytics:

- `data-scientist` - Advanced analytics, ML, statistical modeling
- `data-analyst-investigator` - Deep analytical investigation
- `database-optimizer` - Database performance tuning
- `database-operations` - Schema changes, migrations
- `inventory-optimizer` - Inventory analysis, supply orders

### Documentation & Writing (4 plugins)

Technical writing & documentation:

- `technical-writer` - Documentation creation
- `writing-clearly-and-concisely` - Strunk's writing rules
- `writing-skills` - Create and test skills
- `sharing-skills` - Contribute skills upstream

### Memory & Search (2 plugins)

Session memory & conversation search:

- `remember` - Session memory (`/remember`)
- `search-conversations` - Search conversation history

### Utility (3 plugins)

Core development utilities:

- `developer` - Implements specs with tests
- `subagent-driven-development` - Dispatch subagents per task
- `performance-profiling` - Performance analysis workflows

## External Dependencies

Some plugins require external tools to be installed. Below is the complete reference.

### Required for All Users

| Tool | Description | Install |
|------|-------------|---------|
| `git` | Version control system | https://git-scm.com/downloads |

### Category-Specific Requirements

| Category | Required Tools |
|----------|---------------|
| **plan-implement** | `git`, `task-master`, `lincli` |
| **programming-languages** | `go`, `java`, `mvn`, `gradle`, `node`, `npm`, `python`, `pip`, `poetry`, `cargo` |
| **architecture-design** | `kubectl`, `helm`, `docker` |
| **git-version-control** | `git`, `gh`, `sops`, `git-crypt`, `gpg` |
| **cicd-infrastructure** | `git`, `gh`, `docker`, `kubectl`, `helm`, `argocd`, `flux`, `terraform`, `az`, `actionlint`, `trivy` |
| **code-review-quality** | `git`, `gh`, `docker`, `trivy` |
| **debugging-testing** | None |
| **data-analytics** | `supabase` |
| **documentation-writing** | None |
| **memory-search** | None |
| **utility** | `git`, `npm`, `pip`, `cargo`, `go` |

### Installation Commands

#### Package Managers & Runtimes

```bash
# Node.js (includes npm)
# https://nodejs.org or: nvm install node

# Python (includes pip)
# https://python.org or: pyenv install 3.12

# Go
# https://go.dev/dl/

# Rust (includes cargo)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Java
# https://adoptium.net or: sdk install java
```

#### CLI Tools

```bash
# GitHub CLI
brew install gh
gh auth login  # Required: authorize with GitHub

# Task Master (required for plan-implement)
npm install -g task-master-ai

# Linear CLI (required for plan-implement)
git clone https://github.com/shanedolley/lincli
cd lincli
make deps
make build
make install   # Installs to /usr/local/bin (requires sudo)
lincli auth    # Required: authorize with Linear

# Supabase CLI (required for data-analytics)
npm install -g supabase
```

> **Note:** Both `gh` and `lincli` require authorization before first use. Run `gh auth login` and `lincli auth` respectively to complete setup.

#### Infrastructure Tools

```bash
# Docker
# https://docker.com/get-started

# Kubernetes
brew install kubectl helm kustomize

# GitOps
brew install argocd
brew install fluxcd/tap/flux

# Terraform
brew install terraform
# or OpenTofu: brew install opentofu

# Azure CLI
brew install azure-cli
```

#### Security & Secrets

```bash
# Secrets management
brew install sops git-crypt gnupg

# Vulnerability scanning
brew install trivy grype tfsec
pip install checkov

# GitHub Actions linting
brew install actionlint
```

## All Plugins

### Skills (50)

| Plugin | Description | Category |
|--------|-------------|----------|
| api-development | API design, documentation, versioning | operations |
| architecture-decisions | ADRs with alternatives analysis | quality-gates |
| cicd-deployments | Deployment strategies | cicd |
| cicd-feature-flags | Feature flag management | cicd |
| cicd-gitops-tools | ArgoCD and Flux configuration | cicd |
| cicd-pipelines | Pipeline creation and debugging | cicd |
| cicd-promotion | Environment promotion pipelines | cicd |
| cicd-release | Tag-triggered releases | cicd |
| cicd-secrets-infra | Infrastructure secrets management | cicd |
| condition-based-waiting | Fix race conditions | verification |
| database-operations | Schema changes, migrations | database |
| defense-in-depth | Multi-layer validation | verification |
| execute-plan | Execute plans in batches (`/execute-plan`) | core-workflow |
| gitops-branching | Branching strategy | gitops |
| finish | Work completion guidance (`/finish`) | gitops |
| gitops-conflicts | Conflict resolution | gitops |
| gitops-recovery | Complex git operations | gitops |
| gitops-release | Release preparation | gitops |
| gitops-repo-structure | Repository structure patterns | gitops |
| gitops-secrets | Repository-level secrets | gitops |
| gitops-worktrees | Isolated git worktrees | gitops |
| linear-issue-updater | Update Linear issues | task-management |
| performance-profiling | Performance analysis | development |
| receiving-code-review | Handle code review feedback | code-review |
| remember | Session memory (`/remember`) | memory |
| review | Request code review (`/review`) | code-review |
| pr-review | GitHub PR review (`/pr-review`) | code-review |
| rca | Trace bugs to source (`/rca`) | debugging |
| security-review | Security-focused review | security |
| sharing-skills | Contribute skills upstream | core-workflow |
| subagent-driven-development | Dispatch subagents | core-workflow |
| debug | Four-phase debugging (`/debug`) | debugging |
| task-classifier | Route tasks to agents | task-management |
| taskmaster | Initialize task-master (`/taskmaster`) | task-management |
| tdd | TDD enforcement (`/tdd`) | testing |
| testing-anti-patterns | Prevent bad testing | testing |
| testing-skills-with-subagents | Test skills with subagents | testing |
| tm-execute | Task execution orchestration (`/tm-execute`) | task-management |
| tm-finish | Complete task execution (`/tm-finish`) | task-management |
| tm-implement | Task implementation (`/tm-implement`) | task-management |
| tm-next | Get next task (`/tm-next`) | task-management |
| tm-review | Task review (`/tm-review`) | task-management |
| tm-worktree | Task worktree setup (`/tm-worktree`) | task-management |
| shape | Shape ideas to implementation (`/shape`) | core-workflow |
| using-superpowers | Mandatory workflows | foundation |
| verify | Verify before claiming done (`/verify`) | verification |
| verification-runner | Run verification commands | verification |
| writing-clearly-and-concisely | Apply writing rules | documentation |
| write-plan | Create implementation plans (`/write-plan`) | core-workflow |
| writing-skills | Create and test skills | core-workflow |

### Agents (32)

| Plugin | Description | Category |
|--------|-------------|----------|
| architect | Designs solutions, writes ADRs | architecture |
| ci-cd-engineer | Pipeline and automation operations | cicd |
| code-reviewer | Review against plan and standards | code-review |
| data-analyst-investigator | Deep analytical investigation | data |
| data-scientist | Data science workflows | data |
| database-optimizer | Database optimization | database |
| debugger | Complex debugging agent | debugging |
| developer | Implements specs with tests | development |
| error-detective | Error analysis | debugging |
| gitops-engineer | Git operations agent | gitops |
| golang-pro | Go development | development |
| graphql-architect | GraphQL API design | architecture |
| inventory-optimizer | Inventory analysis | operations |
| java-pro | Java development | development |
| javascript-pro | JavaScript development | development |
| kubernetes-architect | Kubernetes architecture | infrastructure |
| linear-issue-manager | Linear issue management | task-management |
| ml-engineer | Machine learning workflows | ai-ml |
| observability-engineer | Observability setup | monitoring |
| performance-engineer | Performance optimization | development |
| prompt-engineer | Prompt engineering | ai-ml |
| python-architect | Python design and implementation | development |
| python-pro | Python development | development |
| quality-reviewer | Code quality review | code-review |
| rust-pro | Rust development | development |
| search-conversations | Search conversation history | memory |
| security-auditor | Security auditing | security |
| tdd-orchestrator | TDD orchestration | testing |
| technical-writer | Documentation creation | documentation |
| terraform-specialist | Terraform infrastructure | infrastructure |
| test-analyst-expert | Testing analysis | testing |
| typescript-pro | TypeScript development | development |

## Plugin Structure

Each plugin follows this structure:

```
plugins/
└── my-plugin/
    ├── .claude-plugin/
    │   └── plugin.json       # Plugin metadata
    ├── commands/             # Slash commands (optional)
    │   └── my-command.md
    ├── skills/               # Skill definitions (optional)
    │   └── my-skill.md
    ├── agents/               # Agent definitions (optional)
    │   └── my-agent.md
    └── README.md             # Documentation
```

Command-centric plugins bundle both a slash command and its underlying skill together. When you install the plugin, you get both the `/command` and the skill it invokes.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Creating new plugins
- Plugin structure requirements
- Submission process
- Validation requirements

## License

MIT License - see individual plugin licenses for specific terms.
