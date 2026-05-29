import { initAdminIfNeeded } from './src/admin/admin.js';

if (!initAdminIfNeeded()) {
    const { initClientSite } = await import('./src/client/site.js');
    initClientSite();
}
