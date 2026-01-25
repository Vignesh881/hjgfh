/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Database Configuration Helper for Multi-System MoiBook
 */

// Database adapter interface
class DatabaseAdapter {
    async connect() { throw new Error('Not implemented'); }
    async disconnect() { throw new Error('Not implemented'); }
    
    // Events
    async getEvents() { throw new Error('Not implemented'); }
    async createEvent(event) { throw new Error('Not implemented'); }
    async updateEvent(id, event) { throw new Error('Not implemented'); }
    async deleteEvent(id) { throw new Error('Not implemented'); }
    
    // Registrars
    async getRegistrars() { throw new Error('Not implemented'); }
    async createRegistrar(registrar) { throw new Error('Not implemented'); }
    async updateRegistrar(id, registrar) { throw new Error('Not implemented'); }
    
    // Moi Entries
    async getMoiEntries(eventId = null) { throw new Error('Not implemented'); }
    async createMoiEntry(entry) { throw new Error('Not implemented'); }
    async updateMoiEntry(id, entry) { throw new Error('Not implemented'); }
    async deleteMoiEntry(id) { throw new Error('Not implemented'); }
    
    // Real-time subscriptions
    async subscribeToChanges(callback) { throw new Error('Not implemented'); }
    async unsubscribeFromChanges() { throw new Error('Not implemented'); }
}

// LocalStorage adapter (current implementation)
class LocalStorageAdapter extends DatabaseAdapter {
    constructor() {
        super();
        this.prefix = 'moibook_';
    }
    
    async connect() {
        // localStorage is always available
        return true;
    }
    
    async getEvents() {
        const events = localStorage.getItem(this.prefix + 'events');
        return events ? JSON.parse(events) : [];
    }
    
    async createEvent(event) {
        const events = await this.getEvents();
        events.push({ ...event, id: Date.now().toString() });
        localStorage.setItem(this.prefix + 'events', JSON.stringify(events));
        return event;
    }
    
    // ... other methods using localStorage
}

// Firebase adapter
class FirebaseAdapter extends DatabaseAdapter {
    constructor(config) {
        super();
        this.config = config;
        this.db = null;
        this.unsubscribeFunctions = [];
    }
    
    async connect() {
        try {
            const { initializeApp } = await import('firebase/app');
            const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
            
            const app = initializeApp(this.config);
            this.db = getFirestore(app);
            
            // Use emulator in development
            if (process.env.NODE_ENV === 'development') {
                connectFirestoreEmulator(this.db, 'localhost', 8080);
            }
            
            return true;
        } catch (error) {
            console.error('Firebase connection failed:', error);
            return false;
        }
    }
    
    async getEvents() {
        const { collection, getDocs } = await import('firebase/firestore');
        const querySnapshot = await getDocs(collection(this.db, 'events'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    async createEvent(event) {
        const { collection, addDoc } = await import('firebase/firestore');
        const docRef = await addDoc(collection(this.db, 'events'), {
            ...event,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return { id: docRef.id, ...event };
    }
    
    async subscribeToChanges(callback) {
        const { collection, onSnapshot } = await import('firebase/firestore');
        
        const unsubEvents = onSnapshot(collection(this.db, 'events'), (snapshot) => {
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback('events', events);
        });
        
        const unsubEntries = onSnapshot(collection(this.db, 'moi_entries'), (snapshot) => {
            const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback('moi_entries', entries);
        });
        
        this.unsubscribeFunctions = [unsubEvents, unsubEntries];
    }
    
    async unsubscribeFromChanges() {
        this.unsubscribeFunctions.forEach(unsub => unsub());
        this.unsubscribeFunctions = [];
    }
}

// Supabase adapter
class SupabaseAdapter extends DatabaseAdapter {
    constructor(config) {
        super();
        this.config = config;
        this.client = null;
    }
    
    async connect() {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            this.client = createClient(this.config.url, this.config.anonKey);
            return true;
        } catch (error) {
            console.error('Supabase connection failed:', error);
            return false;
        }
    }
    
    async getEvents() {
        const { data, error } = await this.client
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    }
    
    async createEvent(event) {
        const { data, error } = await this.client
            .from('events')
            .insert([event])
            .select();
            
        if (error) throw error;
        return data[0];
    }
    
    async subscribeToChanges(callback) {
        // Subscribe to events table changes
        this.client
            .channel('events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, 
                (payload) => callback('events', payload))
            .subscribe();
            
        // Subscribe to moi_entries table changes
        this.client
            .channel('moi_entries')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'moi_entries' }, 
                (payload) => callback('moi_entries', payload))
            .subscribe();
    }
}

// Database factory
class DatabaseFactory {
    static create(type, config) {
        switch (type) {
            case 'localStorage':
                return new LocalStorageAdapter();
            case 'firebase':
                return new FirebaseAdapter(config);
            case 'supabase':
                return new SupabaseAdapter(config);
            default:
                throw new Error(`Unknown database type: ${type}`);
        }
    }
}

// Configuration manager
class DatabaseConfig {
    constructor() {
        this.currentAdapter = null;
        this.config = this.loadConfig();
    }
    
    loadConfig() {
        // Load from environment variables or localStorage
        const saved = localStorage.getItem('moibook_db_config');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default to localStorage
        return {
            type: 'localStorage',
            settings: {}
        };
    }
    
    saveConfig(config) {
        this.config = config;
        localStorage.setItem('moibook_db_config', JSON.stringify(config));
    }
    
    async switchDatabase(type, settings = {}) {
        try {
            // Disconnect current adapter
            if (this.currentAdapter) {
                await this.currentAdapter.disconnect();
            }
            
            // Create new adapter
            this.currentAdapter = DatabaseFactory.create(type, settings);
            const connected = await this.currentAdapter.connect();
            
            if (connected) {
                this.saveConfig({ type, settings });
                console.log(`Switched to ${type} database`);
                return true;
            } else {
                throw new Error('Failed to connect to database');
            }
        } catch (error) {
            console.error('Database switch failed:', error);
            // Fallback to localStorage
            this.currentAdapter = DatabaseFactory.create('localStorage');
            await this.currentAdapter.connect();
            return false;
        }
    }
    
    getCurrentAdapter() {
        if (!this.currentAdapter) {
            this.currentAdapter = DatabaseFactory.create(this.config.type, this.config.settings);
        }
        return this.currentAdapter;
    }
}

// Export for use in application
export { DatabaseAdapter, DatabaseFactory, DatabaseConfig };

// Console commands for database management
window.moibookDatabase = {
    config: new DatabaseConfig(),
    
    // Switch to Firebase
    useFirebase: async (firebaseConfig) => {
        const success = await window.moibookDatabase.config.switchDatabase('firebase', firebaseConfig);
        console.log(success ? '✅ Switched to Firebase' : '❌ Firebase setup failed');
        return success;
    },
    
    // Switch to Supabase  
    useSupabase: async (supabaseConfig) => {
        const success = await window.moibookDatabase.config.switchDatabase('supabase', supabaseConfig);
        console.log(success ? '✅ Switched to Supabase' : '❌ Supabase setup failed');
        return success;
    },
    
    // Switch back to localStorage
    useLocalStorage: async () => {
        const success = await window.moibookDatabase.config.switchDatabase('localStorage');
        console.log(success ? '✅ Switched to localStorage' : '❌ localStorage setup failed');
        return success;
    },
    
    // Get current database info
    info: () => {
        const config = window.moibookDatabase.config.config;
        console.log('Current database:', config);
        return config;
    },
    
    // Test connection
    test: async () => {
        const adapter = window.moibookDatabase.config.getCurrentAdapter();
        try {
            const events = await adapter.getEvents();
            console.log(`✅ Database connection OK. Found ${events.length} events`);
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            return false;
        }
    }
};

console.log('🔧 Database configuration loaded. Use window.moibookDatabase to manage connections.');