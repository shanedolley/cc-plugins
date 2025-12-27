---
name: cicd-secrets-infra
description: Infrastructure secrets management with External Secrets Operator for Kubernetes
---

# CI/CD Infrastructure Secrets Management

## Overview

This skill provides infrastructure-level secrets management using the External Secrets Operator (ESO) for Kubernetes environments. ESO synchronizes secrets from external secret stores (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) into Kubernetes Secret objects, enabling centralized secret management and automatic rotation.

The External Secrets Operator eliminates the need to store secrets directly in Kubernetes or GitOps repositories by creating a layer of indirection: applications reference Kubernetes Secrets as normal, but ESO keeps those secrets synchronized with the authoritative source in external vaults.

**Key Benefits:**
- Centralized secret management across multiple clusters
- Automatic secret rotation without application restarts
- Integration with existing enterprise secret stores
- Audit trails and access controls from secret store providers
- Separation of concerns (platform team manages ESO, dev teams reference secrets)

## Operations

### Configure External Secrets Operator

1. Install External Secrets Operator in Kubernetes cluster
2. Verify CRD installation (SecretStore, ExternalSecret, ClusterSecretStore)
3. Configure RBAC for operator service account
4. Set up monitoring and alerting for sync failures
5. Document secret naming conventions for teams

### Integrate with Secret Stores

**AWS Secrets Manager:**
1. Create IAM role/user for ESO with read permissions
2. Configure authentication (IRSA, IAM credentials, or AssumeRole)
3. Create SecretStore resource with AWS backend configuration
4. Verify connectivity with test ExternalSecret

**HashiCorp Vault:**
1. Enable Kubernetes auth method in Vault
2. Create Vault policy for secret paths
3. Configure service account authentication
4. Create SecretStore with Vault backend configuration
5. Map Vault secret engines to Kubernetes namespaces

**GCP Secret Manager:**
1. Create GCP service account with Secret Manager accessor role
2. Configure Workload Identity (GKE) or service account key
3. Create SecretStore with GCP backend
4. Test secret retrieval from Secret Manager

**Azure Key Vault:**
1. Create managed identity or service principal
2. Grant "Key Vault Secrets User" role
3. Configure authentication (Managed Identity, Service Principal, or Pod Identity)
4. Create SecretStore with Azure Key Vault backend

### Manage Secret Rotation

**Automatic Rotation:**
```yaml
# ExternalSecret with refresh interval
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h  # Check for updates every hour
  secretStoreRef:
    name: vault-backend
  target:
    name: app-secrets
  data:
    - secretKey: database-password
      remoteRef:
        key: /database/credentials
        property: password
```

**Manual Rotation:**
1. Update secret in external store (AWS Secrets Manager, Vault, etc.)
2. ESO detects change during next refresh interval
3. Kubernetes Secret is updated automatically
4. Applications using secret get new value (may require pod restart)

**Forced Refresh:**
```bash
# Delete ExternalSecret to force immediate refresh
kubectl delete externalsecret app-secrets
kubectl apply -f app-secrets.yaml

# Or annotate to force refresh
kubectl annotate externalsecret app-secrets force-sync="$(date +%s)" --overwrite
```

### Audit Secret Access

**Operator Logs:**
```bash
# View ESO controller logs
kubectl logs -n external-secrets-system deployment/external-secrets

# Filter for specific ExternalSecret
kubectl logs -n external-secrets-system deployment/external-secrets | grep app-secrets

# Check for sync errors
kubectl logs -n external-secrets-system deployment/external-secrets | grep -i error
```

**Secret Store Provider Auditing:**
- **AWS Secrets Manager:** CloudTrail logs for API calls
- **HashiCorp Vault:** Audit logs for secret access
- **GCP Secret Manager:** Cloud Audit Logs
- **Azure Key Vault:** Diagnostic logs and Activity logs

**ExternalSecret Status:**
```bash
# Check sync status
kubectl get externalsecret app-secrets -o jsonpath='{.status.conditions}'

# View last sync time
kubectl get externalsecret app-secrets -o jsonpath='{.status.syncedResourceVersion}'

# Check for errors
kubectl describe externalsecret app-secrets
```

### Create SecretStore and ExternalSecret Resources

**SecretStore (Namespace-scoped):**
```bash
# Create SecretStore for specific namespace
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
EOF
```

**ClusterSecretStore (Cluster-wide):**
```bash
# Create ClusterSecretStore for all namespaces
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "external-secrets"
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets-system
EOF
```

**ExternalSecret:**
```bash
# Create ExternalSecret referencing SecretStore
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 15m
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-creds
    creationPolicy: Owner
  data:
    - secretKey: username
      remoteRef:
        key: prod/database/postgres
        property: username
    - secretKey: password
      remoteRef:
        key: prod/database/postgres
        property: password
EOF
```

## Provider Comparison

| Provider | Best For | Authentication Methods | Features |
|----------|----------|------------------------|----------|
| AWS Secrets Manager | AWS workloads, automatic rotation | IRSA, IAM credentials, AssumeRole | Automatic rotation, versioning, cross-region replication |
| HashiCorp Vault | Multi-cloud, dynamic secrets, enterprise features | Kubernetes auth, AppRole, JWT, TLS | Dynamic secrets, secret engines, policies, audit logs |
| GCP Secret Manager | GCP workloads, simple key-value storage | Workload Identity, service account keys | Versioning, automatic replication, IAM integration |
| Azure Key Vault | Azure workloads, certificates, keys | Managed Identity, Service Principal, Pod Identity | Secrets, keys, certificates, HSM support |
| Kubernetes Secrets | Simple deployments, development | ServiceAccount tokens | Built-in, no external dependencies |

**Choose AWS Secrets Manager when:**
- Running primarily on AWS (EKS)
- Need automatic secret rotation
- Want cross-region secret replication
- Leveraging IAM for access control

**Choose HashiCorp Vault when:**
- Multi-cloud or hybrid environment
- Need dynamic secrets (database credentials, cloud credentials)
- Require advanced secret engines (PKI, SSH, database)
- Enterprise features (namespaces, replication, HSM)

**Choose GCP Secret Manager when:**
- Running on GCP (GKE)
- Simple key-value secret storage
- Leveraging Workload Identity for authentication
- Need automatic global replication

**Choose Azure Key Vault when:**
- Running on Azure (AKS)
- Managing certificates and keys in addition to secrets
- Need HSM-backed secrets
- Leveraging Managed Identity

## Integration

This skill is invoked by the **ci-cd-engineer** agent when:
- Setting up Kubernetes clusters with external secret management
- Migrating from hardcoded Kubernetes Secrets to external stores
- Implementing secret rotation strategies
- Integrating new applications with existing secret stores
- Troubleshooting secret synchronization issues

The ci-cd-engineer agent determines the appropriate provider based on:
- Existing cloud infrastructure (AWS, GCP, Azure, multi-cloud)
- Enterprise secret management standards
- Compliance and audit requirements
- Secret rotation needs

## Best Practices

1. **Use ClusterSecretStore for shared backends** - Reduces duplication across namespaces
2. **Set appropriate refresh intervals** - Balance freshness vs API costs
3. **Monitor sync failures** - Alert on ExternalSecret sync errors
4. **Scope permissions narrowly** - Grant least-privilege access to secret paths
5. **Use separate stores for environments** - Different SecretStores for prod/staging/dev
6. **Version secrets in external store** - Enable rollback capability
7. **Test secret rotation** - Verify applications handle secret updates gracefully
8. **Document secret naming conventions** - Consistent paths and keys across teams
9. **Implement secret validation** - Validate secret format before sync to Kubernetes
10. **Enable audit logging** - Track secret access in external store

## Common Patterns

### Multi-Environment Configuration

```yaml
# Production SecretStore
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-prod
  namespace: production
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret/prod"
      # ... auth configuration

---
# Staging SecretStore (same backend, different path)
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-staging
  namespace: staging
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret/staging"
      # ... auth configuration
```

### Secret Templating

```yaml
# Generate complex secret structures
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-config
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: app-config
    template:
      type: Opaque
      data:
        config.json: |
          {
            "database": {
              "host": "{{ .host }}",
              "username": "{{ .username }}",
              "password": "{{ .password }}"
            },
            "api_key": "{{ .api_key }}"
          }
  data:
    - secretKey: host
      remoteRef:
        key: database/config
        property: host
    - secretKey: username
      remoteRef:
        key: database/credentials
        property: username
    - secretKey: password
      remoteRef:
        key: database/credentials
        property: password
    - secretKey: api_key
      remoteRef:
        key: api/keys
        property: service_key
```

### Cross-Namespace Secret Sharing

```yaml
# ClusterSecretStore allows sharing across namespaces
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: shared-vault
spec:
  provider:
    vault:
      # ... configuration

---
# ExternalSecret in namespace A
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: shared-secret
  namespace: app-a
spec:
  secretStoreRef:
    name: shared-vault
    kind: ClusterSecretStore
  # ... secret configuration

---
# ExternalSecret in namespace B (same backend)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: shared-secret
  namespace: app-b
spec:
  secretStoreRef:
    name: shared-vault
    kind: ClusterSecretStore
  # ... secret configuration
```

## Troubleshooting

### ExternalSecret not syncing

1. Check ExternalSecret status:
   ```bash
   kubectl describe externalsecret <name>
   ```

2. Review operator logs:
   ```bash
   kubectl logs -n external-secrets-system deployment/external-secrets
   ```

3. Verify SecretStore connectivity:
   ```bash
   kubectl get secretstore <name> -o yaml
   ```

4. Test authentication manually from pod

### Authentication failures

- Verify service account has correct permissions
- Check IAM role/policy for cloud providers
- Validate Vault policy allows read access
- Ensure Workload Identity/IRSA is configured

### Secret not updating after rotation

- Verify refreshInterval is set appropriately
- Check if secret version changed in external store
- Force refresh by deleting and recreating ExternalSecret
- Review application's secret mounting strategy

## See Also

- `reference/external-secrets-setup.md` - Detailed External Secrets Operator installation and configuration
- `skills/gitops-secrets/` - Repository-level secrets encryption with SOPS and GitCrypt
- Kubernetes documentation on [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- External Secrets Operator [documentation](https://external-secrets.io/)
