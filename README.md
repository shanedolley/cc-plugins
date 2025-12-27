# Claude Plugins Marketplace

A curated collection of Claude Code skills and agents for enhanced development workflows.

## Quick Start

### Add This Marketplace

```bash
/plugin marketplace add shanedolley/claude-plugins
```

### Install Individual Plugins

```bash
# Install a single plugin
/plugin install developer

# Install multiple plugins
/plugin install developer architect debugger
```

### Install Collections

Collections are curated bundles of related plugins:

```bash
# Essential development plugins
/plugin install collection:essential

# DevOps and CI/CD plugins
/plugin install collection:devops

# Testing and quality assurance
/plugin install collection:testing

# Debugging and troubleshooting
/plugin install collection:debugging
```

## Available Collections

### Essential

Core development workflow plugins for everyday use:

- `developer` - Implements your specs with tests
- `systematic-debugging` - Four-phase debugging framework
- `test-driven-development` - TDD enforcement (RED-GREEN-REFACTOR)
- `requesting-code-review` - Code review dispatch
- `architect` - Analyzes code, designs solutions, writes ADRs

### DevOps

CI/CD, GitOps, and infrastructure automation:

- `cicd-pipelines` - GitHub Actions, Azure Pipelines, Jenkins
- `cicd-deployments` - Rolling, blue-green, canary deployments
- `cicd-release` - Tag-triggered release automation
- `gitops-branching` - Branching strategy selection
- `gitops-worktrees` - Isolated git worktrees
- `gitops-completion` - Work completion guidance
- `gitops-engineer` - Git operations agent

### Testing

Test-driven development and quality assurance:

- `test-driven-development` - TDD enforcement
- `testing-anti-patterns` - Prevent testing bad practices
- `test-analyst-expert` - Comprehensive testing analysis
- `verification-before-completion` - Verify before claiming done
- `verification-runner` - Run verification commands

### Debugging

Debugging, troubleshooting, and root cause analysis:

- `systematic-debugging` - Evidence-based debugging
- `debugger` - Complex debugging agent
- `root-cause-tracing` - Trace bugs to source
- `condition-based-waiting` - Fix race conditions
- `defense-in-depth` - Multi-layer validation

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
| executing-plans | Execute plans in batches | core-workflow |
| gitops-branching | Branching strategy | gitops |
| gitops-completion | Work completion guidance | gitops |
| gitops-conflicts | Conflict resolution | gitops |
| gitops-recovery | Complex git operations | gitops |
| gitops-release | Release preparation | gitops |
| gitops-repo-structure | Repository structure patterns | gitops |
| gitops-secrets | Repository-level secrets | gitops |
| gitops-worktrees | Isolated git worktrees | gitops |
| linear-issue-updater | Update Linear issues | task-management |
| performance-profiling | Performance analysis | development |
| receiving-code-review | Handle code review feedback | code-review |
| remembering-conversations | Session memory | memory |
| requesting-code-review | Request code review | code-review |
| reviewing-github-prs | GitHub PR review | code-review |
| root-cause-tracing | Trace bugs to source | debugging |
| security-review | Security-focused review | security |
| sharing-skills | Contribute skills upstream | core-workflow |
| subagent-driven-development | Dispatch subagents | core-workflow |
| systematic-debugging | Four-phase debugging | debugging |
| task-classifier | Route tasks to agents | task-management |
| taskmaster-workflow | Initialize task-master | task-management |
| test-driven-development | TDD enforcement | testing |
| testing-anti-patterns | Prevent bad testing | testing |
| testing-skills-with-subagents | Test skills with subagents | testing |
| tm-execute-workflow | Task execution orchestration | task-management |
| tm-finish-workflow | Complete task execution | task-management |
| tm-implement-workflow | Task implementation | task-management |
| tm-next-workflow | Get next task | task-management |
| tm-review-workflow | Task review | task-management |
| tm-worktree-workflow | Task worktree setup | task-management |
| unified-shaping-workflow | Shape ideas to implementation | core-workflow |
| using-superpowers | Mandatory workflows | foundation |
| verification-before-completion | Verify before claiming done | verification |
| verification-runner | Run verification commands | verification |
| writing-clearly-and-concisely | Apply writing rules | documentation |
| writing-plans | Create implementation plans | core-workflow |
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
    ├── skills/               # Skill definitions (optional)
    │   └── my-skill.md
    ├── agents/               # Agent definitions (optional)
    │   └── my-agent.md
    └── README.md             # Documentation
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Creating new plugins
- Plugin structure requirements
- Submission process
- Validation requirements

## License

MIT License - see individual plugin licenses for specific terms.
