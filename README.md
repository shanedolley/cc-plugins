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
- `debug` - Four-phase debugging framework (`/debug`)
- `tdd` - TDD enforcement RED-GREEN-REFACTOR (`/tdd`)
- `review` - Code review dispatch (`/review`)
- `architect` - Analyzes code, designs solutions, writes ADRs

### DevOps

CI/CD, GitOps, and infrastructure automation:

- `cicd-pipelines` - GitHub Actions, Azure Pipelines, Jenkins
- `cicd-deployments` - Rolling, blue-green, canary deployments
- `cicd-release` - Tag-triggered release automation
- `gitops-branching` - Branching strategy selection
- `gitops-worktrees` - Isolated git worktrees
- `finish` - Work completion guidance (`/finish`)
- `gitops-engineer` - Git operations agent

### Testing

Test-driven development and quality assurance:

- `tdd` - TDD enforcement (`/tdd`)
- `testing-anti-patterns` - Prevent testing bad practices
- `test-analyst-expert` - Comprehensive testing analysis
- `verify` - Verify before claiming done (`/verify`)
- `verification-runner` - Run verification commands

### Debugging

Debugging, troubleshooting, and root cause analysis:

- `debug` - Evidence-based debugging (`/debug`)
- `debugger` - Complex debugging agent
- `rca` - Trace bugs to source (`/rca`)
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
