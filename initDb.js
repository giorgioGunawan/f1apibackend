const sqlite3 = require('sqlite3').verbose();

// Create a new database
const db = new sqlite3.Database('./f1races.db', (err) => {
  if (err) {
    console.error('Error creating database:', err.message);
    return;
  }
  console.log('Created new database');
  
  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    datetime TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating races table:', err.message);
      return;
    }
    console.log('Created races table');
    
    // Seed initial data
    const initialRaces = [
      {
        name: "Miami Grand Prix",
        location: "Miami",
        datetime: "1746385200"
      },
      {
        name: "Bahrain Grand Prix",
        location: "Sakhir",
        datetime: "2025-03-23"
      }
    ];
    
    // Insert initial data
    const stmt = db.prepare('INSERT INTO races (name, location, datetime) VALUES (?, ?, ?)');
    initialRaces.forEach(race => {
      stmt.run(race.name, race.location, race.datetime);
    });
    stmt.finalize();
    
    console.log('Database seeded with initial race data');
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        return;
      }
      console.log('Database initialization complete');
    });
  });
}); 