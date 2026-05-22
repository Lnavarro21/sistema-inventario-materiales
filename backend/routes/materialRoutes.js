// Importamos Express, que es nuestro framework de servidor.
const express = require('express');

// Creamos un 'Router' (enrutador) para poder agrupar todas las rutas relacionadas a "materiales".
const router = express.Router();

// Importamos nuestro Controlador, que tiene las funciones lógicas.
const materialController = require('../controllers/materialController');

// Definimos las rutas:
// Cuando llegue una petición GET a la raíz ('/'), ejecuta 'getAllMaterials'
router.get('/', materialController.getAllMaterials);

// Cuando llegue una petición POST a la raíz ('/'), ejecuta 'createMaterial'
router.post('/', materialController.createMaterial);

// Exportamos el router. 
// En tu archivo server.js principal, esto se enlazará a '/api/materiales'
module.exports = router;