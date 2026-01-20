const API_URL = '/api/materiales';
let materialesData = [];
let modalForm;
let modalStats;
let chartUbicacionInstance = null;
let chartMarcasInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('modalMaterialForm');
    if(modalEl) modalForm = new bootstrap.Modal(modalEl);
    
    const statsEl = document.getElementById('modalStats');
    if(statsEl) modalStats = new bootstrap.Modal(statsEl);

    cargarMateriales();

    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => filtrarTabla(e.target.value.toLowerCase()));
    }

    const fileInput = document.getElementById('fileImport');
    if(fileInput) {
        fileInput.addEventListener('change', importarExcel);
    }
});

async function cargarMateriales() {
    try {
        const response = await fetch(API_URL);
        materialesData = await response.json();
        renderizarTabla(materialesData);
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

function renderizarTabla(datos) {
    const tbody = document.getElementById('tablaMaterialesBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No hay datos.</td></tr>';
        return;
    }

    const datosOrdenados = [...datos].sort((a, b) => b.id - a.id);

    datosOrdenados.forEach(item => {
        let badgeClass = item.ubicacion === 'Mueble' ? 'bg-primary' : 'bg-info text-dark';
        let iconClass = item.ubicacion === 'Mueble' ? 'fa-archive' : 'fa-layer-group';
        const saldoClass = item.saldo <= 2 ? 'text-danger fw-bold' : '';

        const row = `
            <tr>
                <td class="ps-4 fw-bold text-muted">#${item.id}</td>
                <td class="fw-bold">${item.nombre}</td>
                <td>${item.marca || '-'}</td>
                <td><small class="text-muted">${item.descripcion || ''}</small></td>
                <td><span class="badge bg-light text-dark border">${item.unidad}</span></td>
                <td><span class="badge ${badgeClass}"><i class="fa-solid ${iconClass} me-1"></i>${item.ubicacion}</span></td>
                <td class="text-center fs-5 ${saldoClass}">${item.saldo}</td>
                <td><small class="text-danger fst-italic">${item.notas || ''}</small></td>
                <td class="text-end pe-4" style="min-width: 100px;">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarMaterial(${item.id})" title="Editar">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="eliminarMaterial(${item.id})" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// --- NUEVA FUNCIÓN: ELIMINAR ---
async function eliminarMaterial(id) {
    // Confirmación de seguridad
    if(!confirm("¿Estás seguro de que deseas ELIMINAR este material? Esta acción no se puede deshacer.")) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.success) {
            // Recargamos la tabla para que desaparezca el ítem
            cargarMateriales();
        } else {
            alert("Error al eliminar: " + (result.message || "Desconocido"));
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión al intentar eliminar.");
    }
}

async function guardarMaterial() {
    const id = document.getElementById('itemId').value;
    
    const nuevoMaterial = {
        nombre: document.getElementById('itemNombre').value,
        marca: document.getElementById('itemMarca').value,
        descripcion: document.getElementById('itemDescripcion').value,
        unidad: document.getElementById('itemUnidad').value,
        ubicacion: document.getElementById('itemUbicacion').value,
        saldo: parseInt(document.getElementById('itemSaldo').value) || 0,
        notas: document.getElementById('itemNotas').value
    };

    if (!nuevoMaterial.nombre || !nuevoMaterial.ubicacion) {
        alert("Error: Debes completar el Nombre y la Ubicación.");
        return;
    }

    let url = API_URL;
    let method = 'POST';
    if (id) {
        url += `/${id}`;
        method = 'PUT';
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoMaterial)
        });
        const result = await res.json();

        if (result.success) {
            modalForm.hide();
            cargarMateriales();
            alert("Guardado correctamente");
        } else {
            alert("Error del servidor: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión al guardar.");
    }
}

async function importarExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    if(!confirm("¿Importar este archivo?")) {
        e.target.value = '';
        return;
    }

    try {
        document.body.style.cursor = 'wait';
        const res = await fetch('/api/importar', { method: 'POST', body: formData });
        const result = await res.json();
        document.body.style.cursor = 'default';

        if (result.success) {
            alert(`✅ ÉXITO: Se importaron ${result.count} registros.`);
            cargarMateriales();
        } else {
            alert(`❌ ERROR: ${result.message}\n\nColumnas leídas: ${result.debugKeys || 'Ninguna'}`);
        }
    } catch (err) {
        document.body.style.cursor = 'default';
        alert("Error crítico de conexión.");
    }
    e.target.value = ''; 
}

function exportarExcel() {
    window.location.href = '/api/exportar';
}

function resetForm() {
    document.getElementById('modalTitle').innerText = 'Nuevo Material';
    document.getElementById('materialForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemUbicacion').value = "Mueble"; 
}

function editarMaterial(id) {
    const item = materialesData.find(i => i.id === id);
    if (!item) return;

    document.getElementById('modalTitle').innerText = `Editar Material #${id}`;
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemNombre').value = item.nombre;
    document.getElementById('itemMarca').value = item.marca;
    document.getElementById('itemDescripcion').value = item.descripcion;
    document.getElementById('itemUnidad').value = item.unidad;
    document.getElementById('itemUbicacion').value = item.ubicacion;
    document.getElementById('itemSaldo').value = item.saldo;
    document.getElementById('itemNotas').value = item.notas;

    modalForm.show();
}

function filtrarTabla(texto) {
    const filtrados = materialesData.filter(item => 
        item.nombre.toLowerCase().includes(texto) ||
        item.marca.toLowerCase().includes(texto) ||
        item.id.toString().includes(texto)
    );
    renderizarTabla(filtrados);
}

function abrirEstadisticas() {
    modalStats.show();
    setTimeout(() => generarGraficos(), 300);
}

function generarGraficos() {
    if(!materialesData || materialesData.length === 0) return;

    const ctxUb = document.getElementById('chartUbicacion');
    if(ctxUb) {
        let muebles = 0, sueltos = 0;
        materialesData.forEach(m => {
            if(m.ubicacion === 'Mueble') muebles++; else sueltos++;
        });

        if(chartUbicacionInstance) chartUbicacionInstance.destroy();

        chartUbicacionInstance = new Chart(ctxUb, {
            type: 'doughnut',
            data: {
                labels: ['Mueble', 'Suelto'],
                datasets: [{
                    data: [muebles, sueltos],
                    backgroundColor: ['#0d6efd', '#0dcaf0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const ctxMar = document.getElementById('chartMarcas');
    if(ctxMar) {
        const conteo = {};
        materialesData.forEach(m => {
            const marca = (m.marca || 'GENÉRICO').toUpperCase().trim();
            conteo[marca] = (conteo[marca] || 0) + 1;
        });

        const top5 = Object.entries(conteo).sort((a,b) => b[1] - a[1]).slice(0, 5);

        if(chartMarcasInstance) chartMarcasInstance.destroy();

        chartMarcasInstance = new Chart(ctxMar, {
            type: 'bar',
            data: {
                labels: top5.map(x => x[0]),
                datasets: [{
                    label: 'Cantidad',
                    data: top5.map(x => x[1]),
                    backgroundColor: '#CC0000'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
        });
    }

    const divStock = document.getElementById('listaStockBajo');
    if(divStock) {
        divStock.innerHTML = '';
        const bajos = materialesData.filter(m => m.saldo < 5);

        if(bajos.length === 0) {
            divStock.innerHTML = '<span class="text-success fw-bold">Todo bien. No hay stock crítico.</span>';
        } else {
            bajos.forEach(m => {
                divStock.innerHTML += `
                    <span class="badge bg-warning text-dark border border-dark mb-1 me-1">
                        ${m.nombre} (${m.saldo})
                    </span>
                `;
            });
        }
    }
}