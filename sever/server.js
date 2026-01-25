const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for frontend access
app.use(cors());

// Setup file upload
const storage = multer.diskStorage({
  destination: './server/uploads',
  filename: (req, file, cb) => cb(null, 'moibook.db')
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload-db', upload.single('dbfile'), (req, res) => {
  res.send('Database uploaded successfully');
});

// Read events from uploaded .db file
app.get('/events', (req, res) => {
  const dbPath = path.join(__dirname, 'uploads', 'moibook.db');
  const db = new sqlite3.Database(dbPath);

  db.all('SELECT * FROM events ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });

  db.close();
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));