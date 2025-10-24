export default {
    async fetch(request, env, ctx) {
        try {
            console.log('Fetching Goodreads RSS feed...');
            
            // Fetch the Goodreads RSS feed
            const rssResponse = await fetch('https://www.goodreads.com/user/updates_rss/187863776?key=ykFaD4-IQ7HvBptnxbocARC6Vq5yeUDawEu7VtxQjkyZbZBP', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!rssResponse.ok) {
                throw new Error(`RSS feed request failed: ${rssResponse.status}`);
            }
            
            const rssText = await rssResponse.text();
            console.log('RSS feed fetched, length:', rssText.length);
            
            // Parse the RSS feed to get the latest activities
            const activities = parseGoodreadsRSS(rssText);
            console.log('Parsed activities:', activities.length);
            
            return new Response(JSON.stringify(activities), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
                }
            });
            
        } catch (error) {
            console.error('Error fetching Goodreads data:', error);
            
            // Return fallback data if fetch fails
            const fallbackActivities = [
                {
                    status: "Reading",
                    title: "Check out my Goodreads profile",
                    image: "",
                    time: "Recent",
                    link: "https://www.goodreads.com/user/show/187863776"
                }
            ];
            
            return new Response(JSON.stringify(fallbackActivities), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};

function parseGoodreadsRSS(rssText) {
    const activities = [];
    
    try {
        // Extract all item entries from the RSS feed
        const itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g);
        
        if (!itemMatches || itemMatches.length === 0) {
            console.log('No items found in RSS feed');
            return activities;
        }
        
        console.log(`Found ${itemMatches.length} items in RSS feed`);
        
        // Process up to 4 items (activities)
        for (let i = 0; i < Math.min(4, itemMatches.length); i++) {
            const itemContent = itemMatches[i];
            
            // Extract title
            const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            const title = titleMatch ? titleMatch[1].trim() : 'Book Activity';
            
            // Extract description
            const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
            const description = descMatch ? descMatch[1].trim() : '';
            
            // Extract link
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const link = linkMatch ? linkMatch[1].trim() : '';
            
            // Extract pubDate
            const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
            
            // Extract image URL from description (Goodreads often includes book covers)
            let imageUrl = '';
            const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
            
            // Determine activity status from title/description
            let status = "Reading";
            if (title.toLowerCase().includes('finished') || title.toLowerCase().includes('read')) {
                status = "Finished";
            } else if (title.toLowerCase().includes('started') || title.toLowerCase().includes('reading')) {
                status = "Reading";
            } else if (title.toLowerCase().includes('want to read') || title.toLowerCase().includes('added')) {
                status = "Want to Read";
            }
            
            // Format date
            let formattedDate = 'Recent';
            if (pubDate) {
                try {
                    const date = new Date(pubDate);
                    const now = new Date();
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        formattedDate = 'Yesterday';
                    } else if (diffDays < 7) {
                        formattedDate = `${diffDays} days ago`;
                    } else if (diffDays < 30) {
                        const weeks = Math.floor(diffDays / 7);
                        formattedDate = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
                    } else {
                        formattedDate = date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        });
                    }
                } catch (e) {
                    console.error('Error formatting date:', e);
                    formattedDate = 'Recent';
                }
            }
            
            // Clean up title (remove HTML tags and extra whitespace)
            const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            
            activities.push({
                status: status,
                title: cleanTitle,
                image: imageUrl,
                time: formattedDate,
                link: link
            });
        }
        
        console.log('Parsed activities:', activities);
        return activities;
        
    } catch (error) {
        console.error('Error parsing Goodreads RSS:', error);
        return activities;
    }
}
