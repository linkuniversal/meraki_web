export async function onRequest(context) {
    const { request, env } = context;
    const pass = request.headers.get("x-admin-pass") || "";
    if (!env.ADMIN_PASS || pass !== env.ADMIN_PASS) {
        return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const owner  = env.GITHUB_OWNER  || "linkuniversal";
    const repo   = env.GITHUB_REPO   || "meraki_web";
    const branch = env.GITHUB_BRANCH || "main";

    const headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Meraki-Cloudflare-Admin"
    };
    if (env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${env.GITHUB_TOKEN}`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!res.ok) {
        return new Response(JSON.stringify({ ok: false, error: "No se pudo leer GitHub" }), { status: res.status, headers: { "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const imgRx = /\.(webp|jpe?g|png|avif)$/i;
    const files = (data.tree || [])
        .filter(n => n.type === "blob" && n.path.startsWith("media/") && !n.path.startsWith("media/editorial/") && imgRx.test(n.path))
        .map(n => n.path);

    return new Response(JSON.stringify({ ok: true, files }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
}