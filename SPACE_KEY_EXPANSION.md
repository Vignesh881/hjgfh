# Space Key Expansion - User Manual

## Overview
The shortcuts system has been configured for **manual expansion** - shortcuts expand only when you press the **Space key**, not automatically while typing.

## How It Works

### 1. Type a Shortcut
When you start typing in the ஊர் (Town) field, the system shows hints for available shortcuts:

```
Type: "cbe"
Hint shown: 💡 cbe → கோயம்புத்தூர்
```

### 2. Press Space to Expand
- Press the **Space key** to expand the shortcut
- The shortcut transforms into the full town name
- The hint disappears

```
Type: "cbe" + Space
Result: "கோயம்புத்தூர்"
```

### 3. Continue Typing (No Expansion)
- If you don't press Space, the shortcut remains as-is
- You can continue typing normally
- The hint stays visible to remind you of available expansion

## Available Town Shortcuts

### Major Cities
- `cbe` / `கோ` → கோயம்புத்தூர்
- `che` / `சே` → சென்னை
- `mad` / `ம` → மதுரை
- `tri` / `தி` → திருச்சி
- `din` / `டி` → டிண்டுக்கல்
- `tho` / `தூ` → தூத்துக்குடி
- And 50+ more...

### Township Shortcuts (New!)
- `mar` / `மஆ` → மதுரை-ஆரப்பாளையம்
- `mav` / `மஆவ` → மதுரை-ஆவணியாபுரம்
- `mme` / `মমே` → மதுரை-மேலூர்
- `cpo` / `கோபொ` → கோயம்புத்தூர்-பொள்ளாச்சி
- `cme` / `கோமே` → கோயம்புத்தூர்-மேட்டுப்பாளையம்
- And 14 more...

## Customization

### Adding Your Own Shortcuts
You can add custom shortcuts for frequently used towns in your events:

**File to Edit:** `src/lib/townShortcuts.js`

```javascript
export const townShortcuts = {
    // Your custom shortcuts
    'mytown': 'என்_ஊர்_பெயர்',
    'என்ஊ': 'என்_ஊர்_பெயர்',
    
    // Existing shortcuts...
    'cbe': 'கோயம்புத்தூர்',
    // ...
};
```

### Tips for Creating Good Shortcuts
1. **Keep it short**: 2-4 characters (e.g., `cbe`, `mar`)
2. **Memorable**: Use first letters or phonetic sounds
3. **Both scripts**: Create both English and Tamil shortcuts
4. **Avoid conflicts**: Don't duplicate existing shortcuts

### Examples of Custom Shortcuts
```javascript
// For a wedding in திண்டுக்கல் area
'tmo': 'திண்டுக்கல்-மொழிபாளையம்',
'tpa': 'திண்டுக்கல்-பாலக்காடு',

// For frequent donor towns
'vill': 'என்_கிராமம்_பெயர்',
'விக': 'என்_கிராமம்_பெயர்',
```

## Auto-Correction (Still Active)
Even without Space key expansion, auto-correction works on blur:

### Common Fixes
- `மதுரை - ஆரப்பாளையம்` → `மதுரை-ஆரப்பாளையம்` (removes spaces around hyphen)
- `மதுரை ஆரப்பாளையம்` → `மதுரை-ஆரப்பாளையம்` (adds missing hyphen)
- `மதுரைஆரப்பாளையம்` → `மதுரை-ஆரப்பாளையம்` (separates joined text)
- `மதுரை-அரப்ளையம்` → `மதுரை-ஆரப்பாளையம்` (fixes spelling)

## Other Field Shortcuts
Space key expansion also works in other fields:

### பெயர் (Name) Field
- `ram` → ராமசாமி
- `lak` → லட்சுமி
- `கு` → குமார்
- 60+ name shortcuts

### உறவு (Relationship) Field
- `b` → அண்ணன்
- `f` → தந்தை
- `m` → அம்மா
- 30+ relationship shortcuts

### தொகை (Amount) Field
- `1k` → 1000
- `5k` → 5000
- `501` → 501
- 25+ amount shortcuts

## Benefits of Space Key Expansion

✅ **Full Control**: You decide when to expand
✅ **No Accidents**: Typing naturally won't trigger unwanted expansions
✅ **See Before Expand**: The hint shows what will happen
✅ **Fast Entry**: One Space key press expands instantly
✅ **Customizable**: Add shortcuts for your specific needs
✅ **Works Offline**: No internet needed

## Workflow Example

```
Event: Wedding in மதுரை area
Common towns: மதுரை, மதுரை-ஆரப்பாளையம், மதுரை-மேலூர்

Entry 1:
  Type: "mad" → See hint: mad → மதுரை
  Press: Space → Expands to மதுரை
  
Entry 2:
  Type: "mar" → See hint: mar → மதுரை-ஆரப்பாளையம்
  Press: Space → Expands to மதுரை-ஆரப்பாளையம்
  
Entry 3:
  Type: "mme" → See hint: mme → மதுரை-மேலூர்
  Press: Space → Expands to மதுரை-மேலூர்
```

## Technical Details

### Implementation
- **Function**: `expandShortcutOnSpace()` in `townShortcuts.js`
- **Trigger**: Space key press in SearchableComboBox
- **Behavior**: Only expands if input matches a known shortcut
- **Fallback**: If no match, Space key acts normally

### Build Info
- **Version**: Build 474.17 kB
- **Features**: 165+ shortcuts (64 town + 60 name + 30 relationship + 25 amount)
- **Auto-correction**: 20+ rules
- **Validation**: ஊர் and பெயர் mandatory

## Troubleshooting

### Shortcut not expanding?
1. Check if you pressed **Space** (not Enter)
2. Verify the shortcut exists (see hints)
3. Make sure you're in the ஊர் field

### Want to type the shortcut as-is?
- Just don't press Space
- Continue typing other characters
- Example: Type "cbe" + "n" = "cben" (no expansion)

### Need to add new shortcuts?
1. Edit `src/lib/townShortcuts.js`
2. Add your shortcuts to the `townShortcuts` object
3. Rebuild: `npm run build`
4. Shortcuts work immediately

## Summary
Space key expansion gives you the power of shortcuts with full manual control. Type, see the hint, press Space to expand. Customize shortcuts for your events. Fast, reliable, and totally under your control.

**மொய்புக் 2025** - Professional event management with Tamil excellence.
