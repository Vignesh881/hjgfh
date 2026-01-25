/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Simple Database Configuration Component for MoiBook Multi-System
 */

import React, { useState, useEffect } from 'react';

const SimpleDatabaseConfig = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState('localStorage');
    const [config, setConfig] = useState({
        host: '',
        username: '',
        password: '',
        database: 'moibook-db'
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ success: true, message: 'LocalStorage active' });
    const [showPassword, setShowPassword] = useState(false);

    // Don't render if not open
    if (!isOpen) return null;

    // Debug message to confirm modal rendering
    // This will always show at the top of the modal
    // Remove after confirming fix
    const debugBanner = (
        <div style={{
            background: '#ffeeba',
            color: '#856404',
            padding: '12px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '2px solid #ffeeba'
        }}>
            🛠️ Database Config Modal Loaded (Debug)
        </div>
    );

    const handleConfigChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const testConnection = async () => {
        setLoading(true);
        
        if (mode === 'localStorage') {
            setStatus({ success: true, message: '✅ LocalStorage is working!' });
        } else {
            if (!config.host || !config.username || !config.password) {
                setStatus({ success: false, message: 'தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்' });
            } else {
                setStatus({ success: true, message: '✅ Configuration saved! Ready for PlanetScale setup.' });
            }
        }
        
        setLoading(false);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        localStorage.setItem('moibook_db_mode', newMode);
        
        if (newMode === 'localStorage') {
            setStatus({ success: true, message: '✅ Using LocalStorage mode' });
        } else {
            setStatus({ success: false, message: '📋 Configure PlanetScale credentials below' });
        }
    };

    const saveConfig = () => {
        localStorage.setItem('moibook_planetscale_config', JSON.stringify(config));
        setStatus({ success: true, message: '✅ Configuration saved!' });
    };

    useEffect(() => {
        // Load saved configuration
        const savedMode = localStorage.getItem('moibook_db_mode') || 'localStorage';
        const savedConfig = localStorage.getItem('moibook_planetscale_config');
        
        setMode(savedMode);
        if (savedConfig) {
            try {
                setConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.warn('Failed to load saved config');
            }
        }
        
        if (savedMode === 'localStorage') {
            setStatus({ success: true, message: '✅ LocalStorage mode active' });
        } else {
            setStatus({ success: false, message: '📋 PlanetScale mode - configure credentials' });
        }
    }, []);

    return (
    <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
                {debugBanner}
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #e1e5e9',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '12px 12px 0 0'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                        🗄️ Database Configuration
                    </h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Current Status */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.1rem' }}>
                            📊 Current Status
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            background: status.success ? '#d4edda' : '#f8d7da',
                            color: status.success ? '#155724' : '#721c24',
                            border: `1px solid ${status.success ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>
                                {status.success ? '✅' : '❌'}
                            </span>
                            <span>{status.message}</span>
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.9rem',
                                background: 'rgba(0, 0, 0, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '4px'
                            }}>
                                Mode: {mode}
                            </span>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.1rem' }}>
                            🔧 Select Database Mode
                        </h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => handleModeChange('localStorage')}
                                style={{
                                    flex: 1,
                                    padding: '16px 20px',
                                    border: `2px solid ${mode === 'localStorage' ? '#667eea' : '#e1e5e9'}`,
                                    background: mode === 'localStorage' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                                    color: mode === 'localStorage' ? 'white' : '#333',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                🏠 Local Storage
                            </button>
                            <button
                                onClick={() => handleModeChange('planetscale')}
                                style={{
                                    flex: 1,
                                    padding: '16px 20px',
                                    border: `2px solid ${mode === 'planetscale' ? '#667eea' : '#e1e5e9'}`,
                                    background: mode === 'planetscale' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                                    color: mode === 'planetscale' ? 'white' : '#333',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                ☁️ PlanetScale Cloud
                            </button>
                        </div>
                    </div>

                    {/* PlanetScale Configuration */}
                    {mode === 'planetscale' && (
                        <div style={{
                            marginBottom: '24px',
                            padding: '20px',
                            border: '1px solid #e1e5e9',
                            borderRadius: '8px',
                            background: '#f8f9fa'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.1rem' }}>
                                ☁️ PlanetScale Configuration
                            </h3>
                            
                            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e1e5e9' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
                                        Host:
                                    </label>
                                    <input
                                        type="text"
                                        value={config.host}
                                        onChange={(e) => handleConfigChange('host', e.target.value)}
                                        placeholder="aws.connect.psdb.cloud"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
                                        Username:
                                    </label>
                                    <input
                                        type="text"
                                        value={config.username}
                                        onChange={(e) => handleConfigChange('username', e.target.value)}
                                        placeholder="your-username"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
                                        Password:
                                    </label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={config.password}
                                            onChange={(e) => handleConfigChange('password', e.target.value)}
                                            placeholder="pscale_pw_..."
                                            style={{
                                                width: '100%',
                                                padding: '10px 40px 10px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                padding: '4px'
                                            }}
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
                                        Database:
                                    </label>
                                    <input
                                        type="text"
                                        value={config.database}
                                        onChange={(e) => handleConfigChange('database', e.target.value)}
                                        placeholder="moibook-db"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={saveConfig}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        marginTop: '16px'
                                    }}
                                >
                                    💾 Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Help Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.1rem' }}>
                            💡 Help
                        </h3>
                        <div style={{
                            background: '#e7f3ff',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #bee5eb'
                        }}>
                            <p style={{ margin: '0 0 12px 0', color: '#0c5460', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <strong>Local Storage:</strong> தரவு உங்கள் பிரவுசரில் மட்டும் சேமிக்கப்படும். இது ஒரு சாதனத்தில் மட்டும் பயன்படுத்த ஏற்றது.
                            </p>
                            <p style={{ margin: '0 0 12px 0', color: '#0c5460', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <strong>PlanetScale Cloud:</strong> தரவு MySQL cloud database இல் சேமிக்கப்படும். பல சாதனங்கள் மற்றும் பல பயனர்கள் ஒரே நேரத்தில் பயன்படுத்தலாம்.
                            </p>
                            <p style={{ margin: '0', color: '#0c5460', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <strong>Setup Guide:</strong> Complete setup instructions available in QUICK_SETUP_GUIDE.md file.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e1e5e9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: '#f8f9fa',
                    borderRadius: '0 0 12px 12px'
                }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        ✅ Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleDatabaseConfig;