

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';

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

export default function MasterPage({ events, settings, onLogout, onNavigateToMasterDashboard, onNavigateToSettings, onSyncMembersFromEntries, isSyncingMembers }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isOnline, setIsOnline] = useState(true); // State for connection status

    // Effect to set the selected event based on settings
    useEffect(() => {
        const defaultEvent = events.find(e => e.id === settings.defaultEventId);
        setSelectedEvent(defaultEvent || null);
    }, [settings.defaultEventId, events]);


    const handleRowClick = (event) => {
        setSelectedEvent(event);
    };

    // Only show the event selected in settings
    const eventsToShow = settings.defaultEventId
        ? events.filter(e => e.id === settings.defaultEventId)
        : [];


    return (
        <div className="master-page">
            <header className="master-header">
                <div className="header-left">
                     <div className="connection-status">
                        <span className={`icon status-indicator ${isOnline ? 'status-ok' : ''}`}>wifi</span>
                        <span className={`icon status-indicator ${isOnline ? 'status-ok' : ''}`}>lan</span>
                        <span className={`icon status-indicator ${isOnline ? 'status-ok' : ''}`}>database</span>
                    </div>
                    <span>விழா எண்: {selectedEvent ? selectedEvent.id : '----'}</span>
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
                    <button className="icon-button" aria-label="Settings" onClick={onNavigateToSettings}>
                        <span className="icon">settings</span>
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
                                <th>தேதி / நேரம்</th>
                                <th>மண்டபம் / இடம்</th>
                                <th>விழா பெயர்</th>
                                <th>விழா தலைவர் பெயர்</th>
                                <th>விழா அமைப்பாளர் பெயர்</th>
                                <th>செயல்</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventsToShow.length > 0 ? (
                                eventsToShow.map(event => (
                                <tr 
                                    key={event.id} 
                                    onClick={() => handleRowClick(event)}
                                    className={selectedEvent?.id === event.id ? 'selected' : ''}
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleRowClick(event)}
                                >
                                    <td>{event.id}</td>
                                    <td>{new Date(event.date).toLocaleDateString('en-GB')}<br/>{formatTo12Hour(event.time).hour}:{formatTo12Hour(event.time).minute} {formatTo12Hour(event.time).period}</td>
                                    <td>{event.venue}<br/>{event.place}</td>
                                    <td>{event.eventName}{event.eventSide && ` (${event.eventSide})`}</td>
                                    <td>{event.eventHead}</td>
                                    <td>{event.eventOrganizer}</td>
                                    <td className="table-actions">
                                        <button 
                                            type="button" 
                                            className="icon-button" 
                                            aria-label="Dashboard" 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click from firing
                                                onNavigateToMasterDashboard(event.id);
                                            }}
                                        >
                                            <span className="icon">dashboard</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-button"
                                            aria-label="Upload members"
                                            title={isSyncingMembers ? 'உறுப்பினர் பதிவேற்றம் நடக்கிறது...' : 'விழா பதிவுகளிலிருந்து உறுப்பினர்களை பதிவேற்று'}
                                            disabled={isSyncingMembers}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSyncMembersFromEntries?.(event.id);
                                            }}
                                        >
                                            <span className="icon">cloud_upload</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        விழாவைத் தேர்ந்தெடுக்கவும்
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
             <footer className="footer">
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}