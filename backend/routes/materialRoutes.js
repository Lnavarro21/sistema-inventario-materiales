const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// Rutas base: /api/materiales
router.get('/', materialController.getAllMaterials);
router.post('/', materialController.createMaterial);

module.exports = router;