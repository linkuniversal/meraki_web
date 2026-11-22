/* ==========================================================================
   MERAKI · MOTOR INTERACTIVO, HISTORY API, MULTI-FOTO, VIDEO Y URL LIMPIA
   ========================================================================== */

let activeCurrency = localStorage.getItem('meraki_currency') || 'ARS';
let currentView = 'home'; // 'home' | 'category'
let activeRubro = 'Todo';
let activeSubcat = 'Todas';
let activeHomeSection = 'home';
let searchQuery = '';
let shoppingBag = JSON.parse(localStorage.getItem('meraki_bag') || '[]');
let currentPdpProduct = null;
let currentPdpSize = 'A confirmar';
let currentPdpComboSelection = 'all';
let currentPdpGalleryIndex = 0;

const CATEGORY_BATCH_SIZE = 12;
let currentCategoryFiltered = [];
let currentCategoryRenderedCount = 0;
let categoryBatchObserver = null;

let modalStateStack = [];

function isVideoPath(p) {
    return /\.(mp4|webm|mov)$/i.test(String(p || '').split('?')[0]);
}

function applySmartFit(el) {
    if (el) el.classList.add('fit-contain');
}

function fallbackToGithubRaw(el) {
    if (!el || el.dataset.fbDone) return;
    el.dataset.fbDone = '1';
    try {
        const u = new URL(el.src, location.origin);
        if (u.origin === location.origin && u.pathname.startsWith('/media/')) {
            el.src = `https://raw.githubusercontent.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}${u.pathname}`;
        }
    } catch (_) {}
}

function loadHoverMedia(cardEl) {
    const el = cardEl && cardEl.querySelector('.product-img-hover[data-hover-src]');
    if (!el) return;
    el.src = el.dataset.hoverSrc;
    el.removeAttribute('data-hover-src');
}

function initHeroVideo() {
    const vid = document.getElementById('heroVideoPlayer');
    if (!vid) return;
    if (vid.dataset.loaded === '1') {
        vid.play().catch(() => {});
        return;
    }
    const src = vid.getAttribute('data-src');
    const fb = vid.getAttribute('data-fallback');
    if (!src) return;
    vid.dataset.loaded = '1';
    vid.innerHTML = `<source src="${src}" type="video/mp4">` + (fb ? `<source src="${fb}" type="video/mp4">` : '');
    vid.load();
    vid.play().catch(() => {});
}

function pushHistoryState(modalId) {
    modalStateStack.push(modalId);
    if (!history.state || !history.state.modalOpen) {
        history.pushState({ modalOpen: true, modalId }, '');
    }
}

window.addEventListener('popstate', () => {
    if (modalStateStack.length > 0) {
        modalStateStack = [];
        closeOverlayWithoutHistory();
    }
});

function buildSkeletonCards(count) {
    return Array.from({ length: count }, () => `
        <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-box skeleton-img"></div>
            <div class="skeleton-box skeleton-line1"></div>
            <div class="skeleton-box skeleton-line2"></div>
            <div class="skeleton-box skeleton-line3"></div>
        </div>
    `).join('');
}

function renderSkeletonStates() {
    const homeGrid = document.getElementById('homeCuratedGrid');
    const catGrid = document.getElementById('categoryProductsGrid');
    if (homeGrid && !homeGrid.children.length) homeGrid.innerHTML = buildSkeletonCards(6);
    if (catGrid && !catGrid.children.length) catGrid.innerHTML = buildSkeletonCards(8);
}

function setCurrency(curr) {
    playTap();
    activeCurrency = curr;
    localStorage.setItem('meraki_currency', curr);
    document.querySelectorAll('.curr-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.curr === curr);
    });
    if (PRODUCTS.length > 0) {
        if (currentView === 'home') renderHomeCuratedGrid();
        if (currentView === 'category') renderCategoryGrid();
    }
    renderBagDrawer();
    if (currentPdpProduct && document.getElementById('pdpModal').classList.contains('open')) {
        updatePdpPrices(currentPdpProduct);
        updatePdpWppLink();
    }
}

function getOrderedRubros() {
    const orderedPriority = ['Indumentaria', 'Deco & Home', 'Accesorios', 'Carteras y Calzados'];
    const existing = [...new Set(PRODUCTS.map(p => p.rubro).filter(Boolean))];
    return existing.sort((a, b) => {
        const ia = orderedPriority.indexOf(a), ib = orderedPriority.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

function afterCatalogLoaded() {
    buildTopBarAndUniverses();
    handleRouteFromHash();
    if (currentView === 'home') {
        renderHomeCuratedGrid();
    }
}

function buildTopBarAndUniverses() {
    const rubros = getOrderedRubros();
    const topBar = document.getElementById('topCategoriesBar');
    let html = `<button class="top-cat-pill ${currentView === 'home' && activeHomeSection === 'home' ? 'active' : ''}" data-nav="home" onclick="navigateToHome(event)">Inicio</button>`;
    rubros.forEach(r => {
        const isAct = currentView === 'category' && activeRubro === r;
        html += `<button class="top-cat-pill ${isAct ? 'active' : ''}" data-nav="cat-${r}" onclick="navigateToCategory('${r}')">${r}</button>`;
    });
    html += `
        <button class="top-cat-pill ${currentView === 'home' && activeHomeSection === 'bienestar' ? 'active' : ''}" data-nav="bienestar" onclick="scrollToSection(event, 'bienestar')">7 Intenciones</button>
        <button class="top-cat-pill ${currentView === 'home' && activeHomeSection === 'contacto' ? 'active' : ''}" data-nav="contacto" onclick="scrollToSection(event, 'contacto')">Contacto</button>
        <button class="top-cat-pill ${currentView === 'home' && activeHomeSection === 'ubicacion' ? 'active' : ''}" data-nav="ubicacion" onclick="scrollToSection(event, 'ubicacion')">Showroom</button>
    `;
    topBar.innerHTML = html;

    const portalsGrid = document.getElementById('universesPortalGrid');
    const tileClasses = {
        'Indumentaria':        { cls: 'tile-indumentaria', sub: 'Tendencia & Básicas' },
        'Deco & Home':         { cls: 'tile-deco',         sub: 'Refugio & Diseño' },
        'Accesorios':          { cls: 'tile-bazar',        sub: 'Detalles & Estilo' },
        'Carteras y Calzados': { cls: 'tile-aromas',       sub: 'Carteras, Bolsos & Calzados' }
    };

    portalsGrid.innerHTML = rubros.map((r, i) => {
        const count = PRODUCTS.filter(p => p.rubro === r).length;
        const conf = tileClasses[r] || { cls: 'tile-bazar', sub: 'Colección MeraKi' };
        return `
            <article class="universe-tile ${conf.cls}" onclick="navigateToCategory('${r}')">
                <div class="tile-top">
                    <span>0${i + 1} · ${count} ${count === 1 ? 'pieza' : 'piezas'}</span>
                    <span>↗</span>
                </div>
                <div>
                    <h3 class="tile-name">${r}</h3>
                    <p class="tile-sub">${conf.sub}</p>
                </div>
            </article>
        `;
    }).join('');

    const mobileMenu = document.getElementById('mobileMenuBody');
    mobileMenu.innerHTML = `
        <span class="product-sub-kicker" style="color:var(--ink-light);">Páginas de Colección</span>
        <button onclick="navigateToHome(event); closeAllOverlays();" style="text-align:left; font-size:1.15rem; font-weight:700; padding:7px 0; border-bottom:1px solid var(--hairline); text-transform:uppercase;">Inicio</button>
        ${rubros.map(r => `
            <button onclick="navigateToCategory('${r}'); closeAllOverlays();" style="text-align:left; font-size:1.15rem; font-weight:700; padding:7px 0; border-bottom:1px solid var(--hairline); text-transform:uppercase;">${r}</button>
        `).join('')}

        <div class="drawer-menu-actions">
            <span class="product-sub-kicker" style="color:var(--ink-light); margin-top:4px;">Experiencia &amp; Atención</span>
            <button type="button" class="drawer-action-btn" onclick="scrollToSection(event, 'bienestar'); closeAllOverlays();">
                <span class="drawer-action-left">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                    <span>7 Días · 7 Intenciones</span>
                </span>
                <span class="drawer-action-arrow">→</span>
            </button>
            <button type="button" class="drawer-action-btn" onclick="scrollToSection(event, 'contacto'); closeAllOverlays();">
                <span class="drawer-action-left">
                    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                    <span>Escribinos por Email</span>
                </span>
                <span class="drawer-action-arrow">→</span>
            </button>
            <button type="button" class="drawer-action-btn" onclick="scrollToSection(event, 'ubicacion'); closeAllOverlays();">
                <span class="drawer-action-left">
                    <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>Showroom Ushuaia 196</span>
                </span>
                <span class="drawer-action-arrow">→</span>
            </button>
        </div>

        <div class="drawer-social-row">
            <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" class="btn-wpp-solicitar" onclick="playTap()">Solicitar por WhatsApp</a>
            <a href="https://www.instagram.com/merakicvm/" target="_blank" rel="noopener noreferrer" class="btn-ig-square" aria-label="Instagram MeraKi" onclick="playTap()">
                <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
        </div>
    `;
}

function setActiveHeaderTab(navKey) {
    document.querySelectorAll('#topCategoriesBar .top-cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nav === navKey);
    });
}

function navigateToHome(e) {
    if (e) e.preventDefault();
    playTap();
    currentView = 'home';
    activeHomeSection = 'home';
    searchQuery = '';
    const input = document.getElementById('catalogSearchInput');
    if (input) input.value = '';
    document.getElementById('searchExpandBar').classList.remove('open');
    document.getElementById('pageCategoryView').classList.remove('active');
    document.getElementById('pageHomeView').classList.add('active');
    if (PRODUCTS.length > 0 && !document.querySelector('#homeCuratedGrid .product-card-minimal')) {
        renderHomeCuratedGrid();
    }
    initHeroVideo();
    if (location.hash) history.replaceState(null, '', window.location.pathname);
    setActiveHeaderTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateFloatingVisibility();
}

function navigateToCategory(rubro) {
    playTap();
    const heroVid = document.getElementById('heroVideoPlayer');
    if (heroVid && !heroVid.paused) heroVid.pause();
    currentView = 'category';
    activeRubro = rubro;
    activeSubcat = 'Todas';
    searchQuery = '';
    const input = document.getElementById('catalogSearchInput');
    if (input) input.value = '';
    document.getElementById('searchExpandBar').classList.remove('open');

    document.getElementById('pageHomeView').classList.remove('active');
    document.getElementById('pageCategoryView').classList.add('active');
    const newHash = `categoria/${encodeURIComponent(rubro)}`;
    if (location.hash !== `#${newHash}`) location.hash = newHash;
    setActiveHeaderTab(`cat-${rubro}`);
    renderCategoryPageHeaderAndSubcats();
    renderCategoryGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateFloatingVisibility();
}

function scrollToSection(e, sectionId) {
    if (e) e.preventDefault();
    playTap();
    activeHomeSection = sectionId;
    const perform = () => {
        const target = document.getElementById(sectionId);
        if (!target) return;
        target.classList.add('is-visible');
        const headerEl = document.getElementById('luxuryHeader');
        const offset = (headerEl ? headerEl.offsetHeight : 100) + 18;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        setActiveHeaderTab(sectionId);
    };
    if (currentView !== 'home') {
        currentView = 'home';
        document.getElementById('pageCategoryView').classList.remove('active');
        document.getElementById('pageHomeView').classList.add('active');
        if (PRODUCTS.length > 0 && !document.querySelector('#homeCuratedGrid .product-card-minimal')) {
            renderHomeCuratedGrid();
        }
        initHeroVideo();
        setTimeout(perform, 60);
    } else {
        perform();
    }
    updateFloatingVisibility();
}

function handleRouteFromHash() {
    const h = decodeURIComponent(location.hash || '');
    if (h.startsWith('#categoria/')) {
        const targetRubro = h.replace('#categoria/', '');
        if (currentView === 'category' && activeRubro === targetRubro) return;
        if (targetRubro === 'Todo' || PRODUCTS.some(p => p.rubro === targetRubro)) {
            navigateToCategory(targetRubro);
        }
    } else if (['#bienestar', '#contacto', '#ubicacion'].includes(h)) {
        scrollToSection(null, h.replace('#', ''));
    } else if (!h && currentView === 'category') {
        navigateToHome();
    }
}
window.addEventListener('hashchange', handleRouteFromHash);

function getWeeklyHomeSix() {
    if (PRODUCTS.length === 0) return [];
    const flagged = PRODUCTS.filter(p => p.destacado === true);
    if (flagged.length >= 6) return flagged.slice(0, 6);
    const selected = [...flagged];
    const usedIds = new Set(selected.map(p => p.id));
    for (const p of PRODUCTS) {
        if (selected.length >= 6) break;
        if (!usedIds.has(p.id)) { selected.push(p); usedIds.add(p.id); }
    }
    return selected;
}

function buildSwatchesHTML(colores) {
    if (!colores || colores.length === 0) return '';
    const dots = colores.slice(0, 6).map(c =>
        `<span class="color-dot-sample ${c.light ? 'is-light' : ''}" style="background-color:${c.hex};" title="${c.name}"></span>`
    ).join('');
    const namesText = colores.map(c => c.name).join(' · ');
    return `
        <div class="product-swatches-row">
            ${dots}
            <span class="color-names-mini">${namesText}</span>
        </div>
    `;
}

function resolveComboDetails(item, comboChoice = 'all') {
    if (!item.isCombo || !item.subItems || item.subItems.length < 2) {
        return {
            displayName: item.nombre,
            priceARS: item.precioARS || 0,
            comboKey: 'base'
        };
    }
    if (comboChoice === 'all' || comboChoice === null || comboChoice === undefined) {
        const total = item.subItems.reduce((acc, sub) => acc + (sub.priceARS || 0), 0);
        return {
            displayName: `Look Completo (${item.nombre})`,
            priceARS: total,
            comboKey: 'all'
        };
    }
    const idx = Number(comboChoice);
    if (!Number.isNaN(idx) && item.subItems[idx]) {
        return {
            displayName: item.subItems[idx].name,
            priceARS: item.subItems[idx].priceARS || 0,
            comboKey: idx
        };
    }
    return {
        displayName: item.nombre,
        priceARS: item.precioARS || 0,
        comboKey: 'all'
    };
}

function formatPriceDisplay(item) {
    if (item.isCombo && item.preciosArray && item.preciosArray.length > 1) {
        const p1 = formatMoney(getProductPrice({ precioARS: item.preciosArray[0] }));
        const p2 = formatMoney(getProductPrice({ precioARS: item.preciosArray[1] }));
        return `${p1} / ${p2}`;
    }
    const val = getProductPrice(item);
    return val > 0 ? formatMoney(val) : 'Consultar precio';
}

function getMediaList(item) {
    if (Array.isArray(item.imagenes) && item.imagenes.length > 0) return item.imagenes.filter(Boolean);
    if (Array.isArray(item.fotos) && item.fotos.length > 0) return item.fotos.filter(Boolean);
    return item.imagen ? [item.imagen] : [];
}

function createProductCardHTML(item, idx = 99) {
    const priceStr = formatPriceDisplay(item);
    const subLabel = [item.rubro, item.subcategoria].filter(Boolean).join(' · ');
    const fetchAttr = idx < 8 ? 'fetchpriority="high"' : 'fetchpriority="auto"';
    const mediaList = getMediaList(item);
    const coverMedia = mediaList[0] || item.imagen || '';
    const hoverMedia = mediaList.length > 1 ? mediaList[1] : '';
    const hasMulti = mediaList.length > 1;

    const isCoverVid = isVideoPath(coverMedia);
    const coverMarkup = isCoverVid
        ? `<video src="${coverMedia}" autoplay loop muted playsinline preload="metadata" onloadedmetadata="applySmartFit(this)"></video>`
        : `<img src="${coverMedia}" alt="${item.nombre}" loading="eager" ${fetchAttr} onerror="fallbackToGithubRaw(this)">`;

    let hoverMarkup = '';
    if (hasMulti) {
        const isHoverVid = isVideoPath(hoverMedia);
        hoverMarkup = isHoverVid
            ? `<video data-hover-src="${hoverMedia}" class="product-img-hover" autoplay loop muted playsinline preload="none" onloadedmetadata="applySmartFit(this)"></video>`
            : `<img data-hover-src="${hoverMedia}" alt="${item.nombre}" class="product-img-hover" onload="applySmartFit(this)" onerror="fallbackToGithubRaw(this)">`;
    }

    return `
        <article class="product-card-minimal" onmouseenter="loadHoverMedia(this)" onclick="openPdpModal('${item.id}')">
            <div class="product-image-stage ${hasMulti ? 'has-multi-photo' : ''}">
                ${item.etiqueta ? `<span class="product-tag-minimal">${item.etiqueta}</span>` : ''}
                ${hasMulti ? `<span class="product-multi-badge">1/${mediaList.length}</span>` : ''}
                ${isCoverVid ? `<span class="product-multi-badge" style="left:auto; right:8px; top:8px; bottom:auto;">🎬 Video</span>` : ''}
                ${coverMarkup}
                ${hoverMarkup}
                <button class="product-quick-add" title="Agregar" onclick="quickAddBag(event, '${item.id}')">+</button>
            </div>
            <div class="product-meta-block">
                <div class="product-kicker-row">
                    <span class="product-sub-kicker">${subLabel}</span>
                    ${item.tallesLabel ? `<span class="product-size-pill-mini">${item.tallesLabel}</span>` : ''}
                </div>
                <h3 class="product-name-clean">${item.nombre}</h3>
                ${item.descripcion ? `<p class="product-desc-mini">${item.descripcion}</p>` : ''}
                ${buildSwatchesHTML(item.colores)}
                <div class="product-bottom-row">
                    <span class="product-price-clean">${priceStr}</span>
                </div>
            </div>
        </article>
    `;
}

function renderHomeCuratedGrid() {
    const grid = document.getElementById('homeCuratedGrid');
    const sub = document.getElementById('homeCuratedSubtitle');
    const list = getWeeklyHomeSix();
    sub.innerText = `${list.length} Piezas Curadas · Mix de Temporada (${activeCurrency})`;
    if (list.length === 0) { grid.innerHTML = buildSkeletonCards(6); return; }
    grid.innerHTML = list.map((p, i) => createProductCardHTML(p, i)).join('');
}

function renderCategoryPageHeaderAndSubcats() {
    const titleEl = document.getElementById('catPageTitle');
    const kickerEl = document.getElementById('catPageKicker');
    if (titleEl) titleEl.innerText = activeRubro === 'Todo' ? 'Toda la Colección' : activeRubro;
    if (kickerEl) kickerEl.innerText = searchQuery ? `Resultados para "${searchQuery}"` : 'Colección MeraKi';

    const subRow = document.getElementById('dynamicSubcatRow');
    const pool = activeRubro === 'Todo' ? PRODUCTS : PRODUCTS.filter(p => p.rubro === activeRubro);
    const subs = [...new Set(pool.map(p => p.subcategoria).filter(Boolean))];
    if (subs.length > 1) {
        subRow.innerHTML = ['Todas', ...subs].map(s => `
            <button class="subcat-pill-btn ${activeSubcat === s ? 'active' : ''}" onclick="selectSubcat('${s}')">${s}</button>
        `).join('');
        subRow.classList.add('visible');
    } else {
        subRow.classList.remove('visible');
        activeSubcat = 'Todas';
    }
}

function selectSubcat(sub) {
    playTap();
    activeSubcat = sub;
    renderCategoryPageHeaderAndSubcats();
    renderCategoryGrid();
}

function appendCategoryBatch() {
    const grid = document.getElementById('categoryProductsGrid');
    if (!grid) return;

    const existingSentinel = document.getElementById('catLoadSentinel');
    if (existingSentinel) existingSentinel.remove();

    const nextSlice = currentCategoryFiltered.slice(
        currentCategoryRenderedCount,
        currentCategoryRenderedCount + CATEGORY_BATCH_SIZE
    );
    if (nextSlice.length === 0) return;

    const batchHtml = nextSlice
        .map((p, i) => createProductCardHTML(p, currentCategoryRenderedCount + i))
        .join('');
    grid.insertAdjacentHTML('beforeend', batchHtml);
    currentCategoryRenderedCount += nextSlice.length;

    if (currentCategoryRenderedCount < currentCategoryFiltered.length) {
        const sentinel = document.createElement('div');
        sentinel.id = 'catLoadSentinel';
        sentinel.style.cssText = 'grid-column: 1 / -1; width: 100%; height: 1px;';
        grid.appendChild(sentinel);
        if (categoryBatchObserver) categoryBatchObserver.observe(sentinel);
    }
}

function renderCategoryGrid() {
    const grid = document.getElementById('categoryProductsGrid');
    const counterEl = document.getElementById('catPageCounter');

    if (categoryBatchObserver) {
        categoryBatchObserver.disconnect();
        categoryBatchObserver = null;
    }

    currentCategoryFiltered = PRODUCTS.filter(p => {
        const matchRubro = activeRubro === 'Todo' || p.rubro === activeRubro;
        const matchSub = activeSubcat === 'Todas' || p.subcategoria === activeSubcat;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q) || p.rubro.toLowerCase().includes(q) || p.subcategoria.toLowerCase().includes(q);
        return matchRubro && matchSub && matchSearch;
    });
    currentCategoryRenderedCount = 0;

    counterEl.innerText = `${currentCategoryFiltered.length} ${currentCategoryFiltered.length === 1 ? 'pieza disponible' : 'piezas disponibles'} · ${activeCurrency}`;
    if (!currentCategoryFiltered.length) {
        grid.innerHTML = `<div class="empty-catalog-state">No encontramos piezas con ese filtro. Probá limpiando la búsqueda.</div>`;
        return;
    }

    grid.innerHTML = '';

    if ('IntersectionObserver' in window) {
        categoryBatchObserver = new IntersectionObserver((entries) => {
            if (currentView !== 'category') return;
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    appendCategoryBatch();
                    break;
                }
            }
        }, { rootMargin: '420px 0px' });
        appendCategoryBatch();
    } else {
        grid.innerHTML = currentCategoryFiltered.map((p, i) => createProductCardHTML(p, i)).join('');
        currentCategoryRenderedCount = currentCategoryFiltered.length;
    }
}

function toggleSearchBar() {
    playTap();
    const bar = document.getElementById('searchExpandBar');
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) document.getElementById('catalogSearchInput').focus();
}

function handleSearch(val) {
    searchQuery = val.trim();
    if (searchQuery.length > 0) {
        if (currentView !== 'category') {
            const heroVid = document.getElementById('heroVideoPlayer');
            if (heroVid && !heroVid.paused) heroVid.pause();
            activeRubro = 'Todo';
            activeSubcat = 'Todas';
            currentView = 'category';
            document.getElementById('pageHomeView').classList.remove('active');
            document.getElementById('pageCategoryView').classList.add('active');
            setActiveHeaderTab('');
        }
        renderCategoryPageHeaderAndSubcats();
        renderCategoryGrid();
    } else {
        renderCategoryPageHeaderAndSubcats();
        renderCategoryGrid();
    }
}

function clearSearch() {
    searchQuery = '';
    document.getElementById('catalogSearchInput').value = '';
    document.getElementById('searchExpandBar').classList.remove('open');
    navigateToHome();
}

/* QUICK-VIEW PDP MODAL (MULTI-FOTO, VIDEO & SLIDER) */
function openPdpModal(id) {
    playTap();
    const item = PRODUCTS.find(p => p.id === id);
    if (!item) return;

    currentPdpProduct = item;
    currentPdpSize = item.talles[0] || 'A confirmar';
    currentPdpComboSelection = item.isCombo ? 'all' : 'base';
    currentPdpGalleryIndex = 0;

    renderPdpMediaView();

    document.getElementById('pdpKicker').innerText = [item.rubro, item.subcategoria].filter(Boolean).join(' · ');
    document.getElementById('pdpTitle').innerText = item.nombre;

    const descEl = document.getElementById('pdpDesc');
    descEl.innerText = item.descripcion || '';
    descEl.style.display = item.descripcion ? 'block' : 'none';

    const colorsBlock = document.getElementById('pdpColorsBlock');
    const colorsList = document.getElementById('pdpColorsList');
    if (item.colores && item.colores.length > 0) {
        colorsList.innerHTML = item.colores.map(c => `
            <span class="pdp-color-chip">
                <span class="color-dot-sample ${c.light ? 'is-light' : ''}" style="background-color:${c.hex};"></span>
                <span>${c.name}</span>
            </span>
        `).join('');
        colorsBlock.style.display = 'flex';
    } else {
        colorsBlock.style.display = 'none';
    }

    document.getElementById('pdpSizeGrid').innerHTML = item.talles.map((t, idx) => `
        <button class="size-chip ${idx === 0 ? 'selected' : ''}" onclick="selectSizeChip(this, '${t}')">${t}</button>
    `).join('');

    renderComboItemSelector(item);
    updatePdpPrices(item);
    updatePdpWppLink();

    document.getElementById('globalBackdrop').classList.add('open');
    document.getElementById('pdpModal').classList.add('open');
    pushHistoryState('pdpModal');
}

function renderPdpMediaView() {
    const item = currentPdpProduct;
    if (!item) return;

    const mediaList = getMediaList(item);
    if (currentPdpGalleryIndex >= mediaList.length) currentPdpGalleryIndex = 0;
    const currentMedia = mediaList[currentPdpGalleryIndex] || item.imagen || '';
    const mediaCol = document.querySelector('.pdp-media-col');
    const isVid = isVideoPath(currentMedia);

    let innerContent = isVid
        ? `<video src="${currentMedia}" style="width:100%; height:100%; max-height:540px; display:block;" autoplay loop muted playsinline controls onloadedmetadata="applySmartFit(this)"></video>`
        : `<img id="pdpImg" src="${currentMedia}" alt="${item.nombre}" style="width:100%; height:100%; max-height:540px; display:block;" onload="applySmartFit(this)" onerror="fallbackToGithubRaw(this)">`;

    if (mediaList.length > 1) {
        innerContent += `
            <div class="pdp-gallery-nav" onclick="event.stopPropagation()">
                <button type="button" class="pdp-gal-arrow pdp-gal-prev" onclick="navPdpGallery(-1)" aria-label="Anterior">‹</button>
                <button type="button" class="pdp-gal-arrow pdp-gal-next" onclick="navPdpGallery(1)" aria-label="Siguiente">›</button>
                <span class="pdp-gal-counter">${currentPdpGalleryIndex + 1}/${mediaList.length}</span>
                <div class="pdp-gal-thumbs">
                    ${mediaList.map((m, idx) => `
                        <div class="pdp-gal-thumb ${idx === currentPdpGalleryIndex ? 'active' : ''}" onclick="setSlideIndex(${idx})">
                            ${isVideoPath(m) ? `<span style="font-size:0.5rem; display:flex; align-items:center; justify-content:center; height:100%; background:#000; color:#FFF;">▶</span>` : `<img src="${m}" alt="Mini" onload="applySmartFit(this)" onerror="fallbackToGithubRaw(this)">`}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    mediaCol.innerHTML = innerContent;
}

function navPdpGallery(dir) {
    playTap();
    const mediaList = getMediaList(currentPdpProduct);
    if (mediaList.length <= 1) return;
    currentPdpGalleryIndex = (currentPdpGalleryIndex + dir + mediaList.length) % mediaList.length;
    renderPdpMediaView();
}

function setSlideIndex(idx) {
    playTap();
    currentPdpGalleryIndex = idx;
    renderPdpMediaView();
}

function renderComboItemSelector(item) {
    let comboContainer = document.getElementById('pdpComboSelectorBlock');
    if (!comboContainer) {
        comboContainer = document.createElement('div');
        comboContainer.id = 'pdpComboSelectorBlock';
        comboContainer.style.margin = '10px 0';
        const sizeBlock = document.getElementById('pdpSizeBlock');
        sizeBlock.parentNode.insertBefore(comboContainer, sizeBlock);
    }

    if (!item.isCombo || !item.subItems || item.subItems.length < 2) {
        comboContainer.style.display = 'none';
        return;
    }

    const totalCombo = item.subItems.reduce((acc, sub) => acc + sub.priceARS, 0);
    comboContainer.style.display = 'block';
    comboContainer.innerHTML = `
        <span class="product-sub-kicker" style="color:var(--ink-black); margin-bottom:6px; display:block;">¿Qué prenda te interesa?</span>
        <div style="display:flex; flex-direction:column; gap:6px;">
            ${item.subItems.map((sub, idx) => `
                <button type="button" class="subcat-pill-btn" style="text-align:left; font-size:0.72rem; display:flex; justify-content:space-between;" onclick="selectComboPart(${idx})">
                    <span>${sub.name}</span>
                    <b>${formatMoney(getProductPrice({ precioARS: sub.priceARS }))}</b>
                </button>
            `).join('')}
            <button type="button" class="subcat-pill-btn active" style="text-align:left; font-size:0.72rem; display:flex; justify-content:space-between;" onclick="selectComboPart('all')">
                <span>Look Completo (ambas prendas)</span>
                <b>${formatMoney(getProductPrice({ precioARS: totalCombo }))}</b>
            </button>
        </div>
    `;
}

function selectComboPart(choice) {
    playTap();
    currentPdpComboSelection = choice;
    const btns = document.querySelectorAll('#pdpComboSelectorBlock button');
    btns.forEach((b, idx) => {
        b.classList.toggle('active', choice === 'all' ? (idx === btns.length - 1) : idx === choice);
    });
    updatePdpPrices(currentPdpProduct);
    updatePdpWppLink();
}

function updatePdpPrices(item) {
    const details = resolveComboDetails(item, currentPdpComboSelection);
    const currentPriceARS = details.priceARS;

    const mainPrice = formatMoney(getProductPrice({ precioARS: currentPriceARS }, activeCurrency));
    document.getElementById('pdpPriceMain').innerText = currentPriceARS > 0 ? mainPrice : 'Consultar precio';

    const frontierEl = document.getElementById('pdpPriceFrontier');
    if (frontierEl) {
        if (currentPriceARS > 0) {
            const otherCurrencies = ['ARS', 'PYG', 'BRL'].filter(c => c !== activeCurrency);
            const refs = otherCurrencies.map(c => `${c} ${formatMoney(getProductPrice({ precioARS: currentPriceARS }, c), c)}`).join('  ·  ');
            frontierEl.innerText = `Referencia aprox: ${refs}`;
        } else {
            frontierEl.innerText = 'Consultar disponibilidad y precio directo';
        }
    }
}

function selectSizeChip(btn, sizeVal) {
    playTap();
    currentPdpSize = sizeVal;
    document.querySelectorAll('#pdpSizeGrid .size-chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    updatePdpWppLink();
}

function updatePdpWppLink() {
    if (!currentPdpProduct) return;
    const item = currentPdpProduct;
    const details = resolveComboDetails(item, currentPdpComboSelection);
    const priceStr = formatMoney(getProductPrice({ precioARS: details.priceARS }));
    const msg = `¡Hola MeraKi! ✨ Quisiera *Solicitar por WhatsApp*:\n\n• *Prenda:* ${details.displayName}\n• *Opción/Talle:* ${currentPdpSize}\n• *Valor (${activeCurrency}):* ${priceStr}`;
    document.getElementById('pdpDirectWppBtn').href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* BOLSA DE COMPRAS */
function quickAddBag(e, id) {
    e.stopPropagation();
    playTap();
    const item = PRODUCTS.find(p => p.id === id);
    if (!item) return;
    pushToBag(item, item.talles[0] || 'A confirmar', item.isCombo ? 'all' : 'base');
}

function addCurrentPdpToBag() {
    if (!currentPdpProduct) return;
    playTap();
    pushToBag(currentPdpProduct, currentPdpSize, currentPdpComboSelection);
    closeAllOverlays(false);
    openBagDrawer();
}

function pushToBag(item, size, comboChoice = 'all') {
    const details = resolveComboDetails(item, comboChoice);
    const existing = shoppingBag.find(b =>
        b.id === item.id &&
        b.size === size &&
        (b.comboKey ?? 'all') === details.comboKey
    );
    if (existing) {
        existing.qty += 1;
    } else {
        shoppingBag.push({
            id: item.id,
            size,
            comboKey: details.comboKey,
            qty: 1
        });
    }
    saveBag();
    showToast(`"${details.displayName}" agregado`);
}

function updateBagQty(index, delta) {
    playTap();
    if (!shoppingBag[index]) return;
    shoppingBag[index].qty += delta;
    if (shoppingBag[index].qty < 1) shoppingBag.splice(index, 1);
    saveBag();
    renderBagDrawer();
}

function removeBagItem(index) {
    playTap();
    shoppingBag.splice(index, 1);
    saveBag();
    renderBagDrawer();
}

function clearEntireBag() {
    playTap();
    shoppingBag = [];
    saveBag();
    renderBagDrawer();
}

function saveBag() {
    localStorage.setItem('meraki_bag', JSON.stringify(shoppingBag));
    const totalCount = shoppingBag.reduce((sum, b) => sum + b.qty, 0);
    const badge = document.getElementById('bagCountBadge');
    badge.innerText = totalCount;
    badge.classList.toggle('visible', totalCount > 0);
}

function renderBagDrawer() {
    const body = document.getElementById('bagDrawerBody');
    const foot = document.getElementById('bagDrawerFoot');
    if (!shoppingBag.length) {
        body.innerHTML = `<div style="text-align:center; padding:48px 16px; color:var(--ink-muted);">Tu bolsa está vacía.<br><br>Elegí piezas de la colección para armar tu solicitud por WhatsApp.</div>`;
        foot.innerHTML = `<button class="btn-add-bag-outline" onclick="closeAllOverlays()">Seguir Explorando</button>`;
        return;
    }
    let total = 0, hasConsult = false, lines = [];
    body.innerHTML = shoppingBag.map((entry, idx) => {
        const item = PRODUCTS.find(p => p.id === entry.id);
        if (!item) return '';
        const details = resolveComboDetails(item, entry.comboKey ?? 'all');
        const unitPrice = getProductPrice({ precioARS: details.priceARS });
        if (unitPrice > 0) total += unitPrice * entry.qty;
        else hasConsult = true;

        const pStr = formatMoney(unitPrice);
        lines.push(`▪ ${entry.qty}x *${details.displayName}* (${entry.size}) — ${pStr}`);
        const mediaList = getMediaList(item);
        const coverMedia = mediaList[0] || item.imagen || '';

        const mediaThumb = isVideoPath(coverMedia)
            ? `<video src="${coverMedia}" class="bag-item-img" muted playsinline></video>`
            : `<img src="${coverMedia}" alt="${details.displayName}" class="bag-item-img" onload="applySmartFit(this)" onerror="fallbackToGithubRaw(this)">`;

        return `
            <div class="bag-item-row">
                ${mediaThumb}
                <div class="bag-item-info">
                    <div class="bag-item-top-row">
                        <div>
                            <div style="font-size:0.82rem; font-weight:700;">${details.displayName}</div>
                            <div style="font-family:var(--font-mono); font-size:0.62rem; color:var(--ink-muted); text-transform:uppercase; margin-top:2px;">Opción: ${entry.size}</div>
                        </div>
                        <button class="btn-remove-bag-item" onclick="removeBagItem(${idx})">✕ Eliminar</button>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                        <div class="qty-control">
                            <button onclick="updateBagQty(${idx}, -1)">−</button>
                            <span>${entry.qty}</span>
                            <button onclick="updateBagQty(${idx}, 1)">+</button>
                        </div>
                        <b>${pStr}</b>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const totalStr = total > 0 ? formatMoney(total) + (hasConsult ? ' + ítems a consultar' : '') : 'A consultar';
    const fullMsg = `¡Hola MeraKi! ✨ Quisiera *Solicitar por WhatsApp* mi selección de la tienda:\n\n${lines.join('\n')}\n\n*Total estimado (${activeCurrency}):* ${totalStr}\n\nQuedo atenta/o para confirmar talles y medio de pago.`;
    foot.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <span style="font-family:var(--font-mono); font-size:0.70rem; text-transform:uppercase; color:var(--ink-muted);">Total Estimado (${activeCurrency})</span>
            <span style="font-family:var(--font-mono); font-size:1.08rem; font-weight:700;">${totalStr}</span>
        </div>
        <span style="font-size:0.68rem; color:var(--ink-muted);">30% OFF + 12 cuotas sin interés · Ahora Misiones</span>
        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMsg)}" target="_blank" rel="noopener noreferrer" class="btn-wpp-solicitar" onclick="playTap()">
            Solicitar por WhatsApp (${shoppingBag.reduce((s,b)=>s+b.qty,0)})
        </a>
        <button onclick="clearEntireBag()" style="font-family:var(--font-mono); font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--ink-muted); padding:4px; text-align:center;">Vaciar bolsa</button>
    `;
}

function openBagDrawer() {
    playTap();
    renderBagDrawer();
    document.getElementById('globalBackdrop').classList.add('open');
    document.getElementById('bagDrawer').classList.add('open');
    pushHistoryState('bagDrawer');
}

function openMenuDrawer() {
    playTap();
    document.getElementById('globalBackdrop').classList.add('open');
    document.getElementById('menuDrawer').classList.add('open');
    pushHistoryState('menuDrawer');
}

function closeAllOverlays(popHistory = true) {
    document.getElementById('globalBackdrop').classList.remove('open');
    document.getElementById('pdpModal').classList.remove('open');
    document.getElementById('bagDrawer').classList.remove('open');
    document.getElementById('menuDrawer').classList.remove('open');
    if (popHistory && modalStateStack.length > 0) {
        modalStateStack = [];
        if (history.state && history.state.modalOpen) history.back();
    } else {
        modalStateStack = [];
    }
}

function closeOverlayWithoutHistory() {
    document.getElementById('globalBackdrop').classList.remove('open');
    document.getElementById('pdpModal').classList.remove('open');
    document.getElementById('bagDrawer').classList.remove('open');
    document.getElementById('menuDrawer').classList.remove('open');
}

/* 7 INTENCIONES */
const intencionesData = {
    abundancia: {
        title: "Momento de Abundancia",
        phrase: '"Atraigo prosperidad, plenitud y gratitud a cada rincón de mi espacio."',
        link: `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=%C2%A1Hola%20MeraKi!%20%E2%9C%A8%20Quiero%20solicitar%20el%20kit%20de%20sahumado%20para%20la%20intenci%C3%B3n%20de%20Abundancia.`
    },
    paz: {
        title: "Momento de Paz & Armonía",
        phrase: '"Despejo la mente, suelto tensiones y restauro la calma en mi hogar."',
        link: `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=%C2%A1Hola%20MeraKi!%20%E2%9C%A8%20Quiero%20solicitar%20el%20kit%20de%20sahumado%20para%20la%20intenci%C3%B3n%20de%20Paz%20y%20Armon%C3%ADa.`
    },
    meditacion: {
        title: "Momento de Meditación",
        phrase: '"Conecto con el presente, el silencio y mi centro espiritual."',
        link: `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=%C2%A1Hola%20MeraKi!%20%E2%9C%A8%20Quiero%20solicitar%20el%20kit%20de%20sahumado%20para%20la%20intenci%C3%B3n%20de%20Meditaci%C3%B3n.`
    },
    soltar: {
        title: "Momento de Soltar",
        phrase: '"Libero cargas pasadas, renuevo el aire y abro paso a lo nuevo."',
        link: `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=%C2%A1Hola%20MeraKi!%20%E2%9C%A8%20Quiero%20solicitar%20el%20kit%20de%20sahumado%20para%20la%20intenci%C3%B3n%20de%20Soltar.`
    }
};

function selectIntencion(key, btn) {
    playTap();
    document.querySelectorAll('.ritual-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const item = intencionesData[key];
    if (item) {
        document.getElementById('intencionTitle').innerText = item.title;
        document.getElementById('intencionPhrase').innerText = item.phrase;
        document.getElementById('intencionLink').href = item.link;
    }
}

/* FORMULARIO CONTACTO */
async function submitContactForm(e) {
    e.preventDefault();
    playTap();

    const btn = document.getElementById('contactSubmitBtn');
    const feedback = document.getElementById('contactFeedback');
    const payload = {
        action: 'contact',
        nombre: document.getElementById('contactName').value.trim(),
        contacto: document.getElementById('contactEmail').value.trim(),
        asunto: document.getElementById('contactSubject').value.trim(),
        mensaje: document.getElementById('contactMessage').value.trim(),
        fecha: new Date().toLocaleString('es-AR')
    };

    btn.innerText = 'ENVIANDO...';
    btn.disabled = true;

    try {
        if (CONFIG.APPS_SCRIPT_URL) {
            await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            feedback.innerText = '✓ ¡Gracias! Tu consulta fue enviada correctamente.';
        } else {
            const wppMsg = `¡Hola MeraKi! ✨ Te escribo desde el formulario de la web:\n\n• *Nombre:* ${payload.nombre}\n• *Contacto:* ${payload.contacto}\n• *Asunto:* ${payload.asunto}\n• *Mensaje:* ${payload.mensaje}`;
            window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(wppMsg)}`, '_blank', 'noopener,noreferrer');
            feedback.innerText = '✓ Redirigiendo tu consulta a WhatsApp...';
        }
        feedback.classList.add('visible');
        document.getElementById('contactForm').reset();
    } catch (err) {
        feedback.innerText = '✓ No pudimos enviar por email; escribinos directo por WhatsApp.';
        feedback.classList.add('visible');
    } finally {
        btn.innerText = 'ENVIAR CONSULTA';
        btn.disabled = false;
        setTimeout(() => feedback.classList.remove('visible'), 6000);
    }
}

/* SHOWROOM & STATUS */
function updateStoreStatus() {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    if (!dot || !txt) return;
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const isOpen = (day >= 1 && day <= 5) && ((mins >= 540 && mins <= 750) || (mins >= 990 && mins <= 1260));
    if (isOpen) {
        dot.style.background = '#16A34A';
        txt.innerText = 'Abierto ahora · Ushuaia 196 esq. Jangadero';
    } else {
        dot.style.background = '#D97706';
        txt.innerText = 'Ushuaia 196 · Consultas activas por WhatsApp';
    }
}

function initScrollAnimations() {
    const blocks = document.querySelectorAll('.reveal-block');
    if (!('IntersectionObserver' in window)) {
        blocks.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    blocks.forEach(el => observer.observe(el));
}

function showToast(msg) {
    const t = document.getElementById('toastBar');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function playTap() { if ('vibrate' in navigator) try { navigator.vibrate(8); } catch(_) {} }

function updateFloatingVisibility() {
    const floating = document.getElementById('floatingConcierge');
    const header = document.getElementById('luxuryHeader');
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
    if (!floating) return;
    floating.classList.toggle('is-visible', window.scrollY > 120);
}
window.addEventListener('scroll', updateFloatingVisibility, { passive: true });

window.addEventListener('DOMContentLoaded', () => {
    setCurrency(activeCurrency);
    saveBag();
    updateStoreStatus();
    initScrollAnimations();
    loadCatalog();
    updateFloatingVisibility();
    if (!location.hash.startsWith('#categoria/')) {
        setTimeout(initHeroVideo, 120);
    }
});
