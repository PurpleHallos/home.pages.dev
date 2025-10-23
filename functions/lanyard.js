export async function onRequestGet({ env, waitUntil }) {
    const originSvg = await fetch('https://lanyard.cnrad.dev/api/1154452833282818078?showDisplayName=true&bg=0d1117&idleMessage=https://chino.pages.dev').then(r => r.text());

    const newSvg = originSvg.replace(/( width=")410((px)?" )/g, '$1350$2')
        .replace(/width: 400px;/g, 'width: 340px;')
        .replace(/width: 279px;/, 'width: 219px;')
        .replace(/border: solid 0.5px #222;/, '$& object-fit: cover;')
        .replace(/height="210px">/, 'height="265px">');

    return new Response(newSvg, {
        headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'no-cache, no-store, must-revalidate, max-age=0'
        }
    });
}

