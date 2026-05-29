const adminRichEditors = new Map();

function loadScriptOnce(src, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);

    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window[globalName]));
            existingScript.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(window[globalName]);
        script.onerror = reject;
        document.head.append(script);
    });
}

export function destroyAdminRichEditors() {
    adminRichEditors.forEach(editor => {
        editor.destroy?.().catch?.(() => {});
    });
    adminRichEditors.clear();
}

export async function setupAdminRichEditors() {
    const textareas = [...document.querySelectorAll('textarea[data-admin-rich="true"]')];
    if (!textareas.length) return;

    try {
        const ClassicEditor = await loadScriptOnce('https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js', 'ClassicEditor');
        await Promise.all(textareas.map(async textarea => {
            if (adminRichEditors.has(textarea)) return;

            const editor = await ClassicEditor.create(textarea, {
                toolbar: {
                    items: [
                        'heading', '|',
                        'bold', 'italic', '|',
                        'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
                        'insertTable', '|',
                        'undo', 'redo'
                    ],
                    shouldNotGroupWhenFull: true
                },
                heading: {
                    options: [
                        { model: 'paragraph', title: 'Đoạn văn', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'H1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'H2', class: 'ck-heading_heading2' },
                        { model: 'heading3', view: 'h3', title: 'H3', class: 'ck-heading_heading3' },
                        { model: 'heading4', view: 'h4', title: 'H4', class: 'ck-heading_heading4' },
                        { model: 'heading5', view: 'h5', title: 'H5', class: 'ck-heading_heading5' },
                        { model: 'heading6', view: 'h6', title: 'H6', class: 'ck-heading_heading6' }
                    ]
                },
                removePlugins: [
                    'AIAssistant',
                    'CKBox',
                    'CKFinder',
                    'EasyImage',
                    'RealTimeCollaborativeComments',
                    'RealTimeCollaborativeTrackChanges',
                    'RealTimeCollaborativeRevisionHistory',
                    'PresenceList',
                    'Comments',
                    'TrackChanges',
                    'TrackChangesData',
                    'RevisionHistory',
                    'Pagination',
                    'WProofreader',
                    'MathType',
                    'SlashCommand',
                    'Template',
                    'DocumentOutline',
                    'FormatPainter',
                    'TableOfContents'
                ]
            });

            adminRichEditors.set(textarea, editor);
        }));
    } catch (error) {
        const status = document.getElementById('adminStatus');
        if (status) {
            status.textContent = 'Không tải được trình soạn thảo nâng cao. Vẫn có thể nhập HTML trực tiếp.';
        }
        console.error(error);
    }
}

export function syncAdminRichEditors() {
    adminRichEditors.forEach((editor, textarea) => {
        textarea.value = editor.getData();
    });
}
