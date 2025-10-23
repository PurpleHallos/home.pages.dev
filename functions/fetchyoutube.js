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
        // Use the correct channel ID directly
        const channelId = 'UCg2t_zRgiKpVerhYTXQj3GQ';
        
        console.log('Fetching YouTube RSS feed for channel:', channelId);
        
        // Fetch the RSS feed using the channel ID
        const rssResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!rssResponse.ok) {
            throw new Error(`RSS feed request failed: ${rssResponse.status}`);
        }
        
        const rssText = await rssResponse.text();
        console.log('RSS feed fetched, length:', rssText.length);
        
        // Parse the RSS feed to get the latest video - try multiple approaches
        let entryContent = '';
        
        // Try to find the first entry
        const entryMatch = rssText.match(/<entry>([\s\S]*?)<\/entry>/);
        if (entryMatch) {
            entryContent = entryMatch[1];
        } else {
            // Try alternative parsing
            const entries = rssText.split('<entry>');
            if (entries.length > 1) {
                entryContent = entries[1].split('</entry>')[0];
            }
        }
        
        if (!entryContent) {
            console.error('No entry content found in RSS feed');
            throw new Error('No videos found in RSS feed');
        }
        
        console.log('Entry content found, length:', entryContent.length);
        
        // Extract video information with better regex patterns
        let title = 'Latest Video';
        let videoUrl = 'https://www.youtube.com/@PurpleHallos';
        let videoId = '';
        let publishedAt = new Date().toISOString();
        
        // Extract title - try multiple patterns
        const titlePatterns = [
            /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
            /<title>(.*?)<\/title>/,
            /<yt:videoId>(.*?)<\/yt:videoId>/
        ];
        
        for (const pattern of titlePatterns) {
            const match = entryContent.match(pattern);
            if (match) {
                if (pattern.source.includes('videoId')) {
                    videoId = match[1].trim();
                    title = `Video ${videoId}`;
                } else {
                    title = match[1].trim();
                }
                break;
            }
        }
        
        // Extract video URL
        const linkMatch = entryContent.match(/<link[^>]*href="([^"]*)"/);
        if (linkMatch) {
            videoUrl = linkMatch[1].trim();
            // Extract video ID from URL
            const idMatch = videoUrl.match(/watch\?v=([^&]+)/);
            if (idMatch) {
                videoId = idMatch[1];
            }
        }
        
        // Extract video ID directly if not found in URL
        if (!videoId) {
            const videoIdMatch = entryContent.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
            if (videoIdMatch) {
                videoId = videoIdMatch[1].trim();
                videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            }
        }
        
        // Get thumbnail
        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
        
        // Extract published date
        const publishedMatch = entryContent.match(/<published>(.*?)<\/published>/);
        if (publishedMatch) {
            publishedAt = publishedMatch[1].trim();
        }
        
        // Format date
        let formattedDate = 'Recent';
        if (publishedAt) {
            try {
                const date = new Date(publishedAt);
                formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            } catch (e) {
                console.error('Error formatting date:', e);
                formattedDate = 'Recent';
            }
        }
        
        console.log('Extracted data:', { title, videoUrl, videoId, thumbnail, publishedAt: formattedDate });
        
        return {
            title: title,
            description: "Latest video from Hallos | هالوس",
            thumbnail: thumbnail,
            videoUrl: videoUrl,
            publishedAt: formattedDate
        };
        
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        // Return fallback data if fetch fails
        return {
            title: "Welcome to Hallos | هالوس",
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
