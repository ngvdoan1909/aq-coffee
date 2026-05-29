import { siteContentPayload } from '../data/site-content.js';
import { decodeJsonPayload } from '../utils/encoding.js';
import { escapeHTML, setMetaContent } from '../utils/dom.js';

const defaultSiteContent = decodeJsonPayload(siteContentPayload);

function applyText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined) {
        element.textContent = value;
    }
}

function applyImage(selector, imageUrl, imageAlt) {
    const image = document.querySelector(selector);
    if (!image) return;

    if (imageUrl) image.setAttribute('src', imageUrl);
    if (imageAlt) image.setAttribute('alt', imageAlt);
}

function applySiteMeta(content) {
    const { branding = {}, seo = {} } = content;

    document.title = seo.title || defaultSiteContent.seo.title;
    setMetaContent('meta[name="description"]', seo.description || '');
    setMetaContent('meta[name="keywords"]', seo.keywords || '');
    setMetaContent('meta[name="author"]', seo.author || branding.siteName || '');
    setMetaContent('meta[property="og:site_name"]', branding.siteName || '');
    setMetaContent('meta[property="og:title"]', seo.ogTitle || seo.title || '');
    setMetaContent('meta[property="og:description"]', seo.ogDescription || seo.description || '');
    setMetaContent('meta[property="og:image"]', seo.ogImage || '');
    setMetaContent('meta[property="og:image:secure_url"]', seo.ogImage || '');
    setMetaContent('meta[name="twitter:title"]', seo.ogTitle || seo.title || '');
    setMetaContent('meta[name="twitter:description"]', seo.ogDescription || seo.description || '');
    setMetaContent('meta[name="twitter:image"]', seo.ogImage || '');
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', seo.canonicalUrl || window.location.origin);
    document.querySelector('link[rel="icon"]')?.setAttribute('href', branding.faviconUrl || '/favicon.png');
    document.documentElement.style.setProperty('--brown', branding.primaryColor || defaultSiteContent.branding.primaryColor);
    document.documentElement.style.setProperty('--accent', branding.accentColor || defaultSiteContent.branding.accentColor);
    document.documentElement.style.setProperty('--beige', branding.backgroundColor || defaultSiteContent.branding.backgroundColor);
    document.documentElement.style.setProperty('--dark', branding.textColor || defaultSiteContent.branding.textColor);
}

function renderPublicSiteContent(content) {
    applySiteMeta(content);

    const { branding, nav, hero, menu, about, localSeo, searchIntents, blogSection, reviewsSection, contact, floatingContact, footer } = content;

    document.querySelectorAll('.logo img').forEach(image => {
        image.src = branding.logoUrl || defaultSiteContent.branding.logoUrl;
        image.alt = branding.siteName || defaultSiteContent.branding.siteName;
    });

    const navLinks = document.querySelector('.nav-links');
    if (navLinks && Array.isArray(nav)) {
        navLinks.innerHTML = nav.map(item => `<a href="${escapeHTML(item.href || '#')}">${escapeHTML(item.label || '')}</a>`).join('');
    }

    applyText('.hero-title', hero.title);
    applyText('.hero-subtitle', hero.subtitle);
    applyText('.hero-buttons .btn-primary', hero.ctaLabel);
    const heroButton = document.querySelector('.hero-buttons .btn-primary');
    if (heroButton && hero.ctaTarget) heroButton.dataset.scrollTarget = hero.ctaTarget;
    applyImage('.hero-cup', hero.imageUrl, hero.imageAlt);

    applyText('#menu .section-header h2', menu.title);
    applyText('#menu .section-header p', menu.subtitle);
    const menuGrid = document.querySelector('.menu-grid');
    if (menuGrid && Array.isArray(menu.items)) {
        menuGrid.innerHTML = menu.items.map(item => `
            <div class="menu-card reveal is-visible">
                <div class="menu-image-frame">
                    <img src="${escapeHTML(item.imageUrl || '')}" alt="${escapeHTML(item.imageAlt || item.name || '')}" width="900" height="675" loading="lazy" decoding="async" />
                </div>
                <div class="menu-info">
                    <h3>${escapeHTML(item.name || '')}</h3>
                    <span class="price">${escapeHTML(item.price || '')}</span>
                </div>
            </div>
        `).join('');
    }

    applyText('#about .about-text h2', about.title);
    applyText('#about .about-text p', about.text);
    applyImage('#about .about-image img', about.imageUrl, about.imageAlt);

    applyText('#local-title', localSeo.title);
    applyText('.local-seo-copy p', localSeo.text);
    applyText('.local-seo-areas h3', localSeo.areasTitle);
    const areasList = document.querySelector('.local-seo-areas ul');
    if (areasList && Array.isArray(localSeo.areas)) {
        areasList.innerHTML = localSeo.areas.map(area => `<li>${escapeHTML(area)}</li>`).join('');
    }

    applyText('#search-intents-title', searchIntents.title);
    applyText('.search-intents .section-header p', searchIntents.subtitle);
    const intentGrid = document.querySelector('.search-intent-grid');
    if (intentGrid && Array.isArray(searchIntents.cards)) {
        intentGrid.innerHTML = searchIntents.cards.map(card => `
            <article class="search-intent-card">
                <h3>${escapeHTML(card.title || '')}</h3>
                <p>${escapeHTML(card.text || '')}</p>
            </article>
        `).join('');
    }
    const faq = document.querySelector('.seo-faq');
    if (faq && Array.isArray(searchIntents.faqs)) {
        faq.innerHTML = searchIntents.faqs.map(item => `
            <details>
                <summary>${escapeHTML(item.question || '')}</summary>
                <p>${escapeHTML(item.answer || '')}</p>
            </details>
        `).join('');
    }

    applyText('#blog-title', blogSection.title);
    applyText('#blog .section-header p', blogSection.subtitle);
    applyText('#reviews-title', reviewsSection.title);
    applyText('#reviews .section-header p', reviewsSection.subtitle);
    applyText('.review-form h3', reviewsSection.formTitle);

    applyText('#contact .section-header h2', contact.title);
    applyText('#contact .section-header p', contact.subtitle);
    applyText('.contact-info h3', contact.infoTitle);
    const contactInfo = document.querySelector('.contact-info');
    if (contactInfo) {
        const map = contactInfo.querySelector('.contact-map');
        contactInfo.innerHTML = `
            <h3>${escapeHTML(contact.infoTitle || '')}</h3>
            <p><strong>Địa chỉ:</strong> ${escapeHTML(contact.address || '')}</p>
            <p><strong>Hotline:</strong> ${escapeHTML(contact.hotline || '')}</p>
            <p><strong>Facebook:</strong> <a href="${escapeHTML(contact.facebookUrl || '#')}" target="_blank" rel="noreferrer">${escapeHTML(contact.facebookLabel || 'Facebook')}</a></p>
            <p><strong>Giờ bán:</strong> ${escapeHTML(contact.openingHours || '')}</p>
            <div class="contact-map">${map?.innerHTML || ''}</div>
        `;
        const iframe = contactInfo.querySelector('iframe');
        if (iframe && contact.mapEmbedUrl) iframe.src = contact.mapEmbedUrl;
    }
    applyText('.contact-form h3', contact.formTitle);
    document.querySelectorAll('.floating-contact-zalo, .floating-chat-links a:first-child').forEach(link => link.href = contact.zaloUrl || '#');
    document.querySelectorAll('.floating-contact-facebook, .floating-chat-links a:last-child').forEach(link => link.href = contact.facebookUrl || '#');
    applyText('.floating-chat-message', floatingContact.chatIntro);
    applyText('.floating-chat-answer', floatingContact.defaultAnswer);
    applyText('.floating-chat-links a:first-child', floatingContact.zaloLabel);
    applyText('.floating-chat-links a:last-child', floatingContact.facebookLabel);
    applyText('.footer-container p', `© ${new Date().getFullYear()} ${footer.text || branding.siteName || 'AQ Coffee'}`);
}

export { renderPublicSiteContent };
