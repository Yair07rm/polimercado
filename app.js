import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://samlcszygcynpljpqeyd.supabase.co';

// ⚠️ REEMPLAZA ESTO por la llave larga de la primera captura (la que dice 'anon' 'public') o de la segunda captura (Publishable)
const SUPABASE_ANON_KEY = 'sb_publishable_agJtHWm-2RsC1ef1_5H2Zg_XQaYAZ5j'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. VARIABLES GLOBALES Y UTILIDADES
// ==========================================
const schools = [
    "ESIME Zacatenco", "ESIME Ticomán", "ESIME Azcapotzalco", "ESIME Culhuacán", 
    "ESIA Zacatenco", "ESIA Ticomán", "ESIA Tecamachalco", 
    "ESCOM", "ESFM", "ESIQUIE", "ESIT", "UPIITA",
    "ENCB Santo Tomás", "ENCB Zacatenco", "ESM", "ENMH", "ENBA", "ESEO", 
    "CICS Santo Tomás", "CICS Milpa Alta", "UPIBI", 
    "ESCA Santo Tomás", "ESCA Tepepan", "ESE", "EST", "UPIICSA"
];

let currentProducts = []; // Para no tener que consultar la BD cada vez que filtramos

// Genera la cuadrícula de inicio
export function renderSchoolsGrid() {
    const grid = document.getElementById('schools-container');
    if (!grid) return;

    const logos = {
        "CICS Milpa Alta": "https://ipn.mx/assets/files/saes/img/ns/cics-ma.png",
        "ESCOM": "https://www.escom.ipn.mx/images/conocenos/escudoESCOM.png",
        "ESFM": "https://www.esfm.ipn.mx/assets/files/esfm/img/escudos/Escudo_ESFM.png",
        "ESIME Zacatenco": "https://ipn.mx/assets/files/saes/img/ns/esime-azc.png",
        "ESIME Azcapotzalco": "https://ipn.mx/assets/files/saes/img/ns/esime-azc.png",
        "CICS Santo Tomás": "https://cics-sto.ipn.mx/assets/files/cicssto/img/conocenos/logocicsstf.png",
        "ESIME Culhuacán": "https://ipn.mx/assets/files/saes/img/ns/esime-azc.png",
        "ESIME Ticomán": "https://ipn.mx/assets/files/saes/img/ns/esime-tic.png",
        "ESIA Zacatenco": "https://ipn.mx/assets/files/saes/img/ns/esia-tec.png",
        "ESIA Ticomán": "https://ipn.mx/assets/files/saes/img/ns/esia-tec.png",
        "ESIA Tecamachalco": "https://ipn.mx/assets/files/saes/img/ns/esia-tec.png",
        "ESFM": "https://ipn.mx/assets/files/saes/img/ns/esfm.png",
        "ESIQUIE": "https://ipn.mx/assets/files/saes/img/ns/esiqie.png",
        "ESIT": "https://ipn.mx/assets/files/saes/img/ns/esit.png",
        "UPIITA": "https://ipn.mx/assets/files/saes/img/ns/upiita.png",
        "ENCB Santo Tomás": "https://ipn.mx/assets/files/saes/img/ns/encb.png",
        "ENCB Zacatenco": "https://ipn.mx/assets/files/saes/img/ns/encb.png",
        "ESM": "https://ipn.mx/assets/files/saes/img/ns/esm.png",
        "ENMH": "https://ipn.mx/assets/files/saes/img/ns/enmh.png",
        "ENBA": "https://ipn.mx/assets/files/saes/img/ns/enba.png",
        "ESEO": "https://ipn.mx/assets/files/saes/img/ns/eseo.png", 
        "UPIBI": "https://ipn.mx/assets/files/saes/img/ns/upiibi.png",
        "ESCA Santo Tomás": "https://ipn.mx/assets/files/saes/img/ns/esca-sto.png",
        "ESCA Tepepan": "https://ipn.mx/assets/files/saes/img/ns/esca-tep.png",
        "ESE": "https://ipn.mx/assets/files/saes/img/ns/ese.png",
        "EST": "https://ipn.mx/assets/files/saes/img/ns/est.png",
        "UPIICSA": "https://ipn.mx/assets/files/saes/img/ns/upiicsa.png"


    };

    schools.forEach(school => {
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

// ==========================================
// 3. VISTA DE VENDEDOR (SUBIR PRODUCTOS Y FOTO)
// ==========================================
window.handleProductSubmit = async function(e, currentSchoolName) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Publicando... ⏳";
    submitBtn.disabled = true;

    try {
        const fileInput = e.target.querySelector('input[type="file"]');
        const file = fileInput ? fileInput.files[0] : null;

        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const stock = parseInt(document.getElementById('prod-stock').value);
        const global = document.getElementById('prod-global').checked;

        let publicImageUrl = "https://via.placeholder.com/180?text=Sin+Foto";

        // A) Subir imagen al Bucket "productos" de Supabase Storage
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('productos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Obtener URL pública para guardarla en la tabla
            const { data: urlData } = supabase.storage
                .from('productos')
                .getPublicUrl(fileName);
                
            publicImageUrl = urlData.publicUrl;
        }

        // B) Buscar el ID de la escuela
        const { data: escuelaData, error: escuelaError } = await supabase
            .from('escuelas')
            .select('id')
            .eq('nombre', currentSchoolName)
            .single();

        if (escuelaError) throw escuelaError;

        // C) Insertar en la tabla SQL
        const { error: insertError } = await supabase
            .from('productos')
            .insert([{
                nombre: name,
                categoria: category,
                unidades_disponibles: stock,
                es_global: global,
                imagen_url: publicImageUrl,
                escuela_id: escuelaData.id
            }]);

        if (insertError) throw insertError;

        alert("¡Producto publicado exitosamente!");
        document.getElementById('seller-form').reset();

    } catch (err) {
        console.error("Error al publicar:", err);
        alert("Hubo un error al publicar: " + err.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// ==========================================
// 4. VISTA DE COMPRADOR (LEER POSTGRESQL)
// ==========================================
window.renderBuyerView = async function(currentSchoolName) {
    const grid = document.getElementById('products-container');
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Cargando productos de Supabase... 🔄</p>';

    try {
        const { data: escuelaData } = await supabase
            .from('escuelas')
            .select('id')
            .eq('nombre', currentSchoolName)
            .single();

        const currentSchoolId = escuelaData ? escuelaData.id : 0;

        // JOIN entre tabla productos y escuelas
        const { data: productosData, error } = await supabase
            .from('productos')
            .select(`
                *,
                escuelas ( nombre )
            `)
            .or(`escuela_id.eq.${currentSchoolId},es_global.eq.true`)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        currentProducts = productosData; // Guardamos globalmente para filtrar luego
        renderProductGrid(currentProducts, currentSchoolName);

    } catch (err) {
        console.error("Error al obtener productos:", err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: red;">Error de conexión. Revisa que tu llave anon sea correcta y las políticas RLS.</p>';
    }
}

window.renderProductGrid = function(products, currentSchool) {
    const grid = document.getElementById('products-container');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if(!products || products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No hay productos disponibles en esta categoría por el momento.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const schoolName = p.escuelas ? p.escuelas.nombre : 'Desconocida';
        const isGlobalString = (p.es_global && schoolName !== currentSchool) ? '(Envío Global)' : '';
        
        card.innerHTML = `
            <div class="product-img">
                <img src="${p.imagen_url}" alt="${p.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info">
                <span class="badge">${p.categoria}</span>
                <h3>${p.nombre}</h3>
                <p style="margin: 0; font-size: 0.9rem; color: #666;">
                    📍 ${schoolName} ${isGlobalString}
                </p>
                <div class="product-footer">
                    <span class="stock">${p.unidades_disponibles} unidades disp.</span>
                    <button class="btn" style="width: 100%; margin-top: 10px;" onclick="contactSeller('${p.nombre}')">Contactar Vendedor</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.filterProducts = function(currentSchool) {
    const cat = document.getElementById('filter-category').value;
    let filtered = currentProducts;
    
    if (cat !== "All") {
        filtered = currentProducts.filter(p => p.categoria === cat);
    }
    renderProductGrid(filtered, currentSchool);
}

window.contactSeller = function(productName) {
    alert(`En el futuro, esto abrirá un chat o WhatsApp con el vendedor de: ${productName}`);
}
