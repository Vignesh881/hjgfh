# Cloud Sync Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Get Cloud Database URL
```
PlanetScale: https://planetscale.com → Create DB → Copy connection URL
Railway: https://railway.app → Add MySQL → Copy connection info
```

### Step 2: Deploy Cloud API
```bash
# Clone cloud-sync-api.js or use your own Express server
# Set environment variables:
CLOUD_MYSQL_HOST=your-host
CLOUD_MYSQL_USER=your-user
CLOUD_MYSQL_PASSWORD=your-password
CLOUD_MYSQL_DB=moibook_cloud

# Deploy to Heroku/Railway
# Get API URL: https://your-app.herokuapp.com/api
```

### Step 3: Configure in MoiBook
```
1. Open MoiBook
2. Go to Settings (⚙️)
3. Find "☁️ Cloud Sync Config"
4. Paste cloud API URL
5. Click "Test Cloud"
6. Click "Enable Cloud Sync"
```

### Done! 🎉
Your events now sync across all devices.

---

## 📋 What Gets Synced?

✅ Events (event_name, date, venue, organizer)  
✅ Moi Entries (contributors, amounts, towns)  
✅ Registrars (staff names, designations)  
✅ Settings (configurations, printer assignments)  

---

## 🔄 How to Use

### Create & Sync Event
```
1. Create event in MoiBook
2. Add moi entries
3. Event auto-syncs to cloud (if enabled)
4. Other devices see event immediately
```

### Access Event on Another Device
```
1. Open MoiBook on Laptop B
2. Go to Event Page
3. See ☁️ Cloud Events section
4. Click cloud event
5. Download all event data
6. Work offline - syncs when online
```

### Upload to Cloud
```
1. Complete event entry
2. Click "Upload to Cloud"
3. Event sent to cloud database
4. Other devices get notification
5. Can rollback if needed
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Cloud won't connect | Check internet, verify API URL, test cloud endpoint |
| Events not syncing | Enable cloud sync, check cloud status, verify API running |
| Data not downloading | Check event exists in cloud, verify database connection |
| Slow sync | Check internet speed, cloud server load, database performance |

---

## 🛠️ Admin Tasks

### Monitor Cloud Sync
```
1. Settings → Cloud Sync Config
2. Click "Test Cloud" monthly
3. Check cloud server logs
4. Monitor database size
```

### Backup Cloud Database
```bash
# PlanetScale: Use backup feature
# Railway: Use automated backups
# Manual: mysqldump to local backup
```

### Troubleshoot Issues
```bash
# Check cloud API logs
# Verify database connection
# Test API endpoints with curl/Postman
# Review cloud server uptime
```

---

## 📊 Cloud Sync Status

- **Blue ⚪** - Not configured
- **Yellow 🟡** - Testing connection
- **Green ✅** - Connected & syncing
- **Red ❌** - Connection failed

---

## 🚀 Performance Tips

1. **Enable cloud sync after events are loaded** (saves bandwidth)
2. **Batch upload events** (faster than individual sync)
3. **Archive old events** in cloud (keep database lean)
4. **Monitor cloud database size** (typically < 100MB for most events)
5. **Use local backup** as fallback

---

## 🔐 Security Reminders

- ✅ Use HTTPS for cloud API
- ✅ Set strong API authentication token
- ✅ Encrypt passwords in .env
- ✅ Don't share cloud credentials
- ✅ Rotate API tokens regularly
- ✅ Monitor cloud access logs

---

## 📱 Multi-Device Example

### Event Workflow:
```
Laptop A (Event Organizer):
1. Create "விவாகம்" event
2. Add 150 guests
3. Cloud sync enabled
4. Upload to cloud

Laptop B (Co-Organizer):
1. Opens MoiBook
2. Sees "விவாகம்" from cloud ☁️
3. Downloads event data
4. Adds 50 more guests
5. Uploads back to cloud

Laptop A (Organizer):
1. Refreshes event list
2. Sees updated guest list
3. All devices in sync! 🎉
```

---

## 💡 Tips & Tricks

- **Cloud as Backup:** Treat cloud as automatic backup
- **Offline First:** Create/edit locally, sync when online
- **Share Events:** Team members see events via cloud
- **Archive:** Move completed events to cloud archive
- **Analytics:** Pull reports from cloud database

---

## 🆘 Get Help

**Documentation:**
- [MYSQL_CLOUD_SYNC_SETUP.md](./MYSQL_CLOUD_SYNC_SETUP.md) - Full setup guide
- [CLOUD_SYNC_IMPLEMENTATION.md](./CLOUD_SYNC_IMPLEMENTATION.md) - Technical details

**Support:**
- Check terminal logs for errors
- Verify API server is running
- Test cloud connection in Settings
- Review cloud database logs

---

**Last Updated:** January 13, 2026  
**Version:** 1.0 - Cloud Sync Implementation Complete

---

## 🔁 Manual sync tool (prototype)

You can run a simple Node script to push unsynced local `moi_entries` to the central API (`/api/sync/import`). Example:

```powershell
# From project root
set CENTRAL_URL="https://your-central-host:3001/api/sync/import"
set MYSQL_HOST=localhost
set MYSQL_USER=root
set MYSQL_PASSWORD=
set MYSQL_DATABASE=moibook2025
node tools/sync-to-central.js
```

Notes:
- The script will assign `uuid` to local rows if missing.
- It marks rows `synced=1` and stores `remote_id` after successful upload.
- Use `BATCH_SIZE` env var to control batch size.

