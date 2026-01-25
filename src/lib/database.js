/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import initSqlJs from 'sql.js';

const DB_NAME = 'moibook.db';
let db = null;
let SQL = null;

// Helper to convert SQL result to array of objects
const resultToObjects = (res) => {
    if (!res || res.length === 0) return [];
    const [firstResult] = res;
    if (!firstResult) return [];
    return firstResult.values.map(row => {
        const obj = {};
        firstResult.columns.forEach((col, i) => {
            let value = row[i];
            // Try to parse JSON strings
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Not a valid JSON, keep as string
                }
            }
            // Convert 1/0 back to boolean for permission fields
            if (col === 'permission' || col === 'isMaternalUncle') {
                value = !!value;
            }
            obj[col] = value;
        });
        return obj;
    });
};


// Function to save the database to IndexedDB
const saveDatabase = async () => {
    if (!db) return;
    return new Promise((resolve, reject) => {
        const data = db.export();
        const request = indexedDB.open('sqljs-db', 1);

        request.onupgradeneeded = e => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains('files')) {
                idb.createObjectStore('files');
            }
        };

        request.onsuccess = e => {
            const idb = e.target.result;
            const tx = idb.transaction(['files'], 'readwrite');
            const store = tx.objectStore('files');
            store.put(data, DB_NAME);
            tx.oncomplete = () => {
                idb.close();
                resolve();
            };
            tx.onerror = err => {
                idb.close();
                reject(err.target.error);
            };
        };
        request.onerror = err => reject(err.target.error);
    });
};

// Main initialization function
export const initDB = async () => {
    if (db) return db;
    
    SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
    });

    return new Promise((resolve, reject) => {
        const request = indexedDB.open('sqljs-db', 1);
        
        request.onupgradeneeded = e => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains('files')) {
                idb.createObjectStore('files');
            }
        };

        request.onsuccess = e => {
            const idb = e.target.result;
            const tx = idb.transaction(['files'], 'readonly');
            const store = tx.objectStore('files');
            const getRequest = store.get(DB_NAME);

            getRequest.onsuccess = event => {
                const dbFile = event.target.result;
                if (dbFile) {
                    console.log('Database loaded from IndexedDB.');
                    db = new SQL.Database(dbFile);
                } else {
                    console.log('No database found in IndexedDB, creating a new one.');
                    db = new SQL.Database();
                }
                resolve(db);
            };
             getRequest.onerror = err => {
                idb.close();
                reject(err.target.error);
            };
            tx.oncomplete = () => idb.close();
        };

        request.onerror = err => reject(err.target.error);
    });
};

// Function to create tables if they don't exist
export const createTables = async () => {
    if (!db) throw new Error("Database not initialized");
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            date TEXT,
            time TEXT,
            venue TEXT,
            place TEXT,
            eventName TEXT,
            eventSide TEXT,
            eventHead TEXT,
            eventHeadProf TEXT,
            eventOrganizer TEXT,
            eventOrganizerProf TEXT,
            phone TEXT,
            address TEXT,
            permission INTEGER,
            invitationCount TEXT,
            tableCount TEXT,
            approvalPins TEXT
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS registrars (
            id TEXT PRIMARY KEY,
            name TEXT,
            address TEXT,
            phone TEXT,
            designation TEXT,
            permission INTEGER
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS moi_entries (
            id TEXT PRIMARY KEY,
            table_name TEXT,
            town TEXT,
            townId TEXT,
            street TEXT,
            initial TEXT,
            baseName TEXT,
            name TEXT,
            relationshipName TEXT,
            relationshipType TEXT,
            relationship TEXT,
            education TEXT,
            profession TEXT,
            phone TEXT,
            note TEXT,
            memberId TEXT,
            amount REAL,
            isMaternalUncle INTEGER,
            denominations TEXT,
            type TEXT
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);
    await saveDatabase();
};

// --- CRUD for Events ---
export const getEvents = async () => {
    if (!db) await initDB();
    const res = db.exec("SELECT * FROM events ORDER BY date DESC, id DESC");
    return resultToObjects(res);
};

export const addOrUpdateEvent = async (event) => {
    if (!db) await initDB();
    db.run(`
        INSERT INTO events (id, date, time, venue, place, eventName, eventSide, eventHead, eventHeadProf, eventOrganizer, eventOrganizerProf, phone, address, permission, invitationCount, tableCount, approvalPins) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            date=excluded.date, time=excluded.time, venue=excluded.venue, place=excluded.place, eventName=excluded.eventName, eventSide=excluded.eventSide, eventHead=excluded.eventHead, eventHeadProf=excluded.eventHeadProf, eventOrganizer=excluded.eventOrganizer, eventOrganizerProf=excluded.eventOrganizerProf, phone=excluded.phone, address=excluded.address, permission=excluded.permission, invitationCount=excluded.invitationCount, tableCount=excluded.tableCount, approvalPins=excluded.approvalPins;
    `, [
        event.id, event.date, event.time, event.venue, event.place, event.eventName, event.eventSide, event.eventHead, event.eventHeadProf, event.eventOrganizer, event.eventOrganizerProf, event.phone, event.address, event.permission ? 1 : 0, event.invitationCount, event.tableCount, JSON.stringify(event.approvalPins)
    ]);
    await saveDatabase();
};

export const deleteEvent = async (id) => {
    if (!db) await initDB();
    db.run("DELETE FROM events WHERE id = ?", [id]);
    await saveDatabase();
};

export const toggleEventPermission = async (id, permission) => {
    if (!db) await initDB();
    db.run("UPDATE events SET permission = ? WHERE id = ?", [permission ? 1 : 0, id]);
    await saveDatabase();
};

// --- CRUD for Registrars ---
export const getRegistrars = async () => {
    if (!db) await initDB();
    const res = db.exec("SELECT * FROM registrars ORDER BY id DESC");
    return resultToObjects(res);
};

export const addOrUpdateRegistrar = async (registrar) => {
    if (!db) await initDB();
    db.run(`
        INSERT INTO registrars (id, name, address, phone, designation, permission) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, address=excluded.address, phone=excluded.phone, designation=excluded.designation, permission=excluded.permission;
    `, [
        registrar.id, registrar.name, registrar.address, registrar.phone, registrar.designation, registrar.permission ? 1 : 0
    ]);
    await saveDatabase();
};

export const deleteRegistrar = async (id) => {
    if (!db) await initDB();
    db.run("DELETE FROM registrars WHERE id = ?", [id]);
    await saveDatabase();
};

export const toggleRegistrarPermission = async (id, permission) => {
    if (!db) await initDB();
    db.run("UPDATE registrars SET permission = ? WHERE id = ?", [permission ? 1 : 0, id]);
    await saveDatabase();
};

// --- CRUD for Moi Entries ---
export const getMoiEntries = async () => {
    if (!db) await initDB();
    const res = db.exec("SELECT * FROM moi_entries ORDER BY CAST(id AS INTEGER) DESC");
    return resultToObjects(res).map(e => ({...e, table: e.table_name}) ); // handle table_name -> table
};

export const addOrUpdateMoiEntry = async (entry) => {
    if (!db) await initDB();
    db.run(`
        INSERT INTO moi_entries (id, table_name, town, townId, street, initial, baseName, name, relationshipName, relationshipType, relationship, education, profession, phone, note, memberId, amount, isMaternalUncle, denominations, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            table_name=excluded.table_name, town=excluded.town, townId=excluded.townId, street=excluded.street, initial=excluded.initial, baseName=excluded.baseName, name=excluded.name, relationshipName=excluded.relationshipName, relationshipType=excluded.relationshipType, relationship=excluded.relationship, education=excluded.education, profession=excluded.profession, phone=excluded.phone, note=excluded.note, memberId=excluded.memberId, amount=excluded.amount, isMaternalUncle=excluded.isMaternalUncle, denominations=excluded.denominations, type=excluded.type;
    `, [
        entry.id, entry.table, entry.town, entry.townId, entry.street, entry.initial, entry.baseName, entry.name, entry.relationshipName, entry.relationshipType, entry.relationship, entry.education, entry.profession, entry.phone, entry.note, entry.memberId, entry.amount, entry.isMaternalUncle ? 1 : 0, JSON.stringify(entry.denominations || {}), entry.type
    ]);
    await saveDatabase();
};

export const addOrUpdateMoiEntries = async (entries) => {
    if (!db) await initDB();
    const stmt = db.prepare(`
        INSERT INTO moi_entries (id, table_name, town, townId, street, initial, baseName, name, relationshipName, relationshipType, relationship, education, profession, phone, note, memberId, amount, isMaternalUncle, denominations, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            table_name=excluded.table_name, town=excluded.town, townId=excluded.townId, street=excluded.street, initial=excluded.initial, baseName=excluded.baseName, name=excluded.name, relationshipName=excluded.relationshipName, relationshipType=excluded.relationshipType, relationship=excluded.relationship, education=excluded.education, profession=excluded.profession, phone=excluded.phone, note=excluded.note, memberId=excluded.memberId, amount=excluded.amount, isMaternalUncle=excluded.isMaternalUncle, denominations=excluded.denominations, type=excluded.type;
    `);
    
    entries.forEach(entry => {
        stmt.run([
            entry.id, entry.table, entry.town, entry.townId, entry.street, entry.initial, entry.baseName, entry.name, entry.relationshipName, entry.relationshipType, entry.relationship, entry.education, entry.profession, entry.phone, entry.note, entry.memberId, entry.amount, entry.isMaternalUncle ? 1 : 0, JSON.stringify(entry.denominations || {}), entry.type
        ]);
    });
    
    stmt.free();
    await saveDatabase();
};


export const deleteMoiEntry = async (id) => {
    if (!db) await initDB();
    db.run("DELETE FROM moi_entries WHERE id = ?", [id]);
    await saveDatabase();
};

// --- CRUD for Settings ---
export const getSettings = async () => {
    if (!db) await initDB();
    const res = db.exec("SELECT * FROM settings");
    const settingsObj = resultToObjects(res).reduce((acc, { key, value }) => {
        try {
            acc[key] = JSON.parse(value);
        } catch (e) {
            acc[key] = value;
        }
        return acc;
    }, {});
    return settingsObj;
};

export const updateSettings = async (settings) => {
    if (!db) await initDB();
    const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    for (const [key, value] of Object.entries(settings)) {
        stmt.run([key, JSON.stringify(value)]);
    }
    stmt.free();
    await saveDatabase();
};
export const downloadMoibookDB = () => {
  if (!db) return;

  const binaryArray = db.export();
  const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'moibook.db';
  a.click();

  URL.revokeObjectURL(url);
};

export const exportDatabase = () => {
  if (!db) throw new Error("Database not initialized");
  return db.export();
};