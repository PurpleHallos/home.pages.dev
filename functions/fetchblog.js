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
        // Fetch RSS feed from purpleyard.xyz
        const response = await fetch('https://purpleyard.xyz/index.xml');
        const xmlText = await response.text();
        
        // Parse XML using regex (since DOMParser might not be available in Cloudflare Workers)
        const articles = [];
        
        // Extract items using regex
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;
        
        while ((match = itemRegex.exec(xmlText)) !== null && count < 6) {
            const itemContent = match[1];
            
            // Extract title
            const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
            const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
            
            // Extract link
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const link = linkMatch ? linkMatch[1].trim() : '';
            
            // Extract description
            const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
            const description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
            
            // Extract pubDate
            const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const pubDate = dateMatch ? dateMatch[1].trim() : '';
            
            // Format date
            let date = '';
            if (pubDate) {
                try {
                    const articleDate = new Date(pubDate);
                    date = articleDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                } catch (e) {
                    date = '';
                }
            }
            
            // Clean description (remove HTML tags and limit length)
            const cleanDescription = description
                .replace(/<[^>]*>/g, '')
                .substring(0, 100)
                .trim();
            
            if (title && link) {
                articles.push({
                    title: title,
                    link: link,
                    description: cleanDescription + (cleanDescription.length >= 100 ? '...' : ''),
                    date: date || 'Recent'
                });
                count++;
            }
        }
        
        return articles;
    } catch (error) {
        console.error('Error fetching blog articles:', error);
        // Return fallback articles if fetch fails
        return [
            {
                title: "Welcome to PurpleYard",
                link: "https://purpleyard.xyz",
                description: "My personal blog where I share thoughts, tutorials, and experiences...",
                date: "Recent"
            }
        ];
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
