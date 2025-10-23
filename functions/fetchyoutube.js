export async function onRequestGet({ request, waitUntil }) {
    let res = await caches.default.match(request.url);

    if (res) {
        res = await res.json();
        waitUntil(updateCache(request.url));
    } else {
        res = await fetchData();
        waitUntil(updateCache(request.url, res));
    }

    return new Response(JSON.stringify(res), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-cache, no-store, must-revalidate, max-age=0'
        }
    });
}

async function fetchData() {
    try {
        // Return static content for now - you can update this with your actual YouTube channel ID later
        // To get your YouTube channel ID:
        // 1. Go to your YouTube channel
        // 2. View page source (Ctrl+U)
        // 3. Search for "channelId" or look in the URL
        // 4. Or use https://commentpicker.com/youtube-channel-id.php
        
        return {
            title: "Latest Video from PurpleHallos",
            description: "Check out my latest content on YouTube!",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", // Placeholder thumbnail
            videoUrl: "https://www.youtube.com/@PurpleHallos",
            publishedAt: "Recent"
        };
        
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        // Return fallback data if fetch fails
        return {
            title: "Welcome to PurpleHallos",
            description: "Check out my latest content on YouTube!",
            thumbnail: "",
            videoUrl: "https://www.youtube.com/@PurpleHallos",
            publishedAt: "Recent"
        };
    }
}

async function updateCache(url, data = null) {
    if (!data) {
        data = await fetchData();
    }
    await caches.default.put(url, new Response(JSON.stringify(data), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=3600'
        }
    }));
}
