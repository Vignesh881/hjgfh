/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Amount Shortcuts Configuration
 * Common moi amounts for super-fast number entry
 */

// தொகை Shortcuts (Amount Shortcuts)
// Optimized for most commonly used amounts in Tamil weddings/events
export const amountShortcuts = {
    // === HUNDREDS - Direct single digit shortcuts ===
    '2': '200',      // ₹200
    '3': '300',      // ₹300
    '6': '600',      // ₹600
    '7': '700',      // ₹700
    '8': '800',      // ₹800
    
    // === THOUSANDS - 'k' suffix ===
    '5': '500',      // ₹500 (most common)
    '1k': '1000',    // ₹1,000
    '2k': '2000',    // ₹2,000
    '3k': '3000',    // ₹3,000
    '4k': '4000',    // ₹4,000
    '5k': '5000',    // ₹5,000
    '10k': '10000',  // ₹10,000
    '15k': '15000',
    '20k': '20000',
    '25k': '25000',
    '50k': '50000',
    
    // === LAKHS - 'l' suffix ===
    '1l': '100000',  // ₹1,00,000
    '2l': '200000',  // ₹2,00,000
    '3l': '300000',  // ₹3,00,000
    '5l': '500000',  // ₹5,00,000
    
    // === AUSPICIOUS AMOUNTS (x01 pattern) ===
    '51': '51',
    '101': '101',
    '116': '116',    // Very auspicious
    '251': '251',
    '501': '501',
    '1001': '1001',
    '2001': '2001',
    '3001': '3001',
    '5001': '5001',
    '10001': '10001',
    
    // === TAMIL SHORTCUTS - ஆயிரம் (Thousands) ===
    '1ஆ': '1000',
    '2ஆ': '2000',
    '3ஆ': '3000',
    '5ஆ': '5000',
    '10ஆ': '10000',
    
    // === TAMIL SHORTCUTS - லட்சம் (Lakhs) ===
    '1ல': '100000',
    '2ல': '200000',
    '3ல': '300000',
    '5ல': '500000',
    
    // === QUICK ACCESS ALTERNATIVES ===
    '1.1k': '1100',
    '2.5k': '2500',
    '5.5k': '5500',
};

// Function to expand amount shortcut
export const expandAmountShortcut = (input) => {
    if (!input) return input;
    
    const trimmed = input.trim().toLowerCase();
    
    // Check if it's a shortcut
    if (amountShortcuts[trimmed]) {
        return amountShortcuts[trimmed];
    }
    
    return input;
};

// Function to format amount with commas (Indian system)
export const formatAmount = (amount) => {
    if (!amount) return '';
    
    const num = parseInt(amount);
    if (isNaN(num)) return amount;
    
    // Indian numbering system: 1,00,000
    return num.toLocaleString('en-IN');
};

// Function to get amount suggestion
export const getAmountSuggestion = (input) => {
    if (!input || input.length < 1) return '';
    
    const trimmed = input.trim().toLowerCase();
    
    // Check if it's a shortcut
    if (amountShortcuts[trimmed]) {
        const expanded = amountShortcuts[trimmed];
        const formatted = formatAmount(expanded);
        return `${trimmed} → ₹${formatted}`;
    }
    
    return '';
};

// Get all amount shortcuts
export const getAllAmountShortcuts = () => {
    return Object.entries(amountShortcuts).map(([shortcut, amount]) => ({
        shortcut,
        amount,
        formatted: formatAmount(amount)
    }));
};

// Auto-format as user types (with commas)
export const autoFormatAmount = (input) => {
    if (!input) return input;
    
    // Remove existing commas
    const cleaned = input.replace(/,/g, '');
    
    // Check if it's a number
    const num = parseInt(cleaned);
    if (isNaN(num)) return input;
    
    // Format with commas
    return formatAmount(num);
};
