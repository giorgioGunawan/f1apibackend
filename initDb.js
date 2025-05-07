const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Check if database file already exists
const dbExists = fs.existsSync('./f1races.db');

// Create a new database or open existing
const db = new sqlite3.Database('./f1races.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Create tables and insert sample data only if the database is new
if (!dbExists) {
  // Run database initialization
  db.serialize(() => {
    // Create races table with all session time fields
    db.run(`CREATE TABLE races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      datetime INTEGER NOT NULL,
      datetime_fp1 INTEGER,
      datetime_fp2 INTEGER,
      datetime_fp3 INTEGER,
      datetime_sprint INTEGER,
      datetime_qualifying INTEGER,
      datetime_race INTEGER NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating races table:', err.message);
        return;
      }
      console.log('Races table created successfully');

      // Insert sample data with session times
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 24 * 60 * 60; // seconds in a day
      
      // Sample race 1 - Past race
      const pastRace = now - (7 * oneDay); // 7 days ago
      db.run(`INSERT INTO races (
        name, 
        location, 
        datetime, 
        datetime_fp1, 
        datetime_fp2, 
        datetime_fp3, 
        datetime_qualifying, 
        datetime_race
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Monaco Grand Prix', 
        'Monte Carlo, Monaco', 
        pastRace,
        pastRace - (3 * oneDay), // FP1: 3 days before race
        pastRace - (3 * oneDay) + (4 * 3600), // FP2: 4 hours after FP1
        pastRace - (2 * oneDay), // FP3: 2 days before race
        pastRace - (1 * oneDay), // Qualifying: 1 day before race
        pastRace // Race day
      ], (err) => {
        if (err) {
          console.error('Error inserting past race:', err.message);
        } else {
          console.log('Past race inserted successfully');
        }
      });
      
      // Sample race 2 - Upcoming race (sprint weekend)
      const upcomingRace = now + (14 * oneDay); // 14 days in future
      db.run(`INSERT INTO races (
        name, 
        location, 
        datetime, 
        datetime_fp1, 
        datetime_fp2, 
        datetime_sprint, 
        datetime_qualifying, 
        datetime_race
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'British Grand Prix', 
        'Silverstone, United Kingdom', 
        upcomingRace,
        upcomingRace - (3 * oneDay), // FP1: 3 days before race
        upcomingRace - (2 * oneDay), // FP2: 2 days before race
        upcomingRace - (1 * oneDay) + (5 * 3600), // Sprint: 5 hours after qualifying
        upcomingRace - (1 * oneDay), // Qualifying: 1 day before race
        upcomingRace // Race day
      ], (err) => {
        if (err) {
          console.error('Error inserting upcoming race:', err.message);
        } else {
          console.log('Upcoming race inserted successfully');
        }
      });
      
      // Sample race 3 - Future race (standard weekend)
      const futureRace = now + (30 * oneDay); // 30 days in future
      db.run(`INSERT INTO races (
        name, 
        location, 
        datetime, 
        datetime_fp1, 
        datetime_fp2, 
        datetime_fp3, 
        datetime_qualifying, 
        datetime_race
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Hungarian Grand Prix', 
        'Budapest, Hungary', 
        futureRace,
        futureRace - (3 * oneDay), // FP1: 3 days before race
        futureRace - (3 * oneDay) + (4 * 3600), // FP2: 4 hours after FP1
        futureRace - (2 * oneDay), // FP3: 2 days before race
        futureRace - (1 * oneDay), // Qualifying: 1 day before race
        futureRace // Race day
      ], (err) => {
        if (err) {
          console.error('Error inserting future race:', err.message);
        } else {
          console.log('Future race inserted successfully');
        }
      });
    });
  });

  console.log('Database initialization completed');
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