document.addEventListener('DOMContentLoaded', function() {
    
    // --- URLs Y VARIABLES GLOBALES ---
    const productsURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSspDYo7SSi2msZURs5tUzGzg7TBuOSVW0_4yS7SnoGnuln5dXQ1bCh8oRa3FVGLwDKzuh85iLNzADe/pub?gid=0&single=true&output=csv';
    // ¡¡¡MUY IMPORTANTE!!! Pega aquí la NUEVA URL de tu hoja "Configuracion"
    const configURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSspDYo7SSi2msZURs5tUzGzg7TBuOSVW0_4yS7SnoGnuln5dXQ1bCh8oRa3FVGLwDKzuh85iLNzADe/pub?gid=1964441751&single=true&output=csv'; 

    let allProducts = [];
    let siteConfig = {};
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    // --- ELEMENTOS DEL DOM ---
    const cartIcon = document.querySelector('.cart-icon');
    const cartCounter = document.querySelector('.cart-counter');
    const cartModal = document.getElementById('cart-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const whatsappCheckoutBtn = document.getElementById('whatsapp-checkout-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const productContainer = document.getElementById('product-list');
    const filterContainer = document.querySelector('.filter-container');
    const productDetailContainer = document.getElementById('product-detail-content');
    const yearSpan = document.getElementById('current-year');

    // --- CARGA INICIAL DE DATOS ---
    function loadAllData() {
        Promise.all([
            fetch(productsURL).then(res => res.text()),
            fetch(configURL).then(res => res.text())
        ])
        .then(([productsCSV, configCSV]) => {
            Papa.parse(productsCSV, {
                header: true,
                complete: (results) => {
                    allProducts = results.data.filter(p => p.Estado === 'Activo' && p.ID_Producto);
                }
            });

            Papa.parse(configCSV, {
                header: true,
                complete: (results) => {
                    results.data.forEach(item => { siteConfig[item.Clave] = item; });
                }
            });
            document.dispatchEvent(new CustomEvent('dataLoaded'));
        })
        .catch(error => console.error('Error al cargar los datos:', error));
    }

    // --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
    function initializeApp() {
        applySiteConfig();
        updateCartUI();
        
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', () => navMenu.classList.toggle('active'));
        }

        if (productContainer) {
            displayProducts(allProducts);
            createCategoryFilters();
        }
        if (productDetailContainer) {
            initializeProductDetailPage();
        }

        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    }

    // --- EVENT LISTENERS GLOBALES ---
    document.addEventListener('dataLoaded', initializeApp);
    loadAllData();
    
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => { e.preventDefault(); if(cartModal) cartModal.classList.add('active'); });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => cartModal.classList.remove('active'));
    }
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        const addToCartButton = e.target.closest('.add-to-cart-btn');
        const removeFromCartButton = e.target.closest('.remove-item-btn');

        if (addToCartButton) {
            e.preventDefault();
            const productId = addToCartButton.dataset.productId;
            const quantityInput = document.getElementById('quantity-input');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
            addToCart(productId, quantity);
        }

        if (removeFromCartButton) {
            e.preventDefault();
            const productId = removeFromCartButton.dataset.productId;
            removeFromCart(productId);
        }
    });

    // --- FUNCIONES DEL CARRITO ---
    function saveCart() { localStorage.setItem('shoppingCart', JSON.stringify(cart)); }
    function clearCart() { cart = []; saveCart(); updateCartUI(); }
    function removeFromCart(productId) { cart = cart.filter(item => item.id !== productId); saveCart(); updateCartUI(); }

    function updateCartUI() {
        if (!cartCounter) return;
        cartCounter.textContent = cart.reduce((sum, item) => sum + item.cantidad, 0);
        cartCounter.style.display = cart.length > 0 ? 'flex' : 'none';

        if (!cartItemsContainer) return;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
            cartTotalPriceEl.textContent = 'S/ 0.00';
            if (whatsappCheckoutBtn) whatsappCheckoutBtn.style.display = 'none';
            if (clearCartBtn) clearCartBtn.style.display = 'none';
            return;
        }

        if (whatsappCheckoutBtn) whatsappCheckoutBtn.style.display = 'inline-flex';
        if (clearCartBtn) clearCartBtn.style.display = 'inline-block';
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;
        cart.forEach(item => {
            const itemSubtotal = parseFloat(item.precio) * item.cantidad;
            totalPrice += itemSubtotal;
            cartItemsContainer.innerHTML += `<div class="cart-item"><img src="${item.imagen}" alt="${item.nombre}"><div class="cart-item-info"><h4>${item.nombre}</h4><p>Código: ${item.id}</p><p>Precio: S/ ${parseFloat(item.precio).toFixed(2)} x ${item.cantidad}</p><p><strong>Subtotal: S/ ${itemSubtotal.toFixed(2)}</strong></p></div><button class="remove-item-btn" data-product-id="${item.id}" title="Eliminar producto"><i class="fas fa-trash-alt"></i></button></div>`;
        });
        cartTotalPriceEl.textContent = `S/ ${totalPrice.toFixed(2)}`;
        updateWhatsAppLink(totalPrice);
    }
    
    function updateWhatsAppLink(totalPrice) {
        if (!whatsappCheckoutBtn || !siteConfig.whatsapp_numero) return;
        let message = 'Hola, estoy interesado en realizar el siguiente pedido:\n\n';
        cart.forEach(item => {
            message += `*Producto:* ${item.nombre}\n*Código:* ${item.id}\n*Cantidad:* ${item.cantidad}\n*Subtotal:* S/ ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}\n\n`;
        });
        message += `*TOTAL DEL PEDIDO:* S/ ${totalPrice.toFixed(2)}`;
        const whatsappURL = `https://wa.me/${siteConfig.whatsapp_numero.Valor1}?text=${encodeURIComponent(message)}`;
        whatsappCheckoutBtn.href = whatsappURL;
    }

    function addToCart(productId, quantity) {
        const product = allProducts.find(p => p.ID_Producto === productId);
        if (!product) return;
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.cantidad += quantity;
        } else {
            cart.push({ id: product.ID_Producto, nombre: product.NombreProducto, precio: product.PrecioActual, imagen: product.RutaImagen, cantidad: quantity });
        }
        saveCart();
        updateCartUI();
        alert('¡Producto añadido al carrito!');
    }
    
    // --- FUNCIONES DE LA PÁGINA PRINCIPAL ---
    function displayProducts(products) {
        if (!productContainer) return;
        productContainer.innerHTML = '';
        products.forEach(product => {
            productContainer.innerHTML += `<a href="product.html?id=${product.ID_Producto}" class="product-card-link"><div class="product-card"><div class="image-container"><img src="${product.RutaImagen}" alt="${product.NombreProducto}">${createBadgeHTML(product.Etiqueta)}</div><p class="category">${product.Categoria}</p><h3>${product.NombreProducto}</h3><p class="description">${product.Descripcion}</p><div class="price-container">${product.PrecioAnterior ? `<span class="old-price">S/ ${product.PrecioAnterior}</span>` : ''}<span class="current-price">S/ ${product.PrecioActual}</span></div><button class="add-to-cart-btn" data-product-id="${product.ID_Producto}">Añadir al carrito</button></div></a>`;
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

    // --- FUNCIONES DE LA PÁGINA DE DETALLE ---
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
            setupQuantityControls();
            displayRelatedProducts(product);
        } else {
            productDetailContainer.innerHTML = '<h2>Producto no encontrado</h2>';
        }
    }

    function createProductDetailHTML(product) {
    return `
        <div class="product-detail-container">
            <div class="product-gallery">
                <div class="main-image-container">
                    <img src="${product.RutaImagen}" alt="${product.NombreProducto}" id="main-product-image">
                </div>
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
                    <a href="#" id="whatsapp-btn" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;
}
    // ... todas las demás funciones de la página de detalle también se mantienen
    
    // --- FUNCIONES AYUDANTES ---
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
    function getBadgeClass(text) {
    if (!text) return '';
    const lowerText = text.toLowerCase();
    
    if (lowerText === 'nuevo') {
        return 'badge-nuevo';
    } else if (lowerText === 'oferta') {
        return 'badge-oferta';
    } else if (lowerText.includes('descuento')) {
        return 'badge-descuento';
    } else {
        return 'badge-otro';
    }
}
    function createBadgeHTML(text, isDetailPage = false) {
    if (!text) return '';
    const badgeClass = getBadgeClass(text);
    // Este estilo dinámico es crucial para que la etiqueta se comporte
    // correctamente en la página de detalle (sin flotar).
    const style = isDetailPage ? 'position: static; display: inline-block; margin-bottom: 15px;' : '';
    
    return `<div class="product-badge ${badgeClass}" style="${style}">${text}</div>`;
}

    // Rellenamos aquí el resto de funciones que no cambian para que el código esté completo
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
            swatch.addEventListener('click', () => { document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active')); swatch.classList.add('active'); });
            swatchesContainer.appendChild(swatch);
        });
    }
    function setupQuantityControls() {
        const decreaseBtn = document.getElementById('decrease-qty');
        const increaseBtn = document.getElementById('increase-qty');
        const quantityInput = document.getElementById('quantity-input');
        if(!decreaseBtn) return;
        increaseBtn.addEventListener('click', () => { quantityInput.value = parseInt(quantityInput.value) + 1; });
        decreaseBtn.addEventListener('click', () => { if (parseInt(quantityInput.value) > 1) { quantityInput.value = parseInt(quantityInput.value) - 1; } });
    }
    function setupImageGallery(product) {
        const mainImage = document.getElementById('main-product-image');
        const thumbnailContainer = document.getElementById('thumbnail-container');
        if(!mainImage) return;
        const images = [product.RutaImagen, product.Imagen2, product.Imagen3, product.Imagen4, product.Imagen5].filter(img => img && img.trim() !== '');
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
        if (whatsappBtn && siteConfig.whatsapp_numero) {
            const message = encodeURIComponent(`Hola, estoy interesado en el producto: ${product.NombreProducto} (Código: ${product.ID_Producto})`);
            whatsappBtn.href = `https://wa.me/${siteConfig.whatsapp_numero.Valor1}?text=${message}`;
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
            const relatedSection = document.querySelector('.related-products-section');
            if(relatedSection) relatedSection.style.display = 'none';
        }
    }
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
});