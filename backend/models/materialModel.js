const db = require('../config/db');

const Material = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM materiales ORDER BY id DESC", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    create: (data) => {
        return new Promise((resolve, reject) => {
            const { codigo, nombre, marca, descripcion, unidad, ubicacion, estado, stock_actual, stock_minimo } = data;
            db.run(
                `INSERT INTO materiales (codigo, nombre, marca, descripcion, unidad, ubicacion, estado, stock_actual, stock_minimo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [codigo, nombre, marca, descripcion, unidad, ubicacion, estado, stock_actual, stock_minimo],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...data });
                }
            );
        });
    }
    
};

module.exports = Material;