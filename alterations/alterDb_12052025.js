// Database alteration script - May 12, 2025
// Adds display_name column to driver_standings table

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine if we're running on Render with a persistent disk
const isRender = process.env.RENDER === 'true';
const renderDataDir = '/data'; // Render persistent disk mount point

// Choose the appropriate database path
let dbPath;
if (isRender && fs.existsSync(renderDataDir)) {
  dbPath = path.join(renderDataDir, 'f1races.db');
  console.log('Using Render persistent disk database at:', dbPath);
} else {
  dbPath = path.join(__dirname, '..', 'data', 'f1races.db');
  console.log('Using local database at:', dbPath);
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the F1 races database for alteration');
  
  // Add display_name column to driver_standings table
  db.run(`ALTER TABLE driver_standings ADD COLUMN display_name TEXT`, (err) => {
    if (err) {
      console.error('Error adding display_name column:', err.message);
    } else {
      console.log('Successfully added display_name column to driver_standings table');
    }
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  });
});
