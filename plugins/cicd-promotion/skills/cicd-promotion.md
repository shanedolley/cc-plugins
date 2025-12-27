---
name: cicd-promotion
description: Environment promotion pipelines with approval gates and deployment progression
---

# CI/CD Promotion

## Overview

This skill handles environment promotion workflows, managing the progression of deployments from development through staging to production. It implements approval gates, automated checks, and promotion strategies to ensure safe, controlled releases across environments.

**Key Responsibility:** Orchestrate deployments across environment tiers with appropriate validation and approvals at each stage.

## Operations

### 1. Configure Promotion Pipeline Stages

Define the promotion path and requirements for each environment stage.

**Standard Promotion Path:**
```
dev → staging → production
```

**Multi-stage Promotion Path:**
```
dev → qa → staging → canary → production
```

**GitHub Actions Configuration:**
```yaml
# .github/workflows/promote.yml
name: Environment Promotion

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      version:
        description: 'Version to promote'
        required: true
        type: string

jobs:
  promote:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Validate promotion
        run: |
          echo "Promoting version ${{ inputs.version }} to ${{ inputs.environment }}"

          # Verify version exists
          if ! git rev-parse "v${{ inputs.version }}" >/dev/null 2>&1; then
            echo "Error: Version v${{ inputs.version }} does not exist"
            exit 1
          fi

      - name: Check source environment health
        run: |
          # Verify previous environment is healthy
          case "${{ inputs.environment }}" in
            staging)
              ./scripts/check-environment.sh dev
              ;;
            production)
              ./scripts/check-environment.sh staging
              ;;
          esac

      - name: Deploy to ${{ inputs.environment }}
        run: |
          ./scripts/deploy.sh ${{ inputs.environment }} ${{ inputs.version }}
```

**Azure Pipelines Configuration:**
```yaml
# azure-pipelines-promote.yml
trigger: none

parameters:
  - name: environment
    displayName: Target Environment
    type: string
    values:
      - staging
      - production
  - name: version
    displayName: Version to Promote
    type: string

stages:
  - stage: Promote_${{ parameters.environment }}
    displayName: Promote to ${{ parameters.environment }}

    jobs:
      - deployment: Deploy
        environment: ${{ parameters.environment }}
        strategy:
          runOnce:
            deploy:
              steps:
                - checkout: self

                - script: |
                    echo "Promoting version ${{ parameters.version }} to ${{ parameters.environment }}"
                    ./scripts/deploy.sh ${{ parameters.environment }} ${{ parameters.version }}
                  displayName: Deploy to ${{ parameters.environment }}
```

### 2. Set Up Approval Gates

Implement manual and automated approval mechanisms.

#### Manual Approvals

**GitHub Actions Environment Protection:**
```yaml
# Configure in repository settings → Environments → [environment] → Protection rules
# - Required reviewers: Add team members who must approve
# - Wait timer: Optional delay before deployment can proceed
# - Deployment branches: Restrict which branches can deploy

# In workflow, reference the protected environment:
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://production.example.com

    steps:
      - name: Deploy
        run: ./scripts/deploy.sh production ${{ github.event.inputs.version }}
```

**Azure Pipelines Approval Gates:**
```yaml
# Configure in Environments → [environment] → Approvals and checks

stages:
  - stage: Production
    displayName: Deploy to Production

    jobs:
      - deployment: Deploy
        environment: production
        # Approvals configured in portal:
        # - Pre-deployment approvals: Required reviewers
        # - Post-deployment approvals: Verify deployment success
        # - Gates: Automated checks (Azure Monitor, ServiceNow)

        strategy:
          runOnce:
            deploy:
              steps:
                - script: ./scripts/deploy.sh production
```

#### Automated Approval Checks

**Health Check Gate:**
```bash
#!/bin/bash
# scripts/check-environment.sh

ENVIRONMENT=$1
API_ENDPOINT="https://${ENVIRONMENT}.example.com/health"

# Check API health
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_ENDPOINT)

if [ "$HEALTH_STATUS" != "200" ]; then
  echo "❌ Environment $ENVIRONMENT is unhealthy (status: $HEALTH_STATUS)"
  exit 1
fi

# Check error rate
ERROR_RATE=$(curl -s "https://monitoring.example.com/api/metrics?env=${ENVIRONMENT}&metric=error_rate")

if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
  echo "❌ Error rate too high: ${ERROR_RATE} (threshold: 0.01)"
  exit 1
fi

# Check response time
AVG_RESPONSE_TIME=$(curl -s "https://monitoring.example.com/api/metrics?env=${ENVIRONMENT}&metric=avg_response_time")

if (( $(echo "$AVG_RESPONSE_TIME > 1000" | bc -l) )); then
  echo "❌ Response time too high: ${AVG_RESPONSE_TIME}ms (threshold: 1000ms)"
  exit 1
fi

echo "✅ Environment $ENVIRONMENT is healthy"
```

**Test Suite Gate:**
```yaml
# GitHub Actions
- name: Run smoke tests
  run: |
    npm run test:smoke -- --env=${{ inputs.environment }}

- name: Run integration tests
  run: |
    npm run test:integration -- --env=${{ inputs.environment }}

- name: Verify deployment
  run: |
    DEPLOYED_VERSION=$(curl -s https://${{ inputs.environment }}.example.com/version)
    if [ "$DEPLOYED_VERSION" != "${{ inputs.version }}" ]; then
      echo "❌ Version mismatch: deployed $DEPLOYED_VERSION, expected ${{ inputs.version }}"
      exit 1
    fi
    echo "✅ Deployment verified: $DEPLOYED_VERSION"
```

### 3. Automate Promotion on Successful Checks

Implement automatic promotion when criteria are met.

**Time-based Auto-promotion:**
```yaml
# .github/workflows/auto-promote.yml
name: Auto-promote Staging to Production

on:
  schedule:
    # Run daily at 10 AM UTC
    - cron: '0 10 * * *'

jobs:
  check-and-promote:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Get staging version
        id: staging
        run: |
          VERSION=$(curl -s https://staging.example.com/version)
          echo "version=$VERSION" >> $GITHUB_OUTPUT

          # Get deployment timestamp
          DEPLOY_TIME=$(curl -s https://staging.example.com/deploy-time)
          echo "deploy_time=$DEPLOY_TIME" >> $GITHUB_OUTPUT

      - name: Check if version is ready for promotion
        id: check
        run: |
          # Check if version has been in staging for 48+ hours
          CURRENT_TIME=$(date +%s)
          DEPLOY_TIME=${{ steps.staging.outputs.deploy_time }}
          HOURS_IN_STAGING=$(( ($CURRENT_TIME - $DEPLOY_TIME) / 3600 ))

          if [ $HOURS_IN_STAGING -lt 48 ]; then
            echo "Version has only been in staging for $HOURS_IN_STAGING hours (need 48)"
            echo "promote=false" >> $GITHUB_OUTPUT
            exit 0
          fi

          # Check metrics
          ERROR_RATE=$(curl -s "https://monitoring.example.com/api/metrics?env=staging&metric=error_rate&hours=48")
          if (( $(echo "$ERROR_RATE > 0.005" | bc -l) )); then
            echo "Error rate too high: $ERROR_RATE (threshold: 0.005)"
            echo "promote=false" >> $GITHUB_OUTPUT
            exit 0
          fi

          echo "✅ Version ${{ steps.staging.outputs.version }} ready for promotion"
          echo "promote=true" >> $GITHUB_OUTPUT

      - name: Promote to production
        if: steps.check.outputs.promote == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'promote.yml',
              ref: 'main',
              inputs: {
                environment: 'production',
                version: '${{ steps.staging.outputs.version }}'
              }
            });
```

### 4. Handle Promotion Failures and Rollback

Implement failure detection and automated rollback procedures.

**Deployment Health Monitoring:**
```yaml
- name: Deploy and monitor
  run: |
    # Deploy new version
    ./scripts/deploy.sh ${{ inputs.environment }} ${{ inputs.version }}

    # Wait for deployment to stabilize
    sleep 60

    # Monitor for 5 minutes
    for i in {1..10}; do
      ERROR_RATE=$(curl -s "https://monitoring.example.com/api/metrics?env=${{ inputs.environment }}&metric=error_rate&minutes=5")

      if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
        echo "❌ Error rate spike detected: $ERROR_RATE"
        echo "Initiating rollback..."

        # Get previous version
        PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD^)
        ./scripts/deploy.sh ${{ inputs.environment }} ${PREVIOUS_VERSION#v}

        # Notify team
        curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
          -H 'Content-Type: application/json' \
          -d "{
            \"text\": \"❌ Promotion to ${{ inputs.environment }} failed. Rolled back to $PREVIOUS_VERSION\",
            \"attachments\": [{
              \"color\": \"danger\",
              \"fields\": [{
                \"title\": \"Failed Version\",
                \"value\": \"${{ inputs.version }}\"
              }, {
                \"title\": \"Error Rate\",
                \"value\": \"$ERROR_RATE\"
              }]
            }]
          }"

        exit 1
      fi

      echo "Health check $i/10: Error rate $ERROR_RATE ✅"
      sleep 30
    done

    echo "✅ Deployment successful and stable"
```

**Automated Rollback Script:**
```bash
#!/bin/bash
# scripts/rollback.sh

ENVIRONMENT=$1
TARGET_VERSION=$2

echo "Rolling back $ENVIRONMENT to version $TARGET_VERSION"

# Deploy previous version
./scripts/deploy.sh $ENVIRONMENT $TARGET_VERSION

# Verify rollback
DEPLOYED_VERSION=$(curl -s "https://${ENVIRONMENT}.example.com/version")

if [ "$DEPLOYED_VERSION" != "$TARGET_VERSION" ]; then
  echo "❌ Rollback verification failed"
  exit 1
fi

echo "✅ Rollback successful: $ENVIRONMENT now running $TARGET_VERSION"

# Update deployment record
curl -X POST "https://api.example.com/deployments" \
  -H 'Content-Type: application/json' \
  -d "{
    \"environment\": \"$ENVIRONMENT\",
    \"version\": \"$TARGET_VERSION\",
    \"type\": \"rollback\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"
```

### 5. Track Deployment History and Audit Trail

Maintain comprehensive deployment records.

**Deployment Tracking:**
```yaml
- name: Record deployment
  if: success()
  run: |
    # Create deployment record
    cat > deployment-record.json <<EOF
    {
      "environment": "${{ inputs.environment }}",
      "version": "${{ inputs.version }}",
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "commit_sha": "${{ github.sha }}",
      "triggered_by": "${{ github.actor }}",
      "workflow_run": "${{ github.run_id }}",
      "approval_chain": [
        $(gh api /repos/${{ github.repository }}/actions/runs/${{ github.run_id }}/approvals --jq '.[] | {reviewer: .user.login, approved_at: .created_at}')
      ]
    }
    EOF

    # Store in deployment database
    curl -X POST "https://api.example.com/deployments" \
      -H 'Content-Type: application/json' \
      -d @deployment-record.json

    # Commit to audit log repository
    git clone https://github.com/org/deployment-audit-log.git
    cd deployment-audit-log
    mkdir -p ${{ inputs.environment }}
    cp ../deployment-record.json ${{ inputs.environment }}/$(date +%Y%m%d-%H%M%S)-${{ inputs.version }}.json
    git add .
    git commit -m "Deploy ${{ inputs.version }} to ${{ inputs.environment }}"
    git push
```

**Audit Query Script:**
```bash
#!/bin/bash
# scripts/audit-deployments.sh

ENVIRONMENT=$1
DAYS=${2:-30}

echo "Deployment history for $ENVIRONMENT (last $DAYS days):"
echo "======================================================="

curl -s "https://api.example.com/deployments?env=$ENVIRONMENT&days=$DAYS" | \
  jq -r '.[] | "[\(.timestamp)] \(.version) by \(.triggered_by) - \(.type // "deployment")"'
```

## Promotion Strategies

### Time-based Promotion

Promote after a version has been stable in the source environment for a specified duration.

**Configuration:**
```yaml
promotion_strategies:
  staging_to_production:
    type: time_based
    minimum_duration: 48h
    health_checks:
      - error_rate < 0.005
      - avg_response_time < 500ms
      - cpu_usage < 70%
    auto_promote: true
```

**Use Cases:**
- Low-risk applications
- Regular release cadence
- Predictable traffic patterns

### Approval-based Promotion

Require explicit approval from designated reviewers.

**Configuration:**
```yaml
environments:
  production:
    protection_rules:
      required_reviewers:
        - team: platform-team
          count: 2
        - team: security-team
          count: 1
      wait_timer: 0  # No automatic timer
      prevent_self_review: true
```

**Use Cases:**
- High-risk deployments
- Regulatory requirements
- Critical business systems
- Major version updates

### Metric-based Promotion

Promote based on performance metrics and KPIs.

**Configuration:**
```yaml
promotion_strategies:
  staging_to_production:
    type: metric_based
    evaluation_period: 24h
    criteria:
      - metric: error_rate
        threshold: 0.01
        comparator: less_than
      - metric: p95_latency
        threshold: 1000
        comparator: less_than
        unit: milliseconds
      - metric: successful_requests
        threshold: 10000
        comparator: greater_than
    auto_promote: true
```

**Implementation:**
```bash
#!/bin/bash
# scripts/evaluate-metrics.sh

ENVIRONMENT=$1
EVALUATION_PERIOD_HOURS=$2

echo "Evaluating metrics for $ENVIRONMENT (${EVALUATION_PERIOD_HOURS}h period)"

# Fetch metrics
ERROR_RATE=$(curl -s "https://monitoring.example.com/api/metrics?env=$ENVIRONMENT&metric=error_rate&hours=$EVALUATION_PERIOD_HOURS")
P95_LATENCY=$(curl -s "https://monitoring.example.com/api/metrics?env=$ENVIRONMENT&metric=p95_latency&hours=$EVALUATION_PERIOD_HOURS")
SUCCESS_COUNT=$(curl -s "https://monitoring.example.com/api/metrics?env=$ENVIRONMENT&metric=successful_requests&hours=$EVALUATION_PERIOD_HOURS")

# Evaluate criteria
PASSED=true

if (( $(echo "$ERROR_RATE >= 0.01" | bc -l) )); then
  echo "❌ Error rate too high: $ERROR_RATE (threshold: 0.01)"
  PASSED=false
fi

if (( $(echo "$P95_LATENCY >= 1000" | bc -l) )); then
  echo "❌ P95 latency too high: ${P95_LATENCY}ms (threshold: 1000ms)"
  PASSED=false
fi

if (( $(echo "$SUCCESS_COUNT < 10000" | bc -l) )); then
  echo "❌ Insufficient successful requests: $SUCCESS_COUNT (threshold: 10000)"
  PASSED=false
fi

if [ "$PASSED" = true ]; then
  echo "✅ All metrics within thresholds"
  exit 0
else
  echo "❌ Metrics evaluation failed"
  exit 1
fi
```

**Use Cases:**
- Performance-critical applications
- A/B testing scenarios
- Gradual rollout validation
- Data-driven decision making

## Integration

This skill is invoked by the **ci-cd-engineer agent** when:
- Manual promotion is requested via workflow dispatch
- Automated promotion criteria are met
- Post-deployment validation is required
- Rollback procedures need to be executed

The ci-cd-engineer agent:
1. Validates promotion prerequisites
2. Invokes this skill to execute promotion workflow
3. Monitors deployment health
4. Executes rollback if necessary
5. Records deployment audit trail

## Promotion Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Trigger: Manual dispatch or automatic promotion         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Validate Prerequisites                                  │
│ - Version exists in source environment                  │
│ - Source environment is healthy                         │
│ - No ongoing deployments to target                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Check Promotion Strategy                                │
│ - Time-based: Check duration + health                   │
│ - Approval-based: Wait for approvals                    │
│ - Metric-based: Evaluate KPIs                           │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
   ✅ Criteria Met        ❌ Criteria Not Met
         │                       │
         ▼                       ▼
┌────────────────────┐  ┌─────────────────────┐
│ Execute Deployment │  │ Wait or Reject      │
│ - Deploy version   │  │ - Log reason        │
│ - Monitor health   │  │ - Notify team       │
│ - Run smoke tests  │  │ - Schedule retry    │
└────────┬───────────┘  └─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ Post-deployment Validation                              │
│ - Health checks (5-10 minutes)                          │
│ - Error rate monitoring                                 │
│ - Performance metrics                                   │
└────────────────────┬────────────────────────────────────┘
         │
         ▼
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
✅ Success       ❌ Failure
    │                 │
    ▼                 ▼
┌──────────┐   ┌──────────────┐
│ Complete │   │   Rollback   │
│ - Record │   │ - Revert     │
│ - Notify │   │ - Record     │
└──────────┘   │ - Notify     │
               └──────────────┘
```

## Error Handling

**Invalid version:**
- Abort with error message indicating version does not exist

**Source environment unhealthy:**
- Reject promotion with health check details
- Wait for source environment to stabilize

**Target environment has ongoing deployment:**
- Queue promotion or reject with conflict error

**Approval timeout:**
- Cancel promotion after configured timeout period
- Notify approvers and requester

**Deployment failure:**
- Execute automatic rollback
- Preserve deployment logs for investigation
- Create incident record

**Rollback failure:**
- Alert on-call team immediately
- Escalate to manual intervention
- Document failure for post-mortem
