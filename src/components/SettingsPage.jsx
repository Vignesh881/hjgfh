/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useEffect, useRef } from 'react';
import PosBill from './PosBill_clean';
import databaseManager from '../lib/databaseManager';
import * as storage from '../lib/localStorage';

// A reusable searchable dropdown component
const SearchableDropdown = ({ options, value, onChange, placeholder, filterOn }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const filteredOptions = useMemo(() => {
        if (!query) return options;
        return options.filter(option =>
            option.name.toLowerCase().includes(query.toLowerCase()) ||
            option.id.toLowerCase().includes(query.toLowerCase()) ||
            (option.phone && option.phone.toLowerCase().includes(query.toLowerCase()))
        );
    }, [query, options]);
    
    const selectedOption = options.find(opt => opt.id === value);
    const displayValue = selectedOption ? `${selectedOption.name} (${selectedOption.id})` : query;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="searchable-dropdown" ref={dropdownRef}>
            <input
                type="text"
                className="searchable-dropdown-input"
                value={displayValue}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
            />
            {isOpen && (
                <div className="searchable-dropdown-list">
                    {filteredOptions.filter(opt => !filterOn || opt.designation === filterOn).map(option => (
                        <div
                            key={option.id}
                            className="searchable-dropdown-item"
                            onClick={() => {
                                onChange(option.id);
                                setQuery('');
                                setIsOpen(false);
                            }}
                        >
                            {option.name} ({option.id}) - {option.phone}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default function SettingsPage({ events, registrars, settings, setSettings, onBack, downloadMoibookDB, reloadAllData }) {
    // Keep a local editable copy of settings. If parent updates `settings` (e.g. after load),
    // sync it into local state so UI reflects persisted values.
    const [localSettings, setLocalSettings] = useState(settings || {});
    useEffect(() => {
        setLocalSettings(settings || {});
    }, [settings]);
    const [testBillTable, setTestBillTable] = useState(null); // Track which table's test bill to show

    // Data import/export
    const [importFile, setImportFile] = useState(null);

    // Cloud settings
    const [cloudUrl, setCloudUrl] = useState(() => {
        try {
            return localStorage.getItem('moibook_cloud_url') || '';
        } catch (e) {
            return '';
        }
    });
    const [cloudStatus, setCloudStatus] = useState('Not Connected');
    const [isCloudEnabled, setIsCloudEnabled] = useState(false);

    // Printers (use state so we can refresh from backend if available)
    const [printers, setPrinters] = useState(() => ['Microsoft Print to PDF']);
    const drivers = ['C:', 'D:', 'E: (Backup)'];

    const resolveInitialApiUrl = () => {
        try {
            if (databaseManager && typeof databaseManager._getApiBaseUrl === 'function') {
                const resolved = databaseManager._getApiBaseUrl();
                if (resolved) {
                    return resolved.replace(/\/$/, '');
                }
            }
        } catch (err) {
            console.warn('Failed to resolve API base from databaseManager:', err);
        }
        const stored = localStorage.getItem('moibook_api_url');
        return stored ? stored.replace(/\/$/, '') : 'http://localhost:3001/api';
    };

    const [apiUrl, setApiUrl] = useState(resolveInitialApiUrl);
    const [apiStatus, setApiStatus] = useState('');
    const [isForceSyncing, setIsForceSyncing] = useState(false);
    
    const handleConfirm = async (section) => {
        await setSettings(localSettings);
        
        let message = 'அமைப்புகள் சேமிக்கப்பட்டன!';
        if (section === 'defaultEvent') message = 'விழா தேர்வு சேமிக்கப்பட்டது!';
        else if (section === 'registrarAssignments') message = 'பதிவாளர் தேர்வு சேமிக்கப்பட்டது!';
        else if (section === 'printerAssignments') message = 'அச்சுப்பொறி தேர்வு சேமிக்கப்பட்டது!';
        else if (section === 'storage') message = 'சேமிப்புக்களன் தேர்வு சேமிக்கப்பட்டது!';

        alert(message);
    };
    
    const handleRegistrarAssignment = (table, type, value) => {
        setLocalSettings(prev => ({
            ...prev,
            registrarAssignments: {
                ...(prev.registrarAssignments || {}),
                [table]: {
                    ...((prev.registrarAssignments && prev.registrarAssignments[table]) || {}),
                    [type]: value,
                }
            }
        }));
    };
    
    const handlePrinterAssignment = (table, type, value) => {
         setLocalSettings(prev => ({
            ...prev,
            printerAssignments: {
                ...(prev.printerAssignments || {}),
                [table]: {
                    ...((prev.printerAssignments && prev.printerAssignments[table]) || {}),
                    [type]: value,
                }
            }
        }));
    }

    // Update databaseManager fetch base URL
    useEffect(() => {
        if (apiUrl) {
            window.__MOIBOOK_API_URL__ = apiUrl;
        }
    }, [apiUrl]);

    // Test API connection
    const testApiConnection = async () => {
        setApiStatus('Testing...');
        try {
            const base = (apiUrl || '').replace(/\/$/, '');
            const res = await fetch(base + '/events');
            if (res.ok) {
                setApiStatus('✅ API Connected');
                localStorage.setItem('moibook_api_url', base);
            } else {
                setApiStatus('❌ API Error: ' + res.status);
            }
        } catch (e) {
            setApiStatus('❌ API Error: ' + e.message);
        }
    };

    const forceUploadLocalData = async () => {
        const base = (apiUrl || '').replace(/\/$/, '');
        if (!base) {
            alert('API URL சரியாக இல்லை. முதலில் API URL-ஐ உள்ளிடவும்.');
            return;
        }

        const confirmed = window.confirm('Cloud/API-ல் உள்ள data அனைத்தும் அழிக்கப்பட்டு, local data மீண்டும் upload செய்யப்படும். தொடரவா?');
        if (!confirmed) return;

        setIsForceSyncing(true);
        try {
            const clearRes = await fetch(base + '/admin/clear-data?confirm=YES', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!clearRes.ok) {
                throw new Error('API data clear failed: ' + clearRes.status);
            }

            const localEvents = storage.loadEvents ? storage.loadEvents() : [];
            const localRegistrars = storage.loadRegistrars ? storage.loadRegistrars() : [];
            const localMembers = storage.loadMembers ? storage.loadMembers() : [];
            const localEntries = storage.loadMoiEntries ? storage.loadMoiEntries() : [];
            const localSettingsData = storage.loadSettings ? storage.loadSettings() : {};

            for (const event of localEvents) {
                await databaseManager.createEvent(event);
            }

            for (const registrar of localRegistrars) {
                await databaseManager.createRegistrar(registrar);
            }

            for (const member of localMembers) {
                if (member && (member.memberCode || member.member_code || member.memberId)) {
                    await databaseManager.createMember(member);
                }
            }

            for (const entry of localEntries) {
                await databaseManager.createMoiEntry(entry);
            }

            if (localSettingsData && Object.keys(localSettingsData).length > 0) {
                await databaseManager.saveSettings(localSettingsData);
            }

            if (reloadAllData) {
                await reloadAllData();
            }

            alert('✅ Local data மீண்டும் Cloud/API-க்கு upload ஆனது.');
        } catch (err) {
            console.error('Force upload failed:', err);
            alert('❌ Force upload தோல்வியடைந்தது: ' + (err.message || err));
        } finally {
            setIsForceSyncing(false);
        }
    };

    // Test cloud connection
    const testCloudConnection = async () => {
        setCloudStatus('Testing...');
        try {
            const base = (cloudUrl || '').replace(/\/$/, '');
            if (!base) {
                setCloudStatus('❌ No URL provided');
                return;
            }
            
            const res = await fetch(base + '/events');
            if (res.ok) {
                setCloudStatus('✅ Cloud Connected');
                localStorage.setItem('moibook_cloud_url', base);
                setIsCloudEnabled(true);
            } else {
                setCloudStatus('❌ Cloud Error: ' + res.status);
                setIsCloudEnabled(false);
            }
        } catch (e) {
            setCloudStatus('❌ Cloud Error: ' + e.message);
            setIsCloudEnabled(false);
        }
    };

    // Handle data import
    const handleImportData = async () => {
        if (!importFile) {
            alert('தயவுசெய்து ஒரு DB file-ஐ தேர்ந்தெடுக்கவும்.');
            return;
        }

        try {
            const fileContent = await importFile.text();
            const data = JSON.parse(fileContent);
            
            const success = storage.importAllData(data);
            if (success) {
                alert('✅ Data வெற்றிகரமாக import செய்யப்பட்டது!');
                if (reloadAllData) {
                    reloadAllData();
                }
                setImportFile(null);
            } else {
                alert('❌ Data import தோல்வியடைந்தது. File format சரியாக இல்லை.');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('❌ Data import தோல்வியடைந்தது: ' + error.message);
        }
    };

    // Try to fetch printers from the backend (if server exposes an endpoint)
    const fetchPrintersFromApi = async () => {
        if (!apiUrl) {
            alert('Please set API URL first to fetch printers.');
            return;
        }
        try {
            const base = apiUrl.replace(/\/$/, '');
            const res = await fetch(base + '/printers');
            if (!res.ok) throw new Error('Status ' + res.status);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setPrinters(data);
                alert('Printers refreshed from API.');
            } else {
                alert('No printers returned by API.');
            }
        } catch (err) {
            console.warn('Printer fetch failed:', err);
            alert('Failed to fetch printers from API. Using local list.');
        }
    };

    useEffect(() => {
        if (!apiUrl) {
            return;
        }
        let cancelled = false;
        const autoFetch = async () => {
            try {
                const base = apiUrl.replace(/\/$/, '');
                const res = await fetch(base + '/printers');
                if (!res.ok) {
                    return;
                }
                const data = await res.json();
                if (!cancelled && Array.isArray(data) && data.length) {
                    setPrinters(data);
                    
                    // Auto-assign first non-PDF printer as default for all tables if not already set
                    const physicalPrinter = data.find(p => !p.toLowerCase().includes('pdf') && !p.toLowerCase().includes('onenote'));
                    if (physicalPrinter) {
                        setLocalSettings(prev => {
                            const needsUpdate = [...Array(10)].some((_, i) => {
                                const table = `table${i + 1}`;
                                return !prev.printerAssignments?.[table]?.printer;
                            });
                            
                            if (!needsUpdate) return prev;
                            
                            const updatedAssignments = { ...prev.printerAssignments };
                            [...Array(10)].forEach((_, i) => {
                                const table = `table${i + 1}`;
                                if (!updatedAssignments[table]?.printer) {
                                    updatedAssignments[table] = {
                                        ...updatedAssignments[table],
                                        printer: physicalPrinter,
                                        count: '1'
                                    };
                                }
                            });
                            
                            const newSettings = {
                                ...prev,
                                printerAssignments: updatedAssignments
                            };
                            
                            // Auto-save the settings immediately
                            console.log('🖨️ Auto-configuring printer:', physicalPrinter);
                            if (setSettings) {
                                setTimeout(() => setSettings(newSettings), 100);
                            }
                            
                            return newSettings;
                        });
                    }
                }
            } catch (err) {
                console.warn('Auto printer fetch failed:', err);
            }
        };
        autoFetch();
        return () => {
            cancelled = true;
        };
    }, [apiUrl, setSettings]);

    // Helper to format 'HH:mm' -> 12-hour display
    const formatTo12Hour = (time24) => {
        if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return { hour: '10', minute: '00', period: 'AM' };
        const [h, m] = time24.split(':');
        const hours = parseInt(h, 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        let hour12 = hours % 12;
        if (hour12 === 0) hour12 = 12;
        return { hour: String(hour12).padStart(2, '0'), minute: m, period };
    };

    const permittedEvents = events.filter(event => event.permission);

    // selectedEvent: resolve the event object for the configured defaultEventId
    // Use defensive checks in case events are still loading or localSettings is not populated yet.
    const selectedEvent = useMemo(() => {
        if (!localSettings) return null;
        const id = localSettings.defaultEventId;
        if (!id) return null;
        return events.find(ev => String(ev.id) === String(id)) || null;
    }, [events, localSettings]);

    const typists = registrars.filter(r => r.designation === 'தட்டச்சாளர்');
    const cashiers = registrars.filter(r => r.designation === 'காசாளர்');

    return (
        <div className="event-page" style={{ width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
            <header className="event-header">
                <h1>மொய்புக்</h1>
            </header>

            <section className="event-subheader">
                <div className="page-header-left">
                    <button className="icon-button back-button" onClick={onBack} aria-label="Back to Master Page">
                        <span className="icon">arrow_back</span>
                    </button>
                    <h2>அமைப்புகள்</h2>
                </div>
            </section>
            
            <div className="settings-content">

                {/* MySQL API Config Section */}
                <section className="settings-section">
                    <h3>MySQL Server API Config</h3>
                    <div className="settings-form-group">
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={e => setApiUrl(e.target.value)}
                            placeholder="http://localhost:3001/api"
                            style={{width:'60%',marginRight:8}}
                        />
                        <button className="button" onClick={testApiConnection}>Test API</button>
                        <button
                            className="button button-secondary"
                            onClick={forceUploadLocalData}
                            disabled={isForceSyncing}
                            style={{ marginLeft: 8 }}
                        >
                            {isForceSyncing ? 'Syncing...' : 'Force Upload Local Data'}
                        </button>
                        <span style={{marginLeft:12}}>{apiStatus}</span>
                    </div>
                    <p style={{fontSize:'12px',color:'#666'}}>API URL: Node.js server (Express) running with MySQL backend. Eg: http://localhost:3001/api</p>
                </section>

                {/* Cloud Sync Config Section */}
                <section className="settings-section">
                    <h3>☁️ Cloud Sync Config</h3>
                    <div className="settings-form-group">
                        <input
                            type="text"
                            value={cloudUrl}
                            onChange={e => setCloudUrl(e.target.value)}
                            placeholder="https://your-cloud-api.com/api"
                            style={{width:'60%',marginRight:8}}
                        />
                        <button className="button" onClick={testCloudConnection}>Test Cloud</button>
                        <span style={{marginLeft:12}}>{cloudStatus}</span>
                    </div>
                    <div style={{marginTop:8}}>
                        <button 
                            className="button" 
                            onClick={() => {
                                if (cloudUrl.trim()) {
                                    databaseManager.enableCloudSync(cloudUrl.trim());
                                    setIsCloudEnabled(true);
                                    setCloudStatus('✅ Cloud sync enabled');
                                } else {
                                    alert('Please enter a cloud URL first');
                                }
                            }}
                            style={{marginRight:8}}
                        >
                            Enable Cloud Sync
                        </button>
                        <button 
                            className="button button-secondary" 
                            onClick={() => {
                                databaseManager.disableCloudSync();
                                setIsCloudEnabled(false);
                                setCloudStatus('❌ Cloud sync disabled');
                            }}
                        >
                            Disable Cloud Sync
                        </button>
                    </div>
                    <p style={{fontSize:'12px',color:'#666'}}>Cloud URL: PlanetScale or similar cloud database API endpoint. Enables cross-device sync.</p>
                    {isCloudEnabled && (
                        <div style={{marginTop:8, padding:8, background:'#e8f5e8', borderRadius:4, border:'1px solid #4caf50'}}>
                            <span style={{color:'#2e7d32', fontWeight:'bold'}}>✅ Cloud sync enabled</span>
                            <p style={{fontSize:'11px', margin:4, color:'#2e7d32'}}>Events will be synced across devices automatically.</p>
                        </div>
                    )}
                </section>

                {/* Event Selection */}
                <section className="settings-section">
                    <h3>விழா தேர்வு</h3>
                    <div className="settings-form-group">
                        <div className="form-group">
                            <select 
                                value={localSettings.defaultEventId || ''} 
                                onChange={(e) => setLocalSettings(p => ({...p, defaultEventId: e.target.value}))}
                            >
                                <option value="">விழாவைத் தேர்ந்தெடுக்கவும்</option>
                                {permittedEvents.map(event => (
                                    <option key={event.id} value={event.id}>
                                        {event.id} - {event.eventName} ({new Date(event.date).toLocaleDateString('en-GB')})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button className="button" onClick={() => handleConfirm('defaultEvent')}>உறுதி செய்</button>
                    </div>
                    {/* Show selected event details */}
                    {selectedEvent && (
                        <div style={{ marginTop: 12, padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fafdf9', maxWidth: 720 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <strong>{selectedEvent.eventName}{selectedEvent.eventSide ? ` (${selectedEvent.eventSide})` : ''}</strong>
                                <span style={{ color: '#666' }}>{selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-GB') : ''} {selectedEvent.time ? ` ${formatTo12Hour(selectedEvent.time).hour}:${formatTo12Hour(selectedEvent.time).minute} ${formatTo12Hour(selectedEvent.time).period}` : ''}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div><small>விழா தலைவர்</small><div>{selectedEvent.eventHead || '-'}</div></div>
                                <div><small>விழா அமைப்பாளர்</small><div>{selectedEvent.eventOrganizer || '-'}</div></div>
                                <div><small>மண்டபம்</small><div>{selectedEvent.venue || '-'}</div></div>
                                <div><small>இடம்</small><div>{selectedEvent.place || '-'}</div></div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Registrar Selection */}
                <section className="settings-section">
                    <h3>பதிவாளர் தேர்வு</h3>
                     {[...Array(10)].map((_, i) => {
                        const table = `table${i + 1}`;
                        const assignment = localSettings.registrarAssignments?.[table] || {};
                        return (
                            <div key={table} className="table-assignment-grid settings-form-group">
                                <label>மேசை {i + 1}</label>
                                <div className="form-group">
                                    <SearchableDropdown
                                        options={typists}
                                        value={assignment.typist || ''}
                                        onChange={(val) => handleRegistrarAssignment(table, 'typist', val)}
                                        placeholder="தட்டச்சாளர் (தேடுக)"
                                    />
                                </div>
                                <div className="form-group">
                                    <SearchableDropdown
                                        options={cashiers}
                                        value={assignment.cashier || ''}
                                        onChange={(val) => handleRegistrarAssignment(table, 'cashier', val)}
                                        placeholder="காசாளர் (தேடுக)"
                                    />
                                </div>
                            </div>
                        );
                    })}
                    <div className="form-actions" style={{justifyContent: 'flex-start', paddingTop: '1rem'}}>
                         <button className="button" onClick={() => handleConfirm('registrarAssignments')}>உறுதி செய்</button>
                    </div>
                </section>
                
                {/* Printer Selection */}
                <section className="settings-section">
                    <h3>அச்சுப்பொறி தேர்வு</h3>
                    {[...Array(10)].map((_, i) => {
                        const table = `table${i + 1}`;
                        const assignment = localSettings.printerAssignments?.[table] || {};
                        return (
                            <div key={table} className="table-assignment-grid-printers settings-form-group">
                                <label>மேசை {i + 1}</label>
                                <div className="form-group">
                                    <select
                                        value={assignment.printer || ''}
                                        onChange={(e) => handlePrinterAssignment(table, 'printer', e.target.value)}
                                        style={{ padding: '0.6rem', borderRadius: '6px', minWidth: 260 }}
                                    >
                                        <option value="">அச்சுப் பொரியை தேர்ந்தெடுக்கவும்</option>
                                        {printers.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input 
                                        type="number" 
                                        placeholder="அச்சு எண்ணிக்கை" 
                                        value={assignment.count || ''}
                                        onChange={(e) => handlePrinterAssignment(table, 'count', e.target.value)}
                                        min="1"
                                        style={{ padding: '0.6rem', borderRadius: '6px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={() => setTestBillTable(table)}
                                        style={{marginLeft: 8}}
                                    >
                                        Bill Test Print
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <div style={{ marginTop: 8 }}>
                        <button className="button" onClick={fetchPrintersFromApi} style={{ marginRight: 8 }}>Refresh printers</button>
                        <small style={{ color: '#666' }}>Show only available device printers when backend supports it.</small>
                    </div>
                    {/* Show sample bill modal if testBillTable is set */}
                    {testBillTable && (
                        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <div style={{background:'#fff',padding:24,borderRadius:8,boxShadow:'0 2px 16px #0004',maxWidth:350}}>
                                <h4 style={{marginTop:0}}>Test Bill (POS)</h4>
                                <PosBill entry={{
                                    id: 1,
                                    town: 'கோயம்புத்தூர்',
                                    street: 'மெயின் ரோடு',
                                    isMaternalUncle: false,
                                    relationship: 'நண்பர்',
                                    name: 'முருகன்',
                                    education: 'B.Sc',
                                    profession: 'ஆசிரியர்',
                                    phone: '9876543210',
                                    note: 'வாழ்த்துக்கள்',
                                    denominations: { 500: 2, 100: 3, 50: 1 },
                                    amount: 1350,
                                    memberId: 'M001',
                                    table: testBillTable,
                                }} event={{
                                    eventName: 'திருமணம்',
                                    eventSide: 'மாப்பிள்ளை',
                                    eventHead: 'ராமு',
                                    eventOrganizer: 'சிவா',
                                }} />
                                <div style={{textAlign:'right',marginTop:16}}>
                                    <button className="button" onClick={()=>setTestBillTable(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="form-actions" style={{justifyContent: 'flex-start', paddingTop: '1rem'}}>
                         <button className="button" onClick={() => handleConfirm('printerAssignments')}>உறுதி செய்</button>
                    </div>
                </section>
                
                {/* Data Backup & Restore */}
                <section className="settings-section">
                    <h3>Data Backup & Restore</h3>
                    <div className="settings-form-group">
                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📥 Import Data (மற்ற Laptop-லிருந்து)</h4>
                            <input
                                type="file"
                                accept=".json,.db.json"
                                onChange={(e) => setImportFile(e.target.files[0])}
                                style={{ marginRight: '10px' }}
                            />
                            <button 
                                className="button" 
                                onClick={handleImportData}
                                disabled={!importFile}
                                style={{ backgroundColor: importFile ? '#27ae60' : '#bdc3c7' }}
                            >
                                Import Data
                            </button>
                            {importFile && (
                                <span style={{ marginLeft: '10px', color: '#27ae60' }}>
                                    Selected: {importFile.name}
                                </span>
                            )}
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📤 Export Data (இந்த Laptop-லிருந்து)</h4>
                            <button 
                                className="button" 
                                onClick={downloadMoibookDB}
                                style={{ backgroundColor: '#3498db' }}
                            >
                                Download MoiBook DB
                            </button>
                            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                                இந்த button click செய்தால், அனைத்து data (events, registrars, members, moi entries) JSON file-ஆக download ஆகும். அதை மற்ற laptop-ல் import செய்யலாம்.
                            </p>
                        </div>
                    </div>
                </section>
                
                {/* Storage Selection */}
                <section className="settings-section">
                     <h3>சேமிப்புக்களன் தேர்வு</h3>
                     <div className="settings-form-group">
                        <div className="form-group">
                            <select
                                value={localSettings.storageDriver || ''}
                                onChange={(e) => setLocalSettings(p => ({...p, storageDriver: e.target.value}))}
                            >
                                {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <button className="button" onClick={() => handleConfirm('storage')}>உறுதி செய்</button>
                    </div>
                </section>
            </div>
             <footer className="footer">
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}