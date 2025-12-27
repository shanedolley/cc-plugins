---
name: gitops-secrets
description: Repository-level secrets encryption with SOPS and GitCrypt for secure version control
---

# GitOps Secrets Management

## Overview

This skill provides repository-level secrets encryption using SOPS (Secrets OPerationS) and GitCrypt. These tools enable secure storage of sensitive configuration files in Git repositories by encrypting them before commit.

**SOPS** is the recommended tool for cloud-native environments, offering flexible key management through integration with AWS KMS, GCP KMS, Azure Key Vault, age, and PGP. It supports partial encryption (encrypting values while leaving keys readable) and works with multiple file formats (YAML, JSON, ENV, INI).

**GitCrypt** provides a simpler GPG-based approach with transparent encryption/decryption, making it ideal for smaller repositories with straightforward requirements.

## Operations

### Initialize SOPS in Repository

1. Install SOPS on the system
2. Create `.sops.yaml` configuration file in repository root
3. Define encryption rules based on file paths and patterns
4. Configure key management backend (age, AWS KMS, GCP KMS, Azure Key Vault, or PGP)
5. Encrypt initial sensitive files using `sops` command
6. Add `.sops.yaml` to version control
7. Document SOPS usage in repository README

### Initialize GitCrypt in Repository

1. Install git-crypt on the system
2. Initialize git-crypt in repository: `git-crypt init`
3. Export and securely store the symmetric key
4. Configure `.gitattributes` to specify which files should be encrypted
5. Add collaborators' GPG keys: `git-crypt add-gpg-user <GPG_KEY_ID>`
6. Add `.gitattributes` to version control
7. Document git-crypt usage in repository README

### Encrypt Sensitive Files

**With SOPS:**
```bash
# Encrypt a file
sops -e secrets.yaml > secrets.enc.yaml

# Edit encrypted file (decrypts to temp file)
sops secrets.enc.yaml

# Decrypt a file
sops -d secrets.enc.yaml > secrets.yaml
```

**With GitCrypt:**
```bash
# Files matching .gitattributes patterns are automatically encrypted on commit
git add sensitive-config.env
git commit -m "Add encrypted configuration"

# Unlock repository (decrypt files)
git-crypt unlock

# Lock repository (no action needed, happens automatically)
```

### Configure .gitattributes for Automatic Encryption

Create or update `.gitattributes` with patterns for files requiring encryption:

```
# Encrypt all files in secrets/ directory
secrets/** filter=git-crypt diff=git-crypt

# Encrypt specific file types
*.key filter=git-crypt diff=git-crypt
*.pem filter=git-crypt diff=git-crypt
.env.* filter=git-crypt diff=git-crypt

# Encrypt specific files
config/credentials.json filter=git-crypt diff=git-crypt
```

### Rotate Encryption Keys

**SOPS Key Rotation:**
1. Add new key to `.sops.yaml` configuration
2. Rotate keys on encrypted files: `sops rotate <file>`
3. Remove old key from configuration
4. Commit updated encrypted files

**GitCrypt Key Rotation:**
1. Export current repository state
2. Remove git-crypt: `git-crypt lock` and delete `.git-crypt/`
3. Re-initialize with new keys: `git-crypt init`
4. Re-add collaborators with new GPG keys
5. Force re-encryption: commit all files again

### Audit for Leaked Secrets

Use scanning tools to detect accidentally committed secrets:

**git-secrets:**
```bash
# Install git-secrets
brew install git-secrets  # macOS
apt-get install git-secrets  # Linux

# Initialize in repository
git secrets --install
git secrets --register-aws  # Add AWS patterns

# Scan repository history
git secrets --scan-history
```

**gitleaks:**
```bash
# Install gitleaks
brew install gitleaks  # macOS

# Scan repository
gitleaks detect --source . --verbose

# Scan with custom config
gitleaks detect --config .gitleaks.toml
```

**Remediation:**
- If secrets are found, rotate the compromised credentials immediately
- Use `git filter-branch` or `BFG Repo-Cleaner` to remove from history
- Force push cleaned history (coordinate with team)
- Add patterns to prevent future leaks

## Tool Comparison

| Tool | Best For | Key Management | File Format Support | Encryption Granularity |
|------|----------|----------------|---------------------|------------------------|
| SOPS | Cloud-native deployments, KMS integration, multiple formats | AWS KMS, GCP KMS, Azure Key Vault, age, PGP | YAML, JSON, ENV, INI, binary | Value-level (partial encryption) |
| GitCrypt | Simple repositories, GPG-based workflows, transparent operation | GPG keys only | Any file type | File-level (full encryption) |

**Choose SOPS when:**
- Using cloud provider key management services
- Need to encrypt only sensitive values while keeping structure readable
- Working with multiple file formats (YAML, JSON, etc.)
- Require audit trails from cloud KMS systems

**Choose GitCrypt when:**
- Using GPG for team key management
- Need transparent encryption (files auto-decrypt after unlock)
- Want simple setup with minimal configuration
- Working with binary files or entire file encryption

## Integration

This skill is invoked by the **gitops-engineer** agent when:
- Setting up new GitOps repositories requiring secrets management
- Implementing secure configuration storage for IaC tools (Terraform, Ansible)
- Configuring encrypted Kubernetes manifests
- Establishing secrets encryption standards for development teams

The gitops-engineer agent determines the appropriate tool based on:
- Existing infrastructure (cloud provider KMS availability)
- Team key management practices (GPG vs cloud KMS)
- Repository complexity and compliance requirements

## Best Practices

1. **Never commit unencrypted secrets** - Use pre-commit hooks to prevent accidents
2. **Document key management** - Maintain clear documentation on how to access encryption keys
3. **Test decryption in CI/CD** - Ensure pipelines can decrypt secrets properly
4. **Separate public and private repos** - Consider architecture before choosing encryption strategy
5. **Regular key rotation** - Establish schedule for rotating encryption keys
6. **Backup keys securely** - Store encryption keys in secure, separate location
7. **Limit access** - Only grant decryption access to necessary team members
8. **Audit regularly** - Scan for leaked secrets and review access patterns

## See Also

- `reference/sops-setup.md` - Detailed SOPS installation and configuration
- `reference/gitcrypt-setup.md` - Complete GitCrypt setup guide
- `skills/cicd-secrets-infra/` - Infrastructure-side secrets management with External Secrets Operator
