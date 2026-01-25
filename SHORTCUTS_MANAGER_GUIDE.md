# Customizable Shortcuts Manager - User Guide

## 🎯 Overview
மொய்புக் 2025 இப்போது **UI-based Shortcuts Manager** உடன் வருகிறது! இனி code edit செய்ய தேவையில்லை - UI-லேயே shortcuts add, edit, delete செய்யலாம்!

## 📍 Access the Shortcuts Manager

### Step 1: Open the Menu
மொய் Entry Page-ல், மேலே உள்ள **hamburger menu (☰)** click செய்யவும்

### Step 2: Select "⚙️ ஊர் Shortcuts"
Menu-வில் "⚙️ ஊர் Shortcuts" option-ஐ click செய்யவும்

### Step 3: Shortcuts Manager Opens
Full-screen modal திறக்கும் with:
- ✏️ Add/Edit form
- 🔍 Search box
- 📋 List of all custom shortcuts
- ⚙️ Edit/Delete buttons

## 🚀 Adding a New Shortcut

### Method 1: Using the Form

1. **Type Shortcut** (e.g., `mytown`, `என்ஊ`)
   - English or Tamil OK
   - 2-4 characters recommended
   
2. **Type Town** (e.g., `என்_ஊர்_பெயர்`)
   - Full town name in Tamil
   
3. **Click "Add"** button or press **Enter**
   - Shortcut added immediately
   - Saved to localStorage
   - Works instantly in ஊர் field

### Example:
```
Shortcut: tmo
Town: திண்டுக்கல்-மொழிபாளையம்
[Click Add]
✅ Added!
```

## ✏️ Editing a Shortcut

1. Click the **"✏️ Edit"** button on any shortcut
2. Shortcut and Town appear in the form above
3. Modify the values
4. Click **"Update"** button
5. ✅ Changes saved!

**Cancel**: Click "Cancel" to abort edit

## 🗑️ Deleting a Shortcut

1. Click the **"🗑️ Delete"** button on any shortcut
2. Confirmation dialog appears
3. Click "OK" to confirm
4. ✅ Shortcut removed!

## 🔍 Searching Shortcuts

Type in the search box to filter shortcuts:
- Search by shortcut code (e.g., `cbe`)
- Search by town name (e.g., `கோயம்`)
- Real-time filtering

## 💾 How It Works

### Storage
- Custom shortcuts stored in **localStorage**
- Key: `customTownShortcuts`
- Persists across sessions
- No server needed (offline-first)

### Priority
Custom shortcuts **override** default shortcuts:
```
Default: cbe → கோயம்புத்தூர்
Custom:  cbe → என்_ஊர் (Your custom town)
Result:  Uses your custom shortcut ✅
```

### Integration
- Custom shortcuts merge with built-in shortcuts
- Work in ஊர் field immediately
- Space key expansion works
- Hints display correctly
- Auto-correction respects custom shortcuts

## 📊 Interface Layout

```
┌─────────────────────────────────────────────┐
│  ⌨️ ஊர் Shortcuts Manager              ✕  │
├─────────────────────────────────────────────┤
│  [Shortcut]  [Town]           [+ Add]      │
├─────────────────────────────────────────────┤
│  🔍 Search shortcuts...                     │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐  │
│  │ cbe  → கோயம்புத்தூர்  [Edit] [Del] │  │
│  │ mar  → மதுரை-ஆரப்பாளையம் [Edit] [Del] │  │
│  │ tmo  → திண்டுக்கல்-மொழி  [Edit] [Del] │  │
│  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  📊 Total: 3 shortcuts          [Done]     │
└─────────────────────────────────────────────┘
```

## 🎨 Use Cases

### Wedding Event
Add shortcuts for bride/groom's hometown areas:

```
Shortcut: btown → மணமகன்_ஊர்
Shortcut: gtown → மணமகள்_ஊர்
Shortcut: brel1 → மணமகன்_உறவினர்_ஊர்1
```

### District-Specific Event
Add shortcuts for all nearby towns:

```
// For திண்டுக்கல் event
tmo → திண்டுக்கல்-மொழிபாளையம்
tpa → திண்டுக்கல்-பாலக்காடு
tve → திண்டுக்கல்-வேடசந்தூர்
tna → திண்டுக்கல்-நத்தம்
```

### Recurring Donors
Add shortcuts for frequent donor hometowns:

```
donor1 → வழக்கமான_நன்கொடையாளர்_ஊர்1
donor2 → வழக்கமான_நன்கொடையாளர்_ஊர்2
```

## ⚡ Workflow

### Event Setup (Before Entry)
1. Open Shortcuts Manager
2. Add 10-20 shortcuts for expected towns
3. Close manager
4. Start entry work

### During Entry
1. Type shortcut (e.g., `tmo`)
2. See hint: `💡 tmo → திண்டுக்கல்-மொழிபாளையம்`
3. Press Space
4. ✅ Expands automatically!

### After Event (Cleanup)
1. Open Shortcuts Manager
2. Delete event-specific shortcuts
3. Keep frequently used ones
4. Manager ready for next event

## 🔑 Keyboard Shortcuts

In the Manager:
- **Enter** - Add/Update shortcut
- **Escape** - Close manager (future feature)
- **Tab** - Navigate between fields

In ஊர் Field:
- **Space** - Expand shortcut
- Shows hint while typing

## ⚠️ Tips & Best Practices

### ✅ DO:
- Use short codes (2-4 chars)
- Create both English and Tamil shortcuts
- Test shortcuts after adding
- Delete temporary shortcuts after event
- Keep frequently used ones

### ❌ DON'T:
- Don't use very long shortcuts (defeats purpose)
- Don't duplicate built-in shortcuts unless intentional
- Don't forget to click "Add" after typing
- Don't close manager without saving changes

## 🔧 Technical Details

### Data Structure
```json
{
  "tmo": "திண்டுக்கல்-மொழிபாளையம்",
  "mar": "மதுரை-ஆரப்பாளையம்",
  "என்ஊ": "என்_ஊர்_பெயர்"
}
```

### localStorage Key
```javascript
localStorage.getItem('customTownShortcuts')
```

### Function Integration
All shortcut functions in `townShortcuts.js` automatically load custom shortcuts:
- `expandShortcut()`
- `expandShortcutOnSpace()`
- `getShortcutSuggestion()`
- `getAllShortcuts()`
- `isShortcut()`

## 📱 Responsive Design
- Desktop: Full-width modal (max 800px)
- Mobile: 90% width, scrollable
- Touch-friendly buttons
- Easy to use on tablets

## 🌟 Benefits

### Before (Code Editing):
```
1. Open townShortcuts.js file
2. Find the right section
3. Add shortcuts in code
4. Save file
5. Rebuild application
6. Refresh browser
❌ Technical knowledge required
❌ Time-consuming
```

### After (UI Manager):
```
1. Open menu
2. Click "⚙️ ஊர் Shortcuts"
3. Add shortcut in form
4. Click "Add"
✅ Works immediately!
✅ No technical knowledge needed
✅ Takes 10 seconds
```

## 🎯 Summary

The Shortcuts Manager provides:

✅ **Easy to Use** - No code editing needed  
✅ **Visual Interface** - See all shortcuts at once  
✅ **Real-Time** - Changes work immediately  
✅ **Searchable** - Find shortcuts quickly  
✅ **Edit/Delete** - Full CRUD operations  
✅ **Persistent** - Saved in localStorage  
✅ **Offline** - Works without internet  
✅ **Event-Specific** - Customize per event  

---

**Access:** Menu (☰) → ⚙️ ஊர் Shortcuts  
**Storage:** localStorage (`customTownShortcuts`)  
**Build:** 475.56 kB (+1.39 kB)  

**மொய்புக் 2025** - Now with user-friendly shortcuts customization! 🎉
