-- MoiBook2025 MariaDB Table Structure Example

-- 1. Events Table
CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE,
  location VARCHAR(255),
  event_head VARCHAR(255),
  event_organizer VARCHAR(255)
);

-- 2. Moi Entries Table
CREATE TABLE moi_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  table_no INT,
  contributor_name VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  phone VARCHAR(20),
  note VARCHAR(255),
  denominations JSON,
  member_id VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 3. Members Table (optional, if you want to track members separately)
CREATE TABLE members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255)
);

-- 4. Registrars Table
CREATE TABLE registrars (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(50),
  phone VARCHAR(20)
);

-- 5. Settings Table
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key_name VARCHAR(255) NOT NULL,
  value TEXT
);

-- You can add more fields as needed for your app.
-- To run: Copy-paste each CREATE TABLE ...; block into your MariaDB client (e.g., HeidiSQL, DBeaver, or mysql CLI)
