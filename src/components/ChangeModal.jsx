/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo } from 'react';

const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const initialDenominations = notes.reduce((acc, note) => ({...acc, [note]: ''}), {});

// Reusable component for a single denomination list (received or given)
const DenominationColumn = ({ title, denominations, onCountChange, total }) => (
    <div className="tally-column">
        <h3>{title}</h3>
        <div className="denomination-list-vertical" style={{gap: '0.75rem'}}>
            {notes.map(note => {
                const count = denominations[note] || '';
                const noteTotal = (note * (parseInt(count, 10) || 0)).toLocaleString('en-IN');
                return (
                    <div className="denomination-row" key={note}>
                        <label>₹ {note} x</label>
                        <input
                            type="tel"
                            value={count}
                            onChange={(e) => onCountChange(note, e.target.value)}
                            placeholder="0"
                        />
                        <span>=</span>
                        <span style={{ textAlign: 'right' }}>{noteTotal}</span>
                    </div>
                );
            })}
        </div>
        <div className="tally-summary" style={{marginTop: '1rem', paddingTop: '1rem'}}>
             <div className="summary-row" style={{fontSize: '1.1rem'}}>
                <span>மொத்தம்:</span>
                <span className="value">₹ {total.toLocaleString('en-IN')}</span>
            </div>
        </div>
    </div>
);


export default function ChangeModal({ onSave, onClose }) {
    const [receivedDenominations, setReceivedDenominations] = useState(initialDenominations);
    const [givenDenominations, setGivenDenominations] = useState(initialDenominations);

    const handleCountChange = (setter) => (note, value) => {
        const count = value.replace(/[^0-9]/g, '');
        setter(prev => ({...prev, [note]: count}));
    };

    const calculateTotal = (denominations) => {
        return notes.reduce((sum, note) => {
            const count = parseInt(denominations[note], 10) || 0;
            return sum + (count * note);
        }, 0);
    };

    const receivedTotal = useMemo(() => calculateTotal(receivedDenominations), [receivedDenominations]);
    const givenTotal = useMemo(() => calculateTotal(givenDenominations), [givenDenominations]);

    const isMatch = receivedTotal > 0 && receivedTotal === givenTotal;

    const handleSave = () => {
        if (!isMatch) {
            alert('பெறப்பட்ட மற்றும் கொடுக்கப்பட்ட தொகைகள் சமமாக இருக்க வேண்டும் மற்றும் பூஜ்ஜியத்திற்கு மேல் இருக்க வேண்டும்.');
            return;
        }
        onSave({ 
            received: receivedDenominations,
            given: givenDenominations,
            totalAmount: receivedTotal // or givenTotal, they are the same
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{maxWidth: '800px'}}>
                <div className="modal-header">
                    <h3>சில்லறை மாற்றுதல்</h3>
                    <button className="icon-button" onClick={onClose}><span className="icon">close</span></button>
                </div>
                <div className="modal-body" style={{paddingTop: 0}}>
                    <div className="cash-tally-columns">
                        <DenominationColumn
                            title="பெறப்பட்டது"
                            denominations={receivedDenominations}
                            onCountChange={handleCountChange(setReceivedDenominations)}
                            total={receivedTotal}
                        />
                        <DenominationColumn
                            title="கொடுக்கப்பட்டது"
                            denominations={givenDenominations}
                            onCountChange={handleCountChange(setGivenDenominations)}
                            total={givenTotal}
                        />
                    </div>
                     <div className="total-summary" style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--button-border)'}}>
                        <span>வித்தியாசம்:</span>
                        <span className={`total-value ${isMatch ? 'match' : 'mismatch'}`}>
                           ₹ {(receivedTotal - givenTotal).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
                <div className="modal-actions" style={{paddingTop: 0, borderTop: 'none'}}>
                    <button className="button clear-button" onClick={onClose}>ரத்துசெய்</button>
                    <button className="button" onClick={handleSave} disabled={!isMatch}>மாற்றத்தைச் சேமி</button>
                </div>
            </div>
        </div>
    );
}
