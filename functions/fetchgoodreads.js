export default {
    async fetch(request, env, ctx) {
        try {
            console.log('Fetching Goodreads RSS feed...');
            
            // Goodreads RSS feed URL (no API key needed)
            const userId = '187863776'; // Your Goodreads user ID
            const rssUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=currently-reading&per_page=10`;
            
            console.log('Fetching RSS from:', rssUrl);
            
            const rssResponse = await fetch(rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('RSS response status:', rssResponse.status);
            
            if (!rssResponse.ok) {
                throw new Error(`RSS fetch failed with status: ${rssResponse.status}`);
            }
            
            const rssText = await rssResponse.text();
            console.log('RSS feed fetched, length:', rssText.length);
            
            // Parse the RSS feed
            const activities = parseGoodreadsRSS(rssText);
            console.log('Parsed activities count:', activities.length);
            
            if (activities.length === 0) {
                console.log('No activities found, returning fallback data');
                return new Response(JSON.stringify(getFallbackData()), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=300'
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
            return new Response(JSON.stringify(getFallbackData()), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=60'
                }
            });
        }
    }
};

function getFallbackData() {
    return [
        {
            status: "قراءة",
            title: "تحقق من ملفي الشخصي في جود ريدز",
            image: "https://images-na.ssl-images-amazon.com/images/I/51ZSpMl1-LL._SX331_BO1,204,203,200_.jpg",
            time: "حديث",
            link: "https://www.goodreads.com/user/show/187863776"
        },
        {
            status: "قراءة",
            title: "Goodreads Profile",
            image: "https://images-na.ssl-images-amazon.com/images/I/51ZSpMl1-LL._SX331_BO1,204,203,200_.jpg",
            time: "حديث",
            link: "https://www.goodreads.com/user/show/187863776"
        }
    ];
}

function parseGoodreadsRSS(rssText) {
    const activities = [];
    
    try {
        console.log('RSS feed content preview:', rssText.substring(0, 500));
        
        // Parse XML using regex (simple approach for RSS)
        const itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g);
        
        if (!itemMatches || itemMatches.length === 0) {
            console.log('No items found in RSS feed');
            return activities;
        }
        
        console.log(`Found ${itemMatches.length} items in RSS feed`);
        
        // Process up to 4 items
        for (let i = 0; i < Math.min(4, itemMatches.length); i++) {
            const itemContent = itemMatches[i];
            
            // Extract title
            let title = 'Book Activity';
            const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            if (titleMatch) {
                title = titleMatch[1].trim();
            } else {
                const altTitleMatch = itemContent.match(/<title>(.*?)<\/title>/);
                if (altTitleMatch) {
                    title = altTitleMatch[1].trim();
                }
            }
            
            // Extract description for image and additional info
            let description = '';
            const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
            if (descMatch) {
                description = descMatch[1];
            } else {
                const altDescMatch = itemContent.match(/<description>(.*?)<\/description>/);
                if (altDescMatch) {
                    description = altDescMatch[1];
                }
            }
            
            // Extract link
            let link = '';
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            if (linkMatch) {
                link = linkMatch[1].trim();
            }
            
            // Extract image from description
            let imageUrl = '';
            const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
            
            // Extract date
            let pubDate = '';
            const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            if (dateMatch) {
                pubDate = dateMatch[1].trim();
            }
            
            // Format date
            let formattedDate = 'حديث';
            if (pubDate) {
                try {
                    const date = new Date(pubDate);
                    const now = new Date();
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        formattedDate = 'أمس';
                    } else if (diffDays < 7) {
                        formattedDate = `منذ ${diffDays} أيام`;
                    } else if (diffDays < 30) {
                        const weeks = Math.floor(diffDays / 7);
                        formattedDate = weeks === 1 ? 'منذ أسبوع' : `منذ ${weeks} أسابيع`;
                    } else {
                        formattedDate = date.toLocaleDateString('ar-SA', { 
                            month: 'short', 
                            day: 'numeric' 
                        });
                    }
                } catch (e) {
                    console.error('Error formatting date:', e);
                    formattedDate = 'حديث';
                }
            }
            
            // Clean up title (remove HTML tags)
            const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            
            // Determine status based on title or description
            let status = "قراءة";
            const titleLower = title.toLowerCase();
            const descLower = description.toLowerCase();
            
            if (descLower.includes('currently-reading') || titleLower.includes('currently reading')) {
                status = "قراءة";
            } else if (descLower.includes('want-to-read') || titleLower.includes('want to read')) {
                status = "أريد القراءة";
            } else if (descLower.includes('read') || titleLower.includes('read')) {
                status = "مقروء";
            } else if (descLower.includes('reviewed') || titleLower.includes('reviewed')) {
                status = "مراجع";
            }
            
            const activity = {
                status: status,
                title: cleanTitle,
                image: imageUrl,
                time: formattedDate,
                link: link || 'https://www.goodreads.com/user/show/187863776'
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
