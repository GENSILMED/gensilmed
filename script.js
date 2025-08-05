// Se ejecuta cuando todo el contenido del HTML se ha cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA PARA EL MENÚ DE HAMBURGUESA ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // --- LÓGICA PARA CARGAR PRODUCTOS DESDE GOOGLE SHEETS ---
    
    // URL de tu hoja de cálculo de Google Sheets publicada como CSV
    const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSspDYo7SSi2msZURs5tUzGzg7TBuOSVW0_4yS7SnoGnuln5dXQ1bCh8oRa3FVGLwDKzuh85iLNzADe/pub?output=csv';

    // Obtenemos el contenedor donde irán los productos
    const productContainer = document.getElementById('product-list');

    // Verificamos que el contenedor de productos exista en la página actual
    if (productContainer) {
        fetch(sheetURL)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split('\n').slice(1);

                rows.forEach(row => {
                    const columns = row.split(',');

                    // Asegurarnos de que la fila no esté vacía
                    if (columns.length > 1) {
                        const id = columns[0];
                        const nombre = columns[1];
                        const categoria = columns[2];
                        const descripcion = columns[3];
                        const precioAnterior = columns[4];
                        const precioActual = columns[5];
                        const rutaImagen = columns[6];
                        const stock = columns[7];
                        const estado = columns[8] ? columns[8].trim() : '';

                        if (estado === 'Activo') {
                            const productCardHTML = `
                                <div class="product-card">
                                    <img src="${rutaImagen}" alt="${nombre}">
                                    <p class="category">${categoria}</p>
                                    <h3>${nombre}</h3>
                                    <p class="description">${descripcion}</p>
                                    <div class="price-container">
                                        ${precioAnterior ? `<span class="old-price">S/ ${precioAnterior}</span>` : ''}
                                        <span class="current-price">S/ ${precioActual}</span>
                                    </div>
                                </div>
                            `;
                            productContainer.innerHTML += productCardHTML;
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error al cargar los productos:', error);
                productContainer.innerHTML = '<p>No se pudieron cargar los productos. Inténtalo de nuevo más tarde.</p>';
            });
    }
});