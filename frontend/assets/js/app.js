let dbMateriales = [];
let myModal = null;
let chart1, chart2, chart3; 

document.addEventListener('DOMContentLoaded', () => {
    myModal = new bootstrap.Modal(document.getElementById('modalMaterial'));
    document.getElementById('searchInput').addEventListener('keyup', (e) => renderTabla(e.target.value));

    if (sessionStorage.getItem('usmp_auth') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        cargarData();
    }
});

// ==========================================
// 1. LOGIN Y ANIMACIÓN
// ==========================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const pwd = document.getElementById('password').value;
    
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Validando...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem('usmp_auth', 'true'); 
            ejecutarTransicionCinematografica();
        } else {
            Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Contraseña incorrecta' });
            btn.innerHTML = 'Ingresar Segur@ <i class="fa-solid fa-arrow-right ms-2"></i>';
            btn.disabled = false;
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error de servidor' });
        btn.innerHTML = 'Ingresar Segur@ <i class="fa-solid fa-arrow-right ms-2"></i>';
        btn.disabled = false;
    }
});

function ejecutarTransicionCinematografica() {
    const tl = gsap.timeline();
    tl.to(".diag-top", { x: "0%", y: "0%", duration: 0.8, ease: "power4.inOut" }, 0)
      .to(".diag-bottom", { x: "0%", y: "0%", duration: 0.8, ease: "power4.inOut" }, 0)
      .call(() => {
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('app-screen').style.display = 'flex';
          cargarData();
      })
      .to(".diag-top", { x: "-100%", y: "100%", duration: 0.8, ease: "power4.inOut" }, "+=0.2")
      .to(".diag-bottom", { x: "100%", y: "-100%", duration: 0.8, ease: "power4.inOut" }, "<");
}

function logout() {
    sessionStorage.removeItem('usmp_auth'); 
    document.getElementById('password').value = '';
    const btn = document.querySelector('#loginForm button');
    btn.innerHTML = 'Ingresar Segur@ <i class="fa-solid fa-arrow-right ms-2"></i>';
    btn.disabled = false;

    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    gsap.set(".diag-top", { x: "100%", y: "-100%" });
    gsap.set(".diag-bottom", { x: "-100%", y: "100%" });
}

// ==========================================
// 2. NAVEGACIÓN
// ==========================================
function switchTab(tab, el) {
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('sec-' + tab).classList.add('active');

    if (tab === 'dashboard') actualizarDashboard();
}

// ==========================================
// 3. LÓGICA CRUD REAL Y BLINDADA
// ==========================================
async function cargarData() {
    try {
        const res = await fetch('/api/materiales');
        const json = await res.json();
        if (json.success) {
            dbMateriales = json.data;
            renderTabla();
            actualizarDashboard();
        }
    } catch (e) {
        console.error("Error cargando BD", e);
    }
}

function renderTabla(filtro = '') {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    const filtrados = dbMateriales.filter(m => 
        m.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
        (m.marca && m.marca.toLowerCase().includes(filtro.toLowerCase()))
    );

    if(filtrados.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay materiales registrados.</td></tr>';

    filtrados.forEach(m => {
    
        const stockClass = m.saldo === 0 ? 'text-danger fw-bold' : (m.saldo < 10 ? 'text-warning fw-bold' : 'text-dark');
        tbody.innerHTML += `
            <tr>
                <td class="ps-4 fw-bold text-usmp-dark">${m.nombre} <br><small class="text-muted fw-normal">${m.descripcion || ''}</small></td>
                <td class="text-muted">${m.marca || '-'}</td>
                <td><span class="badge bg-light text-dark border">${m.unidad}</span></td>
                <td><i class="fa-solid ${m.ubicacion==='Mueble'?'fa-archive text-primary':'fa-layer-group text-info'} me-1"></i> ${m.ubicacion}</td>
                <td class="fs-6 ${stockClass}">${m.saldo}</td>
                <td>
                    <button class="btn btn-sm btn-light border text-primary shadow-sm" onclick="editarMaterial(${m.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-light border text-danger shadow-sm" onclick="eliminarMaterial(${m.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function abrirModalNuevo() {
    document.getElementById('formMaterial').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('modalTitle').innerText = 'Nuevo Material';
    myModal.show();
}

function editarMaterial(id) {
    const m = dbMateriales.find(x => x.id === id);
    document.getElementById('itemId').value = m.id;
    document.getElementById('mNombre').value = m.nombre;
    document.getElementById('mMarca').value = m.marca;
    document.getElementById('mDesc').value = m.descripcion;
    document.getElementById('mUnd').value = m.unidad;
    document.getElementById('mUbi').value = m.ubicacion;
    document.getElementById('mSaldo').value = m.saldo;
    document.getElementById('mNotas').value = m.notas;
    document.getElementById('modalTitle').innerText = 'Editar Material';
    myModal.show();
}

// BOTÓN GUARDAR 
async function guardarMaterial() {
    const id = document.getElementById('itemId').value;
    const btnSave = document.getElementById('btnGuardar');
    
    const body = {
        nombre: document.getElementById('mNombre').value,
        marca: document.getElementById('mMarca').value,
        descripcion: document.getElementById('mDesc').value,
        unidad: document.getElementById('mUnd').value,
        ubicacion: document.getElementById('mUbi').value,
        saldo: parseInt(document.getElementById('mSaldo').value) || 0,
        notas: document.getElementById('mNotas').value
    };

    if(!body.nombre) return Swal.fire('Atención', 'El nombre es obligatorio', 'warning');

    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    btnSave.disabled = true;

    try {
        const res = await fetch(id ? `/api/materiales/${id}` : '/api/materiales', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const result = await res.json();
        
        if (result.success) {
            myModal.hide();
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
            await cargarData(); 
        } else {
            Swal.fire('Error de Base de Datos', result.message || 'No se pudo guardar', 'error');
        }
    } catch (e) {
        Swal.fire('Error Crítico', 'Falla de conexión con el servidor Node.js', 'error');
        console.error(e);
    } finally {
        btnSave.innerHTML = 'Guardar Registro';
        btnSave.disabled = false;
    }
}

async function eliminarMaterial(id) {
    const result = await Swal.fire({
        title: '¿Eliminar Material?',
        text: "Se borrará permanentemente de la base de datos.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#cc0000',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false });
            cargarData();
        } catch(e) {
            Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
    }
}

// ==========================================
// 4. DASHBOARD TIPO FIIX (GRÁFICOS PRO)
// ==========================================
function actualizarDashboard() {
    const activos = dbMateriales.length;
    const stockCritico = dbMateriales.filter(m => m.saldo > 0 && m.saldo < 10).length;
    const agotados = dbMateriales.filter(m => m.saldo === 0).length;
    const stockTotal = dbMateriales.reduce((acc, val) => acc + val.saldo, 0);

    document.getElementById('kpi-activos').innerText = activos;
    document.getElementById('kpi-critico').innerText = stockCritico;
    document.getElementById('kpi-agotados').innerText = agotados;
    document.getElementById('kpi-totalstock').innerText = stockTotal;

    if(chart1) chart1.destroy();
    if(chart2) chart2.destroy();
    if(chart3) chart3.destroy();


    let ubicacionMueble = dbMateriales.filter(m => m.ubicacion === 'Mueble').length;
    let ubicacionSuelto = dbMateriales.filter(m => m.ubicacion === 'Suelto').length;

    const marcas = {};
    dbMateriales.forEach(m => {
        let marca = (m.marca || 'GENÉRICO').toUpperCase();
        marcas[marca] = (marcas[marca] || 0) + 1;
    });
    const topMarcas = Object.entries(marcas).sort((a,b) => b[1] - a[1]).slice(0, 5);

    chart1 = new Chart(document.getElementById('chartPie'), {
        type: 'pie',
        data: {
            labels: ['Buen Stock', 'Crítico', 'Agotado'],
            datasets: [{
                data: [activos - stockCritico - agotados, stockCritico, agotados],
                backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                borderWidth: 2, borderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

  
    chart2 = new Chart(document.getElementById('chartBarType'), {
        type: 'bar',
        data: {
            labels: ['Mueble', 'Suelto'],
            datasets: [{
                label: 'Cantidad de Ítems',
                data: [ubicacionMueble, ubicacionSuelto],
                backgroundColor: ['#0d6efd', '#0dcaf0'],
                borderRadius: 4
            }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

   
    chart3 = new Chart(document.getElementById('chartBarUsers'), {
        type: 'bar',
        data: {
            labels: topMarcas.map(m => m[0]),
            datasets: [{
                label: 'Modelos Registrados',
                data: topMarcas.map(m => m[1]),
                backgroundColor: '#cc0000',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}