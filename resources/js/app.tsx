import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => name === 'StaffPortal'
        ? import('./pages/StaffPortal').then((module) => module.default)
        : import('./pages/BakeryApp').then((module) => module.default),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#b8783c' },
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => { void navigator.serviceWorker.register('/service-worker.js'); });
}
