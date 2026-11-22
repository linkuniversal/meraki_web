/* ==========================================================================
   MERAKI · MOTOR DE CATÁLOGO INSTANTÁNEO (MULTI-FOTO + CLOUDFLARE D1)
   ========================================================================== */

const CONFIG = {
    WHATSAPP_NUMBER: "5493757525802",
    GITHUB_OWNER: "linkuniversal",
    GITHUB_REPO: "meraki_web",
    GITHUB_BRANCH: "main",

    API_CATALOG_URL: "/api/catalog",
    APPS_SCRIPT_URL: "",

    CACHE_KEY: "meraki_d1_cache_v2",

    RATES: {
        ARS_TO_PYG: 6.5,
        ARS_TO_BRL: 0.005
    }
};

let PRODUCTS = [];

const COLOR_MAP = {
    "blanco": "#FFFFFF", "off white": "#F8F6F0", "manteca": "#FBF7EE",
    "natural": "#EFECE6", "crudo": "#EDE6D8", "marfil": "#FAF6EB",
    "crema": "#F5ECD7", "hueso": "#F2EDE2", "beige": "#D8C3A5",
    "arena": "#DCCDB6", "madera": "#A47551", "nude": "#E3C5B0", "vison": "#B8A695",
    "taupe": "#8C7D70", "camel": "#C19A6B", "tostado": "#A97B50",
    "marron": "#5C3A28", "chocolate": "#3D2418", "negro": "#141414",
    "gris": "#8E9196", "gris claro": "#C9CDD1", "gris melange": "#A5A9AE",
    "azul": "#1F4E8C", "azul marino": "#162642", "marino": "#162642",
    "celeste": "#9EC4E8", "sky": "#C3D6FF", "jean": "#48698E", "denim": "#48698E",
    "verde": "#2E6B47", "salvia": "#8FA692", "oliva": "#646B3F", "militar": "#4A5633",
    "rojo": "#B81D24", "bordo": "#600000", "borravino": "#600000", "vino": "#600000",
    "terracota": "#B85A3A", "coral": "#E66E5E", "amarillo": "#EBC23F",
    "rosa": "#EBA4B5", "rosa viejo": "#C48A95", "fucsia": "#C92A76", "lila": "#C5A8D9"
};

function normalizeColorKey(str) {
    let key = String(str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9#\s]/g, " ").replace(/\s+/g, " ").trim();
    if (COLOR_MAP[key]) return key;
    const gender = [[/blanca$/, "blanco"], [/negra$/, "negro"], [/roja$/, "rojo"], [/amarilla$/, "amarillo"], [/cruda$/, "crudo"], [/tostada$/, "tostado"]];
    for (const [rx, rep] of gender) {
        const cand = key.replace(rx, rep);
        if (COLOR_MAP[cand]) return cand;
    }
    return key;
}

function parseColors(raw) {
    if (!raw) return [];
    const tokens = String(raw).replace(/\s+y\s+/gi, ",").split(/[,/|;&+]+/).map(s => s.trim()).filter(Boolean);
    const seen = new Set(), res = [];
    for (const t of tokens) {
        let hex = t.startsWith('#') ? t.toUpperCase() : COLOR_MAP[normalizeColorKey(t)];
        if (!hex) hex = "#D8D4CE";
        const name = t.charAt(0).toUpperCase() + t.slice(1);
        const upperHex = hex.toUpperCase();
        if (!seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            res.push({
                name,
                hex,
                light: ['#FFFFFF', '#F8F6F0', '#FBF7EE', '#FAF6EB', '#EFECE6'].includes(upperHex)
            });
        }
    }
    return res;
}

function parseTalles(raw) {
    const clean = String(raw || "").trim();
    if (!clean) return { list: ["A confirmar"], label: "A confirmar" };
    const list = clean.split(/[,/|]+/).map(t => t.trim()).filter(Boolean);
    return { list: list.length ? list : ["A confirmar"], label: list.join(' · ') };
}

function parseTitleAndExtractMeta(rawTitle) {
    let title = String(rawTitle || "").trim();
    let extractedColors = [], extractedTalles = [];

    const colorMatch = title.match(/\(?color:\s*([^)]+)\)?/i);
    if (colorMatch) {
        extractedColors = parseColors(colorMatch[1]);
        title = title.replace(colorMatch[0], "").trim();
    }

    const talleMatch = title.match(/\(?talles?:\s*([^)]+)\)?/i);
    if (talleMatch) {
        extractedTalles = talleMatch[1].split(/[/,|-]+/).map(t => t.trim()).filter(Boolean);
        title = title.replace(talleMatch[0], "").trim();
    }

    title = title.replace(/\(\s*\)/g, "").replace(/\s*[/–-]\s*$/, "").trim();
    return { cleanTitle: title, extractedColors, extractedTalles };
}

function parsePriceCell(val) {
    const str = String(val || "").trim();
    if (!str) return [0];
    if (str.includes('/')) {
        return str.split('/').map(p => Number(p.replace(/[.,]\d{2}$/, '').replace(/[^0-9]/g, '')) || 0);
    }
    return [Number(str.replace(/[.,]\d{2}$/, '').replace(/[^0-9]/g, '')) || 0];
}

function resolveAssetUrl(relPath) {
    if (!relPath) return '';
    if (relPath.startsWith('http://') || relPath.startsWith('https://') || relPath.startsWith('data:')) return relPath;
    const encoded = relPath.split('/').map(seg => encodeURIComponent(seg)).join('/');
    return `https://raw.githubusercontent.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/${encoded}`;
}

function getProductPrice(item, curr = activeCurrency) {
    const ars = item.precioARS || 0;
    if (curr === 'ARS') return ars;
    if (curr === 'PYG') return (item.precioPYG > 0) ? item.precioPYG : (ars > 0 ? Math.round((ars * CONFIG.RATES.ARS_TO_PYG) / 1000) * 1000 : 0);
    if (curr === 'BRL') return (item.precioBRL > 0) ? item.precioBRL : (ars > 0 ? Math.round(ars * CONFIG.RATES.ARS_TO_BRL) : 0);
    return ars;
}

function formatMoney(amount, curr = activeCurrency) {
    if (!amount || amount <= 0) return 'Consultar';
    if (curr === 'ARS') return '$ ' + amount.toLocaleString('es-AR');
    if (curr === 'PYG') return '₲ ' + amount.toLocaleString('es-PY');
    if (curr === 'BRL') return 'R$ ' + amount.toLocaleString('pt-BR');
    return '$ ' + amount;
}

function mapApiItemsToProducts(rawItems) {
    return rawItems
        .filter(it => it && it.visible !== false)
        .map((it, idx) => {
            const { cleanTitle, extractedColors, extractedTalles } = parseTitleAndExtractMeta(it.nombre || '');
            const prices = parsePriceCell(it.precioARS);
            const pygVal = parsePriceCell(it.precioPYG)[0] || 0;
            const brlVal = parsePriceCell(it.precioBRL)[0] || 0;

            let finalTalles = it.talles ? parseTalles(it.talles).list : [];
            if (extractedTalles.length > 0) finalTalles = [...new Set([...finalTalles, ...extractedTalles])];
            if (finalTalles.length === 0) finalTalles = ["A confirmar"];

            let finalColors = it.colores ? parseColors(it.colores) : [];
            if (extractedColors.length > 0) finalColors = [...finalColors, ...extractedColors];

            const hasTwoPrices = prices.length > 1;
            let subItems = [];
            if (hasTwoPrices) {
                const names = cleanTitle.split('/').map(n => n.trim());
                subItems = names.map((namePart, i) => ({
                    name: namePart,
                    priceARS: prices[i] || prices[0] || 0
                }));
            }

            // Soporte multi-foto retrocompatible con productos de 1 foto
            const rawFotos = (Array.isArray(it.fotos) && it.fotos.length > 0)
                ? it.fotos.filter(Boolean)
                : (it.foto ? [it.foto] : []);
            const resolvedFotos = rawFotos.map(resolveAssetUrl);

            return {
                id: it.id || `mk-${idx}`,
                rubro: it.rubro || 'Indumentaria',
                subcategoria: it.subcategoria || 'Mujer',
                nombre: cleanTitle || 'Pieza Exclusiva MeraKi',
                precioARS: prices[0] || 0,
                precioPYG: pygVal,
                precioBRL: brlVal,
                preciosArray: prices,
                isCombo: hasTwoPrices,
                subItems,
                descripcion: it.descripcion || '',
                imagen: resolvedFotos[0] || '',
                imagenes: resolvedFotos,
                etiqueta: it.etiqueta || (hasTwoPrices ? 'LOOK / 2 PIEZAS' : ''),
                talles: finalTalles,
                tallesLabel: finalTalles.join(' · '),
                colores: finalColors,
                destacado: Boolean(it.destacado)
            };
        });
}

async function loadCatalog() {
    let rendered = false;
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.data && parsed.data.length) {
                PRODUCTS = parsed.data;
                rendered = true;
                afterCatalogLoaded();
            }
        }
    } catch (_) {}

    if (!rendered && typeof renderSkeletonStates === 'function') renderSkeletonStates();

    try {
        const res = await fetch(`${CONFIG.API_CATALOG_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (json.ok && Array.isArray(json.items)) {
            const fresh = mapApiItemsToProducts(json.items);
            const freshSig = JSON.stringify(fresh);
            const prevSig = PRODUCTS.length ? JSON.stringify(PRODUCTS) : '';
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({ ts: Date.now(), data: fresh }));
            if (!rendered || freshSig !== prevSig) {
                PRODUCTS = fresh;
                afterCatalogLoaded();
            }
        }
    } catch (e) {
        console.warn('API D1 no disponible aún en este entorno');
    }
}
