import React from 'react';

const EventDatabaseModal = ({ isOpen, onClose, eventData }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', minWidth: '400px' }}>
        <h2 style={{ color: '#764ba2', marginBottom: '16px' }}>விழா தரவுத்தளம்</h2>
        <div>
          <label>விழா பெயர்:</label>
          <div>{eventData?.eventName || 'N/A'}</div>
        </div>
        <div>
          <label>விழா தேதி:</label>
          <div>{eventData?.eventDate || 'N/A'}</div>
        </div>
        <div>
          <label>உறுப்பினர் பெயர்:</label>
          <div>{eventData?.memberName || 'N/A'}</div>
        </div>
        <div>
          <label>மொய் தொகை:</label>
          <div>{eventData?.amount || 'N/A'}</div>
        </div>
        <div>
          <label>PIN எண்:</label>
          <div>{eventData?.pin || 'N/A'}</div>
        </div>
        <button onClick={onClose} style={{ marginTop: '24px', padding: '10px 20px', background: '#764ba2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>மூடவும்</button>
      </div>
    </div>
  );
};

export default EventDatabaseModal;
