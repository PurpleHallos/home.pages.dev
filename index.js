updateScrollPercent();
['scroll', 'resize'].forEach(e => addEventListener(e, updateScrollPercent));

function updateScrollPercent() {
    document.body.style.setProperty('--scroll', scrollY / innerHeight);
}

const bg = document.querySelector('.background');

addEventListener('touchstart', () => bg.style.setProperty('--multiplier', '0'), { once: true });

let isUpdatingBgPosition = false;
let isMouseLeft = false;

addEventListener('mousemove', ({ clientX, clientY }) => {
    if (isUpdatingBgPosition) return;
    isUpdatingBgPosition = true;
    requestAnimationFrame(() => {
        if (isMouseLeft) return isUpdatingBgPosition = false;
        bg.style.setProperty('--tx', `${20 * (clientX - innerWidth / 2) / innerWidth}px`);
        bg.style.setProperty('--ty', `${20 * (clientY - innerHeight / 2) / innerHeight}px`);
        isUpdatingBgPosition = false;
    });
});

document.addEventListener('mouseleave', () => {
    isMouseLeft = true;
    bg.removeAttribute('style');
    applyBackgroundTransition();
});

document.addEventListener('mouseenter', () => {
    isMouseLeft = false;
    applyBackgroundTransition();
});

function applyBackgroundTransition() {
    bg.style.transition = 'transform .1s linear';
    bg.addEventListener('transitionend', () => bg.style.transition = '', { once: true });
}

document.querySelector('header svg').style = `-webkit-mask-image:url('data:image/svg+xml,<!--${Math.random()}--><svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 550 100"><style>@keyframes dash{0%{stroke-dashoffset:727px;}to{stroke-dashoffset:0;};}@keyframes stroke-width{0%{stroke-width:3px;}to{stroke-width:12px;};}@keyframes fade{0%{opacity:0;}to{opacity:1;};}path{fill:none;stroke:%23fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:3px;stroke-dasharray:727px;stroke-dashoffset:727px;animation:dash 1s cubic-bezier(.8,0,.2,1) var(--delay) forwards,stroke-width 1s cubic-bezier(.8,0,.2,1) calc(var(--delay) + .5s) forwards,fade .2s linear calc(var(--delay) + 0s) forwards;}</style><path d="M0 73.81 33.2.01l33.3 73.8m-54-20.7h41.6" style="--delay:0.3s"/><path d="M82 28.71v24.6q0 6.5 2.55 10.85t6.9 6.5q4.35 2.15 9.85 2.15 5.4 0 9.7-2.1 4.3-2.1 6.8-5.65 2.5-3.55 2.5-8.05v-28.3" style="--delay:0.5s"/><path d="M154 9.11v49.8q0 5.8 3.6 9.45 3.6 3.65 9.3 3.65h2.2m-29-43.3h29.1" style="--delay:0.7s"/><path d="M190 28.71v24.6q0 6.5 2.55 10.85t6.9 6.5q4.35 2.15 9.85 2.15 5.4 0 9.7-2.1 4.3-2.1 6.8-5.65 2.5-3.55 2.5-8.05v-28.3" style="--delay:0.9s"/><path d="M251 28.71v46.4-30.6q0-7 4.4-11.4t11.3-4.4q6.5 0 10.55 4.9 4.05 4.9 4.05 12.6v28.9-30.6q0-7 4.1-11.4 4.7-4.4 11.3-4.4 6.8 0 10.55 4.9 4.35 4.9 4.05 12.6l.3 28.9" style="--delay:1.1s"/><path d="M334 28.71v46.4-30.6q0-4.5 2.5-8.1 2.5-3.6 6.8-5.65 4.3-2.05 9.7-2.05 5.5 0 9.85 2.15t6.9 6.45q2.55 4.3 2.55 10.9v26.9" style="--delay:1.3s"/><path d="m388 .01 31.8 78.1L452 .01" style="--delay:1.5s"/><path d="M475 78.11V.01l56.1 78.1V.01" style="--delay:1.7s"/></svg>');`;

document.querySelector('.arrow svg').addEventListener('click', () => {
    smoothScrollTo(innerWidth > 880 ? .25 * innerHeight + 30 : .25 * innerHeight + 380);
});

function smoothScrollTo(target) {
    const { documentElement } = document;
    const start = documentElement.scrollTop;
    const startTime = performance.now();

    requestAnimationFrame(scroll);

    function scroll() {
        const time = Math.min(1, (performance.now() - startTime) / 200);
        const timeFunction = time * (2 - time);
        documentElement.scrollTop = (timeFunction * (target - start)) + start;
        if (Math.abs(documentElement.scrollTop - target) > 1) requestAnimationFrame(scroll);
    };
}

document.querySelectorAll('.overflow').forEach(e => {
    e.addEventListener('mouseenter', () => {
        if (e.scrollWidth > e.clientWidth) e.title = e.textContent.trim();
    });
});

// Function to detect if text contains Arabic characters
function containsArabic(text) {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
}

fetch('/fetchblog').then(r => r.json()).then(articles => {
    const blogContainer = document.getElementById('blog-articles');
    
    if (articles && articles.length > 0) {
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'project';
            
            // Detect if title contains Arabic
            const titleIsArabic = containsArabic(article.title);
            const descriptionIsArabic = containsArabic(article.description);
            
            articleElement.innerHTML = `
                <a href="${article.link}" target="_blank" rel="noopener noreferrer">
                    <div class="bold" dir="${titleIsArabic ? 'rtl' : 'ltr'}" lang="${titleIsArabic ? 'ar' : 'en'}">${article.title}</div>
                    <div class="opaque" dir="${descriptionIsArabic ? 'rtl' : 'ltr'}" lang="${descriptionIsArabic ? 'ar' : 'en'}">${article.description}</div>
                    <div class="meta">
                        <div>
                            <svg fill="currentColor" viewBox="0 0 16 16" height="1em" width="1em">
                                <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                                <path d="M8 4c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V5c0-.55-.45-1-1-1z"/>
                                <path d="M8 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                            </svg>
                            <div class="blog-date" dir="ltr">${article.date}</div>
                        </div>
                    </div>
                </a>
            `;
            blogContainer.appendChild(articleElement);
        });
    } else {
        blogContainer.innerHTML = `
            <div class="project">
                <a href="https://purpleyard.xyz" target="_blank" rel="noopener noreferrer">
                    <div class="bold" dir="rtl" lang="ar">مرحباً بك في PurpleYard</div>
                    <div class="opaque" dir="rtl" lang="ar">زر مدونتي لقراءة أحدث المقالات</div>
                    <div class="meta">
                        <div>
                            <svg fill="currentColor" viewBox="0 0 16 16" height="1em" width="1em">
                                <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                                <path d="M8 4c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V5c0-.55-.45-1-1-1z"/>
                                <path d="M8 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                            </svg>
                            <div class="blog-date" dir="ltr">Recent</div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }
}).catch(error => {
    console.error('Error fetching blog articles:', error);
    const blogContainer = document.getElementById('blog-articles');
    blogContainer.innerHTML = `
        <div class="project">
            <a href="https://purpleyard.xyz" target="_blank" rel="noopener noreferrer">
                <div class="bold" dir="rtl" lang="ar">مدونة PurpleYard</div>
                <div class="opaque" dir="rtl" lang="ar">زر مدونتي لقراءة أحدث المقالات</div>
                <div class="meta">
                    <div>
                        <svg fill="currentColor" viewBox="0 0 16 16" height="1em" width="1em">
                            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                            <path d="M8 4c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V5c0-.55-.45-1-1-1z"/>
                            <path d="M8 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                        </svg>
                        <div class="blog-date" dir="ltr">Visit Blog</div>
                    </div>
                </div>
            </a>
        </div>
    `;
});

// YouTube widget functionality
fetch('/fetchyoutube').then(r => r.json()).then(video => {
    console.log('YouTube data received:', video);
    const youtubeWidget = document.querySelector('.youtube');
    
    if (video && youtubeWidget) {
        // Update the widget content
        const videoTitle = youtubeWidget.querySelector('.video-title');
        const videoDescription = youtubeWidget.querySelector('.video-description');
        const videoDate = youtubeWidget.querySelector('.video-date');
        const videoThumbnail = youtubeWidget.querySelector('.video-thumbnail img');
        const videoThumbnailContainer = youtubeWidget.querySelector('.video-thumbnail-container');
        const videoLink = youtubeWidget.querySelector('.content');
        
        if (videoTitle) videoTitle.textContent = video.title;
        if (videoDescription) videoDescription.textContent = video.description;
        if (videoDate) videoDate.textContent = video.publishedAt;
        if (videoThumbnail && video.thumbnail) {
            videoThumbnail.src = video.thumbnail;
            videoThumbnail.alt = video.title;
        }
        
        // Make the thumbnail clickable to open the video
        if (videoThumbnailContainer && video.videoUrl) {
            videoThumbnailContainer.addEventListener('click', () => {
                window.open(video.videoUrl, '_blank');
            });
        }
        
        // Make the header clickable to open the channel
        if (videoLink) {
            videoLink.style.cursor = 'pointer';
            videoLink.addEventListener('click', () => {
                window.open('https://www.youtube.com/@PurpleHallos', '_blank');
            });
        }
        
        // Make the video title clickable too
        if (videoTitle && video.videoUrl) {
            videoTitle.style.cursor = 'pointer';
            videoTitle.style.color = '#06b';
            videoTitle.addEventListener('click', () => {
                window.open(video.videoUrl, '_blank');
            });
        }
        
        // Update the loading text
        const loadingText = youtubeWidget.querySelector('.opaque');
        if (loadingText) loadingText.textContent = 'Hallos | هالوس';
    }
}).catch(error => {
    console.error('Error fetching YouTube data:', error);
    const youtubeWidget = document.querySelector('.youtube');
    if (youtubeWidget) {
        const videoTitle = youtubeWidget.querySelector('.video-title');
        const videoDescription = youtubeWidget.querySelector('.video-description');
        const videoDate = youtubeWidget.querySelector('.video-date');
        const loadingText = youtubeWidget.querySelector('.opaque');
        
        if (videoTitle) videoTitle.textContent = 'Welcome to PurpleHallos';
        if (videoDescription) videoDescription.textContent = 'Check out my latest content on YouTube!';
        if (videoDate) videoDate.textContent = 'Visit Channel';
        if (loadingText) loadingText.textContent = 'PurpleHallos';
        
        // Make it clickable to open YouTube channel
        const videoLink = youtubeWidget.querySelector('.content');
        if (videoLink) {
            videoLink.style.cursor = 'pointer';
            videoLink.addEventListener('click', () => {
                window.open('https://www.youtube.com/@PurpleHallos', '_blank');
            });
        }
    }
});

const TIME_UNIT = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60]
];

!async function anilist() {
    const query = `query {
        Page(page: 1, perPage: 4) {
            activities(userId: 7357610, sort: ID_DESC) {
                ... on ListActivity {
                    createdAt
                    status
                    progress
                    media {
                        coverImage {
                            medium
                        }
                        title {
                            english
                            romaji
                        }
                        siteUrl
                    }
                }
            }
        }
    }`;

    const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query })
    }).then(r => r.json());

    if (!res.data) return;

    const { activities } = res.data.Page;

    document.querySelectorAll('.anilist .activity').forEach((a, i) => a.href = activities[i].media.siteUrl);
    document.querySelectorAll('.anilist .activity .image').forEach((i, j) => i.style = `background-image: url(${imageProxy(activities[j].media.coverImage.medium)})`);
    document.querySelectorAll('.anilist .activity .status').forEach((s, i) => s.textContent = `${activities[i].status}${activities[i].progress ? ` ${activities[i].progress}` : ''}`.charAt(0).toUpperCase() + `${activities[i].status}${activities[i].progress ? ` ${activities[i].progress}` : ''}`.slice(1));
    document.querySelectorAll('.anilist .activity .title').forEach((t, i) => t.textContent = activities[i].media.title.english || activities[i].media.title.romaji);
    document.querySelectorAll('.anilist .activity time').forEach((t, i) => {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - activities[i].createdAt;
        let textContent = 'just now';

        for (const [unit, value] of TIME_UNIT) {
            const amount = Math.floor(diff / value);
            if (amount > 0) {
                textContent = `${amount} ${unit}${amount > 1 ? 's' : ''} ago`;
                break;
            }
        }

        t.textContent = textContent;
        t.setAttribute('datetime', new Date(activities[i].createdAt * 1000).toISOString());
        t.title = new Date(activities[i].createdAt * 1000).toLocaleString();
    });
}();

fetch('/fetchlanyard').then(r => r.json()).then(updateLanyard);

!function lanyard() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.addEventListener('open', () => ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: '1154452833282818078' } })));
    ws.addEventListener('error', () => ws.close());
    ws.addEventListener('close', () => setTimeout(lanyard, 1000));
    ws.addEventListener('message', async ({ data }) => {
        const { t, d } = JSON.parse(data);
        if (t !== 'INIT_STATE' && t !== 'PRESENCE_UPDATE') return;
        updateLanyard(d);
    });
}();

const ACTIVITY_TYPE = ['Playing', 'Streaming to', 'Listening to', 'Watching', 'Custom status', 'Competing in'];
const STATUS_COLOR = { online: '#4b8', idle: '#fa1', dnd: '#f44', offline: '#778' };
const cache = new Map();

function updateLanyard({ discord_user, discord_status, activities }) {
    update('.discord .avatar', 'style', `background-image: url(${imageProxy(`https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.webp?size=80`)})`);
    update('.discord .display-name', 'textContent', discord_user.display_name);
    update('.discord .color-dot', 'style', `background-color: ${STATUS_COLOR[discord_status]}`);

    activities = activities.filter(a => a.type !== 4);
    if (!activities.length) {
        update('.discord .status', 'textContent', discord_status);
        update('.discord .activity', 'textContent', '');
        update('.discord .details', 'textContent', '');
        update('.discord .state', 'textContent', '');
        update('.discord .large-image', 'style', '');
        update('.discord .large-image', 'title', '');
        update('.discord .small-image', 'style', '');
        update('.discord .small-image', 'title', '');
        setRpcTimestamp('undefined undefined');
        return;
    }

    const a = activities[0];

    ['large', 'small'].forEach(async s => {
        const size = s === 'large' ? 160 : 60;
        let imageUrl = a.assets?.[`${s}_image`];
        if (!imageUrl) {
            if (s === 'large') {
                const { icon } = await fetch(`https://discord.com/api/v10/applications/${a.application_id}/rpc`).then(r => r.json());
                if (icon) return update(`.discord .${s}-image`, 'style', `background-image: url(${imageProxy(`https://cdn.discordapp.com/app-icons/${a.application_id}/${icon}.png?size=${size}`)})`);
            }
            update(`.discord .${s}-image`, 'style', '');
            update(`.discord .${s}-image`, 'title', '');
            if (s === 'small') update(`.discord .image-container foreignObject`, 'mask', '');
            return;
        }
        if (imageUrl.startsWith('mp:')) imageUrl = `https://media.discordapp.net/${imageUrl.slice(3)}?width=${size}&height=${size}`;
        else if (imageUrl.startsWith('spotify:')) imageUrl = `https://i.scdn.co/image/${imageUrl.slice(8)}`;
        else imageUrl = `https://cdn.discordapp.com/app-assets/${a.application_id}/${imageUrl}.png?size=${size}`;
        update(`.discord .${s}-image`, 'style', `background-image: url(${imageProxy(imageUrl)})`);
        update(`.discord .${s}-image`, 'title', a.assets?.[`${s}_text`] || '');
        if (s === 'small') update(`.discord .image-container foreignObject`, 'mask', 'url(#mask-large-image)');
    });

    update('.discord .status', 'textContent', ACTIVITY_TYPE[a.type]);
    update('.discord .activity', 'textContent', a.name);
    update('.discord .details', 'textContent', a.details);
    update('.discord .state', 'textContent', a.state);

    const timestamp = `${a.timestamps?.start} ${a.timestamps?.end}`;
    if (cache.get('timestamp') !== timestamp) setRpcTimestamp(timestamp);
}

function imageProxy(url) {
    return `https://chino.is-a.dev/cdn-cgi/image/format=avif/${url}`;
}

function update(selector, property, value) {
    const key = `${selector} ${property}`;
    if (cache.get(key) === value) return;

    let e = cache.get(selector);
    if (!e) cache.set(selector, e = document.querySelector(selector));
    if (['mask', 'datetime'].includes(property)) e.setAttribute(property, value);
    else e[property] = value;
    cache.set(key, value);
}

function setRpcTimestamp(timestamp = 'undefined undefined') {
    cache.set('timestamp', timestamp);

    if (timestamp === 'undefined undefined') {
        update('.discord .timestamp', 'textContent', '');
        update('.discord .timebar-container', 'style', 'display: none');
        return;
    }

    if (timestamp.includes('undefined')) {
        timestamp = Number(timestamp.split(' ')[0] === 'undefined' ? timestamp.split(' ')[1] : timestamp.split(' ')[0]);
        const diff = Math.abs(timestamp - Date.now());
        const hour = Math.floor(diff / 1000 / 60 / 60);
        const minute = Math.floor(diff / 1000 / 60) % 60;
        const second = Math.floor(diff / 1000) % 60;
        update('.discord .timestamp', 'textContent', `${hour ? `${padZero(hour)}:` : ''}${padZero(minute)}:${padZero(second)} ${timestamp > Date.now() ? 'left' : 'elapsed'}`);
        update('.discord .timebar-container', 'style', 'display: none');
        return;
    }

    const [start, end] = timestamp.split(' ').map(t => Number(t));
    const now = Date.now();
    const total = end - start;
    const current = now < end ? now - start : total;
    const progress = current / total * 100;
    const currentHour = Math.floor(current / 1000 / 60 / 60);
    const currentMinute = Math.floor(current / 1000 / 60) % 60;
    const currentSecond = Math.floor(current / 1000) % 60;
    const totalHour = Math.floor(total / 1000 / 60 / 60);
    const totalMinute = Math.floor(total / 1000 / 60) % 60;
    const totalSecond = Math.floor(total / 1000) % 60;
    update('.discord .current-time', 'textContent', `${currentHour ? `${padZero(currentHour)}:` : ''}${padZero(currentMinute)}:${padZero(currentSecond)}`);
    update('.discord .total-time', 'textContent', `${totalHour ? `${padZero(totalHour)}:` : ''}${padZero(totalMinute)}:${padZero(totalSecond)}`);
    update('.discord .timebar-progress', 'style', `width: ${Math.max(0, Math.min(100, progress))}%`);
    update('.discord .timebar-container', 'style', 'display: flex');
}

function padZero(n) {
    return n.toString().padStart(2, '0');
}

// const visitTime = new Date().setSeconds(0, 0);

/*
!function setClock() {
    const now = Date.now();
    const [month, day, year, hour, minute, second] = new Date().toLocaleString('en-US', { timeZone: 'Pacific/Gambier', hour12: false }).match(/\d+/g).map(Number);
    const hourOffset = -new Date().getTimezoneOffset() / 60;
    const utcTime = new Date(now - now % 1000 - hourOffset * 60 * 60 * 1000);
    const timezoneOffset = (new Date(year, month - 1, day, hour, minute, second) - utcTime) / 1000 / 60 / 60;
    const timezoneDiff = timezoneOffset - hourOffset;
    const myTime = new Date(now + timezoneDiff * 60 * 60 * 1000);
    const utcOffset = `${(timezoneOffset >= 0 ? '+' : '')}${Math.floor(timezoneOffset)}:${(timezoneOffset % 1 * 60).toString().padStart(2, '0')}`;

    update('.clock .hour-hand', 'style', `transform: rotate(${hour % 12 / 12 * 360 + minute / 60 * 30 + second / 60 / 60 * 30}deg)`);
    update('.clock .minute-hand', 'style', `transform: rotate(${minute / 60 * 360 + second / 60 * 6}deg)`);
    update('.clock .second-hand', 'style', `transform: rotate(${360 * Math.floor((now - visitTime) / 60 / 1000) + second / 60 * 360}deg)`);
    update('.clock .date', 'textContent', myTime.toLocaleDateString());
    update('.clock .date-container', 'datetime', myTime.toISOString().split('T')[0]);
    update('.clock .hour', 'textContent', padZero(hour));
    update('.clock .minute', 'textContent', padZero(minute));
    update('.clock .second', 'textContent', padZero(second));
    update('.clock .time-container', 'datetime', myTime.toISOString().split('T')[1].split('.')[0]);
    update('.clock .timezone-diff', 'textContent', timezoneDiff === 0 ? 'same time' : (timezoneDiff > 0 ? `${formatTimezone(timezoneDiff)} ahead` : `${formatTimezone(-timezoneDiff)} behind`));
    update('.clock .utc-offset', 'textContent', ` / UTC ${utcOffset}`);
    update('.clock .utc-offset', 'datetime', utcOffset);

    setRpcTimestamp(cache.get('timestamp'));

    setTimeout(setClock, 1000 - now % 1000);
}();
*/

function formatTimezone(timezoneDiff) {
    const hour = Math.floor(Math.abs(timezoneDiff));
    const minute = Math.abs(timezoneDiff % 1 * 60);
    return `${timezoneDiff < 0 ? '-' : ''}${hour}h${minute ? ` ${minute}m` : ''}`;
}


let isRecording = false;
let recoder;
let stream;

document.querySelector('.recorder').addEventListener('click', async () => {
    if (!isRecording) {
        stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: { frameRate: { ideal: 60 } } });
        recoder = new MediaRecorder(stream);
        const [video] = stream.getVideoTracks();

        recoder.start();
        isRecording = true;

        video.addEventListener('ended', () => {
            recoder.stop();
            isRecording = false;
        });

        recoder.addEventListener('dataavailable', e => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(e.data);
            a.download = 'watch if cute.webm';
            a.click();
        });
    } else {
        recoder.stop();
        stream.getTracks().forEach(track => track.stop());
        isRecording = false;
    }
});
