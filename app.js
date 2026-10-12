// Base de datos simulada compartida mediante LocalStorage para que persista entre páginas HTML
const schools = [
    "ESIME Zacatenco", "ESIME Ticomán", "ESIME Azcapotzalco", "ESIME Culhuacán", 
    "ESIA Zacatenco", "ESIA Ticomán", "ESIA Tecamachalco", 
    "ESCOM", "ESFM", "ESIQUIE", "ESIT", "UPIITA",
    "ENCB Santo Tomás", "ENCB Zacatenco", "ESM", "ENMH", "ENBA", "ESEO", 
    "CICS Santo Tomás", "CICS Milpa Alta", "UPIBI", 
    "ESCA Santo Tomás", "ESCA Tepepan", "ESE", "EST", "UPIICSA"
];

// Inicializar mockProducts en LocalStorage si no existe
if (!localStorage.getItem('mockProducts')) {
    const initialProducts = [
        { id: 1, name: "Brownies de Chocolate", category: "Comida", stock: 15, school: "ESCOM", global: false, img: "🍫" },
        { id: 2, name: "Reparación de Laptops", category: "Servicios", stock: 99, school: "ESIME Zacatenco", global: true, img: "💻" },
        { id: 3, name: "Calculadora Científica", category: "Tecnología", stock: 1, school: "ESFM", global: false, img: "🖩" }
    ];
    localStorage.setItem('mockProducts', JSON.stringify(initialProducts));
}

// Función para generar la cuadrícula en index.html
function renderSchoolsGrid() {
    const grid = document.getElementById('schools-container');
    if (!grid) return;

    // Aquí puedes mapear cada escuela a la URL de su logo real
    const logos = {
        "CICS Milpa Alta": "https://www.cicsma.ipn.mx/assets/files/cicsma/img/escudos/Escudo_CICS_MA.png",
        "ESCOM": "https://www.escom.ipn.mx/images/conocenos/escudoESCOM.png",
        "ESFM": "https://www.esfm.ipn.mx/assets/files/esfm/img/escudos/Escudo_ESFM.png",
        "ESIME Zacatenco": "https://www.esimez.ipn.mx/assets/files/esimez/img/escudos/esime_zacatenco.png"
        // ... agrega el resto de logos aquí
    };

    schools.forEach(school => {
        // Crear el nombre del archivo HTML (ej. ESIME Zacatenco -> esime-zacatenco.html)
        const filename = school.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[̀-ͯ]/g, "") + ".html";
        
        const card = document.createElement('a');
        card.href = filename;
        card.className = 'school-card';
        
        const imgSrc = logos[school] || "https://upload.wikimedia.org/wikipedia/commons/f/f8/Logo_Instituto_Polit%C3%A9cnico_Nacional.png";

        card.innerHTML = `
            <div class="school-img-placeholder">
                <img src="${imgSrc}" alt="Logo ${school}">
            </div>
            <h3>${school}</h3>
        `;
        grid.appendChild(card);
    });
}

// Funciones para las páginas individuales de cada escuela
function handleProductSubmit(e, currentSchool) {
    e.preventDefault();
    
    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput ? fileInput.files[0] : null;

    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const stock = document.getElementById('prod-stock').value;
    const global = document.getElementById('prod-global').checked;

    // Función auxiliar para guardar y actualizar el producto
    const saveProduct = (imageDataUrl) => {
        let products = JSON.parse(localStorage.getItem('mockProducts')) || [];
        
        products.push({
            id: Date.now(),
            name: name,
            category: category,
            stock: parseInt(stock),
            school: currentSchool,
            global: global,
            img: imageDataUrl // Guardamos la imagen en formato Base64 o un placeholder
        });

        localStorage.setItem('mockProducts', JSON.stringify(products));

        alert("¡Producto publicado exitosamente!");
        document.getElementById('seller-form').reset();
    };

    // Si el usuario subió una foto, la leemos como DataURL (Base64)
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            saveProduct(event.target.result); // La cadena Base64 de la imagen
        };
        reader.readAsDataURL(file);
    } else {
        // En caso de que no haya archivo subido
        saveProduct("https://via.placeholder.com/180?text=Sin+Foto");
    }
}

function renderBuyerView(currentSchool) {
    let products = JSON.parse(localStorage.getItem('mockProducts'));
    const availableProducts = products.filter(p => p.school === currentSchool || p.global);
    renderProductGrid(availableProducts, currentSchool);
}

function renderProductGrid(products, currentSchool) {
    const grid = document.getElementById('products-container');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No hay productos disponibles en esta categoría por el momento.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img">
                <img src="${p.img}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info">
                <span class="badge">${p.category}</span>
                <h3>${p.name}</h3>
                <p style="margin: 0; font-size: 0.9rem; color: #666;">
                    📍 ${p.school} ${p.global && p.school !== currentSchool ? '(Envío Global)' : ''}
                </p>
                <div class="product-footer">
                    <span class="stock">${p.stock} unidades disp.</span>
                    <button class="btn" style="width: 100%; margin-top: 10px;" onclick="contactSeller('${p.name}')">Contactar Vendedor</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts(currentSchool) {
    const cat = document.getElementById('filter-category').value;
    let products = JSON.parse(localStorage.getItem('mockProducts'));
    let filtered = products.filter(p => p.school === currentSchool || p.global);
    
    if (cat !== "All") {
        filtered = filtered.filter(p => p.category === cat);
    }
    
    renderProductGrid(filtered, currentSchool);
}

function contactSeller(productName) {
    alert(`En el futuro, esto abrirá un chat o WhatsApp con el vendedor de: ${productName}`);
}
