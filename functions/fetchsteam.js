export default {
    async fetch(request, env, ctx) {
        try {
            console.log('Fetching Steam profile data...');
            
            // Fetch the Steam profile page
            const profileResponse = await fetch('https://steamcommunity.com/id/realpurplehallos/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('Steam profile response status:', profileResponse.status);
            
            if (!profileResponse.ok) {
                throw new Error(`Steam profile request failed: ${profileResponse.status}`);
            }
            
            const profileHtml = await profileResponse.text();
            console.log('Steam profile HTML fetched, length:', profileHtml.length);
            
            // Parse the profile HTML to extract game data
            const gameData = parseSteamProfile(profileHtml);
            console.log('Parsed game data:', gameData);
            
            return new Response(JSON.stringify(gameData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
                }
            });
            
        } catch (error) {
            console.error('Error fetching Steam data:', error);
            console.error('Error stack:', error.stack);
            
            // Return fallback data if fetch fails
            const fallbackData = {
                gameName: "Steam Profile",
                gameImage: "",
                playTime: "Check out my Steam profile",
                lastPlayed: "Recent",
                profileUrl: "https://steamcommunity.com/id/realpurplehallos/"
            };
            
            return new Response(JSON.stringify(fallbackData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};

function parseSteamProfile(html) {
    try {
        console.log('Parsing Steam profile HTML...');
        
        // Extract game information from the profile
        let gameName = 'Steam Profile';
        let gameImage = '';
        let playTime = 'Check out my Steam profile';
        let lastPlayed = 'Recent';
        let profileUrl = 'https://steamcommunity.com/id/realpurplehallos/';
        
        // Try to find recent game information
        // Look for game name in various patterns
        const gameNamePatterns = [
            /<div[^>]*class="[^"]*recent_game[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*game_name[^"]*"[^>]*>([^<]+)<\/div>/i,
            /<div[^>]*class="[^"]*game_name[^"]*"[^>]*>([^<]+)<\/div>/i,
            /<span[^>]*class="[^"]*game_name[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<a[^>]*href="[^"]*app\/\d+[^"]*"[^>]*>([^<]+)<\/a>/i
        ];
        
        for (const pattern of gameNamePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                gameName = match[1].trim();
                console.log('Found game name:', gameName);
                break;
            }
        }
        
        // Try to find game image
        const imagePatterns = [
            /<img[^>]*src="([^"]*steamcdn-a\.akamaihd\.net[^"]*)"[^>]*>/i,
            /<img[^>]*src="([^"]*steamstatic[^"]*)"[^>]*>/i,
            /<img[^>]*src="([^"]*\.jpg[^"]*)"[^>]*class="[^"]*game_icon[^"]*"/i,
            /<img[^>]*class="[^"]*game_icon[^"]*"[^>]*src="([^"]*)"[^>]*>/i
        ];
        
        for (const pattern of imagePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                gameImage = match[1].trim();
                console.log('Found game image:', gameImage);
                break;
            }
        }
        
        // Try to find play time information
        const playTimePatterns = [
            /<div[^>]*class="[^"]*playtime[^"]*"[^>]*>([^<]+)<\/div>/i,
            /<span[^>]*class="[^"]*playtime[^"]*"[^>]*>([^<]+)<\/span>/i,
            /(\d+\.?\d*\s*hours?)/i
        ];
        
        for (const pattern of playTimePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                playTime = match[1].trim();
                console.log('Found play time:', playTime);
                break;
            }
        }
        
        // Try to find last played information
        const lastPlayedPatterns = [
            /<div[^>]*class="[^"]*last_played[^"]*"[^>]*>([^<]+)<\/div>/i,
            /<span[^>]*class="[^"]*last_played[^"]*"[^>]*>([^<]+)<\/span>/i,
            /(last played|played|hours ago|days ago)/i
        ];
        
        for (const pattern of lastPlayedPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                lastPlayed = match[1].trim();
                console.log('Found last played:', lastPlayed);
                break;
            }
        }
        
        // If no specific game found, use profile information
        if (gameName === 'Steam Profile') {
            // Try to extract profile name
            const profileNameMatch = html.match(/<title>([^<]+)<\/title>/);
            if (profileNameMatch) {
                gameName = profileNameMatch[1].replace('Steam Community :: ', '').trim();
            }
        }
        
        const gameData = {
            gameName: gameName,
            gameImage: gameImage,
            playTime: playTime,
            lastPlayed: lastPlayed,
            profileUrl: profileUrl
        };
        
        console.log('Final game data:', gameData);
        return gameData;
        
    } catch (error) {
        console.error('Error parsing Steam profile:', error);
        return {
            gameName: "Steam Profile",
            gameImage: "",
            playTime: "Check out my Steam profile",
            lastPlayed: "Recent",
            profileUrl: "https://steamcommunity.com/id/realpurplehallos/"
        };
    }
}
