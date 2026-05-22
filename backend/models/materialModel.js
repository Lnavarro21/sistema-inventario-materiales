// Importamos la conexión a la base de datos que acabamos de configurar en db.js.
const db = require('../config/db');

// Creamos un objeto 'Material' que contendrá todas las funciones para interactuar con la tabla.
const Material = {
    
    // Función para obtener TODOS los materiales de la base de datos.
    getAll: () => {
        // Retornamos una "Promesa" porque buscar en la BD toma tiempo, el sistema debe esperar a que termine.
        return new Promise((resolve, reject) => {
            // db.all ejecuta una consulta SQL que devuelve múltiples filas.
            // ORDER BY id DESC: Ordena del más nuevo al más viejo.
            db.all("SELECT * FROM materiales ORDER BY id DESC", [], (err, rows) => {
                if (err) reject(err);     // Si falla, rechazamos la promesa enviando el error.
                else resolve(rows);       // Si tiene éxito, resolvemos la promesa enviando los datos (rows).
            });
        });
    },

    // Función para crear un NUEVO material.
    create: (data) => {
        return new Promise((resolve, reject) => {
            // Extraemos (desestructuramos) los datos exactos que nos envía el frontend.
            const { nombre, marca, descripcion, unidad, ubicacion, saldo, notas } = data;
            
            // db.run ejecuta comandos SQL que NO devuelven filas (como INSERT, UPDATE, DELETE).
            // Los signos de interrogación (?) son medidas de seguridad para evitar hackeos (SQL Injection).
            db.run(
                `INSERT INTO materiales (nombre, marca, descripcion, unidad, ubicacion, saldo, notas) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                // Pasamos los valores que reemplazarán a los signos de interrogación en el mismo orden.
                [nombre, marca, descripcion, unidad, ubicacion, saldo, notas],
                function (err) {
                    if (err) reject(err); 
                    // Si sale bien, devolvemos el objeto original pero le agregamos el ID que SQLite generó (this.lastID).
                    else resolve({ id: this.lastID, ...data }); 
                }
            );
        });
    }
};

// Exportamos el modelo para que el Controlador pueda usarlo.
module.exports = Material;