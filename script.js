import { getApps, initializeApp } from 'firebase/app';
import {
    getDatabase,
    limitToLast,
    onValue,
    orderByChild,
    push,
    query,
    ref,
    serverTimestamp
} from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const navbar = document.querySelector('.navbar');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const currentYear = document.getElementById('currentYear');

if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
}

window.addEventListener('scroll', () => {
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.classList.add('is-scrolled');
    } else {
        navbar.classList.remove('is-scrolled');
    }
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.menu-card, .about-container, .contact-container').forEach(el => {
    el.classList.add('reveal');

    if (prefersReducedMotion) {
        el.classList.add('is-visible');
    } else {
        observer.observe(el);
    }
});

document.querySelectorAll('[data-scroll-target]').forEach(button => {
    button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.scrollTarget);
        target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
        const hash = link.getAttribute('href');
        if (!hash) return;

        event.preventDefault();

        if (hash === '#') {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            return;
        }

        document.querySelector(hash)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
});

const reviewsTrack = document.getElementById('reviewsTrack');
const reviewsShell = document.querySelector('.reviews-shell');
const reviewsDots = document.getElementById('reviewsDots');
const reviewForm = document.getElementById('reviewForm');
const reviewFormStatus = reviewForm?.querySelector('.review-form-status');
const blogGrid = document.getElementById('blogGrid');
const blogArticle = document.getElementById('blogArticle');
const blogStatus = document.getElementById('blogStatus');
const mobileReviewsQuery = window.matchMedia('(max-width: 640px)');
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
let customerReviews = [];
let blogPosts = [];
let reviewsRef;
let blogPostsRef;
let firebaseDatabase;
const fallbackBlogPosts = [
    {
        title: 'AQ Coffee - Cà Phê Sáng Mang Đi Tại KCN Bắc Thăng Long',
        slug: 'aq-coffee-ca-phe-sang-mang-di-kcn-bac-thang-long',
        metaDescription: 'AQ Coffee phục vụ cà phê sáng mang đi tại Cổng A KCN Bắc Thăng Long, Đông Anh cho công nhân, dân văn phòng từ 5h.',
        excerpt: 'AQ Coffee là điểm ghé quen cho cà phê sáng mang đi tại Cổng A KCN Bắc Thăng Long, Đông Anh, mở từ 5h đến 8h.',
        readingMinutes: 4,
        imageUrl: 'assets/images/coffee/aq-coffee-ca-phe-mang-di-kcn-bac-thang-long.jpg',
        imageAlt: 'AQ Coffee - cà phê sáng mang đi tại KCN Bắc Thăng Long',
        publishedAt: 1779494400000,
        contentHtml: `
            <p><strong>AQ Coffee</strong> phục vụ cà phê sáng mang đi tại Cổng A KCN Bắc Thăng Long, Đông Anh, Hà Nội. Quầy mở từ 5h00 đến 8h00, đúng khung giờ nhiều công nhân, dân văn phòng và người đi làm cần một ly cà phê nhanh gọn trước khi bắt đầu ngày mới.</p>
            <p>Với mô hình quầy nhỏ, AQ Coffee tập trung vào những món dễ uống, phục vụ nhanh và hợp nhịp buổi sáng quanh khu công nghiệp. Khách có thể ghé lấy cà phê đen, cà phê sữa, cà phê muối hoặc bạc xỉu rồi tiếp tục di chuyển vào ca làm.</p>
            <h4>Vì sao cà phê mang đi hợp với buổi sáng ở Bắc Thăng Long?</h4>
            <p>Khu vực KCN Bắc Thăng Long có nhịp sinh hoạt rất sớm. Nhiều người cần mua đồ uống trong vài phút, không có nhiều thời gian ngồi lại. Vì vậy, một quầy cà phê mang đi gần Cổng A giúp khách tiết kiệm thời gian mà vẫn có ly cà phê đủ vị.</p>
            <p>AQ Coffee chọn cách phục vụ gọn, rõ món và dễ gọi. Menu không quá dài, tập trung vào các lựa chọn quen thuộc để khách ghé nhanh không phải chờ lâu.</p>
            <h4>Menu cà phê sáng tại AQ Coffee</h4>
            <ul>
                <li>Cà phê đen: 15.000đ, phù hợp khách thích vị đậm và tỉnh táo.</li>
                <li>Cà phê sữa: 15.000đ, dễ uống, cân bằng giữa vị cà phê và vị sữa.</li>
                <li>Cà phê muối: 20.000đ, vị béo nhẹ, mặn ngọt hài hòa.</li>
                <li>Bạc xỉu: 20.000đ, hợp với khách thích vị sữa rõ hơn cà phê.</li>
            </ul>
            <p>Bạn có thể xem thêm <a href="https://aq-coffee.vercel.app/#menu">thực đơn AQ Coffee</a> trước khi ghé quầy để chọn món nhanh hơn.</p>
            <p>Nếu bạn đang tìm cà phê sáng mang đi tại KCN Bắc Thăng Long, hãy ghé AQ Coffee từ 5h00 đến 8h00, Thứ 2 đến Thứ 7. Cần đặt trước, bạn gọi hotline <strong>0868 691 616</strong>.</p>
        `
    },
    {
        title: 'Cà Phê Mang Đi Tại Đông Anh Cho Người Đi Làm Buổi Sáng',
        slug: 'ca-phe-mang-di-tai-dong-anh-cho-nguoi-di-lam',
        metaDescription: 'Ghé AQ Coffee tại Cổng A KCN Bắc Thăng Long để mua cà phê mang đi ở Đông Anh, phù hợp công nhân và dân văn phòng buổi sáng.',
        excerpt: 'Người đi làm quanh Đông Anh có thể ghé AQ Coffee từ 5h đến 8h để mua cà phê mang đi nhanh, tiện đường và dễ chọn món.',
        readingMinutes: 4,
        imageUrl: 'assets/images/coffee/quay-aq-coffee-cong-a-kcn-bac-thang-long.jpg',
        imageAlt: 'Quầy AQ Coffee tại Cổng A KCN Bắc Thăng Long Đông Anh',
        publishedAt: 1779408000000,
        contentHtml: `
            <p>Buổi sáng ở Đông Anh thường bắt đầu rất sớm, nhất là quanh KCN Bắc Thăng Long. Với nhiều công nhân và dân văn phòng, một ly <strong>cà phê mang đi</strong> là lựa chọn tiện nhất trước giờ vào ca hoặc trước khi đến văn phòng.</p>
            <p>AQ Coffee nằm tại Cổng A KCN Bắc Thăng Long, phục vụ khách trong khung giờ 5h00 - 8h00 từ Thứ 2 đến Thứ 7. Đây là khoảng thời gian phù hợp với người cần mua nhanh, không muốn mất nhiều thời gian dừng lại.</p>
            <h4>AQ Coffee phù hợp với ai?</h4>
            <p>Quầy phục vụ chủ yếu cho công nhân trong khu công nghiệp, dân văn phòng, người đi làm sớm và khách di chuyển qua khu Kim Chung, Hải Bối, Võng La. Khách có thể ghé lấy cà phê rồi tiếp tục đi làm mà không cần đổi lộ trình quá nhiều.</p>
            <h4>Những món dễ gọi vào buổi sáng</h4>
            <ul>
                <li>Cà phê đen cho người thích vị mạnh, ít ngọt.</li>
                <li>Cà phê sữa cho khách muốn vị đậm nhưng dễ uống hơn.</li>
                <li>Cà phê muối cho người thích vị béo, thơm và lạ miệng.</li>
                <li>Bạc xỉu cho khách thích vị sữa mềm, nhẹ cà phê.</li>
            </ul>
            <p>Thông tin menu được cập nhật tại <a href="https://aq-coffee.vercel.app/#menu">thực đơn cà phê AQ Coffee</a>, bạn có thể xem trước để đặt món nhanh khi ghé quầy.</p>
            <p>Nếu bạn cần cà phê mang đi tại Đông Anh, hãy ghé AQ Coffee ở Cổng A KCN Bắc Thăng Long từ 5h00 đến 8h00. Hotline đặt trước: <strong>0868 691 616</strong>.</p>
        `
    },
    {
        title: 'Cà Phê Muối Và Bạc Xỉu Tại AQ Coffee Bắc Thăng Long',
        slug: 'ca-phe-muoi-bac-xiu-aq-coffee-bac-thang-long',
        metaDescription: 'AQ Coffee phục vụ cà phê muối và bạc xỉu mang đi tại Cổng A KCN Bắc Thăng Long, Đông Anh, giá 20.000đ.',
        excerpt: 'Cà phê muối và bạc xỉu là hai món dễ uống tại AQ Coffee, phù hợp khách mua cà phê sáng quanh Bắc Thăng Long.',
        readingMinutes: 4,
        imageUrl: 'assets/images/coffee/ca-phe-muoi-aq-coffee-kcn-bac-thang-long.jpg',
        imageAlt: 'Cà phê muối AQ Coffee tại KCN Bắc Thăng Long',
        publishedAt: 1779321600000,
        contentHtml: `
            <p>Tại AQ Coffee, bên cạnh cà phê đen và cà phê sữa quen thuộc, <strong>cà phê muối</strong> và bạc xỉu là hai lựa chọn được nhiều khách buổi sáng quan tâm. Cả hai món đều phù hợp với hình thức mang đi tại Cổng A KCN Bắc Thăng Long, Đông Anh.</p>
            <p>Khách ghé AQ Coffee thường cần một ly đồ uống nhanh trước giờ làm. Vì vậy, những món có vị dễ uống, ổn định và không mất nhiều thời gian chờ sẽ phù hợp hơn với nhịp sáng quanh khu công nghiệp.</p>
            <h4>Cà phê muối hợp với người thích vị béo nhẹ</h4>
            <p>Cà phê muối có vị cà phê rõ, thêm lớp vị béo và chút mặn nhẹ để cân bằng độ ngọt. Món này phù hợp với khách muốn đổi vị so với cà phê sữa truyền thống nhưng vẫn cần sự tỉnh táo của cà phê sáng.</p>
            <h4>Bạc xỉu dễ uống cho buổi sáng</h4>
            <p>Bạc xỉu phù hợp với khách thích vị sữa mềm, thơm và nhẹ cà phê hơn. Với nhiều người đi làm quanh Đông Anh, bạc xỉu là lựa chọn dễ uống vào sáng sớm, đặc biệt khi không muốn vị cà phê quá mạnh.</p>
            <p>Nếu bạn muốn thử cà phê muối hoặc bạc xỉu tại Bắc Thăng Long, ghé AQ Coffee từ 5h00 đến 8h00 hoặc gọi trước qua hotline <strong>0868 691 616</strong>.</p>
        `
    }
];

function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function normalizeStars(value) {
    const stars = Number(value);
    if (!Number.isFinite(stars)) return 5;

    return Math.min(5, Math.max(1, Math.round(stars)));
}

function getFirebaseDatabase() {
    if (firebaseDatabase) return firebaseDatabase;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    firebaseDatabase = getDatabase(app);

    return firebaseDatabase;
}

function renderReviews() {
    if (!reviewsTrack) return;

    reviewsTrack.innerHTML = customerReviews.map(review => {
        const stars = normalizeStars(review.stars);
        const name = escapeHTML(review.name || 'Khách hàng AQ');
        const text = escapeHTML(review.text || '');

        return `
        <article class="review-card">
            <div>
                <div class="review-stars" aria-label="${stars} sao">${'&#9733;'.repeat(stars)}${'&#9734;'.repeat(5 - stars)}</div>
                <p class="review-text">“${text}”</p>
            </div>
            <div class="review-person">
                <strong>${name}</strong>
            </div>
        </article>
    `;
    }).join('');

    if (reviewsDots) {
        reviewsDots.innerHTML = customerReviews.map((_, index) => `
            <button class="reviews-dot" type="button" aria-label="Xem đánh giá ${index + 1}" data-review-index="${index}"></button>
        `).join('');
    }

    setActiveReviewDot(getActiveReviewIndex());
}

function formatDate(value) {
    const date = new Date(Number(value || Date.now()));

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function sanitizeBlogHTML(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');

    template.content.querySelectorAll('script, iframe, object, embed, form, input, button').forEach(node => node.remove());
    template.content.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attribute => {
            const name = attribute.name.toLowerCase();
            const attributeValue = String(attribute.value || '').trim().toLowerCase();

            if (name.startsWith('on') || attributeValue.startsWith('javascript:')) {
                node.removeAttribute(attribute.name);
            }
        });
    });

    return template.innerHTML;
}

function getPostImage(post) {
    return post.imageUrl || 'assets/images/coffee/aq-coffee-ca-phe-mang-di-kcn-bac-thang-long.jpg';
}

function renderBlogPosts() {
    if (!blogGrid) return;

    if (!blogPosts.length) {
        blogGrid.innerHTML = '';
        if (blogStatus) {
            blogStatus.textContent = 'Chưa có bài viết nào được xuất bản.';
        }
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
            <a class="blog-card" href="#blog-${escapeHTML(post.slug || index)}" data-blog-index="${index}">
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

    if (blogStatus) {
        blogStatus.textContent = '';
    }

    if (blogPosts[0]) {
        renderBlogArticle(0, false);
    }
}

function renderFallbackBlogPosts(statusText = '') {
    blogPosts = fallbackBlogPosts;
    renderBlogPosts();

    if (blogStatus) {
        blogStatus.textContent = statusText;
    }
}

function renderBlogArticle(index, shouldScroll = true) {
    if (!blogArticle) return;

    const post = blogPosts[index];
    if (!post) return;

    const title = escapeHTML(post.title || 'Bài viết AQ Coffee');
    const description = escapeHTML(post.metaDescription || post.excerpt || '');
    const content = sanitizeBlogHTML(post.contentHtml || '');
    const date = formatDate(post.publishedAt || post.createdAt);
    const minutes = Number(post.readingMinutes || 3);

    blogArticle.hidden = false;
    blogArticle.innerHTML = `
        <h3>${title}</h3>
        <div class="blog-article-meta">${date} · ${minutes} phút đọc</div>
        ${description ? `<p>${description}</p>` : ''}
        <div class="blog-article-content">${content}</div>
    `;

    injectBlogStructuredData(post);

    if (shouldScroll) {
        blogArticle.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
}

function injectBlogStructuredData(post) {
    document.getElementById('blogStructuredData')?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'blogStructuredData';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.metaDescription || post.excerpt,
        image: getPostImage(post),
        datePublished: new Date(Number(post.publishedAt || post.createdAt || Date.now())).toISOString(),
        dateModified: new Date(Number(post.updatedAt || post.publishedAt || post.createdAt || Date.now())).toISOString(),
        author: {
            '@type': 'Organization',
            name: 'AQ Coffee'
        },
        publisher: {
            '@type': 'Organization',
            name: 'AQ Coffee',
            logo: {
                '@type': 'ImageObject',
                url: 'https://aq-coffee.vercel.app/assets/images/logo.png'
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://aq-coffee.vercel.app/#blog-${post.slug || ''}`
        }
    });
    document.head.append(script);
}

function setActiveReviewDot(index) {
    if (!reviewsDots) return;

    reviewsDots.querySelectorAll('.reviews-dot').forEach((dot, dotIndex) => {
        const isActive = dotIndex === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
}

function getActiveReviewIndex() {
    if (!reviewsTrack) return 0;

    const cards = [...reviewsTrack.querySelectorAll('.review-card')];
    const trackCenter = reviewsTrack.scrollLeft + (reviewsTrack.clientWidth / 2);

    return cards.reduce((closestIndex, card, index) => {
        const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        const closestCard = cards[closestIndex];
        const closestCenter = closestCard.offsetLeft + (closestCard.offsetWidth / 2);

        return Math.abs(cardCenter - trackCenter) < Math.abs(closestCenter - trackCenter)
            ? index
            : closestIndex;
    }, 0);
}

function scrollToReview(index) {
    if (!reviewsTrack) return;

    const card = reviewsTrack.querySelectorAll('.review-card')[index];
    if (!card) return;

    const left = card.offsetLeft - ((reviewsTrack.clientWidth - card.offsetWidth) / 2);
    reviewsTrack.scrollTo({ left, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function setupReviewsSlider() {
    if (!reviewsTrack || !reviewsDots) return;

    let ticking = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let didDrag = false;

    const syncActiveDot = () => {
        ticking = false;
        setActiveReviewDot(getActiveReviewIndex());
    };

    reviewsTrack.addEventListener('scroll', () => {
        if (ticking) return;

        ticking = true;
        window.requestAnimationFrame(syncActiveDot);
    }, { passive: true });

    reviewsDots.addEventListener('click', event => {
        const dot = event.target.closest('.reviews-dot');
        if (!dot) return;

        scrollToReview(Number(dot.dataset.reviewIndex));
    });

    reviewsTrack.addEventListener('mousedown', event => {
        if (event.button !== 0) return;

        isDragging = true;
        didDrag = false;
        dragStartX = event.clientX;
        dragStartScrollLeft = reviewsTrack.scrollLeft;
        reviewsTrack.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', event => {
        if (!isDragging) return;

        const distance = event.clientX - dragStartX;
        if (Math.abs(distance) > 4) {
            didDrag = true;
        }

        reviewsTrack.scrollLeft = dragStartScrollLeft - distance;
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;

        isDragging = false;
        reviewsTrack.classList.remove('is-dragging');
    });

    reviewsTrack.addEventListener('click', event => {
        if (!didDrag) return;

        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
    }, true);

    const handleModeChange = () => {
        setActiveReviewDot(getActiveReviewIndex());
    };

    mobileReviewsQuery.addEventListener?.('change', handleModeChange);
    window.addEventListener('resize', handleModeChange, { passive: true });
    handleModeChange();
}

function setupFirebaseReviews() {
    if (!reviewForm) return;

    if (!hasFirebaseConfig) {
        if (reviewFormStatus) {
            reviewFormStatus.textContent = 'Firebase chưa được cấu hình.';
        }
        reviewForm.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
        return;
    }

    try {
        const database = getFirebaseDatabase();
        reviewsRef = ref(database, 'reviews');
        const latestReviewsQuery = query(reviewsRef, orderByChild('createdAt'), limitToLast(30));

        onValue(latestReviewsQuery, snapshot => {
            const loadedReviews = [];

            snapshot.forEach(childSnapshot => {
                const review = childSnapshot.val();
                if (!review || review.isApproved === false) return;

                loadedReviews.push({
                    id: childSnapshot.key,
                    name: String(review.name || '').slice(0, 40),
                    stars: normalizeStars(review.stars),
                    text: String(review.text || '').slice(0, 260),
                    createdAt: Number(review.createdAt || 0)
                });
            });

            customerReviews = loadedReviews.sort((a, b) => b.createdAt - a.createdAt);
            renderReviews();
        }, error => {
            if (reviewFormStatus) {
                reviewFormStatus.textContent = 'Chưa tải được đánh giá từ Firebase. Kiểm tra Database Rules.';
            }
            console.error(error);
        });
    } catch (error) {
        if (reviewFormStatus) {
            reviewFormStatus.textContent = 'Không kết nối được Firebase.';
        }
        console.error(error);
    }
}

function setupFirebaseBlog() {
    if (!blogGrid) return;

    if (!hasFirebaseConfig) {
        renderFallbackBlogPosts('');
        return;
    }

    try {
        const database = getFirebaseDatabase();
        blogPostsRef = ref(database, 'blogPosts');
        const latestBlogQuery = query(blogPostsRef, orderByChild('publishedAt'), limitToLast(12));

        onValue(latestBlogQuery, snapshot => {
            const loadedPosts = [];

            snapshot.forEach(childSnapshot => {
                const post = childSnapshot.val();
                if (!post || post.isPublished === false) return;

                loadedPosts.push({
                    id: childSnapshot.key,
                    title: String(post.title || '').slice(0, 120),
                    slug: String(post.slug || childSnapshot.key || '').slice(0, 140),
                    excerpt: String(post.excerpt || '').slice(0, 220),
                    metaDescription: String(post.metaDescription || '').slice(0, 180),
                    contentHtml: String(post.contentHtml || ''),
                    imageUrl: String(post.imageUrl || ''),
                    imageAlt: String(post.imageAlt || ''),
                    readingMinutes: Number(post.readingMinutes || 3),
                    createdAt: Number(post.createdAt || 0),
                    updatedAt: Number(post.updatedAt || post.createdAt || 0),
                    publishedAt: Number(post.publishedAt || post.createdAt || 0)
                });
            });

            if (!loadedPosts.length) {
                renderFallbackBlogPosts('');
                return;
            }

            blogPosts = loadedPosts.sort((a, b) => b.publishedAt - a.publishedAt);
            renderBlogPosts();
        }, error => {
            renderFallbackBlogPosts('');
            console.error(error);
        });
    } catch (error) {
        renderFallbackBlogPosts('');
        console.error(error);
    }
}

blogGrid?.addEventListener('click', event => {
    const card = event.target.closest('[data-blog-index]');
    if (!card) return;

    event.preventDefault();
    renderBlogArticle(Number(card.dataset.blogIndex));
});

reviewForm?.addEventListener('submit', async event => {
    event.preventDefault();

    if (!reviewsRef) {
        if (reviewFormStatus) {
            reviewFormStatus.textContent = 'Firebase chưa sẵn sàng, bạn thử lại sau vài giây nhé.';
        }
        return;
    }

    const formData = new FormData(reviewForm);
    const name = String(formData.get('name') || '').trim().slice(0, 40);
    const stars = normalizeStars(formData.get('stars'));
    const text = String(formData.get('text') || '').trim().slice(0, 260);

    if (!name || !text) {
        if (reviewFormStatus) {
            reviewFormStatus.textContent = 'Bạn nhập giúp AQ tên và nội dung đánh giá nhé.';
        }
        return;
    }

    const submitButton = reviewForm.querySelector('button[type="submit"]');
    submitButton?.setAttribute('disabled', 'disabled');

    try {
        await push(reviewsRef, {
            name,
            stars,
            text,
            isApproved: true,
            createdAt: serverTimestamp()
        });

        reviewForm.reset();
        if (reviewFormStatus) {
            reviewFormStatus.textContent = 'AQ đã nhận đánh giá của bạn. Cảm ơn bạn nhiều!';
        }
    } catch (error) {
        if (reviewFormStatus) {
            reviewFormStatus.textContent = 'Chưa lưu được đánh giá. Kiểm tra Firebase Realtime Database Rules.';
        }
        console.error(error);
    } finally {
        submitButton?.removeAttribute('disabled');
    }
});

const contactForm = document.getElementById('contactForm');
const formStatus = contactForm?.querySelector('.form-status');

contactForm?.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const location = String(formData.get('location') || '').trim();

    if (!name || !phone || !location) {
        if (formStatus) {
            formStatus.textContent = 'Bạn điền giúp AQ đủ thông tin để chuẩn bị đơn nhanh hơn nhé.';
        }
        return;
    }

    if (formStatus) {
        formStatus.textContent = 'AQ đã nhận thông tin. Bạn có thể gọi 0868 691 616 để được chuẩn bị nhanh hơn.';
    }

    contactForm.reset();
});

if (reviewsShell) {
    reviewsShell.classList.add('reveal');

    if (prefersReducedMotion) {
        reviewsShell.classList.add('is-visible');
    } else {
        observer.observe(reviewsShell);
    }
}

renderReviews();
setupReviewsSlider();
setupFirebaseReviews();
setupFirebaseBlog();
