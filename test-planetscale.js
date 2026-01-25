const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPlanetScaleConnection() {
    console.log('🧪 Testing PlanetScale Connection...\n');

    // Check if PlanetScale credentials are configured
    const host = process.env.PLANETSCALE_HOST || process.env.MYSQL_HOST;
    const user = process.env.PLANETSCALE_USER || process.env.MYSQL_USER;
    const password = process.env.PLANETSCALE_PASSWORD || process.env.MYSQL_PASSWORD;
    const database = process.env.PLANETSCALE_DATABASE || process.env.MYSQL_DATABASE;

    if (!host || !user || !password || !database) {
        console.log('❌ Configuration Error:');
        console.log('Missing required environment variables.');
        console.log('Please check your server/.env file.\n');
        console.log('Required variables:');
        console.log('- MYSQL_HOST or PLANETSCALE_HOST');
        console.log('- MYSQL_USER or PLANETSCALE_USER');
        console.log('- MYSQL_PASSWORD or PLANETSCALE_PASSWORD');
        console.log('- MYSQL_DATABASE or PLANETSCALE_DATABASE\n');
        return;
    }

    console.log('📋 Configuration:');
    console.log(`Host: ${host}`);
    console.log(`User: ${user}`);
    console.log(`Database: ${database}`);
    console.log(`SSL: ${process.env.MYSQL_SSL_CA ? 'Enabled' : 'Disabled'}\n`);

    let connection;

    try {
        // Create connection
        const config = {
            host,
            user,
            password,
            database,
            port: 3306,
            connectTimeout: 10000,
        };

        // Add SSL if configured
        if (process.env.MYSQL_SSL_CA) {
            config.ssl = {
                ca: process.env.MYSQL_SSL_CA,
                cert: process.env.MYSQL_SSL_CERT,
                key: process.env.MYSQL_SSL_KEY,
                rejectUnauthorized: true
            };
        }

        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(config);

        console.log('✅ Connection successful!\n');

        // Test basic queries
        console.log('🧪 Running test queries...\n');

        // Check tables
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'events'"
        );

        if (tables.length > 0) {
            console.log('✅ Tables exist in database');

            // Get table count
            const [countResult] = await connection.execute(
                "SELECT COUNT(*) as count FROM events"
            );
            console.log(`📊 Events table has ${countResult[0].count} records\n`);
        } else {
            console.log('⚠️  Tables not found. You may need to run the schema.\n');
        }

        // Test PlanetScale specific features
        try {
            const [version] = await connection.execute('SELECT VERSION() as version');
            console.log(`📋 Database Version: ${version[0].version}`);

            const [charset] = await connection.execute('SELECT @@character_set_database as charset');
            console.log(`📋 Character Set: ${charset[0].charset}\n`);
        } catch (e) {
            console.log('ℹ️  Could not retrieve version info\n');
        }

        console.log('🎉 PlanetScale connection test completed successfully!');
        console.log('Your MoiBook2025 application is ready to use PlanetScale.\n');

    } catch (error) {
        console.log('❌ Connection failed:');
        console.log(`Error: ${error.message}\n`);

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Possible issues:');
            console.log('- Check if PlanetScale credentials are correct');
            console.log('- Verify SSL certificates are properly configured');
            console.log('- Ensure PlanetScale database is in Ready state');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Possible issues:');
            console.log('- Check username and password');
            console.log('- Verify database permissions');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 Possible issues:');
            console.log('- Check database name');
            console.log('- Ensure database exists in PlanetScale');
        }

        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check server/.env file configuration');
        console.log('2. Verify PlanetScale dashboard credentials');
        console.log('3. Ensure SSL certificates are downloaded and paths are correct');
        console.log('4. Run database schema if tables don\'t exist');

    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connection closed.');
        }
    }
}

// Run the test
testPlanetScaleConnection().catch(console.error);