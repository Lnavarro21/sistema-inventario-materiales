// Importamos la librería 'sqlite3' para interactuar con la base de datos.
// '.verbose()' activa los mensajes detallados en la consola, muy útil para ver errores.
const sqlite3 = require('sqlite3').verbose();

// Importamos 'path', una herramienta nativa de Node.js para manejar rutas de carpetas correctamente en cualquier sistema operativo.
const path = require('path');

// Creamos la conexión a la base de datos.
// 'path.resolve' busca o crea el archivo 'database.sqlite' en la carpeta anterior ('../') a donde está este código.
const db = new sqlite3.Database(path.resolve(__dirname, '../database.sqlite'), (err) => {
    // Si hay un error al intentar abrir el archivo, lo mostramos en consola.
    if (err) console.error('Error conectando a SQLite:', err.message);
    else {
        // Si no hay error, confirmamos que la conexión fue un éxito.
        console.log('✅ Base de datos SQLite conectada (Vacía y lista).');
        
        // Ejecutamos una instrucción SQL para crear la tabla de inventario SOLO si no existe aún.
        db.run(`CREATE TABLE IF NOT EXISTS materiales (
            id INTEGER PRIMARY KEY AUTOINCREMENT, -- Identificador único que sube de 1 en 1 automáticamente
            nombre TEXT NOT NULL,                 -- Nombre del material (Obligatorio)
            marca TEXT,                           -- Marca del material
            descripcion TEXT,                     -- Detalles extra
            unidad TEXT,                          -- Ej: UND, CAJA, PAQUETE
            ubicacion TEXT,                       -- Ej: Mueble o Suelto
            saldo INTEGER DEFAULT 0,              -- Cantidad en stock (Por defecto es 0)
            notas TEXT,                           -- Observaciones adicionales
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- Fecha y hora exacta en la que se registró
        )`);
    }
});

// Exportamos la variable 'db' para poder usar esta misma conexión en los Modelos.
module.exports = db;