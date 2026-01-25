/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';

export default function DeleteConfirmationModal({ entry, event, onDelete, onClose, updatePinUsage }) {
    const [reason, setReason] = useState('');
    const [pin, setPin] = useState('');

    const handleDelete = () => {
        if (!reason) {
            alert('பதிவை நீக்குவதற்கான காரணத்தை உள்ளிடவும்.');
            return;
        }
        
        // Check PIN validity (handle both string and object formats)
        const validPin = event.approvalPins?.some(p => {
            const pinNumber = typeof p === 'string' ? p : p.pin;
            return pinNumber === pin;
        });
        
        if (!validPin) {
            alert('தவறான அனுமதி PIN.');
            return;
        }
        
        onDelete(entry.id, pin);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>பதிவை நீக்க உறுதிப்படுத்தவும்</h3>
                    <button className="icon-button" onClick={onClose}><span className="icon">close</span></button>
                </div>
                <div className="modal-body">
                    <p>
                        <strong>{entry.name}</strong> (வரிசை எண்: {entry.id}, தொகை: ₹{entry.amount.toLocaleString('en-IN')})
                        என்ற பதிவை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?
                    </p>
                    <p>இந்தச் செயலைச் செயல்தவிர்க்க முடியாது.</p>

                    <div className="approval-section">
                        <div className="form-group">
                            <label htmlFor="reason">நீக்குவதற்கான காரணம்</label>
                            <textarea id="reason" rows="3" value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="pin">அனுமதி PIN</label>
                            <input type="tel" id="pin" value={pin} onChange={(e) => setPin(e.target.value)} maxLength="4" />
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="button clear-button" onClick={onClose}>இல்லை, ரத்துசெய்</button>
                    <button className="button" style={{backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-hover-color)', color: '#fff'}} onClick={handleDelete}>ஆம், நீக்கு</button>
                </div>
            </div>
        </div>
    );
}