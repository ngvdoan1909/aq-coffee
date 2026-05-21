import { initializeApp } from 'firebase/app';
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
const mobileReviewsQuery = window.matchMedia('(max-width: 640px)');
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
let customerReviews = [];
let reviewsRef;

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
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
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
