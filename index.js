const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // For development only - allows any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Determine if we're running on Render with a persistent disk
const isRender = process.env.RENDER === 'true';
const renderDataDir = '/data'; // Render persistent disk mount point

// Choose the appropriate database path
let dbPath;
if (isRender && fs.existsSync(renderDataDir)) {
  dbPath = path.join(renderDataDir, 'f1races.db');
  console.log('Using Render persistent disk database at:', dbPath);
} else {
  dbPath = path.join(__dirname, 'data', 'f1races.db');
  console.log('Using local database at:', dbPath);
}

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the F1 races database');
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
  // Get the race with the earliest upcoming race datetime
  db.get('SELECT * FROM races WHERE datetime_race >= ? ORDER BY datetime_race ASC LIMIT 1', 
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
  const { 
    round,
    name, 
    location, 
    datetime_fp1, 
    datetime_fp2, 
    datetime_fp3, 
    datetime_sprint, 
    datetime_qualifying, 
    datetime_race,
    first_place,
    second_place,
    third_place
  } = req.body;
  
  if (!name || !location || !datetime_race) {
    return res.status(400).json({ error: 'Please provide name, location, and race datetime at minimum' });
  }
  
  db.run(`INSERT INTO races (
            round,
            name, 
            location, 
            datetime_fp1, 
            datetime_fp2, 
            datetime_fp3, 
            datetime_sprint, 
            datetime_qualifying, 
            datetime_race,
            first_place,
            second_place,
            third_place
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      round || null,
      name, 
      location, 
      datetime_fp1 || null, 
      datetime_fp2 || null, 
      datetime_fp3 || null, 
      datetime_sprint || null, 
      datetime_qualifying || null, 
      datetime_race,
      first_place || null,
      second_place || null,
      third_place || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        round,
        name,
        location,
        datetime_fp1,
        datetime_fp2,
        datetime_fp3,
        datetime_sprint,
        datetime_qualifying,
        datetime_race,
        first_place,
        second_place,
        third_place
      });
    });
});

// Update a race
app.put('/api/races/:id', (req, res) => {
  const { 
    round,
    name, 
    location, 
    datetime_fp1, 
    datetime_fp2, 
    datetime_fp3, 
    datetime_sprint, 
    datetime_qualifying, 
    datetime_race,
    first_place,
    second_place,
    third_place
  } = req.body;
  
  if (!name || !location || !datetime_race) {
    return res.status(400).json({ error: 'Please provide name, location, and race datetime at minimum' });
  }
  
  db.run(`UPDATE races SET 
            round = ?,
            name = ?, 
            location = ?, 
            datetime_fp1 = ?, 
            datetime_fp2 = ?, 
            datetime_fp3 = ?, 
            datetime_sprint = ?, 
            datetime_qualifying = ?, 
            datetime_race = ?,
            first_place = ?,
            second_place = ?,
            third_place = ?
          WHERE id = ?`,
    [
      round || null,
      name, 
      location, 
      datetime_fp1 || null, 
      datetime_fp2 || null, 
      datetime_fp3 || null, 
      datetime_sprint || null, 
      datetime_qualifying || null, 
      datetime_race,
      first_place || null,
      second_place || null,
      third_place || null,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Race not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        round,
        name,
        location,
        datetime_fp1,
        datetime_fp2,
        datetime_fp3,
        datetime_sprint,
        datetime_qualifying,
        datetime_race,
        first_place,
        second_place,
        third_place
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

// RESULTS TABLE ENDPOINTS
// Get all results
app.get('/api/results', (req, res) => {
  db.all('SELECT * FROM results', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get results by race_id
app.get('/api/results/race/:race_id', (req, res) => {
  db.all('SELECT * FROM results WHERE race_id = ?', [req.params.race_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get results by race_id and session_type
app.get('/api/results/race/:race_id/session/:session_type', (req, res) => {
  db.all('SELECT * FROM results WHERE race_id = ? AND session_type = ?', 
    [req.params.race_id, req.params.session_type], 
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
});

// Add a new result
app.post('/api/results', (req, res) => {
  const { 
    race_id, 
    session_type, 
    position, 
    driver_name, 
    team_name, 
    time, 
    laps, 
    points 
  } = req.body;
  
  if (!race_id || !session_type || !position || !driver_name || !team_name) {
    return res.status(400).json({ 
      error: 'Please provide race_id, session_type, position, driver_name, and team_name at minimum' 
    });
  }
  
  db.run(`INSERT INTO results (
            race_id, 
            session_type, 
            position, 
            driver_name, 
            team_name, 
            time, 
            laps, 
            points
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      race_id, 
      session_type, 
      position, 
      driver_name, 
      team_name, 
      time || null, 
      laps || null, 
      points || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        race_id,
        session_type,
        position,
        driver_name,
        team_name,
        time,
        laps,
        points
      });
    });
});

// Update a result
app.put('/api/results/:id', (req, res) => {
  const { 
    race_id, 
    session_type, 
    position, 
    driver_name, 
    team_name, 
    time, 
    laps, 
    points 
  } = req.body;
  
  if (!race_id || !session_type || !position || !driver_name || !team_name) {
    return res.status(400).json({ 
      error: 'Please provide race_id, session_type, position, driver_name, and team_name at minimum' 
    });
  }
  
  db.run(`UPDATE results SET 
            race_id = ?, 
            session_type = ?, 
            position = ?, 
            driver_name = ?, 
            team_name = ?, 
            time = ?, 
            laps = ?, 
            points = ? 
          WHERE id = ?`,
    [
      race_id, 
      session_type, 
      position, 
      driver_name, 
      team_name, 
      time || null, 
      laps || null, 
      points || null,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Result not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        race_id,
        session_type,
        position,
        driver_name,
        team_name,
        time,
        laps,
        points
      });
    });
});

// Delete a result
app.delete('/api/results/:id', (req, res) => {
  db.run('DELETE FROM results WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json({ message: 'Result deleted successfully' });
  });
});

// DRIVER STANDINGS ENDPOINTS
// Get all driver standings
app.get('/api/driver-standings', (req, res) => {
  db.all('SELECT * FROM driver_standings ORDER BY points DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get driver standing by id
app.get('/api/driver-standings/:id', (req, res) => {
  db.get('SELECT * FROM driver_standings WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Driver standing not found' });
    }
    res.json(row);
  });
});

// Add a new driver standing
app.post('/api/driver-standings', (req, res) => {
  const { driver_name, team_name, points } = req.body;
  
  if (!driver_name || !team_name || points === undefined) {
    return res.status(400).json({ error: 'Please provide driver_name, team_name, and points' });
  }
  
  db.run(`INSERT INTO driver_standings (driver_name, team_name, points) VALUES (?, ?, ?)`,
    [driver_name, team_name, points],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        driver_name,
        team_name,
        points
      });
    });
});

// Update a driver standing
app.put('/api/driver-standings/:id', (req, res) => {
  const { driver_name, team_name, points } = req.body;
  
  if (!driver_name || !team_name || points === undefined) {
    return res.status(400).json({ error: 'Please provide driver_name, team_name, and points' });
  }
  
  db.run(`UPDATE driver_standings SET driver_name = ?, team_name = ?, points = ? WHERE id = ?`,
    [driver_name, team_name, points, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Driver standing not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        driver_name,
        team_name,
        points
      });
    });
});

// Delete a driver standing
app.delete('/api/driver-standings/:id', (req, res) => {
  db.run('DELETE FROM driver_standings WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Driver standing not found' });
    }
    res.json({ message: 'Driver standing deleted successfully' });
  });
});

// CONSTRUCTOR STANDINGS ENDPOINTS
// Get all constructor standings
app.get('/api/constructor-standings', (req, res) => {
  db.all('SELECT * FROM constructor_standings ORDER BY points DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get constructor standing by id
app.get('/api/constructor-standings/:id', (req, res) => {
  db.get('SELECT * FROM constructor_standings WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Constructor standing not found' });
    }
    res.json(row);
  });
});

// Add a new constructor standing
app.post('/api/constructor-standings', (req, res) => {
  const { constructor_name, points } = req.body;
  
  if (!constructor_name || points === undefined) {
    return res.status(400).json({ error: 'Please provide constructor_name and points' });
  }
  
  db.run(`INSERT INTO constructor_standings (constructor_name, points) VALUES (?, ?)`,
    [constructor_name, points],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        constructor_name,
        points
      });
    });
});

// Update a constructor standing
app.put('/api/constructor-standings/:id', (req, res) => {
  const { constructor_name, points } = req.body;
  
  if (!constructor_name || points === undefined) {
    return res.status(400).json({ error: 'Please provide constructor_name and points' });
  }
  
  db.run(`UPDATE constructor_standings SET constructor_name = ?, points = ? WHERE id = ?`,
    [constructor_name, points, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Constructor standing not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        constructor_name,
        points
      });
    });
});

// Delete a constructor standing
app.delete('/api/constructor-standings/:id', (req, res) => {
  db.run('DELETE FROM constructor_standings WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Constructor standing not found' });
    }
    res.json({ message: 'Constructor standing deleted successfully' });
  });
});

// LIVE RACE ENDPOINTS
// Get all live race data
app.get('/api/live-race', (req, res) => {
  db.all('SELECT * FROM live_race ORDER BY position ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get live race entry by id
app.get('/api/live-race/:id', (req, res) => {
  db.get('SELECT * FROM live_race WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Live race entry not found' });
    }
    res.json(row);
  });
});

// Add a new live race entry
app.post('/api/live-race', (req, res) => {
  const { 
    driver_name, 
    team_name, 
    car_number, 
    position, 
    time_behind, 
    current_lap, 
    is_dnf 
  } = req.body;
  
  if (!driver_name || !team_name || !car_number || position === undefined) {
    return res.status(400).json({ 
      error: 'Please provide driver_name, team_name, car_number, and position at minimum' 
    });
  }
  
  db.run(`INSERT INTO live_race (
            driver_name, 
            team_name, 
            car_number, 
            position, 
            time_behind, 
            current_lap, 
            is_dnf
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      driver_name, 
      team_name, 
      car_number, 
      position, 
      time_behind || null, 
      current_lap || null, 
      is_dnf || 0
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        driver_name,
        team_name,
        car_number,
        position,
        time_behind,
        current_lap,
        is_dnf: is_dnf || 0
      });
    });
});

// Update a live race entry
app.put('/api/live-race/:id', (req, res) => {
  const { 
    driver_name, 
    team_name, 
    car_number, 
    position, 
    time_behind, 
    current_lap, 
    is_dnf 
  } = req.body;
  
  if (!driver_name || !team_name || !car_number || position === undefined) {
    return res.status(400).json({ 
      error: 'Please provide driver_name, team_name, car_number, and position at minimum' 
    });
  }
  
  db.run(`UPDATE live_race SET 
            driver_name = ?, 
            team_name = ?, 
            car_number = ?, 
            position = ?, 
            time_behind = ?, 
            current_lap = ?, 
            is_dnf = ? 
          WHERE id = ?`,
    [
      driver_name, 
      team_name, 
      car_number, 
      position, 
      time_behind || null, 
      current_lap || null, 
      is_dnf || 0,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Live race entry not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        driver_name,
        team_name,
        car_number,
        position,
        time_behind,
        current_lap,
        is_dnf: is_dnf || 0
      });
    });
});

// Delete a live race entry
app.delete('/api/live-race/:id', (req, res) => {
  db.run('DELETE FROM live_race WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Live race entry not found' });
    }
    res.json({ message: 'Live race entry deleted successfully' });
  });
});

// Clear all live race data
app.delete('/api/live-race', (req, res) => {
  db.run('DELETE FROM live_race', function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'All live race data cleared successfully' });
  });
});

// Update race with podium results
app.put('/api/races/:id/podium', (req, res) => {
  const { first_place, second_place, third_place } = req.body;
  
  if (!first_place || !second_place || !third_place) {
    return res.status(400).json({ error: 'Please provide first_place, second_place, and third_place' });
  }
  
  db.run(`UPDATE races SET first_place = ?, second_place = ?, third_place = ? WHERE id = ?`,
    [first_place, second_place, third_place, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Race not found' });
      }
      res.json({
        id: parseInt(req.params.id),
        first_place,
        second_place,
        third_place
      });
    });
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Add a route for the admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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
