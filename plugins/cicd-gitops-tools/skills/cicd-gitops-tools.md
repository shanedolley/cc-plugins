---
name: cicd-gitops-tools
description: ArgoCD and Flux configuration for GitOps-based continuous deployment
---

# CI/CD GitOps Tools

## Overview

This skill provides comprehensive guidance on configuring and managing GitOps tools (ArgoCD and Flux) for continuous deployment. GitOps treats Git as the single source of truth for declarative infrastructure and applications, enabling automated deployments through Git commits.

**Key Responsibility:** Set up, configure, and manage GitOps tooling to enable pull-based continuous deployment.

## GitOps Principles

**Core Concepts:**
1. **Declarative**: Entire system state described declaratively in Git
2. **Versioned and Immutable**: Git history provides audit trail and rollback capability
3. **Pulled Automatically**: Agents automatically pull desired state from Git
4. **Continuously Reconciled**: Agents continuously ensure actual state matches desired state

## Operations

### 1. Install and Configure ArgoCD

Set up ArgoCD for Kubernetes-based GitOps deployments.

**Installation:**
```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for deployment
kubectl wait --for=condition=available --timeout=300s \
  deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Port-forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

**CLI Installation:**
```bash
# macOS
brew install argocd

# Linux
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/
```

**Configure with High Availability:**
```yaml
# argocd-ha-values.yaml
controller:
  replicas: 2

server:
  replicas: 2
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5

repoServer:
  replicas: 2
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5

redis-ha:
  enabled: true
```

```bash
# Install with Helm for HA configuration
helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  -f argocd-ha-values.yaml
```

### 2. Install and Configure Flux

Set up Flux for GitOps-based continuous deployment.

**Prerequisites:**
```bash
# Install Flux CLI
curl -s https://fluxcd.io/install.sh | sudo bash

# Verify installation
flux --version

# Check cluster compatibility
flux check --pre
```

**Bootstrap Flux:**
```bash
# GitHub
export GITHUB_TOKEN=<your-token>
flux bootstrap github \
  --owner=my-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --personal=false \
  --components-extra=image-reflector-controller,image-automation-controller

# GitLab
export GITLAB_TOKEN=<your-token>
flux bootstrap gitlab \
  --owner=my-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production
```

**Directory Structure:**
```
fleet-infra/
├── clusters/
│   ├── production/
│   │   ├── flux-system/
│   │   │   ├── gotk-components.yaml
│   │   │   ├── gotk-sync.yaml
│   │   │   └── kustomization.yaml
│   │   ├── infrastructure.yaml
│   │   └── apps.yaml
│   └── staging/
│       └── ...
├── infrastructure/
│   ├── base/
│   │   ├── nginx-ingress/
│   │   └── cert-manager/
│   └── production/
│       └── kustomization.yaml
└── apps/
    ├── base/
    │   └── my-app/
    └── production/
        └── kustomization.yaml
```

### 3. Define Application CRDs (ArgoCD)

Create ArgoCD Application resources to manage deployments.

**Basic Application:**
```yaml
# apps/my-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/my-org/my-app-config.git
    targetRevision: HEAD
    path: k8s/overlays/production

  destination:
    server: https://kubernetes.default.svc
    namespace: my-app

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

**Helm-based Application:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nginx-ingress
  namespace: argocd
spec:
  project: infrastructure

  source:
    repoURL: https://kubernetes.github.io/ingress-nginx
    chart: ingress-nginx
    targetRevision: 4.8.0
    helm:
      releaseName: nginx-ingress
      parameters:
        - name: controller.replicaCount
          value: "3"
        - name: controller.metrics.enabled
          value: "true"

  destination:
    server: https://kubernetes.default.svc
    namespace: ingress-nginx

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

**Kustomize-based Application:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-service
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/my-org/manifests.git
    targetRevision: HEAD
    path: services/my-service/overlays/production
    kustomize:
      images:
        - my-org/my-service:v1.2.3

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### 4. Define Kustomization CRDs (Flux)

Create Flux Kustomization resources for GitOps deployments.

**Basic Kustomization:**
```yaml
# clusters/production/infrastructure.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: flux-system
  path: ./infrastructure/production
  prune: true
  wait: true
  timeout: 5m
  retryInterval: 2m
```

**Application Kustomization:**
```yaml
# clusters/production/apps.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 5m
  dependsOn:
    - name: infrastructure
  sourceRef:
    kind: GitRepository
    name: flux-system
  path: ./apps/production
  prune: true
  wait: true
  patches:
    - patch: |
        apiVersion: v1
        kind: Namespace
        metadata:
          name: not-used
          labels:
            environment: production
      target:
        kind: Namespace
```

**HelmRelease with Flux:**
```yaml
# infrastructure/base/nginx-ingress/helmrelease.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: nginx-ingress
  namespace: ingress-nginx
spec:
  interval: 5m
  chart:
    spec:
      chart: ingress-nginx
      version: '4.8.x'
      sourceRef:
        kind: HelmRepository
        name: ingress-nginx
        namespace: flux-system
      interval: 1m

  values:
    controller:
      replicaCount: 3
      metrics:
        enabled: true
      resources:
        requests:
          cpu: 100m
          memory: 128Mi

  install:
    crds: Create
    remediation:
      retries: 3

  upgrade:
    crds: CreateReplace
    remediation:
      retries: 3
```

### 5. Configure Sync Policies (Automated vs Manual)

Set synchronization behavior for applications.

**ArgoCD Sync Policies:**

**Manual Sync (default):**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: critical-app
spec:
  # ... source and destination ...

  syncPolicy: {}  # No automated sync - manual only
```

**Automated Sync with Self-Heal:**
```yaml
syncPolicy:
  automated:
    prune: true        # Delete resources not in Git
    selfHeal: true     # Force sync when cluster state drifts
    allowEmpty: false  # Don't sync if Git directory is empty

  syncOptions:
    - CreateNamespace=true
    - PruneLast=true         # Prune resources after applying
    - RespectIgnoreDifferences=true

  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

**Selective Automation:**
```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: false  # Automated sync but no self-heal

  # Ignore differences for specific fields
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas  # Ignore HPA-managed replica count
```

**Flux Sync Policies:**

**Automated Reconciliation:**
```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
spec:
  interval: 5m           # Check Git every 5 minutes
  prune: true            # Delete removed resources
  wait: true             # Wait for resources to be ready
  timeout: 5m
  retryInterval: 2m      # Retry failed reconciliation

  # Health checks
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: my-app
      namespace: production
```

**Suspended Sync (Manual Control):**
```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: suspended-app
spec:
  suspend: true  # Temporarily stop reconciliation
  interval: 5m
  # ... rest of spec ...
```

### 6. Handle Sync Failures and Drift Detection

Detect and respond to synchronization failures and configuration drift.

**ArgoCD Drift Detection:**

**View Drift:**
```bash
# CLI: Check sync status
argocd app get my-app

# Check for out-of-sync resources
argocd app diff my-app

# View specific resource differences
argocd app diff my-app --resource apps:Deployment:my-app
```

**Auto-remediation:**
```yaml
# Application with self-heal enabled
spec:
  syncPolicy:
    automated:
      selfHeal: true  # Automatically fix drift
```

**Drift Notifications:**
```yaml
# Configure webhook notifications
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.webhook.slack: |
    url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL

  trigger.on-sync-status-unknown: |
    - when: app.status.sync.status == 'Unknown'
      send: [app-sync-failed]

  template.app-sync-failed: |
    message: |
      Application {{.app.metadata.name}} sync status is {{.app.status.sync.status}}.
      Drift detected or sync failed.
```

**Flux Drift Detection:**

**Check Reconciliation Status:**
```bash
# Check all Kustomizations
flux get kustomizations

# Check specific Kustomization
flux get kustomization my-app

# View events
kubectl describe kustomization my-app -n flux-system
```

**Alert on Drift:**
```yaml
# Configure Flux notifications
apiVersion: notification.toolkit.fluxcd.io/v1beta1
kind: Alert
metadata:
  name: app-drift-alert
  namespace: flux-system
spec:
  eventSeverity: error
  eventSources:
    - kind: Kustomization
      name: my-app
  providerRef:
    name: slack
```

**Force Reconciliation:**
```bash
# Trigger immediate reconciliation
flux reconcile kustomization my-app --with-source

# Suspend and resume to reset state
flux suspend kustomization my-app
flux resume kustomization my-app
```

### 7. Manage Multi-cluster Deployments

Deploy applications across multiple Kubernetes clusters.

**ArgoCD Multi-cluster:**

**Register Clusters:**
```bash
# List available clusters
kubectl config get-contexts

# Register cluster with ArgoCD
argocd cluster add staging-cluster
argocd cluster add production-cluster

# List registered clusters
argocd cluster list
```

**ApplicationSet for Multi-cluster:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: multi-cluster-app
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: staging
            url: https://staging-cluster-api
            namespace: staging-ns
          - cluster: production
            url: https://production-cluster-api
            namespace: production-ns

  template:
    metadata:
      name: '{{cluster}}-my-app'
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/my-app.git
        targetRevision: HEAD
        path: 'k8s/overlays/{{cluster}}'
      destination:
        server: '{{url}}'
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

**Flux Multi-cluster:**

**Cluster Bootstrap:**
```bash
# Bootstrap staging cluster
kubectl config use-context staging
flux bootstrap github \
  --owner=my-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/staging

# Bootstrap production cluster
kubectl config use-context production
flux bootstrap github \
  --owner=my-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production
```

**Cluster-specific Configuration:**
```
fleet-infra/
├── clusters/
│   ├── staging/
│   │   ├── flux-system/
│   │   ├── apps.yaml
│   │   └── infrastructure.yaml
│   └── production/
│       ├── flux-system/
│       ├── apps.yaml
│       └── infrastructure.yaml
├── apps/
│   ├── base/          # Shared across all clusters
│   ├── staging/       # Staging-specific patches
│   └── production/    # Production-specific patches
```

## Tool Comparison

| Feature | ArgoCD | Flux |
|---------|---------|------|
| **UI** | Full web UI with visualization | CLI + optional dashboards (Weave GitOps) |
| **Sync Model** | Pull-based | Pull-based |
| **Multi-tenancy** | Projects and RBAC | Namespaced resources |
| **Helm Support** | Native | Via HelmRelease CRD |
| **Kustomize Support** | Native | Native |
| **Image Updates** | External tools (ArgoCD Image Updater) | Built-in image automation |
| **Notifications** | Built-in webhook/Slack/email | Alert and Provider CRDs |
| **Secret Management** | Integrations (Sealed Secrets, Vault) | SOPS integration |
| **GitOps Purity** | Pragmatic (allows out-of-band changes) | Strict (reconciles everything) |
| **Learning Curve** | Moderate | Steeper (CNCF ecosystem) |
| **Best For** | Teams wanting visibility and manual control | GitOps purists, full automation |
| **Drift Detection** | UI-based diff view | CLI and event-based |
| **Rollback** | UI rollback to previous sync | Git revert + reconcile |
| **Progressive Delivery** | Via Argo Rollouts (separate project) | Via Flagger integration |

## Integration

This skill is invoked by the **ci-cd-engineer agent** when:
- Setting up new GitOps infrastructure
- Configuring application deployments
- Implementing multi-cluster strategies
- Troubleshooting sync issues
- Managing drift and reconciliation

The ci-cd-engineer agent:
1. Assesses project requirements and cluster topology
2. Recommends appropriate GitOps tool (ArgoCD vs Flux)
3. Invokes this skill for installation and configuration
4. Sets up applications and sync policies
5. Configures monitoring and alerting for drift detection

## Reference Documentation

See `reference/` directory for detailed setup guides:
- `argocd-setup.md` - Complete ArgoCD installation and configuration
- `flux-setup.md` - Complete Flux installation and configuration
