# 📱 Android Mobile-ஐ Web Server-ஆக பயன்படுத்துதல்

## 🎯 Overview
Desktop/Laptop இல்லாமல், **Android mobile-ஐ server-ஆக** பயன்படுத்தி, அதே WiFi-ல் உள்ள **tablets-ல் MoiBook2025** access செய்யலாம்!

---

## ✅ முறை 1: Termux + Node.js (Full Features - Recommended)

### 📋 Requirements
- Android 7.0+ smartphone (4GB+ RAM recommended)
- Play Store or F-Droid access
- Sufficient storage space (~500MB)
- WiFi hotspot capability

### 🔧 Step 1: Install Termux
1. **Download Termux:**
   - Play Store: Search "Termux"
   - Or F-Droid: https://f-droid.org/packages/com.termux/
   
2. **Open Termux app**

### 🔧 Step 2: Setup Termux Environment
```bash
# Update package lists
pkg update -y

# Upgrade packages
pkg upgrade -y

# Install Node.js and npm
pkg install nodejs -y

# Install Git (for cloning repository)
pkg install git -y

# Verify installation
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

### 🔧 Step 3: Grant Storage Access
```bash
# Allow Termux to access storage
termux-setup-storage
```
When prompted, click "Allow" to grant storage permission.

### 🔧 Step 4: Copy MoiBook2025 to Android
You have 3 options:

#### **Option A: USB Transfer (Easiest)**
1. Connect Android to PC via USB
2. Copy `MoiBook2025_Portable` folder to Android's `Download` folder
3. In Termux:
```bash
cd /storage/emulated/0/Download/MoiBook2025_Portable
```

#### **Option B: Git Clone (If you have GitHub)**
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/moibook2025.git
cd moibook2025
```

#### **Option C: Cloud Storage (Google Drive, etc.)**
1. Upload folder to Google Drive
2. Download to Android
3. Navigate in Termux as in Option A

### 🔧 Step 5: Install Dependencies
```bash
# Navigate to project folder
cd /storage/emulated/0/Download/MoiBook2025_Portable

# Install dependencies
npm install

# OR if using source code:
# cd /storage/emulated/0/Download/moibook2025
# npm install
```

### 🔧 Step 6: Enable WiFi Hotspot
1. **Enable Hotspot on Android:**
   - Settings → Network & Internet → Hotspot & Tethering
   - Enable "WiFi Hotspot"
   - **Note the Hotspot Name and Password**

2. **Find Mobile's IP Address:**
```bash
# In Termux, run:
ip addr show wlan0 | grep inet

# Example output:
# inet 192.168.43.1/24
# Your IP is: 192.168.43.1
```

### 🔧 Step 7: Start MoiBook Server
```bash
# For production build:
npm start

# OR for development:
npm run start:dev

# Server will start on port 3000
```

You should see:
```
Compiled successfully!
You can now view moibook2025 in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://192.168.43.1:3000
```

### 🔧 Step 8: Connect Tablets
1. **Connect tablets to mobile hotspot:**
   - Settings → WiFi → Select your mobile hotspot
   - Enter password

2. **Open browser on tablets:**
   - Chrome, Firefox, or Safari
   - Visit: `http://192.168.43.1:3000`
   - **Replace `192.168.43.1` with YOUR mobile's IP**

3. **Bookmark the URL** for quick access

### 🔧 Step 9: Keep Server Running
To prevent Termux from closing:

1. **Enable Wake Lock:**
```bash
termux-wake-lock
```

2. **Run in Background:**
   - Press Android Home button (app keeps running)
   - Or use `tmux` for persistent session:
```bash
# Install tmux
pkg install tmux -y

# Start tmux session
tmux new -s moibook

# Start server
npm start

# Detach: Press Ctrl+B then D
# Reattach: tmux attach -t moibook
```

3. **Disable Battery Optimization:**
   - Settings → Apps → Termux → Battery → Unrestricted

---

## ✅ முறை 2: HTTP Server (Simple - Pre-built Only)

### When to Use
- Only for **production build** (already built app)
- Simpler setup, but no development features
- Uses less battery

### 🔧 Setup Steps
```bash
# Install Termux (same as Method 1)
pkg update -y
pkg install nodejs -y
termux-setup-storage

# Navigate to build folder
cd /storage/emulated/0/Download/MoiBook2025_Portable/build

# Install http-server globally
npm install -g http-server

# Start server
http-server -p 3000

# Or use Python (if installed):
python -m http.server 3000
```

Access from tablets: `http://192.168.43.1:3000`

---

## ✅ முறை 3: KSWEB App (GUI-based - Easiest)

### When to Use
- If you prefer **GUI instead of terminal**
- Only for production build
- Very easy setup for non-technical users

### 🔧 Setup Steps
1. **Install KSWEB:**
   - Play Store: Search "KSWEB - server + PHP + MySQL"
   - Free version is sufficient

2. **Configure KSWEB:**
   - Open app
   - Go to Settings → Lighttpd
   - Set Document Root: `/storage/emulated/0/Download/MoiBook2025_Portable/build`
   - Set Port: `3000`
   - Start Server

3. **Enable Hotspot & Connect:**
   - Same as Method 1
   - Access: `http://192.168.43.1:3000`

---

## 📊 Comparison Table

| Feature | Termux+Node.js | HTTP Server | KSWEB |
|---------|---------------|-------------|-------|
| **Setup Difficulty** | Medium | Easy | Very Easy |
| **Development Mode** | ✅ Yes | ❌ No | ❌ No |
| **Production Build** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Battery Usage** | High | Medium | Low |
| **Customization** | High | Medium | Low |
| **GUI Interface** | ❌ No | ❌ No | ✅ Yes |
| **File Upload Support** | ✅ Yes | ⚠️ Limited | ✅ Yes |

---

## 🔥 Performance Optimization

### 1. Battery Saving Tips
```bash
# Use production build (lighter than dev)
npm run build
cd build
http-server -p 3000

# Reduce screen brightness
# Enable battery saver mode (Settings)
```

### 2. RAM Optimization
- Close unnecessary apps
- Use tablets with 2GB+ RAM
- Clear browser cache regularly

### 3. Network Optimization
- Use 5GHz WiFi hotspot (if supported)
- Keep tablets close to mobile (<10 meters)
- Limit to 5-10 tablets max

---

## 🐛 Troubleshooting

### Issue 1: Cannot access from tablets
**Solution:**
```bash
# Check if server is running
# In Termux:
netstat -tuln | grep 3000

# Check firewall (if any)
# Ensure hotspot is ON
# Try different port:
npm start -- --port 8080
```

### Issue 2: Server stops when screen locks
**Solution:**
```bash
# Enable wake lock
termux-wake-lock

# Disable Doze mode for Termux
# Settings → Apps → Termux → Battery → Unrestricted
```

### Issue 3: Tablets cannot connect to hotspot
**Solution:**
- Restart mobile hotspot
- Forget and reconnect WiFi on tablets
- Check hotspot password
- Try disabling 5GHz (use 2.4GHz only)

### Issue 4: Slow performance
**Solution:**
- Use production build instead of dev mode
- Reduce number of connected tablets
- Clear browser cache on tablets
- Restart Termux app

### Issue 5: Data not syncing between tablets
**Solution:**
- This setup uses **localStorage** (per-device storage)
- For shared data, enable **PlanetScale** cloud sync:
  - Settings → Database → PlanetScale MySQL
  - Enter credentials
  - Enable cloud sync

---

## 📱 Mobile as Server - Complete Workflow

### Event Day Setup (15 minutes)

**Morning - Before Event:**
```bash
# 1. Charge mobile to 100%
# 2. Open Termux
pkg update
cd /storage/emulated/0/Download/MoiBook2025_Portable

# 3. Start server
npm start

# 4. Enable hotspot
# Settings → Hotspot → ON

# 5. Note your IP
ip addr show wlan0 | grep inet
# Example: 192.168.43.1
```

**At Event Location:**
```
1. Keep mobile plugged into charger
2. Connect tablets to hotspot
3. Open browser: http://192.168.43.1:3000
4. Login and start recording
```

**After Event:**
```bash
# Stop server: Ctrl+C in Termux
# Export data from any tablet
# Disable hotspot to save battery
```

---

## 🔐 Security Considerations

### 1. Hotspot Password
- Use **strong password** (8+ characters)
- Change after each event
- Don't share with guests

### 2. Local Network Only
- Server is **NOT accessible from internet**
- Only devices on your hotspot can access
- Safe for sensitive moi data

### 3. Data Backup
```bash
# Export data regularly
# From browser → Settings → Export Database
# Copy to cloud storage (Google Drive)
```

---

## 🚀 Advanced: Multiple Registrars

### Scenario: 5 tablets, 5 registrars

**Mobile Setup:**
```bash
# Start server on mobile
npm start
# Server at: http://192.168.43.1:3000
```

**Tablet Assignment:**
| Tablet | Registrar | Table | URL |
|--------|-----------|-------|-----|
| Tab 1 | அருள் | T1 | http://192.168.43.1:3000 |
| Tab 2 | குமார் | T2 | http://192.168.43.1:3000 |
| Tab 3 | செல்வி | T3 | http://192.168.43.1:3000 |
| Tab 4 | முருகன் | T4 | http://192.168.43.1:3000 |
| Tab 5 | லட்சுமி | T5 | http://192.168.43.1:3000 |

**Data Sync:**
- Use **PlanetScale cloud sync** for real-time data sharing
- Or collect data from each tablet at end of day

---

## 💡 Pro Tips

### 1. Faster Setup
```bash
# Create startup script
nano ~/start-moibook.sh

# Add these lines:
#!/bin/bash
cd /storage/emulated/0/Download/MoiBook2025_Portable
termux-wake-lock
npm start

# Make executable:
chmod +x ~/start-moibook.sh

# Run with single command:
~/start-moibook.sh
```

### 2. Auto-start on Boot (Requires Termux:Boot)
```bash
# Install Termux:Boot from F-Droid
# Create boot script:
mkdir -p ~/.termux/boot
nano ~/.termux/boot/start-moibook.sh

# Add:
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
cd /storage/emulated/0/Download/MoiBook2025_Portable
npm start
```

### 3. Monitor Connected Devices
```bash
# Install arp-scan
pkg install arp-scan -y

# Check connected tablets
arp-scan --interface=wlan0 --localnet
```

### 4. Remote Access (Advanced)
If you need internet access:
```bash
# Install ngrok (from previous guide)
# Or use Cloudflare Tunnel
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```

---

## 📞 Support Commands

### Check Server Status
```bash
# Is server running?
ps aux | grep node

# Which port?
netstat -tuln | grep LISTEN

# View logs:
npm start 2>&1 | tee server.log
```

### Restart Server
```bash
# Stop: Ctrl+C
# Start again:
npm start
```

### Update App
```bash
# Copy new build from PC
# Or pull from Git:
git pull origin main
npm install
npm run build
```

---

## 🎉 Success Checklist

- [ ] Termux installed and updated
- [ ] Node.js installed (v18+)
- [ ] MoiBook copied to Android
- [ ] Dependencies installed (`npm install`)
- [ ] Hotspot enabled
- [ ] Server running (`npm start`)
- [ ] IP address noted (e.g., 192.168.43.1)
- [ ] Tablets connected to hotspot
- [ ] Browser opened on tablets (http://IP:3000)
- [ ] Wake lock enabled (`termux-wake-lock`)
- [ ] Mobile on charger
- [ ] Data backup plan ready

---

## 🆘 Emergency Backup Plan

If mobile server fails during event:

1. **Switch to Tablet-Only Mode:**
   - Use largest tablet as master
   - Others as clients (enter manually later)

2. **Paper Backup:**
   - Keep paper + pen ready
   - Digitize after event

3. **Mobile Data Fallback:**
   - Enable mobile data
   - Use ngrok for internet access
   - Tablets connect via 4G/5G

---

## 📚 Quick Reference Card

```
┌──────────────────────────────────────────┐
│   MoiBook2025 Mobile Server Commands    │
├──────────────────────────────────────────┤
│ Start Server:     npm start             │
│ Stop Server:      Ctrl+C                │
│ Wake Lock:        termux-wake-lock      │
│ Check IP:         ip addr show wlan0    │
│ View Logs:        npm start | tee log   │
│ Update:           git pull; npm install │
│ Backup:           Export from Settings  │
└──────────────────────────────────────────┘

Access URL: http://192.168.43.1:3000
(Replace IP with your hotspot IP)
```

---

## ✅ நன்மைகள் (Advantages)

1. ✅ **No laptop needed** - Mobile போதும்!
2. ✅ **Portable** - Pocket-ல் வைத்து கொண்டு போகலாம்
3. ✅ **Cost-effective** - Extra device தேவையில்லை
4. ✅ **WiFi hotspot** - Built-in connectivity
5. ✅ **Battery backup** - Power bank உடன் நீண்ட நேரம் run ஆகும்
6. ✅ **Easy setup** - 15 minutes-ல் ready!
7. ✅ **Multiple tablets** - 10+ devices support
8. ✅ **Offline-first** - Internet தேவையில்லை

## ⚠️ குறைபாடுகள் (Limitations)

1. ⚠️ **Battery drain** - Mobile-ஐ charger-ல் வைக்க வேண்டும்
2. ⚠️ **Performance** - Laptop-விட சற்று slow ஆக இருக்கும்
3. ⚠️ **Screen size** - Server monitor செய்ய கடினம்
4. ⚠️ **Overheating** - நீண்ட நேரம் run செய்தால் heat ஆகும்
5. ⚠️ **Connection limit** - Max 10-15 tablets மட்டுமே

---

**இந்த முறையில், உங்கள் Android mobile-ஐயே web server-ஆக பயன்படுத்தி, event location-ல் laptop/desktop இல்லாமலேயே MoiBook2025-ஐ இயக்கலாம்! 🚀📱**
