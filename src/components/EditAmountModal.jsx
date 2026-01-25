/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function EditAmountModal({ entry, event, onSave, onClose, updatePinUsage }) {
    const [newAmount, setNewAmount] = useState(entry.amount.toString());
    // Initialize denominations from entry if they exist, otherwise start fresh
    const [denominations, setDenominations] = useState(entry.denominations || notes.reduce((acc, note) => ({...acc, [note]: ''}), {}));
    const [reason, setReason] = useState('');
    const [pin, setPin] = useState('');

    const isDecreasing = parseFloat(newAmount) < entry.amount;
    
    const handleCountChange = (note, value) => {
        const count = value.replace(/[^0-9]/g, '');
        setDenominations(prev => ({...prev, [note]: count}));
    };

    const currentTotal = useMemo(() => {
        return notes.reduce((sum, note) => {
            const count = parseInt(denominations[note], 10) || 0;
            return sum + (count * note);
        }, 0);
    }, [denominations]);

    const isMatch = currentTotal === parseFloat(newAmount);

    const handleSubmit = () => {
        if (!newAmount || parseFloat(newAmount) <= 0) {
            alert('சரியான தொகையை உள்ளிடவும்.');
            return;
        }

        if (isDecreasing) {
            if (!reason) {
                alert('தொகையைக் குறைப்பதற்கான காரணத்தை உள்ளிடவும்.');
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
        }
        
        if (!isMatch) {
            alert('பணப்பிரிப்பு மொத்தமும் புதிய தொகையும் பொருந்தவில்லை.');
            return;
        }

        onSave(entry.id, parseFloat(newAmount), denominations, isDecreasing ? pin : null);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{maxWidth: '600px'}}>
                <div className="modal-header">
                    <h3>மொய் தொகையைத் திருத்து</h3>
                    <button className="icon-button" onClick={onClose}><span className="icon">close</span></button>
                </div>
                <div className="modal-body">
                    <div className="total-summary">
                        <span>தற்போதைய தொகை:</span>
                        <span className="total-value">₹ {entry.amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="form-group floating-label-group">
                        <input
                            type="tel"
                            name="newAmount"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9]/g, ''))}
                            className="amount-input"
                            placeholder=" "
                        />
                        <label>புதிய மொய் தொகை</label>
                    </div>

                    {isDecreasing && (
                        <div className="approval-section">
                            <div className="form-group">
                                <label htmlFor="reason">தொகை குறைப்பதற்கான காரணம்</label>
                                <textarea id="reason" rows="2" value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                            </div>
                             <div className="form-group">
                                <label htmlFor="pin">அனுமதி PIN</label>
                                <input type="tel" id="pin" value={pin} onChange={(e) => setPin(e.target.value)} maxLength="4" />
                            </div>
                        </div>
                    )}
                    
                    <h4 style={{color: 'var(--primary-color)', marginTop: '1rem', borderTop: '1px solid var(--button-border)', paddingTop: '1rem'}}>புதிய பணப்பிரிப்பு</h4>
                    <div className="denomination-modal-body">
                        {notes.map(note => {
                            const count = denominations[note] || '';
                            const total = (note * (parseInt(count, 10) || 0)).toLocaleString('en-IN');
                            return (
                                <div className="denomination-row" key={note}>
                                    <label>₹ {note} x</label>
                                    <input
                                        type="tel"
                                        value={count}
                                        onChange={(e) => handleCountChange(note, e.target.value)}
                                        placeholder="0"
                                    />
                                    <span>=</span>
                                    <span style={{ textAlign: 'right' }}>{total}</span>
                                </div>
                            );
                        })}
                    </div>
                     <div className="total-summary" style={{marginTop: '1rem'}}>
                        <span>பிரித்ததில் மொத்தம்:</span>
                        <span className={`total-value ${isMatch ? 'match' : 'mismatch'}`}>
                            ₹ {currentTotal.toLocaleString('en-IN')}
                        </span>
                    </div>

                </div>
                <div className="modal-actions">
                    <button className="button clear-button" onClick={onClose}>ரத்துசெய்</button>
                    <button className="button" onClick={handleSubmit}>தொகையைச் சேமி</button>
                </div>
            </div>
        </div>
    );
}
