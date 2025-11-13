# Thun.ai Bot - Tenant Dependency Guide

## Overview
This document explains Microsoft 365 tenant dependencies in the Thun.ai bot and how to set it up for different users/tenants.

## Current Configuration
- **Primary Tenant**: `aravindm@28ypnx.onmicrosoft.com`
- **Tenant ID**: `9a7d6332-10b2-4e05-b72a-ba7f24002a3b`
- **Bot ID**: `e863b1d9-ee1e-45be-9118-f2839d8a5629`
- **Teams App ID**: `375eeb43-8d57-4f30-a0fe-bcd97e3b1a84`

## ✅ No Hardcoded Dependencies
The codebase is **tenant-agnostic** with no hardcoded email addresses or tenant-specific values. All configurations use environment variables.

## Where Tenant ID is Used

### 1. Microsoft Bot Framework Registration
- **Purpose**: Links bot identity to M365 tenant
- **Location**: `thunai-bot/src/config.js` → `MicrosoftAppTenantId`
- **Source**: Environment variable `TENANT_ID`

### 2. Teams App Authentication
- **Purpose**: Security and permission validation
- **Location**: `thunai-bot/env/.env.local` → `TEAMS_APP_TENANT_ID`
- **Usage**: Teams validates bot requests against this tenant

### 3. Bot Registration IDs
- **Purpose**: Microsoft's bot identity system
- **Files**:
  - `thunai-bot/.localConfigs`
  - `thunai-bot/env/.env.local`
  - `thunai-bot/appPackage/manifest.json`

## Deployment Scenarios

### Scenario 1: Same Tenant (Easiest)
**For teammates using the same M365 tenant:**
- ✅ **Works immediately** - no changes needed
- ✅ **Same bot registration** can be shared
- ✅ **Same Teams app** installation

### Scenario 2: Different Tenant
**For teammates using different M365 tenants:**

#### Required Steps:
1. **Create new Bot Registration** in their tenant
2. **Update environment files** with new IDs
3. **Create new Dev Tunnel** for local development
4. **Update Teams App Manifest** with new bot ID

#### Files to Update:
```
thunai-bot/
├── .localConfigs                 # Update BOT_ID, CLIENT_ID
├── env/.env.local               # Update all IDs
├── appPackage/manifest.json     # Update botId
└── src/config.js               # No changes (uses env vars)
```

## Environment Variables Reference

### Required for Bot Registration:
- `CLIENT_ID` - Bot's Azure AD App ID
- `CLIENT_SECRET` - Bot's authentication secret
- `TENANT_ID` - M365 tenant identifier
- `BOT_ID` - Bot Framework registration ID
- `TEAMS_APP_ID` - Teams application ID

### Optional/Configurable:
- `BOT_DOMAIN` - Dev tunnel domain (auto-generated)
- `BOT_ENDPOINT` - Bot endpoint URL
- `GROQ_API_KEY` - AI service key (independent of tenant)

## Why Microsoft Requires Tenant ID

### Security & Isolation:
- **Tenant Isolation**: Ensures bots only work in authorized tenants
- **Authentication**: Links bot credentials to specific M365 tenant
- **Permission Validation**: Teams validates bot permissions against tenant
- **Audit Trail**: Microsoft tracks bot usage per tenant

### Microsoft's Architecture:
- **Bot Framework**: Requires tenant for registration
- **Azure AD**: Links app registration to tenant
- **Teams Platform**: Validates installation permissions
- **Dev Tunnels**: Authenticates requests from Teams

## Setup Instructions for New Tenant

### 1. Register New Bot
```bash
# Using Teams Toolkit
teamsfx new bot --name "thunai-bot" --tenant "your-tenant-id"
```

### 2. Update Configuration Files
```bash
# Update .localConfigs
BOT_ID=<new-bot-id>
CLIENT_ID=<new-client-id>
CLIENT_SECRET=<new-client-secret>

# Update env/.env.local
TEAMS_APP_TENANT_ID=<new-tenant-id>
BOT_ID=<new-bot-id>
TEAMS_APP_ID=<new-teams-app-id>
```

### 3. Update Teams Manifest
```json
{
  "bots": [{
    "botId": "<new-bot-id>"
  }]
}
```

### 4. Create Dev Tunnel
```bash
# Generate new tunnel
devtunnel create --allow-anonymous
devtunnel port create -p 3978
```

## Code Architecture Benefits

### ✅ Tenant-Agnostic Design:
- No hardcoded tenant references
- Environment-based configuration
- Portable across tenants
- Clean separation of concerns

### ✅ Easy Migration:
- Update environment files only
- No code changes required
- Maintains functionality across tenants
- Preserves all features (WFO, AI, etc.)

## Troubleshooting

### Common Issues:
1. **Bot not responding**: Check tenant ID matches registration
2. **Authentication errors**: Verify client secret is correct
3. **Teams installation fails**: Ensure bot ID in manifest matches registration
4. **Dev tunnel issues**: Regenerate tunnel and update endpoint

### Verification Steps:
```bash
# Test bot endpoint
curl http://localhost:3978/api/messages

# Check environment variables
echo $TENANT_ID
echo $BOT_ID

# Validate Teams app
teamsfx validate --env local
```

## Conclusion
The Thun.ai bot is designed with **tenant portability** in mind. While Microsoft requires tenant registration for security, the codebase remains **completely portable** across different M365 tenants with simple configuration updates.