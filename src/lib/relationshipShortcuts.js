/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Relationship Shortcuts Configuration
 * Common relationships for lightning-fast entry
 */

// தொடர்பு Shortcuts (Relationship Shortcuts)
export const relationshipShortcuts = {
    // English shortcuts
    'f': 'தந்தை',
    'm': 'தாய்',
    'b': 'அண்ணன்',
    'yb': 'தம்பி',
    's': 'அக்கா',
    'ys': 'தங்கை',
    'u': 'மாமா',
    'a': 'அத்தை',
    'mil': 'மாமியார்',
    'fil': 'மாமனார்',
    'bro': 'மைத்துனர்',
    'son': 'மகன்',
    'dau': 'மகள்',
    'gf': 'தாத்தா',
    'gm': 'பாட்டி',
    'nep': 'மருமகன்',
    'nie': 'மருமகள்',
    
    // Tamil shortcuts
    'த': 'தந்தை',
    'தா': 'தாய்',
    'அ': 'அண்ணன்',
    'தம்': 'தம்பி',
    'அக்': 'அக்கா',
    'த': 'தங்கை',
    'மா': 'மாமா',
    'அத்': 'அத்தை',
    'மாமி': 'மாமியார்',
    'மாம': 'மாமனார்',
    'மை': 'மைத்துனர்',
    'ம': 'மகன்',
    'மக': 'மகள்',
    'தாத்': 'தாத்தா',
    'பா': 'பாட்டி',
    'ம': 'மருமகன்',
    'மரு': 'மருமகள்',
};

// Function to expand relationship shortcut
export const expandRelationshipShortcut = (input) => {
    if (!input) return input;
    
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    
    // Check English shortcuts
    if (relationshipShortcuts[lower]) {
        return relationshipShortcuts[lower];
    }
    
    // Check Tamil shortcuts
    if (relationshipShortcuts[trimmed]) {
        return relationshipShortcuts[trimmed];
    }
    
    return input;
};

// Function to get relationship suggestion
export const getRelationshipSuggestion = (input) => {
    if (!input || input.length < 1) return '';
    
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    
    // Check English shortcuts
    if (relationshipShortcuts[lower]) {
        return `${lower} → ${relationshipShortcuts[lower]}`;
    }
    
    // Check Tamil shortcuts
    if (relationshipShortcuts[trimmed]) {
        return `${trimmed} → ${relationshipShortcuts[trimmed]}`;
    }
    
    return '';
};

// Get all relationship shortcuts
export const getAllRelationshipShortcuts = () => {
    return Object.entries(relationshipShortcuts).map(([shortcut, relationship]) => ({
        shortcut,
        relationship
    }));
};
