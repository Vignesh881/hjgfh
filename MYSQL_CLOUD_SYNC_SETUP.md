# MoiBook MySQL Cloud Sync Setup Guide

## 📋 Overview
This guide explains how to set up **automatic cloud synchronization** using MySQL with MoiBook. This allows you to sync events and data across multiple devices/laptops.

## 🏗️ Architecture

```
Local MoiBook App
    ↓
Local MySQL API (Node.js + Express)
    ↓
Cloud MySQL Database (PlanetScale / Railway)
    ↓
Sync Manager
    ↓
Multiple Laptops (Automatic Sync)
```

---

## 🚀 Step 1: Set Up Cloud MySQL Database

### Option A: PlanetScale (Recommended - Free Tier)

1. **Create PlanetScale Account**
   - Go to https://planetscale.com
   - Sign up with GitHub or email
   - Create a new database

2. **Create Database**
   - Database name: `moibook_cloud`
   - Region: Choose nearest to you
   - Click "Create Database"

3. **Get Connection String**
   - In PlanetScale dashboard, click your database
   - Click "Connect"
   - Select "Node.js" driver
   - Copy the connection string:
   ```
   mysql://username:password@host/moibook_cloud?ssl={"rejectUnauthorized":true}
   ```

4. **Create Tables in Cloud**
   - Use PlanetScale CLI or MySQL client
   - Run these SQL commands:
   ```sql
   CREATE TABLE events (
       id INT AUTO_INCREMENT PRIMARY KEY,
       event_name VARCHAR(255) NULL,
       event_date DATE NULL,
       event_time VARCHAR(10) NULL,
       venue VARCHAR(255) NULL,
       place VARCHAR(255) NULL,
       event_head VARCHAR(255) NULL,
       event_organizer VARCHAR(255) NULL,
       phone VARCHAR(50) NULL,
       address TEXT NULL,
       data JSON NULL
   );

   CREATE TABLE moi_entries (
       id INT AUTO_INCREMENT PRIMARY KEY,
       event_id INT NULL,
       contributor_name VARCHAR(255) NULL,
       amount DECIMAL(12,2) DEFAULT 0,
       town VARCHAR(255) NULL,
       phone VARCHAR(50) NULL,
       note TEXT NULL,
       data JSON NULL,
       INDEX idx_event_id (event_id)
   );

   CREATE TABLE registrars (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255) NULL,
       designation VARCHAR(255) NULL,
       phone VARCHAR(50) NULL,
       address TEXT NULL,
       data JSON NULL
   );

   CREATE TABLE settings (
       id INT AUTO_INCREMENT PRIMARY KEY,
       key_name VARCHAR(255) NULL,
       value TEXT NULL,
       data JSON NULL
   );
   ```

### Option B: Railway (Alternative)

1. Go to https://railway.app
2. Create new project
3. Add MySQL database
4. Get connection credentials

---

## 📡 Step 2: Set Up Cloud Sync API Server

### Create Cloud API Endpoint

Create a new Node.js Express server (can be on Heroku, Railway, or cloud VM) that bridges local MySQL to cloud MySQL:

**cloud-sync-api.js:**
```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cloud MySQL Pool
const cloudPool = mysql.createPool({
  host: process.env.CLOUD_MYSQL_HOST,
  user: process.env.CLOUD_MYSQL_USER,
  password: process.env.CLOUD_MYSQL_PASSWORD,
  database: process.env.CLOUD_MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get all cloud events
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await cloudPool.query('SELECT * FROM events ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload event to cloud
app.post('/api/events/:eventId/upload', async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventData = req.body;
    
    const sql = `
      INSERT INTO events (id, event_name, event_date, event_time, venue, place, event_head, event_organizer, phone, address, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        event_name = VALUES(event_name),
        event_date = VALUES(event_date),
        data = VALUES(data)
    `;
    
    await cloudPool.query(sql, [
      eventId,
      eventData.eventName,
      eventData.date,
      eventData.time,
      eventData.venue,
      eventData.place,
      eventData.eventHead,
      eventData.eventOrganizer,
      eventData.phone,
      eventData.address,
      JSON.stringify(eventData)
    ]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download event data from cloud
app.get('/api/events/:eventId/download', async (req, res) => {
  try {
    const { eventId } = req.params;
    const [event] = await cloudPool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    const [entries] = await cloudPool.query('SELECT * FROM moi_entries WHERE event_id = ?', [eventId]);
    
    res.json({ event: event[0], entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3002, () => {
  console.log('Cloud Sync API running on port ' + (process.env.PORT || 3002));
});
```

**Deploy to Railway/Heroku:**
```bash
# Set environment variables
CLOUD_MYSQL_HOST=your-host
CLOUD_MYSQL_USER=your-user
CLOUD_MYSQL_PASSWORD=your-password
CLOUD_MYSQL_DB=moibook_cloud
PORT=3002
```

---

## 🎨 Step 3: Configure Cloud Sync in MoiBook UI

### In Settings Page:

1. **Go to Settings** (⚙️)
2. **Find "☁️ Cloud Sync Config" section**
3. **Enter Cloud API URL:**
   ```
   https://your-cloud-api-server.com/api
   ```
4. **Click "Test Cloud"** → Should see ✅ Cloud Connected
5. **Click "Enable Cloud Sync"** → Cloud sync activated

---

## 🔄 Step 4: Automatic Sync Behavior

### Events Creation:
```
1. Create event in MoiBook
2. Event saved to local MySQL
3. Event automatically synced to cloud
4. Other laptops download event on next login
```

### Events Synchronization:
```
1. Open MoiBook on Laptop A
2. It shows local events + cloud events (marked with ☁️)
3. Select cloud event
4. All data (moi entries, members) auto-download
5. Can work offline, will sync when online
```

### Data Upload:
```
1. Event completed
2. Click "Upload to Cloud" (in Event Dashboard)
3. All event data uploaded to cloud
4. Other laptops see event in their cloud list
```

---

## 💾 Step 5: Database Schema

### Events Table
```sql
id             - Event unique ID
event_name     - Event name (திருமண விழா)
event_date     - Event date
event_time     - Event time
venue          - மண்டபம் name
place          - இடம்
event_head     - விழா தலைவர் name
event_organizer - விழா அமைப்பாளர் name
phone          - Phone number
address        - Address
data           - JSON backup of all fields
```

### Moi_Entries Table
```sql
id               - Entry ID
event_id         - Which event
contributor_name - பெயர்
amount           - மொய் தொகை
town             - ஊர்
phone            - தொலைபேசி
note             - குறிப்பு
data             - JSON backup
```

---

## 🛠️ Step 6: MoiBook Code Integration

### DatabaseManager Cloud Functions (Already Added):

```javascript
// Initialize cloud connection
await databaseManager.initializeCloudConnection();

// Enable/disable cloud sync
databaseManager.enableCloudSync(cloudUrl);
databaseManager.disableCloudSync();

// Check if cloud is enabled
if (databaseManager.isCloudSyncEnabled()) {
  // Sync available
}

// Sync event to cloud
await databaseManager.syncEventToCloud(eventData);

// Get cloud events
const cloudEvents = await databaseManager.getCloudEvents();

// Download event from cloud
const eventData = await databaseManager.downloadEventDataFromCloud(eventId);

// Upload event to cloud
await databaseManager.uploadEventDataToCloud(eventId, eventData);
```

---

## 📱 Step 7: Multi-Device Workflow

### Laptop A:
```
1. Create event "விவாகம்" on 2026-02-14
2. Add 100 guests with moi entries
3. Event synced to cloud automatically
```

### Laptop B:
```
1. Open MoiBook
2. Settings → Cloud Sync
3. See "விவாகம்" from cloud (☁️ விவாகம்)
4. Click select → Download all data
5. Can see all 100 guests offline
6. Can add more guests
7. Click "Upload to Cloud" → Sync back
```

### Laptop A:
```
1. Refresh events list
2. See updated guest count from Laptop B
3. All devices in sync!
```

---

## 🔐 Security Considerations

1. **Use HTTPS** for cloud API
2. **Add authentication** to cloud endpoints:
   ```javascript
   const authToken = req.headers['authorization'];
   if (!authToken || authToken !== process.env.API_TOKEN) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

3. **Encrypt sensitive data** before upload
4. **Validate data** on cloud server
5. **Rate limit** API calls to prevent abuse

---

## ❌ Troubleshooting

### Cloud Not Connecting?
- ✅ Check cloud API URL is correct
- ✅ Check internet connection
- ✅ Check cloud server is running
- ✅ Check CORS enabled on cloud API

### Events Not Syncing?
- ✅ Check cloud sync is enabled
- ✅ Check "Upload to Cloud" button was clicked
- ✅ Check cloud database tables exist
- ✅ Check cloud API logs for errors

### Data Lost?
- ✅ Check local backups in localStorage
- ✅ Check cloud database for backup
- ✅ Use "Restore from Backup" in Settings

---

## 📚 Related Files

- [DatabaseManager](../src/lib/databaseManager.js) - Cloud sync functions
- [SettingsPage](../src/components/SettingsPage.jsx) - Cloud configuration UI
- [App.jsx](../src/App.jsx) - Event sync logic
- [server.js](../server/server.js) - Local MySQL API

---

## ✅ Checklist

- [ ] PlanetScale account created
- [ ] Cloud database created
- [ ] Tables created in cloud
- [ ] Cloud API server deployed
- [ ] Cloud URL configured in MoiBook
- [ ] Cloud connection tested
- [ ] Events created and synced
- [ ] Multi-device sync working

---

**Happy syncing! 🎉**

For support, check the logs in the browser console or cloud server logs.
