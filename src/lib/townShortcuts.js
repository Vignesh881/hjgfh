/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Town Shortcuts Configuration
 * Common towns with keyboard shortcuts for quick entry
 */

// Pre-configured town shortcuts - Customize based on your most common towns
export const townShortcuts = {
    // Format: 'shortcut': 'Full Town Name'
    
    // English shortcuts (Common Tamil Nadu towns)
    'cbe': 'கோயம்புத்தூர்',
    'che': 'சென்னை',
    'mad': 'மதுரை',
    'tri': 'திருச்சி',
    'sal': 'சேலம்',
    'ero': 'ஈரோடு',
    'din': 'திண்டுக்கல்',
    'kar': 'காரைக்குடி',
    'thj': 'தஞ்சாவூர்',
    'tir': 'திருநெல்வேலி',
    'tut': 'தூத்துக்குடி',
    'knk': 'காஞ்சிபுரம்',
    'vel': 'வேலூர்',
    'pol': 'பொள்ளாச்சி',
    'met': 'மேட்டுப்பாளையம்',
    'pal': 'பாலக்காடு',
    'kod': 'கோடைக்கானல்',
    'uth': 'உதகமண்டலம்',
    'nag': 'நாகர்கோவில்',
    'ram': 'ராமநாதபுரம்',
    
    // Tamil shortcuts (தமிழில்)
    'கோ': 'கோயம்புத்தூர்',
    'சே': 'சென்னை',
    'ம': 'மதுரை',
    'தி': 'திருச்சி',
    'சேல': 'சேலம்',
    'ஈ': 'ஈரோடு',
    'தின்': 'திண்டுக்கல்',
    'கா': 'காரைக்குடி',
    'தஞ்': 'தஞ்சாவூர்',
    'திநெ': 'திருநெல்வேலி',
    'தூ': 'தூத்துக்குடி',
    'காஞ்': 'காஞ்சிபுரம்',
    'வே': 'வேலூர்',
    'பொ': 'பொள்ளாச்சி',
    'மே': 'மேட்டுப்பாளையம்',
    'பா': 'பாலக்காடு',
    'கோடை': 'கோடைக்கானல்',
    'உ': 'உதகமண்டலம்',
    'நா': 'நாகர்கோவில்',
    'ரா': 'ராமநாதபுரம்',
    
    // Common area shortcuts (both English and Tamil)
    'av': 'ஆவணியாபுரம்',
    'ஆ': 'ஆவணியாபுரம்',
    'ush': 'உசிலம்பட்டி',
    'உசி': 'உசிலம்பட்டி',
    'mel': 'மேலூர்',
    'மேல்': 'மேலூர்',
    'val': 'வல்லம்',
    'வ': 'வல்லம்',
    'kal': 'கள்ளிக்குடி',
    'கள்': 'கள்ளிக்குடி',
    
    // Madurai area townships (Example - Add your common townships)
    'mar': 'மதுரை-ஆரப்பாளையம்',
    'மஆ': 'மதுரை-ஆரப்பாளையம்',
    'mav': 'மதுரை-ஆவணியாபுரம்',
    'மஆவ': 'மதுரை-ஆவணியாபுரம்',
    'mme': 'மதுரை-மேலூர்',
    'மமே': 'மதுரை-மேலூர்',
    'mpa': 'மதுரை-பழனிச்சாமிபுரம்',
    'மப': 'மதுரை-பழனிச்சாமிபுரம்',
    'mth': 'மதுரை-திருபரங்குன்றம்',
    'மதி': 'மதுரை-திருபரங்குன்றம்',
    
    // Coimbatore area townships
    'cpo': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    'கோபொ': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    'cme': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    'கோமே': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    
    // Add your frequently used towns here
    // Example for specific village names:
    // 'vgl': 'வெள்ளக்கோவில்',
    // 'வெ': 'வெள்ளக்கோவில்',
    // 'krp': 'கருப்பூர்',
    // 'கரு': 'கருப்பூர்',
    // 'slr': 'சுலூர்',
    // 'சு': 'சுலூர்',
};

// Load custom shortcuts from localStorage and merge with defaults
const getCustomShortcuts = () => {
    try {
        const saved = localStorage.getItem('customTownShortcuts');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading custom shortcuts:', e);
    }
    return {};
};

// Get all shortcuts (default + custom)
const getAllShortcutsMap = () => {
    const custom = getCustomShortcuts();
    // Custom shortcuts override default shortcuts
    return { ...townShortcuts, ...custom };
};

// Function to get town name from shortcut
export const getTownFromShortcut = (shortcut) => {
    if (!shortcut) return null;
    const allShortcuts = getAllShortcutsMap();
    const lowerShortcut = shortcut.toLowerCase().trim();
    
    // Check case-insensitive (for English shortcuts)
    if (allShortcuts[lowerShortcut]) {
        return allShortcuts[lowerShortcut];
    }
    
    // Check case-sensitive (for Tamil shortcuts)
    if (allShortcuts[shortcut.trim()]) {
        return allShortcuts[shortcut.trim()];
    }
    
    return null;
};

// Function to get all shortcuts
export const getAllShortcuts = () => {
    const allShortcuts = getAllShortcutsMap();
    return Object.entries(allShortcuts).map(([shortcut, town]) => ({
        shortcut,
        town
    }));
};

// Function to check if a string is a shortcut
export const isShortcut = (text) => {
    if (!text) return false;
    const allShortcuts = getAllShortcutsMap();
    const lower = text.toLowerCase().trim();
    return allShortcuts.hasOwnProperty(lower) || allShortcuts.hasOwnProperty(text.trim());
};

// Function to expand shortcut in real-time as user types
export const expandShortcut = (input) => {
    if (!input) return input;
    
    const allShortcuts = getAllShortcutsMap();
    const trimmedInput = input.trim();
    const lowerInput = trimmedInput.toLowerCase();
    
    // Check if exact match with shortcut (case-insensitive for English)
    if (allShortcuts[lowerInput]) {
        return allShortcuts[lowerInput];
    }
    
    // Check Tamil shortcuts (case-sensitive)
    if (allShortcuts[trimmedInput]) {
        return allShortcuts[trimmedInput];
    }
    
    // Check if input ends with space and matches a shortcut (auto-expand)
    if (input.endsWith(' ')) {
        const words = input.trim().split(' ');
        const lastWord = words[words.length - 1].toLowerCase();
        if (allShortcuts[lastWord]) {
            words[words.length - 1] = allShortcuts[lastWord];
            return words.join(' ');
        }
    }
    
    return input;
};

// Simple expansion for Space key press (no real-time)
export const expandShortcutOnSpace = (input) => {
    if (!input) return input;
    
    const allShortcuts = getAllShortcutsMap();
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    
    // Check English shortcuts (case-insensitive)
    if (allShortcuts[lower]) {
        return allShortcuts[lower];
    }
    
    // Check Tamil shortcuts (case-sensitive)
    if (allShortcuts[trimmed]) {
        return allShortcuts[trimmed];
    }
    
    return input;
};

// Get suggestion for partial shortcut match
export const getShortcutSuggestion = (input) => {
    if (!input || input.length < 2) return null;
    
    const allShortcuts = getAllShortcutsMap();
    const trimmedInput = input.trim();
    const lowerInput = trimmedInput.toLowerCase();
    
    // Find shortcuts that start with the input
    // Check both case-insensitive (English) and case-sensitive (Tamil)
    const matches = Object.entries(allShortcuts).filter(([shortcut]) => {
        const lowerShortcut = shortcut.toLowerCase();
        // Match either exact case or lowercase
        return shortcut.startsWith(trimmedInput) || lowerShortcut.startsWith(lowerInput);
    });
    
    if (matches.length === 1) {
        return {
            shortcut: matches[0][0],
            town: matches[0][1]
        };
    }
    
    // If multiple matches, prioritize exact match
    if (matches.length > 1) {
        const exactMatch = matches.find(([shortcut]) => 
            shortcut.startsWith(trimmedInput)
        );
        if (exactMatch) {
            return {
                shortcut: exactMatch[0],
                town: exactMatch[1]
            };
        }
    }
    
    return null;
};

// Auto-correction mapping for common typing mistakes
const townAutoCorrections = {
    // Fix spacing issues around hyphens
    'மதுரை - ஆரப்பாளையம்': 'மதுரை-ஆரப்பாளையம்',
    'மதுரை -ஆரப்பாளையம்': 'மதுரை-ஆரப்பாளையம்',
    'மதுரை- ஆரப்பாளையம்': 'மதுரை-ஆரப்பாளையம்',
    
    // Fix missing hyphens
    'மதுரை ஆரப்பாளையம்': 'மதுரை-ஆரப்பாளையம்',
    'மதுரைஆரப்பாளையம்': 'மதுரை-ஆரப்பாளையம்',
    
    // Fix common spelling mistakes
    'மதுரை-அரப்ளையம்': 'மதுரை-ஆரப்பாளையம்',
    'மதுரை-ஆரபாளையம்': 'மதுரை-ஆரப்பாளையம்',
    'மதுரை-அரப்பாளையம்': 'மதுரை-ஆரப்பாளையம்',
    
    // Other common madurai townships
    'மதுரை - ஆவணியாபுரம்': 'மதுரை-ஆவணியாபுரம்',
    'மதுரை ஆவணியாபுரம்': 'மதுரை-ஆவணியாபுரம்',
    'மதுரைஆவணியாபுரம்': 'மதுரை-ஆவணியாபுரம்',
    
    'மதுரை - மேலூர்': 'மதுரை-மேலூர்',
    'மதுரை மேலூர்': 'மதுரை-மேலூர்',
    'மதுரைமேலூர்': 'மதுரை-மேலூர்',
    
    // Coimbatore townships
    'கோயம்புத்தூர் - பொள்ளாச்சி': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    'கோயம்புத்தூர் பொள்ளாச்சி': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    'கோயம்புத்தூர்பொள்ளாச்சி': 'கோயம்புத்தூர்-பொள்ளாச்சி',
    
    'கோயம்புத்தூர் - மேட்டுப்பாளையம்': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    'கோயம்புத்தூர் மேட்டுப்பாளையம்': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    'கோயம்புத்தூர்மேட்டுப்பாளையம்': 'கோயம்புத்தூர்-மேட்டுப்பாளையம்',
    
    // Add your custom corrections here
    // 'common_mistake': 'correct_spelling',
};

// Auto-correct town names for common mistakes
export const autoCorrectTownName = (input) => {
    if (!input) return input;
    
    const trimmed = input.trim();
    
    // Check for exact match in corrections
    if (townAutoCorrections[trimmed]) {
        return townAutoCorrections[trimmed];
    }
    
    // Auto-fix spacing around hyphens (general rule)
    // "மதுரை - ஆரப்பாளையம்" → "மதுரை-ஆரப்பாளையம்"
    let corrected = trimmed.replace(/\s*-\s*/g, '-');
    
    // Auto-add hyphen if pattern matches "City Subarea" without hyphen
    // Pattern: Tamil word + space + Tamil word (likely township)
    // Only if no hyphen exists
    if (!corrected.includes('-')) {
        // Check if it matches common city names at start
        const commonCities = ['மதுரை', 'கோயம்புத்தூர்', 'சென்னை', 'திருச்சி', 'சேலம்'];
        for (const city of commonCities) {
            if (corrected.startsWith(city + ' ')) {
                // Has city name followed by space - likely needs hyphen
                corrected = corrected.replace(city + ' ', city + '-');
                break;
            }
        }
    }
    
    return corrected;
};

// Combined function: Auto-correct then expand shortcuts
export const processTownInput = (input) => {
    if (!input) return input;
    
    // Step 1: Auto-correct common mistakes
    let processed = autoCorrectTownName(input);
    
    // Step 2: Try to expand shortcuts
    processed = expandShortcut(processed);
    
    return processed;
};

export default {
    townShortcuts,
    getTownFromShortcut,
    getAllShortcuts,
    isShortcut,
    expandShortcut,
    getShortcutSuggestion,
    autoCorrectTownName,
    processTownInput,
    expandShortcutOnSpace
};
