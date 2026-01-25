/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple localStorage-based persistence for MoiBook data with validation and error recovery
const STORAGE_KEYS = {
  EVENTS: 'moibook_events',
  REGISTRARS: 'moibook_registrars', 
  MEMBERS: 'moibook_members',
  SETTINGS: 'moibook_settings',
  MOI_ENTRIES: 'moibook_moi_entries',
  BACKUP_TIMESTAMP: 'moibook_last_backup',
  VERSION: 'moibook_version'
};

const CURRENT_VERSION = '1.0.0';

// Data validation schemas
const validateEvent = (event) => {
  return event && 
         typeof event.id === 'string' && 
         typeof event.eventName === 'string' &&
         event.id.length > 0 &&
         event.eventName.length > 0;
};

const validateRegistrar = (registrar) => {
  return registrar && 
         typeof registrar.id === 'string' && 
         typeof registrar.name === 'string' &&
         registrar.id.length > 0 &&
         registrar.name.length > 0;
};

const validateMember = (member) => {
  return member &&
         typeof member.memberCode === 'string' &&
         member.memberCode.length > 0;
};

const validateMoiEntry = (entry) => {
  return entry && 
         typeof entry.id === 'string' && 
         entry.id.length > 0 &&
         (typeof entry.amount === 'number' || typeof entry.amount === 'string');
};

// Helper to safely parse JSON from localStorage with validation
const parseJson = (value, defaultValue = null, validator = null) => {
  try {
    if (!value) return defaultValue;
    const parsed = JSON.parse(value);
    
    // If validator provided, validate the data
    if (validator && Array.isArray(parsed)) {
      const validItems = parsed.filter(validator);
      if (validItems.length !== parsed.length) {
        console.warn(`Data validation: ${parsed.length - validItems.length} invalid items filtered out`);
      }
      return validItems;
    }
    
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error);
    console.warn('Returning default value due to parse error');
    return defaultValue;
  }
};

// Helper to safely stringify and store in localStorage with backup
const storeJson = (key, value, createBackup = true) => {
  try {
    // Create backup of existing data before overwriting
    if (createBackup && localStorage.getItem(key)) {
      const backupKey = `${key}_backup_${Date.now()}`;
      const existingData = localStorage.getItem(key);
      localStorage.setItem(backupKey, existingData);
      
      // Keep only last 3 backups per key
      cleanupOldBackups(key);
    }
    
    localStorage.setItem(key, JSON.stringify(value));
    
    // Update last backup timestamp
    localStorage.setItem(STORAGE_KEYS.BACKUP_TIMESTAMP, new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('localStorage store error:', error);
    
    // If quota exceeded, try to free up space
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, attempting cleanup');
      cleanupOldBackups();
      
      // Try again after cleanup
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryError) {
        console.error('Failed to store even after cleanup:', retryError);
      }
    }
    
    return false;
  }
};

// Cleanup old backup files to prevent localStorage bloat
const cleanupOldBackups = (specificKey = null) => {
  try {
    const keys = Object.keys(localStorage);
    const backupKeys = keys.filter(key => key.includes('_backup_'));
    
    if (specificKey) {
      // Clean backups for specific key only
      const specificBackups = backupKeys
        .filter(key => key.startsWith(`${specificKey}_backup_`))
        .sort()
        .slice(0, -3); // Keep last 3, remove older ones
      
      specificBackups.forEach(key => localStorage.removeItem(key));
    } else {
      // Clean all old backups (keep last 10 total)
      const sortedBackups = backupKeys.sort().slice(0, -10);
      sortedBackups.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('Backup cleanup error:', error);
  }
};

// Events
export const loadEvents = () => {
  return parseJson(
    localStorage.getItem(STORAGE_KEYS.EVENTS), 
    [], 
    validateEvent
  );
};

export const saveEvents = (events) => {
  // Validate all events before saving
  const validEvents = events.filter(validateEvent);
  if (validEvents.length !== events.length) {
    console.warn(`${events.length - validEvents.length} invalid events filtered out during save`);
  }
  return storeJson(STORAGE_KEYS.EVENTS, validEvents);
};

// Registrars
export const loadRegistrars = () => {
  return parseJson(
    localStorage.getItem(STORAGE_KEYS.REGISTRARS), 
    [], 
    validateRegistrar
  );
};

export const saveRegistrars = (registrars) => {
  // Validate all registrars before saving
  const validRegistrars = registrars.filter(validateRegistrar);
  if (validRegistrars.length !== registrars.length) {
    console.warn(`${registrars.length - validRegistrars.length} invalid registrars filtered out during save`);
  }
  return storeJson(STORAGE_KEYS.REGISTRARS, validRegistrars);
};

// Members
export const loadMembers = () => {
  return parseJson(
    localStorage.getItem(STORAGE_KEYS.MEMBERS),
    [],
    validateMember
  );
};

export const saveMembers = (members) => {
  const validMembers = members.filter(validateMember);
  if (validMembers.length !== members.length) {
    console.warn(`${members.length - validMembers.length} invalid members filtered out during save`);
  }
  return storeJson(STORAGE_KEYS.MEMBERS, validMembers);
};

// Settings
export const loadSettings = () => {
  return parseJson(localStorage.getItem(STORAGE_KEYS.SETTINGS), {});
};

export const saveSettings = (settings) => {
  // Basic settings validation
  if (typeof settings !== 'object' || settings === null) {
    console.error('Invalid settings object');
    return false;
  }
  return storeJson(STORAGE_KEYS.SETTINGS, settings);
};

// Moi Entries
export const loadMoiEntries = () => {
  return parseJson(
    localStorage.getItem(STORAGE_KEYS.MOI_ENTRIES), 
    [], 
    validateMoiEntry
  );
};

export const saveMoiEntries = (moiEntries) => {
  // Validate all moi entries before saving
  const validEntries = moiEntries.filter(validateMoiEntry);
  if (validEntries.length !== moiEntries.length) {
    console.warn(`${moiEntries.length - validEntries.length} invalid moi entries filtered out during save`);
  }
  return storeJson(STORAGE_KEYS.MOI_ENTRIES, validEntries);
};

// Export all data as SQLite-compatible JSON with metadata
export const exportAllData = () => {
  const data = {
    events: loadEvents(),
    registrars: loadRegistrars(),
    members: loadMembers(),
    settings: loadSettings(),
    moiEntries: loadMoiEntries(),
    exportDate: new Date().toISOString(),
    version: CURRENT_VERSION,
    lastBackup: localStorage.getItem(STORAGE_KEYS.BACKUP_TIMESTAMP),
    dataIntegrity: {
      eventsCount: loadEvents().length,
      registrarsCount: loadRegistrars().length,
      membersCount: loadMembers().length,
      moiEntriesCount: loadMoiEntries().length,
      settingsKeys: Object.keys(loadSettings()).length
    }
  };
  
  console.log('Data export completed:', data.dataIntegrity);
  return data;
};

// Import data from JSON backup with comprehensive validation
export const importAllData = (data) => {
  try {
    // Version compatibility check
    if (data.version && data.version !== CURRENT_VERSION) {
      console.warn(`Version mismatch: importing ${data.version}, current ${CURRENT_VERSION}`);
    }
    
    // Comprehensive data validation
    const validation = {
      events: Array.isArray(data.events) && data.events.every(validateEvent),
      registrars: Array.isArray(data.registrars) && data.registrars.every(validateRegistrar),
      members: Array.isArray(data.members) && data.members.every(validateMember),
      settings: typeof data.settings === 'object' && data.settings !== null,
      moiEntries: Array.isArray(data.moiEntries) && data.moiEntries.every(validateMoiEntry)
    };
    
    const failedValidations = Object.entries(validation).filter(([key, valid]) => !valid);
    
    if (failedValidations.length > 0) {
      throw new Error(`Data validation failed for: ${failedValidations.map(([key]) => key).join(', ')}`);
    }
    
    // Create complete backup before import
    const backupData = exportAllData();
    const backupSuccess = storeJson('moibook_pre_import_backup', backupData, false);
    
    if (!backupSuccess) {
      console.warn('Could not create pre-import backup');
    }
    
    // Import data with transaction-like behavior
    const importResults = {
      events: data.events ? saveEvents(data.events) : true,
      registrars: data.registrars ? saveRegistrars(data.registrars) : true,
      members: data.members ? saveMembers(data.members) : true,
      settings: data.settings ? saveSettings(data.settings) : true,
      moiEntries: data.moiEntries ? saveMoiEntries(data.moiEntries) : true
    };
    
    // Check if all imports succeeded
    const failedImports = Object.entries(importResults).filter(([key, success]) => !success);
    
    if (failedImports.length > 0) {
      // Rollback on failure
      console.error('Import failed, attempting rollback');
      if (backupSuccess) {
        restoreFromBackup('moibook_pre_import_backup');
      }
      throw new Error(`Import failed for: ${failedImports.map(([key]) => key).join(', ')}`);
    }
    
    // Update version info
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    
    console.log('Data import completed successfully');
    return true;
    
  } catch (error) {
    console.error('Import data error:', error);
    return false;
  }
};

// Restore from a specific backup
export const restoreFromBackup = (backupKey) => {
  try {
    const backupData = parseJson(localStorage.getItem(backupKey));
    if (backupData) {
      return importAllData(backupData);
    }
    return false;
  } catch (error) {
    console.error('Restore from backup error:', error);
    return false;
  }
};

// Get available backups
export const getAvailableBackups = () => {
  try {
    const keys = Object.keys(localStorage);
    const backupKeys = keys.filter(key => key.includes('backup'));
    
    return backupKeys.map(key => {
      const timestamp = key.split('_').pop();
      return {
        key,
        timestamp: isNaN(timestamp) ? 'Unknown' : new Date(parseInt(timestamp)).toISOString(),
        size: localStorage.getItem(key)?.length || 0
      };
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error('Get backups error:', error);
    return [];
  }
};

// Clear all data with confirmation
export const clearAllData = (confirmationText = null) => {
  if (confirmationText !== 'CLEAR_ALL_DATA') {
    console.error('Data clearing requires confirmation text');
    return false;
  }
  
  try {
    // Create final backup before clearing
    const finalBackup = exportAllData();
    storeJson('moibook_final_backup_before_clear', finalBackup, false);
    
    // Clear all MoiBook data
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('All data cleared successfully');
    return true;
  } catch (error) {
    console.error('Clear data error:', error);
    return false;
  }
};

// Check if localStorage has any data
export const hasStoredData = () => {
  return Object.values(STORAGE_KEYS).some(key => 
    localStorage.getItem(key) !== null
  );
};

// Get storage statistics
export const getStorageStats = () => {
  try {
    const stats = {
      totalKeys: Object.keys(localStorage).length,
      moibookKeys: Object.values(STORAGE_KEYS).filter(key => localStorage.getItem(key) !== null).length,
      backupKeys: Object.keys(localStorage).filter(key => key.includes('backup')).length,
      estimatedSize: JSON.stringify(localStorage).length,
      lastBackup: localStorage.getItem(STORAGE_KEYS.BACKUP_TIMESTAMP),
      version: localStorage.getItem(STORAGE_KEYS.VERSION) || 'Unknown'
    };
    
    return stats;
  } catch (error) {
    console.error('Get storage stats error:', error);
    return null;
  }
};

// Data integrity check
export const performIntegrityCheck = () => {
  try {
    const events = loadEvents();
    const registrars = loadRegistrars();
    const members = loadMembers();
    const settings = loadSettings();
    const moiEntries = loadMoiEntries();
    
    const integrity = {
      eventsValid: events.every(validateEvent),
      registrarsValid: registrars.every(validateRegistrar),
      membersValid: members.every(validateMember),
      settingsValid: typeof settings === 'object' && settings !== null,
      moiEntriesValid: moiEntries.every(validateMoiEntry),
      crossReferences: {
        // Check if moi entries reference valid events
        validEventReferences: moiEntries.every(entry => 
          !entry.eventId || events.some(event => event.id === entry.eventId)
        )
      }
    };
    
    integrity.overall = Object.values(integrity).every(check => 
      typeof check === 'boolean' ? check : Object.values(check).every(Boolean)
    );
    
    return integrity;
  } catch (error) {
    console.error('Integrity check error:', error);
    return { overall: false, error: error.message };
  }
};

// Get all data for export/SQLite conversion
export const getAllData = () => {
  try {
    return {
      events: loadEvents(),
      registrars: loadRegistrars(),
      members: loadMembers(),
      moiEntries: loadMoiEntries(),
      settings: loadSettings(),
      version: CURRENT_VERSION,
      exportTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading all data:', error);
    return {
      events: [],
      registrars: [],
      moiEntries: [],
      settings: {},
      version: CURRENT_VERSION,
      exportTimestamp: new Date().toISOString(),
      error: error.message
    };
  }
};