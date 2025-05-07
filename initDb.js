const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Check if database file already exists
const dbExists = fs.existsSync('./data/f1races.db');

// Create a new database or open existing
const db = new sqlite3.Database('./data/f1races.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Create tables and insert sample data only if the database is new
if (!dbExists) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS races (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          round INTEGER NOT NULL,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          datetime_fp1 INTEGER,
          datetime_fp2 INTEGER,
          datetime_fp3 INTEGER,
          datetime_sprint INTEGER,
          datetime_qualifying INTEGER,
          datetime_race INTEGER,
          first_place TEXT,
          second_place TEXT,
          third_place TEXT
        )`);
      
        db.run(`CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          race_id INTEGER NOT NULL,
          session_type TEXT NOT NULL, -- e.g. 'fp1', 'qualifying', 'race'
          position INTEGER NOT NULL, -- from 1 to 20
          driver_name TEXT,
          team_name TEXT,
          time TEXT,
          laps INTEGER,
          points INTEGER,
          FOREIGN KEY(race_id) REFERENCES races(id)
        )`);
      
        db.run(`CREATE TABLE IF NOT EXISTS driver_standings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          driver_name TEXT NOT NULL,
          team_name TEXT,
          points INTEGER DEFAULT 0
        )`);
      
        db.run(`CREATE TABLE IF NOT EXISTS constructor_standings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          constructor_name TEXT NOT NULL,
          points INTEGER DEFAULT 0
        )`);
      
        db.run(`CREATE TABLE IF NOT EXISTS live_race (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          driver_name TEXT,
          team_name TEXT,
          car_number INTEGER,
          position INTEGER,
          time_behind TEXT,
          current_lap INTEGER,
          is_dnf BOOLEAN DEFAULT 0
        )`);
      
        console.log('All tables created successfully.');
      });
} else {
  console.log('Database already exists, skipping initialization');
}

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed');
  }
}); 