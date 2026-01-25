/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SQLite3 Database Exporter for MoiBook (Simplified Version)
 * Converts localStorage data to SQLite-compatible SQL script
 */

import { getAllData } from './localStorage.js';

// Generate SQL CREATE TABLE statements
const generateCreateTables = () => {
    return `
-- MoiBook Database Schema
-- Generated on ${new Date().toISOString()}

PRAGMA foreign_keys = ON;

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    eventName TEXT NOT NULL,
    eventDate TEXT NOT NULL,
    eventLocation TEXT,
    hostName TEXT,
    eventType TEXT DEFAULT 'wedding',
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Registrars table  
CREATE TABLE IF NOT EXISTS registrars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    permission BOOLEAN DEFAULT 0,
    designation TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Moi Entries table
CREATE TABLE IF NOT EXISTS moi_entries (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    registrarId TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    relationship TEXT,
    address TEXT,
    phone TEXT,
    notes TEXT,
    timestamp TEXT NOT NULL,
    type TEXT,
    isMaternalUncle BOOLEAN DEFAULT 0,
    FOREIGN KEY (eventId) REFERENCES events(id),
    FOREIGN KEY (registrarId) REFERENCES registrars(id)
);

-- Towns table (for address autocomplete)
CREATE TABLE IF NOT EXISTS towns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    district TEXT,
    state TEXT DEFAULT 'Tamil Nadu'
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moi_event ON moi_entries(eventId);
CREATE INDEX IF NOT EXISTS idx_moi_registrar ON moi_entries(registrarId);
CREATE INDEX IF NOT EXISTS idx_moi_timestamp ON moi_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(eventDate);

`;
};

// Escape SQL string values
const escapeSqlString = (value) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? '1' : '0';
    // Escape single quotes and wrap in quotes
    return "'" + String(value).replace(/'/g, "''") + "'";
};

// Generate INSERT statements for events
const generateEventInserts = (events) => {
    if (!events || events.length === 0) return '\n-- No events to insert\n';
    
    let sql = '\n-- Insert Events\n';
    events.forEach(event => {
        sql += `INSERT OR REPLACE INTO events (id, eventName, eventDate, eventLocation, hostName, eventType, description, created_at, updated_at) VALUES (`;
        sql += `${escapeSqlString(event.id)}, `;
        sql += `${escapeSqlString(event.eventName || event.name || '')}, `;
        sql += `${escapeSqlString(event.eventDate || event.date || '')}, `;
        sql += `${escapeSqlString(event.eventLocation || event.location || '')}, `;
        sql += `${escapeSqlString(event.hostName || event.host || '')}, `;
        sql += `${escapeSqlString(event.eventType || event.type || 'wedding')}, `;
        sql += `${escapeSqlString(event.description || '')}, `;
        sql += `${escapeSqlString(event.created_at || new Date().toISOString())}, `;
        sql += `${escapeSqlString(event.updated_at || new Date().toISOString())}`;
        sql += ');\n';
    });
    return sql;
};

// Generate INSERT statements for registrars
const generateRegistrarInserts = (registrars) => {
    if (!registrars || registrars.length === 0) return '\n-- No registrars to insert\n';
    
    let sql = '\n-- Insert Registrars\n';
    registrars.forEach(registrar => {
        sql += `INSERT OR REPLACE INTO registrars (id, name, username, password, permission, designation, created_at, updated_at) VALUES (`;
        sql += `${escapeSqlString(registrar.id)}, `;
        sql += `${escapeSqlString(registrar.name || '')}, `;
        sql += `${escapeSqlString(registrar.username || '')}, `;
        sql += `${escapeSqlString(registrar.password || '')}, `;
        sql += `${registrar.permission ? 1 : 0}, `;
        sql += `${escapeSqlString(registrar.designation || '')}, `;
        sql += `${escapeSqlString(registrar.created_at || new Date().toISOString())}, `;
        sql += `${escapeSqlString(registrar.updated_at || new Date().toISOString())}`;
        sql += ');\n';
    });
    return sql;
};

// Generate INSERT statements for moi entries
const generateMoiEntryInserts = (moiEntries) => {
    if (!moiEntries || moiEntries.length === 0) return '\n-- No moi entries to insert\n';
    
    let sql = '\n-- Insert Moi Entries\n';
    moiEntries.forEach(entry => {
        sql += `INSERT OR REPLACE INTO moi_entries (id, eventId, registrarId, name, amount, relationship, address, phone, notes, timestamp, type, isMaternalUncle) VALUES (`;
        sql += `${escapeSqlString(entry.id)}, `;
        sql += `${escapeSqlString(entry.eventId || '')}, `;
        sql += `${escapeSqlString(entry.registrarId || '')}, `;
        sql += `${escapeSqlString(entry.name || '')}, `;
        sql += `${parseFloat(entry.amount) || 0}, `;
        sql += `${escapeSqlString(entry.relationship || '')}, `;
        sql += `${escapeSqlString(entry.address || '')}, `;
        sql += `${escapeSqlString(entry.phone || '')}, `;
        sql += `${escapeSqlString(entry.notes || '')}, `;
        sql += `${escapeSqlString(entry.timestamp || new Date().toISOString())}, `;
        sql += `${escapeSqlString(entry.type || null)}, `;
        sql += `${entry.isMaternalUncle ? 1 : 0}`;
        sql += ');\n';
    });
    return sql;
};

// Generate INSERT statements for settings
const generateSettingsInserts = (settings) => {
    if (!settings || typeof settings !== 'object') return '\n-- No settings to insert\n';
    
    let sql = '\n-- Insert Settings\n';
    Object.entries(settings).forEach(([key, value]) => {
        sql += `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (`;
        sql += `${escapeSqlString(key)}, `;
        sql += `${escapeSqlString(JSON.stringify(value))}, `;
        sql += `${escapeSqlString(new Date().toISOString())}`;
        sql += ');\n';
    });
    return sql;
};

// Main export function - generates SQL script instead of binary DB
export const exportToSQLite = async () => {
    try {
        console.log('🔄 Starting SQLite SQL script export...');
        
        // Get all data from localStorage
        const data = getAllData();
        console.log('📊 Retrieved data:', {
            events: data.events?.length || 0,
            registrars: data.registrars?.length || 0,
            moiEntries: data.moiEntries?.length || 0,
            settings: Object.keys(data.settings || {}).length
        });
        
        // Generate complete SQL script
        let sqlScript = generateCreateTables();
        sqlScript += generateEventInserts(data.events);
        sqlScript += generateRegistrarInserts(data.registrars);
        sqlScript += generateMoiEntryInserts(data.moiEntries);
        sqlScript += generateSettingsInserts(data.settings);
        
        // Add summary comment
        sqlScript += `\n-- Export completed: ${new Date().toISOString()}\n`;
        sqlScript += `-- Total records: ${(data.events?.length || 0) + (data.registrars?.length || 0) + (data.moiEntries?.length || 0)} rows\n`;
        
        // Create and download SQL file
        const blob = new Blob([sqlScript], { type: 'text/sql; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `moibook_${new Date().toISOString().split('T')[0]}.sql`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('✅ SQLite SQL script export completed successfully!');
        return {
            success: true,
            message: 'SQL script exported successfully! Import this into SQLite3.',
            fileName: a.download,
            recordCount: (data.events?.length || 0) + (data.registrars?.length || 0) + (data.moiEntries?.length || 0)
        };
        
    } catch (error) {
        console.error('❌ SQLite export failed:', error);
        return {
            success: false,
            message: `Export failed: ${error.message}`,
            error
        };
    }
};

// Function to analyze SQL file content (text-based)
export const analyzeSQLiteFile = (file) => {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lines = content.split('\n');
                
                // Count different types of statements
                const createTableCount = lines.filter(line => 
                    line.trim().toUpperCase().startsWith('CREATE TABLE')).length;
                const insertCount = lines.filter(line => 
                    line.trim().toUpperCase().startsWith('INSERT')).length;
                const indexCount = lines.filter(line => 
                    line.trim().toUpperCase().startsWith('CREATE INDEX')).length;
                
                // Extract table names
                const tableMatches = content.match(/CREATE TABLE[^(]*\s+(\w+)/gi) || [];
                const tables = tableMatches.map(match => 
                    match.replace(/CREATE TABLE[^(]*\s+/i, '').trim());
                
                const analysis = {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: 'SQL Script',
                    tables: tables,
                    statements: {
                        createTable: createTableCount,
                        insert: insertCount,
                        createIndex: indexCount
                    },
                    lineCount: lines.length,
                    estimatedRecords: insertCount
                };

                resolve(analysis);
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        } catch (error) {
            reject(error);
        }
    });
};

// Console commands for development/debugging
window.moibookSQLite = {
    export: exportToSQLite,
    analyze: analyzeSQLiteFile,
    
    // Helper to view data in browser console
    viewData: () => {
        const data = getAllData();
        console.log('📊 Current localStorage data:');
        console.table(data.events);
        console.table(data.registrars);
        console.table(data.moiEntries);
        console.log('Settings:', data.settings);
        return data;
    },
    
    // Generate sample SQLite commands
    generateSampleQueries: () => {
        console.log(`
📝 Sample SQLite3 commands for exported SQL file:

-- Import the SQL file:
sqlite3 moibook.db < moibook_YYYY-MM-DD.sql

-- View all tables:
.tables

-- Check data:
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM moi_entries;
SELECT COUNT(*) FROM registrars;

-- Event-wise statistics:
SELECT 
    e.eventName,
    e.eventDate,
    COUNT(m.id) as total_entries,
    SUM(m.amount) as total_amount
FROM events e
LEFT JOIN moi_entries m ON e.id = m.eventId
GROUP BY e.id;

-- Top contributors:
SELECT name, amount, relationship 
FROM moi_entries 
ORDER BY amount DESC 
LIMIT 10;
        `);
    }
};

console.log('🔧 SQLite exporter loaded (SQL script version). Use window.moibookSQLite.export() to export database');