---
name: cicd-deployments
description: Deployment strategy selection and implementation with rolling, blue-green, and canary deployments
category: CI/CD
visibility: public
version: 1.0.0
---

# CI/CD Deployments

## Purpose

Select and implement deployment strategies based on risk tolerance, rollback requirements, and traffic management needs. Provides workflows for rolling, blue-green, and canary deployments with health checks and rollback procedures.

## When to Use This Skill

Use when:
- Deploying application changes to production
- Selecting a deployment strategy for a new service
- Implementing zero-downtime deployments
- Configuring health checks and readiness probes
- Defining rollback procedures
- Managing deployment risk

Do NOT use when:
- Simply building artifacts (use ci-cd-engineer agent)
- Running tests (use verification-runner)
- Deploying to development environments (simpler strategies acceptable)

## Deployment Strategy Selection

### Decision Framework

Answer these questions to select the appropriate strategy:

1. **What is your risk tolerance?**
   - High risk tolerance → Rolling deployment
   - Medium risk tolerance → Canary deployment
   - Low risk tolerance → Blue-green deployment

2. **Do you need instant rollback capability?**
   - Yes → Blue-green deployment
   - No → Rolling or canary deployment

3. **Do you need to test with real user traffic?**
   - Yes → Canary deployment
   - No → Rolling or blue-green deployment

4. **Do you have resource constraints?**
   - Limited resources → Rolling deployment
   - Ample resources → Blue-green deployment
   - Moderate resources → Canary deployment

5. **How often do you deploy?**
   - Multiple times per day → Rolling or canary
   - Once per week or less → Blue-green

### Strategy Comparison

| Strategy | Description | Risk Level | Resource Cost | Rollback Speed | Use Case |
|----------|-------------|------------|---------------|----------------|----------|
| Rolling | Deploy to servers one-by-one | Low | Low | Moderate | Continuous updates, low-risk changes |
| Blue-Green | Two identical environments, switch traffic | Medium | High | Instant | Major releases, need instant rollback |
| Canary | Deploy to percentage of users | Low | Medium | Fast | Testing with real users, gradual rollout |

## Rolling Deployment Workflow

### When to Use
- Low-risk changes (bug fixes, minor features)
- Continuous deployment environments
- Resource-constrained environments
- Kubernetes with minimal replica counts

### Implementation Steps

1. **Pre-deployment Health Check**
   ```bash
   # Verify current deployment is healthy
   kubectl get deployment <app-name> -n <namespace>
   kubectl get pods -n <namespace> -l app=<app-name>

   # Check pod health
   kubectl describe pods -n <namespace> -l app=<app-name> | grep -A 5 "Conditions"
   ```

2. **Configure Rolling Update Strategy**
   ```yaml
   # deployment.yaml
   spec:
     replicas: 5
     strategy:
       type: RollingUpdate
       rollingUpdate:
         maxSurge: 1        # Max pods above desired count
         maxUnavailable: 1  # Max pods that can be unavailable
   ```

3. **Apply Deployment**
   ```bash
   # Apply new version
   kubectl apply -f deployment.yaml

   # Monitor rollout
   kubectl rollout status deployment/<app-name> -n <namespace>
   ```

4. **Monitor Pod Health**
   ```bash
   # Watch pods being replaced
   kubectl get pods -n <namespace> -l app=<app-name> -w

   # Check rollout history
   kubectl rollout history deployment/<app-name> -n <namespace>
   ```

5. **Verify Deployment**
   ```bash
   # Check all pods are running
   kubectl get pods -n <namespace> -l app=<app-name>

   # Test application endpoints
   curl -f https://<app-url>/health || echo "Health check failed"
   ```

### Rollback Procedure

```bash
# Immediate rollback to previous version
kubectl rollout undo deployment/<app-name> -n <namespace>

# Rollback to specific revision
kubectl rollout history deployment/<app-name> -n <namespace>
kubectl rollout undo deployment/<app-name> -n <namespace> --to-revision=<revision-number>

# Monitor rollback
kubectl rollout status deployment/<app-name> -n <namespace>
```

## Blue-Green Deployment Workflow

### When to Use
- Major version releases
- Need instant rollback capability
- Database schema changes (with backward compatibility)
- High-stakes deployments (financial, healthcare)
- Sufficient infrastructure resources available

### Implementation Steps

1. **Verify Blue Environment (Current Production)**
   ```bash
   # Check current production deployment
   kubectl get deployment <app-name>-blue -n <namespace>
   kubectl get service <app-name> -n <namespace>

   # Verify service selector points to blue
   kubectl describe service <app-name> -n <namespace> | grep Selector
   # Should show: app=<app-name>,version=blue
   ```

2. **Deploy Green Environment (New Version)**
   ```bash
   # Create green deployment
   kubectl apply -f deployment-green.yaml

   # Wait for green to be ready
   kubectl rollout status deployment/<app-name>-green -n <namespace>

   # Verify all green pods are running
   kubectl get pods -n <namespace> -l app=<app-name>,version=green
   ```

3. **Test Green Environment**
   ```bash
   # Port-forward to green environment for testing
   kubectl port-forward deployment/<app-name>-green 8080:8080 -n <namespace>

   # Run smoke tests against localhost:8080
   curl -f http://localhost:8080/health
   curl -f http://localhost:8080/api/status

   # Run integration tests
   ./run-integration-tests.sh http://localhost:8080
   ```

4. **Switch Traffic to Green**
   ```bash
   # Update service selector to point to green
   kubectl patch service <app-name> -n <namespace> -p '{"spec":{"selector":{"version":"green"}}}'

   # Verify service is routing to green
   kubectl describe service <app-name> -n <namespace> | grep Selector
   # Should show: app=<app-name>,version=green
   ```

5. **Monitor Green in Production**
   ```bash
   # Watch logs for errors
   kubectl logs -n <namespace> -l app=<app-name>,version=green --tail=100 -f

   # Monitor metrics
   # - Error rate
   # - Response time
   # - Request rate
   # - CPU/Memory usage

   # Check application health
   watch -n 5 "curl -s https://<app-url>/health | jq"
   ```

6. **Decommission Blue (After Monitoring Period)**
   ```bash
   # Wait 15-30 minutes, monitoring green
   # If stable, scale down blue
   kubectl scale deployment/<app-name>-blue -n <namespace> --replicas=0

   # After 24 hours of stable green, delete blue
   kubectl delete deployment/<app-name>-blue -n <namespace>
   ```

### Rollback Procedure

```bash
# Instant rollback: switch service back to blue
kubectl patch service <app-name> -n <namespace> -p '{"spec":{"selector":{"version":"blue"}}}'

# Verify traffic is back on blue
kubectl describe service <app-name> -n <namespace> | grep Selector

# Scale up blue if it was scaled down
kubectl scale deployment/<app-name>-blue -n <namespace> --replicas=<original-count>

# Monitor blue is handling traffic
kubectl logs -n <namespace> -l app=<app-name>,version=blue --tail=100 -f
```

## Canary Deployment Workflow

### When to Use
- Testing new features with subset of users
- Gradual rollout to minimize blast radius
- Validating performance under real load
- A/B testing scenarios
- High-frequency deployments

### Implementation Steps

1. **Deploy Canary Version**
   ```bash
   # Create canary deployment with minimal replicas
   kubectl apply -f deployment-canary.yaml

   # Verify canary is healthy
   kubectl rollout status deployment/<app-name>-canary -n <namespace>
   kubectl get pods -n <namespace> -l app=<app-name>,version=canary
   ```

2. **Configure Traffic Splitting (10% to Canary)**

   **Option A: Using Istio**
   ```yaml
   # virtual-service.yaml
   apiVersion: networking.istio.io/v1beta1
   kind: VirtualService
   metadata:
     name: <app-name>
   spec:
     hosts:
     - <app-name>
     http:
     - match:
       - headers:
           canary:
             exact: "true"
       route:
       - destination:
           host: <app-name>
           subset: canary
     - route:
       - destination:
           host: <app-name>
           subset: stable
         weight: 90
       - destination:
           host: <app-name>
           subset: canary
         weight: 10
   ```

   **Option B: Using NGINX Ingress**
   ```yaml
   # ingress-canary.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: <app-name>-canary
     annotations:
       nginx.ingress.kubernetes.io/canary: "true"
       nginx.ingress.kubernetes.io/canary-weight: "10"
   spec:
     rules:
     - host: <app-url>
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: <app-name>-canary
               port:
                 number: 80
   ```

3. **Monitor Canary Metrics**
   ```bash
   # Compare error rates between stable and canary
   # Stable error rate
   kubectl logs -n <namespace> -l app=<app-name>,version=stable --tail=1000 | grep ERROR | wc -l

   # Canary error rate
   kubectl logs -n <namespace> -l app=<app-name>,version=canary --tail=1000 | grep ERROR | wc -l

   # Monitor response times (using metrics endpoint)
   curl -s https://<app-url>/metrics | grep http_request_duration

   # Watch canary logs for issues
   kubectl logs -n <namespace> -l app=<app-name>,version=canary --tail=100 -f
   ```

4. **Gradual Traffic Increase**

   **If canary is healthy after 15 minutes:**
   ```bash
   # Increase to 25%
   kubectl patch ingress <app-name>-canary -n <namespace> -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/canary-weight":"25"}}}'

   # Monitor for 15 minutes
   ```

   **If still healthy, increase to 50%:**
   ```bash
   kubectl patch ingress <app-name>-canary -n <namespace> -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/canary-weight":"50"}}}'

   # Monitor for 15 minutes
   ```

   **If still healthy, increase to 100%:**
   ```bash
   kubectl patch ingress <app-name>-canary -n <namespace> -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/canary-weight":"100"}}}'

   # Monitor for 30 minutes
   ```

5. **Promote Canary to Stable**
   ```bash
   # Update stable deployment to canary version
   kubectl set image deployment/<app-name>-stable -n <namespace> <container-name>=<canary-image>

   # Wait for stable rollout
   kubectl rollout status deployment/<app-name>-stable -n <namespace>

   # Remove canary traffic splitting
   kubectl delete ingress <app-name>-canary -n <namespace>

   # Scale down canary deployment
   kubectl scale deployment/<app-name>-canary -n <namespace> --replicas=0
   ```

### Rollback Procedure

```bash
# Abort canary rollout immediately
# Set canary traffic to 0%
kubectl patch ingress <app-name>-canary -n <namespace> -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/canary-weight":"0"}}}'

# Delete canary ingress
kubectl delete ingress <app-name>-canary -n <namespace>

# Scale down canary deployment
kubectl scale deployment/<app-name>-canary -n <namespace> --replicas=0

# Verify all traffic is on stable
curl -I https://<app-url>/health
kubectl logs -n <namespace> -l app=<app-name>,version=stable --tail=50
```

## Health Check Configuration

### Readiness Probes
Determines if a pod is ready to receive traffic.

```yaml
# deployment.yaml
spec:
  containers:
  - name: app
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
        httpHeaders:
        - name: Custom-Header
          value: Awesome
      initialDelaySeconds: 5
      periodSeconds: 10
      timeoutSeconds: 5
      successThreshold: 1
      failureThreshold: 3
```

**Readiness endpoint should check:**
- Database connection established
- Required dependencies available
- Caches warmed up
- Application fully initialized

### Liveness Probes
Determines if a pod is healthy and should be restarted.

```yaml
# deployment.yaml
spec:
  containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 20
      timeoutSeconds: 5
      failureThreshold: 3
```

**Liveness endpoint should check:**
- Application is not deadlocked
- Critical threads are running
- Basic functionality works

### Startup Probes
Used for slow-starting applications.

```yaml
# deployment.yaml
spec:
  containers:
  - name: app
    startupProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 30  # 30 * 10 = 300s max startup time
```

### Health Check Best Practices

1. **Readiness vs Liveness:**
   - Readiness: Can fail temporarily (e.g., cache warming)
   - Liveness: Should only fail if restart needed

2. **Timeout Configuration:**
   - Set timeout < period to avoid overlapping checks
   - Allow enough time for check to complete

3. **Failure Thresholds:**
   - Readiness: Lower threshold (1-3) for fast removal
   - Liveness: Higher threshold (3-5) to avoid unnecessary restarts

4. **Initial Delay:**
   - Set based on actual startup time
   - Use startup probe for slow-starting apps

## Rollback Decision Criteria

### When to Rollback

Execute rollback immediately if:
- **Error rate increase >5%** compared to baseline
- **Response time degradation >50%** compared to baseline
- **Health check failures** across multiple pods
- **Critical bugs** reported by users or monitoring
- **Database connection failures** or data integrity issues
- **Memory/CPU exhaustion** causing OOM or throttling

### Monitoring Checklist

During deployment, monitor:
- [ ] HTTP error rate (4xx, 5xx)
- [ ] Average response time (p50, p95, p99)
- [ ] Request rate (requests per second)
- [ ] Pod health (readiness, liveness)
- [ ] CPU utilization (should be <80%)
- [ ] Memory utilization (should be <80%)
- [ ] Database query performance
- [ ] Application logs (errors, warnings)
- [ ] User-reported issues

### Post-Rollback Actions

After executing rollback:
1. Document the issue (what went wrong, metrics observed)
2. Collect logs from failed deployment
3. Create incident report
4. Schedule postmortem
5. Fix root cause before next deployment attempt

## Integration with CI/CD Engineer

This skill is called by the `ci-cd-engineer` agent when:
- Deploying to production environments
- User requests specific deployment strategy
- Implementing deployment pipeline stages

The ci-cd-engineer provides:
- Application context (name, namespace, environment)
- Current deployment state
- Infrastructure capabilities (Kubernetes, Istio, etc.)

This skill returns:
- Deployment strategy recommendation
- Step-by-step deployment commands
- Health check configurations
- Rollback procedures

## Examples

See `reference/strategy-patterns.md` for:
- Complete Kubernetes manifests for each strategy
- Health check endpoint implementations
- Traffic splitting configurations
- Automated rollback scripts
- Monitoring query examples

## References

- `reference/strategy-patterns.md` - Complete deployment examples and patterns
- Kubernetes Documentation: Deployments and Rollouts
- Istio Documentation: Traffic Management
- NGINX Ingress Controller: Canary Deployments
