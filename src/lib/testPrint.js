/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Test data for 80mm POS bill printing
export const testPrintData = {
    entry: {
        id: 1001,
    memberId: 'UR-000001',
        table: 'table1',
        town: 'சென்னை',
        street: 'அண்ணா நகர்',
        name: 'கார்த்திக் மகன்',
        relationship: 'மகன்',
        education: 'M.Sc computer science',
        profession: 'IT',
        phone: '9876543210',
        note: 'குறிப்பு',
        amount: 5000,
        isMaternalUncle: false,
        denominations: {
            500: 10,
            100: 0,
            50: 0,
            20: 0,
            10: 0,
            5: 0,
            2: 0,
            1: 0
        }
    },
    event: {
        id: 1,
        eventName: 'திருமணம்',
        eventSide: 'மணமகள் பக்கம்',
        eventHead: 'ராமு',
        eventOrganizer: 'சோமு',
        date: '2025-01-01',
        time: '10:00'
    }
};

// Function to test print with sample data
export const testPrint80mm = () => {
    console.log('🖨️ Testing 80mm POS print with live timestamp...');
    
    // Import print function dynamically to avoid circular imports
    import('./printUtils.jsx').then(({ printMoiReceipt }) => {
        // Update test data with current timestamp
        const currentTime = new Date();
        const testEntry = {
            ...testPrintData.entry,
            id: Math.floor(Math.random() * 9999) + 1000, // Random ID for testing
            printTime: currentTime.toISOString()
        };
        
        console.log('📄 Printing with live time:', currentTime.toLocaleString('en-GB'));
        printMoiReceipt(testEntry, testPrintData.event);
    });
};

// Add test button to any page for testing
export const TestPrintButton = () => {
    return (
        <button 
            onClick={testPrint80mm}
            style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontFamily: "'Noto Sans Tamil', Arial, sans-serif",
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
        >
            🖨️ Test 80mm Print
        </button>
    );
};