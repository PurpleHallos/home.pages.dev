export default {
    async fetch(request, env, ctx) {
        try {
            console.log('Fetching Goodreads RSS feed...');
            
            // Fetch the Goodreads RSS feed
            const rssResponse = await fetch('https://www.goodreads.com/user/updates_rss/187863776?key=ykFaD4-IQ7HvBptnxbocARC6Vq5yeUDawEu7VtxQjkyZbZBP', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('RSS response status:', rssResponse.status);
            console.log('RSS response headers:', Object.fromEntries(rssResponse.headers.entries()));
            
            if (!rssResponse.ok) {
                console.error(`RSS feed request failed: ${rssResponse.status} ${rssResponse.statusText}`);
                throw new Error(`RSS feed request failed: ${rssResponse.status}`);
            }
            
            const rssText = await rssResponse.text();
            console.log('RSS feed fetched, length:', rssText.length);
            console.log('RSS feed content type:', rssResponse.headers.get('content-type'));
            
            // Parse the RSS feed to get the latest activities
            const activities = parseGoodreadsRSS(rssText);
            console.log('Parsed activities count:', activities.length);
            
            if (activities.length === 0) {
                console.log('No activities parsed, returning fallback data');
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
            
            return new Response(JSON.stringify(activities), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
                }
            });
            
        } catch (error) {
            console.error('Error fetching Goodreads data:', error);
            console.error('Error stack:', error.stack);
            
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
        console.log('RSS feed content preview:', rssText.substring(0, 500));
        
        // Try multiple patterns to extract items
        let itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g);
        
        if (!itemMatches || itemMatches.length === 0) {
            // Try alternative pattern
            itemMatches = rssText.match(/<entry>([\s\S]*?)<\/entry>/g);
        }
        
        if (!itemMatches || itemMatches.length === 0) {
            console.log('No items found in RSS feed');
            console.log('RSS feed structure:', rssText.substring(0, 1000));
            return activities;
        }
        
        console.log(`Found ${itemMatches.length} items in RSS feed`);
        
        // Process up to 4 items (activities)
        for (let i = 0; i < Math.min(4, itemMatches.length); i++) {
            const itemContent = itemMatches[i];
            console.log(`Processing item ${i + 1}:`, itemContent.substring(0, 200));
            
            // Try multiple title patterns
            let title = 'Book Activity';
            const titlePatterns = [
                /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
                /<title>(.*?)<\/title>/,
                /<title[^>]*>(.*?)<\/title>/
            ];
            
            for (const pattern of titlePatterns) {
                const match = itemContent.match(pattern);
                if (match) {
                    title = match[1].trim();
                    break;
                }
            }
            
            // Try multiple description patterns
            let description = '';
            const descPatterns = [
                /<description><!\[CDATA\[(.*?)\]\]><\/description>/,
                /<description>(.*?)<\/description>/,
                /<summary><!\[CDATA\[(.*?)\]\]><\/summary>/,
                /<summary>(.*?)<\/summary>/
            ];
            
            for (const pattern of descPatterns) {
                const match = itemContent.match(pattern);
                if (match) {
                    description = match[1].trim();
                    break;
                }
            }
            
            // Try multiple link patterns
            let link = '';
            const linkPatterns = [
                /<link>(.*?)<\/link>/,
                /<link[^>]*href="([^"]*)"[^>]*>/,
                /<link[^>]*>(.*?)<\/link>/
            ];
            
            for (const pattern of linkPatterns) {
                const match = itemContent.match(pattern);
                if (match) {
                    link = match[1].trim();
                    break;
                }
            }
            
            // Try multiple date patterns
            let pubDate = '';
            const datePatterns = [
                /<pubDate>(.*?)<\/pubDate>/,
                /<published>(.*?)<\/published>/,
                /<updated>(.*?)<\/updated>/
            ];
            
            for (const pattern of datePatterns) {
                const match = itemContent.match(pattern);
                if (match) {
                    pubDate = match[1].trim();
                    break;
                }
            }
            
            // Extract image URL from description
            let imageUrl = '';
            const imgPatterns = [
                /<img[^>]+src="([^"]+)"/,
                /<img[^>]+src='([^']+)'/,
                /src="([^"]*\.(jpg|jpeg|png|gif|webp)[^"]*)"/i
            ];
            
            for (const pattern of imgPatterns) {
                const match = description.match(pattern);
                if (match) {
                    imageUrl = match[1];
                    break;
                }
            }
            
            // If no image found in description, try to extract from title or other fields
            if (!imageUrl) {
                const allContent = itemContent;
                for (const pattern of imgPatterns) {
                    const match = allContent.match(pattern);
                    if (match) {
                        imageUrl = match[1];
                        break;
                    }
                }
            }
            
            // Determine activity status from title/description
            let status = "Reading";
            const titleLower = title.toLowerCase();
            const descLower = description.toLowerCase();
            
            if (titleLower.includes('finished') || titleLower.includes('read') || descLower.includes('finished')) {
                status = "Finished";
            } else if (titleLower.includes('started') || titleLower.includes('reading') || descLower.includes('started')) {
                status = "Reading";
            } else if (titleLower.includes('want to read') || titleLower.includes('added') || descLower.includes('want to read')) {
                status = "Want to Read";
            } else if (titleLower.includes('reviewed') || descLower.includes('reviewed')) {
                status = "Reviewed";
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
            
            const activity = {
                status: status,
                title: cleanTitle,
                image: imageUrl,
                time: formattedDate,
                link: link
            };
            
            console.log(`Activity ${i + 1}:`, activity);
            activities.push(activity);
        }
        
        console.log('Final parsed activities:', activities);
        return activities;
        
    } catch (error) {
        console.error('Error parsing Goodreads RSS:', error);
        return activities;
    }
}
