/**
 * Database Schema Import Helper for PlanetScale
 * This tool helps import the MySQL schema into PlanetScale
 */

import React, { useState } from 'react';

const SchemaImporter = () => {
    const [connectionString, setConnectionString] = useState('');
    const [importStatus, setImportStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const schema = `-- MoiBook Multi-System Database Schema for PlanetScale
-- Auto-generated schema for Tamil Event Management System

CREATE DATABASE IF NOT EXISTS moibook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moibook_db;

-- Organizations table for multi-tenancy
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    subscription_plan ENUM('free', 'basic', 'premium') DEFAULT 'free',
    max_events INT DEFAULT 10,
    max_users INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_org_active (is_active),
    INDEX idx_org_plan (subscription_plan)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Users table with role-based access
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('admin', 'manager', 'registrar', 'viewer') DEFAULT 'registrar',
    designation VARCHAR(100),
    permissions JSON,
    last_login TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_org (organization_id),
    INDEX idx_user_role (role),
    INDEX idx_user_active (is_active),
    INDEX idx_user_email (email),
    INDEX idx_user_login (last_login)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Events table for wedding/celebration management
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    event_code VARCHAR(20) UNIQUE NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    event_location TEXT,
    host_name VARCHAR(255),
    host_family VARCHAR(255),
    event_type ENUM('wedding', 'engagement', 'birthday', 'anniversary', 'festival', 'other') DEFAULT 'wedding',
    event_side ENUM('bride', 'groom', 'both', 'host') DEFAULT 'host',
    description TEXT,
    expected_guests INT,
    actual_guests INT DEFAULT 0,
    invitation_count INT,
    table_count INT,
    target_amount DECIMAL(12,2),
    actual_amount DECIMAL(12,2) DEFAULT 0.00,
    total_entries INT DEFAULT 0,
    approval_pins JSON,
    settings JSON,
    status ENUM('planning', 'active', 'completed', 'cancelled') DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_org (organization_id),
    INDEX idx_event_date (event_date),
    INDEX idx_event_status (status),
    INDEX idx_event_type (event_type),
    INDEX idx_event_code (event_code),
    INDEX idx_event_created (created_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Moi entries for gift tracking
CREATE TABLE moi_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    registrar_id INT NOT NULL,
    entry_number VARCHAR(20) NOT NULL,
    contributor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    relationship VARCHAR(100),
    address TEXT,
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(50) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    is_maternal_uncle BOOLEAN DEFAULT FALSE,
    payment_method ENUM('cash', 'cheque', 'online', 'gold', 'kind') DEFAULT 'cash',
    cheque_number VARCHAR(50),
    bank_name VARCHAR(100),
    table_number INT,
    seat_number INT,
    receipt_number VARCHAR(50),
    entry_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    version INT DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (registrar_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entry_event (event_id),
    INDEX idx_entry_registrar (registrar_id),
    INDEX idx_entry_timestamp (entry_timestamp),
    INDEX idx_entry_amount (amount),
    INDEX idx_entry_name (contributor_name),
    INDEX idx_entry_village (village),
    INDEX idx_entry_phone (phone),
    INDEX idx_entry_table (table_number),
    INDEX idx_entry_deleted (is_deleted),
    UNIQUE KEY uk_entry_number_event (event_id, entry_number)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Address autocomplete for common villages/districts
CREATE TABLE addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    village VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(10),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_village_district (village, district),
    INDEX idx_address_village (village),
    INDEX idx_address_district (district),
    INDEX idx_address_usage (usage_count DESC)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Audit log for tracking changes
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_fields JSON,
    user_id INT,
    user_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_record (record_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default organization
INSERT INTO organizations (name, address, phone, email, subscription_plan, max_events, max_users) 
VALUES ('Default Organization', 'Tamil Nadu, India', '+91-9999999999', 'admin@moibook.com', 'free', 10, 5);

-- Insert default admin user
INSERT INTO users (organization_id, username, email, password_hash, full_name, phone, role, is_active, created_by) 
VALUES (1, 'admin', 'admin@moibook.com', 'default_hash_change_me', 'System Administrator', '+91-9999999999', 'admin', TRUE, 1);

-- Insert sample addresses
INSERT INTO addresses (village, district, state, usage_count) VALUES
('Chennai', 'Chennai', 'Tamil Nadu', 100),
('Madurai', 'Madurai', 'Tamil Nadu', 95),
('Coimbatore', 'Coimbatore', 'Tamil Nadu', 90),
('Tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu', 85),
('Salem', 'Salem', 'Tamil Nadu', 80),
('Tirunelveli', 'Tirunelveli', 'Tamil Nadu', 75),
('Tiruppur', 'Tiruppur', 'Tamil Nadu', 70),
('Vellore', 'Vellore', 'Tamil Nadu', 65),
('Thanjavur', 'Thanjavur', 'Tamil Nadu', 60),
('Erode', 'Erode', 'Tamil Nadu', 55);`;

    const copySchema = () => {
        navigator.clipboard.writeText(schema).then(() => {
            setImportStatus('✅ Schema copied to clipboard! Paste it in PlanetScale Console.');
        }).catch(() => {
            setImportStatus('❌ Copy failed. Please manually copy the schema.');
        });
    };

    const downloadSchema = () => {
        const blob = new Blob([schema], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'moibook_planetscale_schema.sql';
        a.click();
        URL.revokeObjectURL(url);
        setImportStatus('✅ Schema downloaded as SQL file!');
    };

    return (
        <div style={{
            maxWidth: '800px',
            margin: '20px auto',
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h2 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                🗄️ PlanetScale Schema Importer
            </h2>
            
            <div style={{ 
                backgroundColor: '#e7f3ff', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #bee5eb'
            }}>
                <h3 style={{ color: '#0c5460', marginBottom: '8px' }}>Schema Import Steps:</h3>
                <ol style={{ color: '#0c5460', paddingLeft: '20px' }}>
                    <li>Copy the schema using button below</li>
                    <li>Go to PlanetScale Dashboard → Your Database → Console</li>
                    <li>Paste the schema in the SQL console</li>
                    <li>Execute the schema to create all tables</li>
                    <li>Verify tables are created successfully</li>
                </ol>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                    onClick={copySchema}
                    style={{
                        flex: 1,
                        padding: '12px 20px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}
                >
                    📋 Copy Schema
                </button>
                
                <button
                    onClick={downloadSchema}
                    style={{
                        flex: 1,
                        padding: '12px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}
                >
                    💾 Download SQL
                </button>
            </div>

            {importStatus && (
                <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: importStatus.includes('✅') ? '#d4edda' : '#f8d7da',
                    color: importStatus.includes('✅') ? '#155724' : '#721c24',
                    marginBottom: '20px'
                }}>
                    {importStatus}
                </div>
            )}

            <div style={{ 
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '16px'
            }}>
                <h4 style={{ color: '#495057', marginBottom: '12px' }}>Schema Preview:</h4>
                <pre style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    overflow: 'auto',
                    maxHeight: '300px',
                    fontSize: '12px',
                    color: '#495057'
                }}>
                    {schema.substring(0, 1000)}...
                    {'\n\n'}[Full schema available via Copy/Download buttons]
                </pre>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
                <p>🎯 This schema creates all tables needed for MoiBook multi-system operation</p>
                <p>📊 Supports: Organizations, Users, Events, Moi Entries, Addresses, Audit Log</p>
            </div>
        </div>
    );
};

export default SchemaImporter;