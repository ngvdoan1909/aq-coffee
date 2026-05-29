import { blogPostsPayload } from '../data/blog-data.js';
import { decodeJsonPayload } from '../utils/encoding.js';
import { escapeHTML, sanitizeRichHTML, setMetaContent } from '../utils/dom.js';

const staticBlogPosts = decodeJsonPayload(blogPostsPayload);
let blogPosts = staticBlogPosts;
let blogGrid;
let blogPrev;
let blogNext;
let blogDots;
let prefersReducedMotion = false;

function escapeRouteHTML(value) {
    return escapeHTML(value);
}

function renderBlogRouteIfNeeded() {
    const match = window.location.pathname.match(/^\/blog\/([^/]+)\/?$/);
    if (!match) return false;

    const post = staticBlogPosts.find(item => item.slug === match[1]);
    if (!post) return false;

    const canonical = `https://aq-coffee.vercel.app/blog/${post.slug}/`;
    const imageUrl = `https://aq-coffee.vercel.app${post.imageUrl}`;
    document.title = post.metaTitle;
    setMetaContent('meta[name="description"]', post.metaDescription);
    setMetaContent('meta[property="og:title"]', post.title);
    setMetaContent('meta[property="og:description"]', post.metaDescription);
    setMetaContent('meta[property="og:url"]', canonical);
    setMetaContent('meta[property="og:image"]', imageUrl);
    setMetaContent('meta[name="twitter:title"]', post.title);
    setMetaContent('meta[name="twitter:description"]', post.metaDescription);
    setMetaContent('meta[name="twitter:image"]', imageUrl);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);

    document.body.className = 'blog-page';
    document.body.innerHTML = `
        <main class="blog-page-main">
          <article class="blog-page-article">
            <a class="blog-page-back" href="/#blog">Về Blog AQ Coffee</a>
            <img class="blog-page-image" src="${post.imageUrl}" alt="${escapeRouteHTML(post.imageAlt)}" width="1200" height="750" />
            <div class="blog-page-meta">${new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(post.publishedAt))} · ${Number(post.readingMinutes || 4)} phút đọc</div>
            <h1>${escapeRouteHTML(post.title)}</h1>
            <p class="blog-page-excerpt">${escapeRouteHTML(post.excerpt)}</p>
            <div class="blog-page-content">${sanitizeRichHTML(post.contentHtml)}</div>
          </article>
        </main>
    `;

    return true;
}

function formatDate(value) {
    const rawDate = typeof value === 'string' ? new Date(value) : new Date(Number(value || Date.now()));
    const date = Number.isNaN(rawDate.getTime()) ? new Date() : rawDate;

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function getPostImage(post) {
    const imageUrl = post.imageUrl || 'assets/images/coffee/aq-coffee-ca-phe-mang-di-kcn-bac-thang-long.jpg';

    if (imageUrl.startsWith('assets/')) {
        return `/${imageUrl}`;
    }

    return imageUrl;
}

function getPostUrl(post) {
    return `/blog/${post.slug}/`;
}

function renderBlogPosts() {
    if (!blogGrid) return;

    if (!blogPosts.length) {
        blogGrid.innerHTML = '';
        return;
    }

    blogGrid.innerHTML = blogPosts.map((post, index) => {
        const title = escapeHTML(post.title || 'Bài viết AQ Coffee');
        const excerpt = escapeHTML(post.excerpt || post.metaDescription || '');
        const imageUrl = escapeHTML(getPostImage(post));
        const imageAlt = escapeHTML(post.imageAlt || title);
        const date = formatDate(post.publishedAt || post.createdAt);
        const minutes = Number(post.readingMinutes || 3);

        return `
            <a class="blog-card" href="${escapeHTML(getPostUrl(post))}" data-blog-index="${index}">
                <img src="${imageUrl}" alt="${imageAlt}" width="900" height="563" loading="lazy" decoding="async" />
                <div class="blog-card-body">
                    <div class="blog-card-meta">${date} · ${minutes} phút đọc</div>
                    <h3>${title}</h3>
                    <p>${excerpt}</p>
                    <span class="blog-card-cta">Đọc bài viết</span>
                </div>
            </a>
        `;
    }).join('');

    if (blogDots) {
        blogDots.innerHTML = blogPosts.map((_, index) => `
            <button class="blog-dot" type="button" aria-label="Xem bài viết ${index + 1}" data-blog-slide="${index}"></button>
        `).join('');
    }

    syncBlogSliderControls();
}

function getActiveBlogIndex() {
    if (!blogGrid) return 0;

    const cards = [...blogGrid.querySelectorAll('.blog-card')];
    if (!cards.length) return 0;

    const viewportCenter = blogGrid.scrollLeft + (blogGrid.clientWidth / 2);

    return cards.reduce((closestIndex, card, index) => {
        const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        const closestCard = cards[closestIndex];
        const closestCenter = closestCard.offsetLeft + (closestCard.offsetWidth / 2);

        return Math.abs(cardCenter - viewportCenter) < Math.abs(closestCenter - viewportCenter)
            ? index
            : closestIndex;
    }, 0);
}

function scrollToBlog(index) {
    if (!blogGrid) return;

    const cards = blogGrid.querySelectorAll('.blog-card');
    const card = cards[index];
    if (!card) return;

    const left = card.offsetLeft - ((blogGrid.clientWidth - card.offsetWidth) / 2);
    blogGrid.scrollTo({ left, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function syncBlogSliderControls() {
    if (!blogGrid) return;

    const index = getActiveBlogIndex();
    const cards = [...blogGrid.querySelectorAll('.blog-card')];
    const maxScrollLeft = blogGrid.scrollWidth - blogGrid.clientWidth - 2;

    blogPrev?.toggleAttribute('disabled', blogGrid.scrollLeft <= 2);
    blogNext?.toggleAttribute('disabled', blogGrid.scrollLeft >= maxScrollLeft);

    blogDots?.querySelectorAll('.blog-dot').forEach((dot, dotIndex) => {
        const isActive = dotIndex === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    if (!cards.length) {
        blogPrev?.setAttribute('disabled', 'disabled');
        blogNext?.setAttribute('disabled', 'disabled');
    }
}

function setupBlogSlider() {
    if (!blogGrid) return;

    let ticking = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let didDrag = false;

    blogGrid.addEventListener('scroll', () => {
        if (ticking) return;

        ticking = true;
        window.requestAnimationFrame(() => {
            ticking = false;
            syncBlogSliderControls();
        });
    }, { passive: true });

    blogPrev?.addEventListener('click', () => {
        scrollToBlog(Math.max(0, getActiveBlogIndex() - 1));
    });

    blogNext?.addEventListener('click', () => {
        scrollToBlog(Math.min(blogPosts.length - 1, getActiveBlogIndex() + 1));
    });

    blogDots?.addEventListener('click', event => {
        const dot = event.target.closest('[data-blog-slide]');
        if (!dot) return;

        scrollToBlog(Number(dot.dataset.blogSlide));
    });

    window.addEventListener('resize', syncBlogSliderControls, { passive: true });

    blogGrid.addEventListener('mousedown', event => {
        if (event.button !== 0) return;

        isDragging = true;
        didDrag = false;
        dragStartX = event.clientX;
        dragStartScrollLeft = blogGrid.scrollLeft;
        blogGrid.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', event => {
        if (!isDragging) return;

        const distance = event.clientX - dragStartX;
        if (Math.abs(distance) > 4) {
            didDrag = true;
        }

        blogGrid.scrollLeft = dragStartScrollLeft - distance;
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;

        isDragging = false;
        blogGrid.classList.remove('is-dragging');
    });

    blogGrid.addEventListener('click', event => {
        if (!didDrag) return;

        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
    }, true);

    syncBlogSliderControls();
}

function setBlogPosts(posts) {
    blogPosts = posts?.length ? posts : staticBlogPosts;
    renderBlogPosts();
}

function initBlog(options = {}) {
    blogGrid = document.getElementById('blogGrid');
    blogPrev = document.getElementById('blogPrev');
    blogNext = document.getElementById('blogNext');
    blogDots = document.getElementById('blogDots');
    prefersReducedMotion = Boolean(options.prefersReducedMotion);

    renderBlogRouteIfNeeded();
    renderBlogPosts();
    setupBlogSlider();
}

export { initBlog, renderBlogRouteIfNeeded, setBlogPosts };
