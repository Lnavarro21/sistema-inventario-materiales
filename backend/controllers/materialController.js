const Material = require('../models/materialModel');

exports.getAllMaterials = async (req, res) => {
    try {
        const materiales = await Material.getAll();
        res.status(200).json({ success: true, data: materiales });
    } catch (error) {
        console.error("Error obteniendo materiales:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const nuevoMaterial = await Material.create(req.body);
        res.status(201).json({ success: true, message: 'Material registrado', data: nuevoMaterial });
    } catch (error) {
        console.error("Error creando material:", error);
        res.status(500).json({ success: false, message: 'Error al registrar el material' });
    }
};