# MoiBook2025 MariaDB Server Setup

1. Open a terminal and go to the server folder:
   cd "c:\Users\NEW\moibook2025 (2)\server"

2. Install dependencies:
   npm install

3. Edit server.js and set your MariaDB username/password if needed.

4. Start the API server:
   node server.js

5. The API will run at http://localhost:3001/api/

6. In your React app, set the API base URL to http://localhost:3001/api/

7. Now your MoiBook2025 React app can use centralized MariaDB via REST API.

---

**MariaDB Table Structure Example:**

CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_name VARCHAR(255),
  event_date DATE,
  location VARCHAR(255)
);

CREATE TABLE moi_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT,
  table_no INT,
  name VARCHAR(255),
  amount INT
);

CREATE TABLE registrars (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  designation VARCHAR(50)
);

CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key_name VARCHAR(255),
  value TEXT
);

---

**You can add more fields as needed for your app.**
