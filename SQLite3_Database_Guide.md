# SQLite3-ல் MoiBook Database பார்ப்பது

## 📋 Overview
இந்த guide-ல் MoiBook2025 database-ஐ SQLite3 command line tool அல்லது GUI tools-ல் எப்படி பார்ப்பது என்று விளக்கப்பட்டுள்ளது. MoiBook இப்போது SQL script (.sql) format-ல் export செய்கிறது.

## 🔧 Prerequisites

### SQLite3 Installation
```bash
# Windows (if not already installed)
winget install SQLite.SQLite

# macOS
brew install sqlite

# Ubuntu/Debian
sudo apt-get install sqlite3

# Check installation
sqlite3 --version
```

### GUI Tools (Optional)
- **DB Browser for SQLite** - https://sqlitebrowser.org/
- **SQLiteStudio** - https://sqlitestudio.pl/
- **DBeaver** - https://dbeaver.io/

## 📤 Database Export செய்வது

### Method 1: Settings Page-ல் இருந்து
1. MoiBook application-ஐ திறக்கவும்
2. Settings page-க்கு செல்லவும்
3. "🗃️ SQLite Export (.sql script)" button-ஐ click செய்யவும்
4. `moibook_YYYY-MM-DD.sql` file download ஆகும்

### Method 2: Browser Console-ல் இருந்து
```javascript
// Browser console-ல் type செய்யவும்
window.moibookSQLite.export()
```

## 🔍 SQLite3 Command Line-ல் Database பார்ப்பது

### 1. SQL Script-ஐ SQLite Database-ல் Import செய்யவும்
```bash
# Download செய்த folder-ல் navigate செய்யவும்
cd Downloads

# புதிய SQLite database உருவாக்கி SQL script import செய்யவும்
sqlite3 moibook.db < moibook_2025-01-09.sql

# Database-ஐ திறக்கவும்
sqlite3 moibook.db
```

### 2. Basic Commands

#### Tables பார்க்கவும்
```sql
-- All tables list செய்ய
.tables

-- Table schema பார்க்க
.schema

-- Specific table schema
.schema events
```

#### Data பார்க்கவும்
```sql
-- All events
SELECT * FROM events;

-- All registrars
SELECT * FROM registrars;

-- All moi entries
SELECT * FROM moi_entries;

-- Settings
SELECT * FROM settings;
```

#### Formatted Output
```sql
-- Headers with columns
.headers on
.mode column

-- Table format
.mode table

-- CSV format
.mode csv
```

### 3. Advanced Queries

#### Event-wise Statistics
```sql
-- Event-wise மொத்த amount
SELECT 
    e.name as event_name,
    e.date,
    COUNT(m.id) as total_entries,
    SUM(m.amount) as total_amount
FROM events e
LEFT JOIN moi_entries m ON e.id = m.eventId
GROUP BY e.id, e.name, e.date;
```

#### Registrar-wise Performance
```sql
-- Registrar-wise entry count
SELECT 
    r.name as registrar_name,
    COUNT(m.id) as entries_count,
    SUM(m.amount) as total_collected
FROM registrars r
LEFT JOIN moi_entries m ON r.id = m.registrarId
GROUP BY r.id, r.name
ORDER BY total_collected DESC;
```

#### Top Contributors
```sql
-- Highest moi amounts
SELECT 
    name,
    amount,
    relationship,
    address
FROM moi_entries
ORDER BY amount DESC
LIMIT 10;
```

#### Date Range Analysis
```sql
-- Monthly wise entries
SELECT 
    strftime('%Y-%m', timestamp) as month,
    COUNT(*) as entries,
    SUM(amount) as total
FROM moi_entries
GROUP BY strftime('%Y-%m', timestamp)
ORDER BY month;
```

### 4. Export Data from SQLite

#### CSV Export
```sql
-- Headers enable செய்யவும்
.headers on
.mode csv

-- File-க்கு export செய்யவும்
.output moi_entries_export.csv
SELECT * FROM moi_entries;
.output stdout
```

#### Excel-friendly Export
```sql
-- Tab separated values
.mode tabs
.output data_export.tsv
SELECT 
    e.name as event,
    m.name as contributor,
    m.amount,
    m.relationship,
    m.address,
    m.timestamp
FROM moi_entries m
JOIN events e ON m.eventId = e.id;
.output stdout
```

## 🖥️ GUI Tools-ல் பார்ப்பது

### DB Browser for SQLite
1. Download & install: https://sqlitebrowser.org/
2. New Database → Create new database → `moibook.db`
3. File → Import → Table from SQL file → select `.sql` file
4. Browse Data tab-ல் tables பார்க்கலாம்
5. Execute SQL tab-ல் queries run செய்யலாம்

### DBeaver (Professional)
1. New Connection → SQLite
2. Create new database file: `moibook.db`
3. SQL Editor-ல் .sql file content-ஐ paste செய்து execute செய்யவும்
4. Visual query builder available

## 📊 Database Schema விளக்கம்

### Tables Structure

#### `events` Table
```sql
- id: TEXT (Primary Key)
- name: TEXT (Event name in Tamil)
- date: TEXT (Event date)
- location: TEXT (Venue)
- host: TEXT (Host name)
- type: TEXT (wedding/engagement/etc)
- description: TEXT
- created_at: TEXT (ISO timestamp)
- updated_at: TEXT (ISO timestamp)
```

#### `registrars` Table
```sql
- id: TEXT (Primary Key)
- name: TEXT (Registrar name in Tamil)
- username: TEXT (Login username)
- password: TEXT (Hashed password)
- permission: BOOLEAN (Admin access)
- created_at: TEXT
- updated_at: TEXT
```

#### `moi_entries` Table
```sql
- id: TEXT (Primary Key)
- eventId: TEXT (Foreign Key → events.id)
- registrarId: TEXT (Foreign Key → registrars.id)
- name: TEXT (Contributor name in Tamil)
- amount: REAL (Moi amount)
- relationship: TEXT (Relation to host)
- address: TEXT (Contributor address)
- phone: TEXT (Contact number)
- notes: TEXT (Additional notes)
- timestamp: TEXT (Entry time)
- type: TEXT (Entry type)
- isMaternalUncle: BOOLEAN (Special relationship flag)
```

#### `settings` Table
```sql
- key: TEXT (Primary Key)
- value: TEXT (JSON serialized value)
- updated_at: TEXT
```

## 🔧 Troubleshooting

### File Access Issues
```bash
# SQL script file permissions check
ls -la moibook_*.sql

# Import verification after creating database
sqlite3 moibook.db "SELECT name FROM sqlite_master WHERE type='table';"
```

### Query Performance
```sql
-- Add indexes for better performance
CREATE INDEX idx_moi_event ON moi_entries(eventId);
CREATE INDEX idx_moi_registrar ON moi_entries(registrarId);
CREATE INDEX idx_moi_timestamp ON moi_entries(timestamp);
```

### Data Validation
```sql
-- Check data consistency
SELECT COUNT(*) FROM moi_entries WHERE eventId NOT IN (SELECT id FROM events);
SELECT COUNT(*) FROM moi_entries WHERE registrarId NOT IN (SELECT id FROM registrars);
```

## 💡 Console Commands Reference

Browser console-ல் இந்த commands available:

```javascript
// SQLite export (SQL script format)
window.moibookSQLite.export()

// Current data view
window.moibookSQLite.viewData()

// Analyze uploaded SQL/SQLite file
window.moibookSQLite.analyze(file)

// Generate sample SQLite queries
window.moibookSQLite.generateSampleQueries()
```

## 📝 Notes

1. **Character Encoding**: Tamil text properly encoded in UTF-8
2. **Date Format**: ISO 8601 format for timestamps  
3. **Boolean Values**: Stored as 0/1 integers
4. **JSON Fields**: Settings values stored as JSON strings
5. **Foreign Keys**: Maintained through application logic
6. **Export Format**: SQL script (.sql) instead of binary (.db) for better compatibility

இந்த guide-ஐ பயன்படுத்தி SQLite3 tools-ல் MoiBook database-ஐ analyze செய்யலாம்!