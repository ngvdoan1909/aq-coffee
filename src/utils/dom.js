export function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function setMetaContent(selector, content) {
    const meta = document.head.querySelector(selector);
    if (meta) {
        meta.setAttribute('content', content);
    }
}

export function deepMerge(base, override) {
    if (Array.isArray(base)) {
        return Array.isArray(override) ? override : base;
    }

    if (!base || typeof base !== 'object') {
        return override ?? base;
    }

    const output = { ...base };
    Object.entries(override || {}).forEach(([key, value]) => {
        output[key] = deepMerge(base[key], value);
    });

    return output;
}

export function setNestedValue(target, path, value) {
    const keys = path.split('.');
    let cursor = target;

    keys.slice(0, -1).forEach(key => {
        cursor[key] = cursor[key] && typeof cursor[key] === 'object' && !Array.isArray(cursor[key]) ? cursor[key] : {};
        cursor = cursor[key];
    });

    cursor[keys.at(-1)] = value;
}

export function getNestedValue(target, path) {
    return path.split('.').reduce((value, key) => value?.[key], target);
}

export function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function normalizeStars(value) {
    const stars = Number(value);
    if (!Number.isFinite(stars)) return 5;

    return Math.min(5, Math.max(1, Math.round(stars)));
}
