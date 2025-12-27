---
name: cicd-feature-flags
description: Feature flag management with PostHog for progressive rollout and A/B testing
---

# CI/CD Feature Flags

## Overview

This skill provides comprehensive guidance on implementing feature flags using PostHog for progressive rollout, A/B testing, and risk mitigation. Feature flags enable decoupling deployment from release, allowing teams to deploy code to production with features disabled and progressively enable them for specific user segments.

**Key Responsibility:** Configure and manage feature flags to enable safe, gradual feature rollouts and rapid rollback capabilities.

## Operations

### 1. Define Feature Flags in PostHog

Create and configure feature flags in PostHog.

**Via PostHog UI:**
1. Navigate to Feature Flags section
2. Click "New feature flag"
3. Configure flag properties:
   - Key: `new-checkout-flow` (use kebab-case)
   - Name: "New Checkout Flow"
   - Description: "Redesigned checkout experience with one-page flow"
   - Rollout percentage: Start at 0%
   - Enable for development environment

**Via PostHog API:**
```bash
# Create feature flag
curl -X POST https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "new-checkout-flow",
    "name": "New Checkout Flow",
    "filters": {
      "groups": [
        {
          "properties": [],
          "rollout_percentage": 0
        }
      ]
    },
    "active": true
  }'
```

**Feature Flag with User Targeting:**
```bash
curl -X POST https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "beta-features",
    "name": "Beta Features",
    "filters": {
      "groups": [
        {
          "properties": [
            {
              "key": "beta_user",
              "type": "person",
              "value": ["true"],
              "operator": "exact"
            }
          ],
          "rollout_percentage": 100
        }
      ]
    },
    "active": true
  }'
```

### 2. Configure Rollout Strategies

Implement progressive rollout strategies for safe feature releases.

#### Percentage-based Rollout

**Phase 1: Canary (5%)**
```json
{
  "key": "new-checkout-flow",
  "filters": {
    "groups": [
      {
        "properties": [],
        "rollout_percentage": 5
      }
    ]
  }
}
```

**Monitoring Period:** 24 hours
- Monitor error rates
- Track conversion metrics
- Collect user feedback

**Phase 2: Early Rollout (25%)**
```json
{
  "key": "new-checkout-flow",
  "filters": {
    "groups": [
      {
        "properties": [],
        "rollout_percentage": 25
      }
    ]
  }
}
```

**Monitoring Period:** 48 hours
- Validate performance at scale
- Confirm metric improvements
- Ensure no regression in key KPIs

**Phase 3: Majority Rollout (50%)**
```json
{
  "key": "new-checkout-flow",
  "filters": {
    "groups": [
      {
        "properties": [],
        "rollout_percentage": 50
      }
    ]
  }
}
```

**Monitoring Period:** 24 hours
- Final validation before full rollout
- Prepare for complete migration

**Phase 4: Complete Rollout (100%)**
```json
{
  "key": "new-checkout-flow",
  "filters": {
    "groups": [
      {
        "properties": [],
        "rollout_percentage": 100
      }
    ]
  }
}
```

**Post-rollout:** Schedule flag cleanup after 2-4 weeks of stability

#### User Segment Targeting

**Target specific user groups:**
```json
{
  "key": "premium-features",
  "filters": {
    "groups": [
      {
        "properties": [
          {
            "key": "subscription_tier",
            "type": "person",
            "value": ["premium", "enterprise"],
            "operator": "exact"
          }
        ],
        "rollout_percentage": 100
      }
    ]
  }
}
```

**Geographic targeting:**
```json
{
  "key": "eu-compliance-features",
  "filters": {
    "groups": [
      {
        "properties": [
          {
            "key": "$geoip_country_code",
            "type": "person",
            "value": ["DE", "FR", "IT", "ES"],
            "operator": "exact"
          }
        ],
        "rollout_percentage": 100
      }
    ]
  }
}
```

**Internal team testing:**
```json
{
  "key": "experimental-ui",
  "filters": {
    "groups": [
      {
        "properties": [
          {
            "key": "email",
            "type": "person",
            "value": ["@example.com"],
            "operator": "icontains"
          }
        ],
        "rollout_percentage": 100
      }
    ]
  }
}
```

#### Environment-based Flags

**Development environment only:**
```json
{
  "key": "debug-panel",
  "filters": {
    "groups": [
      {
        "properties": [
          {
            "key": "environment",
            "type": "person",
            "value": ["development"],
            "operator": "exact"
          }
        ],
        "rollout_percentage": 100
      }
    ]
  }
}
```

**Staging environment:**
```json
{
  "key": "new-api-version",
  "filters": {
    "groups": [
      {
        "properties": [
          {
            "key": "environment",
            "type": "person",
            "value": ["staging"],
            "operator": "exact"
          }
        ],
        "rollout_percentage": 100
      }
    ]
  }
}
```

**Production with gradual rollout:**
```json
{
  "key": "new-search-algorithm",
  "filters": {
    "groups": [
      {
        "properties": [
          {
            "key": "environment",
            "type": "person",
            "value": ["production"],
            "operator": "exact"
          }
        ],
        "rollout_percentage": 10
      }
    ]
  }
}
```

### 3. Monitor Flag Performance Metrics

Track feature flag impact on key metrics.

**PostHog Insights Dashboard:**
```javascript
// Track feature flag exposure events
posthog.capture('$feature_flag_called', {
  $feature_flag: 'new-checkout-flow',
  $feature_flag_response: isEnabled,
});

// Track conversion events with flag context
posthog.capture('checkout_completed', {
  checkout_flow_version: posthog.isFeatureEnabled('new-checkout-flow') ? 'new' : 'old',
  revenue: orderTotal,
});
```

**Create Funnel Analysis:**
1. Navigate to Insights
2. Create new funnel
3. Add steps:
   - Step 1: `checkout_started` where `checkout_flow_version = new`
   - Step 2: `payment_submitted` where `checkout_flow_version = new`
   - Step 3: `checkout_completed` where `checkout_flow_version = new`
4. Compare with control group (old flow)

**Monitor Error Rates:**
```javascript
// Track errors with flag context
posthog.capture('error_occurred', {
  error_type: error.name,
  error_message: error.message,
  new_checkout_flow_enabled: posthog.isFeatureEnabled('new-checkout-flow'),
});
```

**Create Alert for Anomalies:**
```bash
# PostHog API: Create insight alert
curl -X POST https://app.posthog.com/api/projects/$PROJECT_ID/insights/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Checkout Error Rate (New Flow)",
    "filters": {
      "events": [
        {
          "id": "error_occurred",
          "properties": [
            {
              "key": "new_checkout_flow_enabled",
              "value": ["true"]
            }
          ]
        }
      ]
    }
  }'
```

### 4. Cleanup Stale Flags

Remove feature flags once features are fully rolled out and stable.

**Flag Lifecycle:**
1. **Active Development** (0-2 weeks): Flag at 0% or limited to dev/staging
2. **Rollout Phase** (1-4 weeks): Progressive rollout 5% → 25% → 50% → 100%
3. **Stabilization** (2-4 weeks): Flag at 100%, monitoring for issues
4. **Cleanup** (after stabilization): Remove flag from code and PostHog

**Identify Stale Flags:**
```bash
# List all feature flags
curl https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" | \
  jq '.results[] | select(.filters.groups[0].rollout_percentage == 100) | {key, created_at}'
```

**Cleanup Process:**

**Step 1: Verify flag is at 100% for 2+ weeks**
```bash
# Check flag age and rollout
curl https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/$FLAG_ID/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY"
```

**Step 2: Remove flag checks from code**
```javascript
// Before cleanup
if (posthog.isFeatureEnabled('new-checkout-flow')) {
  renderNewCheckout();
} else {
  renderOldCheckout();
}

// After cleanup - keep only new implementation
renderNewCheckout();
```

**Step 3: Delete flag from PostHog**
```bash
curl -X DELETE https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/$FLAG_ID/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY"
```

**Step 4: Remove old code paths**
```javascript
// Delete old implementation
// function renderOldCheckout() { ... } // DELETED
```

**Automated Stale Flag Detection:**
```bash
#!/bin/bash
# scripts/detect-stale-flags.sh

echo "Detecting stale feature flags (100% rollout for 30+ days)..."

THIRTY_DAYS_AGO=$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)

curl -s https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" | \
  jq -r --arg cutoff "$THIRTY_DAYS_AGO" '
    .results[] |
    select(
      .filters.groups[0].rollout_percentage == 100 and
      .created_at < $cutoff
    ) |
    "Stale flag: \(.key) (created \(.created_at))"
  '
```

### 5. Emergency Kill Switch

Implement rapid rollback capability for production issues.

**Kill Switch Flag Configuration:**
```json
{
  "key": "new-payment-processor",
  "filters": {
    "groups": [
      {
        "properties": [],
        "rollout_percentage": 50
      }
    ]
  },
  "active": true
}
```

**Emergency Disable:**
```bash
# Via API: Set rollout to 0%
curl -X PATCH https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/$FLAG_ID/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "groups": [
        {
          "properties": [],
          "rollout_percentage": 0
        }
      ]
    }
  }'

# Or disable entirely
curl -X PATCH https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/$FLAG_ID/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

**Automated Kill Switch Script:**
```bash
#!/bin/bash
# scripts/kill-feature-flag.sh

FLAG_KEY=$1

if [ -z "$FLAG_KEY" ]; then
  echo "Usage: ./kill-feature-flag.sh <flag-key>"
  exit 1
fi

echo "Disabling feature flag: $FLAG_KEY"

# Get flag ID
FLAG_ID=$(curl -s https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" | \
  jq -r ".results[] | select(.key == \"$FLAG_KEY\") | .id")

if [ -z "$FLAG_ID" ]; then
  echo "Error: Flag '$FLAG_KEY' not found"
  exit 1
fi

# Disable flag
curl -X PATCH https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/$FLAG_ID/ \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'

echo "✅ Feature flag '$FLAG_KEY' disabled"

# Notify team
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"🚨 Feature flag killed: $FLAG_KEY\",
    \"attachments\": [{
      \"color\": \"danger\",
      \"text\": \"Feature flag has been emergency disabled.\"
    }]
  }"
```

**Runbook Integration:**
```yaml
# runbooks/incident-response.yml
emergency_procedures:
  feature_flag_rollback:
    description: Disable feature flag immediately
    command: ./scripts/kill-feature-flag.sh <flag-key>
    escalation:
      - Notify engineering team
      - Create incident ticket
      - Schedule post-mortem
    examples:
      - ./scripts/kill-feature-flag.sh new-payment-processor
      - ./scripts/kill-feature-flag.sh experimental-ui
```

## Rollout Phases

| Phase | Percentage | Duration | Criteria to Advance |
|-------|------------|----------|---------------------|
| **Canary** | 5% | 24h | No errors, baseline metrics maintained |
| **Early** | 25% | 48h | Stable performance, no degradation |
| **Rollout** | 50% | 24h | Confirmed improvement in key metrics |
| **Complete** | 100% | - | Full rollout successful |

**Automated Rollout Script:**
```bash
#!/bin/bash
# scripts/progressive-rollout.sh

FLAG_KEY=$1
CURRENT_PERCENTAGE=${2:-5}
TARGET_PERCENTAGE=${3:-100}
MONITORING_HOURS=${4:-24}

echo "Progressive rollout for: $FLAG_KEY"
echo "From: ${CURRENT_PERCENTAGE}% → To: ${TARGET_PERCENTAGE}%"

# Phases
PHASES=(5 25 50 100)

for PHASE in "${PHASES[@]}"; do
  if [ $PHASE -le $CURRENT_PERCENTAGE ]; then
    echo "Skipping phase: ${PHASE}% (already past)"
    continue
  fi

  if [ $PHASE -gt $TARGET_PERCENTAGE ]; then
    echo "Stopping before: ${PHASE}% (target is ${TARGET_PERCENTAGE}%)"
    break
  fi

  echo "Advancing to: ${PHASE}%"

  # Update flag
  curl -X PATCH https://app.posthog.com/api/projects/$PROJECT_ID/feature_flags/$FLAG_ID/ \
    -H "Authorization: Bearer $POSTHOG_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"filters\": {
        \"groups\": [{
          \"properties\": [],
          \"rollout_percentage\": $PHASE
        }]
      }
    }"

  echo "Monitoring for ${MONITORING_HOURS} hours..."
  echo "Check metrics dashboard and confirm success before continuing."

  read -p "Continue to next phase? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollout paused at ${PHASE}%"
    exit 0
  fi
done

echo "✅ Rollout complete at ${TARGET_PERCENTAGE}%"
```

## Integration

This skill is invoked by the **ci-cd-engineer agent** when:
- Implementing new features that require gradual rollout
- Setting up A/B testing for feature comparison
- Configuring emergency rollback mechanisms
- Managing feature flag lifecycle and cleanup

The ci-cd-engineer agent:
1. Assesses feature risk and rollout requirements
2. Invokes this skill to configure appropriate flags
3. Sets up monitoring and alerting for flag metrics
4. Manages progressive rollout phases
5. Coordinates flag cleanup after successful rollout

## Feature Flag Best Practices

### Naming Conventions

**Use descriptive, kebab-case keys:**
- ✅ `new-checkout-flow`
- ✅ `enable-dark-mode`
- ✅ `experiment-personalized-recommendations`
- ❌ `feature1`
- ❌ `newFeature`
- ❌ `ENABLE_NEW_FEATURE`

### Flag Types

**Release Flags** (temporary):
- Enable new features progressively
- Remove after full rollout
- Typical lifetime: 2-8 weeks

**Ops Flags** (permanent):
- System behavior toggles (enable logging, circuit breakers)
- Remain in codebase long-term

**Experiment Flags** (temporary):
- A/B testing variants
- Remove after experiment concludes
- Typical lifetime: 1-4 weeks

**Permission Flags** (permanent):
- Feature access by user tier
- May remain indefinitely

### Code Organization

**Isolate flag logic:**
```javascript
// ✅ Good: Centralized flag service
class FeatureFlags {
  isNewCheckoutEnabled() {
    return posthog.isFeatureEnabled('new-checkout-flow');
  }

  shouldUseNewAPI() {
    return posthog.isFeatureEnabled('new-api-version');
  }
}

// ❌ Bad: Direct PostHog calls scattered everywhere
if (posthog.isFeatureEnabled('new-checkout-flow')) { ... }
```

**Minimize code branches:**
```javascript
// ✅ Good: Single decision point
const CheckoutFlow = featureFlags.isNewCheckoutEnabled()
  ? NewCheckoutFlow
  : LegacyCheckoutFlow;

// ❌ Bad: Multiple flag checks
if (featureFlags.isNewCheckoutEnabled()) {
  // 50 lines of new code
} else {
  // 50 lines of old code
}
```

## Reference Documentation

See `reference/` directory for detailed integration guides:
- `posthog-integration.md` - SDK setup and API usage
