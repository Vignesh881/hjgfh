import { useState, useEffect } from 'react';
import databaseManager from '../lib/databaseManager';
import TimePicker from './TimePicker';
import { MoiBookIcon } from './MoiBookLogo';

const initialFormData = {
    eventName: '',
    eventSide: '',
    date: '',
    time: '10:00',
    eventHead: '',
    eventHeadProf: '',
    eventOrganizer: '',
    eventOrganizerProf: '',
    venue: '',
    place: '',
    phone: '',
    address: '',
    invitationCount: '',
    tableCount: '',
    approvalPins: [],
};

// Helper to convert 'HH:mm' to 12-hour object
const formatTo12Hour = (time24) => {
    if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) {
        return { hour: '10', minute: '00', period: 'AM' };
    }
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12; // For 12 AM or 12 PM
    return {
        hour: String(hour12).padStart(2, '0'),
        minute: m,
        period,
    };
};

// Helper to convert 12-hour object to 'HH:mm' string
const formatTo24Hour = (hour, minute, period) => {
    let h = parseInt(hour, 10);
    if (period === 'PM' && h < 12) {
        h += 12;
    }
    if (period === 'AM' && h === 12) {
        h = 0;
    }
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export default function EventPage({ events, addOrUpdateEvent, deleteEvent, togglePermission, onLogout, onNavigateToRegistrar, onNavigateToDashboard, onNavigateToMembers }) {
    const [formData, setFormData] = useState(initialFormData);
    const [showSideRadio, setShowSideRadio] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [activeDetailsTab, setActiveDetailsTab] = useState('event');
    const [cloudEvents, setCloudEvents] = useState([]);
    const [isCloudEnabled, setIsCloudEnabled] = useState(false);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);

    // Load cloud events on component mount
    useEffect(() => {
        const loadCloudEvents = async () => {
            setIsLoadingCloud(true);
            try {
                const cloudEnabled = await databaseManager.initializeCloudConnection();
                setIsCloudEnabled(cloudEnabled);
                
                if (cloudEnabled) {
                    const events = await databaseManager.getCloudEvents();
                    setCloudEvents(events || []);
                }
            } catch (error) {
                console.error('Failed to load cloud events:', error);
            } finally {
                setIsLoadingCloud(false);
            }
        };
        
        loadCloudEvents();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
           if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                 setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        if (name === 'invitationCount' || name === 'tableCount') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTimeSet = (newTime) => {
        const time24 = formatTo24Hour(newTime.hour, newTime.minute, newTime.period);
        setFormData(prev => ({ ...prev, time: time24 }));
        setIsTimePickerOpen(false);
    };

    const handleEventNameChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, eventName: value, eventSide: '' }));
        if (value === 'திருமண விழா' || value === 'திருமண வரவேற்பு விழா') {
            setShowSideRadio(true);
        } else {
            setShowSideRadio(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const eventData = {
            id: editingEventId,
            ...formData
        };

        await addOrUpdateEvent(eventData, !!editingEventId);
        handleClearForm();
    };

    const handleEdit = (id) => {
        const eventToEdit = events.find(event => event.id === id);
        if (eventToEdit) {
            setFormData({
                eventName: eventToEdit.eventName,
                eventSide: eventToEdit.eventSide || '',
                date: eventToEdit.date,
                time: eventToEdit.time,
                eventHead: eventToEdit.eventHead,
                eventHeadProf: eventToEdit.eventHeadProf || '',
                eventOrganizer: eventToEdit.eventOrganizer,
                eventOrganizerProf: eventToEdit.eventOrganizerProf || '',
                venue: eventToEdit.venue,
                place: eventToEdit.place,
                phone: eventToEdit.phone,
                address: eventToEdit.address || '',
                invitationCount: eventToEdit.invitationCount || '',
                tableCount: eventToEdit.tableCount || '',
                approvalPins: eventToEdit.approvalPins || [], // Load existing pins
            });
            setEditingEventId(id);
            setShowSideRadio(eventToEdit.eventName === 'திருமண விழா' || eventToEdit.eventName === 'திருமண வரவேற்பு விழா');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('இந்த பதிவை நீக்க விரும்புகிறீர்களா?')) {
            await deleteEvent(id);
            if (editingEventId === id) {
                handleClearForm();
            }
        }
    };

    const handleTogglePermission = async (id) => {
        await togglePermission(id);
    };
    
    const handleClearForm = () => {
        setFormData(initialFormData);
        setShowSideRadio(false);
        setEditingEventId(null);
    };

    // Members modal state and loader
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [modalMembers, setModalMembers] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalEventName, setModalEventName] = useState('');

    const openMembersModal = async (eventId, eventName = '') => {
        setModalEventName(eventName || '');
        setShowMembersModal(true);
        setModalLoading(true);
        try {
            const members = await databaseManager.getMembers({ useLocalFallback: true });
            const filtered = Array.isArray(members) ? members.filter(m => {
                const src = m.sourceEventId ?? m.source_event_id ?? m.eventId ?? m.event_id;
                return src != null && String(src) === String(eventId);
            }) : [];
            setModalMembers(filtered);
        } catch (err) {
            console.error('Failed to load members for event', eventId, err);
            setModalMembers([]);
        } finally {
            setModalLoading(false);
        }
    };

    const closeMembersModal = () => {
        setShowMembersModal(false);
        setModalMembers([]);
        setModalEventName('');
    };

    const generatePins = () => {
        if (!window.confirm('இது ஏற்கனவே உள்ள PIN-களை அழித்து புதியவற்றை உருவாக்கும். தொடர விரும்புகிறீர்களா?')) {
            return;
        }
        const newPins = new Set();
        while (newPins.size < 10) {
            const pin = Math.floor(1000 + Math.random() * 9000).toString();
            newPins.add(pin);
        }
        
        // Create PIN tracking objects with usage info
        const pinObjects = Array.from(newPins).map(pin => ({
            pin: pin,
            used: false,
            usedBy: null,      // Entry ID when used
            usedAt: null,      // Timestamp when used
            usedFor: null      // 'expense', 'edit', or 'delete'
        }));
        
        setFormData(prev => ({ ...prev, approvalPins: pinObjects }));
        alert('10 புதிய PIN எண்கள் உருவாக்கப்பட்டுவிட்டன. படிவத்தைச் சேமிக்க மறவாதீர்கள்.');
    };

    const handleSendSms = () => {
        // Extract PIN numbers from objects or strings
        const pinNumbers = (formData.approvalPins || []).map(p => typeof p === 'string' ? p : p.pin);
        if (!pinNumbers.length) {
            alert('PIN எண்கள் இல்லை. முதலில் உருவாக்கவும்.');
            return;
        }
        alert(`பின்வரும் PIN-கள் விழா அமைப்பாளரின் மொபைல் எண்ணுக்கு SMS அனுப்பப்பட்டது:\n\n${pinNumbers.join(', ')}`);
    };

    const handleCopyPins = async () => {
        const pinNumbers = (formData.approvalPins || [])
            .map(p => typeof p === 'string' ? p : p.pin)
            .filter(Boolean);
        if (!pinNumbers.length) {
            alert('நகலெடுக்க PIN எண்கள் இல்லை.');
            return;
        }

        const textToCopy = pinNumbers.join(', ');
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            alert('PIN எண்கள் கிளிப்போர்டில் நகலெடுக்கப்பட்டது.');
        } catch (err) {
            console.error('Copy failed', err);
            alert('நகலெடுக்க முடியவில்லை. தயவு செய்து கைமுறையாக நகலெடுக்கவும்.');
        }
    };

    const filteredEvents = events.filter(event => {
        const searchTerm = searchQuery.toLowerCase();
        const eventDate = new Date(event.date).toLocaleDateString('en-GB'); // DD/MM/YYYY
    
        return (
            (event.id && event.id.toLowerCase().includes(searchTerm)) ||
            (eventDate && eventDate.toLowerCase().includes(searchTerm)) ||
            (event.eventHead && event.eventHead.toLowerCase().includes(searchTerm)) ||
            (event.eventOrganizer && event.eventOrganizer.toLowerCase().includes(searchTerm))
        );
    });
    
    const { hour, minute, period } = formatTo12Hour(formData.time);

    return (
        <div className="event-page">
            <header className="event-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MoiBookIcon size="32px" variant="white" />
                    <h1>மொய்புக்</h1>
                </div>
            </header>
            
            <section className="event-subheader">
                <h2>விழா பதிவு Page</h2>
                <div className="header-actions">
                    <a href="#" className="action-link" onClick={(e) => { e.preventDefault(); onNavigateToRegistrar(); }}>புதிய பதிவாளர் சேர்க்கை</a>
                    <a href="#" className="action-link" style={{marginLeft: '8px'}} onClick={(e) => { e.preventDefault(); onNavigateToMembers && onNavigateToMembers(); }}>உறுப்பினர் நிர்வாகம்</a>
                    <button className="icon-button" onClick={onLogout} aria-label="Logout">
                        <span className="icon">logout</span>
                    </button>
                </div>
            </section>

            

            <form className="event-form" onSubmit={handleSubmit}>
                <h3 className="event-form-title">
                    {editingEventId ? 'விழா விவரங்களைத் திருத்துக' : 'புதிய விழா பதிவு'}
                </h3>
                <div className="event-form-tabs" role="tablist" aria-label="விழா விவரங்கள்">
                    <button
                        type="button"
                        className={`tab-button ${activeDetailsTab === 'event' ? 'active' : ''}`}
                        onClick={() => setActiveDetailsTab('event')}
                        role="tab"
                        aria-selected={activeDetailsTab === 'event'}
                    >
                        விழா விவரங்கள்
                    </button>
                </div>

                {activeDetailsTab === 'event' && (
                <div className="form-grid" role="tabpanel">
                    <div className="form-group">
                        <label htmlFor="eventName">விழா பெயர் தேர்வு</label>
                        <select id="eventName" name="eventName" value={formData.eventName} onChange={handleEventNameChange} required>
                            <option value="" disabled>தேர்வு செய்க</option>
                            <option value="திருமண விழா">திருமண விழா</option>
                            <option value="திருமண வரவேற்பு விழா">திருமண வரவேற்பு விழா</option>
                            <option value="காதணி விழா">காதணி விழா</option>
                            <option value="புதுமணை புகுவிழா">புதுமணை புகுவிழா</option>
                            <option value="இல்ல விழா">இல்ல விழா</option>
                            <option value="பூப்புனித நீராட்டு விழா">பூப்புனித நீராட்டு விழா</option>
                            <option value="கோவில் திருவிழா">கோவில் திருவிழா</option>
                        </select>
                    </div>
                    
                    {showSideRadio && (
                        <div className="form-group">
                           <label>விழா சாரார்</label>
                           <div className="radio-group">
                               <label>
                                   <input type="radio" name="eventSide" value="மணமகன் வீட்டார்" checked={formData.eventSide === "மணமகன் வீட்டார்"} onChange={handleInputChange} required/>
                                   மணமகன் வீட்டார்
                               </label>
                               <label>
                                   <input type="radio" name="eventSide" value="மணமகள் வீட்டார்" checked={formData.eventSide === "மணமகள் வீட்டார்"} onChange={handleInputChange} required/>
                                   மணமகள் வீட்டார்
                               </label>
                           </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="date">தேதி</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>நேரம்</label>
                        <button type="button" className="time-picker-trigger" onClick={() => setIsTimePickerOpen(true)}>
                            {`${hour}:${minute} ${period}`}
                            <span className="icon">schedule</span>
                        </button>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="eventHead">விழா தலைவர் பெயர்</label>
                        <input type="text" id="eventHead" name="eventHead" value={formData.eventHead} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="eventHeadProf">தொழில்/படிப்பு</label>
                        <input type="text" id="eventHeadProf" name="eventHeadProf" value={formData.eventHeadProf} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="eventOrganizer">விழா அமைப்பாளர் பெயர்</label>
                        <input type="text" id="eventOrganizer" name="eventOrganizer" value={formData.eventOrganizer} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="eventOrganizerProf">தொழில்/படிப்பு</label>
                        <input type="text" id="eventOrganizerProf" name="eventOrganizerProf" value={formData.eventOrganizerProf} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="venue">மண்டபம்</label>
                        <input type="text" id="venue" name="venue" value={formData.venue} onChange={handleInputChange} />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="place">இடம்</label>
                        <input type="text" id="place" name="place" value={formData.place} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">தொலைபேசி எண்</label>
                        <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} pattern="[0-9]{10}" title="சரியாக 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="invitationCount">பத்திரிக்கை எண்ணிக்கை</label>
                        <input type="text" id="invitationCount" name="invitationCount" value={formData.invitationCount} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tableCount">மேசை எண்ணிக்கை</label>
                        <input type="text" id="tableCount" name="tableCount" value={formData.tableCount} onChange={handleInputChange} />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="address">முகவரி</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows="3"></textarea>
                    </div>

                    {editingEventId && (
                        <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--button-border)', paddingTop: '1.5rem' }}>
                            <label style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>அனுமதி PIN எண்கள்</label>
                            {formData.approvalPins && formData.approvalPins.length > 0 ? (
                                <div className="pin-display">
                                    {formData.approvalPins.map((pinObj, index) => {
                                        // Handle both old format (string) and new format (object)
                                        const pinNumber = typeof pinObj === 'string' ? pinObj : pinObj.pin;
                                        const isUsed = typeof pinObj === 'object' ? pinObj.used : false;
                                        const usedBy = typeof pinObj === 'object' ? pinObj.usedBy : null;
                                        
                                        return (
                                            <div 
                                                key={pinNumber} 
                                                className="pin-chip" 
                                                style={{
                                                    backgroundColor: isUsed ? '#ffebee' : '#e8f5e9',
                                                    borderColor: isUsed ? '#ef5350' : '#4caf50',
                                                    position: 'relative',
                                                    paddingBottom: usedBy ? '1.8rem' : '0.5rem'
                                                }}
                                            >
                                                <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{pinNumber}</div>
                                                {isUsed ? (
                                                    <div style={{
                                                        fontSize: '0.7rem', 
                                                        color: '#c62828',
                                                        marginTop: '0.2rem',
                                                        position: 'absolute',
                                                        bottom: '0.3rem',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                       
                                                    }}>
                                                        ✓ பயன்படுத்தப்பட்டது {usedBy && `(${usedBy})`}
                                                    </div>
                                                ) : (
                                                    <div style={{fontSize: '0.7rem', color: '#2e7d32', marginTop: '0.2rem'}}>
                                                        ● செய்யாது
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p>இந்த விழாவிற்கு இன்னும் PIN எண்கள் உருவாக்கப்படவில்லை.</p>
                            )}
                            <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: '1rem', borderTop: 'none', padding: 0 }}>
                                <button type="button" className="button" onClick={generatePins}>
                                    10 புதிய PIN-களை உருவாக்கு
                                </button>
                                <button 
                                    type="button" 
                                    className="button" 
                                    onClick={handleCopyPins}
                                    disabled={!formData.approvalPins || formData.approvalPins.length === 0}
                                >
                                    PIN-களை நகலெடு
                                </button>
                                <button 
                                    type="button" 
                                    className="button clear-button" 
                                    onClick={handleSendSms} 
                                    disabled={!formData.approvalPins || formData.approvalPins.length === 0}
                                >
                                    PIN-களை SMS அனுப்பு
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                )}


                    <div className="form-actions">
                        <button type="button" className="button clear-button" onClick={handleClearForm}>புதிதாக்கு</button>
                        <button type="submit" className="button">
                            {editingEventId ? 'புதுப்பி' : 'சேமி'}
                        </button>
                    </div>
            </form>

            <section className="event-table-container">
                 <div className="search-container">
                    <input 
                        type="text"
                        className="search-input"
                        placeholder="தேடுக (விழா எண், தேதி, தலைவர், அமைப்பாளர்)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <table className="event-table">
                    <thead>
                        <tr>
                            <th>விழா எண்</th>
                            <th>தேதி / நேரம்</th>
                            <th>மண்டபம் / இடம்</th>
                            <th>விழா பெயர்</th>
                            <th>விழா தலைவர் பெயர்</th>
                            <th>விழா அமைப்பாளர் பெயர்</th>
                            <th>தொலைபேசி எண்</th>
                            <th>பத்திரிக்கை</th>
                            <th>மேசை</th>
                            <th>விழா அனுமதி</th>
                            <th>செயல்</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.map(event => (
                            <tr key={event.id}>
                                <td>
                                    <a href="#" className="serial-link" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(event.id); }}>
                                        {event.id}
                                    </a>
                                </td>
                                <td>{new Date(event.date).toLocaleDateString('en-GB')}<br/>{formatTo12Hour(event.time).hour}:{formatTo12Hour(event.time).minute} {formatTo12Hour(event.time).period}</td>
                                <td>{event.venue}<br/>{event.place}</td>
                                <td>{event.eventName}{event.eventSide && ` (${event.eventSide})`}</td>
                                <td>{event.eventHead}</td>
                                <td>{event.eventOrganizer}</td>
                                <td>{event.phone}</td>
                                <td>{event.invitationCount}</td>
                                <td>{event.tableCount}</td>
                                <td className="permission-cell">
                                    <input 
                                        type="checkbox" 
                                        className="permission-checkbox"
                                        checked={event.permission}
                                        onChange={() => handleTogglePermission(event.id)}
                                        aria-label={`Permission for event ${event.id}`}
                                    />
                                </td>
                                <td className="table-actions">
                                                <button type="button" className="icon-button" aria-label="Edit" onClick={() => handleEdit(event.id)}>
                                        <span className="icon">edit</span>
                                    </button>
                                                <button type="button" className="icon-button" aria-label="View Members" onClick={() => openMembersModal(event.id, event.eventName)}>
                                                    <span className="icon">people</span>
                                                </button>
                                    <button type="button" className="icon-button delete" aria-label="Delete" onClick={() => handleDelete(event.id)}>
                                        <span className="icon">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </section>

            {showMembersModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                    <div className="modal" style={{width: '90%', maxWidth: '800px', background: '#fff', borderRadius: '8px', padding: '1rem', maxHeight: '80vh', overflow: 'auto'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                            <h3 style={{margin: 0}}>விழா {modalEventName} - உறுப்பினர்கள்</h3>
                            <button className="icon-button" onClick={closeMembersModal} aria-label="Close Members List"><span className="icon">close</span></button>
                        </div>
                        {modalLoading ? (
                            <p>ஏற்றுகிறது...</p>
                        ) : (
                            <div>
                                {modalMembers.length === 0 ? (
                                    <p>இந்த விழாவிற்கு எந்த உறுப்பினர்களும் பதிவு செய்யப்படவில்லை.</p>
                                ) : (
                                    <table className="event-table" style={{width: '100%'}}>
                                        <thead>
                                            <tr>
                                                <th>உறுப்பினர் குறியீடு</th>
                                                <th>பெயர்</th>
                                                <th>தொலைபேசி</th>
                                                <th>ஊர்</th>
                                                <th>இணைப்பு</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalMembers.map(m => (
                                                <tr key={m.memberCode || m.member_code || m.id}>
                                                    <td>{m.memberCode || m.member_code || m.memberId || ''}</td>
                                                    <td>{m.fullName || m.name || m.baseName || ''}</td>
                                                    <td>{m.phone || ''}</td>
                                                    <td>{m.town || ''}</td>
                                                    <td>{m.relationshipName || m.relationship || ''}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {isTimePickerOpen && (
                <TimePicker 
                    initialTime={formatTo12Hour(formData.time)}
                    onSelect={handleTimeSet}
                    onClose={() => setIsTimePickerOpen(false)}
                />
            )}

             <footer className="footer">
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}

