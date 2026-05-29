import { onValue, ref } from 'firebase/database';
import { blogPostsPayload } from '../data/blog-data.js';
import { siteContentPayload } from '../data/site-content.js';
import { getFirebaseDatabase, getSiteContentRef, hasFirebaseConfig } from '../firebase/firebase.js';
import { decodeJsonPayload } from '../utils/encoding.js';
import { deepMerge } from '../utils/dom.js';
import { renderPublicSiteContent } from './site-content-renderer.js';

const staticBlogPosts = decodeJsonPayload(blogPostsPayload);
const defaultSiteContent = decodeJsonPayload(siteContentPayload);

function setupSiteContentListener(onBlogPostsChange) {
    let blogPosts = staticBlogPosts;

    if (!hasFirebaseConfig) {
        renderPublicSiteContent(defaultSiteContent);
        return;
    }

    onValue(getSiteContentRef(), snapshot => {
        const content = deepMerge(defaultSiteContent, snapshot.val() || {});
        renderPublicSiteContent(content);
    }, error => {
        console.error(error);
        renderPublicSiteContent(defaultSiteContent);
    });

    onValue(ref(getFirebaseDatabase(), 'blogPosts'), snapshot => {
        const posts = [];
        snapshot.forEach(childSnapshot => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        if (posts.length) {
            blogPosts = posts.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
        } else {
            blogPosts = staticBlogPosts;
        }
        onBlogPostsChange(blogPosts);
    }, error => {
        console.error(error);
        blogPosts = staticBlogPosts;
        onBlogPostsChange(blogPosts);
    });
}

export { setupSiteContentListener };
