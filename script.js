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
        title: 'AQ Coffee Phục Vụ Cà Phê Sáng Quanh Bắc Thăng Long Và Mê Linh',
        slug: 'aq-coffee-ca-phe-sang-mang-di-kcn-bac-thang-long',
        metaDescription: 'AQ Coffee phục vụ cà phê sáng quanh Bắc Thăng Long, Đông Anh, Mê Linh và khách đi làm qua Hà Nội; dưới 3km miễn phí ship.',
        excerpt: 'AQ Coffee mở từ 5h đến 8h, phục vụ khách đi làm qua Bắc Thăng Long, Đông Anh, Mê Linh và tuyến lên Hà Nội.',
        readingMinutes: 4,
        imageUrl: 'assets/images/coffee/aq-coffee-ca-phe-mang-di-kcn-bac-thang-long.jpg',
        imageAlt: 'AQ Coffee - cà phê sáng mang đi tại KCN Bắc Thăng Long',
        publishedAt: 1779494400000,
        contentHtml: `
            <p><strong>AQ Coffee</strong> phục vụ cà phê sáng mang đi tại Cổng A KCN Bắc Thăng Long, Đông Anh, Hà Nội. Quầy mở từ 5h00 đến 8h00, đúng khung giờ công nhân, dân văn phòng, khách đi làm quanh Đông Anh, Mê Linh và những ai đi làm trên Hà Nội có tuyến đường đi qua cần một ly cà phê nhanh trước khi vào ca.</p>
            <p>Ngoài khách ghé trực tiếp, AQ Coffee cũng nhận giao gần quanh Đông Anh và Mê Linh. Với đơn trong bán kính dưới 3km, AQ miễn phí ship. Nếu xa hơn 3km, quán chỉ phụ thêm 10.000đ tiền xăng xe để giữ chi phí nhẹ nhất cho khách quen buổi sáng.</p>
            <h4>Khu vực AQ Coffee thường phục vụ</h4>
            <p>Khách của AQ chủ yếu đi qua Cổng A KCN Bắc Thăng Long, Kim Chung, Hải Bối, Võng La, một phần Đông Anh, Mê Linh và các tuyến đi làm lên Hà Nội. Đây đều là các tuyến có nhiều người đi làm sớm, nên cà phê mang đi cần gọn, đúng giờ và dễ đặt.</p>
            <p>Nếu bạn ở gần quầy, ghé lấy trực tiếp vẫn là nhanh nhất. Nếu đang chuẩn bị vào ca hoặc cần đặt cho vài người trong nhóm, gọi trước sẽ giúp AQ chuẩn bị sẵn để giao hoặc để bạn qua lấy không phải chờ lâu.</p>
            <h4>Menu ngắn để phục vụ nhanh</h4>
            <ul>
                <li>Cà phê đen: 15.000đ, phù hợp khách thích vị đậm và tỉnh táo.</li>
                <li>Cà phê sữa: 15.000đ, dễ uống, cân bằng giữa vị cà phê và vị sữa.</li>
                <li>Cà phê muối: 20.000đ, vị béo nhẹ, mặn ngọt hài hòa.</li>
                <li>Bạc xỉu: 20.000đ, hợp với khách thích vị sữa rõ hơn cà phê.</li>
            </ul>
            <p>Bạn có thể xem thêm <a href="https://aq-coffee.vercel.app/#menu">thực đơn AQ Coffee</a> trước khi ghé quầy để chọn món nhanh hơn.</p>
            <p>Nếu bạn cần cà phê sáng quanh KCN Bắc Thăng Long, Đông Anh, Mê Linh hoặc đi làm trên Hà Nội có đường ngang qua quầy, hãy ghé AQ Coffee từ 5h00 đến 8h00, Thứ 2 đến Thứ 7. Đặt trước hoặc hỏi ship gần qua hotline <strong>0868 691 616</strong>.</p>
        `
    },
    {
        title: 'Đặt Cà Phê Sáng Cho Nhóm Đi Làm Quanh Đông Anh, Mê Linh',
        slug: 'ca-phe-mang-di-tai-dong-anh-cho-nguoi-di-lam',
        metaDescription: 'AQ Coffee nhận đặt cà phê sáng cho nhóm công nhân, văn phòng quanh Đông Anh, Mê Linh và khách đi làm qua Hà Nội.',
        excerpt: 'Đi làm theo nhóm hoặc cùng ca sáng, bạn có thể đặt trước cà phê tại AQ Coffee khi đi qua Bắc Thăng Long.',
        readingMinutes: 4,
        imageUrl: 'assets/images/coffee/quay-aq-coffee-cong-a-kcn-bac-thang-long.jpg',
        imageAlt: 'Quầy AQ Coffee tại Cổng A KCN Bắc Thăng Long Đông Anh',
        publishedAt: 1779408000000,
        contentHtml: `
            <p>Nhiều khách của AQ Coffee không chỉ mua một ly, mà đặt theo nhóm nhỏ trong cùng ca làm hoặc cùng văn phòng. Với khung giờ 5h00 - 8h00, việc đặt trước giúp mọi người nhận cà phê nhanh hơn, nhất là quanh KCN Bắc Thăng Long, Đông Anh, Mê Linh và các tuyến đi làm lên Hà Nội.</p>
            <p>AQ Coffee phù hợp với nhóm công nhân vào ca sớm, nhân viên văn phòng cần cà phê trước giờ làm, hoặc vài anh chị đi cùng tuyến qua Cổng A KCN Bắc Thăng Long để lên Hà Nội. Chỉ cần chốt số lượng và món, AQ sẽ chuẩn bị theo giờ hẹn trong khả năng phục vụ buổi sáng.</p>
            <h4>Đặt nhóm nên chọn món thế nào?</h4>
            <p>Nếu trong nhóm có nhiều gu khác nhau, cách dễ nhất là chia theo nhóm vị. Người thích mạnh chọn cà phê đen, người thích cân bằng chọn cà phê sữa, người muốn đổi vị chọn cà phê muối, còn ai thích nhẹ hơn có thể chọn bạc xỉu.</p>
            <ul>
                <li>Cà phê đen cho người thích vị mạnh, ít ngọt.</li>
                <li>Cà phê sữa cho khách muốn vị đậm nhưng dễ uống hơn.</li>
                <li>Cà phê muối cho người thích vị béo, thơm và lạ miệng.</li>
                <li>Bạc xỉu cho khách thích vị sữa mềm, nhẹ cà phê.</li>
            </ul>
            <h4>Chính sách giao gần của AQ Coffee</h4>
            <p>Với đơn dưới 3km tính từ quầy, AQ Coffee miễn phí ship để hỗ trợ khách quen quanh Đông Anh và khu gần KCN Bắc Thăng Long. Với đơn trên 3km, quán chỉ lấy thêm 10.000đ tiền ship, đủ phụ xăng xe cho việc giao buổi sáng.</p>
            <p>Thông tin menu được cập nhật tại <a href="https://aq-coffee.vercel.app/#menu">thực đơn cà phê AQ Coffee</a>, bạn có thể xem trước để đặt món nhanh hơn.</p>
            <p>Nếu nhóm của bạn ở Đông Anh, Mê Linh, gần Bắc Thăng Long hoặc đi làm trên Hà Nội có đường qua quầy và muốn đặt cà phê sáng, gọi AQ Coffee qua hotline <strong>0868 691 616</strong>.</p>
        `
    },
    {
        title: 'Chọn Cà Phê Muối Hay Bạc Xỉu Khi Mua Mang Đi Ở AQ Coffee',
        slug: 'ca-phe-muoi-bac-xiu-aq-coffee-bac-thang-long',
        metaDescription: 'Gợi ý chọn cà phê muối hoặc bạc xỉu tại AQ Coffee khi mua cà phê mang đi quanh Bắc Thăng Long, Đông Anh, Mê Linh.',
        excerpt: 'Cà phê muối và bạc xỉu đều dễ uống, hợp khách ghé AQ Coffee trước giờ vào ca hoặc trên đường đi làm Hà Nội.',
        readingMinutes: 4,
        imageUrl: 'assets/images/coffee/ca-phe-muoi-aq-coffee-kcn-bac-thang-long.jpg',
        imageAlt: 'Cà phê muối AQ Coffee tại KCN Bắc Thăng Long',
        publishedAt: 1779321600000,
        contentHtml: `
            <p>Khi mua cà phê mang đi buổi sáng, nhiều khách phân vân giữa <strong>cà phê muối</strong> và bạc xỉu. Tại AQ Coffee, hai món này đều có giá 20.000đ, phục vụ tại Cổng A KCN Bắc Thăng Long, khách quanh Đông Anh, Mê Linh và người đi làm trên Hà Nội có đường ngang qua đều có thể ghé mua.</p>
            <h4>Khi nào nên chọn cà phê muối?</h4>
            <p>Cà phê muối hợp với khách muốn vị cà phê rõ nhưng vẫn có độ béo, thơm và mặn nhẹ. Món này phù hợp khi bạn đã quen uống cà phê sữa nhưng muốn đổi vị, hoặc cần một ly đậm hơn bạc xỉu cho buổi sáng làm việc.</p>
            <p>Nếu bạn làm ở KCN Bắc Thăng Long hoặc đi qua Cổng A vào đầu giờ sáng, cà phê muối là lựa chọn dễ nhớ vì vị nổi bật, uống chậm hay mang đi đều ổn.</p>
            <h4>Khi nào nên chọn bạc xỉu?</h4>
            <p>Bạc xỉu nhẹ hơn, vị sữa rõ hơn và dễ uống với người không thích cà phê quá mạnh. Đây là món hợp cho khách bắt đầu ngày mới nhẹ nhàng, hoặc những ai cần đồ uống thơm béo nhưng không muốn vị đắng đậm.</p>
            <h4>Giao gần quanh Đông Anh, Mê Linh</h4>
            <p>Nếu đặt cà phê muối hoặc bạc xỉu quanh quầy dưới 3km, AQ Coffee miễn phí ship. Với khu vực xa hơn 3km, quán chỉ phụ thêm 10.000đ tiền ship để đủ xăng xe. Bạn có thể xem thêm <a href="https://aq-coffee.vercel.app/#menu">menu AQ Coffee</a> trước khi đặt.</p>
            <p>Muốn thử cà phê muối hoặc bạc xỉu tại Bắc Thăng Long, Đông Anh, Mê Linh hoặc ghé nhanh trên đường đi làm Hà Nội, hãy đến AQ Coffee từ 5h00 đến 8h00 hoặc gọi trước qua hotline <strong>0868 691 616</strong>.</p>
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
    const imageUrl = post.imageUrl || 'assets/images/coffee/aq-coffee-ca-phe-mang-di-kcn-bac-thang-long.jpg';

    if (imageUrl.startsWith('assets/')) {
        return `/${imageUrl}`;
    }

    return imageUrl;
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

    if (blogArticle) {
        blogArticle.hidden = true;
        blogArticle.innerHTML = '';
        document.getElementById('blogStructuredData')?.remove();
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
        <button class="blog-article-close" type="button" data-blog-close>Thu gọn</button>
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

blogArticle?.addEventListener('click', event => {
    const closeButton = event.target.closest('[data-blog-close]');
    if (!closeButton) return;

    blogArticle.hidden = true;
    blogArticle.innerHTML = '';
    document.getElementById('blogStructuredData')?.remove();
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
