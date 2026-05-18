const navbar = document.querySelector('.navbar');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const reviews = [
    {
        name: "Anh Tuấn",
        phone: "0984.552.***",
        stars: 5,
        text: "Cà phê tự ủ uống đậm đà khác hẳn mấy loại pha máy đại trà bây giờ. Sáng nào đi làm qua Cổng A cũng phải tạt vào làm ly đen đá mới đủ đô để tỉnh táo vào ca."
    },
    {
        name: "Chị Linh",
        phone: "0356.221.***",
        stars: 5,
        text: "Mê nhất món cà phê muối ở đây, kem béo ngậy mà cốt cà phê pha tay rất thơm và đậm. Mình hay alo hotline đặt trước, lúc đi xe máy qua chỉ việc lấy luôn, không lo muộn giờ chấm công."
    },
    {
        name: "Hùng",
        phone: "0912.883.***",
        stars: 4,
        text: "Quầy nhỏ thôi nhưng anh chủ làm nhanh thoăn thoắt. Tầm 6h45 sáng đông nghẹt người xếp hàng mà chờ xíu là có liền. Bạc xỉu thơm, ngọt béo đúng gu mình."
    },
    {
        name: "Thu Hương",
        phone: "0868.334.***",
        stars: 5,
        text: "Cà phê chuẩn vị truyền thống, giá lại cực kỳ bình dân chỉ từ 15k-20k. Điểm cộng lớn là bán từ 5h sáng, hôm nào mình đi ca sớm vẫn kịp mua."
    },
    {
        name: "Bạn Đức",
        phone: "0333.666.***",
        stars: 4,
        text: "Cốt cà phê tự ủ rất chất lượng, uống từ sáng mà tỉnh táo đến tận chiều. Anh chủ nhiệt tình, vui vẻ, vote 5 sao cho sự tử tế!"
    },
    {
        name: "Chú Bảo",
        phone: "0973.415.***",
        stars: 5,
        text: "Tôi làm ca đêm mệt mỏi, sáng ra giao ca cứ phải làm ly đen không đường của chú em này mới tỉnh người để chạy xe về nhà. Cà phê nguyên chất, đắng thanh dầy vị, rất đáng tiền."
    },
    {
        name: "C Minh Anh",
        phone: "0961.992.***",
        stars: 4,
        text: "Tìm mãi quanh khu Bắc Thăng Long mới thấy một quầy bán bạc xỉu pha tay ngon như này. Sữa đặc thơm ngậy hòa với vị đắng nhẹ của cốt cà phê ủ. Nghiện luôn rồi tuần nào cũng mua 3-4 lần."
    },
    {
        name: "Anh Ngọc",
        phone: "0388.741.***",
        stars: 5,
        text: "Giá 15k-20k mà chất lượng quá ổn áp. Sáng nào cũng xếp hàng mua một ly cà phê sữa mang vào xưởng. Anh chủ tay chân lẹ làng, phục vụ chu đáo dù khách xếp hàng rất đông."
    },
    {
        name: "Thảo Vy",
        phone: "0345.118.***",
        stars: 5,
        text: "Món cà phê muối ngon đỉnh chóp nha mọi người, béo béo mặn mặn kết hợp cốt cà phê pha tay đậm đặc. Hôm nào dậy muộn alo trước cho anh chủ, lúc đi qua lấy vèo cái là xong không sợ trễ giờ."
    },
    {
        name: "Anh Grab",
        phone: "0904.663.***",
        stars: 4,
        text: "Chạy xe sáng sớm cứ ghé Cổng A làm ly đen đá. Tiện đường, mua nhanh gọn, không mất thời gian gửi xe gì cả. Cà phê tự ủ tay uống đậm đà chuẩn vị, giúp tôi tỉnh táo cả ngày chạy xe."
    }
];

const reviewsTrack = document.getElementById('reviewsTrack');
const reviewsShell = document.querySelector('.reviews-shell');
const reviewsDots = document.getElementById('reviewsDots');
const mobileReviewsQuery = window.matchMedia('(max-width: 640px)');

function renderReviews() {
    if (!reviewsTrack) return;

    reviewsTrack.innerHTML = reviews.map(review => `
        <article class="review-card">
            <div>
                <div class="review-stars" aria-label="${review.stars} sao">${'&#9733;'.repeat(review.stars)}${'&#9734;'.repeat(5 - review.stars)}</div>
                <p class="review-text">“${review.text}”</p>
            </div>
            <div class="review-person">
                <strong>${review.name}</strong>
                <span>${review.phone}</span>
            </div>
        </article>
    `).join('');

    if (reviewsDots) {
        reviewsDots.innerHTML = reviews.map((_, index) => `
            <button class="reviews-dot" type="button" aria-label="Xem đánh giá ${index + 1}" data-review-index="${index}"></button>
        `).join('');
    }
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

    const syncActiveDot = () => {
        ticking = false;
        setActiveReviewDot(getActiveReviewIndex());
    };

    reviewsTrack.addEventListener('scroll', () => {
        if (!mobileReviewsQuery.matches || ticking) return;

        ticking = true;
        window.requestAnimationFrame(syncActiveDot);
    }, { passive: true });

    reviewsDots.addEventListener('click', event => {
        const dot = event.target.closest('.reviews-dot');
        if (!dot) return;

        scrollToReview(Number(dot.dataset.reviewIndex));
    });

    const handleModeChange = () => {
        if (!mobileReviewsQuery.matches) {
            reviewsTrack.scrollTo({ left: 0, behavior: 'auto' });
        }

        setActiveReviewDot(getActiveReviewIndex());
    };

    mobileReviewsQuery.addEventListener?.('change', handleModeChange);
    window.addEventListener('resize', handleModeChange, { passive: true });
    handleModeChange();
}

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
