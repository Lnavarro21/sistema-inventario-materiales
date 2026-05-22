require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// AUTENTICACIÓN
app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        const match = await bcrypt.compare(password, process.env.PASSWORD_HASH);
        if (match) {
            res.json({ success: true, message: 'Autenticación exitosa' });
        } else {
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});


// CRUD DE INVENTARIO
app.get('/api/materiales', (req, res) => {
    db.all("SELECT * FROM materiales ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows });
    });
});

app.post('/api/materiales', (req, res) => {
    const { nombre, marca, descripcion, unidad, ubicacion, saldo, notas } = req.body;
    const sql = "INSERT INTO materiales (nombre, marca, descripcion, unidad, ubicacion, saldo, notas) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.run(sql, [nombre, marca, descripcion, unidad, ubicacion, saldo, notas], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

app.put('/api/materiales/:id', (req, res) => {
    const { nombre, marca, descripcion, unidad, ubicacion, saldo, notas } = req.body;
    const sql = "UPDATE materiales SET nombre = ?, marca = ?, descripcion = ?, unidad = ?, ubicacion = ?, saldo = ?, notas = ? WHERE id = ?";
    db.run(sql, [nombre, marca, descripcion, unidad, ubicacion, saldo, notas, req.params.id], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/materiales/:id', (req, res) => {
    db.run("DELETE FROM materiales WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/views/index.html')));

app.listen(PORT, () => console.log(`[🚀] Sistema corriendo en puerto ${PORT}`));