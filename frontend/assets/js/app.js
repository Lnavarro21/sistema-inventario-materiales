// ==========================================
// 1. VARIABLES GLOBALES
// ==========================================
// 'dbMateriales' almacena en la memoria del navegador los datos descargados del servidor para evitar consultar la BD a cada rato.
let dbMateriales = [];

// 'myModal' controlará la ventana emergente (modal) de Bootstrap para crear o editar materiales.
let myModal = null;

// Estas variables guardan las instancias de los gráficos (Chart.js) para poder destruirlos y redibujarlos al actualizar los datos.
let chart1, chart2, chart3; 


// ==========================================
// 2. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
// 'DOMContentLoaded' asegura que este código solo se ejecute cuando el HTML haya cargado por completo.
document.addEventListener('DOMContentLoaded', () => {
    
    // Vinculamos la variable 'myModal' con el elemento HTML que tiene el ID 'modalMaterial'
    myModal = new bootstrap.Modal(document.getElementById('modalMaterial'));
    
    // Escuchamos cada vez que el usuario teclea ('keyup') en el buscador para filtrar la tabla en tiempo real.
    document.getElementById('searchInput').addEventListener('keyup', (e) => renderTabla(e.target.value));

    // 🔒 PERSISTENCIA DE SESIÓN: 
    // Verificamos si en la memoria temporal del navegador (sessionStorage) existe la llave 'usmp_auth'.
    // Si existe, significa que el usuario ya se logueó en esta pestaña, por lo que saltamos la pantalla de login.
    if (sessionStorage.getItem('usmp_auth') === 'true') {
        document.getElementById('login-screen').style.display = 'none'; // Ocultamos login
        document.getElementById('app-screen').style.display = 'flex';   // Mostramos el sistema
        cargarData(); // Llamamos a los datos de la base de datos
    }
});


// ==========================================
// 3. LÓGICA DE LOGIN Y ANIMACIONES
// ==========================================
// Escuchamos el evento 'submit' (enviar) del formulario de login.
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitamos que la página se recargue al enviar el formulario (comportamiento por defecto)
    
    const btn = e.target.querySelector('button'); // Seleccionamos el botón para cambiar su texto
    const pwd = document.getElementById('password').value; // Obtenemos la contraseña escrita
    
    // Cambiamos el botón a estado "Cargando" y lo deshabilitamos para evitar múltiples clics
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Validando...';
    btn.disabled = true;

    try {
        // Hacemos una petición POST al servidor para validar la contraseña
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await res.json(); // Esperamos la respuesta del servidor

        if (data.success) {
            // Si la clave es correcta, guardamos la sesión en el navegador y disparamos la animación
            sessionStorage.setItem('usmp_auth', 'true'); 
            ejecutarTransicionCinematografica();
        } else {
            // Si es incorrecta, mostramos alerta y restauramos el botón
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

// Función que maneja la animación de cierre y apertura diagonal usando la librería GSAP
function ejecutarTransicionCinematografica() {
    const tl = gsap.timeline(); // Creamos una línea de tiempo
    // 1. Los triángulos negros (paneles) entran a la pantalla
    tl.to(".diag-top", { x: "0%", y: "0%", duration: 0.8, ease: "power4.inOut" }, 0)
      .to(".diag-bottom", { x: "0%", y: "0%", duration: 0.8, ease: "power4.inOut" }, 0)
      // 2. Mientras la pantalla está negra, ocultamos el login y mostramos el sistema
      .call(() => {
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('app-screen').style.display = 'flex';
          cargarData(); // Cargamos los datos del inventario
      })
      // 3. Los triángulos se retiran de la pantalla
      .to(".diag-top", { x: "-100%", y: "100%", duration: 0.8, ease: "power4.inOut" }, "+=0.2")
      .to(".diag-bottom", { x: "100%", y: "-100%", duration: 0.8, ease: "power4.inOut" }, "<");
}

// Función para cerrar la sesión
function logout() {
    sessionStorage.removeItem('usmp_auth'); // Borramos la memoria de sesión
    document.getElementById('password').value = ''; // Limpiamos el campo de contraseña
    
    // Restauramos el botón del login
    const btn = document.querySelector('#loginForm button');
    btn.innerHTML = 'Ingresar Segur@ <i class="fa-solid fa-arrow-right ms-2"></i>';
    btn.disabled = false;

    // Ocultamos el sistema y volvemos a mostrar el login
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    
    // Reseteamos la posición de los triángulos de la animación por si se vuelve a loguear
    gsap.set(".diag-top", { x: "100%", y: "-100%" });
    gsap.set(".diag-bottom", { x: "-100%", y: "100%" });
}


// ==========================================
// 4. NAVEGACIÓN ENTRE PESTAÑAS (SPA)
// ==========================================
// Esta función simula cambiar de página, pero en realidad solo oculta y muestra secciones de HTML
function switchTab(tab, el) {
    // Quitamos la clase 'active' de todos los botones del menú lateral
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    el.classList.add('active'); // Se la ponemos al botón que fue presionado
    
    // Ocultamos todas las secciones de contenido
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    // Mostramos solo la sección correspondiente al botón presionado
    document.getElementById('sec-' + tab).classList.add('active');

    // Si entramos al dashboard, forzamos la actualización de los gráficos
    if (tab === 'dashboard') actualizarDashboard();
}


// ==========================================
// 5. OPERACIONES CON LA BASE DE DATOS (CRUD)
// ==========================================

// Descarga todos los materiales del servidor
async function cargarData() {
    try {
        const res = await fetch('/api/materiales'); // Petición GET al backend
        const json = await res.json();
        if (json.success) {
            dbMateriales = json.data; // Guardamos los datos en la variable global
            renderTabla();            // Dibujamos la tabla
            actualizarDashboard();    // Actualizamos los KPIs y gráficos
        }
    } catch (e) {
        console.error("Error cargando BD", e);
    }
}

// Dibuja la tabla HTML leyendo los datos de la memoria ('dbMateriales')
function renderTabla(filtro = '') {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = ''; // Limpiamos la tabla antes de dibujar
    
    // Filtramos los datos si el usuario escribió algo en el buscador
    const filtrados = dbMateriales.filter(m => 
        m.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
        (m.marca && m.marca.toLowerCase().includes(filtro.toLowerCase()))
    );

    // Si no hay resultados, mostramos un mensaje
    if(filtrados.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay materiales registrados.</td></tr>';

    // Por cada material filtrado, generamos una fila en HTML
    filtrados.forEach(m => {
        // Definimos el color del stock dependiendo de la cantidad (< 10 es naranja, 0 es rojo)
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

// Prepara la ventana modal para ingresar un NUEVO registro (limpia los campos)
function abrirModalNuevo() {
    document.getElementById('formMaterial').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('modalTitle').innerText = 'Nuevo Material';
    myModal.show();
}

// Prepara la ventana modal para EDITAR (carga los datos del material seleccionado)
function editarMaterial(id) {
    // Busca el material en la memoria que coincida con el ID
    const m = dbMateriales.find(x => x.id === id); 
    
    // Llena los campos del formulario con esos datos
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

// Envía los datos del formulario al servidor (Sirve tanto para crear como para editar)
async function guardarMaterial() {
    const id = document.getElementById('itemId').value; // Si hay ID, es edición. Si está vacío, es nuevo.
    const btnSave = document.getElementById('btnGuardar');
    
    // Recolectamos la información de los inputs
    const body = {
        nombre: document.getElementById('mNombre').value,
        marca: document.getElementById('mMarca').value,
        descripcion: document.getElementById('mDesc').value,
        unidad: document.getElementById('mUnd').value,
        ubicacion: document.getElementById('mUbi').value,
        saldo: parseInt(document.getElementById('mSaldo').value) || 0, // Aseguramos que sea un número
        notas: document.getElementById('mNotas').value
    };

    if(!body.nombre) return Swal.fire('Atención', 'El nombre es obligatorio', 'warning');

    // Cambiamos el botón a "Guardando..."
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    btnSave.disabled = true;

    try {
        // Si hay ID usamos PUT (Actualizar), si no, usamos POST (Crear)
        const res = await fetch(id ? `/api/materiales/${id}` : '/api/materiales', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const result = await res.json();
        
        if (result.success) {
            myModal.hide(); // Cerramos el modal
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
            await cargarData(); // Recargamos los datos del servidor para ver los cambios
        } else {
            Swal.fire('Error de Base de Datos', result.message || 'No se pudo guardar', 'error');
        }
    } catch (e) {
        Swal.fire('Error Crítico', 'Falla de conexión con el servidor Node.js', 'error');
        console.error(e);
    } finally {
        // Restauramos el botón pase lo que pase
        btnSave.innerHTML = 'Guardar Registro';
        btnSave.disabled = false;
    }
}

// Envía la petición para eliminar un registro
async function eliminarMaterial(id) {
    // Pedimos confirmación al usuario antes de borrar
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
            await fetch(`/api/materiales/${id}`, { method: 'DELETE' }); // Petición DELETE
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false });
            cargarData(); // Actualizamos la tabla
        } catch(e) {
            Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
    }
}


// ==========================================
// 6. CÁLCULO DE DASHBOARD Y GRÁFICOS (KPIs)
// ==========================================
// Extrae estadísticas de los datos cargados y dibuja los gráficos de Chart.js
function actualizarDashboard() {
    
    // --- 1. Cálculo de Tarjetas Superiores (KPIs) ---
    const activos = dbMateriales.length; // Total de registros
    const stockCritico = dbMateriales.filter(m => m.saldo > 0 && m.saldo < 10).length; // Menor a 10 unidades
    const agotados = dbMateriales.filter(m => m.saldo === 0).length; // Exactamente 0
    const stockTotal = dbMateriales.reduce((acc, val) => acc + val.saldo, 0); // Suma de todo el inventario

    // Insertamos los valores calculados en el HTML
    document.getElementById('kpi-activos').innerText = activos;
    document.getElementById('kpi-critico').innerText = stockCritico;
    document.getElementById('kpi-agotados').innerText = agotados;
    document.getElementById('kpi-totalstock').innerText = stockTotal;


    // --- 2. Preparación para Gráficos ---
    // Destruimos los gráficos viejos para evitar que se superpongan visualmente o causen "glitches"
    if(chart1) chart1.destroy();
    if(chart2) chart2.destroy();
    if(chart3) chart3.destroy();

    // Contamos cuántos están en mueble y cuántos sueltos
    let ubicacionMueble = dbMateriales.filter(m => m.ubicacion === 'Mueble').length;
    let ubicacionSuelto = dbMateriales.filter(m => m.ubicacion === 'Suelto').length;

    // Agrupamos y contamos por marca
    const marcas = {};
    dbMateriales.forEach(m => {
        let marca = (m.marca || 'GENÉRICO').toUpperCase();
        marcas[marca] = (marcas[marca] || 0) + 1;
    });
    // Convertimos el objeto en array, lo ordenamos de mayor a menor y extraemos el Top 5
    const topMarcas = Object.entries(marcas).sort((a,b) => b[1] - a[1]).slice(0, 5);


    // --- 3. Renderizado de Gráficos (Chart.js) ---
    
    // Gráfico 1: Pastel (Estado de Salud)
    chart1 = new Chart(document.getElementById('chartPie'), {
        type: 'pie',
        data: {
            labels: ['Buen Stock', 'Crítico', 'Agotado'],
            datasets: [{
                data: [activos - stockCritico - agotados, stockCritico, agotados],
                backgroundColor: ['#198754', '#ffc107', '#dc3545'], // Verde, Naranja, Rojo
                borderWidth: 2, borderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    // Gráfico 2: Barras Horizontales (Ubicación)
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
        // 'indexAxis: y' voltea las barras para que sean horizontales
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Gráfico 3: Barras Verticales (Top Marcas)
    chart3 = new Chart(document.getElementById('chartBarUsers'), {
        type: 'bar',
        data: {
            labels: topMarcas.map(m => m[0]), // Nombres de las marcas
            datasets: [{
                label: 'Modelos Registrados',
                data: topMarcas.map(m => m[1]), // Cantidad por marca
                backgroundColor: '#cc0000', // Rojo USMP
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}