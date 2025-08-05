document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA PARA EL MENÚ DE HAMBURGUESA ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // --- LÓGICA PARA LA TIENDA ---
    
    const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSspDYo7SSi2msZURs5tUzGzg7TBuOSVW0_4yS7SnoGnuln5dXQ1bCh8oRa3FVGLwDKzuh85iLNzADe/pub?output=csv';
    const productContainer = document.getElementById('product-list');
    const filterContainer = document.querySelector('.filter-container');
    
    let allProducts = []; // Array para guardar todos los productos

    if (productContainer) {
        fetch(sheetURL)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split('\n').slice(1);

                rows.forEach(row => {
                    const columns = row.split(',');
                    if (columns.length > 1 && columns[8].trim() === 'Activo') {
                        const product = {
                            id: columns[0],
                            nombre: columns[1],
                            categoria: columns[2],
                            descripcion: columns[3],
                            precioAnterior: columns[4],
                            precioActual: columns[5],
                            rutaImagen: columns[6]
                        };
                        allProducts.push(product);
                    }
                });
                
                displayProducts(allProducts); // Muestra todos los productos inicialmente
                createCategoryFilters(); // Crea los botones de filtro
            })
            .catch(error => {
                console.error('Error al cargar los productos:', error);
                productContainer.innerHTML = '<p>No se pudieron cargar los productos. Inténtalo de nuevo más tarde.</p>';
            });
    }

    function displayProducts(products) {
        productContainer.innerHTML = ''; // Limpia el contenedor
        products.forEach(product => {
            const productCardHTML = `
                <a href="product.html?id=${product.id}" class="product-card-link">
                    <div class="product-card">
                        <img src="${product.rutaImagen}" alt="${product.nombre}">
                        <p class="category">${product.categoria}</p>
                        <h3>${product.nombre}</h3>
                        <p class="description">${product.descripcion}</p>
                        <div class="price-container">
                            ${product.precioAnterior ? `<span class="old-price">S/ ${product.precioAnterior}</span>` : ''}
                            <span class="current-price">S/ ${product.precioActual}</span>
                        </div>
                        <button class="add-to-cart-btn" data-product-id="${product.id}">Añadir al carrito</button>
                    </div>
                </a>
            `;
            productContainer.innerHTML += productCardHTML;
        });
        
        setupCardAnimations(); // Activa las animaciones para las tarjetas recién creadas
    }

    function createCategoryFilters() {
        const categories = ['TODO', ...new Set(allProducts.map(product => product.categoria))];
        filterContainer.innerHTML = ''; // Limpia los filtros existentes

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.innerText = category;
            button.dataset.category = category;
            if (category === 'TODO') {
                button.classList.add('active');
            }
            button.addEventListener('click', handleFilterClick);
            filterContainer.appendChild(button);
        });
    }
    
    function handleFilterClick(event) {
        const selectedCategory = event.target.dataset.category;

        // Actualiza el botón activo
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        if (selectedCategory === 'TODO') {
            displayProducts(allProducts);
        } else {
            const filteredProducts = allProducts.filter(product => product.categoria === selectedCategory);
            displayProducts(filteredProducts);
        }
    }

    function setupCardAnimations() {
        const cards = document.querySelectorAll('.product-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Para que la animación ocurra solo una vez
                }
            });
        }, {
            threshold: 0.1 // La animación se dispara cuando el 10% de la tarjeta es visible
        });

        cards.forEach(card => {
            observer.observe(card);
        });
    }
    
    // --- LÓGICA PARA EL AÑO DINÁMICO DEL FOOTER ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.textContent = currentYear;
    }
});