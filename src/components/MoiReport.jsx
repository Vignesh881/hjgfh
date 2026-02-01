/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enhanced Professional MoiReport with improved Tamil formatting and design
 */
import React from 'react';
import { MoiBookIcon } from './MoiBookLogo';

// Add A4 print styles
const A4_PRINT_STYLES = `
    @media print {
        @page {
            size: A4;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
        }
        
        .moi-report .page {
            page-break-after: always;
            page-break-inside: avoid;
        }
        
        .wedding-cover-page {
            page-break-after: always;
            page-break-inside: avoid;
        }
    }
    
    @media screen {
        .moi-report {
            background: #f0f0f0;
            padding: 20px;
        }
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleId = 'a4-print-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = A4_PRINT_STYLES;
        document.head.appendChild(styleEl);
    }
}

const MoiReport = ({ moiEntries, event, settings, includeEventDetails = true, includeTableOfContents = true }) => {
    // Filter only moi entries (exclude expenses)
    const moiOnlyEntries = moiEntries.filter(e => !e.type);
    
    // If no data available, show a professional empty state
    if (moiOnlyEntries.length === 0) {
        return renderEmptyState(event);
    }
    
    // Group entries by maternal uncle status
    const maternalUncleEntries = moiOnlyEntries.filter(e => e.isMaternalUncle);
    const regularEntries = moiOnlyEntries.filter(e => !e.isMaternalUncle);
    
    // Group entries by town
    const townGroups = regularEntries.reduce((groups, entry) => {
        const town = entry.town || 'பெயரிடப்படாதது';
        if (!groups[town]) {
            groups[town] = [];
        }
        groups[town].push(entry);
        return groups;
    }, {});
    
    // Sort towns alphabetically in Tamil
    const sortedTowns = Object.keys(townGroups).sort((a, b) => a.localeCompare(b, 'ta'));
    
    return renderProfessionalReport(moiOnlyEntries, maternalUncleEntries, townGroups, sortedTowns, event, settings, includeEventDetails, includeTableOfContents);
};

const getOrganizationInfo = (event, settings) => {
    const settingsAddress = settings?.billHeaderAddress || '';
    const settingsPhone = settings?.billHeaderPhone || '';

    let orgAddress = settingsAddress || '';
    let orgPhone = settingsPhone || '';

    if (orgAddress || orgPhone) {
        return { orgAddress, orgPhone };
    }

    if (typeof window === 'undefined' || !window.localStorage) {
        return { orgAddress: '', orgPhone: '' };
    }

    try {
        const raw = window.localStorage.getItem('moibook_settings');
        if (!raw) {
            return { orgAddress: '', orgPhone: '' };
        }
        const savedSettings = JSON.parse(raw);
        orgAddress = savedSettings?.billHeaderAddress || '';
        orgPhone = savedSettings?.billHeaderPhone || '';
        return { orgAddress, orgPhone };
    } catch (err) {
        return { orgAddress: '', orgPhone: '' };
    }
};

const renderEmptyState = (event) => {
    const styles = getEnhancedStyles();
    
    return (
        <div className="moi-report" style={styles.page}>
            <div style={styles.emptyStateBox}>
                <div style={styles.logoContainer}>
                    <MoiBookIcon size={60} />
                </div>
                <div style={styles.emptyStateTitle}>மொய்புக் அறிக்கை</div>
                <div style={styles.eventName}>{event?.eventName || 'நிகழ்வு'}</div>
                <div style={styles.emptyMessage}>
                    இந்த நிகழ்விற்கு இதுவரை மொய் விபரங்கள் பதிவு செய்யப்படவில்லை.
                    <br />
                    மொய் பதிவுகள் சேர்க்கப்பட்ட பின் அறிக்கை தயாராகும்.
                </div>
                <div style={styles.reportDate}>
                    அறிக்கை தயாரிக்கப்பட்ட தேதி: {new Date().toLocaleDateString('ta-IN')}
                </div>
            </div>
        </div>
    );
};

const renderProfessionalReport = (moiOnlyEntries, maternalUncleEntries, townGroups, sortedTowns, event, settings, includeEventDetails, includeTableOfContents) => {
    const styles = getEnhancedStyles();
    
    // Calculate comprehensive statistics
    const stats = calculateStatistics(moiOnlyEntries, maternalUncleEntries, townGroups);
    
    return (
        <div className="moi-report">
            {/* Traditional Wedding Cover Page */}
            <div className="page" style={styles.page}>
                <div style={styles.weddingCoverPage} className="wedding-cover-page">
                    {/* Top Header with Organization Info */}
                    <div style={styles.headerSection}>
                        <div style={styles.orgInfo}>
                            <div style={styles.leftLogo}>
                                <MoiBookIcon size={40} />
                            </div>
                            <div style={styles.centerOrgText}>
                                <div style={styles.centerMainTitle}>மொய்புக்</div>
                                {(() => {
                                    const { orgAddress, orgPhone } = getOrganizationInfo(event, settings);
                                    return (
                                        <>
                                            {orgAddress ? <div style={styles.orgSubText}>{orgAddress}</div> : null}
                                            {orgPhone ? <div style={styles.orgSubText}>தொலைபேசி: {orgPhone}</div> : null}
                                        </>
                                    );
                                })()}
                            </div>
                            <div style={styles.rightLogo}>
                                {/* Clean right section */}
                            </div>
                        </div>
                    </div>

                    {/* Main Title */}
                    <div style={styles.mainTitle}>
                        {event?.eventName || 'திருமண விழா'}
                    </div>

                    {/* Event Number - Small below title */}
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <div style={{fontSize: '16px', fontWeight: 'bold', color: '#2c3e50'}}>
                            விழா எண்: {event?.id || 'N/A'}
                        </div>
                    </div>

                    {/* Couple Names Section */}
                    <div style={styles.coupleSection}>
                        <div style={styles.coupleTitle}>மணமக்கள்:</div>
                        {(() => {
                            // Get full name and qualification strings
                            const fullName = event?.groomName || event?.eventHead || '';
                            const fullQual = event?.groomQualification || event?.eventHeadProf || '';
                            
                            // Split names by hyphen
                            const nameParts = fullName.split('-').map(n => n.trim()).filter(n => n);
                            
                            // Split qualifications by hyphen
                            const qualParts = fullQual.split('-').map(q => q.trim()).filter(q => q);
                            
                            return (
                                <>
                                    {nameParts.map((name, index) => (
                                        <div key={index} style={styles.coupleName}>
                                            {name}{qualParts[index] ? `, ${qualParts[index]}` : ''}
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                    </div>

                    {/* Event Details */}
                    <div style={styles.eventDetailsSection}>
                        <div style={styles.eventDetailTitle}>இடம்:</div>
                        <div style={styles.eventDetailText}>
                            {event?.venue || ''}, 
                        </div>
                        <div style={styles.eventDetailText}>
                            {event?.place || ''}.
                        </div>
                        <div style={styles.eventDetailTitle}>நாள்: {event?.date ? new Date(event.date).toLocaleDateString('ta-IN') : ''}</div>
                        <div style={styles.eventDetailTitle}>நேரம்: {event?.time || ''}</div>
                    </div>

                    {/* Host Family Section */}
                    <div style={styles.hostSection}>
                        <div style={styles.hostTitle}>தங்களன்புள்ள</div>
                        {(() => {
                            // Get organizer name and profession
                            const fullName = event?.eventOrganizer || '';
                            const fullProf = event?.eventOrganizerProf || '';
                            
                            // Split names by hyphen
                            const nameParts = fullName.split('-').map(n => n.trim()).filter(n => n);
                            
                            // Split professions by hyphen
                            const profParts = fullProf.split('-').map(p => p.trim()).filter(p => p);
                            
                            // If no hyphen in organizer, check spouse name field
                            if (nameParts.length === 1 && event?.organizerSpouseName) {
                                nameParts.push(event.organizerSpouseName.trim());
                            }
                            if (profParts.length === 1 && event?.organizerSpouseProf) {
                                profParts.push(event.organizerSpouseProf.trim());
                            }
                            
                            return (
                                <>
                                    {nameParts.map((name, index) => (
                                        <div key={index} style={styles.hostName}>
                                            {name}{profParts[index] ? `, ${profParts[index]}` : ''},
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                        <div style={styles.hostLocation}>
                            {event?.organizerLocation
                                || event?.organizerAddress
                                || event?.address
                                || ''}.
                        </div>
                        {(event?.organizerPhone || event?.phone) && (
                            <div style={{ ...styles.hostLocation, marginTop: '6px' }}>
                                தொலைபேசி: {event.organizerPhone || event.phone}
                            </div>
                        )}
                    </div>

                    {/* Decorative Floral Elements */}
                    <div style={styles.floralLeft}>🌸🌿</div>
                    <div style={styles.floralRight}>🌿🌸</div>
                </div>
            </div>

            {/* Table of Contents Page */}
            {includeTableOfContents && renderTableOfContentsPage(sortedTowns, townGroups, event, styles)}

            {/* Maternal Uncle Details Page */}
            {renderMaternalUnclePage(maternalUncleEntries, styles)}

            {/* Town-wise Details - flat, continuous list with running numbers */}
            {renderFlatTownList(sortedTowns, townGroups, styles)}

            {/* Overall totals after town list */}
            {renderOverallTotalsPage(stats, styles)}

            {/* Manual Entry Pages - 10 Pages for Late Arrivals */}
            {renderManualEntryPages(styles)}
        </div>
    );
};

const renderEventDetailsPage = (event, stats, styles) => (
    <div className="page" style={styles.page}>
        <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>நிகழ்வு விபரங்கள்</div>
                <div style={styles.sectionSubtitle}>Event Details</div>
            <div style={styles.sectionBox}>
                <div style={{...styles.sectionHeader, justifyContent: 'center'}}>
                    <div style={{...styles.sectionTitle, textAlign: 'center'}}>
                        {townIndex + 1}. {townName} ({townEntries.length})
                    </div>
                </div>

                <div style={styles.tableContainer}>
                    <table style={{...styles.table, borderCollapse: 'separate', borderSpacing: '0 6px'}}>
                        <tbody>
                            {townEntries.map((entry, index) => (
                                <tr key={entry.id}>
                                    <td style={{width: '10%', ...styles.tdCenter, fontWeight: 700}}>{index + 1}.</td>
                                    <td style={{width: '60%', ...styles.td}}>
                                        <div style={{fontWeight: 700, fontSize: '14px'}}>
                                            {entry.town || '-'}
                                        </div>
                                        <div style={{fontSize: '14px', marginTop: '2px'}}>
                                            {entry.relationship && `${entry.relationship} - `}
                                            {entry.name || '-'}
                                        </div>
                                        {entry.street && (
                                            <div style={{fontSize: '11px', color: '#666'}}>
                                                {entry.street}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{width: '30%', ...styles.tdRight, fontSize: '15px', fontWeight: 700}}>
                                        ₹ {Number(entry.amount || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                            {townEntries.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{...styles.td, textAlign: 'center', fontStyle: 'italic', color: '#666'}}>
                                        இந்த ஊரில் மொய் விபரங்கள் இல்லை
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{...styles.sectionHeader, justifyContent: 'flex-end', marginTop: '10px'}}>
                    <div style={{fontWeight: 700, fontSize: '15px'}}>மொத்தம்:</div>
                    <div style={{fontWeight: 800, fontSize: '16px', marginLeft: '8px'}}>₹ {Number(townTotal).toLocaleString('en-IN')}</div>
                </div>
            </div>
                <div style={styles.tocTitle}>பொருளடக்கம்</div>
                <div style={styles.tocSubtitle}>Table of Contents</div>
            </div>
            
            <div style={styles.tocContent}>
                <div style={styles.tocSection}>
                    <div style={styles.tocMainItem}>
                        <span style={styles.tocNumber}>1.</span>
                        <span style={styles.tocText}>தாய்மாமன் விபரம்</span>
                        <span style={styles.tocDots}>...........................</span>
                        <span style={styles.tocPage}>2</span>
                    </div>
                    <div style={styles.tocMainItem}>
                        <span style={styles.tocNumber}>2.</span>
                        <span style={styles.tocText}>ஊர் வாரியாக விபரம்</span>
                        <span style={styles.tocDots}>.........................</span>
                        <span style={styles.tocPage}>3</span>
                    </div>
                </div>

                <div style={styles.tocSubSection}>
                    <div style={styles.tocSubHeader}>ஊர் வாரி பட்டியல்:</div>
                    {sortedTowns.map((town, index) => {
                        const townEntryCount = townGroups[town]?.length || 0;
                        return (
                            <div key={town} style={styles.tocSubItem}>
                                <span style={styles.tocBullet}>•</span>
                                <span style={styles.tocSubText}>{town} ({townEntryCount})</span>
                                <span style={styles.tocDots}>...........................</span>
                                <span style={styles.tocPage}>{3 + index}</span>
                            </div>
                        );
                    })}
                </div>

                <div style={styles.tocSection}>
                    <div style={styles.tocMainItem}>
                        <span style={styles.tocNumber}>3.</span>
                        <span style={styles.tocText}>விரிவான சுருக்கம்</span>
                        <span style={styles.tocDots}>.........................</span>
                        <span style={styles.tocPage}>{3 + sortedTowns.length}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const renderExecutiveSummaryPage = (stats, styles) => (
    <div className="page" style={styles.page}>
        <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>சுருக்க அறிக்கை</div>
                <div style={styles.sectionSubtitle}>Executive Summary</div>
            </div>
            
            <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryCardHeader}>மொத்த புள்ளிவிவரங்கள்</div>
                    <div style={styles.summaryCardContent}>
                        <div style={styles.summaryRow}>
                            <span>மொத்த நபர்கள்:</span>
                            <span style={styles.summaryValue}>{stats.totalPeople} பேர்</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>மொத்த தொகை:</span>
                            <span style={styles.summaryValue}>{formatCurrency(stats.totalAmount)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>சராசரி தொகை:</span>
                            <span style={styles.summaryValue}>{formatCurrency(stats.averageAmount)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>மொத்த ஊர்கள்:</span>
                            <span style={styles.summaryValue}>{stats.totalTowns} ஊர்கள்</span>
                        </div>
                    </div>
                </div>

                <div style={styles.summaryCard}>
                    <div style={styles.summaryCardHeader}>தாய்மாமன் விபரம்</div>
                    <div style={styles.summaryCardContent}>
                        <div style={styles.summaryRow}>
                            <span>தாய்மாமன் எண்ணிக்கை:</span>
                            <span style={styles.summaryValue}>{stats.maternalUncleCount} பேர்</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>தாய்மாமன் தொகை:</span>
                            <span style={styles.summaryValue}>{formatCurrency(stats.maternalUncleAmount)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>மொத்த தொகையில் %:</span>
                            <span style={styles.summaryValue}>{stats.maternalUnclePercentage}%</span>
                        </div>
                    </div>
                </div>

                <div style={styles.summaryCard}>
                    <div style={styles.summaryCardHeader}>தொகை வகைப்பாடு</div>
                    <div style={styles.summaryCardContent}>
                        <div style={styles.summaryRow}>
                            <span>அதிகபட்ச தொகை:</span>
                            <span style={styles.summaryValue}>{formatCurrency(stats.maxAmount)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>குறைந்தபட்ச தொகை:</span>
                            <span style={styles.summaryValue}>{formatCurrency(stats.minAmount)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>1000+ தொகை:</span>
                            <span style={styles.summaryValue}>{stats.highAmountCount} பேர்</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const renderMaternalUnclePage = (maternalUncleEntries, styles) => (
    <div className="page" style={styles.page}>
        <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>தாய்மாமன் விபரம்</div>
                <div style={styles.sectionSubtitle}>Maternal Uncle Details</div>
            </div>
            
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>வரிசை எண்</th>
                            <th style={styles.th}>ஊர்</th>
                            <th style={styles.th}>பெயர்</th>
                            <th style={styles.th}>தொகை</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maternalUncleEntries.map((entry, index) => (
                            <tr key={entry.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                <td style={styles.tdCenter}>{index + 1}</td>
                                <td style={styles.td}>
                                    <div>{entry.town || '-'}</div>
                                    {entry.street && (
                                        <div style={{fontSize: '11px', color: '#666'}}>
                                            {entry.street}
                                        </div>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <div>
                                        {entry.relationship && `${entry.relationship} `}
                                        {entry.name || '-'}
                                        {entry.isMaternalUncle && ' (*)'}
                                    </div>
                                    <div style={{fontSize: '11px', color: '#666'}}>
                                        {entry.education && `${entry.education} `}
                                        {entry.profession && `(${entry.profession})`}
                                        {entry.phone && ` - ${entry.phone}`}
                                    </div>
                                    {entry.note && (
                                        <div style={{fontSize: '10px', fontStyle: 'italic', color: '#888'}}>
                                            குறிப்பு: {entry.note}
                                        </div>
                                    )}
                                </td>
                                <td style={styles.tdRight}>{formatCurrency(entry.amount)}</td>
                            </tr>
                        ))}
                        {maternalUncleEntries.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{...styles.td, textAlign: 'center', fontStyle: 'italic', color: '#666'}}>
                                    தாய்மாமன் விபரங்கள் பதிவு செய்யப்படவில்லை
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {maternalUncleEntries.length > 0 && (
                        <tfoot>
                            <tr style={styles.totalRow}>
                                <td colSpan="3" style={{...styles.td, fontWeight: 'bold', textAlign: 'center'}}>
                                    தாய்மாமன் மொத்த தொகை:
                                </td>
                                <td style={{...styles.tdRight, fontWeight: 'bold', fontSize: '16px'}}>
                                    {formatCurrency(maternalUncleEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    </div>
);

// Render all towns in a continuous flow (not separate pages)
const renderAllTownsPage = (sortedTowns, townGroups, styles) => (
    <div className="page" style={styles.page}>
        <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>ஊர் வாரியாக விபரம்</div>
                <div style={styles.sectionSubtitle}>Town-wise Details</div>
            </div>
            
            {sortedTowns.map((townName, townIndex) => {
                const townEntries = townGroups[townName];
                const townTotal = townEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
                const townAverage = townEntries.length > 0 ? townTotal / townEntries.length : 0;
                
                return (
                    <div key={townName} style={{marginBottom: '30px'}}>
                        {/* Town Header */}
                        <div style={{
                            backgroundColor: '#e8f5e8',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            borderLeft: '4px solid #2e7d32'
                        }}>
                            <h3 style={{
                                color: '#2e7d32',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                margin: 0,
                                marginBottom: '8px'
                            }}>
                                {townIndex + 1}. {townName}
                            </h3>
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                fontSize: '14px',
                                color: '#555'
                            }}>
                                <span>நபர்கள்: <strong>{townEntries.length}</strong></span>
                                <span>மொத்தம்: <strong>{formatCurrency(townTotal)}</strong></span>
                                <span>சராசரி: <strong>{formatCurrency(townAverage)}</strong></span>
                            </div>
                        </div>
                        
                        {/* Town Table */}
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>வரிசை எண்</th>
                                        <th style={styles.th}>ஊர்</th>
                                        <th style={styles.th}>பெயர்</th>
                                        <th style={styles.th}>தொகை</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {townEntries.map((entry, index) => (
                                        <tr key={entry.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                            <td style={styles.tdCenter}>{index + 1}</td>
                                            <td style={styles.td}>
                                                <div>{entry.town || '-'}</div>
                                                {entry.street && (
                                                    <div style={{fontSize: '11px', color: '#666'}}>
                                                        {entry.street}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <div>
                                                    {entry.relationship && `${entry.relationship} `}
                                                    {entry.name || '-'}
                                                    {entry.isMaternalUncle && ' (*)'}
                                                </div>
                                                <div style={{fontSize: '11px', color: '#666'}}>
                                                    {entry.education && `${entry.education} `}
                                                    {entry.profession && `(${entry.profession})`}
                                                    {entry.phone && ` - ${entry.phone}`}
                                                </div>
                                                {entry.note && (
                                                    <div style={{fontSize: '10px', fontStyle: 'italic', color: '#888'}}>
                                                        குறிப்பு: {entry.note}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={styles.tdRight}>{formatCurrency(entry.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{backgroundColor: '#d9ead3'}}>
                                        <td colSpan="3" style={{...styles.td, fontWeight: 'bold', textAlign: 'center'}}>
                                            {townName} ஊர் மொத்த தொகை:
                                        </td>
                                        <td style={{...styles.tdRight, fontWeight: 'bold', fontSize: '16px'}}>
                                            {formatCurrency(townTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const renderTownDetailsPage = (townName, townEntries, townIndex, styles) => {
    const townTotal = townEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const townAverage = townEntries.length > 0 ? townTotal / townEntries.length : 0;
    
    return (
        <div key={townName} className="page" style={styles.page}>
            <div style={styles.sectionBox}>
                <div style={styles.sectionHeader}>
                    <div style={styles.sectionTitle}>ஊர் விபரம் - {townName}</div>
                    <div style={styles.sectionSubtitle}>Town Details - {townName}</div>
                </div>
                
                <div style={styles.townStatsBar}>
                    <div style={styles.townStat}>
                        <span style={styles.townStatLabel}>நபர்கள்:</span>
                        <span style={styles.townStatValue}>{townEntries.length}</span>
                    </div>
                    <div style={styles.townStat}>
                        <span style={styles.townStatLabel}>மொத்த தொகை:</span>
                        <span style={styles.townStatValue}>{formatCurrency(townTotal)}</span>
                    </div>
                    <div style={styles.townStat}>
                        <span style={styles.townStatLabel}>சராசரி:</span>
                        <span style={styles.townStatValue}>{formatCurrency(townAverage)}</span>
                    </div>
                </div>
                
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>வரிசை எண்</th>
                                <th style={styles.th}>ஊர்</th>
                                <th style={styles.th}>பெயர்</th>
                                <th style={styles.th}>தொகை</th>
                            </tr>
                        </thead>
                        <tbody>
                            {townEntries.map((entry, index) => (
                                <tr key={entry.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <td style={styles.tdCenter}>{index + 1}</td>
                                    <td style={styles.td}>
                                        <div>{entry.town || '-'}</div>
                                        {entry.street && (
                                            <div style={{fontSize: '11px', color: '#666'}}>
                                                {entry.street}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <div>
                                            {entry.relationship && `${entry.relationship} `}
                                            {entry.name || '-'}
                                            {entry.isMaternalUncle && ' (*)'}
                                        </div>
                                        <div style={{fontSize: '11px', color: '#666'}}>
                                            {entry.education && `${entry.education} `}
                                            {entry.profession && `(${entry.profession})`}
                                            {entry.phone && ` - ${entry.phone}`}
                                        </div>
                                        {entry.note && (
                                            <div style={{fontSize: '10px', fontStyle: 'italic', color: '#888'}}>
                                                குறிப்பு: {entry.note}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.tdRight}>{formatCurrency(entry.amount)}</td>
                                </tr>
                            ))}
                            {townEntries.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{...styles.td, textAlign: 'center', fontStyle: 'italic', color: '#666'}}>
                                        இந்த ஊரில் மொய் விபரங்கள் பதிவு செய்யப்படவில்லை
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {townEntries.length > 0 && (
                            <tfoot>
                                <tr style={styles.totalRow}>
                                    <td colSpan="3" style={{...styles.td, fontWeight: 'bold', textAlign: 'center'}}>
                                        {townName} ஊர் மொத்த தொகை:
                                    </td>
                                    <td style={{...styles.tdRight, fontWeight: 'bold', fontSize: '16px'}}>
                                        {formatCurrency(townTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

// Simple Table of Contents page
const renderTableOfContentsPage = (sortedTowns, townGroups, event, styles) => (
    <div className="page" style={styles.page}>
        <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>பொருளடக்கம்</div>
                <div style={styles.sectionSubtitle}>Table of Contents</div>
            </div>
            <ol style={{paddingLeft: '20px', fontSize: '13px', lineHeight: '1.4'}}>
                <li style={{marginBottom: '6px'}}>தாய்மாமன் விபரம்</li>
                <li style={{marginBottom: '6px'}}>ஊர் வாரியாக விபரம்</li>
                {sortedTowns.map((town) => (
                    <li key={town} style={{marginBottom: '4px'}}>
                        {town} ({(townGroups[town] || []).length})
                    </li>
                ))}
                <li style={{marginTop: '8px'}}>விவரமான அறிக்கை</li>
            </ol>
        </div>
    </div>
);

// Flat continuous town list with running numbers and simple 5-column layout
const renderFlatTownList = (sortedTowns, townGroups, styles) => {
    let run = 1;
    const rows = [];

    // Build a flat sequence of header + data rows
    sortedTowns.forEach((townName) => {
        const entries = townGroups[townName] || [];
        if (!entries.length) return;

        rows.push({ type: 'header', town: townName, count: entries.length });
        entries.forEach((entry) => {
            rows.push({
                type: 'data',
                run: run++,
                town: entry.town || townName,
                name: entry.name || '-',
                relationship: entry.relationship || '',
                street: entry.street || '',
                education: entry.education || '',
                profession: entry.profession || '',
                phone: entry.phone || '',
                note: entry.note || '',
                amount: Number(entry.amount || 0)
            });
        });
    });

    // Paginate so each page has at most 20 rows total (headers + data)
    const pages = [];
    let currentPageRows = [];
    let rowCount = 0;

    const pushPage = () => {
        if (currentPageRows.length === 0) return;
        pages.push(currentPageRows);
        currentPageRows = [];
        rowCount = 0;
    };

    rows.forEach((row) => {
        if (rowCount >= 20) {
            pushPage();
        }

        currentPageRows.push(row);
        rowCount += 1;
    });

    pushPage();

    const renderPage = (pageRows, pageIndex) => {
        const pageTotal = pageRows
            .filter(r => r.type === 'data')
            .reduce((sum, r) => sum + (r.amount || 0), 0);

        return (
        <div key={`flat-page-${pageIndex}`} className="page" style={{...styles.page, padding: '10mm'}}>
            <div style={{...styles.sectionBox, padding: '8px 10px'}}>
                <div style={{...styles.sectionHeader, justifyContent: 'center'}}>
                    <div style={{...styles.sectionTitle, textAlign: 'center', fontSize: '16px'}}>
                        ஊர் வாரியான விபரம்
                    </div>
                    <div style={{...styles.sectionSubtitle, marginTop: '4px'}}>
                        பக்கம் {pageIndex + 1}
                    </div>
                </div>

                <div style={{...styles.tableContainer, overflow: 'visible'}}>
                    <table style={{...styles.table, fontSize: '12px', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr>
                                <th style={{...styles.th, width: '10%'}}>வ. எண்</th>
                                <th style={{...styles.th, width: '25%'}}>ஊர்</th>
                                <th style={{...styles.th, width: '35%'}}>பெயர் / உறவு</th>
                                <th style={{...styles.th, width: '15%'}}>விவரம்</th>
                                <th style={{...styles.th, width: '15%'}}>தொகை</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((row, idx) => {
                                if (row.type === 'header') {
                                    return (
                                        <tr key={`h-${row.town}-${idx}`} style={{background: '#f2f2f2'}}>
                                            <td colSpan={5} style={{...styles.td, fontWeight: 700}}>
                                                {row.town} ({row.count})
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={`r-${row.run}`} style={idx % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                        <td style={{...styles.tdCenter, fontWeight: 700}}>{row.run}</td>
                                        <td style={styles.td}>
                                            <div>{row.town}</div>
                                            {row.street && (
                                                <div style={{fontSize: '11px', color: '#444'}}>{row.street}</div>
                                            )}
                                        </td>
                                        <td style={{...styles.td}}>
                                            <div>{row.relationship ? `${row.relationship} - ${row.name}` : row.name}</div>
                                            {row.note && (
                                                <div style={{fontSize: '10px', color: '#777', fontStyle: 'italic'}}>குறிப்பு: {row.note}</div>
                                            )}
                                        </td>
                                        <td style={{...styles.td, fontSize: '11px', color: '#444'}}>
                                            {(row.education || row.profession || row.phone) ? (
                                                <>
                                                    {row.education && <div>{row.education}</div>}
                                                    {row.profession && <div>{row.profession}</div>}
                                                    {row.phone && <div>{row.phone}</div>}
                                                </>
                                            ) : '-' }
                                        </td>
                                        <td style={{...styles.tdRight, fontWeight: 700}}>
                                            ₹ {row.amount.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr style={{background: '#eef6ff'}}>
                                <td colSpan={4} style={{...styles.tdRight, fontWeight: 700}}>பக்க மொத்தம்</td>
                                <td style={{...styles.tdRight, fontWeight: 700}}>₹ {pageTotal.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        );
    };

    return <>{pages.map(renderPage)}</>;
};

const renderDetailedSummaryPage = (stats, maternalUncleEntries, townGroups, sortedTowns, event, styles) => {
    const ROWS_PER_PAGE = 18;
    const pages = [];

    for (let i = 0; i < sortedTowns.length; i += ROWS_PER_PAGE) {
        pages.push(sortedTowns.slice(i, i + ROWS_PER_PAGE));
    }

    return (
        <>
            {pages.map((pageTowns, pageIndex) => (
                <div key={`detail-summary-${pageIndex}`} className="page" style={styles.page}>
                    <div style={styles.sectionBox}>
                        <div style={styles.sectionHeader}>
                            <div style={styles.sectionTitle}>விரிவான சுருக்க அறிக்கை</div>
                            <div style={styles.sectionSubtitle}>Detailed Summary Report — பக்கம் {pageIndex + 1}</div>
                        </div>
                        
                        <div style={styles.detailedSummaryContent}>
                            <div style={styles.townSummaryTable}>
                                <table style={styles.summaryTable}>
                                    <thead>
                                        <tr>
                                            <th style={styles.summaryTh}>மேசை எண்</th>
                                            <th style={styles.summaryTh}>நபர்</th>
                                            <th style={styles.summaryTh}>தொகை</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageTowns.map((townName, idx) => {
                                            const absoluteIndex = pageIndex * ROWS_PER_PAGE + idx;
                                            const townEntries = townGroups[townName];
                                            const townTotal = townEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

                                            return (
                                                <tr key={townName} style={absoluteIndex % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                                    <td style={styles.summaryTd}>மேசை {absoluteIndex + 1}</td>
                                                    <td style={styles.summaryTdCenter}>{townEntries.length}</td>
                                                    <td style={styles.summaryTdRight}>{formatCurrency(townTotal)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {pageIndex === pages.length - 1 && (
                                        <tfoot>
                                            <tr style={styles.totalRow}>
                                                <td style={{...styles.summaryTd, fontWeight: 'bold', textAlign: 'center', color: '#ffffff'}}>மொத்தம்</td>
                                                <td style={{...styles.summaryTdCenter, fontWeight: 'bold', color: '#ffffff'}}>{stats.totalPeople}</td>
                                                <td style={{...styles.summaryTdRight, fontWeight: 'bold', color: '#ffffff'}}>{formatCurrency(stats.totalAmount)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                            
                            {pageIndex === pages.length - 1 && (
                                <div style={{marginTop: '40px', textAlign: 'center'}}>
                                    <div style={{
                                        display: 'inline-block',
                                        textAlign: 'left',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        lineHeight: '2'
                                    }}>
                                        <div style={{marginBottom: '15px'}}>
                                            உறவினர் எண்ணிக்கை : <span style={{marginLeft: '20px'}}>{stats.totalPeople}</span>
                                        </div>
                                        <div style={{marginBottom: '15px'}}>
                                            மேசை 1-₹ <span style={{marginLeft: '20px'}}>{formatCurrency(stats.totalAmount)}</span>
                                        </div>
                                        <div style={{
                                            borderTop: '2px solid #000',
                                            paddingTop: '15px',
                                            marginTop: '15px'
                                        }}>
                                            மொத்தத்தொகை : ₹ <span style={{marginLeft: '20px'}}>{formatCurrency(stats.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

// Simple totals page shown after town-wise list
const renderOverallTotalsPage = (stats, styles) => (
    <div className="page" style={styles.page}>
        <div style={{...styles.sectionBox, minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '20px'}}>
            <div style={{...styles.sectionHeader, justifyContent: 'center', marginBottom: '24px'}}>
                <div style={{...styles.sectionTitle, textAlign: 'center'}}>மொத்த சுருக்கம்</div>
                <div style={{...styles.sectionSubtitle, textAlign: 'center'}}>Overall Totals</div>
            </div>

            <div style={{display: 'flex', gap: '40px', alignItems: 'center', fontSize: '18px', fontWeight: 700, marginBottom: '18px'}}>
                <div>உறவினர் எண்ணிக்கை: {stats.totalPeople}</div>
                <div>மொத்த தொகை: ₹ {formatCurrency(stats.totalAmount)}</div>
            </div>

            {stats.tableTotals && stats.tableTotals.length > 1 && (
                <div style={{width: '100%', maxWidth: '620px'}}>
                    <table style={{...styles.summaryTable, marginTop: '8px'}}>
                        <thead>
                            <tr>
                                <th style={styles.summaryTh}>மேசை</th>
                                <th style={styles.summaryTh}>எண்ணிக்கை</th>
                                <th style={styles.summaryTh}>மொத்தம்</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.tableTotals.map((row, idx) => (
                                <tr key={row.table} style={idx % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <td style={styles.summaryTd}>{row.table}</td>
                                    <td style={styles.summaryTdCenter}>{row.count}</td>
                                    <td style={styles.summaryTdRight}>{formatCurrency(row.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={styles.totalRow}>
                                <td style={{...styles.summaryTd, fontWeight: 'bold', textAlign: 'center', color: '#ffffff'}}>மொத்தம்</td>
                                <td style={{...styles.summaryTdCenter, fontWeight: 'bold', color: '#ffffff'}}>{stats.totalPeople}</td>
                                <td style={{...styles.summaryTdRight, fontWeight: 'bold', color: '#ffffff'}}>{formatCurrency(stats.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    </div>
);

const renderManualEntryPages = (styles) => {
    const pages = [];
    
    // Pages 1-5: Entry pages with page totals
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
        pages.push(
            <div key={`manual-page-${pageNum}`} className="page" style={styles.page}>
                <div style={styles.sectionBox}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>விழா முடிவிற்கு பிறகு வந்த மொய் விபரம் - பக்கம் {pageNum}</div>
                        <div style={styles.sectionSubtitle}>Post-Event Moi Entries (Manual Entry) - Page {pageNum}</div>
                    </div>
                    
                    {/* Main Entry Table */}
                    <table style={styles.manualEntryTable}>
                        <thead>
                            <tr>
                                <th style={{...styles.summaryTh, width: '8%'}}>எண்</th>
                                <th style={{...styles.summaryTh, width: '30%'}}>ஊர்</th>
                                <th style={{...styles.summaryTh, width: '47%'}}>பெயர்</th>
                                <th style={{...styles.summaryTh, width: '15%'}}>தொகை</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(18)].map((_, index) => {
                                const entryNum = ((pageNum - 1) * 18) + index + 1;
                                return (
                                    <tr key={`entry-${entryNum}`} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                        <td style={{...styles.summaryTdCenter, height: '30px', width: '8%'}}>{entryNum}</td>
                                        <td style={{...styles.summaryTd, height: '30px', width: '30%'}}></td>
                                        <td style={{...styles.summaryTd, height: '30px', width: '47%'}}></td>
                                        <td style={{...styles.summaryTdRight, height: '30px', width: '15%'}}></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{backgroundColor: '#f39c12', color: '#ffffff'}}>
                                <td colSpan="3" style={{...styles.summaryTd, fontWeight: 'bold', textAlign: 'center', color: '#ffffff'}}>
                                    பக்கம் {pageNum} மொத்தம்:
                                </td>
                                <td style={{...styles.summaryTdRight, fontWeight: 'bold', color: '#ffffff', height: '32px'}}>₹</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    }
    
    // Page 6: Calculation Summary Page
    pages.push(
        <div key="calculation-summary-page" className="page" style={styles.page}>
            <div style={styles.sectionBox}>
                <div style={styles.sectionHeader}>
                    <div style={styles.sectionTitle}>பக்கம் வாரியாக கணக்கு</div>
                    <div style={styles.sectionSubtitle}>Page-wise Calculation Summary</div>
                </div>
                
                <table style={styles.summaryTable}>
                    <thead>
                        <tr>
                            <th style={{...styles.summaryTh, backgroundColor: '#e74c3c', fontSize: '16px'}}>பக்கம்</th>
                            <th style={{...styles.summaryTh, backgroundColor: '#e74c3c', fontSize: '16px'}}>எண்ணிக்கை</th>
                            <th style={{...styles.summaryTh, backgroundColor: '#e74c3c', fontSize: '16px'}}>பக்க மொத்தம்</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, index) => (
                            <tr key={`summary-${index}`} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                <td style={{...styles.summaryTdCenter, height: '40px', fontSize: '15px'}}>பக்கம் {index + 1}</td>
                                <td style={{...styles.summaryTdCenter, height: '40px', fontSize: '15px'}}></td>
                                <td style={{...styles.summaryTdRight, height: '40px', fontSize: '15px'}}>₹</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{backgroundColor: '#e74c3c', color: '#ffffff'}}>
                            <td style={{...styles.summaryTd, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', fontSize: '17px', height: '45px'}}>
                                மொத்த பிற்பட்ட மொய்
                            </td>
                            <td style={{...styles.summaryTdCenter, fontWeight: 'bold', color: '#ffffff', fontSize: '17px'}}></td>
                            <td style={{...styles.summaryTdRight, fontWeight: 'bold', color: '#ffffff', fontSize: '17px'}}>₹</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Additional Notes Section */}
                <div style={{marginTop: '40px', padding: '20px', border: '2px dashed #95a5a6', borderRadius: '10px', backgroundColor: '#ecf0f1'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px', textAlign: 'center'}}>
                        குறிப்பு (Notes):
                    </div>
                    <div style={{fontSize: '14px', color: '#34495e', lineHeight: '2'}}>
                        <div>• விழா முடிவிற்கு பிறகு வந்த மொய் களை இங்கே பதிவு செய்யவும்</div>
                        <div>• ஒவ்வொரு பக்கத்தின் மொத்தத்தையும் இங்கு எழுதவும்</div>
                        <div>• இறுதி மொத்த தொகையை மேல் அட்டவணையில் குறிப்பிடவும்</div>
                    </div>
                </div>
            </div>
        </div>
    );
    
    return pages;
};

// Utility functions
const calculateStatistics = (moiOnlyEntries, maternalUncleEntries, townGroups) => {
    const totalAmount = moiOnlyEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const totalPeople = moiOnlyEntries.length;
    const totalTowns = Object.keys(townGroups).length;
    const averageAmount = totalPeople > 0 ? totalAmount / totalPeople : 0;

    // Table-wise aggregation
    const tableTotalsMap = moiOnlyEntries.reduce((acc, entry) => {
        const tableKey = entry.table || 'மேசை 1';
        if (!acc[tableKey]) {
            acc[tableKey] = { table: tableKey, count: 0, amount: 0 };
        }
        acc[tableKey].count += 1;
        acc[tableKey].amount += entry.amount || 0;
        return acc;
    }, {});
    const tableTotals = Object.values(tableTotalsMap).sort((a, b) => a.table.localeCompare(b.table, 'ta'));
    const totalTables = tableTotals.length;
    
    const maternalUncleAmount = maternalUncleEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const maternalUncleCount = maternalUncleEntries.length;
    const maternalUnclePercentage = totalAmount > 0 ? Math.round((maternalUncleAmount / totalAmount) * 100) : 0;
    
    const amounts = moiOnlyEntries.map(entry => entry.amount || 0);
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
    const highAmountCount = amounts.filter(amount => amount >= 1000).length;
    
    return {
        totalAmount,
        totalPeople,
        totalTowns,
        averageAmount,
        tableTotals,
        totalTables,
        maternalUncleAmount,
        maternalUncleCount,
        maternalUnclePercentage,
        maxAmount,
        minAmount,
        highAmountCount
    };
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ta-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// Background change function
const changeBackground = (backgroundType) => {
    const backgrounds = {
        floral1: {
            background: 'linear-gradient(145deg, #fff8e1 0%, #f3e5ab 50%, #fff8e1 100%)',
            backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 87, 34, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 60%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)
            `
        },
        floral2: {
            background: 'linear-gradient(145deg, #fce4ec 0%, #f8bbd9 50%, #fce4ec 100%)',
            backgroundImage: `
                radial-gradient(circle at 30% 30%, rgba(233, 30, 99, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)
            `
        },
        traditional1: {
            background: 'linear-gradient(145deg, #fff3e0 0%, #ffcc80 50%, #fff3e0 100%)',
            backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(255, 152, 0, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(255, 87, 34, 0.1) 0%, transparent 50%)
            `
        },
        traditional2: {
            background: 'linear-gradient(145deg, #f3e5f5 0%, #ce93d8 50%, #f3e5f5 100%)',
            backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(156, 39, 176, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(103, 58, 183, 0.1) 0%, transparent 50%)
            `
        },
        elegant1: {
            background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 50%, #ffffff 100%)',
            backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(158, 158, 158, 0.1) 0%, transparent 50%)
            `
        },
        elegant2: {
            background: 'linear-gradient(145deg, #e8f5e8 0%, #c8e6c9 50%, #e8f5e8 100%)',
            backgroundImage: `
                radial-gradient(circle at 40% 40%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 60% 60%, rgba(139, 195, 74, 0.1) 0%, transparent 50%)
            `
        },
        modern1: {
            background: 'linear-gradient(145deg, #e3f2fd 0%, #90caf9 50%, #e3f2fd 100%)',
            backgroundImage: `
                radial-gradient(circle at 30% 70%, rgba(33, 150, 243, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(3, 169, 244, 0.1) 0%, transparent 50%)
            `
        },
        modern2: {
            background: 'linear-gradient(145deg, #fafafa 0%, #eeeeee 50%, #fafafa 100%)',
            backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(96, 125, 139, 0.1) 0%, transparent 50%)
            `
        },
        classic1: {
            background: 'linear-gradient(145deg, #fff8dc 0%, #f0e68c 50%, #fff8dc 100%)',
            backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255, 235, 59, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 193, 7, 0.1) 0%, transparent 50%)
            `
        },
        classic2: {
            background: 'linear-gradient(145deg, #f1f8e9 0%, #dcedc8 50%, #f1f8e9 100%)',
            backgroundImage: `
                radial-gradient(circle at 40% 60%, rgba(139, 195, 74, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 60% 40%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)
            `
        }
    };

    const coverElement = document.querySelector('.wedding-cover-page');
    if (coverElement && backgrounds[backgroundType]) {
        const bg = backgrounds[backgroundType];
        coverElement.style.background = bg.background;
        coverElement.style.backgroundImage = bg.backgroundImage;
    }
};

const getEnhancedStyles = () => ({
    page: {
        fontFamily: "'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', Arial, sans-serif",
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#000',
        backgroundColor: '#fff',
        padding: '12mm',
        width: '210mm',
        minHeight: '297mm',
        pageBreakAfter: 'always',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'visible'
    },
    
    // Cover Page Styles
    coverPage: {
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px',
        border: '3px double #2c3e50',
        borderRadius: '15px',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
    },
    logoContainer: {
        margin: '20px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    coverTitle: {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '10px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
    },
    coverEventName: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#e74c3c',
        marginBottom: '30px',
        padding: '10px 20px',
        border: '2px solid #e74c3c',
        borderRadius: '25px',
        display: 'inline-block'
    },
    coverEventDetails: {
        fontSize: '16px',
        lineHeight: '2',
        color: '#34495e',
        marginBottom: '40px'
    },
    coverStats: {
        display: 'flex',
        justifyContent: 'space-around',
        marginBottom: '40px'
    },
    statBox: {
        textAlign: 'center',
        padding: '20px',
        border: '2px solid #3498db',
        borderRadius: '10px',
        backgroundColor: '#ecf0f1',
        minWidth: '120px'
    },
    statNumber: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2980b9',
        marginBottom: '5px'
    },
    statLabel: {
        fontSize: '14px',
        color: '#34495e',
        fontWeight: '600'
    },
    reportDate: {
        fontSize: '14px',
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
    
    // Empty State Styles
    emptyStateBox: {
        textAlign: 'center',
        padding: '60px 40px',
        border: '2px dashed #bdc3c7',
        borderRadius: '15px',
        backgroundColor: '#f8f9fa'
    },
    emptyStateTitle: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '15px'
    },
    eventName: {
        fontSize: '20px',
        color: '#e74c3c',
        marginBottom: '30px',
        fontWeight: '600'
    },
    emptyMessage: {
        fontSize: '16px',
        color: '#7f8c8d',
        lineHeight: '1.8',
        marginBottom: '30px'
    },
    
    // Section Styles
    sectionBox: {
        border: '2px solid #34495e',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    sectionHeader: {
        textAlign: 'center',
        marginBottom: '25px',
        borderBottom: '2px solid #3498db',
        paddingBottom: '15px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '5px'
    },
    sectionSubtitle: {
        fontSize: '14px',
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
    
    // Event Details Styles
    eventDetailsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
    },
    eventDetailsSection: {
        padding: '20px',
        border: '1px solid #bdc3c7',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
    },
    eventSectionTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '15px',
        textAlign: 'center',
        borderBottom: '1px solid #bdc3c7',
        paddingBottom: '8px'
    },
    eventDetailsContent: {
        lineHeight: '2'
    },
    eventDetailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        padding: '5px 0'
    },
    eventLabel: {
        fontWeight: '600',
        color: '#34495e',
        minWidth: '120px'
    },
    eventValue: {
        color: '#2c3e50',
        flex: 1,
        textAlign: 'left',
        marginLeft: '10px'
    },
    
    // Stats Grid
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginTop: '30px'
    },
    statCard: {
        textAlign: 'center',
        padding: '20px',
        border: '2px solid #27ae60',
        borderRadius: '10px',
        backgroundColor: '#e8f5e8'
    },
    statCardNumber: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#27ae60',
        marginBottom: '8px'
    },
    statCardLabel: {
        fontSize: '14px',
        color: '#2c3e50',
        fontWeight: '600',
        marginBottom: '4px'
    },
    statCardSubtext: {
        fontSize: '12px',
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
    
    // Table of Contents Styles
    tocBox: {
        border: '3px double #2c3e50',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#ffffff'
    },
    tocHeader: {
        marginBottom: '40px'
    },
    tocTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '8px'
    },
    tocSubtitle: {
        fontSize: '16px',
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
    tocContent: {
        textAlign: 'left'
    },
    tocSection: {
        marginBottom: '30px'
    },
    tocMainItem: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '16px',
        marginBottom: '15px',
        fontWeight: '600'
    },
    tocNumber: {
        minWidth: '30px',
        color: '#e74c3c',
        fontWeight: 'bold'
    },
    tocText: {
        minWidth: '200px',
        color: '#2c3e50'
    },
    tocDots: {
        flex: 1,
        color: '#bdc3c7',
        fontSize: '14px'
    },
    tocPage: {
        minWidth: '30px',
        textAlign: 'right',
        color: '#3498db',
        fontWeight: 'bold'
    },
    tocSubSection: {
        marginLeft: '30px',
        marginBottom: '30px'
    },
    tocSubHeader: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: '15px'
    },
    tocSubItem: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        marginBottom: '10px'
    },
    tocBullet: {
        minWidth: '20px',
        color: '#e74c3c'
    },
    tocSubText: {
        minWidth: '180px',
        color: '#2c3e50'
    },
    
    // Summary Styles
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '25px'
    },
    summaryCard: {
        border: '2px solid #9b59b6',
        borderRadius: '10px',
        padding: '20px',
        backgroundColor: '#f4f1f8'
    },
    summaryCardHeader: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#8e44ad',
        textAlign: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #9b59b6',
        paddingBottom: '8px'
    },
    summaryCardContent: {
        lineHeight: '2'
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '14px'
    },
    summaryValue: {
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    
    // Table Styles
    tableContainer: {
        overflowX: 'auto',
        marginTop: '20px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        backgroundColor: '#ffffff'
    },
    th: {
        border: '2px solid #2c3e50',
        padding: '12px 8px',
        backgroundColor: '#34495e',
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: '14px'
    },
    td: {
        border: '1px solid #bdc3c7',
        padding: '10px 8px',
        textAlign: 'left',
        fontSize: '13px'
    },
    tdCenter: {
        border: '1px solid #bdc3c7',
        padding: '10px 8px',
        textAlign: 'center',
        fontSize: '13px'
    },
    tdRight: {
        border: '1px solid #bdc3c7',
        padding: '10px 8px',
        textAlign: 'right',
        fontSize: '13px',
        fontWeight: '600'
    },
    evenRow: {
        backgroundColor: '#f8f9fa'
    },
    oddRow: {
        backgroundColor: '#ffffff'
    },
    totalRow: {
        backgroundColor: '#3498db',
        color: '#ffffff'
    },
    
    // Town Stats Bar
    townStatsBar: {
        display: 'flex',
        justifyContent: 'space-around',
        backgroundColor: '#ecf0f1',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #bdc3c7'
    },
    townStat: {
        textAlign: 'center'
    },
    townStatLabel: {
        fontSize: '12px',
        color: '#7f8c8d',
        display: 'block',
        marginBottom: '5px'
    },
    townStatValue: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    
    // Detailed Summary Styles
    detailedSummaryContent: {
        marginTop: '20px'
    },
    summarySection: {
        marginBottom: '30px',
        padding: '20px',
        border: '1px solid #bdc3c7',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
    },
    summarySectionTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '15px',
        textAlign: 'center',
        borderBottom: '2px solid #3498db',
        paddingBottom: '10px'
    },
    summarySectionContent: {
        lineHeight: '2'
    },
    summaryDetailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        padding: '5px 0'
    },
    
    // Summary Table Styles
    townSummaryTable: {
        marginTop: '15px'
    },
    summaryTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    manualEntryTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        tableLayout: 'fixed'
    },
    summaryTh: {
        border: '2px solid #27ae60',
        padding: '12px',
        backgroundColor: '#27ae60',
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    summaryTd: {
        border: '1px solid #bdc3c7',
        padding: '10px',
        textAlign: 'left'
    },
    summaryTdCenter: {
        border: '1px solid #bdc3c7',
        padding: '10px',
        textAlign: 'center'
    },
    summaryTdRight: {
        border: '1px solid #bdc3c7',
        padding: '10px',
        textAlign: 'right',
        fontWeight: '600'
    },
    
    // Final Notes
    finalNotes: {
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px'
    },
    notesTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: '15px'
    },
    notesContent: {
        fontSize: '14px',
        color: '#856404',
        lineHeight: '1.8'
    },
    
    // Traditional Wedding Cover Page Styles
    weddingCoverPage: {
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(145deg, #fff8e1 0%, #f3e5ab 50%, #fff8e1 100%)',
        backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 87, 34, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)
        `,
        border: '4px solid #8b4513',
        borderRadius: '15px',
        padding: '15mm',
        fontFamily: "'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', serif",
        boxShadow: 'inset 0 0 50px rgba(139, 69, 19, 0.1)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    
    backgroundSelector: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10
    },
    
    backgroundDropdown: {
        padding: '5px 10px',
        border: '1px solid #8b4513',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: "'Noto Sans Tamil', Arial, sans-serif",
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
    },
    
    headerSection: {
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #8b4513',
        paddingBottom: '15px'
    },
    
    orgInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
    },
    
    leftLogo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '10px',
        color: '#8b4513'
    },
    
    centerOrgText: {
        flex: 1,
        textAlign: 'center'
    },
    
    centerMainTitle: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#d32f2f',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
        fontFamily: "'Noto Sans Tamil', serif",
        letterSpacing: '2px'
    },
    
    orgMainText: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#8b4513',
        marginBottom: '5px'
    },
    
    orgSubText: {
        fontSize: '12px',
        color: '#a0522d',
        fontStyle: 'italic'
    },
    
    rightLogo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '10px',
        color: '#8b4513'
    },
    
    companyLogo: {
        fontSize: '30px',
        marginBottom: '5px'
    },
    
    websiteText: {
        fontSize: '10px',
        fontWeight: 'bold'
    },
    
    establishedYear: {
        fontSize: '12px',
        color: '#8b4513',
        fontWeight: 'bold'
    },
    
    mainTitle: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: '20px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        fontFamily: "'Noto Sans Tamil', serif"
    },
    
    eventNumberSection: {
        textAlign: 'center',
        marginBottom: '30px',
        padding: '10px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '10px',
        border: '2px solid #2e7d32',
        display: 'inline-block',
        margin: '0 auto 30px auto',
        width: 'fit-content',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    
    eventNumberLabel: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#8b4513',
        marginBottom: '5px'
    },
    
    eventNumber: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2e7d32',
        textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
        letterSpacing: '2px'
    },
    
    coupleSection: {
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '15px',
        border: '2px solid #8b4513',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    
    coupleTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#8b4513',
        marginBottom: '15px'
    },
    
    coupleName: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: '8px',
        textDecoration: 'underline'
    },
    
    eventDetailsSection: {
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '10px',
        border: '1px solid #8b4513'
    },
    
    eventDetailTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#8b4513',
        marginBottom: '8px'
    },
    
    eventDetailText: {
        fontSize: '16px',
        color: '#2e7d32',
        fontWeight: '600',
        marginBottom: '5px'
    },
    
    hostSection: {
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '15px',
        border: '2px solid #8b4513'
    },
    
    hostTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: '15px'
    },
    
    hostName: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: '8px'
    },
    
    hostLocation: {
        fontSize: '16px',
        color: '#8b4513',
        fontWeight: '600'
    },
    
    bottomSection: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        textAlign: 'center',
        fontSize: '10px',
        color: '#8b4513',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #8b4513'
    },
    
    companyDetails: {
        lineHeight: '1.4'
    },
    
    companyName: {
        fontWeight: 'bold',
        marginBottom: '5px'
    },
    
    companyAddress: {
        marginBottom: '5px'
    },
    
    companyContact: {
        fontWeight: 'bold'
    },
    
    floralLeft: {
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '80px',
        opacity: 0.3,
        color: '#4caf50'
    },
    
    floralRight: {
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '80px',
        opacity: 0.3,
        color: '#4caf50'
    }
});

export default MoiReport;