# MoiBook2025 - Quick Start Guide

## எளிமையான முறை (VS Code இல்லாமல்)

### Option 1: Batch File பயன்படுத்தவும் (மிக எளிது!) ⚡

1. **Production Mode** (Optimized, Fast):
   - `START_MOIBOOK_APP.bat` file-ஐ double-click செய்யவும்
   - Browser தானாக திறக்கும்
   - URL: http://localhost:8080/

2. **Development Mode** (Live reload):
   - `START_MOIBOOK_DEV.bat` file-ஐ double-click செய்யவும்
   - 30-60 seconds காத்திருக்கவும்
   - Browser தானாக திறக்கும்

### Option 2: Manual Method (Command Prompt)

1. **Windows Key + R** press செய்யவும்
2. Type: `cmd` and press Enter
3. Terminal-ல் type செய்யவும்:
   ```
   cd "C:\Users\NEW\moibook2025 (2)"
   python -m http.server 8080 --directory build
   ```
4. Browser-ல் open செய்யவும்: http://localhost:8080/

### Option 3: PowerShell Method

1. **Windows Key + X** press செய்யவும்
2. **Windows PowerShell** select செய்யவும்
3. Type செய்யவும்:
   ```powershell
   cd "C:\Users\NEW\moibook2025 (2)"
   python -m http.server 8080 --directory build
   ```
4. Browser-ல் open செய்யவும்: http://localhost:8080/

---

## Server நிறுத்துவது எப்படி?

Terminal/Command Prompt window-ல் **Ctrl + C** press செய்யவும்

---

## குறிப்புகள்:

- ✅ Production mode (port 8080) - வேகமானது, optimized
- ✅ Development mode (port 3000) - Live reload, debugging
- ✅ Python installed இருக்க வேண்டும் (production mode-க்கு)
- ✅ Node.js installed இருக்க வேண்டும் (development mode-க்கு)

---

## Troubleshooting

**Port already in use error வந்தால்:**
```
netstat -ano | findstr :8080
taskkill /PID <process_id> /F
```

**Python error வந்தால்:**
- Python installed ஆகி இருக்கிறதா என்று check செய்யவும்
- Command: `python --version`

**Browser தானாக திறக்கவில்லை என்றால்:**
- Manual-ஆக browser-ல் type செய்யவும்: http://localhost:8080/
