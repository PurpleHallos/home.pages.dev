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
        // YouTube Data API v3 endpoint to get latest video from channel
        const channelId = 'UC_your_channel_id'; // You'll need to replace this with your actual channel ID
        const apiKey = 'YOUR_YOUTUBE_API_KEY'; // You'll need to add this as an environment variable
        
        // For now, we'll use a simpler approach with RSS feed
        const response = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UC_your_channel_id');
        const xmlText = await response.text();
        
        // Parse XML to get latest video
        const videoMatch = xmlText.match(/<entry>([\s\S]*?)<\/entry>/);
        if (!videoMatch) {
            return {
                title: "No videos found",
                description: "Check back later for new content!",
                thumbnail: "",
                videoUrl: "https://www.youtube.com/@PurpleHallos",
                publishedAt: new Date().toISOString()
            };
        }
        
        const entryContent = videoMatch[1];
        
        // Extract video information
        const titleMatch = entryContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
        
        const linkMatch = entryContent.match(/<link href="(.*?)"/);
        const videoUrl = linkMatch ? linkMatch[1].trim() : '';
        
        const videoIdMatch = videoUrl.match(/watch\?v=([^&]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : '';
        
        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
        
        const publishedMatch = entryContent.match(/<published>(.*?)<\/published>/);
        const publishedAt = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();
        
        // Format date
        let formattedDate = '';
        if (publishedAt) {
            try {
                const date = new Date(publishedAt);
                formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            } catch (e) {
                formattedDate = '';
            }
        }
        
        return {
            title: title,
            description: "Latest video from PurpleHallos",
            thumbnail: thumbnail,
            videoUrl: videoUrl,
            publishedAt: formattedDate
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
