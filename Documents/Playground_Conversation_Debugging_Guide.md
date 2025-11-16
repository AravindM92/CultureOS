# Playground Conversation Debugging Guide
# =====================================

## How to Check Recent Conversations

### Method 1: Bot Console Logs (EASIEST)
```powershell
# Get the bot's console output to see recent messages and errors
Get-Job | Where-Object {$_.Name -like "*Bot*"} | Receive-Job -Keep
```

### Method 2: Check if Services are Running
```powershell
# Check if playground is running on port 56150
netstat -an | findstr :56150

# Check if bot is running on port 3978
netstat -an | findstr :3978
```

### Method 3: Storage Investigation (if needed)
```powershell
# Run a simple script to check LocalStorage
cd "C:\Personal\POC\CultureOS\Culture OS"
node -e "
const { LocalStorage } = require('@microsoft/teams.common');
const storage = new LocalStorage();
console.log('Storage keys:', Object.keys(storage._data || {}));
"
```

## Common Log Patterns to Look For

### Successful WFO Trigger:
```
[WFO] Weekly routine triggered by keyword in: "Week"
[WFO] Processing WFO interaction for user Alex Wilber: "Week"
```

### WFO Errors:
```
[WFO] Error processing message: TypeError: this.messageRouter.setUserState is not a function
[WFO] Error in WFO integration: TypeError: this.messageRouter.getUserState is not a function
```

### Normal Bot Processing:
```
[2025-11-10T14:06:57.016Z] Message received from Alex Wilber: tell me a joke
handleMomentDetection called for: tell me a joke
```

## Quick Debugging Commands

### Restart Services:
```powershell
cd "C:\Personal\POC\CultureOS\scripts"
.\stop-all.ps1
.\start-all.ps1
```

### Check WFO Configuration:
```powershell
cd "C:\Personal\POC\CultureOS\Culture OS"
node -e "
const config = require('./src/config');
console.log('WFO Config:', JSON.stringify(config.wfo.testingMode, null, 2));
"
```

## Conversation History Analysis

When you see logs like this:
- `Message received from Alex Wilber: Week` = User input
- `[WFO] Weekly routine triggered` = WFO handler activated ✅
- `TypeError: this.messageRouter.setUserState` = Missing method ❌
- `handleMomentDetection called for:` = Normal bot processing (not WFO)

## Remember: 
- Console logs show REAL-TIME conversation flow
- WFO handler logs start with `[WFO]`
- Errors show exactly what's broken
- User messages show what was actually typed
