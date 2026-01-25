/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Name Shortcuts Configuration
 * Common Tamil names for quick entry during busy events
 */

// பெயர் Shortcuts (Name Shortcuts)
export const nameShortcuts = {
    // ஆண் பெயர்கள் (Male Names)
    // English shortcuts
    'ram': 'ராமசாமி',
    'mur': 'முருகன்',
    'kum': 'குமார்',
    'sel': 'செல்வம்',
    'raj': 'ராஜா',
    'ven': 'வேங்கடேசன்',
    'gan': 'கணேசன்',
    'sub': 'சுப்பிரமணியன்',
    'kar': 'கருப்பையா',
    'pal': 'பழனிசாமி',
    'san': 'சண்முகம்',
    'aru': 'அருள்மொழி',
    'kan': 'கந்தசாமி',
    'per': 'பெருமாள்',
    'bala': 'பாலசுப்பிரமணியன்',
    'mani': 'மணிகண்டன்',
    
    // Tamil shortcuts (ஆண் பெயர்கள்)
    'ரா': 'ராமசாமி',
    'மு': 'முருகன்',
    'கு': 'குமார்',
    'செ': 'செல்வம்',
    'ரா': 'ராஜா',
    'வே': 'வேங்கடேசன்',
    'க': 'கணேசன்',
    'சு': 'சுப்பிரமணியன்',
    'க': 'கருப்பையா',
    'ப': 'பழனிசாமி',
    'ச': 'சண்முகம்',
    'அ': 'அருள்மொழி',
    
    // பெண் பெயர்கள் (Female Names)
    // English shortcuts
    'lak': 'லட்சுமி',
    'par': 'பார்வதி',
    'ann': 'அன்னலட்சுமி',
    'sel': 'செல்லம்',
    'kan': 'கண்ணம்மா',
    'kam': 'காமாட்சி',
    'mee': 'மீனாட்சி',
    'jan': 'ஜானகி',
    'dev': 'தேவகி',
    'uma': 'உமா',
    'kok': 'கோகிலா',
    'van': 'வனஜா',
    
    // Tamil shortcuts (பெண் பெயர்கள்)
    'ல': 'லட்சுமி',
    'பா': 'பார்வதி',
    'அன்': 'அன்னலட்சுமி',
    'செ': 'செல்லம்',
    'கண்': 'கண்ணம்மா',
    'கா': 'காமாட்சி',
    'மீ': 'மீனாட்சி',
    'ஜா': 'ஜானகி',
    'தே': 'தேவகி',
    'உ': 'உமா',
    'கோ': 'கோகிலா',
};

// Function to expand name shortcut
export const expandNameShortcut = (input) => {
    if (!input) return input;
    
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    
    // Check if it's a shortcut
    if (nameShortcuts[lower]) {
        return nameShortcuts[lower];
    }
    
    // Check Tamil shortcuts (case-sensitive)
    if (nameShortcuts[trimmed]) {
        return nameShortcuts[trimmed];
    }
    
    return input;
};

// Function to get name suggestions
export const getNameSuggestion = (input) => {
    if (!input || input.length < 1) return '';
    
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    
    // Check English shortcuts
    if (nameShortcuts[lower]) {
        return `${lower} → ${nameShortcuts[lower]}`;
    }
    
    // Check Tamil shortcuts
    if (nameShortcuts[trimmed]) {
        return `${trimmed} → ${nameShortcuts[trimmed]}`;
    }
    
    return '';
};

// Get all name shortcuts for reference
export const getAllNameShortcuts = () => {
    return Object.entries(nameShortcuts).map(([shortcut, name]) => ({
        shortcut,
        name
    }));
};
