# Desktop Shortcut Creation Guide
# MoiBook 2025 - மொய் புத்தகம்

---

## 🎯 மூன்று வழிகள் Desktop Shortcut உருவாக்க

### வழி 1️⃣: Automatic (Recommended) - PowerShell Script

**Steps:**
1. Right-click on `CREATE_DESKTOP_SHORTCUT.ps1`
2. Select "Run with PowerShell"
3. Desktop-ல் shortcut தானாக உருவாகும்!

**Icon:**
- Automatic-ஆக MoiBook logo உருவாக்கப்படும்
- Green money note (₹) + Blue book design
- Tamil text "மொய்" உடன்

---

### வழி 2️⃣: Automatic (Simple) - Batch Script

**Steps:**
1. Double-click `CREATE_DESKTOP_SHORTCUT.bat`
2. Desktop-ல் shortcut உருவாகும்

**Note:** Basic icon (default bat file icon)

---

### வழி 3️⃣: Manual (Best Quality Icon)

#### Step A: Download High-Quality Icon

1. **Open:** `create_icon.html` (double-click)
2. Browser-ல் திறக்கும்
3. Click "📥 Download All Icons" button
4. `moibook-icon-256.png` file download ஆகும்

**Icon Preview:**
```
┌─────────────────┐
│                 │
│    ₹ (Green)    │  ← Money note (rotated)
│                 │
│   📖 (Blue)     │  ← Open book
│                 │
│      மொய்       │  ← Tamil text
└─────────────────┘
```

#### Step B: Create Shortcut Manually

1. **Desktop-ல் Right-click** → New → Shortcut
2. **Browse** → Select `START_MOIBOOK_APP.bat`
3. **Click Next**
4. **Name:** Type `MoiBook 2025 - மொய் புத்தகம்`
5. **Click Finish**

#### Step C: Add Custom Icon

1. **Shortcut-ல் Right-click** → Properties
2. **Click** "Change Icon..." button
3. **Click** "Browse..." button
4. **Navigate** to downloaded `moibook-icon-256.png`
5. **Select** the icon
6. **Click** OK → Apply → OK

**Done!** ✅ Professional-looking desktop shortcut ready!

---

## 📂 Files உருவாக்கப்பட்டவை

| File Name | Description |
|-----------|-------------|
| `CREATE_DESKTOP_SHORTCUT.ps1` | PowerShell script (automatic icon generation) |
| `CREATE_DESKTOP_SHORTCUT.bat` | Batch script (basic shortcut) |
| `create_icon.html` | Icon generator (browser-based, best quality) |
| `moibook-icon-256.png` | Downloaded icon file (after using HTML generator) |

---

## 🎨 Icon Details

### Design Elements:
1. **Green Money Note (₹)**
   - Color: #4CAF50 (Green gradient)
   - Represents: Moi/Money
   - Position: Top, slightly rotated

2. **Blue Open Book (📖)**
   - Color: #2196F3 (Blue gradient)
   - Represents: Record/Register
   - Position: Bottom center

3. **Tamil Text (மொய்)**
   - Color: #4CAF50 (Green)
   - Position: Bottom
   - Font: Bold

### Sizes Available:
- 256x256 (Recommended for desktop)
- 128x128 (Medium)
- 64x64 (Standard)
- 32x32 (Small)

---

## 🔧 Troubleshooting

### Issue 1: PowerShell script இயங்கவில்லை

**Solution:**
1. Right-click on `CREATE_DESKTOP_SHORTCUT.ps1`
2. Select "Run with PowerShell"
3. அல்லது PowerShell-ஐ Administrator-ஆக திறந்து:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\CREATE_DESKTOP_SHORTCUT.ps1
   ```

### Issue 2: Icon காட்டவில்லை

**Solution:**
1. `create_icon.html` open செய்து icon download செய்யவும்
2. Shortcut → Properties → Change Icon
3. Downloaded PNG file select செய்யவும்

### Issue 3: Shortcut உருவாகவில்லை

**Solution:**
1. Manual method-ஐ follow செய்யவும் (வழி 3)
2. அல்லது Administrator-ஆக script run செய்யவும்

---

## ✨ Features

### Desktop Shortcut Benefits:
✅ One-click access to MoiBook  
✅ Professional MoiBook logo icon  
✅ Tamil name support (மொய் புத்தகம்)  
✅ Easy to identify on desktop  
✅ No need to navigate to folder  

### Icon Quality:
✅ 256x256 high resolution  
✅ Transparent background (optional)  
✅ Professional gradient design  
✅ Tamil text rendering  
✅ Multiple size options  

---

## 📝 Shortcut Details

**Shortcut Name:**
```
MoiBook 2025 - மொய் புத்தகம்.lnk
```

**Target:**
```
C:\Users\NEW\moibook2025 (2)\START_MOIBOOK_APP.bat
```

**Working Directory:**
```
C:\Users\NEW\moibook2025 (2)
```

**Description:**
```
MoiBook 2025 - Tamil Wedding Moi Management System
```

---

## 🚀 Quick Start After Shortcut Creation

1. **Desktop-ல் shortcut-ஐ double-click** செய்யவும்
2. Browser தானாக திறக்கும் → `http://localhost:3000`
3. MoiBook application ready!

---

## 🎁 Bonus: Multiple Icon Styles

`create_icon.html` opens செய்தால்:
- 4 different sizes-ல் preview
- Download all sizes at once
- Copy to clipboard option
- Professional quality PNG files

---

## 📞 Support

**Issues:**
- Shortcut create ஆகவில்லை → Manual method use செய்யவும்
- Icon display ஆகவில்லை → PNG icon download செய்து set செய்யவும்
- Script error → Administrator-ஆக run செய்யவும்

**Files Location:**
All files in: `C:\Users\NEW\moibook2025 (2)\`

---

**Created:** January 12, 2025  
**Version:** 1.0  
**Status:** Ready to Use ✅
