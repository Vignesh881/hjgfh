import React from 'react';

export default function DenominationBill({ denominations, event, moiEntries = [], tableSummary = [], perTableDenominations = [] }) {
  const eventId = event?.id || event?.eventId || null;
  const eventEntries = Array.isArray(moiEntries)
    ? moiEntries.filter(e => !eventId || e.eventId === eventId)
    : [];
  const totalAmount = Object.entries(denominations).reduce((sum, [denom, count]) => {
    return sum + (parseInt(denom) * count);
  }, 0);

  const totalCount = Object.values(denominations).reduce((sum, count) => sum + count, 0);

  // Fallback person counts: sum all personCount entries across tables; else count moi entries
  const summaryPersonTotal = Array.isArray(tableSummary)
    ? tableSummary.reduce((sum, t) => sum + (parseInt(t.personCount ?? t.count, 10) || 0), 0)
    : 0;
  const entriesPersonTotal = eventEntries.filter(e => !e.type).length;
  const overallPersonCount = summaryPersonTotal > 0 ? summaryPersonTotal : (entriesPersonTotal > 0 ? entriesPersonTotal : '—');

  // Check if multiple tables exist
  const hasMultipleTables = tableSummary.length > 1;
  
  // Get expenses and intermediate money (change entries)
  const expenses = moiEntries.filter(e => e.type === 'expense');
  const intermediateMoneyEntries = moiEntries.filter(e => e.type === 'change');
  
  const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
  const totalIntermediateMoney = intermediateMoneyEntries.reduce((sum, e) => sum + e.amount, 0);

  const billStyles = {
    posBill: {
      width: '80mm',
      maxWidth: '302px',
      margin: '0 auto',
      fontFamily: "'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', monospace",
      fontSize: '11px',
      lineHeight: '1.3',
      color: '#000',
      backgroundColor: '#fff',
      border: '2px double #000',
      padding: '0'
    },
    
    billHeader: {
      textAlign: 'center',
      borderBottom: '2px solid #000',
      padding: '8px 6px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
    },
    
    title: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#000',
      textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
    }
  };

  return (
    <div style={billStyles.posBill}>
      {/* Header - மொய்புக் Title with Logo */}
      <header style={billStyles.billHeader}>
        <div style={billStyles.title}>மொய்புக்</div>
        <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
          {event?.eventName || event?.name || 'திருமண விழா'}
        </div>
        {event?.eventSide && (
          <div style={{ fontSize: '9px', marginTop: '2px' }}>
            ({event.eventSide})
          </div>
        )}
        <div style={{ fontSize: '9px', marginTop: '2px', color: '#000' }}>
          நாள்: {event?.date || new Date().toLocaleDateString('en-GB')}
        </div>
        <div style={{ fontSize: '9px' }}>
          {event?.venue || 'அபிநவ மஹால்'}, {event?.place || 'மதுரை'}
        </div>
        <div style={{ fontSize: '9px', marginTop: '2px' }}>
          தலைவர்: {event?.head || event?.eventHead || 'திரு. பெரியகளி'}
        </div>
        <div style={{ fontSize: '9px' }}>
          அமைப்பாளர்: {event?.organizer || event?.eventOrganizer || 'திரு. சின்னசாமி'}
        </div>
      </header>

      {/* Denomination Content */}
      <div style={{ padding: '6px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '6px'
        }}>
          கையில் உள்ள பணப்பிரிப்பு
        </div>
        
        {/* Always show table-wise breakdown like in second image */}
        {!hasMultipleTables ? (
          // Single Table - Skip table breakdown, show only total
          <div style={{ marginBottom: '8px' }}>
              <div style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              background: '#e0e0e0',
              color: 'black',
              padding: '6px',
              margin: '6px 0',
              border: '2px solid #000'
            }}>
                மொத்த கணக்கு<br/>
                கையில் உள்ள பணப்பிரிப்பு<br/>
              தாள்களின் எண்ணிக்கை ({overallPersonCount != null ? overallPersonCount : '—'} நபர்கள்)
            </div>
            
            {/* Grand total denomination table */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '10px',
              marginBottom: '6px'
            }}>
              <tbody>
                {Object.entries(denominations)
                  .filter(([_, count]) => count > 0)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([denom, count]) => (
                    <tr key={denom}>
                      <td style={{ 
                        border: '1px solid #000', 
                        padding: '4px', 
                        textAlign: 'left',
                        width: '30%'
                      }}>
                        {denom} x
                      </td>
                      <td style={{ 
                        border: '1px solid #000', 
                        padding: '4px', 
                        textAlign: 'center',
                        width: '20%'
                      }}>
                        {count}
                      </td>
                      <td style={{ 
                        border: '1px solid #000', 
                        padding: '4px', 
                        textAlign: 'right',
                        width: '50%'
                      }}>
                        {(parseInt(denom) * count).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                <tr>
                  <td colSpan="2" style={{ 
                    border: '1px solid #000', 
                    padding: '4px', 
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}>
                    மொத்த தொகை:
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '4px', 
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          // Multiple Tables - Show each table like in second image
          <>
            {perTableDenominations.map(([tableId, data]) => {
              const tableNumber = tableId.replace('table', '');
              const tableDenomCount = Object.values(data.counts).reduce((sum, count) => sum + count, 0);
              // Prefer tableSummary personCount, else fallback to moiEntries filtered by table
              const summaryPerson = tableSummary.find(t => (t.tableId || t.id) === tableId)?.personCount;
              const fallbackPerson = eventEntries.filter(e => e.table === tableId && !e.type).length;
              const tablePersonCount = summaryPerson != null ? summaryPerson : (fallbackPerson != null ? fallbackPerson : '—');
              
              return (
                <div key={tableId} style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    textAlign: 'center',
                    background: '#f0f0f0',
                    color: 'black',
                    padding: '6px',
                    margin: '6px 0',
                    border: '2px solid #000'
                  }}>
                    மேசை {tableNumber}<br/>
                    கையில் உள்ள பணப்பிரிப்பு<br/>
                    தாள்களின் எண்ணிக்கை ({tablePersonCount} நபர்கள்)
                  </div>
                  
                  {/* Denomination table for this table */}
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '10px',
                    marginBottom: '6px'
                  }}>
                    <tbody>
                      {Object.entries(data.counts)
                        .filter(([_, count]) => count > 0)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([denom, count]) => (
                          <tr key={denom}>
                            <td style={{ 
                              border: '1px solid #000', 
                              padding: '4px', 
                              textAlign: 'left',
                              width: '30%'
                            }}>
                              {denom} x
                            </td>
                            <td style={{ 
                              border: '1px solid #000', 
                              padding: '4px', 
                              textAlign: 'center',
                              width: '20%'
                            }}>
                              {count}
                            </td>
                            <td style={{ 
                              border: '1px solid #000', 
                              padding: '4px', 
                              textAlign: 'right',
                              width: '50%'
                            }}>
                              {(parseInt(denom) * count).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      <tr>
                        <td colSpan="2" style={{ 
                          border: '1px solid #000', 
                          padding: '4px', 
                          textAlign: 'left',
                          fontWeight: 'bold'
                        }}>
                          மொத்த தொகை:
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '4px', 
                          textAlign: 'right',
                          fontWeight: 'bold'
                        }}>
                          ₹{data.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
            
            {/* Grand Total Section */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                textAlign: 'center',
                background: '#e0e0e0',
                color: 'black',
                padding: '6px',
                margin: '6px 0',
                border: '2px solid #000'
              }}>
                மொத்த கணக்கு<br/>
                கையில் உள்ள பணப்பிரிப்பு<br/>
                தாள்களின் எண்ணிக்கை ({tableSummary.reduce((sum, t) => sum + (t.personCount || 0), 0)} நபர்கள்)
              </div>
              
              {/* Grand total denomination table */}
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '10px',
                marginBottom: '6px'
              }}>
                <tbody>
                  {Object.entries(denominations)
                    .filter(([_, count]) => count > 0)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .map(([denom, count]) => (
                      <tr key={denom}>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '4px', 
                          textAlign: 'left',
                          width: '30%'
                        }}>
                          {denom} x
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '4px', 
                          textAlign: 'center',
                          width: '20%'
                        }}>
                          {count}
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '4px', 
                          textAlign: 'right',
                          width: '50%'
                        }}>
                          {(parseInt(denom) * count).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  <tr>
                    <td colSpan="2" style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      textAlign: 'left',
                      fontWeight: 'bold'
                    }}>
                      மொத்த தொகை:
                    </td>
                    <td style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      textAlign: 'right',
                      fontWeight: 'bold'
                    }}>
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Intermediate Money Section (பணம் வாங்கிருந்தால்) */}
        {intermediateMoneyEntries.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              background: '#fff3cd',
              color: 'black',
              padding: '4px',
              margin: '6px 0',
              border: '2px solid #000'
            }}>
              பணம் வாங்கிருந்தால்
            </div>
            
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '10px',
              marginBottom: '6px'
            }}>
              <tbody>
                {intermediateMoneyEntries.map((entry, index) => (
                  <tr key={index}>
                    <td style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      textAlign: 'left',
                      width: '70%'
                    }}>
                      {entry.name || `Entry ${entry.id}`}
                    </td>
                    <td style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      textAlign: 'right',
                      width: '30%'
                    }}>
                      ₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '4px', 
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}>
                    மொத்தம்:
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '4px', 
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    ₹{totalIntermediateMoney.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses Section (செலவு) */}
        {expenses.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              background: '#ffebee',
              color: 'black',
              padding: '4px',
              margin: '6px 0',
              border: '2px solid #000'
            }}>
              செலவு
            </div>
            
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '10px',
              marginBottom: '6px'
            }}>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr key={index}>
                    <td style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      textAlign: 'left',
                      width: '70%'
                    }}>
                      {expense.name || `செலவு ${expense.id}`}
                    </td>
                    <td style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      textAlign: 'right',
                      width: '30%'
                    }}>
                      ₹{Math.abs(expense.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '4px', 
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}>
                    மொத்த செலவு:
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '4px', 
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Final Summary Section */}
        <div style={{ 
          marginTop: '12px',
          border: '2px solid #000',
          padding: '8px'
        }}>
          {/* மொய் வந்த தொகை */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 0',
            borderBottom: '1px dotted #ccc',
            fontSize: '11px'
          }}>
            <span>மொய் வந்த தொகை:</span>
            <span style={{ fontWeight: 'bold' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          {/* செலவு தொகை */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 0',
            borderBottom: '1px dotted #ccc',
            fontSize: '11px'
          }}>
            <span>செலவு தொகை:</span>
            <span style={{ fontWeight: 'bold' }}>{totalExpenses > 0 ? `₹${totalExpenses.toLocaleString('en-IN')}` : '-'}</span>
          </div>

          {/* கையில் ஒப்படைத்த தொகை */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 0',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            <span>கையில் ஒப்படைத்த தொகை:</span>
            <span>₹{(totalAmount - totalExpenses - totalIntermediateMoney).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Verification Statement */}
        <div style={{ 
          textAlign: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '8px',
          marginTop: '8px',
          border: '1px solid #000',
          background: '#f9f9f9'
        }}>
          மொய் தொகையை சரிபார்த்து ஒப்படைக்கப்பட்டது
        </div>
      </div>

      {/* Footer - Signatures */}
      <footer style={{
        borderTop: '2px solid #000',
        padding: '8px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center', width: '48%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>மொய் பொறுப்பாளார்</div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>கையெழுத்து</div>
          </div>
          <div style={{ textAlign: 'center', width: '48%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>விழா பொறுப்பாளார்</div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>கையெழுத்து</div>
          </div>
        </div>
        <div style={{ 
          textAlign: 'center',
          fontSize: '9px',
          color: '#000'
        }}>
          {new Date().toLocaleString('ta-IN')}
        </div>
      </footer>
    </div>
  );
}
