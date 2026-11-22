const JSON_HEAD = { "Content-Type": "application/json; charset=utf-8" };

function encodeGhPath(p) {
    return String(p || "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export async function onRequest(context) {
    const { request, env } = context;

    const pass = request.headers.get("x-admin-pass") || "";
    if (!env.ADMIN_PASS || pass !== env.ADMIN_PASS) {
        return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), { status: 401, headers: JSON_HEAD });
    }
    if (!env.GITHUB_TOKEN) {
        return new Response(JSON.stringify({ ok: false, error: "Falta GITHUB_TOKEN en Cloudflare." }), { status: 500, headers: JSON_HEAD });
    }

    const owner  = env.GITHUB_OWNER  || "linkuniversal";
    const repo   = env.GITHUB_REPO   || "meraki_web";
    const branch = env.GITHUB_BRANCH || "main";

    const ghHeaders = {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "Meraki-Cloudflare-Admin",
        "Content-Type": "application/json"
    };

    const body = await request.json().catch(() => ({}));
    const rawPath = String(body.path || "").replace(/^\/+/, "");
    if (!rawPath || !rawPath.startsWith("media/")) {
        return new Response(JSON.stringify({ ok: false, error: "Ruta inválida" }), { status: 400, headers: JSON_HEAD });
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGhPath(rawPath)}`;

    // Buscar SHA si ya existe en GitHub
    let existingSha = null;
    const checkRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    if (checkRes.ok) {
        const meta = await checkRes.json();
        existingSha = meta.sha || null;
    }

    if (request.method === "POST") {
        if (!body.base64) {
            return new Response(JSON.stringify({ ok: false, error: "Falta imagen base64" }), { status: 400, headers: JSON_HEAD });
        }
        const payload = {
            message: body.message || `Panel MeraKi: subir ${rawPath}`,
            content: body.base64,
            branch
        };
        if (existingSha) payload.sha = existingSha;

        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: ghHeaders,
            body: JSON.stringify(payload)
        });
        if (!putRes.ok) {
            const errTxt = await putRes.text();
            return new Response(JSON.stringify({ ok: false, error: errTxt }), { status: putRes.status, headers: JSON_HEAD });
        }
        return new Response(JSON.stringify({ ok: true, path: rawPath }), { status: 200, headers: JSON_HEAD });
    }

    if (request.method === "DELETE") {
        if (!existingSha) {
            return new Response(JSON.stringify({ ok: true, note: "El archivo ya no existía en GitHub" }), { status: 200, headers: JSON_HEAD });
        }
        const delRes = await fetch(apiUrl, {
            method: "DELETE",
            headers: ghHeaders,
            body: JSON.stringify({
                message: `Panel MeraKi: eliminar ${rawPath}`,
                sha: existingSha,
                branch
            })
        });
        if (!delRes.ok) {
            const errTxt = await delRes.text();
            return new Response(JSON.stringify({ ok: false, error: errTxt }), { status: delRes.status, headers: JSON_HEAD });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: JSON_HEAD });
    }

    return new Response("Method Not Allowed", { status: 405 });
}