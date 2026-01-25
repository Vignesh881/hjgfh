/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MySQL Database Adapter for MoiBook
 */

import mysql from 'mysql2/promise';

class MySQLAdapter {
    constructor(config) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 3306,
            user: config.user || 'moibook_user',
            password: config.password,
            database: config.database || 'moibook_db',
            charset: 'utf8mb4',
            timezone: '+05:30', // Indian Standard Time
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        this.connection = null;
        this.pool = null;
    }

    async connect() {
        try {
            // Create connection pool for better performance
            this.pool = mysql.createPool({
                ...this.config,
                connectionLimit: 10,
                queueLimit: 0,
                acquireTimeout: 60000,
                timeout: 60000
            });

            // Test connection
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();

            console.log('✅ MySQL connected successfully');
            return true;
        } catch (error) {
            console.error('❌ MySQL connection failed:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }

    // Events operations
    async getEvents(organizationId = null) {
        try {
            const query = organizationId 
                ? 'SELECT * FROM event_summary WHERE organization_id = ? ORDER BY event_date DESC'
                : 'SELECT * FROM event_summary ORDER BY event_date DESC';
            
            const [rows] = organizationId 
                ? await this.pool.execute(query, [organizationId])
                : await this.pool.execute(query);
            
            return rows;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    async createEvent(eventData, userId) {
        try {
            const query = `
                INSERT INTO events 
                (organization_id, event_code, event_name, event_date, event_time, 
                 event_location, host_name, host_family, event_type, description, 
                 expected_guests, target_amount, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                eventData.organizationId || 1,
                eventData.eventCode || `EVT${Date.now()}`,
                eventData.eventName,
                eventData.eventDate,
                eventData.eventTime || null,
                eventData.eventLocation || null,
                eventData.hostName || null,
                eventData.hostFamily || null,
                eventData.eventType || 'wedding',
                eventData.description || null,
                eventData.expectedGuests || null,
                eventData.targetAmount || null,
                userId
            ];

            const [result] = await this.pool.execute(query, values);
            
            // Log the action
            await this.logAudit('events', result.insertId, 'INSERT', null, eventData, userId);
            
            return { id: result.insertId, ...eventData };
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    // Moi entries operations
    async getMoiEntries(eventId = null, filters = {}) {
        try {
            let query = `
                SELECT m.*, u.full_name as registrar_name, e.event_name
                FROM moi_entries m
                JOIN users u ON m.registrar_id = u.id
                JOIN events e ON m.event_id = e.id
            `;
            let params = [];

            if (eventId) {
                query += ' WHERE m.event_id = ?';
                params.push(eventId);
            }

            // Add additional filters
            if (filters.registrarId) {
                query += eventId ? ' AND' : ' WHERE';
                query += ' m.registrar_id = ?';
                params.push(filters.registrarId);
            }

            if (filters.dateFrom) {
                query += (eventId || filters.registrarId) ? ' AND' : ' WHERE';
                query += ' DATE(m.entry_timestamp) >= ?';
                params.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                query += (eventId || filters.registrarId || filters.dateFrom) ? ' AND' : ' WHERE';
                query += ' DATE(m.entry_timestamp) <= ?';
                params.push(filters.dateTo);
            }

            query += ' ORDER BY m.entry_timestamp DESC';

            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error fetching moi entries:', error);
            throw error;
        }
    }

    async createMoiEntry(entryData, userId) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Generate entry number
            const [entryCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM moi_entries WHERE event_id = ?',
                [entryData.eventId]
            );
            
            const entryNumber = `T${entryData.tableNumber || 1}-${String(entryCount[0].count + 1).padStart(3, '0')}`;

            // Insert moi entry
            const insertQuery = `
                INSERT INTO moi_entries 
                (event_id, registrar_id, entry_number, contributor_name, amount, 
                 relationship, address, village, district, phone, email, notes, 
                 is_maternal_uncle, payment_method, cheque_number, bank_name, 
                 receipt_number, table_number, seat_number, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                entryData.eventId,
                entryData.registrarId || userId,
                entryNumber,
                entryData.contributorName,
                entryData.amount,
                entryData.relationship || null,
                entryData.address || null,
                entryData.village || null,
                entryData.district || null,
                entryData.phone || null,
                entryData.email || null,
                entryData.notes || null,
                entryData.isMaternalUncle || false,
                entryData.paymentMethod || 'cash',
                entryData.chequeNumber || null,
                entryData.bankName || null,
                entryData.receiptNumber || null,
                entryData.tableNumber || null,
                entryData.seatNumber || null,
                userId
            ];

            const [result] = await connection.execute(insertQuery, values);

            // Update event totals
            await connection.execute(`
                UPDATE events 
                SET actual_amount = (
                    SELECT COALESCE(SUM(amount), 0) 
                    FROM moi_entries 
                    WHERE event_id = ?
                ),
                total_entries = (
                    SELECT COUNT(*) 
                    FROM moi_entries 
                    WHERE event_id = ?
                )
                WHERE id = ?
            `, [entryData.eventId, entryData.eventId, entryData.eventId]);

            // Update address usage count
            if (entryData.village && entryData.district) {
                await connection.execute(`
                    INSERT INTO addresses (village, district, usage_count) 
                    VALUES (?, ?, 1)
                    ON DUPLICATE KEY UPDATE usage_count = usage_count + 1
                `, [entryData.village, entryData.district]);
            }

            await connection.commit();

            // Log the action
            await this.logAudit('moi_entries', result.insertId, 'INSERT', null, 
                              { ...entryData, entryNumber }, userId);

            return { id: result.insertId, entryNumber, ...entryData };

        } catch (error) {
            await connection.rollback();
            console.error('Error creating moi entry:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // User management
    async createUser(userData) {
        try {
            const query = `
                INSERT INTO users 
                (organization_id, username, email, password_hash, full_name, 
                 phone, role, designation, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                userData.organizationId || 1,
                userData.username,
                userData.email,
                userData.passwordHash,
                userData.fullName,
                userData.phone || null,
                userData.role || 'registrar',
                userData.designation || null,
                true
            ];

            const [result] = await this.pool.execute(query, values);
            return { id: result.insertId, ...userData };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async authenticateUser(username, passwordHash) {
        try {
            const query = `
                SELECT u.*, o.name as organization_name 
                FROM users u 
                LEFT JOIN organizations o ON u.organization_id = o.id
                WHERE u.username = ? AND u.password_hash = ? AND u.is_active = TRUE
            `;

            const [rows] = await this.pool.execute(query, [username, passwordHash]);
            
            if (rows.length === 0) {
                return null;
            }

            const user = rows[0];

            // Update last login
            await this.pool.execute(
                'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?',
                [user.id]
            );

            return user;
        } catch (error) {
            console.error('Error authenticating user:', error);
            throw error;
        }
    }

    // Analytics and reporting
    async getEventAnalytics(eventId) {
        try {
            const queries = {
                summary: `
                    SELECT 
                        COUNT(*) as total_entries,
                        SUM(amount) as total_amount,
                        AVG(amount) as average_amount,
                        MIN(amount) as min_amount,
                        MAX(amount) as max_amount,
                        COUNT(DISTINCT registrar_id) as registrars_count
                    FROM moi_entries 
                    WHERE event_id = ?
                `,
                byRelationship: `
                    SELECT 
                        COALESCE(relationship, 'Unknown') as relationship,
                        COUNT(*) as count,
                        SUM(amount) as total_amount,
                        AVG(amount) as avg_amount
                    FROM moi_entries 
                    WHERE event_id = ?
                    GROUP BY relationship 
                    ORDER BY total_amount DESC
                `,
                byRegistrar: `
                    SELECT 
                        u.full_name as registrar_name,
                        COUNT(m.id) as entries_count,
                        SUM(m.amount) as total_collected,
                        AVG(m.amount) as avg_amount
                    FROM moi_entries m
                    JOIN users u ON m.registrar_id = u.id
                    WHERE m.event_id = ?
                    GROUP BY u.id, u.full_name
                    ORDER BY total_collected DESC
                `,
                hourlyTrend: `
                    SELECT 
                        HOUR(entry_timestamp) as hour,
                        COUNT(*) as entries,
                        SUM(amount) as amount
                    FROM moi_entries 
                    WHERE event_id = ?
                    GROUP BY HOUR(entry_timestamp)
                    ORDER BY hour
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const [rows] = await this.pool.execute(query, [eventId]);
                results[key] = rows;
            }

            return results;
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw error;
        }
    }

    // Audit logging
    async logAudit(tableName, recordId, action, oldValues, newValues, userId, ipAddress = null) {
        try {
            const query = `
                INSERT INTO audit_log 
                (table_name, record_id, action, old_values, new_values, user_id, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await this.pool.execute(query, [
                tableName,
                recordId,
                action,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                userId,
                ipAddress
            ]);
        } catch (error) {
            console.error('Error logging audit:', error);
            // Don't throw error for audit logging failure
        }
    }

    // Search functionality
    async searchEntries(searchTerm, eventId = null) {
        try {
            let query = `
                SELECT m.*, u.full_name as registrar_name, e.event_name
                FROM moi_entries m
                JOIN users u ON m.registrar_id = u.id
                JOIN events e ON m.event_id = e.id
                WHERE (
                    MATCH(m.contributor_name, m.address, m.notes) AGAINST(? IN NATURAL LANGUAGE MODE)
                    OR m.phone LIKE ?
                    OR m.contributor_name LIKE ?
                )
            `;

            const params = [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`];

            if (eventId) {
                query += ' AND m.event_id = ?';
                params.push(eventId);
            }

            query += ' ORDER BY m.entry_timestamp DESC LIMIT 50';

            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error searching entries:', error);
            throw error;
        }
    }
}

export default MySQLAdapter;