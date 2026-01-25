# 🚀 MoiBook2025 - Installation Guide for New Laptop

## 📦 Package Contents
இந்த package-ல் இருப்பவை:
- ✅ `build/` - Production-ready application
- ✅ `START_MOIBOOK_APP.bat` - Easy launch file
- ✅ `HOW_TO_START_WITHOUT_VSCODE.md` - Tamil instructions
- ✅ `INSTALLATION_GUIDE.md` - This file

---

## 💻 System Requirements
புதிய laptop-ல் இவை இருக்க வேண்டும்:

### Minimum Requirements:
- **Operating System**: Windows 10 or higher
- **RAM**: 4 GB minimum (8 GB recommended)
- **Storage**: 500 MB free space
- **Python**: Version 3.7 or higher

### Python Installation:
1. Check if Python is already installed:
   ```powershell
   python --version
   ```

2. If not installed, download from:
   👉 https://www.python.org/downloads/

3. During installation:
   - ✅ Check "Add Python to PATH"
   - ✅ Install for all users (optional)

---

## 📥 Installation Steps

### Step 1: Copy Files
1. Create a folder on new laptop:
   ```
   C:\MoiBook2025\
   ```

2. Copy these items from pendrive/USB:
   - `build` folder (complete folder with all files)
   - `START_MOIBOOK_APP.bat`
   - `HOW_TO_START_WITHOUT_VSCODE.md` (optional)
   - `INSTALLATION_GUIDE.md` (optional)

### Step 2: Verify Python
1. Open Command Prompt or PowerShell
2. Type:
   ```powershell
   python --version
   ```
3. Should show: `Python 3.x.x`

### Step 3: Run Application
1. Go to `C:\MoiBook2025\`
2. Double-click `START_MOIBOOK_APP.bat`
3. Browser will open automatically at `http://localhost:8080`
4. Application is ready! ✅

---

## 🎯 Quick Start

```
இந்த 3 steps மட்டும் போதும்:

1️⃣ Copy → build folder + START_MOIBOOK_APP.bat
2️⃣ Check → python --version
3️⃣ Run → START_MOIBOOK_APP.bat double-click

Done! 🎉
```

---

## 🔧 Troubleshooting

### Problem 1: Python not found
**Error**: `'python' is not recognized...`

**Solution**:
1. Install Python from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart computer
4. Try again

### Problem 2: Port 8080 already in use
**Error**: `Address already in use`

**Solution**:
1. Edit `START_MOIBOOK_APP.bat`
2. Change `8080` to `8081` or any other port:
   ```batch
   start http://localhost:8081/
   python -m http.server 8081 --directory build
   ```

### Problem 3: Browser doesn't open automatically
**Solution**:
1. Manually open browser
2. Go to: `http://localhost:8080`

### Problem 4: White screen or errors
**Solution**:
1. Check if `build` folder has these files:
   - `index.html`
   - `static/` folder
   - `manifest.json`
2. If missing, recopy from original laptop

---

## 📱 Data Transfer

### Export data from old laptop:
1. Open MoiBook application
2. Go to Settings (⚙️ icon)
3. Click "Export Data" → Download JSON file
4. Save to pendrive

### Import data to new laptop:
1. Open MoiBook application on new laptop
2. Go to Settings (⚙️ icon)
3. Click "Import Data" → Select JSON file
4. Data imported! ✅

**Note**: Data is stored in browser's localStorage by default. Each laptop will have separate data unless you use cloud sync (PlanetScale).

---

## ☁️ Cloud Sync (Optional - Advanced)

If you want same data on multiple laptops:

1. Setup PlanetScale (see `docs/PlanetScale_Setup.md`)
2. Configure on both laptops:
   - Settings → Database Config
   - Enter same PlanetScale credentials
3. Data will sync automatically

---

## 📞 Support

### Common Issues:
- Application not opening → Check Python installation
- Data not showing → Check localStorage/import data
- Port conflicts → Change port in .bat file

### Documentation Files:
- `HOW_TO_START_WITHOUT_VSCODE.md` - Tamil startup guide
- `docs/QuickSetupGuide.md` - Detailed setup
- `docs/MultiSystemDeployment.md` - Cloud sync setup

---

## ✅ Verification Checklist

Before using on new laptop, verify:

- [ ] Python installed (`python --version` works)
- [ ] `build` folder copied completely
- [ ] `START_MOIBOOK_APP.bat` file copied
- [ ] Application opens in browser
- [ ] Can create test event
- [ ] Can add test moi entry
- [ ] Reports generate correctly
- [ ] Print functionality works

---

## 🎉 Success!

If you can:
1. ✅ Double-click `START_MOIBOOK_APP.bat`
2. ✅ See MoiBook login page in browser
3. ✅ Create events and add entries

**Congratulations! Installation successful!** 🎊

---

## 📝 Notes

### File Structure on New Laptop:
```
C:\MoiBook2025\
├── build\
│   ├── index.html
│   ├── manifest.json
│   ├── static\
│   │   ├── css\
│   │   └── js\
│   └── ...
└── START_MOIBOOK_APP.bat
```

### Important:
- Keep `build` folder and `.bat` file in same directory
- Don't rename `build` folder
- Don't modify files inside `build` folder
- Create desktop shortcut of `.bat` file for easy access

---

**Created**: October 12, 2025  
**Version**: 1.0  
**Application**: MoiBook2025 - Tamil Event Management System
