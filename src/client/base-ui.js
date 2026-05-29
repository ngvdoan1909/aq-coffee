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

function initBaseUi() {
    return { prefersReducedMotion, observer };
}

export { initBaseUi };
