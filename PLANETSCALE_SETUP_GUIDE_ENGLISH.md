# PlanetScale Account Setup - MoiBook2025

## 📋 Overview
PlanetScale is a MySQL-compatible cloud database service that will serve as the cloud database for the MoiBook2025 application.

## 🚀 Creating PlanetScale Account

### Step 1: Visit PlanetScale Website
```
https://planetscale.com
```

### Step 2: Account Creation
1. Click **Sign Up** button
2. Enter your email address
3. Click the confirmation link in your email
4. Set up your password

### Step 3: Choose Plan
- Select **Free Plan** (sufficient for getting started)
- Can upgrade to paid plans later if needed

## 🗄️ Database Creation

### Step 1: Access Dashboard
Go to your PlanetScale dashboard

### Step 2: Create New Database
1. Click **"Create Database"** button
2. Enter database name:
   ```
   moibook2025_db
   ```
3. Select **Region** (closest to your users)
4. Click **Create Database**

### Step 3: Wait for Database Ready
- Database creation takes a few moments
- Wait until status shows "Ready"

## 🔑 Getting Connection Credentials

### Step 1: Access Connection Details
1. Go to your created database
2. Click **"Connect"** tab
3. Select **"Connect with Application"**

### Step 2: Copy Credentials
Copy the following information:

```bash
# Database Host
your-database-host.psdb.cloud

# Username
your-username

# Password
your-password

# Database Name
moibook2025_db
```

## ⚙️ MoiBook2025 Application Configuration

### Step 1: Environment Variables Setup
Add the following lines to `server/.env` file:

```env
MYSQL_HOST=your-database-host.psdb.cloud
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=moibook2025_db
MYSQL_PORT=3306
```

### Step 2: SSL Certificate Setup
PlanetScale requires SSL certificates. To get them:

1. Go to PlanetScale dashboard
2. **"Connect"** tab → **"Connect with Application"**
3. Select **"SSL"** section
4. Download SSL certificates

### Step 3: SSL Configuration
Add SSL information to `server/.env` file:

```env
MYSQL_SSL_CA=/path/to/ca.pem
MYSQL_SSL_CERT=/path/to/client-cert.pem
MYSQL_SSL_KEY=/path/to/client-key.pem
```

## 📊 Database Migration

### Step 1: Create Database Schema
Go to PlanetScale dashboard:

1. Click **"Console"** tab
2. Execute SQL commands from `database/mysql_schema.sql` file one by one

### Step 2: Data Migration
To migrate your local data to PlanetScale:

```bash
# Export local data
mysqldump -u root -p moibook_db > backup.sql

# Import to PlanetScale
mysql --host=your-host --user=your-user --password=your-password moibook2025_db < backup.sql
```

## 🔄 Application Configuration Update

### Step 1: Update databaseManager.js
Set PlanetScale URL in `src/lib/databaseManager.js`:

```javascript
_getCloudConnectionUrl() {
    return 'https://your-planetscale-api-endpoint';
}
```

### Step 2: Enable Cloud Sync
```javascript
// After setting PlanetScale URL
databaseManager.enableCloudSync('https://your-planetscale-api-endpoint');
```

## 🧪 Testing

### Step 1: Start Server
```bash
npm run server
```

### Step 2: Test Application
```bash
npm start
```

### Step 3: Test Data Sync
- Enter new data
- Check if data appears in PlanetScale dashboard

## 🔒 Security Notes

1. **Password Security**: Use strong passwords
2. **API Keys**: Keep PlanetScale API keys secure
3. **SSL**: Always use SSL connections
4. **Backup**: Regularly backup important data

## 💰 Costs

- **Free Plan**: 1GB storage per month, 1000 database connections
- **Scaler Plan**: Starts at $29/month for higher needs
- **Enterprise**: For large-scale requirements

## 🆘 Need Help?

- PlanetScale Documentation: https://docs.planetscale.com
- Support: support@planetscale.com
- MoiBook2025 Issues: Open issue in GitHub repository

---

**Note**: Once this setup is complete, your application will run in the cloud and be accessible from anywhere!</content>
<parameter name="filePath">c:\Users\NEW\moibook2025 (2)\PLANETSCALE_SETUP_GUIDE_ENGLISH.md