import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safe Service Worker handling:
// Native mobile apps (Capacitor/Cordova/Android WebView) serve local packaged files
// and must NOT be hijacked by web Service Workers.
const isNativeApp =
  typeof window !== 'undefined' &&
  (!!(window as any).Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'file:' ||
    window.location.protocol === 'capacitor:');

if ('serviceWorker' in navigator) {
  if (isNativeApp) {
    // Unregister any active service worker in native app to prevent asset interception
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  } else {
    // Web PWA installation
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

