/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useRef, useEffect } from 'react';

const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const initialDenominations = notes.reduce((acc, note) => ({...acc, [note]: ''}), {});

export default function ExpenseModal({ event, onSave, onClose, updatePinUsage }) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [pin, setPin] = useState('');
    const [denominations, setDenominations] = useState(initialDenominations);
    const amountInputRef = useRef(null);

    useEffect(() => {
        amountInputRef.current?.focus();
    }, []);

    const handleCountChange = (note, value) => {
        const count = value.replace(/[^0-9]/g, '');
        setDenominations(prev => ({...prev, [note]: count}));
    };

    const denominationTotal = useMemo(() => {
        return notes.reduce((sum, note) => {
            const count = parseInt(denominations[note], 10) || 0;
            return sum + (count * note);
        }, 0);
    }, [denominations]);

    const expenseAmount = parseFloat(amount) || 0;
    const isMatch = denominationTotal === expenseAmount;

    const handleSave = () => {
        if (!amount || expenseAmount <= 0) {
            alert('சரியான தொகையை உள்ளிடவும்.');
            return;
        }
        if (!reason.trim()) {
            alert('செலவுக்கான காரணத்தை உள்ளிடவும்.');
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
        if (!isMatch) {
            alert('செலவுத் தொகையும் பணப்பிரிப்பு மொத்தமும் பொருந்தவில்லை.');
            return;
        }
        
        // Save expense entry and pass PIN for tracking
        onSave({ amount, reason, denominations, usedPin: pin });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{maxWidth: '600px'}}>
                <div className="modal-header">
                    <h3>புதிய செலவு பதிவு</h3>
                    <button className="icon-button" onClick={onClose}><span className="icon">close</span></button>
                </div>
                <div className="modal-body">
                    <div className="form-group floating-label-group">
                        <input
                            type="tel"
                            ref={amountInputRef}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                            className="amount-input"
                            style={{textAlign: 'left', paddingLeft: '1rem'}}
                            placeholder=" "
                        />
                        <label>செலவுத் தொகை</label>
                    </div>

                    <h4 style={{color: 'var(--primary-color)', marginTop: '1rem', borderTop: '1px solid var(--button-border)', paddingTop: '1rem'}}>பணப்பிரிப்பு</h4>
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
                        <span className={`total-value ${isMatch && expenseAmount > 0 ? 'match' : 'mismatch'}`}>
                            ₹ {denominationTotal.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <div className="approval-section" style={{marginTop: '1rem'}}>
                        <div className="form-group">
                            <label htmlFor="reason">காரணம்</label>
                            <textarea id="reason" rows="2" value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="pin">அனுமதி PIN</label>
                            <input type="password" id="pin" value={pin} onChange={(e) => setPin(e.target.value)} maxLength="4" />
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="button clear-button" onClick={onClose}>ரத்துசெய்</button>
                    <button className="button" onClick={handleSave} disabled={!isMatch || expenseAmount === 0}>செலவைச் சேமி</button>
                </div>
            </div>
        </div>
    );
}
