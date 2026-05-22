// Importamos el Modelo que contiene nuestras consultas SQL.
const Material = require('../models/materialModel');

// Controlador para listar materiales (Responde a peticiones GET)
// Usamos 'async' porque trabajaremos con las promesas que devuelve el Modelo.
exports.getAllMaterials = async (req, res) => {
    try {
        // 'await' pausa la ejecución hasta que la base de datos responda con los materiales.
        const materiales = await Material.getAll();
        
        // Respondemos al frontend con código 200 (Éxito) y le enviamos los datos en formato JSON.
        res.status(200).json({ success: true, data: materiales });
    } catch (error) {
        // Si algo se rompe, atrapamos el error, lo imprimimos en consola y avisamos al frontend (código 500).
        console.error("Error obteniendo materiales:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// Controlador para crear un material (Responde a peticiones POST)
exports.createMaterial = async (req, res) => {
    try {
        // Le mandamos al Modelo toda la información que llenó el usuario (req.body).
        const nuevoMaterial = await Material.create(req.body);
        
        // Respondemos con código 201 (Creado exitosamente) y devolvemos el nuevo ítem.
        res.status(201).json({ success: true, message: 'Material registrado', data: nuevoMaterial });
    } catch (error) {
        console.error("Error creando material:", error);
        res.status(500).json({ success: false, message: 'Error al registrar el material' });
    }
};