# CultureOS Scripts

This folder contains all the PowerShell and Batch scripts for managing the CultureOS system.

## Scripts Overview:

### 🚀 **Startup Scripts**
- **`start-all.ps1`** / **`start-all.bat`** - Start all CultureOS services (Python API, Node Bot, Teams Playground)
- **`stop-all.ps1`** / **`stop-all.bat`** - Stop all running CultureOS services

### 🔧 **Build & Setup Scripts**
- **`build-all.ps1`** / **`build-all.bat`** - Build and install all dependencies for the entire project
- **`setup.ps1`** - Initial project setup and configuration

### 🧪 **Testing Scripts**
- **`test-all.ps1`** / **`test-all.bat`** - Comprehensive test suite for all components (calls test files in `Culture OS/tests/`)
- **`test-location.ps1`** - Location and directory structure verification

## Usage:

### From Project Root:
```powershell
# PowerShell
.\scripts\start-all.ps1
.\scripts\stop-all.ps1
.\scripts\build-all.ps1
.\scripts\test-all.ps1

# Batch
.\scripts\start-all.bat
.\scripts\stop-all.bat
.\scripts\build-all.bat
.\scripts\test-all.bat
```

### From Scripts Directory:
```powershell
# PowerShell
.\start-all.ps1
.\stop-all.ps1
.\build-all.ps1

# Batch
start-all.bat
stop-all.bat  
build-all.bat
```

## Path Configuration:

All scripts have been updated to work from the `scripts/` folder by using the project root directory:
- **PowerShell**: `$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)`
- **Batch**: `set "SCRIPT_DIR=%~dp0..\"`

This ensures all relative paths correctly reference the main project folders:
- `Culture OS/` - Node.js bot application
- `Culture OS/tests/` - Individual test files (test-groq.js, test-api-client.js, etc.)
- `thunai-api/` - Python FastAPI backend  
- `database/` - SQLite database files

## Services Started:

1. **Python API** - Port 8000 (FastAPI backend)
2. **Node.js Bot** - Port 3978 (Teams bot application)  
3. **Teams Playground** - Development testing environment

## Notes:

- All scripts maintain backward compatibility
- Path resolution works regardless of execution location
- Background jobs are properly managed and cleaned up