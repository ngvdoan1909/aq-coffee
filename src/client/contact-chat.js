import quickRepliesPayload from '../data/quick-replies.json';
import { decodeJsonPayload } from '../utils/encoding.js';
import { escapeHTML } from '../utils/dom.js';

const quickRepliesConfig = decodeJsonPayload(quickRepliesPayload.payload);
let prefersReducedMotion = false;

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

const floatingContact = document.querySelector('[data-contact-widget]');
const floatingContactToggle = floatingContact?.querySelector('[data-contact-toggle]');
const floatingChatPanel = floatingContact?.querySelector('[data-contact-chat-panel]');
const floatingChatAnswer = floatingContact?.querySelector('[data-chat-answer]');
const lastQuickReplyIndexByKeyword = new Map();

function getRandomQuickReply(keyword) {
    const quickRepliesByKeyword = new Map(
        (quickRepliesConfig.items || []).map(item => [item.keyword, item.replies || []])
    );
    const replies = quickRepliesByKeyword.get(keyword) || [];
    if (!replies.length) return '';

    let replyIndex = Math.floor(Math.random() * replies.length);
    const lastReplyIndex = lastQuickReplyIndexByKeyword.get(keyword);

    if (replies.length > 1 && replyIndex === lastReplyIndex) {
        replyIndex = (replyIndex + 1) % replies.length;
    }

    lastQuickReplyIndexByKeyword.set(keyword, replyIndex);

    return replies[replyIndex].replaceAll('[LINK_MAP]', quickRepliesConfig.mapUrl || '');
}

function renderFloatingChatAnswer(response) {
    if (!floatingChatAnswer) return;

    const mapUrl = quickRepliesConfig.mapUrl || '';
    let answerHtml = escapeHTML(response);

    if (mapUrl) {
        const escapedMapUrl = escapeHTML(mapUrl);
        answerHtml = answerHtml.replaceAll(
            escapedMapUrl,
            `<a href="${escapedMapUrl}" target="_blank" rel="noreferrer">${escapedMapUrl}</a>`
        );
    }

    floatingChatAnswer.innerHTML = answerHtml;
}

function setFloatingContactState(isOpen) {
    if (!floatingContact || !floatingContactToggle) return;

    floatingContact.classList.toggle('is-open', isOpen);
    floatingContactToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    floatingContactToggle.setAttribute('aria-label', isOpen ? 'Đóng kênh liên hệ' : 'Mở kênh liên hệ');
}

function setFloatingChatState(isOpen) {
    if (!floatingContact || !floatingChatPanel) return;

    floatingContact.classList.toggle('is-chat-open', isOpen);
    floatingChatPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen) {
        setFloatingContactState(true);
    }
}

floatingContactToggle?.addEventListener('click', () => {
    const willOpen = !floatingContact?.classList.contains('is-open');

    setFloatingContactState(willOpen);

    if (!willOpen) {
        setFloatingChatState(false);
    }
});

floatingContact?.querySelector('[data-contact-open-chat]')?.addEventListener('click', () => {
    setFloatingChatState(true);
});

floatingContact?.querySelector('[data-contact-close-chat]')?.addEventListener('click', () => {
    setFloatingChatState(false);
});

floatingContact?.querySelectorAll('[data-chat-question]').forEach(button => {
    button.addEventListener('click', () => {
        const keyword = button.dataset.chatQuestion;
        const response = getRandomQuickReply(keyword);
        if (response) {
            renderFloatingChatAnswer(response);
        }

        if (keyword === 'menu') {
            document.getElementById('menu')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
    });
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        setFloatingChatState(false);
        setFloatingContactState(false);
    }
});

document.addEventListener('click', event => {
    if (!floatingContact?.classList.contains('is-open')) return;
    if (floatingContact.contains(event.target)) return;

    setFloatingChatState(false);
    setFloatingContactState(false);
});

function initContactAndChat(options = {}) {
    prefersReducedMotion = Boolean(options.prefersReducedMotion);
}

export { initContactAndChat };
