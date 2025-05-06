const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./f1races.db', (err) => {
    
    // Execute multiple ALTER TABLE statements in sequence
    db.serialize(() => {
        db.run(`ALTER TABLE races ADD COLUMN datetime_fp1 INTEGER`, (err) => {
            if (err) console.error('Error adding datetime_fp1:', err.message);
        });
        
        db.run(`ALTER TABLE races ADD COLUMN datetime_fp2 INTEGER`, (err) => {
            if (err) console.error('Error adding datetime_fp2:', err.message);
        });
        
        db.run(`ALTER TABLE races ADD COLUMN datetime_fp3 INTEGER`, (err) => {
            if (err) console.error('Error adding datetime_fp3:', err.message);
        });
        
        db.run(`ALTER TABLE races ADD COLUMN datetime_sprint INTEGER`, (err) => {
            if (err) console.error('Error adding datetime_sprint:', err.message);
        });
        
        db.run(`ALTER TABLE races ADD COLUMN datetime_qualifying INTEGER`, (err) => {
            if (err) console.error('Error adding datetime_qualifying:', err.message);
        });
        
        db.run(`ALTER TABLE races ADD COLUMN datetime_race INTEGER`, (err) => {
            if (err) console.error('Error adding datetime_race:', err.message);
        });
        
        db.run(`UPDATE races SET datetime_race = datetime`, (err) => {
            if (err) {
                console.error('Error updating datetime_race:', err.message);
            } else {
                console.log('Table altered successfully');
            }
        });
    });
});