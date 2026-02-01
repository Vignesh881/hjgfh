/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useEffect, useRef } from 'react';
import PosBill from './PosBill_clean';
import databaseManager from '../lib/databaseManager';
import * as storage from '../lib/localStorage';

const DEFAULT_API_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : 'https://hjgfh.onrender.com/api';
const DEFAULT_CLOUD_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CLOUD_URL)
    ? process.env.REACT_APP_CLOUD_URL
    : DEFAULT_API_URL;

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
            return localStorage.getItem('moibook_cloud_url') || DEFAULT_CLOUD_URL;
        } catch (e) {
            return DEFAULT_CLOUD_URL;
        }
    });
    const [cloudStatus, setCloudStatus] = useState('Not Connected');
    const [isCloudEnabled, setIsCloudEnabled] = useState(false);

    // Printers (use state so we can refresh from backend if available)
    const [printers, setPrinters] = useState(() => ['Microsoft Print to PDF']);
    const [printerStatus, setPrinterStatus] = useState('');
    const drivers = ['C:', 'D:', 'E: (Backup)'];
    const LOCAL_PRINTER_API_URL = 'http://localhost:3001/api';
    const normalizePrinterList = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.value)) return payload.value;
        if (payload && Array.isArray(payload.printers)) return payload.printers;
        return [];
    };

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
        return stored ? stored.replace(/\/$/, '') : DEFAULT_API_URL;
    };

    const [apiUrl, setApiUrl] = useState(resolveInitialApiUrl);
    const [apiStatus, setApiStatus] = useState('');
    
    const handleConfirm = async (section) => {
        await setSettings(localSettings);
        
    let message = 'அமைப்புகள் சேமிக்கப்பட்டன!';
    if (section === 'defaultEvent') message = 'விழா தேர்வு சேமிக்கப்பட்டது!';
    else if (section === 'registrarAssignments') message = 'பதிவாளர் தேர்வு சேமிக்கப்பட்டது!';
    else if (section === 'printerAssignments') message = 'அச்சுப்பொறி தேர்வு சேமிக்கப்பட்டது!';
    else if (section === 'billHeader') message = 'பில் header விவரம் சேமிக்கப்பட்டது!';
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

    const normalizeApiBase = (value) => String(value || '').trim().replace(/\/$/, '');
    const getPrinterApiBases = () => {
        const bases = [];
        const fromDb = databaseManager && typeof databaseManager._getApiBaseUrl === 'function'
            ? databaseManager._getApiBaseUrl()
            : '';
        [apiUrl, fromDb, LOCAL_PRINTER_API_URL].forEach((candidate) => {
            const normalized = normalizeApiBase(candidate);
            if (normalized) {
                bases.push(normalized);
            }
        });
        return Array.from(new Set(bases));
    };

    // Try to fetch printers from the backend (if server exposes an endpoint)
    const fetchPrintersFromApi = async () => {
        const bases = getPrinterApiBases();
        if (!bases.length) {
            alert('Please set API URL or run the local server to fetch printers.');
            return;
        }
        setPrinterStatus('Loading printers...');
        let lastError = null;
        for (const base of bases) {
            try {
                const res = await fetch(base + '/printers');
                if (!res.ok) {
                    lastError = new Error('Status ' + res.status);
                    continue;
                }
                const payload = await res.json();
                const data = normalizePrinterList(payload);
                if (Array.isArray(data) && data.length > 0) {
                    setPrinters(data);
                    setPrinterStatus(`Loaded ${data.length} printers.`);
                    alert('Printers refreshed from API.');
                    return;
                }
            } catch (err) {
                lastError = err;
            }
        }
        console.warn('Printer fetch failed:', lastError);
        setPrinterStatus('No printers found. Please ensure local server is running.');
        alert('Failed to fetch printers. Please ensure the local server is running.');
    };

    useEffect(() => {
        let cancelled = false;
        const autoFetch = async () => {
            const bases = getPrinterApiBases();
            if (!bases.length) return;
            for (const base of bases) {
                try {
                    const res = await fetch(base + '/printers');
                    if (!res.ok) {
                        continue;
                    }
                    const payload = await res.json();
                    const data = normalizePrinterList(payload);
                    if (!cancelled && Array.isArray(data) && data.length) {
                        setPrinters(data);
                        setPrinterStatus(`Loaded ${data.length} printers.`);
                        
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
                        return;
                    }
                } catch (err) {
                    console.warn('Auto printer fetch failed:', err);
                }
            }
            if (!cancelled) {
                setPrinterStatus('No printers found.');
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
                        <label>இயல்புநிலை விழா</label>
                        <div className="form-group">
                            <select
                                value={localSettings.defaultEventId || ''}
                                onChange={(e) =>
                                    setLocalSettings(prev => ({
                                        ...prev,
                                        defaultEventId: e.target.value
                                    }))
                                }
                                style={{ padding: '0.6rem', borderRadius: '6px', minWidth: 260 }}
                            >
                                <option value="">விழாவைத் தேர்வு செய்யவும்</option>
                                {permittedEvents.map(ev => {
                                    const dateText = ev.date ? new Date(ev.date).toLocaleDateString('en-GB') : '';
                                    const timeText = ev.time ? ev.time : '';
                                    const placeText = ev.venue || ev.place || ev.location || '';
                                    const headText = ev.eventHead || '';
                                    const organizerText = ev.eventOrganizer || '';
                                    const meta = [dateText, timeText].filter(Boolean).join(' ');
                                    const people = [headText, organizerText].filter(Boolean).join(' / ');
                                    const sideText = ev.eventSide ? `(${ev.eventSide})` : '';
                                    return (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.eventName} {sideText} - {ev.id}
                                            {meta ? ` | ${meta}` : ''}
                                            {placeText ? ` | ${placeText}` : ''}
                                            {people ? ` | ${people}` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {selectedEvent && (
                            <small style={{ color: '#666' }}>
                                தேர்ந்த விழா: {selectedEvent.eventName} {selectedEvent.eventSide ? `(${selectedEvent.eventSide})` : ''} | {selectedEvent.id}
                                {selectedEvent.date ? ` | ${new Date(selectedEvent.date).toLocaleDateString('en-GB')}` : ''}
                                {selectedEvent.time ? ` ${selectedEvent.time}` : ''}
                                {(selectedEvent.venue || selectedEvent.place || selectedEvent.location) ? ` | ${selectedEvent.venue || selectedEvent.place || selectedEvent.location}` : ''}
                                {selectedEvent.eventHead ? ` | தலைவர்: ${selectedEvent.eventHead}` : ''}
                                {selectedEvent.eventOrganizer ? ` | அமைப்பாளர்: ${selectedEvent.eventOrganizer}` : ''}
                            </small>
                        )}
                    </div>
                    <div className="form-actions" style={{justifyContent: 'flex-start', paddingTop: '0.5rem'}}>
                        <button className="button" onClick={() => handleConfirm('defaultEvent')}>உறுதி செய்</button>
                    </div>
                </section>

                {/* Bill Header Info */}
                <section className="settings-section">
                    <h3>பில் Header விவரம்</h3>
                    <div className="settings-form-group" style={{ alignItems: 'stretch' }}>
                        <div className="form-group" style={{ width: '100%' }}>
                            <label htmlFor="billHeaderAddress">நிறுவண முகவரி</label>
                            <textarea
                                id="billHeaderAddress"
                                value={localSettings.billHeaderAddress || ''}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    billHeaderAddress: e.target.value
                                }))}
                                rows="2"
                                placeholder="உதா: 123, மெயின் ரோடு, மதுரை"
                            />
                        </div>
                        <div className="form-group" style={{ width: '100%' }}>
                            <label htmlFor="billHeaderPhone">நிறுவண தொலைபேசி</label>
                            <input
                                type="text"
                                id="billHeaderPhone"
                                value={localSettings.billHeaderPhone || ''}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    if (numericValue.length > 10) return;
                                    setLocalSettings(prev => ({
                                        ...prev,
                                        billHeaderPhone: numericValue
                                    }));
                                }}
                                placeholder="10 இலக்க எண்"
                            />
                        </div>
                    </div>
                    <div className="form-actions" style={{justifyContent: 'flex-start', paddingTop: '0.5rem'}}>
                        <button className="button" onClick={() => handleConfirm('billHeader')}>உறுதி செய்</button>
                    </div>
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
                                    <select
                                        value={assignment.typist || ''}
                                        onChange={(e) => handleRegistrarAssignment(table, 'typist', e.target.value)}
                                        style={{ padding: '0.6rem', borderRadius: '6px', minWidth: 260 }}
                                    >
                                        <option value="">தட்டச்சாளர் தேர்வு</option>
                                        {typists.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} ({r.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <select
                                        value={assignment.cashier || ''}
                                        onChange={(e) => handleRegistrarAssignment(table, 'cashier', e.target.value)}
                                        style={{ padding: '0.6rem', borderRadius: '6px', minWidth: 260 }}
                                    >
                                        <option value="">காசாளர் தேர்வு</option>
                                        {cashiers.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} ({r.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                    <div className="form-actions" style={{justifyContent: 'flex-start', paddingTop: '0.5rem'}}>
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
                        {printerStatus && (
                            <small style={{ color: '#666', marginRight: 8 }}>{printerStatus}</small>
                        )}
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
                                }} settings={localSettings} />
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