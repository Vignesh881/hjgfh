/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { exportToPdf, exportToExcel, exportTamilPdf, exportTamilWord, exportTownBasedPdf, exportTamilPdfForShare } from '../lib/exportUtils.js';
import { batchPrintAllBills } from '../lib/printUtils.jsx';
import { MoiBookIcon } from './MoiBookLogo';
import DenominationBill from './DenominationBill.jsx';

const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];

// --- Sub-component for All Entries View ---
const AllEntriesView = ({ moiEntries, event }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const getEntrySerialNumber = (entry) => {
        const raw = entry?.serialNumber ?? entry?.serial_no ?? entry?.serial ?? entry?.entryNumber ?? null;
        const parsed = raw != null ? parseInt(raw, 10) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const formatSerialNumber = (value) => {
        const parsed = value != null ? parseInt(value, 10) : NaN;
        if (!Number.isFinite(parsed)) return '';
        return parsed.toString().padStart(4, '0');
    };

    const eventEntries = useMemo(() => {
        if (!event || !(event.permission === true || event.permission === 'true')) return [];
        return moiEntries.filter(entry => entry.eventId === event.id);
    }, [moiEntries, event]);

    const eventSerialMap = useMemo(() => {
        const map = new Map();
        const sorted = [...eventEntries].sort((a, b) => {
            const aSerial = getEntrySerialNumber(a);
            const bSerial = getEntrySerialNumber(b);
            if (Number.isFinite(aSerial) && Number.isFinite(bSerial)) {
                return aSerial - bSerial;
            }
            const aKey = Number.isFinite(aSerial) ? aSerial : (parseInt(a?.id, 10) || 0);
            const bKey = Number.isFinite(bSerial) ? bSerial : (parseInt(b?.id, 10) || 0);
            return aKey - bKey;
        });
        let seq = 1;
        for (const entry of sorted) {
            if (getEntrySerialNumber(entry) == null) {
                map.set(entry, seq);
            }
            seq += 1;
        }
        return map;
    }, [eventEntries]);

    const resolveSerialNumber = (entry) => {
        const existing = getEntrySerialNumber(entry);
        if (Number.isFinite(existing)) return existing;
        const mapped = eventSerialMap.get(entry);
        return Number.isFinite(mapped) ? mapped : null;
    };

    const filteredMoiEntries = useMemo(() => {
        let entries = eventEntries;
        if (!searchQuery) return entries;
        const lowercasedQuery = searchQuery.toLowerCase();
        const getCombinedId = (entry) => {
            const tableLabel = entry.table ? entry.table.replace('table', 'T').toUpperCase() : 'T?';
            const serialNumber = resolveSerialNumber(entry);
            const serialText = formatSerialNumber(serialNumber)
                || entry.serialNumber
                || entry.entryNumber
                || entry.id;
            return `${tableLabel}-${serialText}`;
        };
        return entries.filter(entry =>
            (getCombinedId(entry).toLowerCase().includes(lowercasedQuery)) ||
            (entry.memberId && entry.memberId.toLowerCase().includes(lowercasedQuery)) ||
            (entry.town && entry.town.toLowerCase().includes(lowercasedQuery)) ||
            (entry.name && entry.name.toLowerCase().includes(lowercasedQuery)) ||
            (entry.phone && entry.phone.includes(lowercasedQuery)) ||
            (entry.amount && Math.abs(entry.amount).toString().includes(lowercasedQuery))
        );
    }, [searchQuery, eventEntries, eventSerialMap]);
    
    return (
         <section className="event-table-container" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="தேடல் (வரிசை எண், மேசை, பெயர்...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <table className="moi-entry-table" style={{marginTop: 0}}>
                <thead>
                    <tr>
                        <th>வரிசை எண்</th>
                        <th>ஊர்</th>
                        <th>பெயர்</th>
                        <th>தொகை</th>
                    </tr>
                </thead>
                 <tbody>
                    {filteredMoiEntries.length > 0 ? filteredMoiEntries.map(entry => (
                        <tr
                            key={entry.id}
                            className={
                                entry.type === 'expense' ? 'expense-row' :
                                entry.type === 'change' ? 'change-row' : ''
                            }
                        >
                            <td>
                                <span>{formatSerialNumber(resolveSerialNumber(entry))
                                    || entry.serialNumber
                                    || entry.entryNumber
                                    || entry.id}
                                </span>
                                <span className="sub-text">{entry.memberId}</span>
                            </td>
                            <td>
                                <span>{entry.town}</span>
                                <span className="sub-text">{entry.street}</span>
                            </td>
                            <td>
                                <span>{entry.relationship} {entry.name}{entry.isMaternalUncle ? ' (*)' : ''}</span>
                                <span className="sub-text">
                                     {entry.type === 'expense'
                                        ? `காரணம்: ${entry.note}`
                                        : entry.type === 'change'
                                        ? `குறிப்பு: ${entry.note}`
                                        : <>
                                            {entry.education && `${entry.education} `}
                                            {entry.profession && `(${entry.profession})`}
                                            {entry.phone && ` - ${entry.phone}`}
                                        </>
                                    }
                                </span>
                                {entry.type !== 'expense' && entry.type !== 'change' && entry.note && <span className="sub-text">குறிப்பு: {entry.note}</span>}
                            </td>
                            <td className="amount-cell">
                                ₹{Math.abs(entry.amount).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                தேடலுக்குப் பொருந்தும் பதிவுகள் எதுவும் இல்லை.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </section>
    );
};


// --- Sub-component for Moi Details View ---
const MoiDetailsView = ({ summary, tableSummary, totalDenominations, handDenominations, perTableDenominations, perTableHandDenominations, missingDenominationEntries, tableDenominationVariance }) => {
    return (
        <>
            <section className="summary-cards">
                <div className="card">
                    <h3>மொத்த மொய் பதிவுகள்</h3>
                    <p className="value">{summary.totalEntries.toLocaleString('en-IN')}</p>
                </div>
                <div className="card">
                    <h3>மொத்த மொய் தொகை</h3>
                    <p className="value">₹ {summary.totalAmount.toLocaleString('en-IN')}</p>
                </div>
            </section>

            <div className="moi-details-layout">
                <main className="moi-details-main">
                    <div className="cash-tally-section" style={{marginBottom: '2rem'}}>
                        <h2>மேசை வாரியான விபரம்</h2>
                         <table className="event-table">
                            <thead>
                                <tr>
                                    <th>மேசை</th>
                                    <th>பதிவு எண்ணிக்கை</th>
                                    <th>மொய் தொகை</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableSummary.length > 0 ? tableSummary.map(table => (
                                    <tr key={table.id}>
                                        <td>{table.name}</td>
                                        <td>{table.count.toLocaleString('en-IN')}</td>
                                        <td>₹ {table.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                )) : (
                                     <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                                            பதிவுகள் எதுவும் இல்லை.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <section className="cash-tally-section">
                        <h2>மேசை வாரியான பணப்பிரிப்பு விபரம்</h2>
                        {(perTableDenominations.length > 0 || perTableHandDenominations.length > 0) ? (
                            <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                                <div 
                                    className="per-table-denomination-grid" 
                                    style={{ 
                                        display: 'flex', 
                                        flexWrap: 'nowrap', 
                                        width: 'max-content',
                                        padding: '4px' // Prevent card shadow clipping
                                    }}
                                >
                                    {Array.from(new Set([
                                        ...perTableDenominations.map(([id]) => id),
                                        ...perTableHandDenominations.map(([id]) => id)
                                    ])).sort((a, b) => {
                                        const numA = parseInt(String(a).replace('table', ''), 10);
                                        const numB = parseInt(String(b).replace('table', ''), 10);
                                        return numA - numB;
                                    }).map((tableId) => {
                                        const data = perTableDenominations.find(([id]) => id === tableId)?.[1] || {
                                            counts: denominations.reduce((acc, note) => ({...acc, [note]: 0}), {}),
                                            totalAmount: 0
                                        };
                                        const handData = perTableHandDenominations.find(([id]) => id === tableId)?.[1] || {
                                            counts: denominations.reduce((acc, note) => ({...acc, [note]: 0}), {}),
                                            totalAmount: 0
                                        };
                                        return (
                                        <div className="table-denomination-card" key={tableId} style={{ flex: '0 0 320px' }}>
                                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                                                <h3 style={{margin:'0'}}>Table {tableId.replace('table', '')}</h3>
                                                <button 
                                                    className="icon-button"
                                                    title="பிரிண்ட்"
                                                    onClick={() => handlePrintSingleTable(tableId)}
                                                    style={{width:'36px', height:'36px'}}
                                                >
                                                    <span className="icon">print</span>
                                                </button>
                                            </div>
                                            <div style={{ fontWeight: 700, marginBottom: '6px' }}>கணினி பணப்பிரிப்பு</div>
                                            <div className="denomination-display-grid vertical">
                                                {denominations.map(note => {
                                                    const count = data.counts[note] || 0;
                                                    const total = count * note;
                                                    return (
                                                        <div className="denomination-display-row" key={`computer-${note}`}>
                                                            <span>{`₹ ${note}`}</span>
                                                            <span>x</span>
                                                            <span>{count.toLocaleString('en-IN')}</span>
                                                            <span>=</span>
                                                            <span>{`₹ ${total.toLocaleString('en-IN')}`}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="table-total-summary">
                                                <span>மொத்தம்:</span>
                                                <span>₹ {data.totalAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ fontWeight: 700, margin: '10px 0 6px' }}>கையில் உள்ள பணப்பிரிப்பு</div>
                                            <div className="denomination-display-grid vertical">
                                                {denominations.map(note => {
                                                    const count = handData.counts[note] || 0;
                                                    const total = count * note;
                                                    return (
                                                        <div className="denomination-display-row" key={`hand-${note}`}>
                                                            <span>{`₹ ${note}`}</span>
                                                            <span>x</span>
                                                            <span>{count.toLocaleString('en-IN')}</span>
                                                            <span>=</span>
                                                            <span>{`₹ ${total.toLocaleString('en-IN')}`}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="table-total-summary">
                                                <span>மொத்தம்:</span>
                                                <span>₹ {handData.totalAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p style={{textAlign: 'center', padding: '2rem'}}>
                                பணப்பிரிப்பு விவரங்கள் எதுவும் இல்லை.
                            </p>
                        )}
                    </section>

                    {/* Variance helper to spot mismatches */}
                    {tableDenominationVariance.length > 0 && (
                        <section className="cash-tally-section" style={{ border: '1px solid #e67e22', background: '#fff7ec' }}>
                            <h2>மேசை தொகை / பணப்பிரிப்பு பொருந்தவில்லை</h2>
                            <table className="event-table">
                                <thead>
                                    <tr>
                                        <th>மேசை</th>
                                        <th>பதிவு தொகை</th>
                                        <th>Denomination தொகை</th>
                                        <th>வித்தியாசம்</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableDenominationVariance.map(row => (
                                        <tr key={row.tableId}>
                                            <td>{row.tableId.replace('table','Table ')}</td>
                                            <td>₹ {row.recorded.toLocaleString('en-IN')}</td>
                                            <td>₹ {row.denomTotal.toLocaleString('en-IN')}</td>
                                            <td style={{ color: row.variance !== 0 ? '#c0392b' : 'inherit' }}>
                                                ₹ {row.variance.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* Entries missing denomination counts */}
                    {missingDenominationEntries.length > 0 && (
                        <section className="cash-tally-section" style={{ border: '1px solid #e74c3c', background: '#fff5f5' }}>
                            <h2>Denomination இல்லை (பதிவுகள்)</h2>
                            <p style={{ marginBottom: '0.5rem', color: '#c0392b' }}>
                                தொகை சேர்க்கப்பட்டுள்ளாலும் denomination உள்ளிடப்படவில்லை; தயவு செய்து திருத்தவும்.
                            </p>
                            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                <table className="event-table">
                                    <thead>
                                        <tr>
                                            <th>மேசை</th>
                                            <th>வரிசை எண்</th>
                                            <th>பெயர்</th>
                                            <th>தொகை</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {missingDenominationEntries.map(entry => (
                                            <tr key={`${entry.table}-${entry.id}`}>
                                                <td>{entry.table?.replace('table','Table ') || '—'}</td>
                                                <td>{entry.id}</td>
                                                <td>
                                                    {entry.name || '—'}
                                                    {entry.memberId ? <span className="sub-text" style={{ display: 'block' }}>{entry.memberId}</span> : null}
                                                </td>
                                                <td className="amount-cell">₹ {Math.abs(entry.amount || 0).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
                
                <aside className="moi-details-sidebar">
                    <section className="cash-tally-section">
                        <h2>கணினி பணப்பிரிப்பு</h2>
                        <div className="table-denomination-card" style={{ backgroundColor: '#fff', border: '1px solid var(--primary-color)'}}>
                             <div className="denomination-display-grid vertical">
                                {denominations.map(note => {
                                    const count = totalDenominations.counts[note] || 0;
                                    const total = count * note;
                                    return (
                                        <div className="denomination-display-row" key={`computer-${note}`}>
                                            <span>{`₹ ${note}`}</span>
                                            <span>x</span>
                                            <span>{count.toLocaleString('en-IN')}</span>
                                            <span>=</span>
                                            <span>{`₹ ${total.toLocaleString('en-IN')}`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="table-total-summary">
                                <span>மொத்தம்:</span>
                                <span>₹ {totalDenominations.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </section>
                    <section className="cash-tally-section" style={{ marginTop: '1rem' }}>
                        <h2>கையில் உள்ள பணப்பிரிப்பு</h2>
                        <div className="table-denomination-card" style={{ backgroundColor: '#fff', border: '1px solid var(--primary-color)'}}>
                             <div className="denomination-display-grid vertical">
                                {denominations.map(note => {
                                    const count = handDenominations.counts[note] || 0;
                                    const total = count * note;
                                    return (
                                        <div className="denomination-display-row" key={`hand-${note}`}>
                                            <span>{`₹ ${note}`}</span>
                                            <span>x</span>
                                            <span>{count.toLocaleString('en-IN')}</span>
                                            <span>=</span>
                                            <span>{`₹ ${total.toLocaleString('en-IN')}`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="table-total-summary">
                                <span>மொத்தம்:</span>
                                <span>₹ {handDenominations.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </>
    );
};


// --- Sub-component for Maternal Uncle View ---
const MaternalUncleView = ({ moiEntries, setMoiEntries, event }) => {
    const [uncleEntries, setUncleEntries] = useState([]);

    useEffect(() => {
        // CRITICAL: Filter by eventId AND isMaternalUncle
        setUncleEntries(moiEntries.filter(e => 
            e.isMaternalUncle && e.eventId === event.id
        ));
    }, [moiEntries, event.id]);

    const handleMove = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === uncleEntries.length - 1)) {
            return;
        }
        const newEntries = [...uncleEntries];
        const [movedItem] = newEntries.splice(index, 1);
        newEntries.splice(index + direction, 0, movedItem);
        setUncleEntries(newEntries);
    };

    const handleSaveOrder = async () => {
        const nonUncleEntries = moiEntries.filter(e => !e.isMaternalUncle);
        const updatedFullList = [...uncleEntries, ...nonUncleEntries];
        await setMoiEntries(updatedFullList);
        alert('புதிய வரிசை சேமிக்கப்பட்டது.');
    };

    return (
        <section className="event-table-container" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h2 style={{color: 'var(--primary-color)'}}>தாய்மாமான் வரிசை</h2>
                <button className="button" onClick={handleSaveOrder}>வரிசையைச் சேமி</button>
            </div>
            <table className="moi-entry-table">
                <thead>
                    <tr>
                        <th>புதிய வரிசை</th>
                        <th>பழைய வரிசை</th>
                        <th>பெயர்</th>
                        <th>ஊர்</th>
                        <th>தொகை</th>
                        <th>செயல்</th>
                    </tr>
                </thead>
                <tbody>
                    {uncleEntries.length > 0 ? uncleEntries.map((entry, index) => (
                        <tr key={entry.id}>
                            <td>{index + 1}</td>
                            <td>{entry.id}</td>
                            <td>{entry.name}</td>
                            <td>{entry.town}</td>
                            <td className="amount-cell">₹{entry.amount.toLocaleString('en-IN')}</td>
                            <td className="table-actions">
                                <button className="icon-button" onClick={() => handleMove(index, -1)} disabled={index === 0}>
                                    <span className="icon">arrow_upward</span>
                                </button>
                                <button className="icon-button" onClick={() => handleMove(index, 1)} disabled={index === uncleEntries.length - 1}>
                                    <span className="icon">arrow_downward</span>
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>தாய்மாமான் பதிவுகள் எதுவும் இல்லை.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
};


// --- Sub-component for Town Verification View ---
const TownVerificationView = ({ moiEntries, setMoiEntries, event }) => {
    const [editingTown, setEditingTown] = useState(null); // { oldName: '...', newName: '...' }

    const uniqueTowns = useMemo(() => {
        const townMap = new Map();
        // CRITICAL: Filter by eventId first
        const eventEntries = moiEntries.filter(entry => entry.eventId === event.id);
        
        eventEntries.forEach(entry => {
            const townName = entry.town || 'பெயரிடப்படாதது';
            const current = townMap.get(townName) || { count: 0, ids: [] };
            current.count++;
            current.ids.push(entry.id);
            townMap.set(townName, current);
        });
        return Array.from(townMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a,b) => a.name.localeCompare(b.name));
    }, [moiEntries, event.id]);

    const handleEdit = (townName) => {
        setEditingTown({ oldName: townName, newName: townName });
    };

    const handleSave = async () => {
        if (!editingTown || !editingTown.newName || editingTown.newName.trim() === '' || editingTown.oldName === editingTown.newName) {
            setEditingTown(null);
            return;
        }
        
        const oldName = editingTown.oldName === 'பெயரிடப்படாதது' ? '' : editingTown.oldName;
        const newName = editingTown.newName.trim();
        const updatedEntries = moiEntries.map(entry => 
            (entry.town || '') === oldName ? { ...entry, town: newName } : entry
        );
        await setMoiEntries(updatedEntries);
        setEditingTown(null);
    };

    return (
         <section className="event-table-container" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <h2 style={{color: 'var(--primary-color)', marginBottom: '1.5rem'}}>ஊர் சரிபார்த்தல்</h2>
             <table className="event-table">
                <thead>
                    <tr>
                        <th>ஊர் பெயர்</th>
                        <th>பதிவு எண்ணிக்கை</th>
                        <th>செயல்</th>
                    </tr>
                </thead>
                <tbody>
                    {uniqueTowns.map(({ name, count }) => (
                        <tr key={name}>
                            <td>
                                {editingTown?.oldName === name ? (
                                    <input 
                                        type="text" 
                                        value={editingTown.newName} 
                                        onChange={(e) => setEditingTown(p => ({...p, newName: e.target.value}))}
                                        className="search-input"
                                        autoFocus
                                    />
                                ) : (
                                    name
                                )}
                            </td>
                            <td>{count}</td>
                            <td className="table-actions">
                                {editingTown?.oldName === name ? (
                                    <>
                                        <button className="icon-button" onClick={handleSave}><span className="icon">save</span></button>
                                        <button className="icon-button delete" onClick={() => setEditingTown(null)}><span className="icon">close</span></button>
                                    </>
                                ) : (
                                    <button className="icon-button" onClick={() => handleEdit(name)}><span className="icon">edit</span></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </section>
    );
};


// --- Main MasterDashboard Component ---
export default function MasterDashboard({ event, settings, moiEntries, setMoiEntries, onBack, reloadAllData, loggedInTable, onSyncMembers, isSyncingMembers }) {
    const [activeView, setActiveView] = useState('all'); // 'all', 'details', 'uncle', 'town'
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBatchPrinting, setIsBatchPrinting] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    // Filter entries based on EVENT ID ONLY (Master view must see all tables)
    const filteredMoiEntries = useMemo(() => {
        // CRITICAL: Filter by eventId to prevent cross-event data leakage
        return moiEntries.filter(entry => entry.eventId === event.id);
    }, [moiEntries, event.id]);

    // --- Data processing for MoiDetailsView and Print ---
    const summary = useMemo(() => {
        const totalEntries = filteredMoiEntries.filter(e => !e.type).length;
        const totalAmount = filteredMoiEntries.reduce((sum, entry) => {
            if (entry.type === 'expense' || entry.type === 'change') return sum;
            return sum + entry.amount;
        }, 0);
        return { totalEntries, totalAmount };
    }, [filteredMoiEntries]);

    const tableSummary = useMemo(() => {
        const summaryMap = new Map();
        filteredMoiEntries.forEach(entry => {
            if (entry.table) {
                if (!summaryMap.has(entry.table)) {
                    summaryMap.set(entry.table, {
                        name: `Table ${entry.table.replace('table', '')}`,
                        id: entry.table,
                        count: 0,
                        personCount: 0,
                        amount: 0,
                    });
                }
                const tableData = summaryMap.get(entry.table);
                if (!entry.type) {
                    tableData.count += 1;
                    tableData.personCount += 1;
                    tableData.amount += entry.amount;
                }
            }
        });
        return Array.from(summaryMap.values()).sort((a, b) => {
            const numA = parseInt(a.id.replace('table', ''), 10);
            const numB = parseInt(b.id.replace('table', ''), 10);
            return numA - numB;
        });
    }, [filteredMoiEntries]);

    const resolveHandDenominations = (entry) => {
        if (!entry) return null;
        if (entry.receivedDenominations) return entry.receivedDenominations;
        if (entry.denominations && entry.givenDenominations) {
            const merged = {};
            denominations.forEach(note => {
                const net = parseInt(entry.denominations?.[note], 10) || 0;
                const given = parseInt(entry.givenDenominations?.[note], 10) || 0;
                const received = net + given;
                if (received !== 0) merged[note] = received;
            });
            return merged;
        }
        return entry.denominations || null;
    };

    const getStoredTally = (tableId) => {
        if (typeof window === 'undefined') return null;
        const eventId = event?.id || 'event';
        const key = `moibook_tally_${eventId}_${tableId}`;
        try {
            const raw = window.localStorage?.getItem?.(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const normalized = {};
            denominations.forEach(note => {
                const value = parsed?.[note];
                const count = parseInt(value, 10) || 0;
                normalized[note] = count;
            });
            return normalized;
        } catch (err) {
            return null;
        }
    };

    const totalDenominations = useMemo(() => {
        const counts = denominations.reduce((acc, note) => ({ ...acc, [note]: 0 }), {});
        // Only include normal moi entries; skip expense/change so cash matches moi amount
        filteredMoiEntries.forEach(entry => {
            if (entry.type === 'expense' || entry.type === 'change') return;
            if (entry.denominations) {
                denominations.forEach(note => {
                    const count = parseInt(entry.denominations[note], 10) || 0;
                    counts[note] += count;
                });
            }
        });
        const totalAmount = denominations.reduce((sum, note) => sum + (counts[note] * note), 0);
        return { counts, totalAmount };
    }, [filteredMoiEntries]);

    const handDenominations = useMemo(() => {
        const counts = denominations.reduce((acc, note) => ({ ...acc, [note]: 0 }), {});
        const tableIds = tableSummary.map(t => t.id);
        let hasStored = false;

        tableIds.forEach((tableId) => {
            const stored = getStoredTally(tableId);
            if (stored) {
                hasStored = true;
                denominations.forEach(note => {
                    counts[note] += stored[note] || 0;
                });
            }
        });

        if (!hasStored) {
            filteredMoiEntries.forEach(entry => {
                if (entry.type === 'expense' || entry.type === 'change') return;
                const source = resolveHandDenominations(entry);
                if (source) {
                    denominations.forEach(note => {
                        const count = parseInt(source[note], 10) || 0;
                        counts[note] += count;
                    });
                }
            });
        }

        const totalAmount = denominations.reduce((sum, note) => sum + (counts[note] * note), 0);
        return { counts, totalAmount };
    }, [filteredMoiEntries, tableSummary]);

    const perTableDenominations = useMemo(() => {
        const tableDenomMap = new Map();
        filteredMoiEntries.forEach(entry => {
            if (entry.type === 'expense' || entry.type === 'change') return;
            if (entry.table && entry.denominations) {
                if (!tableDenomMap.has(entry.table)) {
                    tableDenomMap.set(entry.table, {
                        counts: denominations.reduce((acc, note) => ({...acc, [note]: 0}), {}),
                        totalAmount: 0
                    });
                }
                const tableData = tableDenomMap.get(entry.table);
                denominations.forEach(note => {
                    const count = parseInt(entry.denominations[note], 10) || 0;
                    tableData.counts[note] += count;
                });
                // Recalculate total amount from net denominations for accuracy
                tableData.totalAmount = denominations.reduce((sum, note) => sum + (tableData.counts[note] * note), 0);
            }
        });
        return Array.from(tableDenomMap.entries()).sort(([tableA], [tableB]) => {
            const numA = parseInt(tableA.replace('table', ''), 10);
            const numB = parseInt(tableB.replace('table', ''), 10);
            return numA - numB;
        });
    }, [filteredMoiEntries]);

    const perTableHandDenominations = useMemo(() => {
        const tableDenomMap = new Map();
        const tableIds = tableSummary.map(t => t.id);

        tableIds.forEach((tableId) => {
            const stored = getStoredTally(tableId);
            const counts = denominations.reduce((acc, note) => ({...acc, [note]: 0}), {});
            if (stored) {
                denominations.forEach(note => {
                    counts[note] = stored[note] || 0;
                });
            }
            tableDenomMap.set(tableId, {
                counts,
                totalAmount: denominations.reduce((sum, note) => sum + (counts[note] * note), 0)
            });
        });

        if (!tableIds.length) {
            filteredMoiEntries.forEach(entry => {
                if (entry.type === 'expense' || entry.type === 'change') return;
                const source = resolveHandDenominations(entry);
                if (entry.table && source) {
                    if (!tableDenomMap.has(entry.table)) {
                        tableDenomMap.set(entry.table, {
                            counts: denominations.reduce((acc, note) => ({...acc, [note]: 0}), {}),
                            totalAmount: 0
                        });
                    }
                    const tableData = tableDenomMap.get(entry.table);
                    denominations.forEach(note => {
                        const count = parseInt(source[note], 10) || 0;
                        tableData.counts[note] += count;
                    });
                    tableData.totalAmount = denominations.reduce((sum, note) => sum + (tableData.counts[note] * note), 0);
                }
            });
        }

        return Array.from(tableDenomMap.entries()).sort(([tableA], [tableB]) => {
            const numA = parseInt(tableA.replace('table', ''), 10);
            const numB = parseInt(tableB.replace('table', ''), 10);
            return numA - numB;
        });
    }, [filteredMoiEntries, tableSummary]);

    // Find entries that are missing denomination breakdown (root cause for total mismatches)
    const missingDenominationEntries = useMemo(() => {
        return filteredMoiEntries
            .filter(entry => {
                if (!entry || entry.type === 'expense' || entry.type === 'change') return false;
                const denom = entry.denominations || {};
                const hasPositive = denominations.some(note => {
                    const val = parseInt(denom[note], 10);
                    return Number.isFinite(val) && val > 0;
                });
                return !hasPositive;
            })
            .map(entry => ({
                id: entry.id,
                table: entry.table || '—',
                amount: entry.amount || 0,
                name: entry.name || '',
                memberId: entry.memberId || ''
            }));
    }, [filteredMoiEntries]);

    // Calculate table-wise variance between recorded amount and denomination total
    const tableDenominationVariance = useMemo(() => {
        if (!tableSummary.length || !perTableDenominations.length) return [];
        const tableAmountMap = new Map();
        tableSummary.forEach(t => tableAmountMap.set(t.id, t.amount || 0));
        return perTableDenominations
            .map(([tableId, data]) => {
                const recorded = tableAmountMap.get(tableId) || 0;
                const denomTotal = data.totalAmount || 0;
                return {
                    tableId,
                    recorded,
                    denomTotal,
                    variance: recorded - denomTotal
                };
            })
            .filter(row => row.variance !== 0);
    }, [tableSummary, perTableDenominations]);
    
    const renderDenominationPrint = (denominationData, perTableData, tableSummaryData) => {
        try {
            // Create iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.setAttribute('title', 'Denomination Print Frame');
            
            document.body.appendChild(iframe);

            // Render the DenominationBill component to HTML
            const denominationBillHTML = ReactDOMServer.renderToString(
                React.createElement(DenominationBill, {
                    denominations: denominationData,
                    event: event,
                    moiEntries: filteredMoiEntries,
                    tableSummary: tableSummaryData,
                    perTableDenominations: perTableData
                })
            );

            // Create the full HTML for printing
            const printHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Denomination Bill - ${event.eventName}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @media print {
                            @page {
                                size: 80mm auto;
                                margin: 2mm;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                        body {
                            font-family: 'Courier New', 'Noto Sans Tamil', monospace;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                    </style>
                </head>
                <body>
                    ${denominationBillHTML}
                </body>
                </html>
            `;

            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(printHtml);
            iframeDoc.close();

            // Wait for fonts to load and then print
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    
                    // Clean up after printing
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 500);
            };

        } catch (error) {
            console.error('Error printing denomination bill:', error);
            alert('அச்சடிப்பதில் பிழை ஏற்பட்டது');
        }
    };

    const handlePrintDenominations = () => {
        // Prepare denomination data for ALL tables
        const denominationData = {};
        denominations.forEach(note => {
            const count = handDenominations.counts[note] || 0;
            if (count > 0) {
                denominationData[note] = count;
            }
        });
        renderDenominationPrint(denominationData, perTableHandDenominations, tableSummary);
    };

    const handlePrintSingleTable = (tableId) => {
        const tableEntry = perTableHandDenominations.find(([id]) => id === tableId);
        if (!tableEntry) {
            alert('இந்த மேசைக்கான பணப்பிரிப்பு இல்லை.');
            return;
        }
        const [id, data] = tableEntry;
        const denominationData = {};
        denominations.forEach(note => {
            const count = data.counts[note] || 0;
            if (count > 0) {
                denominationData[note] = count;
            }
        });
        const tableSummaryData = tableSummary.filter(t => t.id === id);
        renderDenominationPrint(denominationData, [tableEntry], tableSummaryData);
    };

    // Tamil to English transliteration helper
    const transliterateTamil = (tamilText) => {
        const tamilToEnglish = {
            'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'e', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'o', 'ஔ': 'au',
            'க': 'ka', 'ங': 'nga', 'ச': 'cha', 'ஞ': 'nja', 'ட': 'ta', 'ண': 'na', 'த': 'tha', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra', 'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na',
            'கா': 'kaa', 'கி': 'ki', 'கீ': 'kee', 'கு': 'ku', 'கூ': 'koo', 'கெ': 'ke', 'கே': 'ke', 'கை': 'kai', 'கோ': 'ko', 'கௌ': 'kau',
            'சா': 'chaa', 'சி': 'chi', 'சீ': 'chee', 'சு': 'chu', 'சூ': 'choo', 'செ': 'che', 'சே': 'che', 'சை': 'chai', 'சோ': 'cho', 'சௌ': 'chau',
            'தா': 'thaa', 'தி': 'thi', 'தீ': 'thee', 'து': 'thu', 'தூ': 'thoo', 'தெ': 'the', 'தே': 'the', 'தை': 'thai', 'தோ': 'tho', 'தௌ': 'thau',
            'பா': 'paa', 'பி': 'pi', 'பீ': 'pee', 'பு': 'pu', 'பூ': 'poo', 'பெ': 'pe', 'பே': 'pe', 'பை': 'pai', 'போ': 'po', 'பௌ': 'pau',
            'மா': 'maa', 'மி': 'mi', 'மீ': 'mee', 'மு': 'mu', 'மூ': 'moo', 'மெ': 'me', 'மே': 'me', 'மை': 'mai', 'மோ': 'mo', 'மௌ': 'mau',
            'ரா': 'raa', 'ரி': 'ri', 'ரீ': 'ree', 'ரு': 'ru', 'ரூ': 'roo', 'ரெ': 're', 'ரே': 're', 'ரை': 'rai', 'ரோ': 'ro', 'ரௌ': 'rau',
            'ஜ': 'ja', 'ஜா': 'jaa', 'ஜி': 'ji', 'ஜீ': 'jee', 'ஜு': 'ju', 'ஜூ': 'joo', 'ஜெ': 'je', 'ஜே': 'je', 'ஜை': 'jai', 'ஜோ': 'jo',
            'ன்': 'n', 'ம்': 'm', 'ர்': 'r', 'ல்': 'l', 'ள்': 'l', 'ண்': 'n', 'ற்': 'r', 'க்': 'k', 'ப்': 'p', 'த்': 'th', 'ச்': 'ch',
            'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo', 'ெ': 'e', 'ே': 'e', 'ை': 'ai', 'ொ': 'o', 'ோ': 'o', 'ௌ': 'au', '்': ''
        };
        
        let result = '';
        for (let i = 0; i < tamilText.length; i++) {
            // Try 2-character combination first
            const twoChar = tamilText.substring(i, i + 2);
            if (tamilToEnglish[twoChar]) {
                result += tamilToEnglish[twoChar];
                i++; // Skip next character
            } else {
                // Try single character
                const oneChar = tamilText[i];
                result += tamilToEnglish[oneChar] || oneChar;
            }
        }
        return result;
    };

    const handleExportPdf = async () => {
        // Auto filename: EventID_OrganizerName_Date (ASCII only for browser compatibility)
        const eventId = event.id || '0001';
        const organizerName = event.eventOrganizer || event.eventHead || 'Organizer';
        // Transliterate Tamil to English and take first name
        const transliteratedName = transliterateTamil(organizerName);
        const firstName = transliteratedName.split(/[-\s]/)[0].trim();
        const eventDate = event.date ? event.date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
        const fileName = `MoiReport_${eventId}_${firstName}_${eventDate}`;
        
        // CRITICAL: Use filteredMoiEntries to export only current event's data
        await exportTamilPdf(filteredMoiEntries, event, fileName, settings);
    };

    const handleExportExcel = () => {
        // Auto filename: EventID_OrganizerName_Date (ASCII only for browser compatibility)
        const eventId = event.id || '0001';
        const organizerName = event.eventOrganizer || event.eventHead || 'Organizer';
        // Transliterate Tamil to English and take first name
        const transliteratedName = transliterateTamil(organizerName);
        const firstName = transliteratedName.split(/[-\s]/)[0].trim();
        const eventDate = event.date ? event.date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
        const fileName = `MoiReport_${eventId}_${firstName}_${eventDate}`;
        
        // CRITICAL: Use filteredMoiEntries to export only current event's data
        exportToExcel(filteredMoiEntries, fileName);
    };

    const handleExportWord = async () => {
        const fileName = `MoiReport_${event.eventName.replace(/\s/g, '_')}_${event.date}`;
        // CRITICAL: Use filteredMoiEntries to export only current event's data
        await exportTamilWord(filteredMoiEntries, event, fileName);
    };

    const handleExportTownBasedPdf = async () => {
        const fileName = `MoiReport_TownBased_${event.eventName.replace(/\s/g, '_')}_${event.date}`;
        // CRITICAL: Use filteredMoiEntries to export only current event's data
        await exportTownBasedPdf(filteredMoiEntries, event, fileName, settings);
    };

    const handleShareWhatsAppPdf = async () => {
        const eventId = event.id || '0001';
        const organizerName = event.eventOrganizer || event.eventHead || 'Organizer';
        const transliteratedName = transliterateTamil(organizerName);
        const firstName = transliteratedName.split(/[-\s]/)[0].trim();
        const eventDate = event.date ? event.date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
        const fileName = `MoiReport_${eventId}_${firstName}_${eventDate}`;

        const result = await exportTamilPdfForShare(filteredMoiEntries, event, fileName, settings);
        if (!result) return;

        const { blob, fileName: pdfFileName } = result;
        const file = new File([blob], pdfFileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Moi Report PDF',
                    text: 'மொய் அறிக்கை PDF'
                });
                return;
            } catch (err) {
                console.warn('Share cancelled or failed', err);
            }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const message = encodeURIComponent('மொய் அறிக்கை PDF தயார். Whatsapp‑ல் attach செய்து அனுப்பவும்.');
        const inputNumber = window.prompt('Client WhatsApp Mobile Number (எடுத்துக்காட்டு: 9876543210 அல்லது +919876543210):');
        if (!inputNumber) {
            alert('மொபைல் நம்பர் இல்லாமல் WhatsApp அனுப்ப முடியாது.');
            return;
        }
        const digits = inputNumber.replace(/\D/g, '');
        if (!digits) {
            alert('சரியான மொபைல் நம்பர் கொடுக்கவும்.');
            return;
        }
        const normalized = digits.length === 10 ? `91${digits}` : digits;

        const appUrl = `whatsapp://send?phone=${normalized}&text=${message}`;
        const webUrl = `https://wa.me/${normalized}?text=${message}`;

        // Try app protocol first, then always fall back to web after a short delay
        try {
            window.location.href = appUrl;
        } catch (err) {
            console.warn('WhatsApp app open failed', err);
        }

        setTimeout(() => {
            window.open(webUrl, '_blank', 'noopener');
        }, 600);
        alert('PDF download ஆனது. Whatsapp‑ல் Attach செய்து அனுப்புங்கள்.');
    };

    const handleBatchPrintBills = async () => {
        const printableEntries = filteredMoiEntries.filter(e => !e.type || (e.type !== 'expense' && e.type !== 'change'));
        if (!printableEntries.length) {
            alert('பிரிண்ட் செய்ய மொய் பதிவுகள் இல்லை.');
            return;
        }
        const printerName = window.prompt('பிரிண்டர் பெயர் (Windows Printer Name):');
        if (!printerName || !printerName.trim()) {
            return;
        }
        setIsBatchPrinting(true);
        setBatchProgress({ current: 0, total: printableEntries.length });
        try {
            const results = await batchPrintAllBills({
                entries: printableEntries,
                event,
                printerName: printerName.trim(),
                onProgress: ({ current }) => setBatchProgress({ current, total: printableEntries.length })
            });
            const failures = results.filter(r => r.status !== 'ok');
            if (failures.length) {
                alert(`பிரிண்ட் முடிந்தது, ஆனால் ${failures.length} பதிவுகள் தோல்வி.`);
            } else {
                alert('அனைத்து மொய் பில்களும் பிரிண்ட் அனுப்பப்பட்டது.');
            }
        } catch (err) {
            alert(`பிரிண்ட் தோல்வி: ${err.message}`);
        } finally {
            setIsBatchPrinting(false);
        }
    };

    if (!event) {
        return (
            <div className="event-page">
                <p>விழா தேர்ந்தெடுக்கப்படவில்லை.</p>
                <button className="icon-button" onClick={onBack}><span className="icon">arrow_back</span></button>
            </div>
        );
    }

    const renderActiveView = () => {
        switch(activeView) {
            case 'uncle':
                return <MaternalUncleView moiEntries={moiEntries} setMoiEntries={setMoiEntries} event={event} />;
            case 'town':
                return <TownVerificationView moiEntries={moiEntries} setMoiEntries={setMoiEntries} event={event} />;
            case 'details':
                return <MoiDetailsView 
                    summary={summary}
                    tableSummary={tableSummary}
                    totalDenominations={totalDenominations}
                    handDenominations={handDenominations}
                    perTableDenominations={perTableDenominations}
                    perTableHandDenominations={perTableHandDenominations}
                    missingDenominationEntries={missingDenominationEntries}
                    tableDenominationVariance={tableDenominationVariance}
                />;
            case 'all':
            default:
                return <AllEntriesView moiEntries={filteredMoiEntries} event={event} />;
        }
    };

    return (
        <div className="moi-details-page">
            <section className="event-subheader">
                <div className="page-header-left">
                    <button className="icon-button back-button" onClick={onBack} aria-label="Back">
                        <span className="icon">arrow_back</span>
                    </button>
                    <h2>Master Dashboard - {event.eventName}</h2>
                </div>
                <div className="header-actions">
                     <button className="icon-button" aria-label="Export PDF" onClick={handleExportPdf}>
                        <span className="icon">picture_as_pdf</span>
                    </button>
                     <button className="icon-button" aria-label="Export Word" onClick={handleExportWord}>
                        <span className="icon">description</span>
                    </button>
                     <button className="icon-button" aria-label="Export Excel" onClick={handleExportExcel}>
                        <span className="icon">table_view</span>
                    </button>
                     <button className="icon-button" aria-label="Export Town-based PDF" onClick={handleExportTownBasedPdf} title="ஊர் வாரி PDF அறிக்கை">
                        <span className="icon">location_city</span>
                    </button>
                    <button className="whatsapp-button" aria-label="Send WhatsApp PDF" onClick={handleShareWhatsAppPdf} title="WhatsApp மூலம் PDF அனுப்பு">
                        <span className="icon">send</span>
                        <span>WhatsApp அனுப்பு</span>
                    </button>
                     <button className="icon-button" aria-label="Print Denomination Bill" onClick={handlePrintDenominations}>
                        <span className="icon">receipt_long</span>
                    </button>
                    <button
                        className="icon-button"
                        aria-label="Batch Print All Moi Bills"
                        onClick={handleBatchPrintBills}
                        disabled={isBatchPrinting}
                        title="அனைத்து மொய் பில்களையும் பிரிண்ட் செய்"
                    >
                        <span className="icon">print</span>
                    </button>
                    <button
                        className="icon-button"
                        aria-label="Upload Members"
                        onClick={() => onSyncMembers?.()}
                        disabled={isSyncingMembers}
                        title={isSyncingMembers ? 'உறுப்பினர் பதிவேற்றம் நடக்கிறது...' : 'மொய் பதிவுகளிலிருந்து உறுப்பினர்களை பதிவேற்று'}
                    >
                        <span className="icon">cloud_upload</span>
                    </button>

                     <div className="header-menu-container">
                        <button className="icon-button" aria-label="Menu" onClick={() => setIsMenuOpen(prev => !prev)}>
                            <span className="icon">menu</span>
                        </button>
                        {isMenuOpen && (
                            <div className="header-menu-dropdown">
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('all'); setIsMenuOpen(false); }}>
                                    அனைத்து பதிவுகளும்
                                </a>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('details'); setIsMenuOpen(false); }}>
                                    மொய் விபரம்
                                </a>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('uncle'); setIsMenuOpen(false); }}>
                                    தாய்மாமான் வரிசை
                                </a>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('town'); setIsMenuOpen(false); }}>
                                    ஊர் சரிபார்த்தல்
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            {isBatchPrinting && (
                <div style={{marginTop: '8px', textAlign: 'right', fontSize: '12px', color: '#2c3e50'}}>
                    பிரிண்ட்: {batchProgress.current} / {batchProgress.total}
                </div>
            )}
            
            {renderActiveView()}

             <footer className="footer" style={{position: 'relative', bottom: 'auto', marginTop: '2rem'}}>
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}