export async function onRequest(context) {
    const url = new URL(context.request.url);
    const host = url.hostname.toLowerCase();

    // Si entra por admin.tudominio.com o panel.tudominio.com, sirve directo admin.html
    if ((host.startsWith('admin.') || host.startsWith('panel.')) && (url.pathname === '/' || url.pathname === '')) {
        const adminUrl = new URL('/admin.html', url.origin);
        return context.env.ASSETS.fetch(new Request(adminUrl, context.request));
    }

    return context.next();
}