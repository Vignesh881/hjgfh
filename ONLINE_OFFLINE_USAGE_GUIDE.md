# 🌐 MoiBook - Online/Offline Usage Guide
# ஆன்லைன்/ஆஃப்லைன் பயன்பாட்டு வழிகாட்டி

---

## 📊 Quick Comparison / விரைவு ஒப்பீடு

| Feature | Offline (LocalStorage) | Online (PlanetScale Cloud) |
|---------|------------------------|----------------------------|
| **Internet வேண்டுமா?** | ❌ No / இல்லை | ✅ Yes / ஆம் |
| **Setup எளிமை** | ✅ மிக எளிது | ⚠️ சற்று complex |
| **வேகம்** | ✅ மிக வேகம் | ✅ நல்ல வேகம் (1-2s delay) |
| **Multiple laptops sync** | ❌ இல்லை | ✅ Real-time sync |
| **Data backup** | ⚠️ Manual export | ✅ Automatic cloud backup |
| **Same event, multiple tables** | ❌ தனித்தனி data | ✅ Shared data |
| **Duplicate entries** | ⚠️ சாத்தியம் | ❌ வராது |
| **பரிந்துரை** | சிறிய events, 1 laptop | பெரிய events, multiple laptops |

---

## 🔵 OFFLINE MODE (LocalStorage) - Default Mode

### இது என்ன?

MoiBook **தானாகவே offline mode-ல்** வேலை செய்கிறது. Browser-ன் localStorage-ல் data save ஆகும்.

```
┌─────────────────────────────────────┐
│  Your Laptop                        │
│  ┌───────────────────────────────┐  │
│  │  MoiBook Application          │  │
│  │  (Runs in Browser)            │  │
│  │                               │  │
│  │  Data Storage:                │  │
│  │  └─→ Browser localStorage     │  │
│  │      (Computer-ல் தான்)        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ❌ Internet இல்லை - No problem!   │
└─────────────────────────────────────┘
```

### எப்படி வேலை செய்கிறது?

**1️⃣ தானாக Offline Mode:**
```
✅ MoiBook start செய்தவுடன் → Offline mode active
✅ Internet connection check செய்யாது
✅ எல்லா data உங்கள் computer-ல் save
✅ மின்சாரம் போனாலும் data safe (browser cache-ல்)
```

**2️⃣ Data Storage Location:**
```
Windows:
C:\Users\[YourName]\AppData\Local\Google\Chrome\User Data\Default\Local Storage
(Browser automatically manages this)

உங்களுக்கு இது தெரிய வேண்டாம் - Browser handle செய்யும்!
```

**3️⃣ எப்படி பயன்படுத்துவது:**
```powershell
# Step 1: Start application
START_MOIBOOK_APP.bat (double click)

# Step 2: Browser opens
http://localhost:8080 → Automatically offline mode

# Step 3: Work normally
• Login
• Create events
• Add moi entries
• Generate reports

# Step 4: Data automatically saved
Every entry → Instant save to localStorage ✓
```

### நன்மைகள் (Offline Advantages):

✅ **Internet வேண்டாம்**
   - எந்த இடத்தில் வேண்டுமானாலும் வேலை செய்யலாம்
   - Data charges கவலை இல்லை
   - Network slow ஆனாலும் problem இல்லை

✅ **மிக வேகம்**
   - No server delay
   - Instant data save
   - Instant report generation

✅ **மிக எளிமை**
   - Setup வேண்டாம்
   - Configuration வேண்டாம்
   - Just start & use!

✅ **100% தனியுரிமை (Privacy)**
   - Data உங்கள் computer-ல் மட்டுமே
   - External server இல்லை
   - Internet-ல் share ஆகாது

✅ **Reliable**
   - Server down ஆகாது (no server!)
   - மின்சாரம் போனாலும் data safe
   - Browser crash ஆனாலும் data safe

### தீமைகள் (Offline Limitations):

❌ **Multiple laptops sync இல்லை**
   - Laptop A-ல் add செய்த entries
   - Laptop B-க்கு தெரியாது
   - Manual merge வேண்டும்

❌ **Automatic backup இல்லை**
   - Manual export செய்ய வேண்டும்
   - Pendrive-ல் backup எடுக்க வேண்டும்

❌ **Collaboration கடினம்**
   - Same event-ல் 2 registrars work செய்தால்
   - Data சேர்க்க manual effort வேண்டும்

### Offline Mode-ல் எப்படி பயன்படுத்துவது?

**சூழ்நிலை 1: Single Laptop Event**

```
Wedding Event:
├── 1 Laptop (Registration table)
├── 1 Registrar
└── All guests entry same laptop-ல்

Workflow:
1. START_MOIBOOK_APP.bat → Start
2. Login → Create Event "திருமணம் 2025"
3. Add all entries throughout event
4. Generate reports at end
5. Export data (Settings → Export Data)
6. Done! ✓

✅ Perfect use case for Offline Mode!
```

**சூழ்நிலை 2: Multiple Laptops - Manual Consolidation**

```
Wedding Event with 2 Registration Tables:

Table 1 Laptop (Offline):
├── Handles guests A-M (மாமன் தரப்பு)
├── Adds 150 entries
└── Exports: event_table1.json

Table 2 Laptop (Offline):
├── Handles guests N-Z (மாப்பிள்ளை தரப்பு)
├── Adds 200 entries
└── Exports: event_table2.json

Master Laptop (Consolidation):
1. Copy both JSON files
2. Settings → Import Data
3. Import event_table1.json → Adds 150 entries
4. Import event_table2.json → Adds 200 entries
5. Check for duplicates (if any)
6. Generate final report (350 entries total)
7. Done! ✓
```

**சூழ்நிலை 3: Backup Workflow**

```
Daily Backup (Recommended):
1. MoiBook → Settings
2. Export Data → event_backup_12oct.json
3. Copy to:
   • Pendrive
   • External hard disk
   • Email to yourself
   
Restore if needed:
1. Settings → Import Data
2. Select backup file
3. Data restored! ✓
```

---

## 🌐 ONLINE MODE (PlanetScale Cloud)

### இது என்ன?

Internet மூலம் cloud database-க்கு connect ஆகி, real-time sync செய்யும் mode.

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Laptop 1       │  │  Laptop 2       │  │  Laptop 3       │
│  (Table 1)      │  │  (Table 2)      │  │  (Master)       │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         │      Internet      │      Internet      │
         └───────────┬────────┴────────┬───────────┘
                     │                 │
              ┌──────▼─────────────────▼──────┐
              │   ☁️ PlanetScale Cloud DB     │
              │   (Real-time Sync)            │
              │                               │
              │   All data shared instantly!  │
              └───────────────────────────────┘
```

### எப்படி வேலை செய்கிறது?

**1️⃣ Setup (One-time):**
```
Step 1: PlanetScale Account
• https://planetscale.com → Sign up
• Create database: "moibook-db"
• Get credentials:
  - Host: aws.connect.psdb.cloud
  - Username: xxxxx
  - Password: pscale_pw_xxxxx

Step 2: Configure MoiBook
• MoiBook → Settings → Database Configuration
• Select: "PlanetScale Cloud"
• Enter credentials
• Test Connection
• Save & Enable

✅ Setup complete!
```

**2️⃣ Data Flow:**
```
Laptop 1 adds entry:
  User: "சென்னை - ₹5000"
    ↓
  MoiBook → Send to Cloud
    ↓
  PlanetScale saves (0.5s)
    ↓
  Sync to all connected laptops (1-2s)
    ↓
  Laptop 2, Laptop 3 see entry automatically! ✨
```

**3️⃣ Real-time Collaboration:**
```
Event with 2 Registration Tables:

10:00 AM - Table 1 adds:
  "கோவை - ₹3000"
  
10:00:02 AM - Table 2 sees it! ✓
  (2 seconds later)
  
10:01 AM - Table 2 adds:
  "மதுரை - ₹2000"
  
10:01:02 AM - Table 1 sees it! ✓

Both tables see total: ₹5000
No confusion, no duplicates! 🎯
```

### நன்மைகள் (Online Advantages):

✅ **Real-time Sync**
   - எல்லா laptops-உம் same data
   - 1-2 seconds delay மட்டும்
   - No manual merge!

✅ **Automatic Backup**
   - Cloud-ல் data safe
   - Laptop crash ஆனாலும் data safe
   - Anywhere access

✅ **Multiple Registrars**
   - Same event-ல் 5 பேர் work செய்யலாம்
   - No duplicate entries
   - Live totals

✅ **Scalability**
   - 1 laptop → 10 laptops easily
   - Add/remove laptops anytime
   - No limit!

✅ **Accuracy**
   - Always up-to-date data
   - Real-time reports
   - No version conflicts

### தீமைகள் (Online Limitations):

❌ **Internet வேண்டும்**
   - No internet = No work
   - Data charges apply
   - Network slow = slow app

❌ **Setup Complex**
   - PlanetScale account வேண்டும்
   - Configuration வேண்டும்
   - Technical knowledge helpful

❌ **Cost (for large usage)**
   - Free tier: 1 billion reads/month
   - After limit: charges apply
   - (But MoiBook small data - free tier போதும்!)

### Online Mode-ல் எப்படி பயன்படுத்துவது?

**சூழ்நிலை 1: Large Wedding with Multiple Tables**

```
Wedding Event - 500+ guests:

Setup:
├── 3 Registration Tables
├── 3 Laptops (Table 1, Table 2, Table 3)
├── All connected to PlanetScale
└── 1 Master laptop (Admin monitoring)

Workflow:
1. All laptops → Settings → PlanetScale enable
2. Same Event select: "திருமணம் 2025"
3. Work simultaneously:
   • Table 1: Handles மாமன் தரப்பு
   • Table 2: Handles மாப்பிள்ளை தரப்பு
   • Table 3: Handles VIP guests
4. Master laptop monitors live:
   • Real-time entry count
   • Live total amount
   • Generate interim reports
5. End of event:
   • All data already merged! ✓
   • Generate final report
   • Export if needed
   
✅ Zero manual consolidation needed!
```

**சூழ்நிலை 2: Multi-Day Event**

```
3-Day Temple Festival:

Day 1:
• Table 1 laptop active
• Adds 200 entries

Day 2:
• Table 1 + Table 2 laptops active
• Both add entries simultaneously
• Total: 550 entries

Day 3:
• Master laptop monitors
• Generates interim report
• Shares with organizers in real-time

✅ All laptops always synced!
✅ Reports always accurate!
```

---

## 🔄 HYBRID MODE - Best of Both Worlds!

### இது என்ன?

Primary-ஆக Online mode use செய்து, backup-ஆக Offline fallback வைத்திருப்பது.

### எப்படி செயல்படுத்துவது?

**Strategy:**

```
Primary: PlanetScale Cloud (Online)
├── Real-time sync
├── Multiple laptops collaboration
└── Automatic backup

Backup: Daily Export (Offline fallback)
├── Settings → Export Data (daily)
├── Save to pendrive
└── If internet fails → Import from backup
```

**Workflow:**

```
Morning (Before Event):
1. All laptops → Online mode active
2. Test internet connection ✓
3. Export yesterday's backup (safety)

During Event (Normal):
• Internet working → Online mode active
• All laptops syncing real-time ✓

During Event (Internet Failure!):
⚠️ Internet down!
↓
Switch to Offline Fallback:
1. Settings → Switch to LocalStorage
2. Continue work offline
3. Export data at end of day
4. When internet back → Import to cloud

✅ No data loss!
✅ Event continues smoothly!
```

**Auto-Fallback (Built-in):**

```
MoiBook has automatic fallback:

Normal flow:
Online mode → Working → Data syncing ✓

Internet disruption:
Online mode → Connection failed → Auto switch to offline
↓
App shows: "⚠️ Offline mode - Data will sync when internet returns"
↓
Continue work → Data saved locally
↓
Internet back → Auto sync to cloud! ✨

✅ Seamless experience!
```

---

## 🎯 எது உங்களுக்கு சரி? (Which Mode for You?)

### Offline Mode (LocalStorage) பயன்படுத்துங்கள்:

```
✅ Single laptop event
✅ Small events (100-200 guests)
✅ No internet at venue
✅ Simple setup needed
✅ Short duration event (1-2 days)
✅ One registrar only
✅ Budget event (no cloud costs)

Examples:
• கிராமத்தில் திருமணம்
• சிறிய உபநயனம்
• வீட்டு விழா
• Office event (small team)
```

### Online Mode (PlanetScale) பயன்படுத்துங்கள்:

```
✅ Multiple laptops needed
✅ Large events (500+ guests)
✅ Internet available at venue
✅ Multi-day events
✅ Multiple registrars simultaneously
✅ Real-time monitoring needed
✅ Professional event management

Examples:
• பெரிய திருமண விழா (500+ guests)
• கோயில் திருவிழா (3+ days)
• Multiple function halls
• Corporate events (multiple desks)
• Political events (multiple entry points)
```

### Hybrid Mode பயன்படுத்துங்கள்:

```
✅ Medium-large events
✅ Internet available but uncertain
✅ Want safety backup
✅ Professional setup
✅ Can't afford downtime

Examples:
• மண்டபத்தில் திருமணம் (internet uncertain)
• Beach/outdoor events (mobile hotspot)
• Rural area events (backup critical)
```

---

## 📋 Step-by-Step Usage Instructions

### OFFLINE MODE - இப்போதே Use செய்யுங்கள்!

**தேவையானது:**
- ✅ Laptop (Windows 7+)
- ✅ Chrome/Edge browser
- ✅ MoiBook installed
- ❌ Internet வேண்டாம்!

**படிகள்:**

```powershell
# 1. Start application
START_MOIBOOK_APP.bat (double click)

# 2. Browser opens automatically
http://localhost:8080

# 3. Login
Username: admin
Password: [your-password]

# 4. Create Event
Click "Create Event"
Enter:
  - Event Name: திருமணம் 2025
  - Event Date: 15-Oct-2025
  - Bride/Groom: கார்த்திக் ❤️ தீபிகா
  - Venue: லக்ஷ்மி மண்டபம்

# 5. Add Registrar
Select Event → Add Registrar
Enter:
  - Name: ராஜ்குமார்
  - Role: Registration

# 6. Start Entry
Select Registrar → Moi Entry
Add entries:
  • Name: முருகன்
  • Town: கோவை
  • Amount: ₹5000
  • Relation: மாமா
  
Save → Entry stored locally! ✓

# 7. Generate Report
After all entries → Reports
Select:
  - Summary Report (PDF)
  - Detailed Report (Excel)
  - Town-wise Report
  
Print/Save! ✓

# 8. Backup (Important!)
Settings → Export Data
Save: event_backup_12oct.json
Copy to pendrive ✓
```

**அவ்வளவு தான்! Offline mode ready! 🎉**

---

### ONLINE MODE - Setup செய்வது எப்படி?

**தேவையானது:**
- ✅ Laptop with internet
- ✅ Email account (for PlanetScale signup)
- ✅ Chrome/Edge browser
- ✅ 30 minutes setup time

**படி 1: PlanetScale Account**

```
1. Visit: https://planetscale.com
2. Click "Sign Up"
3. Enter:
   - Email: your-email@gmail.com
   - Password: (create strong password)
4. Verify email
5. Login ✓
```

**படி 2: Create Database**

```
PlanetScale Dashboard:
1. Click "New Database"
2. Name: moibook-db
3. Region: AWS Mumbai (closest to India)
4. Plan: Hobby (Free tier) ✓
5. Click "Create Database"
6. Wait 1-2 minutes → Database ready! ✓
```

**படி 3: Get Connection Details**

```
Database Dashboard:
1. Click "Connect"
2. Select "General"
3. Copy:
   Host: aws.connect.psdb.cloud
   Username: xxxxxxxxxx
   Password: pscale_pw_xxxxxxxxxx
   Database: moibook-db
   
Keep these safe! 📝
```

**படி 4: Configure MoiBook**

```
MoiBook Application:
1. Settings (⚙️ icon)
2. Database Configuration
3. Current: "LocalStorage (Offline)"
4. Switch to: "PlanetScale (Online)"
5. Enter details:
   ┌──────────────────────────────────────┐
   │ Host:     aws.connect.psdb.cloud     │
   │ Username: [your-username]            │
   │ Password: [your-password]            │
   │ Database: moibook-db                 │
   └──────────────────────────────────────┘
6. Click "Test Connection"
   → ✅ "Connection successful!"
7. Click "Save & Enable"
   → ✅ "Switched to Online mode"
```

**படி 5: Migrate Existing Data (Optional)**

```
If you have localStorage data:

1. Settings → Data Migration
2. Click "Migrate LocalStorage → Cloud"
3. Wait for progress:
   • Events: 2/2 ✓
   • Moi Entries: 150/150 ✓
   • Registrars: 3/3 ✓
4. Migration complete! ✅
5. Verify data in cloud ✓
```

**படி 6: Setup Other Laptops**

```
For Table 2, Table 3 laptops:

Each laptop:
1. Install MoiBook (same as Laptop 1)
2. Settings → Database Configuration
3. Switch to PlanetScale
4. Enter SAME connection details
   (Host, Username, Password, Database)
5. Test Connection ✓
6. Save & Enable
7. Select same Event
8. Done! All laptops synced! 🎉
```

**படி 7: Test Real-time Sync**

```
Laptop 1:
  Add entry: "Test Entry 1 - ₹1000"
  
Wait 2 seconds...

Laptop 2:
  Refresh → See "Test Entry 1"! ✓
  
Laptop 2:
  Add entry: "Test Entry 2 - ₹2000"
  
Wait 2 seconds...

Laptop 1:
  Refresh → See "Test Entry 2"! ✓
  
✅ Real-time sync working! 🚀
```

---

## 🔧 Troubleshooting / சிக்கல் தீர்வு

### Offline Mode Issues:

**Problem 1: Data lost after browser close**
```
Reason: Browser cache cleared
Solution:
  ✅ Don't clear browser cache
  ✅ Regular backup: Settings → Export Data
  ✅ Save to pendrive daily
```

**Problem 2: Can't import data**
```
Reason: Wrong file format
Solution:
  ✅ Use exported JSON file only
  ✅ File name: event_*.json
  ✅ Don't edit JSON manually
```

**Problem 3: Multiple laptops data merge difficult**
```
Reason: Duplicate entries
Solution:
  ✅ Coordinate entry ranges:
     Table 1: Guests A-M
     Table 2: Guests N-Z
  ✅ Use different registrars
  ✅ Check duplicates after import
```

### Online Mode Issues:

**Problem 1: Can't connect to PlanetScale**
```
Error: "Connection failed"

Check:
  1. Internet working? (ping google.com)
  2. Credentials correct? (copy-paste, no typo)
  3. Database active? (check PlanetScale dashboard)
  4. Firewall blocking? (temporarily disable antivirus)

Solution:
  ✅ Verify all details
  ✅ Test on planetscale.com first
  ✅ Check error message carefully
```

**Problem 2: Sync too slow**
```
Symptom: 10+ seconds delay

Reason: Slow internet
Solution:
  ✅ Check internet speed (minimum 1 Mbps)
  ✅ Use mobile hotspot if WiFi slow
  ✅ Close other apps using internet
  ✅ Consider hybrid mode (fallback to offline)
```

**Problem 3: Data not syncing between laptops**
```
Symptom: Laptop 2 doesn't see Laptop 1 entries

Check:
  1. Both using same database? ✓
  2. Both selected same event? ✓
  3. Internet working on both? ✓
  4. Manual refresh needed? (F5)

Solution:
  ✅ Ensure same connection details
  ✅ Refresh browser (F5)
  ✅ Check PlanetScale dashboard for data
```

---

## 💡 Best Practices / சிறந்த முறைகள்

### Offline Mode:

```
✅ Daily backup எடுங்கள்
   Settings → Export → Pendrive

✅ Event முடிவில் master backup
   Final data → 2 copies (pendrive + laptop)

✅ Browser cache clear செய்யாதீர்கள்
   Data loss ஆகும்!

✅ Multiple laptops use செய்தால்:
   Clear workflow வைத்திருங்கள்
   (Table 1: A-M, Table 2: N-Z)

✅ Regular test restore:
   Monthly-ஒரு முறை import test செய்யுங்கள்
```

### Online Mode:

```
✅ Connection test before event
   1 day முன்னாடியே test செய்யுங்கள்

✅ Backup credentials
   Password safe-ஆ வைத்திருங்கள்

✅ Monitor sync status
   Settings-ல் "Last Synced" பார்க்கலாம்

✅ Mobile hotspot backup வைத்திருங்கள்
   Venue WiFi fail ஆனால் switch செய்யலாம்

✅ Daily cloud backup (extra safety):
   Settings → Export from cloud
   Save to pendrive (belt & suspenders!)
```

---

## 🎯 Summary / சுருக்கம்

| Mode | Best For | Setup Time | Internet | Cost |
|------|----------|------------|----------|------|
| **Offline** | Single laptop, small events | ✅ 0 mins (ready!) | ❌ Not needed | Free |
| **Online** | Multiple laptops, large events | ⚠️ 30 mins | ✅ Required | Free (hobby tier) |
| **Hybrid** | Professional, safety-first | ⚠️ 40 mins | ⚠️ Preferred | Free |

### முடிவுரை:

```
🎯 Small event + 1 laptop = Offline (இப்போதே start!)
🎯 Large event + multiple laptops = Online (30 mins setup)
🎯 Professional + safety = Hybrid (best practice)
```

**இப்போது MoiBook எந்த situation-லும் use செய்யலாம்! 🚀**

---

**Documentation Version:** 2.0  
**Last Updated:** October 12, 2025  
**Support:** Check other guides in `docs/` folder  
**Quick Start:** Double-click `START_MOIBOOK_APP.bat` → Offline mode ready! ✅
