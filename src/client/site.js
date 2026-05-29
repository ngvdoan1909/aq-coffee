import { initBaseUi } from './base-ui.js';
import { initBlog, setBlogPosts } from './blog.js';
import { initContactAndChat } from './contact-chat.js';
import { initReviews } from './reviews.js';
import { setupSiteContentListener } from './site-content-service.js';

export function initClientSite() {
    const ui = initBaseUi();

    initBlog(ui);
    initReviews(ui);
    initContactAndChat(ui);
    setupSiteContentListener(setBlogPosts);
}
