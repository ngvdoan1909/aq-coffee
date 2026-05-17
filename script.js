window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('is-scrolled');
    } else {
        navbar.classList.remove('is-scrolled');
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.menu-card, .about-container, .contact-container').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.8s ease';
    observer.observe(el);
});

const reviews = [
    {
        name: "Anh Tuấn",
        phone: "0984.552.***",
        text: "Cà phê tự ủ uống đậm đà khác hẳn mấy loại pha máy đại trà bây giờ. Sáng nào đi làm qua Cổng A cũng phải tạt vào làm ly đen đá mới đủ đô để tỉnh táo vào ca."
    },
    {
        name: "Chị Linh",
        phone: "0356.221.***",
        text: "Mê nhất món cà phê muối ở đây, kem béo ngậy mà cốt cà phê pha tay rất thơm và đậm. Mình hay alo hotline đặt trước, lúc đi xe máy qua chỉ việc lấy luôn, không lo muộn giờ chấm công."
    },
    {
        name: "Hùng",
        phone: "0912.883.***",
        text: "Quầy nhỏ thôi nhưng anh chủ làm nhanh thoăn thoắt. Tầm 6h45 sáng đông nghẹt người xếp hàng mà chờ xíu là có liền. Bạc xỉu thơm, ngọt béo đúng gu mình."
    },
    {
        name: "Thu Hương",
        phone: "0868.334.***",
        text: "Cà phê chuẩn vị truyền thống, giá lại cực kỳ bình dân chỉ từ 15k-20k. Điểm cộng lớn là bán từ 5h sáng, hôm nào mình đi ca sớm vẫn kịp mua."
    },
    {
        name: "Bạn Đức",
        phone: "0333.666.***",
        text: "Cốt cà phê tự ủ rất chất lượng, uống từ sáng mà tỉnh táo đến tận chiều. Anh chủ nhiệt tình, vui vẻ, vote 5 sao cho sự tử tế!"
    },
    {
        name: "Chú Bảo",
        phone: "0973.415.***",
        text: "Tôi làm ca đêm mệt mỏi, sáng ra giao ca cứ phải làm ly đen không đường của chú em này mới tỉnh người để chạy xe về nhà. Cà phê nguyên chất, đắng thanh dầy vị, rất đáng tiền."
    },
    {
        name: "C Minh Anh",
        phone: "0961.992.***",
        text: "Tìm mãi quanh khu Bắc Thăng Long mới thấy một quầy bán bạc xỉu pha tay ngon như này. Sữa đặc thơm ngậy hòa với vị đắng nhẹ của cốt cà phê ủ. Nghiện luôn rồi tuần nào cũng mua 3-4 lần."
    },
    {
        name: "Anh Ngọc",
        phone: "0388.741.***",
        text: "Giá 15k-20k mà chất lượng quá ổn áp. Sáng nào cũng xếp hàng mua một ly cà phê sữa mang vào xưởng. Anh chủ tay chân lẹ làng, phục vụ chu đáo dù khách xếp hàng rất đông."
    },
    {
        name: "Thảo Vy",
        phone: "0345.118.***",
        text: "Món cà phê muối ngon đỉnh chóp nha mọi người, béo béo mặn mặn kết hợp cốt cà phê pha tay đậm đặc. Hôm nào dậy muộn alo trước cho anh chủ, lúc đi qua lấy vèo cái là xong không sợ trễ giờ."
    },
    {
        name: "Anh Grab",
        phone: "0904.663.***",
        text: "Chạy xe sáng sớm cứ ghé Cổng A làm ly đen đá. Tiện đường, mua nhanh gọn, không mất thời gian gửi xe gì cả. Cà phê tự ủ tay uống đậm đà chuẩn vị, giúp tôi tỉnh táo cả ngày chạy xe."
    }
];

const reviewsTrack = document.getElementById('reviewsTrack');
const reviewDots = document.getElementById('reviewDots');
const prevReviewButton = document.querySelector('[data-review-prev]');
const nextReviewButton = document.querySelector('[data-review-next]');
const reviewsShell = document.querySelector('.reviews-shell');
let reviewIndex = 0;
let reviewTimer;

function getVisibleReviews() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
}

function getMaxReviewIndex() {
    return Math.max(0, reviews.length - getVisibleReviews());
}

function renderReviews() {
    if (!reviewsTrack || !reviewDots) return;

    reviewsTrack.innerHTML = reviews.map(review => `
        <article class="review-card">
            <div>
                <div class="review-stars" aria-label="5 sao">★★★★★</div>
                <p class="review-text">“${review.text}”</p>
            </div>
            <div class="review-person">
                <strong>${review.name}</strong>
                <span>${review.phone}</span>
            </div>
        </article>
    `).join('');

    renderReviewDots();
    updateReviewSlider();
}

function renderReviewDots() {
    const maxIndex = getMaxReviewIndex();
    reviewDots.innerHTML = Array.from({ length: maxIndex + 1 }, (_, index) => `
        <button class="review-dot" type="button" data-review-dot="${index}" aria-label="Tới nhóm đánh giá ${index + 1}"></button>
    `).join('');

    reviewDots.querySelectorAll('.review-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            reviewIndex = Number(dot.dataset.reviewDot);
            updateReviewSlider();
            restartReviewTimer();
        });
    });
}

function updateReviewSlider() {
    if (!reviewsTrack) return;

    reviewIndex = Math.min(reviewIndex, getMaxReviewIndex());
    const firstCard = reviewsTrack.querySelector('.review-card');
    const gap = parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
    reviewsTrack.style.transform = `translateX(-${reviewIndex * (cardWidth + gap)}px)`;

    reviewDots?.querySelectorAll('.review-dot').forEach((dot, index) => {
        dot.classList.toggle('is-active', index === reviewIndex);
    });
}

function moveReview(direction) {
    const maxIndex = getMaxReviewIndex();
    reviewIndex = direction > 0
        ? (reviewIndex >= maxIndex ? 0 : reviewIndex + 1)
        : (reviewIndex <= 0 ? maxIndex : reviewIndex - 1);
    updateReviewSlider();
}

function restartReviewTimer() {
    window.clearInterval(reviewTimer);
    reviewTimer = window.setInterval(() => moveReview(1), 4200);
}

prevReviewButton?.addEventListener('click', () => {
    moveReview(-1);
    restartReviewTimer();
});

nextReviewButton?.addEventListener('click', () => {
    moveReview(1);
    restartReviewTimer();
});

reviewsShell?.addEventListener('mouseenter', () => window.clearInterval(reviewTimer));
reviewsShell?.addEventListener('mouseleave', restartReviewTimer);

window.addEventListener('resize', () => {
    renderReviewDots();
    updateReviewSlider();
});

if (reviewsShell) {
    reviewsShell.style.opacity = '0';
    reviewsShell.style.transform = 'translateY(40px)';
    reviewsShell.style.transition = 'all 0.8s ease';
    observer.observe(reviewsShell);
}

renderReviews();
restartReviewTimer();
