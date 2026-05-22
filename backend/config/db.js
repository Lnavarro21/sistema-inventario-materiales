const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../database.sqlite'), (err) => {
    if (err) console.error('Error conectando a SQLite:', err.message);
    else {
        console.log('✅ Base de datos SQLite conectada (Vacía y lista).');
        // Tabla profesional
        db.run(`CREATE TABLE IF NOT EXISTS materiales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            marca TEXT,
            descripcion TEXT,
            unidad TEXT,
            ubicacion TEXT,
            saldo INTEGER DEFAULT 0,
            notas TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

module.exports = db;