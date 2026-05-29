import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteObject, getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { get, onValue, ref, remove, set, update } from 'firebase/database';
import { blogPostsPayload } from '../data/blog-data.js';
import { siteContentPayload } from '../data/site-content.js';
import { ADMIN_EMAIL, getFirebaseApp, getFirebaseDatabase, getSiteContentRef, hasFirebaseConfig } from '../firebase/firebase.js';
import { decodeJsonPayload } from '../utils/encoding.js';
import { deepMerge, escapeHTML, getNestedValue, setNestedValue, slugify } from '../utils/dom.js';
import { destroyAdminRichEditors, setupAdminRichEditors, syncAdminRichEditors } from './rich-editor.js';

const isAdminRoute = /^\/admin\/?$/.test(window.location.pathname);
const staticBlogPosts = decodeJsonPayload(blogPostsPayload);
const defaultSiteContent = decodeJsonPayload(siteContentPayload);

function postsArrayToRecord(posts) {
    return (posts || []).reduce((record, post, index) => {
        const key = String(post.slug || post.id || `post-${index + 1}`).replace(/[.#$[\]/]/g, '-');
        record[key] = { ...post };
        delete record[key].id;
        return record;
    }, {});
}

async function saveBlogPosts(database, posts) {
    const postsRef = ref(database, 'blogPosts');
    const snapshot = await get(postsRef);
    const writes = [];

    snapshot.forEach(childSnapshot => {
        writes.push(remove(ref(database, `blogPosts/${childSnapshot.key}`)));
    });

    Object.entries(postsArrayToRecord(posts)).forEach(([key, post]) => {
        writes.push(set(ref(database, `blogPosts/${key}`), post));
    });

    await Promise.all(writes);
}

function adminField(label, path, content, options = {}) {
    const value = getNestedValue(content, path);
    const escapedLabel = escapeHTML(label);
    const escapedPath = escapeHTML(path);

    if (options.type === 'textarea') {
        const richAttr = options.rich === false ? '' : ' data-admin-rich="true"';
        const fieldTag = options.rich === false ? 'label' : 'div';
        return `
            <${fieldTag} class="admin-field">
                <span>${escapedLabel}</span>
                <textarea data-admin-path="${escapedPath}"${richAttr} rows="${options.rows || 4}">${escapeHTML(value || '')}</textarea>
            </${fieldTag}>
        `;
    }

    if (options.type === 'image') {
        return `
            <label class="admin-field admin-field-wide">
                <span>${escapedLabel}</span>
                <div class="admin-image-input">
                    <input data-admin-path="${escapedPath}" value="${escapeHTML(value || '')}" readonly />
                    <input type="file" accept="image/*" data-admin-upload="${escapedPath}" />
                </div>
            </label>
        `;
    }

    if (options.type === 'readonly') {
        return `
            <label class="admin-field">
                <span>${escapedLabel}</span>
                <input data-admin-path="${escapedPath}" value="${escapeHTML(value || '')}" readonly />
            </label>
        `;
    }

    return `
        <label class="admin-field">
            <span>${escapedLabel}</span>
            <input data-admin-path="${escapedPath}" value="${escapeHTML(value || '')}" type="${options.type || 'text'}" />
        </label>
    `;
}

function adminCard(title, body) {
    return `
        <section class="admin-card">
            <h2>${escapeHTML(title)}</h2>
            <div class="admin-form-grid">${body}</div>
        </section>
    `;
}

function arrayInput(name, index, field, value, label, options = {}) {
    const attr = `data-array-name="${escapeHTML(name)}" data-array-index="${index}" data-array-field="${escapeHTML(field)}"`;
    const labelHtml = `<span>${escapeHTML(label)}</span>`;

    if (options.type === 'textarea') {
        const richAttr = options.rich === false ? '' : ' data-admin-rich="true"';
        const fieldTag = options.rich === false ? 'label' : 'div';
        return `<${fieldTag} class="admin-field">${labelHtml}<textarea ${attr}${richAttr} rows="${options.rows || 3}">${escapeHTML(value || '')}</textarea></${fieldTag}>`;
    }

    if (options.type === 'date') {
        return `<label class="admin-field">${labelHtml}<input ${attr} value="${escapeHTML(toDateInputValue(value))}" type="date" /></label>`;
    }

    if (options.type === 'image') {
        return `
            <label class="admin-field admin-field-wide">${labelHtml}
                <div class="admin-image-input">
                    <input ${attr} value="${escapeHTML(value || '')}" readonly />
                    <input type="file" accept="image/*" data-admin-array-upload="${escapeHTML(name)}:${index}:${escapeHTML(field)}" />
                </div>
            </label>
        `;
    }

    return `<label class="admin-field">${labelHtml}<input ${attr} value="${escapeHTML(value || '')}" /></label>`;
}

function toDateInputValue(value) {
    if (!value) return '';

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const date = new Date(Number(value) || value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
}

function arraySection(title, name, items, fields) {
    const rows = (items || []).map((item, index) => `
        <article class="admin-array-item" data-array-item="${escapeHTML(name)}" data-array-item-index="${index}">
            <div class="admin-array-head">
                <strong>${escapeHTML(title)} ${index + 1}</strong>
                <button class="admin-danger" type="button" data-remove-array-item="${escapeHTML(name)}:${index}">Xóa</button>
            </div>
            <div class="admin-form-grid">
                ${fields.map(field => arrayInput(name, index, field.key, item[field.key], field.label, field)).join('')}
            </div>
        </article>
    `).join('');

    return `
        <section class="admin-card">
            <div class="admin-array-title">
                <h2>${escapeHTML(title)}</h2>
                <button class="admin-ghost" type="button" data-add-array-item="${escapeHTML(name)}">Thêm</button>
            </div>
            <div class="admin-array-list">${rows || '<p>Chưa có dữ liệu.</p>'}</div>
        </section>
    `;
}

function renderAdminShell() {
    document.body.className = 'admin-page';
    document.body.innerHTML = `
        <main class="admin-login-screen">
            <form class="admin-login-card" id="adminLoginForm">
                <div>
                    <p class="admin-kicker">AQ Coffee Admin</p>
                    <h1>Đăng nhập quản trị</h1>
                </div>
                <label>Email<input type="email" name="email" value="${escapeHTML(ADMIN_EMAIL)}" autocomplete="username" required /></label>
                <label>Mật khẩu<input type="password" name="password" autocomplete="current-password" required /></label>
                <button class="admin-primary" type="submit">Đăng nhập</button>
                <p class="admin-status" role="status"></p>
            </form>
        </main>
    `;
}

function renderAdminDashboard(user, content, reviews = [], adminBlogPosts = staticBlogPosts) {
    destroyAdminRichEditors();
    document.body.className = 'admin-page';
    document.body.innerHTML = `
        <aside class="admin-sidebar">
            <div class="admin-brand">
                <img src="${escapeHTML(content.branding.logoUrl || defaultSiteContent.branding.logoUrl)}" alt="" />
                <div><strong>AQ Admin</strong><span>${escapeHTML(user.email || '')}</span></div>
            </div>
            <nav class="admin-tabs" aria-label="Admin sections">
                <button class="is-active" type="button" data-admin-tab="content">Nội dung</button>
                <button type="button" data-admin-tab="arrays">Danh sách</button>
                <button type="button" data-admin-tab="blog">Blog</button>
                <button type="button" data-admin-tab="reviews">Đánh giá</button>
            </nav>
            <button class="admin-ghost" type="button" id="adminLogout">Đăng xuất</button>
        </aside>
        <main class="admin-main">
            <header class="admin-topbar">
                <div>
                    <p class="admin-kicker">AQ Coffee</p>
                    <h1>Quản trị toàn bộ site</h1>
                </div>
                <div class="admin-actions">
                    <a class="admin-ghost" href="/" target="_blank">Xem site</a>
                    <button class="admin-primary" type="submit" form="siteContentForm">Lưu thay đổi</button>
                </div>
            </header>
            <p class="admin-status" id="adminStatus" role="status"></p>
            <form id="siteContentForm">
                <section class="admin-panel is-active" data-admin-panel="content">
                    <div class="admin-stats">
                        <div><strong>${escapeHTML(content.menu.items?.length || 0)}</strong><span>Món menu</span></div>
                        <div><strong>${escapeHTML(adminBlogPosts.length)}</strong><span>Bài blog</span></div>
                        <div><strong>${escapeHTML(reviews.length)}</strong><span>Đánh giá</span></div>
                    </div>
                    ${adminCard('Thương hiệu & SEO', [
                        adminField('Tên site', 'branding.siteName', content),
                        adminField('Logo mặc định', 'branding.logoUrl', content, { type: 'readonly' }),
                        adminField('Favicon mặc định', 'branding.faviconUrl', content, { type: 'readonly' }),
                        adminField('Màu chính', 'branding.primaryColor', content, { type: 'color' }),
                        adminField('Màu nhấn', 'branding.accentColor', content, { type: 'color' }),
                        adminField('Màu nền', 'branding.backgroundColor', content, { type: 'color' }),
                        adminField('Màu chữ', 'branding.textColor', content, { type: 'color' }),
                        adminField('SEO title', 'seo.title', content),
                        adminField('SEO description', 'seo.description', content, { type: 'textarea', rich: false }),
                        adminField('SEO keywords', 'seo.keywords', content, { type: 'textarea', rich: false }),
                        adminField('Canonical URL', 'seo.canonicalUrl', content),
                        adminField('OG image', 'seo.ogImage', content, { type: 'image' })
                    ].join(''))}
                    ${adminCard('Hero', [
                        adminField('Tiêu đề', 'hero.title', content, { type: 'textarea', rows: 3, rich: false }),
                        adminField('Mô tả', 'hero.subtitle', content, { type: 'textarea', rows: 5 }),
                        adminField('Nút CTA', 'hero.ctaLabel', content),
                        adminField('Target CTA', 'hero.ctaTarget', content),
                        adminField('Ảnh hero', 'hero.imageUrl', content, { type: 'image' }),
                        adminField('Alt ảnh', 'hero.imageAlt', content)
                    ].join(''))}
                    ${adminCard('Giới thiệu / Local SEO / Liên hệ', [
                        adminField('Tiêu đề giới thiệu', 'about.title', content),
                        adminField('Nội dung giới thiệu', 'about.text', content, { type: 'textarea', rows: 5 }),
                        adminField('Ảnh giới thiệu', 'about.imageUrl', content, { type: 'image' }),
                        adminField('Local SEO title', 'localSeo.title', content),
                        adminField('Local SEO text', 'localSeo.text', content, { type: 'textarea', rows: 5 }),
                        adminField('Địa chỉ', 'contact.address', content),
                        adminField('Hotline', 'contact.hotline', content),
                        adminField('Facebook URL', 'contact.facebookUrl', content),
                        adminField('Zalo URL', 'contact.zaloUrl', content),
                        adminField('Giờ bán', 'contact.openingHours', content),
                        adminField('Map embed URL', 'contact.mapEmbedUrl', content)
                    ].join(''))}
                </section>
                <section class="admin-panel" data-admin-panel="arrays">
                    ${adminCard('Menu', [
                        adminField('Tiêu đề menu', 'menu.title', content),
                        adminField('Mô tả menu', 'menu.subtitle', content)
                    ].join(''))}
                    ${arraySection('Liên kết menu đầu trang', 'nav', content.nav, [
                        { key: 'label', label: 'Tên hiển thị' },
                        { key: 'href', label: 'Liên kết' }
                    ])}
                    ${arraySection('Món trong menu', 'menu.items', content.menu.items, [
                        { key: 'name', label: 'Tên món' },
                        { key: 'price', label: 'Giá' },
                        { key: 'imageUrl', label: 'Ảnh món', type: 'image' },
                        { key: 'imageAlt', label: 'Mô tả ảnh' }
                    ])}
                    ${arraySection('Khu vực phục vụ', 'localSeo.areas', (content.localSeo.areas || []).map(area => ({ value: area })), [
                        { key: 'value', label: 'Tên khu vực' }
                    ])}
                    ${arraySection('Card nội dung SEO', 'searchIntents.cards', content.searchIntents.cards, [
                        { key: 'title', label: 'Tiêu đề' },
                        { key: 'text', label: 'Nội dung', type: 'textarea' }
                    ])}
                    ${arraySection('Câu hỏi FAQ', 'searchIntents.faqs', content.searchIntents.faqs, [
                        { key: 'question', label: 'Câu hỏi' },
                        { key: 'answer', label: 'Trả lời', type: 'textarea' }
                    ])}
                </section>
                <section class="admin-panel" data-admin-panel="blog">
                    ${arraySection('Bài blog', 'blogPosts', adminBlogPosts, [
                        { key: 'title', label: 'Tiêu đề' },
                        { key: 'slug', label: 'Slug URL' },
                        { key: 'metaTitle', label: 'Meta title' },
                        { key: 'metaDescription', label: 'Meta description', type: 'textarea', rich: false },
                        { key: 'excerpt', label: 'Tóm tắt', type: 'textarea', rich: false },
                        { key: 'readingMinutes', label: 'Phút đọc' },
                        { key: 'publishedAt', label: 'Ngày đăng', type: 'date' },
                        { key: 'imageUrl', label: 'Ảnh bài viết', type: 'image' },
                        { key: 'imageAlt', label: 'Mô tả ảnh' },
                        { key: 'contentHtml', label: 'Nội dung bài viết', type: 'textarea', rows: 10 }
                    ])}
                </section>
                <section class="admin-panel" data-admin-panel="reviews">
                    <div class="admin-review-list">
                        ${reviews.map(review => `
                            <article class="admin-review">
                                <div>
                                    <strong>${escapeHTML(review.name || 'Khách AQ')}</strong>
                                    <span>${escapeHTML(review.stars || 5)} sao · ${review.isApproved === false ? 'Đang ẩn' : 'Đang hiện'}</span>
                                    <p>${escapeHTML(review.text || '')}</p>
                                </div>
                                <div>
                                    <button type="button" class="admin-ghost" data-review-toggle="${escapeHTML(review.id)}" data-next-approved="${review.isApproved === false ? 'true' : 'false'}">${review.isApproved === false ? 'Hiện' : 'Ẩn'}</button>
                                    <button type="button" class="admin-danger" data-review-delete="${escapeHTML(review.id)}">Xóa</button>
                                </div>
                            </article>
                        `).join('') || '<p>Chưa có đánh giá.</p>'}
                    </div>
                </section>
            </form>
        </main>
    `;
}

function bindAdminLogin(auth) {
    document.getElementById('adminLoginForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        const status = event.currentTarget.querySelector('.admin-status');
        const data = new FormData(event.currentTarget);

        try {
            status.textContent = 'Đang đăng nhập...';
            await signInWithEmailAndPassword(auth, String(data.get('email') || ''), String(data.get('password') || ''));
        } catch (error) {
            status.textContent = 'Đăng nhập thất bại. Kiểm tra tài khoản Firebase Auth.';
            console.error(error);
        }
    });
}

function collectAdminContent(form, currentContent) {
    syncAdminRichEditors();

    const nextContent = JSON.parse(JSON.stringify(currentContent));
    form.querySelectorAll('[data-admin-path]').forEach(input => {
        const path = input.dataset.adminPath;
        let value = input.value;

        setNestedValue(nextContent, path, value);
    });

    const arrays = new Map();
    form.querySelectorAll('[data-array-name]').forEach(input => {
        const name = input.dataset.arrayName;
        const index = Number(input.dataset.arrayIndex);
        const field = input.dataset.arrayField;

        if (!arrays.has(name)) arrays.set(name, []);
        arrays.get(name)[index] = arrays.get(name)[index] || {};
        arrays.get(name)[index][field] = input.value;
    });

    arrays.forEach((items, name) => {
        let normalizedItems = items.filter(Boolean);

        if (name === 'localSeo.areas') {
            normalizedItems = normalizedItems.map(item => item.value).filter(Boolean);
        }

        setNestedValue(nextContent, name, normalizedItems);
    });

    return nextContent;
}

export function initAdminIfNeeded() {
    if (!isAdminRoute) return false;

    renderAdminShell();

    if (!hasFirebaseConfig) {
        document.querySelector('.admin-status').textContent = 'Firebase chưa được cấu hình trong .env.';
        return true;
    }

    const app = getFirebaseApp();
    const auth = getAuth(app);
    const database = getFirebaseDatabase();
    const storage = getStorage(app);
    let currentContent = defaultSiteContent;
    let currentReviews = [];
    let currentBlogPosts = staticBlogPosts;

    bindAdminLogin(auth);

    onAuthStateChanged(auth, user => {
        if (!user) {
            renderAdminShell();
            bindAdminLogin(auth);
            return;
        }

        if (user.email !== ADMIN_EMAIL) {
            renderAdminShell();
            document.querySelector('.admin-status').textContent = `Tài khoản ${user.email} không có quyền admin.`;
            signOut(auth);
            return;
        }

        onValue(getSiteContentRef(), snapshot => {
            currentContent = deepMerge(defaultSiteContent, snapshot.val() || {});
            renderAdminDashboard(user, currentContent, currentReviews, currentBlogPosts);
            bindAdminDashboard(auth, database, storage, () => currentContent, () => currentReviews);
        });

        onValue(ref(database, 'reviews'), snapshot => {
            currentReviews = [];
            snapshot.forEach(childSnapshot => {
                currentReviews.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            currentReviews.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
            renderAdminDashboard(user, currentContent, currentReviews, currentBlogPosts);
            bindAdminDashboard(auth, database, storage, () => currentContent, () => currentReviews);
        });

        onValue(ref(database, 'blogPosts'), snapshot => {
            const posts = [];
            snapshot.forEach(childSnapshot => posts.push({ id: childSnapshot.key, ...childSnapshot.val() }));
            currentBlogPosts = posts.length
                ? posts.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
                : staticBlogPosts;
            renderAdminDashboard(user, currentContent, currentReviews, currentBlogPosts);
            bindAdminDashboard(auth, database, storage, () => currentContent, () => currentReviews);
        });
    });

    return true;
}

function bindAdminDashboard(auth, database, storage, getContent) {
    const form = document.getElementById('siteContentForm');
    const status = document.getElementById('adminStatus');

    setupAdminRichEditors();

    document.getElementById('adminLogout')?.addEventListener('click', () => signOut(auth));
    document.querySelectorAll('[data-admin-tab]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-admin-tab]').forEach(item => item.classList.toggle('is-active', item === button));
            document.querySelectorAll('[data-admin-panel]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.adminPanel === button.dataset.adminTab));
        });
    });

    document.querySelectorAll('[data-remove-array-item]').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('[data-array-item]')?.remove();
        });
    });

    document.querySelectorAll('[data-add-array-item]').forEach(button => {
        button.addEventListener('click', () => {
            const name = button.dataset.addArrayItem;
            const card = button.closest('.admin-card');
            const list = card?.querySelector('.admin-array-list');
            const lastItem = list?.querySelector(`[data-array-item="${CSS.escape(name)}"]:last-of-type`);
            if (!list || !lastItem) return;

            const nextIndex = list.querySelectorAll(`[data-array-item="${CSS.escape(name)}"]`).length;
            const clone = lastItem.cloneNode(true);
            clone.dataset.arrayItemIndex = String(nextIndex);
            clone.querySelector('.admin-array-head strong').textContent = `${card.querySelector('h2')?.textContent || 'Mục'} ${nextIndex + 1}`;
            clone.querySelectorAll('[data-array-index]').forEach(input => {
                input.dataset.arrayIndex = String(nextIndex);
                input.value = '';
            });
            clone.querySelectorAll('[data-admin-array-upload]').forEach(input => {
                const [, , field] = input.dataset.adminArrayUpload.split(':');
                input.dataset.adminArrayUpload = `${name}:${nextIndex}:${field}`;
                input.value = '';
            });
            const removeButton = clone.querySelector('[data-remove-array-item]');
            if (removeButton) {
                removeButton.dataset.removeArrayItem = `${name}:${nextIndex}`;
                removeButton.addEventListener('click', () => clone.remove());
            }
            list.append(clone);
        });
    });

    form?.addEventListener('submit', async event => {
        event.preventDefault();

        try {
            if (status) status.textContent = 'Đang lưu...';
            const nextContent = collectAdminContent(form, getContent());
            const nextBlogPosts = nextContent.blogPosts;
            delete nextContent.blogPosts;
            delete nextContent.quickReplies;
            await set(getSiteContentRef(), nextContent);
            if (Array.isArray(nextBlogPosts)) {
                await saveBlogPosts(database, nextBlogPosts);
            }
            if (status) status.textContent = 'Đã lưu thay đổi lên Firebase.';
        } catch (error) {
            if (status) status.textContent = 'Không lưu được. Kiểm tra dữ liệu hoặc Firebase Rules.';
            console.error(error);
        }
    });

    form?.addEventListener('change', async event => {
        const uploadInput = event.target.closest('[data-admin-upload], [data-admin-array-upload]');
        if (!uploadInput) return;

        const file = uploadInput.files?.[0];
        if (!file) return;

        const singlePath = uploadInput.dataset.adminUpload;
        const arrayUpload = uploadInput.dataset.adminArrayUpload;
        const [arrayName, arrayIndex, arrayField] = arrayUpload ? arrayUpload.split(':') : [];
        const path = singlePath || `${arrayName}.${arrayIndex}.${arrayField}`;
        const extension = file.name.split('.').pop() || 'jpg';
        const targetInput = singlePath
            ? document.querySelector(`[data-admin-path="${CSS.escape(singlePath)}"]`)
            : document.querySelector(`[data-array-name="${CSS.escape(arrayName)}"][data-array-index="${CSS.escape(arrayIndex)}"][data-array-field="${CSS.escape(arrayField)}"]`);
        const fileBaseName = getUploadFileBaseName(path, targetInput);
        const fileRef = storageRef(storage, `site-assets/${fileBaseName}.${extension}`);
        const oldUrl = targetInput?.value || '';

        try {
            if (status) status.textContent = 'Đang tải ảnh lên...';
            if (oldUrl.includes('firebasestorage.googleapis.com') || oldUrl.startsWith('gs://')) {
                await deleteObject(storageRef(storage, oldUrl)).catch(error => {
                    if (error.code !== 'storage/object-not-found') throw error;
                });
            }
            await uploadBytes(fileRef, file, { contentType: file.type });
            const url = await getDownloadURL(fileRef);
            if (targetInput) targetInput.value = url;
            if (status) status.textContent = 'Đã tải ảnh. Bấm Lưu thay đổi để áp dụng.';
        } catch (error) {
            if (status) status.textContent = 'Không tải được ảnh lên Firebase Storage.';
            console.error(error);
        }
    });

    document.querySelectorAll('[data-review-toggle]').forEach(button => {
        button.addEventListener('click', async () => {
            await update(ref(database, `reviews/${button.dataset.reviewToggle}`), {
                isApproved: button.dataset.nextApproved === 'true'
            });
        });
    });

    document.querySelectorAll('[data-review-delete]').forEach(button => {
        button.addEventListener('click', async () => {
            await remove(ref(database, `reviews/${button.dataset.reviewDelete}`));
        });
    });
}
