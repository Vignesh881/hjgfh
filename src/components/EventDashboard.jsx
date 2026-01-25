/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect } from 'react';
import EditEntryModal from './EditEntryModal';

const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];

// --- Sub-component for All Entries View ---
const AllEntriesView = ({ moiEntries, onEditEntry }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMoiEntries = useMemo(() => {
        if (!searchQuery) return moiEntries;
        const lowercasedQuery = searchQuery.toLowerCase();

        const getCombinedId = (entry) =>
            `${entry.table ? entry.table.replace('table', 'T').toUpperCase() : 'T?'}-${entry.id}`;

        return moiEntries.filter(entry =>
            (getCombinedId(entry).toLowerCase().includes(lowercasedQuery)) ||
            (entry.memberId && entry.memberId.toLowerCase().includes(lowercasedQuery)) ||
            (entry.town && entry.town.toLowerCase().includes(lowercasedQuery)) ||
            (entry.name && entry.name.toLowerCase().includes(lowercasedQuery)) ||
            (entry.phone && entry.phone.includes(lowercasedQuery)) ||
            (entry.amount && Math.abs(entry.amount).toString().includes(lowercasedQuery))
        );
    }, [searchQuery, moiEntries]);
    
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
                        <th>திருத்து</th>
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
                                <span>{`${entry.table ? entry.table.replace('table', 'T').toUpperCase() : 'T?'}-${entry.id}`}</span>
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
                            <td>
                                <button
                                    className="icon-button"
                                    aria-label="Edit entry"
                                    title="பதிவை திருத்து"
                                    onClick={() => onEditEntry?.(entry)}
                                >
                                    <span className="icon">edit</span>
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
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
const MoiDetailsView = ({ summary, tableSummary, totalDenominations, perTableDenominations }) => {
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
                        {perTableDenominations.length > 0 ? (
                            <div className="event-table-container">
                                <table className="event-table denomination-summary-table">
                                    <thead>
                                        <tr>
                                            <th>பணப்பிரிப்பு</th>
                                            {perTableDenominations.map(([tableId]) => (
                                                <th key={tableId}>மேசை {tableId.replace('table', '')}</th>
                                            ))}
                                            <th>மொத்தம்</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {denominations.map(note => (
                                            <tr key={note}>
                                                <td>₹ {note}</td>
                                                {perTableDenominations.map(([tableId, data]) => (
                                                    <td key={`${tableId}-${note}`}>{data.counts[note].toLocaleString('en-IN')}</td>
                                                ))}
                                                <td>{totalDenominations.counts[note].toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th>மொத்த தொகை</th>
                                            {perTableDenominations.map(([tableId, data]) => (
                                                <th key={tableId}>₹ {data.totalAmount.toLocaleString('en-IN')}</th>
                                            ))}
                                            <th>₹ {totalDenominations.totalAmount.toLocaleString('en-IN')}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <p style={{textAlign: 'center', padding: '2rem'}}>
                                பணப்பிரிப்பு விவரங்கள் எதுவும் இல்லை.
                            </p>
                        )}
                    </section>
                </main>
                
                <aside className="moi-details-sidebar">
                    <section className="cash-tally-section">
                        <h2>மொத்த பணப்பிரிப்பு விபரம்</h2>
                        <div className="table-denomination-card" style={{ backgroundColor: '#fff', border: '1px solid var(--primary-color)'}}>
                             <div className="denomination-display-grid vertical">
                                {denominations.map(note => {
                                    const count = totalDenominations.counts[note] || 0;
                                    const total = count * note;
                                    return (
                                        <div className="denomination-display-row" key={note}>
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
                </aside>
            </div>
        </>
    );
};


// --- Sub-component for Maternal Uncle View ---
const MaternalUncleView = ({ moiEntries, setMoiEntries }) => {
    const [uncleEntries, setUncleEntries] = useState([]);

    useEffect(() => {
        setUncleEntries(moiEntries.filter(e => e.isMaternalUncle));
    }, [moiEntries]);

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
        // Create a map of the new order for uncle entries for efficient lookup
        const uncleOrderMap = new Map(uncleEntries.map((entry, index) => [entry.id, index]));
        
        // Create a new sorted array
        const updatedFullList = [...moiEntries].sort((a, b) => {
            const aIsUncle = uncleOrderMap.has(a.id);
            const bIsUncle = uncleOrderMap.has(b.id);
            
            if (aIsUncle && bIsUncle) {
                // Both are uncles, sort by new order
                return uncleOrderMap.get(a.id) - uncleOrderMap.get(b.id);
            }
            if (aIsUncle) return -1; // a is uncle, b is not, so a comes first
            if (bIsUncle) return 1;  // b is uncle, a is not, so b comes first
            
            // Neither are uncles, maintain their original relative order (or sort by ID)
            return parseInt(a.id) - parseInt(b.id);
        });

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
const TownVerificationView = ({ moiEntries, setMoiEntries }) => {
    const [editingTown, setEditingTown] = useState(null); // { oldName: '...', newName: '...' }

    const uniqueTowns = useMemo(() => {
        const townMap = new Map();
        moiEntries.forEach(entry => {
            const townName = entry.town || 'பெயரிடப்படாதது';
            if (entry.type) return; // Exclude expense/change entries from this utility
            const current = townMap.get(townName) || { count: 0, ids: [] };
            current.count++;
            current.ids.push(entry.id);
            townMap.set(townName, current);
        });
        return Array.from(townMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a,b) => a.name.localeCompare(b.name));
    }, [moiEntries]);

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


// --- Main EventDashboard Component ---
export default function EventDashboard({ eventId, events, moiEntries, setMoiEntries, onBack, towns = [], people = [], members = [], addOrUpdateMember }) {
    const [activeView, setActiveView] = useState('all'); // 'all', 'details', 'uncle', 'town'
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [newMember, setNewMember] = useState({
        memberCode: '',
        baseName: '',
        initial: '',
        phone: '',
        town: '',
        street: '',
        relationshipName: '',
        relationshipType: 'son',
        education: '',
        profession: '',
        note: '',
        isMaternalUncle: false,
    });
    
    const event = useMemo(() => {
        return events.find(e => e.id === eventId);
    }, [eventId, events]);

    // Auto-fill member code when opening add modal
    useEffect(() => {
        if (isAddMemberOpen) {
            const nextId = members.reduce((max, m) => Math.max(max, parseInt(m.id, 10) || 0), 0) + 1;
            const nextCode = nextId.toString().padStart(4, '0');
            setNewMember(prev => ({
                ...prev,
                memberCode: nextCode,
                relationshipType: prev.relationshipType || 'son',
            }));
        }
    }, [isAddMemberOpen, members]);

    // CRITICAL: Filter entries by eventId to prevent cross-event data leakage
    const filteredMoiEntries = useMemo(() => {
        return moiEntries.filter(entry => entry.eventId === eventId);
    }, [moiEntries, eventId]);

    // --- Data processing for MoiDetailsView and Print ---
    const summary = useMemo(() => {
        const totalEntries = filteredMoiEntries.filter(e => !e.type).length;
        const totalAmount = filteredMoiEntries.reduce((sum, entry) => sum + entry.amount, 0);
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
                        amount: 0,
                    });
                }
                const tableData = summaryMap.get(entry.table);
                if (!entry.type) {
                    tableData.count += 1;
                }
                tableData.amount += entry.amount;
            }
        });
        return Array.from(summaryMap.values()).sort((a, b) => {
            const numA = parseInt(a.id.replace('table', ''), 10);
            const numB = parseInt(b.id.replace('table', ''), 10);
            return numA - numB;
        });
    }, [filteredMoiEntries]);

    const totalDenominations = useMemo(() => {
        const counts = denominations.reduce((acc, note) => ({ ...acc, [note]: 0 }), {});
        filteredMoiEntries.forEach(entry => {
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

    const perTableDenominations = useMemo(() => {
        const tableDenomMap = new Map();
        filteredMoiEntries.forEach(entry => {
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
                tableData.totalAmount = denominations.reduce((sum, note) => sum + (tableData.counts[note] * note), 0);
            }
        });
        return Array.from(tableDenomMap.entries()).sort(([tableA], [tableB]) => {
            const numA = parseInt(tableA.replace('table', ''), 10);
            const numB = parseInt(tableB.replace('table', ''), 10);
            return numA - numB;
        });
    }, [filteredMoiEntries]);

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
                return <MaternalUncleView moiEntries={filteredMoiEntries} setMoiEntries={setMoiEntries} />;
            case 'town':
                return <TownVerificationView moiEntries={filteredMoiEntries} setMoiEntries={setMoiEntries} />;
            case 'details':
                return <MoiDetailsView 
                    summary={summary}
                    tableSummary={tableSummary}
                    totalDenominations={totalDenominations}
                    perTableDenominations={perTableDenominations}
                />;
            case 'all':
            default:
                return <AllEntriesView moiEntries={filteredMoiEntries} onEditEntry={handleEditEntry} />;
        }
    };

    const handleEditEntry = (entry) => {
        if (!entry) return;
        const nameParts = (entry.name || '').trim().split(' ').filter(Boolean);
        const hasInitialToken = nameParts[0]?.includes('.');
        const baseName = entry.baseName || (hasInitialToken ? nameParts.slice(1).join(' ') : entry.name || '');
        const initialValue = entry.initial || (hasInitialToken ? nameParts[0].replace(/\./g, '') : '');

        setEditingEntry({
            ...entry,
            baseName,
            initial: initialValue,
            originalAmount: entry.amount,
            amount: Math.abs(entry.amount ?? 0),
        });
    };

    const handleSaveEditedEntry = (updatedEntry) => {
        if (!editingEntry) return;
        const { originalAmount, ...persistableEditingEntry } = editingEntry;
        const baseAmount = originalAmount ?? editingEntry.amount ?? 0;
        const signedAmount = baseAmount < 0 ? -Math.abs(updatedEntry.amount) : Math.abs(updatedEntry.amount);
        const mergedEntry = { ...persistableEditingEntry, ...updatedEntry, amount: signedAmount };
        const updatedEntries = moiEntries.map(e => (e.id === mergedEntry.id ? mergedEntry : e));
        setMoiEntries(updatedEntries);
        setEditingEntry(null);
    };

    const handleCreateMember = async () => {
        const trimmedName = (newMember.baseName || '').trim();
        const trimmedCode = (newMember.memberCode || '').trim();
        const trimmedEducation = (newMember.education || '').replace(/[^a-zA-Z\s.]/g, '');
        if (!trimmedCode || !trimmedName) {
            alert('உறுப்பினர் குறியீடும் பெயரும் அவசியம்.');
            return;
        }
        if (newMember.phone && newMember.phone.length !== 10) {
            alert('தொலைபேசி எண் 10 இலக்கமாக இருக்க வேண்டும்.');
            return;
        }

        if (addOrUpdateMember) {
            const relationship = newMember.relationshipName
                ? `${newMember.relationshipName} ${newMember.relationshipType === 'son' ? 'மகன்' : 'மகள்'}`
                : '';

            await addOrUpdateMember({
                memberCode: trimmedCode,
                baseName: trimmedName,
                fullName: newMember.initial
                    ? `${newMember.initial}${newMember.initial.endsWith('.') ? '' : '.'} ${trimmedName}`
                    : trimmedName,
                initial: newMember.initial || '',
                phone: newMember.phone || '',
                town: newMember.town || '',
                street: newMember.street || '',
                relationship,
                relationshipName: newMember.relationshipName || '',
                relationshipType: newMember.relationshipType,
                education: trimmedEducation,
                profession: newMember.profession || '',
                isMaternalUncle: !!newMember.isMaternalUncle,
                notes: newMember.note || '',
            }, false);
            alert('புதிய உறுப்பினர் சேர்க்கப்பட்டது.');
            setIsAddMemberOpen(false);
            setNewMember({
                memberCode: '',
                baseName: '',
                initial: '',
                phone: '',
                town: '',
                street: '',
                relationshipName: '',
                relationshipType: 'son',
                education: '',
                profession: '',
                note: '',
                isMaternalUncle: false,
            });
        }
    };

    return (
        <div className="moi-details-page">
            <section className="event-subheader">
                <div className="page-header-left">
                    <button className="icon-button back-button" onClick={onBack} aria-label="Back">
                        <span className="icon">arrow_back</span>
                    </button>
                    <h2>விழா Dashboard - {event.eventName}</h2>
                </div>
                <div className="header-actions">
                    <button className="button" onClick={() => setIsAddMemberOpen(true)} style={{marginRight: '0.5rem'}}>
                        புதிய உறுப்பினர்
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
            
            {renderActiveView()}

            {editingEntry && (
                <EditEntryModal
                    entry={editingEntry}
                    onClose={() => setEditingEntry(null)}
                    onSave={handleSaveEditedEntry}
                    towns={towns}
                    people={people}
                />
            )}

            {isAddMemberOpen && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{maxWidth: '780px'}}>
                        <div className="modal-header">
                            <h3>புதிய உறுப்பினர்</h3>
                            <button className="icon-button" onClick={() => setIsAddMemberOpen(false)}><span className="icon">close</span></button>
                        </div>
                        <div className="modal-body">
                            <form className="event-form" onSubmit={(e) => e.preventDefault()} style={{padding: 0, boxShadow: 'none'}}>
                                <div className="form-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'}}>
                                    <div className="form-group">
                                        <label>உறுப்பினர் குறியீடு</label>
                                        <input type="text" value={newMember.memberCode} onChange={(e) => setNewMember(prev => ({ ...prev, memberCode: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>ஊர்</label>
                                        <input type="text" value={newMember.town} onChange={(e) => setNewMember(prev => ({ ...prev, town: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>தெரு/ இருப்பு</label>
                                        <input type="text" value={newMember.street} onChange={(e) => setNewMember(prev => ({ ...prev, street: e.target.value }))} />
                                    </div>

                                    <div className="form-group">
                                        <label>Initial</label>
                                        <input type="text" value={newMember.initial} onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^a-zA-Z\u0B80-\u0BFF.]/g, '').slice(0, 5);
                                            setNewMember(prev => ({ ...prev, initial: sanitized.toUpperCase() }));
                                        }} />
                                    </div>
                                    <div className="form-group">
                                        <label>பெயர்</label>
                                        <input type="text" value={newMember.baseName} onChange={(e) => setNewMember(prev => ({ ...prev, baseName: e.target.value }))} />
                                    </div>

                                    <div className="form-group">
                                        <label>பெற்றோர் பெயர்</label>
                                        <input type="text" value={newMember.relationshipName} onChange={(e) => setNewMember(prev => ({ ...prev, relationshipName: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>உறவு முறை</label>
                                        <div className="radio-group" style={{display: 'flex', gap: '12px'}}>
                                            <label><input type="radio" name="nmRelationship" value="son" checked={newMember.relationshipType === 'son'} onChange={(e) => setNewMember(prev => ({ ...prev, relationshipType: e.target.value }))} disabled={!newMember.relationshipName} /> மகன்</label>
                                            <label><input type="radio" name="nmRelationship" value="daughter" checked={newMember.relationshipType === 'daughter'} onChange={(e) => setNewMember(prev => ({ ...prev, relationshipType: e.target.value }))} disabled={!newMember.relationshipName} /> மகள்</label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>படிப்பு (English only)</label>
                                        <input type="text" value={newMember.education} onChange={(e) => {
                                            const cleaned = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                                            setNewMember(prev => ({ ...prev, education: cleaned }));
                                        }} />
                                    </div>
                                    <div className="form-group">
                                        <label>தொழில்</label>
                                        <input type="text" value={newMember.profession} onChange={(e) => setNewMember(prev => ({ ...prev, profession: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>தொலைபேசி எண்</label>
                                        <input type="tel" value={newMember.phone} onChange={(e) => {
                                            const numeric = e.target.value.replace(/[^0-9]/g, '');
                                            if (numeric.length <= 10) setNewMember(prev => ({ ...prev, phone: numeric }));
                                        }} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>குறிப்பு</label>
                                        <input type="text" value={newMember.note} onChange={(e) => setNewMember(prev => ({ ...prev, note: e.target.value }))} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="checkbox-group">
                                            <input type="checkbox" checked={newMember.isMaternalUncle} onChange={(e) => setNewMember(prev => ({ ...prev, isMaternalUncle: e.target.checked }))} /> தாய்மாமன்
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-actions">
                            <button className="button clear-button" onClick={() => setIsAddMemberOpen(false)}>ரத்துசெய்</button>
                            <button className="button" onClick={handleCreateMember}>சேமி</button>
                        </div>
                    </div>
                </div>
            )}

             <footer className="footer" style={{position: 'relative', bottom: 'auto', marginTop: '2rem'}}>
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}