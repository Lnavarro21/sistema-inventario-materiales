document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Aquí validarías contra tu backend SQLite. Por ahora simulamos éxito.
    const btn = this.querySelector('button');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Autenticando...';
    btn.disabled = true;

    setTimeout(() => {
        iniciarTransicionGunBound();
    }, 800);
});

function iniciarTransicionGunBound() {
    const tl = gsap.timeline();

    // 1. Los triángulos entran chocando al centro
    tl.to(".gb-left", { x: "0%", duration: 0.6, ease: "power4.inOut" }, 0)
      .to(".gb-right", { x: "0%", duration: 0.6, ease: "power4.inOut" }, 0)
      
    // 2. Ocultamos login, mostramos dashboard tras las cortinas negras
      .call(() => {
          document.getElementById('login-screen').classList.add('d-none');
          document.getElementById('dashboard-screen').classList.remove('d-none');
          inicializarGraficos(); // Renderizamos Chart.js
          inicializarDashboard();
      })

    // 3. Los triángulos se retiran hacia los lados
      .to(".gb-left", { x: "-100%", duration: 0.8, ease: "power4.inOut", delay: 0.2 })
      .to(".gb-right", { x: "100%", duration: 0.8, ease: "power4.inOut", delay: 0.2 }, "<");
}

function inicializarGraficos() {
    const ctxMain = document.getElementById('mainChart').getContext('2d');
    new Chart(ctxMain, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
            datasets: [{ label: 'Ingresos', data: [12, 19, 3, 5, 2], backgroundColor: '#cc0000', borderRadius: 6 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const ctxPie = document.getElementById('pieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Buen Stock', 'Crítico', 'Agotado'],
            datasets: [{ data: [85, 10, 5], backgroundColor: ['#198754', '#ffc107', '#dc3545'], borderWidth: 0 }]
        },
        options: { responsive: true, cutout: '75%' }
    });
}