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
        // Try to get your YouTube channel ID from the channel page
        const channelResponse = await fetch('https://www.youtube.com/@PurpleHallos');
        const channelHtml = await channelResponse.text();
        
        // Extract channel ID from the page
        const channelIdMatch = channelHtml.match(/"channelId":"([^"]+)"/);
        const channelId = channelIdMatch ? channelIdMatch[1] : null;
        
        if (!channelId) {
            throw new Error('Could not find channel ID');
        }
        
        // Now fetch the RSS feed using the channel ID
        const rssResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        const rssText = await rssResponse.text();
        
        // Parse the RSS feed to get the latest video
        const entryMatch = rssText.match(/<entry>([\s\S]*?)<\/entry>/);
        if (!entryMatch) {
            throw new Error('No videos found in RSS feed');
        }
        
        const entryContent = entryMatch[1];
        
        // Extract video information
        const titleMatch = entryContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : 'Latest Video';
        
        const linkMatch = entryContent.match(/<link href="(.*?)"/);
        const videoUrl = linkMatch ? linkMatch[1].trim() : 'https://www.youtube.com/@PurpleHallos';
        
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
                formattedDate = 'Recent';
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
