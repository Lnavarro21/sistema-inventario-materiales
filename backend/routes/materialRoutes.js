const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

router.get('/', materialController.getAllMaterials);
router.post('/', materialController.createMaterial);

module.exports = router;