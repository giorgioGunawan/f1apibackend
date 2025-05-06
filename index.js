const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database connection - connects to existing database
const db = new sqlite3.Database('./f1races.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    console.error('Please ensure the database file exists before starting the server.');
    process.exit(1); // Exit if database doesn't exist
  } else {
    console.log('Connected to the existing F1 races database');
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the F1 Race API');
});

app.get('/api/races', (req, res) => {
  db.all('SELECT * FROM races', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/nextrace', (req, res) => {
  // Get the race with the earliest upcoming datetime
  db.get('SELECT * FROM races WHERE datetime >= ? ORDER BY datetime ASC LIMIT 1', 
    [Math.floor(Date.now() / 1000)], // Current timestamp
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'No upcoming races found' });
      }
      res.json(row);
    });
});

app.get('/api/races/:id', (req, res) => {
  db.get('SELECT * FROM races WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json(row);
  });
});

// Add a new race
app.post('/api/races', (req, res) => {
  const { name, location, datetime } = req.body;
  if (!name || !location || !datetime) {
    return res.status(400).json({ error: 'Please provide name, location, and datetime' });
  }
  
  db.run('INSERT INTO races (name, location, datetime) VALUES (?, ?, ?)',
    [name, location, datetime],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        location,
        datetime
      });
    });
});

// Update a race
app.put('/api/races/:id', (req, res) => {
  const { name, location, datetime } = req.body;
  if (!name || !location || !datetime) {
    return res.status(400).json({ error: 'Please provide name, location, and datetime' });
  }
  
  db.run('UPDATE races SET name = ?, location = ?, datetime = ? WHERE id = ?',
    [name, location, datetime, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Race not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        name,
        location,
        datetime
      });
    });
});

// Delete a race
app.delete('/api/races/:id', (req, res) => {
  db.run('DELETE FROM races WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json({ message: 'Race deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`F1 API running on http://localhost:${PORT}`);
});

// Close database connection when app terminates
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});
