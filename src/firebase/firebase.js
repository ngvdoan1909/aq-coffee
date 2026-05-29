import { getApps, initializeApp } from 'firebase/app';
import { getDatabase, ref } from 'firebase/database';

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@aq.com';
export const SITE_CONTENT_PATH = 'siteContent';
export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);

let firebaseDatabase;

export function getFirebaseApp() {
    return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getFirebaseDatabase() {
    if (firebaseDatabase) return firebaseDatabase;

    firebaseDatabase = getDatabase(getFirebaseApp());

    return firebaseDatabase;
}

export function getSiteContentRef() {
    return ref(getFirebaseDatabase(), SITE_CONTENT_PATH);
}
