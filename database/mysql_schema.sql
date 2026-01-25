

CREATE DATABASE IF NOT EXISTS moibook2025 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moibook2025;

CREATE TABLE IF NOT EXISTS registrars (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(50),
    phone VARCHAR(20)
);


CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE,
    location VARCHAR(255),
    event_head VARCHAR(255),
    event_organizer VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS moi_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    table_no INT,
    contributor_name VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    phone VARCHAR(20),
    note VARCHAR(255),
    denominations JSON,
    uuid CHAR(36) DEFAULT NULL,
    synced TINYINT(1) DEFAULT 0,
    member_id VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);












CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(255) NOT NULL,
    value TEXT
);


CREATE TABLE IF NOT EXISTS members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255)
);