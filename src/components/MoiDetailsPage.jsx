/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useEffect } from 'react';
import { MoiBookIcon } from './MoiBookLogo';

const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const initialTally = denominations.reduce((acc, note) => ({...acc, [note]: '0'}), {});

export default function MoiDetailsPage({ event, moiEntries, onBack, loggedInTable = null, registrars = [], settings = {} }) {
    const tallyStorageKey = useMemo(() => {
        const eventId = event?.id || 'event';
        const tableKey = loggedInTable || 'all';
        return `moibook_tally_${eventId}_${tableKey}`;
    }, [event?.id, loggedInTable]);

    const [tally, setTally] = useState(() => {
        if (typeof window === 'undefined') return initialTally;
        try {
            const raw = window.localStorage?.getItem?.(tallyStorageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                const normalized = { ...parsed };
                Object.keys(initialTally).forEach(note => {
                    if (!normalized[note] && normalized[note] !== '0') {
                        normalized[note] = '0';
                    }
                });
                return { ...initialTally, ...normalized };
            }
        } catch (err) {
            // ignore
        }
        return initialTally;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage?.getItem?.(tallyStorageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                const normalized = { ...parsed };
                Object.keys(initialTally).forEach(note => {
                    if (!normalized[note] && normalized[note] !== '0') {
                        normalized[note] = '0';
                    }
                });
                setTally({ ...initialTally, ...normalized });
            } else {
                setTally(initialTally);
            }
        } catch (err) {
            setTally(initialTally);
        }
    }, [tallyStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage?.setItem?.(tallyStorageKey, JSON.stringify(tally));
        } catch (err) {
            // ignore
        }
    }, [tally, tallyStorageKey]);

    const registrarById = useMemo(() => {
        return registrars.reduce((acc, reg) => {
            acc[reg.id] = reg;
            return acc;
        }, {});
    }, [registrars]);

    const handlePrintTally = () => {
        try {
            const slipWidthMm = 80;
            const title = 'கையில் உள்ள பணப்பிரிப்பு';
            const assignments = settings?.registrarAssignments || {};
            const tableAssignment = loggedInTable ? assignments[loggedInTable] || {} : {};
            const typistName = tableAssignment.typist ? (registrarById[tableAssignment.typist]?.name || tableAssignment.typist) : '—';
            const cashierName = tableAssignment.cashier ? (registrarById[tableAssignment.cashier]?.name || tableAssignment.cashier) : '—';
            const now = new Date();
            const header = `
                <div style="text-align:center; font-weight:bold; font-size:18px; margin-bottom:10px;">
                    ${title}
                </div>
                <div style="text-align:center; font-size:13px; margin-bottom:8px; line-height:1.35;">
                    ${event?.eventName || ''}
                    ${loggedInTable ? `<div style='font-size:12px;'>மேசை: ${loggedInTable.replace('table','Table ')}</div>` : ''}
                    <div style='font-size:12px; color:#555;'>${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString()}</div>
                </div>
                <div style="font-size:13px; margin-bottom:10px; line-height:1.55;">
                    <div>காசாளர்: ${cashierName}</div>
                    <div>தட்டச்சாளர்: ${typistName}</div>
                </div>
            `;

            const rows = denominations.map(note => {
                const count = parseInt(tally[note], 10) || 0;
                const total = count * note;
                if (count === 0) return '';
                return `
                    <tr>
                        <td style="padding:4px; border-bottom:1px dashed #ddd;">₹ ${note}</td>
                        <td style="padding:4px; border-bottom:1px dashed #ddd; text-align:center;">x</td>
                        <td style="padding:4px; border-bottom:1px dashed #ddd; text-align:right;">${count}</td>
                        <td style="padding:4px; border-bottom:1px dashed #ddd; text-align:right;">₹ ${total.toLocaleString('en-IN')}</td>
                    </tr>
                `;
            }).join('');

            const slipHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>${title}</title>
                    <style>
                        @page { size: ${slipWidthMm}mm auto; margin: 4mm; }
                        body { width: ${slipWidthMm}mm; margin: 0 auto; font-family: 'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', Arial, sans-serif; font-size: 13px; }
                        table { width: 100%; border-collapse: collapse; }
                    </style>
                </head>
                <body>
                    ${header}
                    <table>
                        <tbody>
                            ${rows || '<tr><td colspan="4" style="text-align:center; padding:6px;">பதிவுகள் இல்லை</td></tr>'}
                            <tr>
                                <td colspan="3" style="padding:6px; font-weight:bold;">மொத்தம்</td>
                                <td style="padding:6px; font-weight:bold; text-align:right;">₹ ${talliedTotal.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const printWindow = window.open('', '_blank', 'width=400,height=600');
            if (!printWindow) {
                alert('பிரிண்ட் விண்டோ திறக்க முடியவில்லை. Pop-up அனுமதிக்கவும்.');
                return;
            }
            printWindow.document.open();
            printWindow.document.write(slipHtml);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 300);
        } catch (err) {
            console.error('Print failed', err);
            alert('பிரிண்ட் அனுப்ப முடியவில்லை. தயவு செய்து மீண்டும் முயற்சி செய்யவும்.');
        }
    };

    const summary = useMemo(() => {
        // CRITICAL: Filter by eventId to prevent cross-event data leakage
        const eventEntries = moiEntries.filter(entry => entry.eventId === event.id && (!loggedInTable || entry.table === loggedInTable));

        // Only normal moi entries (exclude expense/change) for counts, amounts, and denominations
        const normalEntries = eventEntries.filter(e => e.type !== 'expense' && e.type !== 'change');

        const totalEntries = normalEntries.length;
        const totalAmount = normalEntries.reduce((sum, entry) => sum + entry.amount, 0);

        const computerDenominations = denominations.reduce((acc, note) => {
            acc[note] = normalEntries.reduce((noteSum, entry) => {
                if (!entry.denominations) return noteSum;
                const count = parseInt(entry.denominations[note], 10) || 0;
                return noteSum + count;
            }, 0);
            return acc;
        }, {});

        return { totalEntries, totalAmount, computerDenominations };
    }, [moiEntries, event.id, loggedInTable]);

    const perTableDenominations = useMemo(() => {
        // CRITICAL: Filter by eventId to prevent cross-event data leakage
        const eventEntries = moiEntries.filter(entry => entry.eventId === event.id && (!loggedInTable || entry.table === loggedInTable));
        const normalEntries = eventEntries.filter(e => e.type !== 'expense' && e.type !== 'change');
        
        const tableDenomMap = new Map();
        normalEntries.forEach(entry => {
            if (entry.table && entry.denominations) {
                if (!tableDenomMap.has(entry.table)) {
                    tableDenomMap.set(entry.table, {
                        counts: denominations.reduce((acc, note) => ({...acc, [note]: 0}), {}),
                        totalAmount: 0
                    });
                }
                const tableData = tableDenomMap.get(entry.table);
                denominations.forEach(note => {
                    const count = parseInt(entry.denominations[note], 10) || 0;
                    tableData.counts[note] += count;
                });
                tableData.totalAmount += entry.amount;
            }
        });
        return Array.from(tableDenomMap.entries()).sort(([tableA], [tableB]) => {
            const numA = parseInt(tableA.replace('table', ''), 10);
            const numB = parseInt(tableB.replace('table', ''), 10);
            return numA - numB;
        });
    }, [moiEntries, event.id, loggedInTable]);

    const talliedTotal = useMemo(() => {
        return denominations.reduce((sum, note) => {
            const count = parseInt(tally[note], 10) || 0;
            return sum + (count * note);
        }, 0);
    }, [tally]);

    const difference = talliedTotal - summary.totalAmount;

    const handleTallyChange = (note, value) => {
        const count = value.replace(/[^0-9]/g, '');
        setTally(prev => ({ ...prev, [note]: count }));
    };

    if (!event) {
        return <div className="event-page"><p>Event not found.</p><button onClick={onBack}>Back</button></div>;
    }

    return (
        <div className="moi-details-page">
            <section className="event-subheader">
                <div className="page-header-left">
                    <button className="icon-button back-button" onClick={onBack} aria-label="Back to Moi Entry">
                        <span className="icon">arrow_back</span>
                    </button>
                    <h2>மொய் விபரம் - {event.eventName}</h2>
                </div>
            </section>

            <section className="summary-cards">
                <div className="card">
                    <h3>மொத்த மொய் பதிவுகள்</h3>
                    <p className="value">{summary.totalEntries.toLocaleString('en-IN')}</p>
                </div>
                <div className="card">
                    <h3>மொத்த மொய் தொகை</h3>
                    <p className="value">₹ {summary.totalAmount.toLocaleString('en-IN')}</p>
                </div>
            </section>

            <section className="cash-tally-section">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2 style={{margin:0}}>கையில் உள்ள பணத்தை சரிபார்க்கவும்</h2>
                    <button className="icon-button" aria-label="Print Tally" onClick={handlePrintTally} title="பிரிண்ட்">
                        <span className="icon">print</span>
                    </button>
                </div>
                <div className="cash-tally-columns">
                    <div className="tally-column">
                        <h3>கணினி பணப்பிரிப்பு</h3>
                        <div className="denomination-list-vertical">
                            {denominations.map(note => {
                                const count = summary.computerDenominations[note] || 0;
                                const total = count * note;
                                return (
                                    <div className="form-group" key={`computer-${note}`}>
                                        <label>₹ {note} x</label>
                                        <input
                                            type="tel"
                                            value={count}
                                            readOnly
                                        />
                                        <span>=</span>
                                        <span>{total.toLocaleString('en-IN')}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="tally-column">
                        <h3>கையில் உள்ள பணப்பிரிப்பு</h3>
                        <div className="denomination-list-vertical">
                            {denominations.map(note => {
                                const count = parseInt(tally[note], 10) || 0;
                                const total = count * note;
                                return (
                                    <div className="form-group" key={`manual-${note}`}>
                                        <label>₹ {note} x</label>
                                        <input
                                            type="tel"
                                            value={tally[note] || '0'}
                                            onChange={(e) => handleTallyChange(note, e.target.value)}
                                            placeholder="0"
                                        />
                                        <span>=</span>
                                        <span>{total.toLocaleString('en-IN')}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="tally-summary">
                    <div className="summary-row">
                        <span>கணினி மொத்த தொகை:</span>
                        <span className="value">₹ {summary.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="summary-row">
                        <span>கையில் உள்ள மொத்த தொகை:</span>
                        <span className="value">₹ {talliedTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="summary-row difference">
                        <span>வித்தியாசம்:</span>
                        <span className={`value ${difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''}`}>
                            ₹ {difference.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </section>

            {/* மேசை வாரியான பணப்பிரிப்பு விபரம் பகுதி நீக்கப்பட்டது */}
        </div>
    );
}