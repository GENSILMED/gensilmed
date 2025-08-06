document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA PARA EL MENÚ DE HAMBURGUESA ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', () => navMenu.classList.toggle('active'));
    }

    // --- LÓGICA UNIVERSAL DE LA TIENDA ---
    
    const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSspDYo7SSi2msZURs5tUzGzg7TBuOSVW0_4yS7SnoGnuln5dXQ1bCh8oRa3FVGLwDKzuh85iLNzADe/pub?output=csv';
    let allProducts = [];

    // --- NUEVA LÓGICA DE CARGA DE DATOS CON PAPA PARSE ---
    fetch(sheetURL)
        .then(response => response.text())
        .then(csvText => {
            Papa.parse(csvText, {
                header: true, // ¡La clave! Usa la primera fila como nombres de propiedad
                complete: function(results) {
                    allProducts = results.data.filter(p => p.Estado === 'Activo');
                    
                    // Disparamos un evento personalizado para avisar que los productos ya se cargaron
                    document.dispatchEvent(new CustomEvent('productsLoaded'));
                }
            });
        })
        .catch(error => console.error('Error al cargar los productos:', error));

    // --- LÓGICA PARA LA PÁGINA PRINCIPAL (INDEX.HTML) ---
    const productContainer = document.getElementById('product-list');
    const filterContainer = document.querySelector('.filter-container');

    if (productContainer) {
        document.addEventListener('productsLoaded', () => {
            displayProducts(allProducts);
            createCategoryFilters();
        });
    }
    
    function displayProducts(products) {
        if (!productContainer) return;
        productContainer.innerHTML = '';
        products.forEach(product => {
            productContainer.innerHTML += `
                <a href="product.html?id=${product.ID_Producto}" class="product-card-link">
                    <div class="product-card">
                        <div class="image-container">
                            <img src="${product.RutaImagen}" alt="${product.NombreProducto}">
                            ${createBadgeHTML(product.Etiqueta)}
                        </div>
                        <p class="category">${product.Categoria}</p>
                        <h3>${product.NombreProducto}</h3>
                        <p class="description">${product.Descripcion}</p>
                        <div class="price-container">
                            ${product.PrecioAnterior ? `<span class="old-price">S/ ${product.PrecioAnterior}</span>` : ''}
                            <span class="current-price">S/ ${product.PrecioActual}</span>
                        </div>
                        <button class="add-to-cart-btn" data-product-id="${product.ID_Producto}">Añadir al carrito</button>
                    </div>
                </a>
            `;
        });
        setupCardAnimations();
    }

    function createCategoryFilters() {
        if (!filterContainer) return;
        const categories = ['TODO', ...new Set(allProducts.map(product => product.Categoria))];
        filterContainer.innerHTML = '';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.innerText = category;
            button.dataset.category = category;
            if (category === 'TODO') button.classList.add('active');
            button.addEventListener('click', handleFilterClick);
            filterContainer.appendChild(button);
        });
    }
    
    function handleFilterClick(event) {
        const selectedCategory = event.target.dataset.category;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        const filteredProducts = selectedCategory === 'TODO' ? allProducts : allProducts.filter(p => p.Categoria === selectedCategory);
        displayProducts(filteredProducts);
    }

    // --- LÓGICA PARA LA PÁGINA DE DETALLE DE PRODUCTO (PRODUCT.HTML) ---
    const productDetailContainer = document.getElementById('product-detail-content');
    
    function initializeProductDetailPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = allProducts.find(p => p.ID_Producto === productId);

        if (product) {
            document.title = `${product.NombreProducto} - GENSILMED`;
            productDetailContainer.innerHTML = createProductDetailHTML(product);
            setupImageGallery(product);
            setupWhatsAppButton(product);
            setupColorSwatches(product);
            setupQuantityControls(product);
            displayRelatedProducts(product);
        } else {
            productDetailContainer.innerHTML = '<h2>Producto no encontrado</h2>';
        }
    }

    if (productDetailContainer) {
        document.addEventListener('productsLoaded', initializeProductDetailPage);
    }
    
    function createProductDetailHTML(product) {
        return `
            <div class="product-detail-container">
                <div class="product-gallery">
                    <div class="main-image-container"><img src="${product.RutaImagen}" alt="${product.NombreProducto}" id="main-product-image"></div>
                    <div class="thumbnail-container" id="thumbnail-container"></div>
                </div>
                <div class="product-info">
                    ${createBadgeHTML(product.Etiqueta, true)}
                    <h1>${product.NombreProducto}</h1>
                    <p class="product-code">Código: ${product.ID_Producto}</p>
                    <div class="price-container" style="margin-bottom: 20px;">
                        ${product.PrecioAnterior ? `<span class="old-price">S/ ${product.PrecioAnterior}</span>` : ''}
                        <span class="current-price" id="product-price">S/ ${product.PrecioActual}</span>
                    </div>
                    <p class="description-full">${product.Descripcion}</p>
                    <div class="product-options">
                        <div class="color-options" id="color-options-container"></div>
                        <div class="quantity-section">
                            <h4>Cantidad:</h4>
                            <div class="purchase-controls">
                                 <div class="quantity-selector">
                                    <button id="decrease-qty">-</button>
                                    <input type="number" id="quantity-input" value="1" min="1" readonly>
                                    <button id="increase-qty">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="add-to-cart-btn" data-product-id="${product.ID_Producto}">Añadir al carrito</button>
                        <a href="#" id="whatsapp-btn" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> Pedir por WhatsApp</a>
                    </div>
                </div>
            </div>
        `;
    }

    const colorMap = { 'rojo': '#e74c3c', 'azul': '#3498db', 'verde': '#2ecc71', 'negro': '#34495e', 'blanco': '#ecf0f1', 'gris': '#95a5a6', 'amarillo': '#f1c40f', 'naranja': '#e67e22', 'morado': '#9b59b6', 'beige': '#f5f5dc', 'verde oscuro': '#006400', 'azul oscuro': '#00008b' };

    function setupColorSwatches(product) {
        const container = document.getElementById('color-options-container');
        if (!product.Colores) { container.style.display = 'none'; return; }
        container.innerHTML = `<h4>Colores:</h4><div id="color-swatches"></div>`;
        const swatchesContainer = document.getElementById('color-swatches');
        const colors = product.Colores.split(',').map(c => c.trim());
        colors.forEach((colorName, index) => {
            const colorCode = colorMap[colorName.toLowerCase()] || colorName;
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = colorCode;
            swatch.title = colorName;
            if (index === 0) swatch.classList.add('active');
            swatch.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
            swatchesContainer.appendChild(swatch);
        });
    }

    function setupQuantityControls() {
        const decreaseBtn = document.getElementById('decrease-qty');
        const increaseBtn = document.getElementById('increase-qty');
        const quantityInput = document.getElementById('quantity-input');
        increaseBtn.addEventListener('click', () => { quantityInput.value = parseInt(quantityInput.value) + 1; });
        decreaseBtn.addEventListener('click', () => { if (parseInt(quantityInput.value) > 1) { quantityInput.value = parseInt(quantityInput.value) - 1; } });
    }

    function setupImageGallery(product) {
        const mainImage = document.getElementById('main-product-image');
        const thumbnailContainer = document.getElementById('thumbnail-container');
        const images = [product.RutaImagen, product.Imagen2, product.Imagen3, product.Imagen4, product.Imagen5].filter(img => img);
        thumbnailContainer.innerHTML = '';
        images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            if (index === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => {
                mainImage.src = imgSrc;
                document.querySelectorAll('.thumbnail-container img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailContainer.appendChild(thumb);
        });
    }

    function setupWhatsAppButton(product) {
        const whatsappBtn = document.getElementById('whatsapp-btn');
        if (whatsappBtn) {
            const message = encodeURIComponent(`Hola, estoy interesado en el producto: ${product.NombreProducto} (Código: ${product.ID_Producto})`);
            whatsappBtn.href = `https://wa.me/51987654321?text=${message}`;
        }
    }

    function displayRelatedProducts(currentProduct) {
        const relatedContainer = document.getElementById('related-product-list');
        if (!relatedContainer) return;
        const relatedProducts = allProducts.filter(p => p.Categoria === currentProduct.Categoria && p.ID_Producto !== currentProduct.ID_Producto).slice(0, 4);
        if (relatedProducts.length > 0) {
            relatedContainer.innerHTML = '';
            relatedProducts.forEach(product => {
                relatedContainer.innerHTML += `<a href="product.html?id=${product.ID_Producto}" class="product-card-link"><div class="product-card"><div class="image-container"><img src="${product.RutaImagen}" alt="${product.NombreProducto}">${createBadgeHTML(product.Etiqueta)}</div><h3>${product.NombreProducto}</h3><div class="price-container"><span class="current-price">S/ ${product.PrecioActual}</span></div></div></a>`;
            });
            setupCardAnimations();
        } else {
            document.querySelector('.related-products-section').style.display = 'none';
        }
    }
    
    // --- FUNCIONES AYUDANTES REUTILIZABLES ---
    
    function setupCardAnimations() {
        const cards = document.querySelectorAll('.product-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
        }, { threshold: 0.1 });
        cards.forEach(card => observer.observe(card));
    }

    function getBadgeClass(text) {
        if (!text) return '';
        const lowerText = text.toLowerCase();
        if (lowerText === 'nuevo') return 'badge-nuevo';
        if (lowerText === 'oferta') return 'badge-oferta';
        if (lowerText.includes('descuento')) return 'badge-descuento';
        return 'badge-otro';
    }

    function createBadgeHTML(text, isDetailPage = false) {
        if (!text) return '';
        const badgeClass = getBadgeClass(text);
        const style = isDetailPage ? 'position: static; display: inline-block; margin-bottom: 15px;' : '';
        return `<div class="product-badge ${badgeClass}" style="${style}">${text}</div>`;
    }

    // --- LÓGICA PARA EL AÑO DINÁMICO DEL FOOTER ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.textContent = currentYear;
    }
});