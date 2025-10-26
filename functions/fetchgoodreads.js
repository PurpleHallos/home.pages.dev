export async function onRequestGet({ request, waitUntil }) {
    try {
        console.log('Fetching Goodreads RSS feed...');
        
        // Try multiple RSS feed URLs since Goodreads format may vary
        const userId = '187863776';
        const rssUrls = [
            `https://www.goodreads.com/review/list_rss/${userId}?shelf=currently-reading&per_page=10`,
            `https://www.goodreads.com/review/list_rss/${userId}?shelf=read&per_page=10`,
            `https://www.goodreads.com/review/list_rss/${userId}?per_page=10`,
            `https://www.goodreads.com/user/${userId}/books.rss`,
            `https://www.goodreads.com/review/list_rss/${userId}?shelf=to-read&per_page=10`,
            `https://www.goodreads.com/review/list_rss/${userId}?shelf=recently-read&per_page=10`
        ];
        
        let activities = [];
        let lastError = null;
        
        for (const rssUrl of rssUrls) {
            try {
                console.log('Trying RSS URL:', rssUrl);
                
                const rssResponse = await fetch(rssUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                console.log('RSS response status:', rssResponse.status);
                
                if (rssResponse.ok) {
                    const rssText = await rssResponse.text();
                    console.log('RSS feed fetched, length:', rssText.length);
                    
                    // Parse the RSS feed
                    activities = parseGoodreadsRSS(rssText);
                    console.log('Parsed activities count:', activities.length);
                    
                    if (activities.length > 0) {
                        console.log('Successfully found activities, breaking loop');
                        break;
                    }
                } else {
                    console.log(`RSS URL failed with status: ${rssResponse.status}`);
                }
            } catch (error) {
                console.log(`Error with RSS URL ${rssUrl}:`, error.message);
                lastError = error;
            }
        }
        
        if (activities.length === 0) {
            console.log('No activities found in any RSS feed, returning fallback data');
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
                'Cache-Control': 'public, max-age=300'
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

function getFallbackData() {
    return [
        {
            status: "قراءة",
            title: "تحقق من ملفي الشخصي في جود ريدز",
            image: "https://images-na.ssl-images-amazon.com/images/I/51ZSpMl1-LL._SX331_BO1,204,203,200_.jpg",
            time: "اليوم",
            link: "https://www.goodreads.com/user/show/187863776"
        },
        {
            status: "مقروء",
            title: "Goodreads Profile",
            image: "https://images-na.ssl-images-amazon.com/images/I/41d1gVUK1yL._SX331_BO1,204,203,200_.jpg",
            time: "أمس",
            link: "https://www.goodreads.com/user/show/187863776"
        },
        {
            status: "أريد القراءة",
            title: "زيارة الملف الشخصي",
            image: "https://images-na.ssl-images-amazon.com/images/I/51W1r7OoqJL._SX331_BO1,204,203,200_.jpg",
            time: "منذ 3 أيام",
            link: "https://www.goodreads.com/user/show/187863776"
        },
        {
            status: "مراجع",
            title: "Goodreads Activity",
            image: "https://images-na.ssl-images-amazon.com/images/I/41yJ75gpV-L._SX331_BO1,204,203,200_.jpg",
            time: "منذ أسبوع",
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
            
            // Extract image from description - try multiple patterns
            let imageUrl = '';
            
            // Try different image patterns
            const imgPatterns = [
                /<img[^>]+src="([^"]+)"/,
                /<img[^>]+src='([^']+)'/,
                /src="([^"]*book[^"]*\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
                /src="([^"]*cover[^"]*\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
                /src="([^"]*\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i
            ];
            
            for (const pattern of imgPatterns) {
                const imgMatch = description.match(pattern);
                if (imgMatch && imgMatch[1]) {
                    imageUrl = imgMatch[1];
                    // Clean up the URL
                    imageUrl = imageUrl.replace(/&amp;/g, '&');
                    break;
                }
            }
            
            // If no image found, try to extract from title or use a default
            if (!imageUrl) {
                // Try to find book cover URL in the description
                const bookCoverMatch = description.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp)/i);
                if (bookCoverMatch) {
                    imageUrl = bookCoverMatch[0];
                } else {
                    // Use a default book cover
                    imageUrl = 'https://images-na.ssl-images-amazon.com/images/I/51ZSpMl1-LL._SX331_BO1,204,203,200_.jpg';
                }
            }
            
            // Extract date - try multiple date fields
            let pubDate = '';
            const datePatterns = [
                /<pubDate>(.*?)<\/pubDate>/,
                /<dc:date>(.*?)<\/dc:date>/,
                /<updated>(.*?)<\/updated>/,
                /<lastBuildDate>(.*?)<\/lastBuildDate>/
            ];
            
            for (const pattern of datePatterns) {
                const dateMatch = itemContent.match(pattern);
                if (dateMatch && dateMatch[1]) {
                    pubDate = dateMatch[1].trim();
                    break;
                }
            }
            
            // Format date with better Arabic formatting
            let formattedDate = 'حديث';
            if (pubDate) {
                try {
                    const date = new Date(pubDate);
                    const now = new Date();
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) {
                        formattedDate = 'اليوم';
                    } else if (diffDays === 1) {
                        formattedDate = 'أمس';
                    } else if (diffDays < 7) {
                        formattedDate = `منذ ${diffDays} أيام`;
                    } else if (diffDays < 30) {
                        const weeks = Math.floor(diffDays / 7);
                        formattedDate = weeks === 1 ? 'منذ أسبوع' : `منذ ${weeks} أسابيع`;
                    } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        formattedDate = months === 1 ? 'منذ شهر' : `منذ ${months} أشهر`;
                    } else {
                        formattedDate = date.toLocaleDateString('ar-SA', { 
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric' 
                        });
                    }
                } catch (e) {
                    console.error('Error formatting date:', e);
                    formattedDate = 'حديث';
                }
            }
            
            // Clean up title (remove HTML tags and extra whitespace)
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
