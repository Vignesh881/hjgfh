/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useMemo, useRef } from 'react';

// A modified SearchableComboBox for this modal (no placeholder)
const SearchableComboBox = ({ options, value, onValueChange, onOptionSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const componentRef = useRef(null);

    const filteredOptions = useMemo(() => {
        if (!value) return options;
        return options.filter(o => o.name.toLowerCase().includes(value.toLowerCase()));
    }, [value, options]);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (componentRef.current && !componentRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="searchable-dropdown" ref={componentRef}>
            <input
                type="text"
                className="searchable-dropdown-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
            />
            {isOpen && (
                <div className="searchable-dropdown-list">
                    {filteredOptions.map(option => (
                        <div key={option.id} className="searchable-dropdown-item" onClick={() => {
                            onOptionSelect(option);
                            setIsOpen(false);
                        }}>
                            {option.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default function EditEntryModal({ entry, onSave, onClose, towns, people }) {
    const [formData, setFormData] = useState(entry);
    const [townInputValue, setTownInputValue] = useState('');
    const phoneInputRef = useRef(null);

    useEffect(() => {
        setFormData(entry);
    }, [entry]);
    
    useEffect(() => {
      const selectedTown = towns.find(t => t.id === formData.townId);
      setTownInputValue(selectedTown ? selectedTown.name : formData.town || '');
    }, [formData.townId, formData.town, towns]);

    const filteredPeople = useMemo(() => {
        if (!formData.townId) return people;
        return people.filter(p => p.townId === formData.townId);
    }, [formData.townId, people]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;

        if (name === 'amount') {
            const numeric = Number(finalValue);
            if (Number.isNaN(numeric) || numeric < 0) return;
            setFormData(prev => ({ ...prev, amount: numeric }));
            return;
        }

        if (name === 'phone') {
            finalValue = finalValue.replace(/[^0-9]/g, '');
            if (finalValue.length > 10) return;
        } else if (name === 'education') {
            finalValue = finalValue.replace(/[^a-zA-Z\s.]/g, '');
        } else if (name === 'initial') {
            // Allow up to 5 English, Tamil, or dot characters for initials.
            const sanitized = value.replace(/[^a-zA-Z\u0B80-\u0BFF.]/g, '');
            finalValue = sanitized.slice(0, 5).toUpperCase();
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handlePhoneBlur = () => {
        if (formData.phone && formData.phone.length !== 10) {
            alert('தொலைபேசி எண் சரியாக 10 இலக்க எண்ணாக இருக்க வேண்டும்.');
            phoneInputRef.current?.focus();
        }
    };
    
    const handleSubmit = () => {
        const parsedAmount = Number(formData.amount ?? 0);
        if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
             alert('செல்லுபடியாகும் மொய் தொகையை உள்ளிடவும்.');
             return;
        }
        if (formData.phone && formData.phone.length !== 10) {
             alert('தொலைபேசி எண் 10 இலக்க எண்ணாக இருக்க வேண்டும்.');
             return;
        }

        // If amount was changed in this modal, ensure denominations match; else ask user to use amount edit modal
        const amountChanged = parsedAmount !== entry.amount;
        if (amountChanged) {
            const denom = entry.denominations || {};
            const denomTotal = [500,200,100,50,20,10,5,2,1].reduce((sum, note) => {
                const count = parseInt(denom[note], 10) || 0;
                return sum + (count * note);
            }, 0);
            const hasDenoms = Object.values(denom).some(v => (parseInt(v,10) || 0) > 0);
            if (!hasDenoms || denomTotal !== parsedAmount) {
                alert('தொகை மாற்றும்போது பணப்பிரிப்பும் சேர்க்க வேண்டும். "₹" (amount) செல் மீது கிளிக் செய்து புதிய denomination எண்ணிக்கையை உள்ளிடவும்.');
                return;
            }
        }
        // Reconstruct names and relationships before saving
        const townName = towns.find(t => t.id === formData.townId)?.name || townInputValue;
        const initialText = (formData.initial || '').trim();
        const initialWithDot = initialText ? `${initialText}${initialText.endsWith('.') ? '' : '.'}` : '';
        const nameText = [initialWithDot, (formData.baseName || '').trim()].filter(Boolean).join(' ').trim();
        const relationshipName = (formData.relationshipName || '').trim();
        const relationship = relationshipName ? `${relationshipName} ${formData.relationshipType === 'son' ? 'மகன்' : 'மகள்'}` : '';

        const updatedEntry = {
            ...formData,
            amount: parsedAmount,
            town: townName,
            name: nameText,
            relationship,
            relationshipName,
            note: (formData.note || '').trim(),
        };
        onSave(updatedEntry);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{maxWidth: '850px'}}>
                <div className="modal-header">
                    <h3>பதிவைத் திருத்து (வரிசை எண்: {entry.id})</h3>
                    <button className="icon-button" onClick={onClose}><span className="icon">close</span></button>
                </div>
                <div className="modal-body">
                    <form className="event-form" onSubmit={(e) => e.preventDefault()} style={{padding: 0, boxShadow: 'none'}}>
                         <div className="edit-modal-grid">
                            {/* Row 1 */}
                            <div className="edit-modal-form-group">
                                <label>ஊர்</label>
                                <SearchableComboBox 
                                    options={towns} 
                                    value={townInputValue}
                                    onValueChange={(val) => {
                                        setTownInputValue(val);
                                        if (!towns.some(t => t.name === val)) {
                                          setFormData(p => ({...p, townId: ''}));
                                        }
                                    }}
                                    onOptionSelect={(option) => {
                                        setFormData(p => ({...p, townId: option.id}));
                                        setTownInputValue(option.name);
                                    }}
                                />
                            </div>
                            <div className="edit-modal-form-group">
                                <label>தெரு/ இருப்பு</label>
                                <input type="text" name="street" value={formData.street} onChange={handleInputChange} />
                            </div>
                            
                            {/* Row 2 */}
                            <div className="edit-modal-name-group">
                                <div className="edit-modal-form-group">
                                    <label>Initial</label>
                                    <input type="text" name="initial" value={formData.initial} onChange={handleInputChange} />
                                </div>
                                <div className="edit-modal-form-group">
                                    <label>பெயர்</label>
                                     <SearchableComboBox
                                        options={filteredPeople}
                                        value={formData.baseName}
                                        onValueChange={(val) => setFormData(p => ({ ...p, baseName: val }))}
                                        onOptionSelect={(person) => {
                                            setFormData(p => ({
                                                ...p,
                                                baseName: person.name,
                                                initial: person.initial,
                                                phone: person.phone,
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="edit-modal-form-group">
                                <label>பெற்றோர் பெயர்</label>
                                <input type="text" name="relationshipName" value={formData.relationshipName} onChange={handleInputChange} />
                            </div>

                            {/* Row 3 */}
                            <div className="edit-modal-form-group">
                                <label>படிப்பு (English only)</label>
                                <input type="text" name="education" value={formData.education} onChange={handleInputChange} />
                            </div>
                             <div className="edit-modal-form-group">
                                <label>தொழில்</label>
                                <input type="text" name="profession" value={formData.profession} onChange={handleInputChange} />
                            </div>
                            
                            {/* Row 4 */}
                             <div className="edit-modal-form-group">
                                <label>தொலைபேசி எண்</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} onBlur={handlePhoneBlur} ref={phoneInputRef} />
                            </div>
                            <div className="edit-modal-form-group">
                                <label>தொகை</label>
                                <input type="number" name="amount" min="0" step="1" value={formData.amount ?? ''} onChange={handleInputChange} />
                            </div>
                            <div className="edit-modal-form-group">
                                <label>உறவு முறை</label>
                                <div className="radio-group edit-modal-radio-group">
                                    <label><input type="radio" name="relationshipType" value="son" checked={formData.relationshipType === 'son'} onChange={handleInputChange} disabled={!formData.relationshipName}/> மகன்</label>
                                    <label><input type="radio" name="relationshipType" value="daughter" checked={formData.relationshipType === 'daughter'} onChange={handleInputChange} disabled={!formData.relationshipName}/>மகள்</label>
                                </div>
                            </div>

                            {/* Row 5 */}
                             <div className="edit-modal-form-group full-width">
                                <label>குறிப்பு</label>
                                <input type="text" name="note" value={formData.note} onChange={handleInputChange} />
                            </div>

                            {/* Row 6 */}
                             <div className="edit-modal-form-group">
                                <div className="checkbox-group edit-modal-checkbox-group">
                                   <label><input type="checkbox" name="isMaternalUncle" checked={formData.isMaternalUncle} onChange={handleInputChange}/> தாய்மாமன்</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-actions">
                    <button className="button clear-button" onClick={onClose}>ரத்துசெய்</button>
                    <button className="button" onClick={handleSubmit}>மாற்றங்களைச் சேமி</button>
                </div>
            </div>
        </div>
    );
}