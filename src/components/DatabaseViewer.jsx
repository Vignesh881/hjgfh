/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as storage from '../lib/localStorage';

const DatabaseViewer = ({ isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedTable, setSelectedTable] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDatabaseData();
    }
  }, [isOpen]);

  const loadDatabaseData = () => {
    const allData = {
      events: storage.loadEvents(),
      registrars: storage.loadRegistrars(),
      settings: storage.loadSettings(),
      moiEntries: storage.loadMoiEntries()
    };
    
    setData(allData);
    setStats(storage.getStorageStats());
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  const filterData = (items) => {
    if (!searchTerm || !Array.isArray(items)) return items;
    
    return items.filter(item => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderTable = (tableName, items) => {
    if (!items || items.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        இந்த அட்டவணையில் தரவு இல்லை (No data in this table)
      </div>;
    }

    const filteredItems = filterData(items);
    
    if (filteredItems.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        தேடல் முடிவுகள் இல்லை (No search results)
      </div>;
    }

    return (
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
            <tr>
              {Object.keys(filteredItems[0]).map(key => (
                <th key={key} style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px', 
                  textAlign: 'left',
                  fontWeight: 'bold'
                }}>
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                {Object.values(item).map((value, colIndex) => (
                  <td key={colIndex} style={{ 
                    border: '1px solid #ddd', 
                    padding: '8px',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
          மொத்தம் {filteredItems.length} records ({items.length} total)
        </div>
      </div>
    );
  };

  const renderSettings = (settings) => {
    return (
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }}>
          {formatJSON(settings)}
        </pre>
      </div>
    );
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
        maxWidth: '95%',
        maxHeight: '90vh',
        overflow: 'auto',
        width: '90%'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🗄️ தரவுத்தள பார்வையாளர் (Database Viewer)</h2>
          <button onClick={onClose} style={{ fontSize: '20px', border: 'none', background: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
            <h3>📊 புள்ளிவிவரங்கள் (Statistics)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Events:</strong> {data?.events?.length || 0}</div>
              <div><strong>Registrars:</strong> {data?.registrars?.length || 0}</div>
              <div><strong>Moi Entries:</strong> {data?.moiEntries?.length || 0}</div>
              <div><strong>Storage Size:</strong> {stats.estimatedSize ? (stats.estimatedSize / 1024).toFixed(1) + ' KB' : 'Unknown'}</div>
              <div><strong>Total Keys:</strong> {stats.totalKeys || 0}</div>
              <div><strong>Backup Keys:</strong> {stats.backupKeys || 0}</div>
            </div>
          </div>
        )}

        {/* Table Selector */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {['events', 'registrars', 'moiEntries', 'settings'].map(table => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: selectedTable === table ? '#007bff' : '#f8f9fa',
                  color: selectedTable === table ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {table === 'events' && '📅 Events'} 
                {table === 'registrars' && '👥 Registrars'}
                {table === 'moiEntries' && '💰 Moi Entries'}
                {table === 'settings' && '⚙️ Settings'}
                {data && data[table] && Array.isArray(data[table]) && ` (${data[table].length})`}
              </button>
            ))}
          </div>

          {/* Search */}
          {selectedTable !== 'settings' && (
            <input
              type="text"
              placeholder="தேடல்... (Search...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          )}
        </div>

        {/* Data Display */}
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '10px', fontWeight: 'bold' }}>
            {selectedTable === 'events' && '📅 Events Table'}
            {selectedTable === 'registrars' && '👥 Registrars Table'}
            {selectedTable === 'moiEntries' && '💰 Moi Entries Table'}
            {selectedTable === 'settings' && '⚙️ Settings'}
          </div>
          
          {data && selectedTable === 'settings' 
            ? renderSettings(data.settings)
            : data && renderTable(selectedTable, data[selectedTable])
          }
        </div>

        {/* Actions */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={loadDatabaseData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 புதுப்பிக்கவும் (Refresh)
          </button>
          
          <button
            onClick={() => {
              const exportData = storage.exportAllData();
              console.log('Complete Database:', exportData);
              alert('Database data logged to console (F12 > Console)');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📝 Console-இல் பதிவு செய்யவும் (Log to Console)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;