/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { printDenominationBill } from '../lib/printUtils.jsx';

const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const initialDenominations = notes.reduce((acc, note) => ({...acc, [note]: ''}), {});

// Reusable component for the note entry grid
const DenominationGrid = ({ denominations, onCountChange, inputRef }) => (
    <div className="denomination-modal-body">
        {notes.map(note => {
            const count = denominations[note] || '';
            const total = (note * (parseInt(count, 10) || 0)).toLocaleString('en-IN');
            return (
                <div className="denomination-row" key={note}>
                    <label>₹ {note} x</label>
                    <input
                        ref={note === 500 ? inputRef : null}
                        type="tel"
                        value={count}
                        onChange={(e) => onCountChange(note, e.target.value)}
                        placeholder="0"
                    />
                    <span>=</span>
                    <span style={{ textAlign: 'right' }}>{total}</span>
                </div>
            );
        })}
    </div>
);

export default function DenominationModal({ totalAmount, onSave, onClose }) {
    const [receivedDenominations, setReceivedDenominations] = useState(initialDenominations);
    const [givenDenominations, setGivenDenominations] = useState(initialDenominations);
    const input500Ref = useRef(null);

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

    const changeDue = receivedTotal > totalAmount ? receivedTotal - totalAmount : 0;
    
    const isSimpleMatch = receivedTotal === totalAmount;
    const isChangeMatch = changeDue > 0 && givenTotal === changeDue;
    const canSave = isSimpleMatch || isChangeMatch;

    const handleSave = useCallback(() => {
        if (!canSave) {
            alert('மொத்த தொகையும் உள்ளிட்ட தொகையும் பொருந்தவில்லை.');
            return;
        }

        const netDenominations = {};
        const receivedSnapshot = {};
        const givenSnapshot = {};
        notes.forEach(note => {
            const receivedCount = parseInt(receivedDenominations[note], 10) || 0;
            const givenCount = parseInt(givenDenominations[note], 10) || 0;
            if (receivedCount !== 0) {
                receivedSnapshot[note] = receivedCount;
            }
            if (givenCount !== 0) {
                givenSnapshot[note] = givenCount;
            }
            const netCount = receivedCount - givenCount;
            // Only store notes that were actually part of the transaction
            if (netCount !== 0) {
                 netDenominations[note] = netCount;
            }
        });
        
        onSave({
            netDenominations,
            receivedDenominations: receivedSnapshot,
            givenDenominations: givenSnapshot
        });

    }, [canSave, onSave, receivedDenominations, givenDenominations, totalAmount]);

    const handlePrint = useCallback(() => {
        const allDenominations = { ...receivedDenominations };
        // Convert string values to numbers for printing
        Object.keys(allDenominations).forEach(note => {
            allDenominations[note] = parseInt(allDenominations[note], 10) || 0;
        });
        
        printDenominationBill(
            allDenominations,
            totalAmount,
            null,
            `DN-${Date.now().toString().slice(-6)}`
        );
    }, [receivedDenominations, totalAmount]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && canSave) {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [canSave, handleSave]);

    useEffect(() => {
        if (input500Ref.current) {
            input500Ref.current.focus();
        }
    }, []);


    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{maxWidth: '650px'}}>
                <div className="modal-header">
                    <h3>பணப்பிரிப்பு விவரம்</h3>
                    <button className="icon-button" onClick={onClose}><span className="icon">close</span></button>
                </div>
                
                <h4 style={{color: 'var(--label-color)', marginBottom: '1rem'}}>பெறப்பட்ட பணம்</h4>
                <DenominationGrid 
                    denominations={receivedDenominations} 
                    onCountChange={handleCountChange(setReceivedDenominations)}
                    inputRef={input500Ref}
                />
                
                {changeDue > 0 && (
                    <div className="change-details-section">
                        <h4>சில்லறை விவரம்</h4>
                        <div className="change-summary">
                            <span>கொடுக்க வேண்டிய சில்லறை:</span>
                            <span>₹ {changeDue.toLocaleString('en-IN')}</span>
                        </div>
                        <DenominationGrid 
                            denominations={givenDenominations} 
                            onCountChange={handleCountChange(setGivenDenominations)}
                        />
                         <div className="total-summary" style={{marginTop: '1.5rem', borderTop: 'none', paddingTop: 0, marginBottom: 0}}>
                            <span>கொடுத்த சில்லறை மொத்தம்:</span>
                            <span className={`total-value ${givenTotal === changeDue ? 'match' : 'mismatch'}`}>
                                ₹ {givenTotal.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="denomination-modal-footer">
                    <div className="total-summary">
                        <span>பெறப்பட்ட மொத்த பணம்:</span>
                        <span className={`total-value ${(isSimpleMatch && !changeDue) || isChangeMatch ? 'match' : 'mismatch'}`}>
                            ₹ {receivedTotal.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="total-summary">
                        <span>மொய் தொகை:</span>
                        <span className="total-value">
                            ₹ {totalAmount.toLocaleString('en-IN')}
                        </span>
                    </div>
                     <div className="modal-actions" style={{borderTop: 'none', paddingTop: '0'}}>
                        <button className="button clear-button" onClick={onClose}>ரத்துசெய்</button>
                        <button 
                            className="button" 
                            onClick={handlePrint}
                            style={{
                                background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                                color: 'white',
                                margin: '0 4px'
                            }}
                        >
                            🖨️ Print
                        </button>
                        <button className="button" onClick={handleSave} disabled={!canSave}>சேமி</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
