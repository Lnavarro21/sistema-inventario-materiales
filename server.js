const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Rutas de carpetas
const DATA_FOLDER = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_FOLDER, 'materiales.json');
const UPLOADS_FOLDER = path.join(__dirname, 'uploads');

// Asegurar directorios
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);
if (!fs.existsSync(UPLOADS_FOLDER)) fs.mkdirSync(UPLOADS_FOLDER);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

// Configurar subida
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
const readData = () => {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } 
    catch (e) { return []; }
};
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// --- API ROUTES ---

app.get('/api/materiales', (req, res) => res.json(readData()));

app.post('/api/materiales', (req, res) => {
    const data = readData();
    const newItem = req.body;
    newItem.id = data.length > 0 ? Math.max(...data.map(i => i.id)) + 1 : 1;
    data.push(newItem);
    writeData(data);
    res.json({ success: true, item: newItem });
});

app.put('/api/materiales/:id', (req, res) => {
    let data = readData();
    const id = parseInt(req.params.id);
    const index = data.findIndex(i => i.id === id);
    if(index !== -1) {
        data[index] = { ...data[index], ...req.body };
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// --- NUEVA RUTA: ELIMINAR ---
app.delete('/api/materiales/:id', (req, res) => {
    let data = readData();
    const id = parseInt(req.params.id);
    const initialLength = data.length;
    
    // Filtramos para quitar el ID que queremos borrar
    data = data.filter(item => item.id !== id);

    if (data.length < initialLength) {
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'No encontrado' });
    }
});

// EXPORTAR
app.get('/api/exportar', (req, res) => {
    const data = readData();
    const dataExcel = data.map(i => ({
        ID: i.id, NOMBRE: i.nombre, MARCA: i.marca, 
        DESCRIPCION: i.descripcion, UNIDAD: i.unidad, 
        UBICACION: i.ubicacion, SALDO: i.saldo, NOTAS: i.notas
    }));
    const ws = xlsx.utils.json_to_sheet(dataExcel);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Inventario");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Inventario_MORE.xlsx"');
    res.send(buffer);
});

// IMPORTAR
app.post('/api/importar', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Falta archivo' });

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
        const firstRowKeys = rawData.length > 0 ? Object.keys(rawData[0]).join(", ") : "Ninguna";

        let currentData = readData();
        let lastId = currentData.length > 0 ? Math.max(...currentData.map(i => i.id)) : 0;
        let count = 0;

        const newItems = rawData.map(row => {
            const r = {};
            Object.keys(row).forEach(k => {
                const cleanKey = k.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                r[cleanKey] = row[k];
            });

            if(!r['NOMBRE'] && !r['MATERIAL']) return null;

            count++;
            return {
                id: ++lastId,
                nombre: r['NOMBRE'] || r['MATERIAL'] || 'Sin Nombre',
                marca: r['MARCA'] || '',
                descripcion: r['DESCRIPCION'] || r['DESC'] || '',
                unidad: r['UNIDAD'] || r['UND'] || 'UND',
                ubicacion: (r['UBICACION'] && r['UBICACION'].toString().toUpperCase().includes('MUEBLE')) ? 'Mueble' : 'Suelto',
                saldo: parseInt(r['SALDO']) || 0,
                notas: r['NOTAS'] || ''
            };
        }).filter(i => i !== null);

        writeData([...currentData, ...newItems]);
        fs.unlinkSync(req.file.path);

        res.json({ success: true, count: count, debugKeys: firstRowKeys });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error procesando Excel", debugKeys: error.message });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));

app.listen(PORT, () => console.log(`Sistema MORE activo en puerto ${PORT}`));