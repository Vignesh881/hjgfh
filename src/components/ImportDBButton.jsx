/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import * as storage from '../lib/localStorage';

const ImportDBButton = ({ onImportSuccess, onImportError }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate the imported data structure
        if (validateImportData(data)) {
          // Import the data
          const success = storage.importAllData(data);
          if (success) {
            onImportSuccess && onImportSuccess(data);
            alert('தரவு வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது! (Data imported successfully!)');
          } else {
            throw new Error('Failed to save imported data');
          }
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Import error:', error);
        onImportError && onImportError(error);
        alert(`இறக்குமதி பிழை: ${error.message} (Import Error: ${error.message})`);
      }
    };

    reader.onerror = () => {
      const error = new Error('File reading failed');
      onImportError && onImportError(error);
      alert('கோப்பு படிக்க முடியவில்லை (Could not read file)');
    };

    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const validateImportData = (data) => {
    // Check if it's a valid MoiBook data structure
    if (!data || typeof data !== 'object') return false;
    
    // Check for required fields
    const requiredFields = ['events', 'registrars', 'settings', 'moiEntries'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.warn(`Missing field: ${field}`);
        return false;
      }
    }

    // Validate events array
    if (!Array.isArray(data.events)) return false;
    
    // Validate registrars array
    if (!Array.isArray(data.registrars)) return false;
    
    // Validate settings object
    if (typeof data.settings !== 'object') return false;
    
    // Validate moiEntries array
    if (!Array.isArray(data.moiEntries)) return false;

    // Additional validation for event structure
    for (const event of data.events) {
      if (!event.id || !event.eventName) {
        console.warn('Invalid event structure:', event);
        return false;
      }
    }

    return true;
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.db.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={triggerFileSelect}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
      >
        📁 தரவுத்தளம் இறக்குமதி (Import Database)
      </button>
    </div>
  );
};

export default ImportDBButton;