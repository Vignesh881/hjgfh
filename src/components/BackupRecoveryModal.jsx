/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as storage from '../lib/localStorage';

const BackupRecoveryModal = ({ isOpen, onClose, onDataUpdate }) => {
  const [backups, setBackups] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [integrityCheck, setIntegrityCheck] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBackupData();
    }
  }, [isOpen]);

  const loadBackupData = () => {
    setBackups(storage.getAvailableBackups());
    setStorageStats(storage.getStorageStats());
    setIntegrityCheck(storage.performIntegrityCheck());
  };

  const handleRestore = async (backupKey) => {
    if (!confirm(`இந்த காப்புப்பிரதியை மீட்டமைக்கவா? (Restore this backup?)\n${backupKey}`)) {
      return;
    }

    setIsLoading(true);
    try {
      const success = storage.restoreFromBackup(backupKey);
      if (success) {
        alert('காப்புப்பிரதி வெற்றிகரமாக மீட்டமைக்கப்பட்டது! (Backup restored successfully!)');
        onDataUpdate && onDataUpdate();
        onClose();
      } else {
        alert('காப்புப்பிரதி மீட்டமைப்பு தோல்வியடைந்தது (Backup restoration failed)');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert(`மீட்டமைப்பு பிழை: ${error.message} (Restore Error: ${error.message})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    const confirmation = prompt(
      'அனைத்து தரவையும் அழிக்க "CLEAR_ALL_DATA" என்று தட்டச்சு செய்யவும்:\n(Type "CLEAR_ALL_DATA" to clear all data):'
    );
    
    if (confirmation === 'CLEAR_ALL_DATA') {
      const success = storage.clearAllData('CLEAR_ALL_DATA');
      if (success) {
        alert('அனைத்து தரவும் அழிக்கப்பட்டது (All data cleared)');
        onDataUpdate && onDataUpdate();
        onClose();
      } else {
        alert('தரவு அழிப்பு தோல்வியடைந்தது (Data clearing failed)');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🔄 காப்புப்பிரதி மற்றும் மீட்டமைப்பு (Backup & Recovery)</h2>
          <button onClick={onClose} style={{ fontSize: '20px', border: 'none', background: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Storage Statistics */}
        {storageStats && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>📊 சேமிப்பக புள்ளிவிவரங்கள் (Storage Statistics)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>மொத்த Keys:</strong> {storageStats.totalKeys}</div>
              <div><strong>MoiBook Keys:</strong> {storageStats.moibookKeys}</div>
              <div><strong>காப்புப்பிரதிகள்:</strong> {storageStats.backupKeys}</div>
              <div><strong>அளவு:</strong> {formatFileSize(storageStats.estimatedSize)}</div>
              <div><strong>பதிப்பு:</strong> {storageStats.version}</div>
              <div><strong>கடைசி காப்பு:</strong> {storageStats.lastBackup ? new Date(storageStats.lastBackup).toLocaleString() : 'Never'}</div>
            </div>
          </div>
        )}

        {/* Data Integrity Check */}
        {integrityCheck && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: integrityCheck.overall ? '#d4edda' : '#f8d7da', borderRadius: '5px' }}>
            <h3>🔍 தரவு ஒருமைப்பாடு சரிபார்ப்பு (Data Integrity Check)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <strong>Events:</strong> 
                <span style={{ color: integrityCheck.eventsValid ? 'green' : 'red', marginLeft: '5px' }}>
                  {integrityCheck.eventsValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div>
                <strong>Registrars:</strong> 
                <span style={{ color: integrityCheck.registrarsValid ? 'green' : 'red', marginLeft: '5px' }}>
                  {integrityCheck.registrarsValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div>
                <strong>Settings:</strong> 
                <span style={{ color: integrityCheck.settingsValid ? 'green' : 'red', marginLeft: '5px' }}>
                  {integrityCheck.settingsValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div>
                <strong>Moi Entries:</strong> 
                <span style={{ color: integrityCheck.moiEntriesValid ? 'green' : 'red', marginLeft: '5px' }}>
                  {integrityCheck.moiEntriesValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div>
                <strong>மொத்த நிலை:</strong> 
                <span style={{ color: integrityCheck.overall ? 'green' : 'red', marginLeft: '5px' }}>
                  {integrityCheck.overall ? '✅ ஆரோக்கியமானது' : '❌ சிக்கல்கள் உள்ளன'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Available Backups */}
        <div style={{ marginBottom: '20px' }}>
          <h3>📁 கிடைக்கக்கூடிய காப்புப்பிரதிகள் (Available Backups)</h3>
          {backups.length === 0 ? (
            <p>காப்புப்பிரதிகள் எதுவும் கிடைக்கவில்லை (No backups available)</p>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {backups.map((backup, index) => (
                <div key={backup.key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '5px'
                }}>
                  <div>
                    <div><strong>{backup.key}</strong></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {backup.timestamp} • {formatFileSize(backup.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(backup.key)}
                    disabled={isLoading}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    மீட்டமை (Restore)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={loadBackupData}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 புதுப்பிக்கவும் (Refresh)
          </button>
          
          <button
            onClick={handleClearData}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ அனைத்தையும் அழிக்கவும் (Clear All)
          </button>
        </div>

        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '5px'
          }}>
            ⏳ செயலாக்கம்... (Processing...)
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRecoveryModal;