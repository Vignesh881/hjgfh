# MoiBook2025 Database Inspection Guide
## தரவுத்தளத்தை பார்க்கும் வழிகள்

### 1. 🖥️ **Browser Developer Tools (சுலபமான வழி)**

#### Chrome/Edge:
1. **F12** அழுத்தவும் (Developer Tools திறக்க)
2. **"Application"** tab-ஐ click செய்யவும்  
3. Left sidebar-இல் **"Local Storage"** expand செய்யவும்
4. **"http://localhost:3001"** click செய்யவும்
5. MoiBook keys தெரியும்:
   - `moibook_events` - எல்லா விழாக்கள்
   - `moibook_registrars` - பதிவாளர்கள்
   - `moibook_settings` - அமைப்புகள்  
   - `moibook_moi_entries` - மொய் பதிவுகள்
   - `moibook_*_backup_*` - காப்புப்பிரதி கோப்புகள்

#### Firefox:
1. **F12** அழுத்தவும்
2. **"Storage"** tab click செய்யவும்
3. **"Local Storage"** expand செய்யவும்
4. Domain select செய்யவும்

#### Safari:
1. **Command+Option+I** (Mac)
2. **"Storage"** tab
3. **"Local Storage"**

### 2. 👁️ **MoiBook Built-in Database Viewer**

1. Application-ஐ திறக்கவும்: http://localhost:3001
2. **Master Login** செய்யவும்
3. **Event select** செய்யவும் 
4. **"👁️ தரவுத்தளத்தை பார்க்கவும் (View Database)"** button click செய்யவும்

**Features:**
- ✅ Table-wise data viewing (Events, Registrars, Moi Entries, Settings)
- ✅ Search functionality
- ✅ Data count and statistics
- ✅ JSON format viewing for settings
- ✅ Real-time data refresh

### 3. 💻 **Browser Console Commands**

Browser-ஐ திறந்து **F12 > Console** tab-இல் இந்த commands use செய்யவும்:

```javascript
// எல்லா events பார்க்க
MoiBookDB.viewEvents()

// எல்லா registrars பார்க்க  
MoiBookDB.viewRegistrars()

// எல்லா moi entries பார்க்க
MoiBookDB.viewMoiEntries()

// Settings பார்க்க
MoiBookDB.viewSettings()

// முழு database பார்க்க
MoiBookDB.viewAll()

// Storage info பார்க்க
MoiBookDB.getStorageInfo()

// தேடல் செய்ய (example: "முருகன்")
MoiBookDB.search("முருகன்")

// Database export செய்ய
MoiBookDB.exportDB()

// Help பார்க்க
MoiBookDB.help()
```

### 4. 🔄 **Backup & Recovery Interface**

1. Master Dashboard-இல் **"🔄 காப்புப்பிரதி மற்றும் மீட்டமைப்பு"** click செய்யவும்
2. **Storage Statistics** section-இல்:
   - Total events, registrars, moi entries count
   - Storage size
   - Last backup time
3. **Data Integrity Check**:
   - Each data type validation status
   - Overall health status
4. **Available Backups**:
   - All backup files with timestamps
   - One-click restore functionality

### 5. 📊 **Data Structure Examples**

#### Event Record:
```json
{
  "id": "0001",
  "eventName": "திருமணம்",
  "date": "2025-10-09", 
  "venue": "கல்யாண மண்டபம்",
  "place": "மதுரை",
  "eventSide": "மணமகள்",
  "permission": true
}
```

#### Moi Entry Record:
```json
{
  "id": "entry_123",
  "table": "table1",
  "name": "முருகன்",
  "town": "திருநகர்",
  "amount": 500,
  "denominations": {
    "500": 1,
    "100": 0,
    "50": 0
  },
  "timestamp": "2025-10-09T10:30:00.000Z"
}
```

### 6. 🛠️ **Advanced Inspection Techniques**

#### Raw localStorage Access:
```javascript
// Get all MoiBook keys
Object.keys(localStorage).filter(key => key.startsWith('moibook_'))

// Get specific data
JSON.parse(localStorage.getItem('moibook_events'))

// Check storage usage
JSON.stringify(localStorage).length // bytes
```

#### Database Export via Console:
```javascript
// Complete export with metadata
const fullExport = {
  ...MoiBookDB.viewAll(),
  metadata: {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    browser: navigator.userAgent,
    storageInfo: MoiBookDB.getStorageInfo()
  }
};

// Download as file
const blob = new Blob([JSON.stringify(fullExport, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'moibook_debug_export.json';
a.click();
```

### 7. 🔍 **Troubleshooting Database Issues**

#### Check Data Integrity:
```javascript
// Check if all events have required fields
MoiBookDB.viewEvents().every(event => event.id && event.eventName)

// Check moi entries validation
MoiBookDB.viewMoiEntries().every(entry => entry.id && (entry.amount || entry.amount === 0))

// Find corrupted entries
MoiBookDB.viewMoiEntries().filter(entry => !entry.id)
```

#### Storage Quota Check:
```javascript
// Check available storage
navigator.storage.estimate().then(estimate => {
  console.log('Storage quota:', estimate.quota);
  console.log('Storage usage:', estimate.usage);
  console.log('Available:', estimate.quota - estimate.usage);
});
```

### 8. 📱 **Mobile Device Inspection**

#### Chrome Mobile:
1. Connect device to computer
2. Chrome > chrome://inspect
3. Inspect > Application > Local Storage

#### Safari Mobile:
1. Settings > Safari > Advanced > Web Inspector
2. Connect to Mac > Safari > Develop > Device

### 9. 🚨 **Emergency Database Recovery**

#### If Database Corrupted:
```javascript
// Clear corrupted data
MoiBookDB.clearAll("YES_DELETE_ALL")

// Then import from backup file through UI
// Or manually restore:
localStorage.setItem('moibook_events', JSON.stringify(backupData.events));
```

#### Create Manual Backup:
```javascript
// Store current data as emergency backup
const emergencyBackup = MoiBookDB.viewAll();
localStorage.setItem('emergency_backup', JSON.stringify(emergencyBackup));
```

---

**இப்போது உங்களால் MoiBook database-ஐ எல்லா வழிகளிலும் inspect செய்ய முடியும்!** 🎉

**Best Method:** Built-in Database Viewer (மிகவும் user-friendly)
**Advanced:** Browser Console Commands (developers-க்கு)
**Debug:** Developer Tools localStorage (raw data access)