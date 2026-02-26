/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Database Configuration Manager for MoiBook Multi-System
 */

class DatabaseManager {
    constructor() {
        this.subscribers = new Set();
        this.cloudDb = null;
        this.isCloudEnabled = false;
    }

    _getDefaultApiBaseUrl() {
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
            return process.env.REACT_APP_API_URL;
        }
        if (typeof window !== 'undefined' && window.location) {
            const { protocol, hostname, port } = window.location;
            if (port === '3000') {
                return `${protocol}//${hostname}:3001/api`;
            }
        }
        return 'https://hjgfh-1.onrender.com/api';
    }

    // Initialize cloud database connection (PlanetScale)
    async initializeCloudConnection() {
        try {
            // Get cloud connection string from settings or environment
            const cloudUrl = this._getCloudConnectionUrl();
            if (!cloudUrl) {
                console.log('Cloud connection not configured');
                return false;
            }

            // For browser environment, we'll use a proxy API endpoint
            // In production, this would connect directly to PlanetScale
            this.isCloudEnabled = true;
            console.log('Cloud connection initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize cloud connection:', error);
            return false;
        }
    }

    // Get cloud connection URL from settings
    _getCloudConnectionUrl() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('moibook_cloud_url') ||
                   window.__MOIBOOK_CLOUD_URL__ ||
                   null;
        }
        return null;
    }

    // Enable/disable cloud sync
    enableCloudSync(url) {
        if (url) {
            localStorage.setItem('moibook_cloud_url', url);
            this.isCloudEnabled = true;
        }
    }

    disableCloudSync() {
        localStorage.removeItem('moibook_cloud_url');
        this.isCloudEnabled = false;
    }

    isCloudSyncEnabled() {
        return this.isCloudEnabled && !!this._getCloudConnectionUrl();
    }

    /**
     * Cloud Sync Functions
     */
    async syncEventToCloud(eventData) {
        if (!this.isCloudEnabled) return false;
        try {
            const response = await fetch(this._getCloudConnectionUrl() + '/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to sync event to cloud:', error);
            return false;
        }
    }

    async getCloudEvents() {
        if (!this.isCloudEnabled) return [];
        try {
            const response = await fetch(this._getCloudConnectionUrl() + '/events');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Failed to get cloud events:', error);
            return [];
        }
    }

    async downloadEventDataFromCloud(eventId) {
        if (!this.isCloudEnabled) return null;
        try {
            const response = await fetch(this._getCloudConnectionUrl() + `/events/${eventId}/data`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to download event data from cloud:', error);
            return null;
        }
    }

    async uploadEventDataToCloud(eventId, eventData) {
        if (!this.isCloudEnabled) return false;
        try {
            const response = await fetch(this._getCloudConnectionUrl() + `/events/${eventId}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to upload event data to cloud:', error);
            return false;
        }
    }

    // Resolve the base API URL (stored in window or localStorage)
    // IMPORTANT: For multi-location, multi-laptop setups, set the same central API URL (e.g., http://CENTRAL_SERVER_IP:3001/api)
    _getApiBaseUrl() {
        if (typeof window !== 'undefined' && window.__MOIBOOK_API_URL__) {
            return window.__MOIBOOK_API_URL__;
        }
        if (typeof window !== 'undefined') {
            // Set 'moibook_api_url' in localStorage on each client to point to the central server (e.g., http://192.168.1.100:3001/api)
            return localStorage.getItem('moibook_api_url') || this._getDefaultApiBaseUrl();
        }
        return this._getDefaultApiBaseUrl();
    }

    /**
     * Events
     */
    async getEvents(options = {}) {
        const { useLocalFallback = true } = options;
        try {
            return await this._fetchJson(this._getApiBaseUrl() + '/events');
        } catch (err) {
            if (useLocalFallback && typeof window !== 'undefined') {
                const storage = await import('./localStorage.js');
                return storage.loadEvents();
            }
            throw err;
        }
    }

    async createEvent(eventData) {
        return await this._fetchJson(this._getApiBaseUrl() + '/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
    }

    async updateEvent(id, eventData) {
        return await this._fetchJson(this._getApiBaseUrl() + `/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
    }

    async deleteEvent(id) {
        return await this._fetchJson(this._getApiBaseUrl() + `/events/${id}`, { method: 'DELETE' });
    }

    /**
     * Registrars
     */
    async getRegistrars(options = {}) {
        const { useLocalFallback = true } = options;
        try {
            return await this._fetchJson(this._getApiBaseUrl() + '/registrars');
        } catch (err) {
            if (useLocalFallback && typeof window !== 'undefined') {
                const storage = await import('./localStorage.js');
                return storage.loadRegistrars();
            }
            throw err;
        }
    }

    async createRegistrar(registrarData) {
        return await this._fetchJson(this._getApiBaseUrl() + '/registrars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrarData)
        });
    }

    async updateRegistrar(id, registrarData) {
        return await this._fetchJson(this._getApiBaseUrl() + `/registrars/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrarData)
        });
    }

    async deleteRegistrar(id) {
        return await this._fetchJson(this._getApiBaseUrl() + `/registrars/${id}`, { method: 'DELETE' });
    }

    /**
     * Members
     */
    async getMembers(options = {}) {
        const { useLocalFallback = true } = options;
        try {
            return await this._fetchJson(this._getApiBaseUrl() + '/members');
        } catch (err) {
            if (useLocalFallback && typeof window !== 'undefined') {
                const storage = await import('./localStorage.js');
                return storage.loadMembers();
            }
            throw err;
        }
    }

    async createMember(memberData) {
        return await this._fetchJson(this._getApiBaseUrl() + '/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData)
        });
    }

    async updateMember(id, memberData) {
        return await this._fetchJson(this._getApiBaseUrl() + `/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData)
        });
    }

    async deleteMember(id) {
        return await this._fetchJson(this._getApiBaseUrl() + `/members/${id}`, { method: 'DELETE' });
    }

    async syncMembers(memberPayload) {
        return await this._fetchJson(this._getApiBaseUrl() + '/members/bulk-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberPayload)
        });
    }

    /**
     * Moi entries
     */
    async getMoiEntries(eventId = null, options = {}) {
        const { useLocalFallback = true } = options;
        try {
            const url = eventId ? this._getApiBaseUrl() + `/moi-entries?eventId=${eventId}` : this._getApiBaseUrl() + '/moi-entries';
            return await this._fetchJson(url);
        } catch (err) {
            if (useLocalFallback && typeof window !== 'undefined') {
                const storage = await import('./localStorage.js');
                return storage.loadMoiEntries();
            }
            throw err;
        }
    }

    async createMoiEntry(entryData) {
        return await this._fetchJson(this._getApiBaseUrl() + '/moi-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entryData)
        });
    }

    async updateMoiEntry(id, entryData) {
        return await this._fetchJson(this._getApiBaseUrl() + `/moi-entries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entryData)
        });
    }

    async deleteMoiEntry(id) {
        return await this._fetchJson(this._getApiBaseUrl() + `/moi-entries/${id}`, { method: 'DELETE' });
    }

    /**
     * Settings
     */
    async getSettings(options = {}) {
        const { useLocalFallback = true } = options;
        try {
            return await this._fetchJson(this._getApiBaseUrl() + '/settings');
        } catch (err) {
            if (useLocalFallback && typeof window !== 'undefined') {
                const storage = await import('./localStorage.js');
                return storage.loadSettings ? storage.loadSettings() : {};
            }
            throw err;
        }
    }

    async saveSettings(settingsPayload) {
        return await this._fetchJson(this._getApiBaseUrl() + '/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsPayload)
        });
    }

    /**
     * Miscellaneous helpers used by other code paths
     */
    async getUsers() {
        return await this._fetchJson(this._getApiBaseUrl() + '/users');
    }

    async authenticateUser(username, password) {
        return await this._fetchJson(this._getApiBaseUrl() + '/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    }

    async getEventAnalytics(eventId) {
        return await this._fetchJson(this._getApiBaseUrl() + `/events/${eventId}/analytics`);
    }

    async searchEntries(searchTerm, eventId = null) {
        const url = eventId
            ? this._getApiBaseUrl() + `/search?term=${searchTerm}&eventId=${eventId}`
            : this._getApiBaseUrl() + `/search?term=${searchTerm}`;
        return await this._fetchJson(url);
    }

    /**
     * Internal fetch wrapper with strict JSON validation
     */
    async _fetchJson(url, options = {}) {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
            let body = '';
            try { body = await res.text(); } catch (e) { /* ignore */ }
            throw new Error(`HTTP ${res.status} ${res.statusText} when fetching ${url}: ${body}`);
        }
        if (!contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Expected JSON response from ${url} but got content-type '${contentType}'. Response body starts with: ${text.slice(0,200)}`);
        }
        return await res.json();
    }

    subscribeToChanges(callback) {
        this.subscribers.add(callback);
        return () => {
            this.subscribers.delete(callback);
        };
    }

    notifySubscribers(action, data) {
        this.subscribers.forEach(callback => {
            try {
                callback(action, data);
            } catch (error) {
                console.error('Error notifying subscriber:', error);
            }
        });
    }
}

const databaseManager = new DatabaseManager();
export default databaseManager;
