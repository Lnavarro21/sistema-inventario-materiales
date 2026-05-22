// ==========================================
// 1. IMPORTACIÓN DE LIBRERÍAS (Dependencias)
// ==========================================
// Carga las variables protegidas que pusimos en el archivo .env (como el PASSWORD_HASH)
require('dotenv').config(); 

// Framework principal para crear el servidor web de forma sencilla
const express = require('express'); 

// CORS permite que el frontend (tu vista) y el backend se comuniquen sin bloqueos de seguridad del navegador
const cors = require('cors'); 

// Módulo nativo de Node.js para manejar las rutas de las carpetas de forma segura en cualquier sistema operativo
const path = require('path'); 

// Librería de criptografía para comparar la contraseña que ingresa el usuario con el Hash seguro
const bcrypt = require('bcryptjs'); 

// Importamos la conexión a la base de datos SQLite que configuramos en db.js
const db = require('./config/db'); 

// ==========================================
// 2. CONFIGURACIÓN INICIAL DEL SERVIDOR
// ==========================================
// Inicializamos la aplicación de Express
const app = express(); 

// Definimos el puerto. Toma el del archivo .env, y si no existe, usa el 3000 por defecto
const PORT = process.env.PORT || 3000; 

// ==========================================
// 3. MIDDLEWARES (Los "Preparadores")
// ==========================================
// Estos comandos se ejecutan ANTES de que la petición llegue a tus rutas

app.use(cors()); // Habilita la comunicación cruzada
app.use(express.json()); // Traduce los datos que envía el frontend (en formato JSON) a objetos de JavaScript que el backend pueda entender
app.use(express.static(path.join(__dirname, '../frontend'))); // Le dice al servidor dónde están los archivos públicos (CSS, JS, imágenes) para que pueda enviarlos al navegador

// ==========================================
// 4. RUTAS DE AUTENTICACIÓN (El Guardián)
// ==========================================
// Cuando el usuario intenta iniciar sesión desde el frontend...
app.post('/api/auth/login', async (req, res) => {
    // Extraemos la contraseña que el usuario escribió en la pantalla
    const { password } = req.body; 
    
    try {
        // bcrypt.compare agarra la contraseña en texto, la encripta matemáticamente y verifica si coincide con el Hash de tu archivo .env
        const match = await bcrypt.compare(password, process.env.PASSWORD_HASH);
        
        if (match) {
            // Si la contraseña es correcta, le decimos al frontend que lo deje pasar
            res.json({ success: true, message: 'Autenticación exitosa' });
        } else {
            // Si es incorrecta, devolvemos un código 401 (No Autorizado)
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        // Si la librería falla o el archivo .env está mal, devolvemos un error 500 (Error de servidor)
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// ==========================================
// 5. RUTAS CRUD DEL INVENTARIO (Las Operaciones)
// ==========================================

// [READ] - Obtener todos los materiales
app.get('/api/materiales', (req, res) => {
    // Busca todo en la tabla 'materiales', del último ingresado al primero
    db.all("SELECT * FROM materiales ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows }); // Envía la lista al frontend
    });
});

// [CREATE] - Registrar un nuevo material
app.post('/api/materiales', (req, res) => {
    // Extraemos los datos del formulario
    const { nombre, marca, descripcion, unidad, ubicacion, saldo, notas } = req.body;
    const sql = "INSERT INTO materiales (nombre, marca, descripcion, unidad, ubicacion, saldo, notas) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    // Ejecutamos la inserción en la base de datos
    db.run(sql, [nombre, marca, descripcion, unidad, ubicacion, saldo, notas], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true }); // Confirmamos éxito
    });
});

// [UPDATE] - Modificar un material existente
app.put('/api/materiales/:id', (req, res) => {
    // Extraemos los datos actualizados del formulario
    const { nombre, marca, descripcion, unidad, ubicacion, saldo, notas } = req.body;
    // Preparamos la orden de actualizar (UPDATE) filtrando por el ID (WHERE id = ?)
    const sql = "UPDATE materiales SET nombre = ?, marca = ?, descripcion = ?, unidad = ?, ubicacion = ?, saldo = ?, notas = ? WHERE id = ?";
    
    // Ejecutamos pasándole también req.params.id (que es el ID que viene en la URL de la petición)
    db.run(sql, [nombre, marca, descripcion, unidad, ubicacion, saldo, notas, req.params.id], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true }); // Confirmamos actualización
    });
});

// [DELETE] - Eliminar un material
app.delete('/api/materiales/:id', (req, res) => {
    // Borramos el registro cuyo ID coincida con el que nos envían en la URL
    db.run("DELETE FROM materiales WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true }); // Confirmamos eliminación
    });
});

// ==========================================
// 6. RUTA PRINCIPAL (La Cara del Sistema)
// ==========================================
// Cuando el usuario entra a http://localhost:3000/ le entregamos el archivo index.html (la Single Page Application)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/views/index.html')));

// ==========================================
// 7. ARRANQUE DEL SERVIDOR
// ==========================================
// Le decimos a Express que empiece a "escuchar" peticiones en el puerto configurado
app.listen(PORT, () => console.log(`[🚀] Sistema corriendo en puerto ${PORT}`));