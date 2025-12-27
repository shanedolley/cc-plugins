---
name: cicd-release
description: Tag-triggered release pipeline execution and artifact publishing
---

# CI/CD Release

## Overview

This skill handles the CI/CD-side responsibilities in the release workflow. It is triggered when a version tag is pushed to the repository and orchestrates the complete release process: building artifacts, publishing to registries, running validation, and creating release notes.

**Key Responsibility:** Execute the automated release pipeline after receiving a git tag from the `gitops-release` skill.

## Trigger

**Activated on git tag push matching pattern `v*`**

This skill is the handoff point from `gitops-release`. When a git tag like `v1.3.0` is pushed, the CI/CD system automatically triggers this workflow.

**Tag Detection:**
```yaml
# GitHub Actions
on:
  push:
    tags:
      - 'v*'

# Azure Pipelines
trigger:
  tags:
    include:
      - v*
```

## Operations

### 1. Detect Tag Push and Parse Version

Extract version information from the tag:

```bash
# Get tag name
TAG=${GITHUB_REF#refs/tags/}  # GitHub Actions
TAG=${BUILD_SOURCEBRANCH#refs/tags/}  # Azure Pipelines

# Parse version components
VERSION=${TAG#v}  # Remove 'v' prefix
MAJOR=$(echo $VERSION | cut -d. -f1)
MINOR=$(echo $VERSION | cut -d. -f2)
PATCH=$(echo $VERSION | cut -d. -f3)

echo "Releasing version: $VERSION"
echo "Components: MAJOR=$MAJOR MINOR=$MINOR PATCH=$PATCH"
```

**Validation:**
- Verify tag matches semantic version pattern: `v[0-9]+\.[0-9]+\.[0-9]+`
- Reject tags that don't follow semver (exit with error)

### 2. Build and Sign Artifacts

Build platform-specific artifacts and sign them for verification.

#### Container Images

**Build multi-platform images:**
```bash
# Docker build with buildx for multi-platform
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/org/repo:$VERSION \
  --tag ghcr.io/org/repo:latest \
  --push \
  .
```

**Sign container images:**
```bash
# Sign with cosign
cosign sign --key cosign.key ghcr.io/org/repo:$VERSION

# Generate SBOM (Software Bill of Materials)
syft ghcr.io/org/repo:$VERSION -o spdx-json > sbom.json
```

#### Binary Artifacts

**Build for multiple platforms:**
```bash
# Go example
GOOS=linux GOARCH=amd64 go build -o dist/app-linux-amd64
GOOS=darwin GOARCH=amd64 go build -o dist/app-darwin-amd64
GOOS=windows GOARCH=amd64 go build -o dist/app-windows-amd64.exe

# Rust example
cargo build --release --target x86_64-unknown-linux-gnu
cargo build --release --target x86_64-apple-darwin
cargo build --release --target x86_64-pc-windows-gnu
```

**Sign binaries:**
```bash
# Create checksums
sha256sum dist/* > dist/checksums.txt

# Sign checksums with GPG
gpg --detach-sign --armor dist/checksums.txt
```

#### Package Artifacts

**Node.js / npm:**
```bash
# Build
npm run build

# Pack
npm pack

# Will publish in next step
```

**Python / PyPI:**
```bash
# Build distributions
python -m build

# Creates dist/*.whl and dist/*.tar.gz
```

**Rust / crates.io:**
```bash
# Build
cargo build --release

# Will publish in next step
```

### 3. Publish to Registries

Publish artifacts to appropriate package registries.

#### Container Registries

**Docker Hub:**
```bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push orgname/repo:$VERSION
docker push orgname/repo:latest
```

**GitHub Container Registry:**
```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
docker push ghcr.io/org/repo:$VERSION
docker push ghcr.io/org/repo:latest
```

**Azure Container Registry:**
```bash
az acr login --name myregistry
docker push myregistry.azurecr.io/repo:$VERSION
docker push myregistry.azurecr.io/repo:latest
```

#### Package Registries

**npm:**
```bash
# Authenticate
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Publish
npm publish --access public
```

**PyPI:**
```bash
# Publish with twine
twine upload dist/*
```

**crates.io:**
```bash
# Publish with cargo
cargo publish --token ${CARGO_TOKEN}
```

**NuGet:**
```bash
# Pack
dotnet pack -c Release

# Push
dotnet nuget push bin/Release/*.nupkg --api-key ${NUGET_TOKEN} --source https://api.nuget.org/v3/index.json
```

### 4. Run Release Validation

Execute validation tests on published artifacts before finalizing the release.

#### Smoke Tests

**Pull and test published image:**
```bash
# Pull the just-published image
docker pull ghcr.io/org/repo:$VERSION

# Run basic smoke tests
docker run --rm ghcr.io/org/repo:$VERSION --version
docker run --rm ghcr.io/org/repo:$VERSION health-check
```

**Test published package:**
```bash
# npm: Install in clean environment
npm install -g your-package@$VERSION
your-package --version

# PyPI: Install in clean virtualenv
python -m venv test-env
source test-env/bin/activate
pip install your-package==$VERSION
your-package --version
```

#### Security Scans

**Container image scanning:**
```bash
# Trivy vulnerability scan
trivy image --severity HIGH,CRITICAL ghcr.io/org/repo:$VERSION

# Grype scan
grype ghcr.io/org/repo:$VERSION --fail-on high
```

**Dependency audit:**
```bash
# npm audit
npm audit --production --audit-level=high

# pip audit
pip-audit

# cargo audit
cargo audit
```

#### Integration Tests

Run integration test suite against the release:
```bash
# Set version for integration tests
export RELEASE_VERSION=$VERSION

# Run integration test suite
npm run test:integration
# or
pytest tests/integration/
# or
cargo test --release -- --test-threads=1
```

### 5. Create GitHub Release / Azure DevOps Release

Create a release in the platform with changelog and artifacts.

#### GitHub Release

**Using gh CLI:**
```bash
# Extract changelog for this version
CHANGELOG=$(awk '/^## \['$VERSION'\]/,/^## \[/' CHANGELOG.md | head -n -1)

# Create release
gh release create $TAG \
  --title "Release $VERSION" \
  --notes "$CHANGELOG" \
  dist/*

# Or mark as pre-release
gh release create $TAG \
  --title "Release $VERSION" \
  --notes "$CHANGELOG" \
  --prerelease \
  dist/*
```

**Using GitHub API:**
```bash
# Create release
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/org/repo/releases \
  -d "{
    \"tag_name\": \"$TAG\",
    \"name\": \"Release $VERSION\",
    \"body\": \"$CHANGELOG\",
    \"draft\": false,
    \"prerelease\": false
  }"
```

#### Azure DevOps Release

**Using Azure CLI:**
```bash
# Create release definition and trigger
az pipelines release create \
  --organization https://dev.azure.com/org \
  --project myproject \
  --definition-id 1 \
  --artifact-metadata version=$VERSION
```

### 6. Execute Rollback if Validation Fails

If any validation step fails, execute automated rollback procedures.

**Rollback Actions:**

1. **Delete Git Tag** (optional, for failed releases):
```bash
# Delete local tag
git tag -d $TAG

# Delete remote tag
git push origin :refs/tags/$TAG
```

2. **Unpublish Package** (if supported):
```bash
# npm: Unpublish within 72 hours
npm unpublish your-package@$VERSION

# Note: Many registries don't support unpublishing
# Instead, publish a new patch version with fixes
```

3. **Delete Container Images**:
```bash
# GitHub Container Registry
gh api -X DELETE /user/packages/container/repo/versions/$VERSION_ID

# Docker Hub
docker rmi orgname/repo:$VERSION
```

4. **Mark Release as Failed**:
```bash
# GitHub: Delete or mark as draft
gh release delete $TAG --yes

# Or edit to add failure notice
gh release edit $TAG --notes "⚠️ Release failed validation. Do not use."
```

5. **Notify Team**:
```bash
# Send notification to Slack/Teams
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "❌ Release '$VERSION' failed validation and has been rolled back.",
    "attachments": [{
      "color": "danger",
      "fields": [{
        "title": "Failure Reason",
        "value": "Security scan found critical vulnerabilities"
      }]
    }]
  }'
```

## Release Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ gitops-release: Push git tag (v1.3.0)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ CI/CD Trigger: Detect tag push                          │
│ - Parse version from tag                                │
│ - Validate semver format                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Build Stage                                             │
│ - Build container images (multi-platform)               │
│ - Build binaries (multiple OS/arch)                     │
│ - Build packages (npm, PyPI, etc.)                      │
│ - Generate SBOM                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Sign Stage                                              │
│ - Sign container images (cosign)                        │
│ - Sign binaries (GPG)                                   │
│ - Generate checksums                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Publish Stage                                           │
│ - Push to container registry                            │
│ - Publish to package registry (npm, PyPI, etc.)         │
│ - Upload release artifacts                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Validation Stage                                        │
│ - Run smoke tests on published artifacts                │
│ - Security scans (Trivy, Grype)                         │
│ - Integration tests                                     │
│ - Dependency audit                                      │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
   ✅ Success               ❌ Failure
         │                       │
         ▼                       ▼
┌────────────────────┐  ┌─────────────────────┐
│ Create Release     │  │ Execute Rollback    │
│ - GitHub Release   │  │ - Delete tag        │
│ - Attach artifacts │  │ - Unpublish package │
│ - Add changelog    │  │ - Notify team       │
│ - Send notification│  │ - Mark failed       │
└────────────────────┘  └─────────────────────┘
```

## Rollback

### Rollback Criteria

Automatically rollback if:
- **Security scans fail**: Critical or high vulnerabilities detected
- **Smoke tests fail**: Published artifact doesn't run correctly
- **Integration tests fail**: Breaking changes detected
- **Publishing fails**: Unable to push to registry (partial publish)

### Rollback Procedures

**1. Immediate Actions (Automatic):**
- Stop pipeline execution
- Delete or retract published artifacts (where possible)
- Delete git tag (optional, based on policy)
- Mark release as failed

**2. Communication (Automatic):**
- Send alert to team via Slack/Teams
- Update release status to "Failed"
- Log detailed failure information

**3. Recovery (Manual):**
- Review failure logs
- Fix issues in codebase
- Create new commit with fixes
- Trigger new release with patch version

### Example Rollback Scenario

**Release v1.3.0 fails security scan:**

```bash
# 1. Detect critical vulnerabilities
trivy image ghcr.io/org/repo:1.3.0 --severity CRITICAL --exit-code 1
# Exit code 1 triggers rollback

# 2. Delete published container image
docker rmi ghcr.io/org/repo:1.3.0
gh api -X DELETE /user/packages/container/repo/versions/$VERSION_ID

# 3. Notify team
curl -X POST $SLACK_WEBHOOK_URL -d '{
  "text": "❌ Release 1.3.0 failed: Critical vulnerability CVE-2023-12345",
  "attachments": [{
    "color": "danger",
    "text": "Rolling back release. Fix required before re-releasing."
  }]
}'

# 4. Delete git tag (optional)
git push origin :refs/tags/v1.3.0

# 5. Manual: Fix vulnerability, commit, release v1.3.1
```

## Integration

This skill is invoked by the **ci-cd-engineer agent** when:
- Git tag matching `v*` pattern is pushed to repository
- Tag is created by `gitops-release` skill
- CI/CD pipeline is triggered by tag event

The ci-cd-engineer agent:
1. Detects tag push event
2. Invokes this skill to execute release pipeline
3. Monitors each stage for failures
4. Executes rollback procedures if needed
5. Reports final release status

## Platform-Specific Examples

### GitHub Actions Complete Workflow

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Parse version
        id: version
        run: |
          TAG=${GITHUB_REF#refs/tags/}
          VERSION=${TAG#v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "tag=$TAG" >> $GITHUB_OUTPUT

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ steps.version.outputs.version }}
            ghcr.io/${{ github.repository }}:latest

      - name: Run security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/${{ github.repository }}:${{ steps.version.outputs.version }}
          exit-code: 1
          severity: CRITICAL,HIGH

      - name: Run smoke tests
        run: |
          docker run --rm ghcr.io/${{ github.repository }}:${{ steps.version.outputs.version }} --version
          docker run --rm ghcr.io/${{ github.repository }}:${{ steps.version.outputs.version }} health-check

      - name: Extract changelog
        id: changelog
        run: |
          VERSION=${{ steps.version.outputs.version }}
          CHANGELOG=$(awk '/^## \['$VERSION'\]/,/^## \[/' CHANGELOG.md | head -n -1)
          echo "changelog<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGELOG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ steps.version.outputs.tag }}
          name: Release ${{ steps.version.outputs.version }}
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Notify success
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ Release ${{ steps.version.outputs.version }} published successfully"}'

      - name: Rollback on failure
        if: failure()
        run: |
          # Notify team
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"❌ Release ${{ steps.version.outputs.version }} failed validation"}'

          # Delete tag
          git push origin :refs/tags/${{ steps.version.outputs.tag }} || true
```

### Azure Pipelines Complete Workflow

See `reference/release-pipeline-templates.md` for complete Azure Pipelines configuration.

## Error Handling

**Invalid tag format:**
- Abort with clear error: "Tag '$TAG' does not match semver pattern v[0-9]+.[0-9]+.[0-9]+"

**Build failures:**
- Fail fast, don't proceed to publish
- Capture build logs for debugging
- Notify team with build error details

**Publish failures (partial):**
- Rollback any successful publishes
- Don't create GitHub/Azure release
- Notify team to investigate registry issues

**Validation failures:**
- Execute full rollback procedure
- Delete tag (optional, based on policy)
- Create detailed failure report

**Network/infrastructure failures:**
- Retry with exponential backoff (3 attempts)
- If retries exhausted, fail and notify
- Don't rollback on infrastructure failures (may be transient)

## Reference Documentation

See `reference/` directory for detailed guides:
- `release-pipeline-templates.md` - Complete CI/CD pipeline configurations for GitHub Actions and Azure Pipelines
