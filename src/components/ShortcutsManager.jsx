/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';

const ShortcutsManager = ({ isOpen, onClose }) => {
    const [shortcuts, setShortcuts] = useState([]);
    const [newShortcut, setNewShortcut] = useState('');
    const [newTown, setNewTown] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadShortcuts();
    }, []);

    const loadShortcuts = () => {
        const saved = localStorage.getItem('customTownShortcuts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setShortcuts(Object.entries(parsed).map(([key, value], index) => ({
                    id: index,
                    shortcut: key,
                    town: value
                })));
            } catch (e) {
                console.error('Error loading shortcuts:', e);
            }
        }
    };

    const saveShortcuts = (updatedShortcuts) => {
        const obj = {};
        updatedShortcuts.forEach(s => {
            obj[s.shortcut] = s.town;
        });
        localStorage.setItem('customTownShortcuts', JSON.stringify(obj));
        setShortcuts(updatedShortcuts);
    };

    const addShortcut = () => {
        if (!newShortcut.trim() || !newTown.trim()) {
            alert('Shortcut மற்றும் ஊர் இரண்டும் வேண்டும்!');
            return;
        }

        // Check for duplicates
        if (shortcuts.some(s => s.shortcut === newShortcut.trim())) {
            alert('இந்த shortcut ஏற்கனவே உள்ளது!');
            return;
        }

        const newId = shortcuts.length > 0 ? Math.max(...shortcuts.map(s => s.id)) + 1 : 0;
        const updated = [...shortcuts, {
            id: newId,
            shortcut: newShortcut.trim(),
            town: newTown.trim()
        }];
        
        saveShortcuts(updated);
        setNewShortcut('');
        setNewTown('');
    };

    const deleteShortcut = (id) => {
        if (window.confirm('இந்த shortcut-ஐ நீக்க விரும்புகிறீர்களா?')) {
            const updated = shortcuts.filter(s => s.id !== id);
            saveShortcuts(updated);
        }
    };

    const startEdit = (shortcut) => {
        setEditingId(shortcut.id);
        setNewShortcut(shortcut.shortcut);
        setNewTown(shortcut.town);
    };

    const updateShortcut = () => {
        if (!newShortcut.trim() || !newTown.trim()) {
            alert('Shortcut மற்றும் ஊர் இரண்டும் வேண்டும்!');
            return;
        }

        const updated = shortcuts.map(s => 
            s.id === editingId 
                ? { ...s, shortcut: newShortcut.trim(), town: newTown.trim() }
                : s
        );
        
        saveShortcuts(updated);
        setEditingId(null);
        setNewShortcut('');
        setNewTown('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewShortcut('');
        setNewTown('');
    };

    const filteredShortcuts = shortcuts.filter(s => 
        s.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.town.includes(searchTerm)
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '2px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#00695c',
                    color: 'white',
                    borderRadius: '12px 12px 0 0'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                        ⌨️ ஊர் Shortcuts Manager
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0 10px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Add/Edit Form */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr auto',
                        gap: '10px',
                        alignItems: 'end'
                    }}>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: '#00695c'
                            }}>
                                Shortcut
                            </label>
                            <input
                                type="text"
                                value={newShortcut}
                                onChange={(e) => setNewShortcut(e.target.value)}
                                placeholder="cbe, mar..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #00695c',
                                    borderRadius: '6px',
                                    fontSize: '1rem'
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        editingId ? updateShortcut() : addShortcut();
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: '#00695c'
                            }}>
                                ஊர் (Town)
                            </label>
                            <input
                                type="text"
                                value={newTown}
                                onChange={(e) => setNewTown(e.target.value)}
                                placeholder="கோயம்புத்தூர், மதுரை..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #00695c',
                                    borderRadius: '6px',
                                    fontSize: '1rem'
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        editingId ? updateShortcut() : addShortcut();
                                    }
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {editingId ? (
                                <>
                                    <button
                                        onClick={updateShortcut}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        Update
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#9e9e9e',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={addShortcut}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#00695c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '1rem'
                                    }}
                                >
                                    + Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #e0e0e0' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="🔍 Search shortcuts..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Shortcuts List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {filteredShortcuts.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#666'
                        }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                                📝 No custom shortcuts yet
                            </p>
                            <p style={{ fontSize: '0.9rem' }}>
                                Add your first shortcut above to get started!
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gap: '10px'
                        }}>
                            {filteredShortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '120px 1fr auto',
                                        gap: '15px',
                                        alignItems: 'center',
                                        padding: '15px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '8px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                >
                                    <div style={{
                                        backgroundColor: '#00695c',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '1rem'
                                    }}>
                                        {shortcut.shortcut}
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        color: '#333'
                                    }}>
                                        → {shortcut.town}
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => startEdit(shortcut)}
                                            style={{
                                                padding: '8px 15px',
                                                backgroundColor: '#2196F3',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => deleteShortcut(shortcut.id)}
                                            style={{
                                                padding: '8px 15px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '15px 20px',
                    borderTop: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '0 0 12px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        📊 Total: {shortcuts.length} shortcuts
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 30px',
                            backgroundColor: '#00695c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsManager;
