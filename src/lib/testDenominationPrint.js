/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Test data for denomination bill printing
export const testDenominationData = {
    denominations: {
        500: 10,
        200: 5, 
        100: 3,
        50: 2,
        20: 1,
        10: 5,
        5: 2,
        2: 3,
        1: 5
    },
    totalAmount: 5000,
    eventInfo: {
        eventName: 'திருமணம்',
        eventHead: 'ராமு'
    }
};

// Function to test denomination bill print
export const testDenominationPrint = () => {
    // Import print function dynamically
    import('./printUtils.jsx').then(({ printDenominationBill }) => {
        console.log('🖨️ Testing denomination bill print...');
        printDenominationBill(
            testDenominationData.denominations,
            testDenominationData.totalAmount,
            testDenominationData.eventInfo,
            `TEST-${Date.now().toString().slice(-6)}`
        );
    });
};

// Test button component
export const TestDenominationButton = () => {
    return (
        <button 
            onClick={testDenominationPrint}
            style={{
                background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontFamily: "'Noto Sans Tamil', Arial, sans-serif",
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                margin: '5px'
            }}
        >
            🖨️ Test Denomination Bill
        </button>
    );
};