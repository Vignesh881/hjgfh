/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Database Configuration Component for MoiBook Multi-System
 */

import React, { useState, useEffect } from 'react';
import './DatabaseConfig.css';

// Safe import with fallback
let databaseManager;
try {
    databaseManager = require('../lib/databaseManager.js').default;
} catch (error) {
    console.warn('DatabaseManager not available:', error);
    // Create fallback object
    databaseManager = {
        getConfig: () => ({ mode: 'localStorage', server: { serverUrl: '/api', database: 'moibook_db' } }),
        testConnection: () => Promise.resolve({ success: true, message: 'LocalStorage active' }),
        setMode: () => Promise.resolve('localStorage'),
        migrateToCloud: () => Promise.reject(new Error('DatabaseManager not available')),
        syncFromCloud: () => Promise.reject(new Error('DatabaseManager not available'))
    };
}

const DatabaseConfig = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState('localStorage');
    const [config, setConfig] = useState({
        // server-based mode doesn't require exposing DB credentials in UI
        serverUrl: '/api',
        database: 'moibook_db'
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ success: true, message: 'LocalStorage active' });
    const [showPassword, setShowPassword] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState(null);

    // Don't render if not open
    if (!isOpen) return null;

    useEffect(() => {
        // Load current configuration safely
        try {
            const currentConfig = databaseManager.getConfig();
            setMode(currentConfig.mode);
            // prefer server-shaped config; fallback to defaults
            setConfig(currentConfig.server || { serverUrl: '/api', database: 'moibook_db' });
            
            // Test current connection
            testCurrentConnection();
        } catch (error) {
            console.error('Error loading database config:', error);
            setStatus({ success: false, message: 'Configuration load failed' });
        }
    }, []);

    const testCurrentConnection = async () => {
        try {
            const result = await databaseManager.testConnection();
            setStatus(result);
        } catch (error) {
            console.error('Connection test failed:', error);
            setStatus({ success: false, message: 'Connection test failed' });
        }
    };

    const handleConfigChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const testServerDbConnection = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/test-db');
            const json = await res.json();
            setStatus({ success: json.success, message: json.message });
            return json.success;
        } catch (error) {
            console.error('Server DB test error:', error);
            setStatus({ success: false, message: `❌ Connection error: ${error.message}` });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleModeChange = async (newMode) => {
        setLoading(true);
        try {
            // For server-backed mode we don't store DB credentials in the client.
            await databaseManager.setMode(newMode, null);
            setMode(newMode);
            
            const result = await databaseManager.testConnection();
            setStatus(result);
            
            setStatus({ success: true, message: `✅ Database mode changed to ${newMode}` });
        } catch (error) {
            console.error('Mode change error:', error);
            setStatus({ success: false, message: `❌ Mode change failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleMigration = async (direction) => {
        setLoading(true);
        setMigrationStatus(null);
        
        try {
            let result;
            if (direction === 'toCloud') {
                // For server mode, we call server-side migration if implemented
                result = await databaseManager.migrateToCloud();
                setMigrationStatus({
                    success: true,
                    message: `✅ Migration completed: ${result.events} events, ${result.entries} entries moved to cloud`
                });
            } else {
                result = await databaseManager.syncFromCloud();
                setMigrationStatus({
                    success: true,
                    message: `✅ Sync completed: ${result.events} events, ${result.entries} entries downloaded`
                });
            }
        } catch (error) {
            console.error('Migration error:', error);
            setMigrationStatus({
                success: false,
                message: `❌ ${direction === 'toCloud' ? 'Migration' : 'Sync'} failed: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    const renderLocalStorageMode = () => (
        <div className="db-mode-section">
            <h3>🏠 Local Storage Mode</h3>
            <p>தரவு உங்கள் பிரவுசரில் உள்ளூரில் சேமிக்கப்படும்</p>
            <div className="features">
                <div className="feature">✅ இணைய இணைப்பு தேவையில்லை</div>
                <div className="feature">✅ வேகமான செயல்திறன்</div>
                <div className="feature">❌ ஒரு சாதனத்தில் மட்டும்</div>
                <div className="feature">❌ பல பயனர்கள் இல்லை</div>
            </div>
        </div>
    );

    const renderServerMode = () => (
        <div className="db-mode-section">
            <h3>🖥️ Server (MySQL API) Mode</h3>
            <p>தரவு உங்கள் MySQL சேவையகத்தில் Node.js API மூலம் சேமிக்கப்படும்</p>

            <div className="features">
                <div className="feature">✅ உள்/வள சேமிப்பு மற்றும் முன்னணி API</div>
                <div className="feature">✅ பல சாதனங்கள் மற்றும் பயனர்கள்</div>
                <div className="feature">✅ பாதுகாப்பான சர்வர்-சைடு திறப்பு</div>
                <div className="feature">❌ சர்வர் இணைப்பு தேவை</div>
            </div>

            <div className="config-form">
                <div className="form-row">
                    <label>Server API Base URL:</label>
                    <input
                        type="text"
                        value={config.serverUrl}
                        onChange={(e) => handleConfigChange('serverUrl', e.target.value)}
                        placeholder="/api"
                        disabled={loading}
                    />
                </div>

                <div className="form-row">
                    <label>Database:</label>
                    <input
                        type="text"
                        value={config.database}
                        onChange={(e) => handleConfigChange('database', e.target.value)}
                        placeholder="moibook_db"
                        disabled={loading}
                    />
                </div>

                <button
                    className="test-connection-btn"
                    onClick={testServerDbConnection}
                    disabled={loading}
                >
                    {loading ? '🔄 Testing...' : '🔗 Test Server DB'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="database-config-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>🗄️ Database Configuration</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Current Status */}
                    <div className="status-section">
                        <h3>📊 Current Status</h3>
                        <div className={`status-indicator ${status.success ? 'success' : 'error'}`}>
                            <span className="status-icon">{status.success ? '✅' : '❌'}</span>
                            <span className="status-text">{status.message}</span>
                            <span className="current-mode">Mode: {mode}</span>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="mode-selection">
                        <h3>🔧 Select Database Mode</h3>
                        <div className="mode-buttons">
                            <button
                                className={`mode-btn ${mode === 'localStorage' ? 'active' : ''}`}
                                onClick={() => handleModeChange('localStorage')}
                                disabled={loading}
                            >
                                🏠 Local Storage
                            </button>
                            <button
                                className={`mode-btn ${mode === 'server' ? 'active' : ''}`}
                                onClick={() => handleModeChange('server')}
                                disabled={loading}
                            >
                                🖥️ Server (MySQL API)
                            </button>
                        </div>
                    </div>

                    {/* Mode-specific configuration */}
                    {mode === 'localStorage' && renderLocalStorageMode()}
                    {mode === 'server' && renderServerMode()}

                    {/* Migration Section */}
                    <div className="migration-section">
                        <h3>🔄 Data Migration</h3>
                        <div className="migration-buttons">
                            <button
                                className="migration-btn"
                                onClick={() => handleMigration('toCloud')}
                                disabled={loading || mode !== 'server'}
                                title="Move local data to server-side MySQL"
                            >
                                📤 Migrate to Server MySQL
                            </button>
                            <button
                                className="migration-btn"
                                onClick={() => handleMigration('fromCloud')}
                                disabled={loading || mode !== 'server'}
                                title="Download server data to local"
                            >
                                📥 Sync from Server MySQL
                            </button>
                        </div>
                        
                        {migrationStatus && (
                            <div className={`migration-status ${migrationStatus.success ? 'success' : 'error'}`}>
                                {migrationStatus.message}
                            </div>
                        )}
                    </div>

                    {/* Help Section */}
                    <div className="help-section">
                        <h3>💡 Help</h3>
                        <div className="help-content">
                            <p><strong>Local Storage:</strong> தரவு உங்கள் பிரவுசரில் மட்டும் சேமிக்கப்படும். இது ஒரு சாதனத்தில் மட்டும் பயன்படுத்த ஏற்றது.</p>
                            <p><strong>Server (MySQL API):</strong> தரவு உங்கள் MySQL சேவையகத்தில் Node.js API மூலம் சேமிக்கப்படும். பல சாதனங்கள் மற்றும் பல பயனர்கள் ஒரே நேரத்தில் பயன்படுத்தலாம்.</p>
                            <p><strong>Migration:</strong> Local data ஐ server-இற்கு அல்லது server data ஐ local க்கு நகர்த்தலாம்.</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="save-btn" onClick={onClose} disabled={loading}>
                        {loading ? '🔄 Processing...' : '✅ Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseConfig;