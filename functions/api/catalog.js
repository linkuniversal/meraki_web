const INITIAL_SEED = [
    ["Aromas","Textil & Sahumado","Aromatizador Textil & Difusor","","Aromatización y bienestar para el hogar.","media/aromas/img-20261113-wa0078.webp","","Único","Natural","SI"],
    ["Bazar","Mesa","Set de Mesa Contemporáneo","","Artículo funcional de bazar para tu hogar.","media/bazar/img-20261113-wa0078.webp","","Único","Blanco, Arena","SI"],
    ["Deco & Home","Hogar","Pieza Deco & Calidez","","Pieza de diseño y calidez para tu espacio.","media/deco-home/img-20261113-wa0078.webp","","Único","Crudo, Madera","SI"],
    ["Indumentaria","Mujer","Musculosa con puntilla","38000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0034.webp","","S, M, L, XL","marrón, beige","SI"],
    ["Indumentaria","Mujer","Blusita / Pantalón Lino","35000 / 56000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0035.webp","LOOK / 2 PIEZAS","M","blanco, natural","SI"],
    ["Indumentaria","Mujer","Remerita básica algodón / Pantalón lunares","12000 / 55000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0037.webp","LOOK / 2 PIEZAS","M, G","blanco, negro","SI"],
    ["Indumentaria","Mujer","Top lino espalda cruzada","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0040.webp","","S, M, L","beige","NO"],
    ["Indumentaria","Mujer","Blusa lino bordada","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0041.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Camisa seda / Jean súper Oxford","38000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0042.webp","LOOK / 2 PIEZAS","42, 46","azul marino, jean","NO"],
    ["Indumentaria","Mujer","Remera básica morley","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0043.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Top tirantes finos lino","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0044.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Blusa gasa fluida","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0045.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Musculosa lino escote V","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0046.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Blusa volados de algodón","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0047.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Blusa tela lino con puntilla","24000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0048.webp","","S, M, L, XL","blanco","NO"],
    ["Indumentaria","Mujer","Tela de seda con puntilla","28000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0049.webp","","S, M, L, XL","negro, nude","NO"],
    ["Indumentaria","Mujer","Top encaje romántico","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0050.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Musculosa seda satén","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0051.webp","","S, M, L","negro","NO"],
    ["Indumentaria","Mujer","Remera clásica lino","32000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0052.webp","","S, M, L, XL","amarillo","NO"],
    ["Indumentaria","Mujer","Blusa lino escote cuadrado","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0053.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Top crochet calado","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0054.webp","","S, M","beige, camel","NO"],
    ["Indumentaria","Mujer","Remera escote V suave","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0055.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Top morley cuello redondo","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0056.webp","","S, M, L","gris claro","NO"],
    ["Indumentaria","Mujer","Top denim / Blusa blanca","44000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0057.webp","LOOK / 2 PIEZAS","S, M","jean, blanco","NO"],
    ["Indumentaria","Mujer","Remerón oversize lino","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0058.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Tela seda con puntillas","40000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0059.webp","","S, M, L, XL","negro, beige, arena","NO"],
    ["Indumentaria","Mujer","Musculosa básica morley","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0060.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Tela gasa con puntillas","34000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0061.webp","","S, M, L, XL","blanco, manteca","NO"],
    ["Indumentaria","Mujer","Top lino rústico","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0062.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Blusa lino manga corta","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0063.webp","","S, M, L","beige","NO"],
    ["Indumentaria","Mujer","Remera cuello bote algodón","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0064.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Remera lino casual","50000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0065.webp","","S, M, L, XL","beige, chocolate","NO"],
    ["Indumentaria","Mujer","Tela lino fresca","32000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0066.webp","","S, M, L, XL","blanco, natural","NO"],
    ["Indumentaria","Mujer","Musculosa detalle hombros","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0067.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Top lino cuello halter","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0068.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Blusa lino con volado","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0069.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Tela lino clásica","22000","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0070.webp","","S, M, L, XL","beige, natural, blanco","NO"],
    ["Indumentaria","Mujer","Blusa lino botones frontales","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0071.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Top lino cintura fruncida","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0072.webp","","S, M, L","nude","NO"],
    ["Indumentaria","Mujer","Musculosa lino básica","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0073.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Blusa fluida escote gota","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0074.webp","","S, M, L","natural","NO"],
    ["Indumentaria","Mujer","Top lino cuello redondo","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0075.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Blusa lino sin mangas","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0076.webp","","S, M, L","arena","NO"],
    ["Indumentaria","Mujer","Top halter lino crudo","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0077.webp","","S, M, L","crudo","NO"],
    ["Indumentaria","Mujer","Remera básica algodón premium","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0078.webp","","S, M, L","blanco","NO"],
    ["Indumentaria","Mujer","Blusa lino entallada","","Prenda seleccionada de nuestra colección en Puerto Iguazú.","media/indumentaria/mujer/img-20261113-wa0079.webp","","S, M, L","natural","NO"]
];

function buildSeedItems() {
    return INITIAL_SEED.map((r, i) => ({
        id: `mk-${100 + i}`,
        rubro: r[0],
        subcategoria: r[1],
        nombre: r[2],
        precioARS: r[3],
        precioPYG: "",
        precioBRL: "",
        descripcion: r[4],
        foto: r[5],
        etiqueta: r[6],
        talles: r[7],
        colores: r[8],
        destacado: r[9] === "SI",
        visible: true
    }));
}

const HEADERS_JSON = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate"
};

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // Verificación rápida de contraseña al hacer login
    if (url.searchParams.get("check") === "1") {
        const pass = request.headers.get("x-admin-pass") || "";
        if (!env.ADMIN_PASS || pass !== env.ADMIN_PASS) {
            return new Response(JSON.stringify({ ok: false, error: "Contraseña incorrecta" }), { status: 401, headers: HEADERS_JSON });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: HEADERS_JSON });
    }

    if (!env.DB) {
        return new Response(JSON.stringify({ ok: false, error: "Falta vincular la base D1 como DB en Cloudflare." }), { status: 500, headers: HEADERS_JSON });
    }

    await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS meraki_store (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)"
    ).run();

    if (request.method === "GET") {
        let row = await env.DB.prepare("SELECT data, updated_at FROM meraki_store WHERE id = ?").bind("catalog").first();
        if (!row) {
            const seed = buildSeedItems();
            const now = Date.now();
            await env.DB.prepare(
                "INSERT INTO meraki_store (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
            ).bind("catalog", JSON.stringify(seed), now).run();
            return new Response(JSON.stringify({ ok: true, items: seed, updatedAt: now }), { status: 200, headers: HEADERS_JSON });
        }
        return new Response(JSON.stringify({ ok: true, items: JSON.parse(row.data), updatedAt: row.updated_at }), { status: 200, headers: HEADERS_JSON });
    }

    if (request.method === "POST") {
        const pass = request.headers.get("x-admin-pass") || "";
        if (!env.ADMIN_PASS || pass !== env.ADMIN_PASS) {
            return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), { status: 401, headers: HEADERS_JSON });
        }
        const body = await request.json();
        if (!Array.isArray(body.items)) {
            return new Response(JSON.stringify({ ok: false, error: "Formato inválido" }), { status: 400, headers: HEADERS_JSON });
        }
        const now = Date.now();
        await env.DB.prepare(
            "INSERT INTO meraki_store (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
        ).bind("catalog", JSON.stringify(body.items), now).run();

        return new Response(JSON.stringify({ ok: true, count: body.items.length, updatedAt: now }), { status: 200, headers: HEADERS_JSON });
    }

    return new Response("Method Not Allowed", { status: 405 });
}