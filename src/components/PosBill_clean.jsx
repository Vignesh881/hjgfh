/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

// POS bill layout rendered inside a hidden iframe for printing
export default function PosBill({ entry = {}, event = {} }) {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatLiveTime = (date) => {
        const hours24 = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const period = hours24 >= 12 ? 'PM' : 'AM';
        let hours12 = hours24 % 12;
        if (hours12 === 0) hours12 = 12;
        return {
            dateText: date.toLocaleDateString('en-GB'),
            timeText: `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`
        };
    };

    const liveDateTime = formatLiveTime(currentDateTime);

    const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];
    let denominationText = '';
    let hasDenominationValues = false;
    for (const value of denominations) {
        const count = entry.denominations?.[value] || 0;
        if (count > 0) {
            hasDenominationValues = true;
            denominationText += `${value} X ${count} = ${value * count}` + '\n';
        }
    }
    if (!hasDenominationValues) {
        denominationText = '500 X 0 = 0000';
    }

    // Include all known field names so header never misses saved values
    const organizationAddress = event.organizationAddress
        || event.organization_address
        || event.orgAddress
        || event.address
        || '';
    const organizationPhone = event.organizationPhone
        || event.organization_phone
        || event.orgPhone
        || event.phone
        || '';
    const eventNumber = event.id ? String(event.id).padStart(4, '0') : (event.eventCode ? String(event.eventCode) : '');
    const tableNumberRaw = entry.table || entry.tableNo || entry.table_no || '';
    const tableNumber = typeof tableNumberRaw === 'string' ? tableNumberRaw.replace(/table/gi, 'T').toUpperCase() : tableNumberRaw;
    const serialSource = entry.serialNumber || entry.serial || entry.entryNumber || entry.id;
    const serialNumber = serialSource != null ? String(serialSource).padStart(4, '0') : '';
    const memberNumber = entry.memberId || entry.member_id || entry.memberCode || '';
    const townName = entry.town || entry.townName || entry.village || '';
    const streetName = entry.street || entry.streetName || '';
    const educationProfession = [entry.education, entry.profession].filter(Boolean).join(' • ');
    const contributorName = entry.name || entry.contributor_name || '';
    const parentName = entry.parentName || entry.parent_name || entry.relationshipName || '';
    const phoneNumber = entry.phone || entry.contactNumber || entry.contact_number || '';
    const noteText = entry.note || entry.notes || '';
    const amountValue = Number(entry.amount ?? entry.totalAmount ?? 0);

    const relationshipRole = (() => {
        // தாய்மாமன் அல்ல, மகன்/மகள் மட்டும்
        const type = entry.relationshipType;
        if (type === 'son') return 'மகன்';
        if (type === 'daughter') return 'மகள்';
        if (typeof type === 'string' && type.trim()) return type.trim();
        if (typeof entry.relationship === 'string') {
            if (entry.relationship.includes('மகள்')) return 'மகள்';
            if (entry.relationship.includes('மகன்')) return 'மகன்';
        }
        return '';
    })();

    const billStyles = {
        posBill: {
            width: '77mm',
            maxWidth: '77mm',
            minWidth: '77mm',
            margin: '0',
            fontFamily: "'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', monospace",
            fontSize: '13px',
            lineHeight: 1.4,
            color: '#111',
            backgroundColor: '#fff',
            border: '1px solid #000',
            padding: '3mm',
            boxSizing: 'border-box'
        },
        header: {
            paddingBottom: '2px',
            borderBottom: '1px solid #000',
            textAlign: 'center'
        },
        title: {
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
        },
        organizationLine: {
            fontSize: '11px',
            marginTop: '1px'
        },
        section: {
            padding: '3px 0'
        },
        eventName: {
            fontWeight: 600,
            textAlign: 'center',
            fontSize: '14px'
        },
        eventMeta: {
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '1px'
        },
        metaBox: {
            border: '1px solid #000',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: '4px',
            rowGap: '1px',
            padding: '4px',
            fontSize: '9px',
            marginTop: '3px'
        },
        metaItem: {
            display: 'flex',
            justifyContent: 'space-between'
        },
        infoLabel: {
            fontWeight: 600,
            marginRight: '3px'
        },
        infoValue: {
            fontWeight: 600
        },
        relationshipRole: {
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '2px',
            fontWeight: 600
        },
        nameLine: {
            fontSize: '16px',
            fontWeight: 700,
            textAlign: 'center',
            wordBreak: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%',
            whiteSpace: 'normal'
        },
        educationLine: {
            marginTop: '0.5px',
            fontSize: '12px',
            textAlign: 'center'
        },
        townLine: {
            marginTop: '3px',
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center'
        },
        streetLine: {
            marginTop: '1px',
            fontSize: '13px',
            textAlign: 'center'
        },
        detailLine: {
            marginTop: '1px',
            fontSize: '13px',
            textAlign: 'center'
        },
        denominations: {
            fontFamily: 'monospace',
            fontSize: '13px',
            border: '1px dashed #000',
            padding: '3px',
            marginTop: '3px'
        },
        totalRow: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '5px',
            paddingTop: '5px',
            borderTop: '2px solid #000',
            textAlign: 'center'
        },
        totalLabel: {
            letterSpacing: '0.2px'
        },
        totalValue: {
            fontSize: '13px'
        },
        footer: {
            borderTop: '1px solid #000',
            marginTop: '4px',
            paddingTop: '3px',
            textAlign: 'center',
            fontSize: '8px'
        },
        footerLine: {
            marginBottom: '1px'
        },
        thanks: {
            fontWeight: 600,
            marginTop: '2px',
            fontSize: '13px'
        }
    };

    return (
        <div style={billStyles.posBill}>
            <header style={billStyles.header}>
                <div style={billStyles.title}>மொய்புக்</div>
                {organizationAddress && (
                    <div style={billStyles.organizationLine}>{organizationAddress}</div>
                )}
                {organizationPhone && (
                    <div style={billStyles.organizationLine}>தொலைபேசி: {organizationPhone}</div>
                )}
            </header>

            <section style={billStyles.section}>
                <div style={billStyles.eventName}>{event.eventName}</div>
                {event.eventSide && <div style={billStyles.eventMeta}>{event.eventSide}</div>}
                {event.venue && <div style={billStyles.eventMeta}>{event.venue}</div>}
                {event.place && <div style={billStyles.eventMeta}>{event.place}</div>}
                {event.eventHead && <div style={billStyles.eventMeta}>{event.eventHead}</div>}
                {event.eventOrganizer && <div style={billStyles.eventMeta}>{event.eventOrganizer}</div>}
            </section>

            <div style={{ borderTop: '1px solid #000', margin: '4px 0 2px 0' }}></div>

            <div style={{ ...billStyles.detailLine, marginTop: '3px', fontWeight: 600, fontSize: '10px' }}>
                {liveDateTime.dateText} {liveDateTime.timeText}
            </div>
            
            {(eventNumber || tableNumber || serialNumber) && (
                <div style={{ ...billStyles.detailLine, marginTop: '2px', fontSize: '9px', fontWeight: 600, textAlign: 'center' }}>
                    {eventNumber && `F${eventNumber}`}
                    {tableNumber && `/${tableNumber.toUpperCase()}`}
                    {serialNumber && `/S${serialNumber}`}
                </div>
            )}

            <section style={billStyles.section}>
                {parentName && (
                    <div style={billStyles.relationshipRole}>
                        {parentName}{relationshipRole && ` ${relationshipRole}`}
                    </div>
                )}
                {entry.isMaternalUncle && (
                    <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '1px', fontWeight: 500 }}>
                        தாய்மாமன்
                    </div>
                )}
                <div style={billStyles.nameLine}>{contributorName}</div>
                {educationProfession && (
                    <div style={billStyles.educationLine}>{educationProfession}</div>
                )}
                {townName && <div style={billStyles.townLine}>{townName}</div>}
                {streetName && <div style={billStyles.streetLine}>{streetName}</div>}
                {phoneNumber && <div style={billStyles.detailLine}>{phoneNumber}</div>}
                {noteText && <div style={billStyles.detailLine}>{noteText}</div>}
            </section>

            <section style={billStyles.section}>
                {denominationText && (
                    <div style={billStyles.denominations}>
                        <pre style={{ margin: 0 }}>{denominationText}</pre>
                    </div>
                )}
                <div style={billStyles.totalRow}>
                    <div style={{ fontSize: '12px', marginBottom: '5px' }}>மொய் தொகை</div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>₹ {amountValue.toLocaleString('en-IN')}</div>
                </div>
            </section>

            <footer style={billStyles.footer}>
                {memberNumber && (
                    <div style={{ fontSize: '10px', marginBottom: '3px', fontWeight: 600 }}>உறுப்பினர் எண்: {memberNumber}</div>
                )}
                <div style={billStyles.thanks}>நன்றி மீண்டும் வருக!</div>
            </footer>
        </div>
    );
}