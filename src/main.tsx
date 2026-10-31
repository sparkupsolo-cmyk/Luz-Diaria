import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register and update service worker
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      // Periodically check for SW updates (e.g. every hour)
      setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    }
  },
});

createRoot(document.getElementById('root')!).render(<App />);

