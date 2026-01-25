/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MoiBook Database Storage Calculator
 * Calculate how many events and entries can fit in different storage sizes
 */

// Storage size calculator for MoiBook database
class MoiBookStorageCalculator {
    constructor() {
        // Average storage per record in bytes (based on Tamil text + metadata)
        this.averageSizes = {
            // Single moi entry with Tamil text
            moiEntry: {
                name: 50,          // Tamil name (average 25 characters × 2 bytes UTF-8)
                amount: 8,         // DECIMAL(10,2)
                relationship: 30,  // Tamil relationship text
                address: 200,      // Full Tamil address
                phone: 15,         // Phone number
                notes: 100,        // Optional notes
                timestamps: 50,    // Created/updated timestamps
                metadata: 47,      // IDs, booleans, other fields
                indexOverhead: 30, // Database index overhead
                total: 530         // Total bytes per moi entry
            },
            
            // Event record
            event: {
                name: 100,         // Tamil event name
                date: 10,          // Date field
                location: 150,     // Tamil location text
                hostName: 50,      // Host name
                description: 200,  // Event description
                metadata: 100,     // IDs, calculations, timestamps
                indexOverhead: 40, // Database indexes
                total: 650         // Total bytes per event
            },
            
            // User/Registrar record
            user: {
                name: 50,          // Tamil full name
                username: 25,      // Login username
                email: 50,         // Email address
                password: 60,      // Hashed password
                metadata: 65,      // Permissions, timestamps, etc.
                indexOverhead: 25, // Database indexes
                total: 275         // Total bytes per user
            },
            
            // Address/Town data
            address: {
                village: 50,       // Tamil village name
                district: 30,      // District name
                metadata: 20,      // Usage count, timestamps
                indexOverhead: 15, // Database indexes
                total: 115         // Total bytes per address
            }
        };
    }

    // Calculate storage for different scenarios
    calculateStorageUsage(events, entriesPerEvent, users = 10, addresses = 1000) {
        const totalEntries = events * entriesPerEvent;
        
        const usage = {
            moiEntries: totalEntries * this.averageSizes.moiEntry.total,
            events: events * this.averageSizes.event.total,
            users: users * this.averageSizes.user.total,
            addresses: addresses * this.averageSizes.address.total,
            
            // Database overhead (indexes, metadata, system tables)
            databaseOverhead: 0
        };
        
        // Calculate total data size
        const totalDataSize = usage.moiEntries + usage.events + usage.users + usage.addresses;
        
        // Database overhead is typically 20-30% of data size
        usage.databaseOverhead = totalDataSize * 0.25;
        
        // Total storage including overhead
        usage.total = totalDataSize + usage.databaseOverhead;
        
        return usage;
    }

    // Convert bytes to human readable format
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Calculate what fits in different storage limits
    calculateCapacity(storageLimitGB) {
        const storageLimitBytes = storageLimitGB * 1024 * 1024 * 1024;
        
        const scenarios = [
            { name: 'Small Events', entriesPerEvent: 300 },
            { name: 'Medium Events', entriesPerEvent: 600 },
            { name: 'Large Events', entriesPerEvent: 1000 },
            { name: 'Very Large Events', entriesPerEvent: 1500 }
        ];

        const results = [];

        scenarios.forEach(scenario => {
            // Binary search to find maximum events
            let low = 1, high = 10000;
            let maxEvents = 0;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const usage = this.calculateStorageUsage(mid, scenario.entriesPerEvent);
                
                if (usage.total <= storageLimitBytes) {
                    maxEvents = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            const finalUsage = this.calculateStorageUsage(maxEvents, scenario.entriesPerEvent);
            
            results.push({
                scenario: scenario.name,
                entriesPerEvent: scenario.entriesPerEvent,
                maxEvents: maxEvents,
                totalEntries: maxEvents * scenario.entriesPerEvent,
                storageUsed: this.formatBytes(finalUsage.total),
                storageUsedBytes: finalUsage.total,
                breakdown: {
                    moiEntries: this.formatBytes(finalUsage.moiEntries),
                    events: this.formatBytes(finalUsage.events),
                    overhead: this.formatBytes(finalUsage.databaseOverhead)
                }
            });
        });

        return results;
    }

    // Real-world event examples
    generateRealWorldExamples() {
        const examples = [
            {
                name: 'வீட்டு திருமணம் (Home Wedding)',
                description: 'Small family wedding at home',
                expectedEntries: 250,
                events: 50,  // 50 such weddings per year
                category: 'Small'
            },
            {
                name: 'கல்யாண மண்டபம் (Wedding Hall)',
                description: 'Medium wedding in hall',
                expectedEntries: 500,
                events: 30,  // 30 such weddings per year
                category: 'Medium'
            },
            {
                name: 'பெரிய திருமணம் (Grand Wedding)',
                description: 'Large wedding with many guests',
                expectedEntries: 800,
                events: 20,  // 20 such weddings per year
                category: 'Large'
            },
            {
                name: 'VIP திருமணம் (VIP Wedding)',
                description: 'Celebrity or politician wedding',
                expectedEntries: 1200,
                events: 10,  // 10 such weddings per year
                category: 'Very Large'
            }
        ];

        return examples.map(example => {
            const usage = this.calculateStorageUsage(example.events, example.expectedEntries);
            return {
                ...example,
                totalEntries: example.events * example.expectedEntries,
                storageRequired: this.formatBytes(usage.total),
                storageBytes: usage.total
            };
        });
    }
}

// Initialize calculator
const calculator = new MoiBookStorageCalculator();

// Calculate for different storage limits
console.log('='.repeat(80));
console.log('📊 MoiBook Database Storage Capacity Analysis');
console.log('='.repeat(80));

// 5GB Analysis (PlanetScale Free Tier)
console.log('\n🔵 5GB Storage Capacity (PlanetScale Free Tier):');
const fiveGBResults = calculator.calculateCapacity(5);
fiveGBResults.forEach(result => {
    console.log(`\n${result.scenario}:`);
    console.log(`  📈 Maximum Events: ${result.maxEvents.toLocaleString()}`);
    console.log(`  👥 Total Moi Entries: ${result.totalEntries.toLocaleString()}`);
    console.log(`  💾 Storage Used: ${result.storageUsed}`);
    console.log(`  🔍 Breakdown:`);
    console.log(`     - Moi Entries: ${result.breakdown.moiEntries}`);
    console.log(`     - Events Data: ${result.breakdown.events}`);
    console.log(`     - DB Overhead: ${result.breakdown.overhead}`);
});

// 1GB Analysis (Firebase/Supabase Free Tier)
console.log('\n🟡 1GB Storage Capacity (Firebase/Supabase Free Tier):');
const oneGBResults = calculator.calculateCapacity(1);
oneGBResults.forEach(result => {
    console.log(`\n${result.scenario}:`);
    console.log(`  📈 Maximum Events: ${result.maxEvents.toLocaleString()}`);
    console.log(`  👥 Total Moi Entries: ${result.totalEntries.toLocaleString()}`);
    console.log(`  💾 Storage Used: ${result.storageUsed}`);
});

// 500MB Analysis (Supabase Free Tier)
console.log('\n🟠 500MB Storage Capacity (Supabase Free Tier):');
const halfGBResults = calculator.calculateCapacity(0.5);
halfGBResults.forEach(result => {
    console.log(`\n${result.scenario}:`);
    console.log(`  📈 Maximum Events: ${result.maxEvents.toLocaleString()}`);
    console.log(`  👥 Total Moi Entries: ${result.totalEntries.toLocaleString()}`);
    console.log(`  💾 Storage Used: ${result.storageUsed}`);
});

// Real-world examples
console.log('\n🌟 Real-World Wedding Examples:');
const realWorldExamples = calculator.generateRealWorldExamples();
realWorldExamples.forEach(example => {
    console.log(`\n${example.name}:`);
    console.log(`  📝 Description: ${example.description}`);
    console.log(`  📊 ${example.events} events × ${example.expectedEntries} entries = ${example.totalEntries.toLocaleString()} total entries`);
    console.log(`  💾 Storage Required: ${example.storageRequired}`);
});

// Summary recommendations
console.log('\n' + '='.repeat(80));
console.log('💡 RECOMMENDATIONS');
console.log('='.repeat(80));

console.log('\n🎯 For different business scales:');
console.log('\n📍 Individual Wedding Organizer:');
console.log('   - Supabase 500MB Free: 900+ medium events');
console.log('   - Perfect for: 2-3 years of wedding planning');

console.log('\n📍 Small Wedding Hall:');
console.log('   - Firebase 1GB Free: 1,800+ medium events');
console.log('   - Perfect for: 5+ years of operations');

console.log('\n📍 Large Wedding Business:');
console.log('   - PlanetScale 5GB Free: 9,000+ medium events');
console.log('   - Perfect for: 15+ years of operations');

console.log('\n📍 Enterprise Wedding Management:');
console.log('   - Paid Plans: Unlimited scaling');
console.log('   - Multiple locations, unlimited events');

console.log('\n🚀 Key Insights:');
console.log('   ✅ Tamil text storage is very efficient');
console.log('   ✅ 5GB can handle massive wedding businesses');
console.log('   ✅ Free tiers are sufficient for most users');
console.log('   ✅ Database overhead is manageable');

// Export for use in application
export { MoiBookStorageCalculator };

// Make available in browser console
if (typeof window !== 'undefined') {
    window.moibookStorageCalculator = new MoiBookStorageCalculator();
    console.log('\n🔧 Storage calculator available at: window.moibookStorageCalculator');
}