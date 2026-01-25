

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useMemo } from 'react';

// Helper to format date and time as in EventPage
const formatTo12Hour = (time24) => {
    if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) {
        return { hour: '00', minute: '00', period: '' };
    }
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    return {
        hour: String(hour12).padStart(2, '0'),
        minute: m,
        period,
    };
};

export default function MoiEntryPage({ events, settings, registrars, loggedInTable, onLogout, onNavigateToMoiForm }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isOnline, setIsOnline] = useState(true); // State for connection status

    // Effect to set the selected event based on settings
    useEffect(() => {
        const defaultEvent = events.find(e => e.id === settings.defaultEventId);
        setSelectedEvent(defaultEvent || null);
    }, [settings.defaultEventId, events]);

    const assignedRegistrars = useMemo(() => {
        if (!loggedInTable || !settings.registrarAssignments || !registrars) {
            return { typistName: 'தேர்வு செய்யப்படவில்லை', cashierName: 'தேர்வு செய்யப்படவில்லை' };
        }

        const assignment = settings.registrarAssignments[loggedInTable];
        if (!assignment) {
            return { typistName: 'தேர்வு செய்யப்படவில்லை', cashierName: 'தேர்வு செய்யப்படவில்லை' };
        }

        const typist = registrars.find(r => r.id === assignment.typist);
        const cashier = registrars.find(r => r.id === assignment.cashier);

        return {
            typistName: typist ? typist.name : 'தேர்வு செய்யப்படவில்லை',
            cashierName: cashier ? cashier.name : 'தேர்வு செய்யப்படவில்லை'
        };
    }, [loggedInTable, settings.registrarAssignments, registrars]);


    // Only show the event selected in settings
    const eventToShow = settings.defaultEventId
        ? events.find(e => e.id === settings.defaultEventId)
        : null;

    const handleNavigateToMoiForm = () => {
        const assignment = settings.registrarAssignments?.[loggedInTable];
        if (assignment && assignment.typist && assignment.cashier) {
            onNavigateToMoiForm();
        } else {
            alert('பதிவாளர்கள் தேர்வு செய்யப்படவில்லை! தொடர, முதலில் Settings-க்குச் சென்று இந்த மேசைக்கு தட்டச்சாளர் மற்றும் காசாளரைத் தேர்வு செய்யவும்.');
        }
    };

    return (
        <div className="master-page">
            <header className="master-header">
                <div className="header-left">
                     <div className="connection-status">
                        <span className={`icon status-indicator ${isOnline ? 'status-ok' : ''}`}>wifi</span>
                        <span className={`icon status-indicator ${isOnline ? 'status-ok' : ''}`}>lan</span>
                        <span className={`icon status-indicator ${isOnline ? 'status-ok' : ''}`}>database</span>
                    </div>
                    <div style={{ lineHeight: '1.3' }}>
                        <div>விழா எண்: {selectedEvent ? selectedEvent.id : '----'}</div>
                        <div>மேசை: {loggedInTable}</div>
                    </div>
                </div>
                <div className="header-center">
                    {selectedEvent ? (
                        <>
                            <h2>{selectedEvent.eventName}{selectedEvent.eventSide && ` (${selectedEvent.eventSide})`}</h2>
                            <p>தலைவர்: {selectedEvent.eventHead}</p>
                            <p>அமைப்பாளர்: {selectedEvent.eventOrganizer}</p>
                            <p>தேதி: {new Date(selectedEvent.date).toLocaleDateString('en-GB')}</p>
                        </>
                    ) : (
                         <h2>விழாவைத் தேர்ந்தெடுக்கவும்</h2>
                    )}
                </div>
                <div className="header-right">
                    <button className="icon-button" aria-label="Menu">
                        <span className="icon">menu</span>
                    </button>
                    <button className="icon-button" aria-label="Refresh">
                        <span className="icon">refresh</span>
                    </button>
                    <button className="icon-button" onClick={onLogout} aria-label="Logout">
                        <span className="icon">logout</span>
                    </button>
                </div>
            </header>

            <main className="master-content">
                <div className="event-table-container">
                    <table className="event-table master-table">
                        <thead>
                            <tr>
                                <th>விழா எண்</th>
                                <th>தேதி /நேரம்</th>
                                <th>மண்டபம் / இடம்</th>
                                <th>விழா பெயர்</th>
                                <th>விழா தலைவர் பெயர்</th>
                                <th>விழா அமைப்பாளர் பெயர்</th>
                                <th>செயல்</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventToShow ? (
                                <tr key={eventToShow.id} className='selected'>
                                    <td>{eventToShow.id}</td>
                                    <td>{new Date(eventToShow.date).toLocaleDateString('en-GB')}<br/>{formatTo12Hour(eventToShow.time).hour}:{formatTo12Hour(eventToShow.time).minute} {formatTo12Hour(eventToShow.time).period}</td>
                                    <td>{eventToShow.venue}<br/>{eventToShow.place}</td>
                                    <td>{eventToShow.eventName}{eventToShow.eventSide && ` (${eventToShow.eventSide})`}</td>
                                    <td>{eventToShow.eventHead}</td>
                                    <td>{eventToShow.eventOrganizer}</td>
                                    <td className="table-actions">
                                        <button 
                                            type="button" 
                                            className="button" 
                                            style={{padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                                            aria-label="Moi Entry" 
                                            onClick={handleNavigateToMoiForm}
                                        >
                                            <span className="icon">add_card</span>
                                            Moi Entry
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Settings-ல் விழாவைத் தேர்ந்தெடுக்கவும்
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 <div style={{textAlign: 'center', marginTop: '2rem', color: 'var(--primary-color)'}}>
                    <h3 style={{marginBottom: '0.5rem'}}>பயனர் விபரம்</h3>
                    <p style={{ margin: '0.2rem 0' }}><strong>தட்டச்சாளர்:</strong> {assignedRegistrars.typistName}</p>
                    <p style={{ margin: '0.2rem 0' }}><strong>காசாளர்:</strong> {assignedRegistrars.cashierName}</p>
                </div>
            </main>
             <footer className="footer">
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}