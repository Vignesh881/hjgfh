/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';
import { MoiBookIcon } from './MoiBookLogo';

const initialFormData = {
    name: '',
    address: '',
    phone: '',
    designation: '',
};

export default function RegistrarPage({ registrars, addOrUpdateRegistrar, deleteRegistrar, togglePermission, onBack }) {
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phone.length !== 10) {
            alert('தொலைபேசி எண் 10 இலக்க எண்ணாக இருக்க வேண்டும்.');
            return;
        }

        const registrarData = { id: editingId, ...formData };
        await addOrUpdateRegistrar(registrarData, !!editingId);
        handleClear();
    };

    const handleEdit = (id) => {
        const registrarToEdit = registrars.find(r => r.id === id);
        if (registrarToEdit) {
            setFormData({
                name: registrarToEdit.name,
                address: registrarToEdit.address,
                phone: registrarToEdit.phone,
                designation: registrarToEdit.designation,
            });
            setEditingId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('இந்த பதிவாளரை நீக்க விரும்புகிறீர்களா?')) {
            await deleteRegistrar(id);
            if (editingId === id) {
                handleClear();
            }
        }
    };

    const handleTogglePermission = async (id) => {
        await togglePermission(id);
    };

    const handleClear = () => {
        setFormData(initialFormData);
        setEditingId(null);
    };

    return (
        <div className="event-page">
            <header className="event-header">
                <MoiBookIcon size={32} />
                <h1>மொய்புக்</h1>
            </header>

            <section className="event-subheader">
                 <div className="page-header-left">
                    <button className="icon-button back-button" onClick={onBack} aria-label="Back to previous page">
                        <span className="icon">arrow_back</span>
                    </button>
                    <h2>புதிய பதிவாளர் சேர்க்கை</h2>
                </div>
            </section>

            <form className="event-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="name">பெயர்</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">தொலைபேசி எண்</label>
                        <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required pattern="\d{10}" title="10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="designation">பதவி</label>
                        <select id="designation" name="designation" value={formData.designation} onChange={handleInputChange} required>
                            <option value="" disabled>பதவியைத் தேர்ந்தெடுக்கவும்</option>
                            <option value="காசாளர்">காசாளர்</option>
                            <option value="தட்டச்சாளர்">தட்டச்சாளர்</option>
                        </select>
                    </div>
                     <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="address">முகவரி</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows="2" required></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="button clear-button" onClick={handleClear}>புதிதாக்கு</button>
                        <button type="submit" className="button">
                            {editingId ? 'புதுப்பி' : 'சேமி'}
                        </button>
                    </div>
                </div>
            </form>

            <section className="event-table-container">
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>வரிசை எண்</th>
                            <th>பெயர்</th>
                            <th>தொலைபேசி எண்</th>
                            <th>முகவரி</th>
                            <th>பதவி</th>
                            <th>விழா அனுமதி</th>
                            <th>செயல்</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrars.map(r => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.name}</td>
                                <td>{r.phone}</td>
                                <td>{r.address}</td>
                                <td>{r.designation}</td>
                                <td className="permission-cell">
                                    <input 
                                        type="checkbox" 
                                        className="permission-checkbox"
                                        checked={r.permission}
                                        onChange={() => handleTogglePermission(r.id)}
                                    />
                                </td>
                                <td className="table-actions">
                                    <button type="button" className="icon-button" onClick={() => handleEdit(r.id)}>
                                        <span className="icon">edit</span>
                                    </button>
                                    <button type="button" className="icon-button delete" onClick={() => handleDelete(r.id)}>
                                        <span className="icon">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
             <footer className="footer">
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}