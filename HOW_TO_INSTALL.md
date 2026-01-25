# 🚀 MoiBook2025 - எப்படி Install செய்வது?

## இரண்டு Scenarios:

---

## 📍 Scenario 1: இந்த Computer-லேயே Use செய்ய

### ✅ Status: Already Installed & Ready!

**Location:** `C:\Users\NEW\moibook2025 (2)\`

### 🚀 எப்படி Start செய்வது?

#### Option 1: Production Mode (Recommended) ⭐

```
1. Windows Explorer open பண்ணுங்க
2. இந்த location-க்கு போங்க:
   C:\Users\NEW\moibook2025 (2)\
3. இந்த file-ஐ double-click பண்ணுங்க:
   START_MOIBOOK_APP.bat
4. Browser automatic-ஆ open ஆகும்
5. Application ready! ✅
```

**URL:** http://localhost:8080

#### Option 2: Development Mode

```powershell
# PowerShell-ல்:
cd "C:\Users\NEW\moibook2025 (2)"
npm start
```

**URL:** http://localhost:3000

#### Option 3: Quick Launch (Desktop Shortcut)

```
1. START_MOIBOOK_APP.bat file-ஐ right-click
2. "Send to" → "Desktop (create shortcut)"
3. Desktop-ல் இருந்து direct-ஆ launch பண்ணலாம் ✅
```

---

## 💻 Scenario 2: வேறு Laptop-க்கு Install செய்ய

### 📦 PART A: இந்த Computer-ல் செய்யுங்க

#### Step 1: Portable Package Create பண்ணுங்க

**Method 1 (Automatic - Easy!):**

```
1. Windows Explorer open பண்ணுங்க
2. Location: C:\Users\NEW\moibook2025 (2)\
3. Double-click: CREATE_PORTABLE_PACKAGE.bat
4. Wait... Package creating...
5. Done! MoiBook2025_Portable folder created ✅
```

**Output:**
- Folder Name: `MoiBook2025_Portable`
- Size: 8.85 MB (21 files)
- Location: Same directory

**Method 2 (Manual - For advanced users):**

```
Manually copy these items:
1. build\ folder (complete folder)
2. START_MOIBOOK_APP.bat
3. INSTALLATION_GUIDE.md (optional)
4. QUICK_INSTALL_GUIDE_TAMIL.md (optional)
5. README.txt (optional)
```

#### Step 2: Pendrive-க்கு Transfer பண்ணுங்க

**Option A: Direct Folder Copy**

```
1. MoiBook2025_Portable folder-ஐ select பண்ணுங்க
2. Right-click → Copy (or Ctrl+C)
3. Pendrive/USB drive open பண்ணுங்க
4. Right-click → Paste (or Ctrl+V)
5. Wait for copy to complete
```

**Option B: ZIP File (Recommended!)**

```
1. MoiBook2025_Portable folder-ஐ right-click
2. "Send to" → "Compressed (zipped) folder"
3. ZIP file create ஆகும் (~3-4 MB compressed)
4. ZIP file-ஐ Pendrive-க்கு copy பண்ணுங்க

Benefits:
- Smaller size (3-4 MB vs 8.85 MB)
- Email/WhatsApp-ல் share பண்ணலாம்
- Google Drive/OneDrive-ல் upload பண்ணலாம்
```

---

### 💻 PART B: புதிய Laptop-ல் செய்யுங்க

#### Prerequisites (முதலில் check பண்ணுங்க):

##### 1. Windows Version Check

```cmd
# Command Prompt-ல்:
systeminfo | findstr "OS Name"
```

**Requirements:**
- ✅ Windows 10 or 11 (Best)
- ✅ Windows 8.1 (Good)
- ⚠️ Windows 7 SP1 (Minimum, not recommended)
- ❌ Older versions (Not supported)

##### 2. Python Installation Check

```cmd
# Command Prompt-ல்:
python --version
```

**Expected Output:**
```
Python 3.13.7
(or any version 3.7+)
```

**If error appears:**
```
'python' is not recognized as an internal or external command
```

**→ Python install பண்ணுங்க (கீழே instructions):**

---

#### Python Installation Guide:

##### For Windows 10/11:

1. **Download Python:**
   - Visit: https://www.python.org/downloads/
   - Click: "Download Python 3.13.x" (latest version)
   - Download will start automatically

2. **Install Python:**
   - Run the downloaded installer (python-3.13.x-amd64.exe)
   - ⚠️ **CRITICAL:** Check "Add Python to PATH" ✓
   - Check "Install for all users" (optional)
   - Click "Install Now"
   - Wait for installation (~5 minutes)
   - Click "Close" when done

3. **Verify Installation:**
   ```cmd
   # Restart Command Prompt, then:
   python --version
   ```
   Should show: `Python 3.13.x`

4. **If still not working:**
   - Restart computer
   - Try again

##### For Windows 8.1/8:

- Download Python 3.11.x (recommended for Windows 8.1)
- Follow same installation steps above

##### For Windows 7 SP1:

- Download Python 3.8.x (last version supporting Windows 7)
- Follow same installation steps above
- ⚠️ Consider upgrading to Windows 10/11 for better security

---

#### Installation Steps:

##### Step 1: Create Installation Folder

```
1. Open Windows Explorer
2. Go to C:\ drive (or any preferred location)
3. Create new folder:
   Name: MoiBook2025
   Full Path: C:\MoiBook2025\
```

##### Step 2: Extract/Copy Files

**If you have ZIP file:**

```
1. Right-click on MoiBook2025_Portable.zip
2. "Extract All..."
3. Choose destination: C:\MoiBook2025\
4. Click "Extract"
5. Wait for extraction to complete
```

**If you have folder directly:**

```
1. Open Pendrive
2. Copy MoiBook2025_Portable folder
3. Paste into C:\MoiBook2025\
4. Wait for copy to complete
```

**Final Structure:**

```
C:\MoiBook2025\
├── build\
│   ├── index.html
│   ├── manifest.json
│   ├── static\
│   │   ├── css\
│   │   │   └── main.b905c5de.css
│   │   └── js\
│   │       ├── main.xxxxxx.js
│   │       └── ...
│   └── ...
├── START_MOIBOOK_APP.bat
├── INSTALLATION_GUIDE.md
├── QUICK_INSTALL_GUIDE_TAMIL.md
├── PYTHON_WINDOWS_COMPATIBILITY.md
└── README.txt
```

##### Step 3: Launch Application

```
1. Open C:\MoiBook2025\ folder
2. Find: START_MOIBOOK_APP.bat
3. Double-click this file
4. A Command Prompt window will open
5. Browser will open automatically
6. Application loads at http://localhost:8080
7. Login page appears ✅
```

**What you'll see:**

```
Command Prompt Window:
--------------------
Serving HTTP on :: port 8080 ...
Starting browser at http://localhost:8080/
```

```
Browser Window:
--------------
MoiBook2025 Login Page
[Event selection interface]
```

##### Step 4: Verify Installation

**Checklist:**

- [ ] Command Prompt window running (don't close it!)
- [ ] Browser opened to http://localhost:8080
- [ ] Login page visible
- [ ] Can select/create event
- [ ] Can add registrar
- [ ] Can add moi entry
- [ ] Can generate report

**If all ✓ → Installation Successful! 🎉**

---

## 🔧 Troubleshooting

### Problem 1: Python not found

**Error:**
```
'python' is not recognized as an internal or external command
```

**Solution:**
1. Install Python from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH" ✓
3. Restart computer
4. Try again

---

### Problem 2: Port 8080 already in use

**Error:**
```
OSError: [WinError 10048] Only one usage of each socket address
```

**Solution:**

Edit `START_MOIBOOK_APP.bat`:

```batch
@echo off
cd /d "%~dp0"
start http://localhost:8081/
python -m http.server 8081 --directory build
pause
```

(Change 8080 to 8081 or any other port)

---

### Problem 3: Browser doesn't open automatically

**Solution:**
1. Wait for Command Prompt to show "Serving HTTP..."
2. Manually open browser
3. Type in address bar: `http://localhost:8080`
4. Press Enter

---

### Problem 4: White screen or errors

**Possible causes:**
- Incomplete file copy
- Missing files
- Corrupted download

**Solution:**
1. Check if `build` folder contains:
   - `index.html`
   - `static` folder with css and js files
   - `manifest.json`

2. If files missing:
   - Re-copy from Pendrive
   - Or re-download/re-create portable package

3. Verify by checking folder size:
   - `build` folder should be ~8+ MB
   - If much smaller, files are missing

---

### Problem 5: Application starts but data is empty

**Reason:**
- Data is stored in browser's localStorage
- Each computer/browser has separate data
- New installation = empty database

**Solution:**

**Option 1: Import Data from Old Computer**

On Old Computer:
```
1. Open MoiBook2025
2. Go to Settings (⚙️ icon)
3. Click "Export Data"
4. Save JSON file to Pendrive
```

On New Computer:
```
1. Open MoiBook2025
2. Go to Settings (⚙️ icon)
3. Click "Import Data"
4. Select JSON file from Pendrive
5. Data imported! ✅
```

**Option 2: Fresh Start**
- Create new events
- Add registrars
- Start fresh data entry

---

## 🎯 Quick Reference

### Start Application:
```
Double-click: START_MOIBOOK_APP.bat
```

### Stop Application:
```
Close Command Prompt window
(or press Ctrl+C in terminal)
```

### Restart Application:
```
Close and double-click START_MOIBOOK_APP.bat again
```

### Application URL:
```
http://localhost:8080
```

### Desktop Shortcut:
```
Right-click START_MOIBOOK_APP.bat
→ Send to → Desktop (create shortcut)
```

---

## 📊 System Requirements Summary

| Component | Minimum | Recommended | Your System |
|-----------|---------|-------------|-------------|
| OS | Windows 7 SP1 | Windows 10/11 | Windows 11 ✅ |
| Python | 3.7+ | 3.10+ | 3.13.7 ✅ |
| RAM | 4 GB | 8 GB | - |
| Storage | 500 MB | 1 GB | - |
| Browser | Any modern | Chrome/Edge | - |

---

## 📚 Documentation Files

All these files are in the portable package:

1. **INSTALLATION_GUIDE.md** (English)
   - Complete installation guide
   - Detailed troubleshooting
   - System requirements

2. **QUICK_INSTALL_GUIDE_TAMIL.md** (Tamil)
   - விரைவு வழிகாட்டி
   - படிப்படியான instructions
   - தீர்வுகள்

3. **PYTHON_WINDOWS_COMPATIBILITY.md**
   - Python version compatibility
   - Windows support matrix
   - Installation guides

4. **HOW_TO_START_WITHOUT_VSCODE.md** (Tamil)
   - Application startup guide
   - VS Code இல்லாமல் run செய்வது

5. **README.txt**
   - Quick start guide
   - Basic instructions

---

## ✅ Installation Checklist

### Before Installation:
- [ ] Portable package created (MoiBook2025_Portable)
- [ ] Files copied to Pendrive/USB
- [ ] New laptop has Windows 7 SP1 or higher
- [ ] Python 3.7+ installed on new laptop

### During Installation:
- [ ] Folder created (C:\MoiBook2025\)
- [ ] Files copied/extracted
- [ ] All files present (build folder, .bat file, docs)
- [ ] START_MOIBOOK_APP.bat exists

### After Installation:
- [ ] Application starts without errors
- [ ] Browser opens automatically
- [ ] Login page visible
- [ ] Can create test event
- [ ] Can add test entry
- [ ] Reports generate correctly

---

## 🎁 Bonus Tips

### Create Desktop Shortcut:
1. Right-click `START_MOIBOOK_APP.bat`
2. Send to → Desktop (create shortcut)
3. Rename shortcut to "MoiBook2025"
4. Now you can launch from desktop! ✅

### Access from Other Devices (Same Network):
```
1. Find computer's IP address:
   cmd → ipconfig → IPv4 Address
   Example: 192.168.1.100

2. On other device's browser:
   http://192.168.1.100:8080

Note: Firewall might block. Add exception if needed.
```

### Regular Backup:
```
Settings → Export Data → Save JSON file
Store in safe location (Pendrive/Cloud)
```

---

## 🆘 Support Resources

### Documentation:
- All .md files in portable package
- README.txt for quick reference

### Online Resources:
- Python Download: https://www.python.org/downloads/
- Windows support info: In PYTHON_WINDOWS_COMPATIBILITY.md

### Self-Help:
- Check troubleshooting section above
- Verify all installation steps completed
- Ensure Python is in PATH

---

**Installation Guide Version:** 1.0  
**Last Updated:** October 12, 2025  
**Application:** MoiBook2025 - Tamil Event Management System  
**Language:** Tamil & English
