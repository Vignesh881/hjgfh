/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Browser Console Database Commands for MoiBook2025
// Copy and paste these commands in browser console (F12 > Console)

console.log('🗄️ MoiBook Database Console Commands Available:');
console.log('=========================================');

// Global database inspection functions
window.MoiBookDB = {
  
  // View all events
  viewEvents: () => {
    const events = JSON.parse(localStorage.getItem('moibook_events') || '[]');
    console.table(events);
    return events;
  },
  
  // View all registrars  
  viewRegistrars: () => {
    const registrars = JSON.parse(localStorage.getItem('moibook_registrars') || '[]');
    console.table(registrars);
    return registrars;
  },
  
  // View all moi entries
  viewMoiEntries: () => {
    const entries = JSON.parse(localStorage.getItem('moibook_moi_entries') || '[]');
    console.table(entries);
    return entries;
  },
  
  // View settings
  viewSettings: () => {
    const settings = JSON.parse(localStorage.getItem('moibook_settings') || '{}');
    console.log('Settings:', settings);
    return settings;
  },
  
  // View all data
  viewAll: () => {
    const data = {
      events: JSON.parse(localStorage.getItem('moibook_events') || '[]'),
      registrars: JSON.parse(localStorage.getItem('moibook_registrars') || '[]'),
      moiEntries: JSON.parse(localStorage.getItem('moibook_moi_entries') || '[]'),
      settings: JSON.parse(localStorage.getItem('moibook_settings') || '{}')
    };
    console.log('Complete Database:', data);
    return data;
  },
  
  // Get storage info
  getStorageInfo: () => {
    const keys = Object.keys(localStorage);
    const moibookKeys = keys.filter(key => key.startsWith('moibook_'));
    const totalSize = JSON.stringify(localStorage).length;
    
    const info = {
      totalKeys: keys.length,
      moibookKeys: moibookKeys.length,
      estimatedSize: `${(totalSize / 1024).toFixed(2)} KB`,
      keys: moibookKeys
    };
    
    console.table(info);
    return info;
  },
  
  // Search in all data
  search: (term) => {
    const allData = window.MoiBookDB.viewAll();
    const results = {};
    
    Object.keys(allData).forEach(table => {
      if (Array.isArray(allData[table])) {
        results[table] = allData[table].filter(item => 
          JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
        );
      }
    });
    
    console.log(`Search results for "${term}":`, results);
    return results;
  },
  
  // Export database as downloadable JSON
  exportDB: () => {
    const data = window.MoiBookDB.viewAll();
    data.exportDate = new Date().toISOString();
    data.version = '1.0.0';
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moibook_console_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Database exported!');
    return data;
  },
  
  // Clear all data (with confirmation)
  clearAll: (confirmation) => {
    if (confirmation !== 'YES_DELETE_ALL') {
      console.error('⚠️ To clear all data, call: MoiBookDB.clearAll("YES_DELETE_ALL")');
      return false;
    }
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith('moibook_'));
    keys.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ All MoiBook data cleared!');
    return true;
  },
  
  // Show help
  help: () => {
    console.log(`
🗄️ MoiBook Database Console Commands:
=====================================

📋 View Data:
• MoiBookDB.viewEvents()     - Show all events
• MoiBookDB.viewRegistrars() - Show all registrars  
• MoiBookDB.viewMoiEntries() - Show all moi entries
• MoiBookDB.viewSettings()   - Show settings
• MoiBookDB.viewAll()        - Show complete database

🔍 Analysis:
• MoiBookDB.getStorageInfo() - Storage statistics
• MoiBookDB.search("term")   - Search in all data

💾 Export/Import:
• MoiBookDB.exportDB()       - Download database as JSON

🗑️ Cleanup:
• MoiBookDB.clearAll("YES_DELETE_ALL") - Clear all data

ℹ️ Help:
• MoiBookDB.help()           - Show this help

Example Usage:
--------------
MoiBookDB.viewEvents()                    // View all events
MoiBookDB.search("முருகன்")               // Search for "முருகன்"
MoiBookDB.getStorageInfo()                // Get storage info
MoiBookDB.exportDB()                      // Export database
    `);
  }
};

// Initialize help on load
window.MoiBookDB.help();