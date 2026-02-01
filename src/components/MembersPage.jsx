/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { MoiBookIcon } from './MoiBookLogo';
import { loadSettings } from '../lib/localStorage';

const initialFormData = {
    memberCode: '',
    initial: '',
    baseName: '',
    fullName: '',
    phone: '',
    town: '',
    street: '',
    address: '',
    relationship: '',
    relationshipName: '',
    education: '',
    profession: '',
    isMaternalUncle: false,
    notes: ''
};

export default function MembersPage({ members, addOrUpdateMember, deleteMember, togglePermission, onBack }) {
    const settings = loadSettings ? loadSettings() : {};
    const orgAddress = settings?.billHeaderAddress || '';
    const orgPhone = settings?.billHeaderPhone || '';
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const [cardState, setCardState] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const cardRef = useRef(null);

    const normalizeMember = (member) => ({
        id: member.id ?? member.memberCode ?? member.member_code ?? '',
        memberCode: member.memberCode || member.member_code || '',
        fullName: member.fullName || member.full_name || member.baseName || member.name || '',
        baseName: member.baseName || member.base_name || member.name || '',
        phone: member.phone || '',
        town: member.town || '',
        education: member.education || '',
        relationship: member.relationshipName || member.relationship_name || member.relationship || '',
        profession: member.profession || '',
        address: member.address || ''
    });

    const buildQrPayload = (member) => {
        const normalized = normalizeMember(member);
        return JSON.stringify({
            memberCode: normalized.memberCode,
            name: normalized.fullName || normalized.baseName,
            phone: normalized.phone,
            town: normalized.town
        });
    };

    const downloadDataUrl = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadMemberIdCard = async (member) => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const payload = buildQrPayload(member);
            const qrDataUrl = await QRCode.toDataURL(payload, { width: 256, margin: 1 });
            setCardState({ member, qrDataUrl });
            await new Promise(resolve => setTimeout(resolve, 120));
            const node = cardRef.current;
            if (!node) throw new Error('ID card render failed');
            const imageData = await toPng(node, { cacheBust: true, pixelRatio: 2 });
            const normalized = normalizeMember(member);
            const safeCode = normalized.memberCode || 'member';
            downloadDataUrl(imageData, `ID_${safeCode}.png`);
        } catch (err) {
            console.error('Failed to download ID card:', err);
            alert('ID Card உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
        } finally {
            setIsDownloading(false);
            setCardState(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
            return;
        }
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: !!checked }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phone && formData.phone.length !== 10) {
            alert('தொலைபேசி எண் 10 இலக்கமாக இருக்க வேண்டும்.');
            return;
        }

        const memberData = { id: editingId, ...formData };
        await addOrUpdateMember(memberData, !!editingId);
        handleClear();
    };

    const handleEdit = (id) => {
        const memberToEdit = members.find(m => (m.id === id || String(m.id) === String(id) || m.memberCode === id));
        if (memberToEdit) {
            setFormData({
                memberCode: memberToEdit.memberCode || memberToEdit.member_code || '',
                initial: memberToEdit.initial || '',
                baseName: memberToEdit.baseName || memberToEdit.base_name || '',
                fullName: memberToEdit.fullName || memberToEdit.full_name || '',
                phone: memberToEdit.phone || '',
                town: memberToEdit.town || '',
                street: memberToEdit.street || '',
                address: memberToEdit.address || '',
                relationship: memberToEdit.relationship || '',
                relationshipName: memberToEdit.relationshipName || memberToEdit.relationship_name || '',
                education: memberToEdit.education || '',
                profession: memberToEdit.profession || '',
                isMaternalUncle: !!memberToEdit.isMaternalUncle,
                notes: memberToEdit.notes || ''
            });
            setEditingId(memberToEdit.id || memberToEdit.memberCode || null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('இந்த உறுப்பினரை நீக்க விரும்புகிறீர்களா?')) return;
        await deleteMember(id);
        if (editingId === id) handleClear();
    };

    const handleClear = () => {
        setFormData(initialFormData);
        setEditingId(null);
    };

    return (
        <div className="event-page">
            <header className="event-header">
                <MoiBookIcon size={32} />
                <h1>உறுப்பினர் நிர்வாகம்</h1>
            </header>

            <section className="event-subheader">
                 <div className="page-header-left">
                    <button className="icon-button back-button" onClick={onBack} aria-label="Back to previous page">
                        <span className="icon">arrow_back</span>
                    </button>
                    <h2>உறுப்பினர் சேர்க்கை / திருத்தம்</h2>
                </div>
            </section>

            <form className="event-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="memberCode">உறுப்பினர் குறியீடு</label>
                        <input id="memberCode" name="memberCode" value={formData.memberCode} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="initial">Initial</label>
                        <input id="initial" name="initial" value={formData.initial} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="baseName">பெயர்</label>
                        <input id="baseName" name="baseName" value={formData.baseName} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">தொலைபேசி</label>
                        <input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} pattern="\d{10}" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="town">ஊர்</label>
                        <input id="town" name="town" value={formData.town} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="relationship">இணைப்பு</label>
                        <input id="relationship" name="relationship" value={formData.relationship} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="education">கல்வி</label>
                        <input id="education" name="education" value={formData.education} onChange={handleInputChange} />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="address">முகவரி</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows="2"></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="button clear-button" onClick={handleClear}>புதிதாக்கு</button>
                        <button type="submit" className="button">{editingId ? 'புதுப்பி' : 'சேமி'}</button>
                    </div>
                </div>
            </form>

            <section className="event-table-container">
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>குறியீடு</th>
                            <th>பெயர்</th>
                            <th>தொலைபேசி</th>
                            <th>ஊர்</th>
                            <th>கல்வி</th>
                            <th>செயல்</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(m => (
                            (() => {
                                const normalized = normalizeMember(m);
                                return (
                            <tr key={m.memberCode || m.id}>
                                <td>{normalized.memberCode}</td>
                                <td>{normalized.fullName || normalized.baseName}</td>
                                <td>{normalized.phone}</td>
                                <td>{normalized.town}</td>
                                <td>{normalized.education}</td>
                                <td className="table-actions">
                                    <button type="button" className="icon-button" onClick={() => handleEdit(m.id || m.memberCode)}>
                                        <span className="icon">edit</span>
                                    </button>
                                    <button type="button" className="icon-button" title="ID Card PNG" onClick={() => downloadMemberIdCard(m)}>
                                        <span className="icon">qr_code_2</span>
                                    </button>
                                    <button type="button" className="icon-button delete" onClick={() => handleDelete(m.id || m.memberCode)}>
                                        <span className="icon">delete</span>
                                    </button>
                                </td>
                            </tr>
                                );
                            })()
                        ))}
                    </tbody>
                </table>
            </section>

            {cardState && (
                <div className="member-idcard-export" aria-hidden="true">
                    <div className="member-idcard" ref={cardRef}>
                        <div className="member-idcard-header">
                            <div className="member-idcard-header-left">
                                <MoiBookIcon size={24} />
                                <div>
                                    <div className="member-idcard-title">MoiBook Member ID</div>
                                    <div className="member-idcard-code">{normalizeMember(cardState.member).memberCode}</div>
                                </div>
                            </div>
                            <div className="member-idcard-org">
                                <div className="member-idcard-org-title">நிறுவனம்</div>
                                <div className="member-idcard-org-row">🏢 {orgAddress || '-'}</div>
                                <div className="member-idcard-org-row">📞 {orgPhone || '-'}</div>
                            </div>
                        </div>
                        <div className="member-idcard-body">
                            <div className="member-idcard-details">
                                <div className="member-idcard-name">
                                    {normalizeMember(cardState.member).fullName || normalizeMember(cardState.member).baseName}
                                </div>
                                <div className="member-idcard-row">📞 {normalizeMember(cardState.member).phone || '-'}</div>
                                <div className="member-idcard-row">🏠 {normalizeMember(cardState.member).town || '-'}</div>
                                <div className="member-idcard-row">🎓 {normalizeMember(cardState.member).education || '-'}</div>
                                <div className="member-idcard-row">🤝 {normalizeMember(cardState.member).relationship || '-'}</div>
                            </div>
                            <div className="member-idcard-qr">
                                <img src={cardState.qrDataUrl} alt="Member QR" />
                            </div>
                        </div>
                        <div className="member-idcard-footer">
                            <div className="member-idcard-qr-text">
                                QR Code: {normalizeMember(cardState.member).memberCode}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="footer">
                <p>© 2025 MoiBookApp</p>
            </footer>
        </div>
    );
}
