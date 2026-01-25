# Quick Guide: Customizing Town Shortcuts

## For Event Organizers

If you're managing an event and want to add shortcuts for towns frequently appearing in your guest list, follow this simple guide.

## Step 1: Open the File
Navigate to: `src/lib/townShortcuts.js`

## Step 2: Find the Shortcuts Section
Look for this section at the top of the file:

```javascript
export const townShortcuts = {
    // English shortcuts
    'cbe': 'கோயம்புத்தூர்',
    'che': 'சென்னை',
    'mad': 'மதுரை',
    // ... more shortcuts
    
    // Tamil shortcuts
    'கோ': 'கோயம்புத்தூர்',
    'சே': 'சென்னை',
    'ம': 'மதுரை',
    // ... more shortcuts
};
```

## Step 3: Add Your Shortcuts
Add your custom entries before the existing shortcuts:

```javascript
export const townShortcuts = {
    // ====================================
    // MY CUSTOM SHORTCUTS FOR THIS EVENT
    // ====================================
    'mytown1': 'என்_ஊர்1',
    'mytown2': 'என்_ஊர்2',
    'என்1': 'என்_ஊர்1',
    'என்2': 'என்_ஊர்2',
    
    // ====================================
    // DEFAULT SHORTCUTS (DON'T DELETE)
    // ====================================
    'cbe': 'கோயம்புத்தூர்',
    'che': 'சென்னை',
    // ... rest of shortcuts
};
```

## Step 4: Examples

### Wedding in திண்டுக்கல் District
If most guests are from திண்டுக்கல் area townships:

```javascript
export const townShortcuts = {
    // My event shortcuts
    'tmo': 'திண்டுக்கல்-மொழிபாளையம்',
    'tpa': 'திண்டுக்கல்-பாலக்காடு',
    'tve': 'திண்டுக்கல்-வேடசந்தூர்',
    'திமொ': 'திண்டுக்கல்-மொழிபாளையம்',
    'திபா': 'திண்டுக்கல்-பாலக்காடு',
    
    // Default shortcuts...
    'cbe': 'கோயம்புத்தூர்',
    // ...
};
```

### Wedding in சென்னை Suburbs
If most guests are from சென்னை area:

```javascript
export const townShortcuts = {
    // My event shortcuts
    'tam': 'சென்னை-தாம்பரம்',
    'vel': 'சென்னை-வேளச்சேரி',
    'chro': 'சென்னை-குரோம்பேட்டை',
    'சேதா': 'சென்னை-தாம்பரம்',
    'சேவே': 'சென்னை-வேளச்சேரி',
    
    // Default shortcuts...
    'cbe': 'கோயம்புத்தூர்',
    // ...
};
```

## Step 5: Rebuild
After adding your shortcuts:

```powershell
npm run build
```

## Step 6: Test
1. Type your shortcut in the ஊர் field (e.g., `tmo`)
2. See the hint: `tmo → திண்டுக்கல்-மொழிபாளையம்`
3. Press **Space** to expand
4. ✅ Done!

## Tips for Creating Shortcuts

### 1. Use First Letters
```javascript
'mat': 'மாங்குடி-அத்தாளபுரம்'  // Ma-T
'map': 'மதுரை-பழநி'            // Ma-P
```

### 2. Use Phonetic Sounds
```javascript
'ara': 'ஆரப்பாளையம்'    // Sounds like "ara"
'ani': 'அணிகுட்டி'      // Sounds like "ani"
```

### 3. Create Both English & Tamil
```javascript
'tmo': 'திண்டுக்கல்-மொழிபாளையம்',
'திமொ': 'திண்டுக்கல்-மொழிபாளையம்',
```

### 4. Keep it Short (2-4 characters)
```javascript
✅ Good: 'tmo', 'mar', 'cpo'
❌ Bad: 'tindivakarai', 'maduraiaarappalayam'
```

### 5. Avoid Duplicates
Don't use shortcuts that already exist:

```javascript
❌ Bad: 'cbe': 'என்_ஊர்'  // cbe already exists!
✅ Good: 'cbe2': 'என்_ஊர்' // Different shortcut
```

## Real-World Example

### Event: Wedding in கோயம்புத்தூர்
**Top 5 Guest Towns:**
1. கோயம்புத்தூர்-பொள்ளாச்சி
2. கோயம்புத்தூர்-மேட்டுப்பாளையம்
3. கோயம்புத்தூர்-சூலூர்
4. கோயம்புத்தூர்-காங்கேயம்
5. கோயம்புத்தூர்-கோவை

**Custom Shortcuts to Add:**
```javascript
export const townShortcuts = {
    // === WEDDING 2025 - CBE AREA ===
    'cpol': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    'cmet': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    'csul': 'கோயம்புத்தூர்-சூலூர்',
    'ckan': 'கோயம்புத்தூர்-காங்கேயம்',
    'ckov': 'கோயம்புத்தூர்-கோவை',
    
    // Tamil versions
    'கோபொ': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    'கோமே': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    'கோசூ': 'கோயம்புத்தூர்-சூலூர்',
    'கோகா': 'கோயம்புத்தூர்-காங்கேயம்',
    'கோகோ': 'கோயம்புத்தூர்-கோவை',
    
    // Default shortcuts below...
    'cbe': 'கோயம்புத்தூர்',
    // ...
};
```

**During Event:**
```
Guest 1: Type "cpol" + Space → கோயம்புத்தூர்-பொள்ளாச்சி ✅
Guest 2: Type "cmet" + Space → கோயம்புத்தூர்-மேட்டுப்பாளையம் ✅
Guest 3: Type "csul" + Space → கோயம்புத்தூர்-சூலூர் ✅
```

**Result:** 3-second entries instead of 30-second typing!

## Advanced: Analyze Your Guest List First

Before the event, analyze your RSVP list:

```javascript
// Count towns in your guest list
// Find top 10-20 most common towns
// Create shortcuts for those towns
```

This way, 80% of your entries will use shortcuts, making data entry super fast!

## Questions?

### Can I delete default shortcuts?
No, keep them. They're useful across all events. Add yours on top.

### How many shortcuts can I add?
Unlimited! But practically, 10-20 custom shortcuts per event is ideal.

### Will my shortcuts work offline?
Yes! Everything works offline once built.

### Do I need to restart the app?
Just rebuild (`npm run build`). Then refresh the browser.

## Summary
1. Open `src/lib/townShortcuts.js`
2. Add your shortcuts at the top
3. Keep them short (2-4 chars)
4. Create both English & Tamil versions
5. Rebuild: `npm run build`
6. Test: Type shortcut + Space
7. Enjoy fast data entry! 🚀

---

**மொய்புக் 2025** - Customize it your way!
