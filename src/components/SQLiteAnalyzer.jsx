/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SQLite File Analyzer Component
 */

import React, { useState } from 'react';
import { analyzeSQLiteFile } from '../lib/sqliteExporter';

const SQLiteAnalyzer = ({ isOpen, onClose }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.sql') && !file.name.endsWith('.db') && !file.name.includes('sqlite')) {
            setError('கோப்பு SQL script (.sql) அல்லது SQLite database file (.db) ஆக இருக்க வேண்டும்');
            return;
        }

        setAnalyzing(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeSQLiteFile(file);
            setAnalysis(result);
        } catch (err) {
            setError(`Analysis failed: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const resetState = () => {
        setAnalysis(null);
        setError(null);
        setAnalyzing(false);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2>🗃️ SQLite File Analyzer</h2>
                    <button 
                        onClick={() => { onClose(); resetState(); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {!analysis && !analyzing && (
                    <div>
                        <p>SQLite database file-ஐ select செய்யவும்:</p>
                        <input
                            type="file"
                            accept=".sql,.db,.sqlite,.sqlite3"
                            onChange={handleFileSelect}
                            style={{
                                padding: '10px',
                                border: '2px dashed #ddd',
                                borderRadius: '5px',
                                width: '100%',
                                marginBottom: '10px'
                            }}
                        />
                        <p style={{ fontSize: '12px', color: '#666' }}>
                            📝 குறிப்பு: .sql scripts, .db, .sqlite, அல்லது .sqlite3 files support செய்யப்படுகின்றன
                        </p>
                    </div>
                )}

                {analyzing && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div>🔄 Analyzing SQLite file...</div>
                        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                            Please wait while we examine the database structure
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '5px',
                        padding: '15px',
                        marginBottom: '15px',
                        color: '#721c24'
                    }}>
                        <strong>❌ Error:</strong> {error}
                        <button
                            onClick={resetState}
                            style={{
                                marginLeft: '10px',
                                padding: '5px 10px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {analysis && (
                    <div>
                        <div style={{
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '5px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <h3>📊 Database Analysis Results</h3>
                            <p><strong>File:</strong> {analysis.fileName}</p>
                            <p><strong>Type:</strong> {analysis.fileType || 'Database File'}</p>
                            <p><strong>Size:</strong> {(analysis.fileSize / 1024).toFixed(2)} KB</p>
                            {analysis.lineCount && <p><strong>Lines:</strong> {analysis.lineCount}</p>}
                            <p><strong>Tables found:</strong> {analysis.tables?.length || 0}</p>
                            {analysis.estimatedRecords && <p><strong>Estimated records:</strong> {analysis.estimatedRecords}</p>}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4>📋 Tables and Row Counts:</h4>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                border: '1px solid #ddd'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>
                                            Table Name
                                        </th>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                                            Row Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.tables?.map(tableName => (
                                        <tr key={tableName}>
                                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                {tableName}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                                                {analysis.tableData?.[tableName]?.error ? (
                                                    <span style={{ color: 'red' }}>Error</span>
                                                ) : analysis.tableData?.[tableName]?.count !== undefined ? (
                                                    analysis.tableData[tableName].count
                                                ) : (
                                                    <span style={{ color: '#666' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) || []}
                                </tbody>
                            </table>
                        </div>

                        <div style={{
                            backgroundColor: '#d1ecf1',
                            border: '1px solid #bee5eb',
                            borderRadius: '5px',
                            padding: '15px'
                        }}>
                            <h4>💡 Console Commands</h4>
                            <p>Browser console-ல் இந்த commands-ஐ பயன்படுத்தலாம்:</p>
                            <pre style={{
                                backgroundColor: '#f8f9fa',
                                padding: '10px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                overflow: 'auto'
                            }}>
{`// SQLite database-ஐ export செய்ய (SQL script format)
window.moibookSQLite.export()

// Current localStorage data-ஐ view செய்ய  
window.moibookSQLite.viewData()

// SQL/SQLite file-ஐ analyze செய்ய
window.moibookSQLite.analyze(file)

// Sample queries generate செய்ய
window.moibookSQLite.generateSampleQueries()`}
                            </pre>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <button
                                onClick={resetState}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                Analyze Another File
                            </button>
                            <button
                                onClick={() => { onClose(); resetState(); }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SQLiteAnalyzer;