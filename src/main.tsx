import {render} from 'preact';

import './index.css';
import {App} from './components/App';
import {UPDATE_CHECK} from './constants';

render(<App />, document.getElementById('app')!);

interface PeriodicSyncManager {
  register(tag: string, options?: {minInterval: number}): Promise<void>;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager;
  }
}

if (import.meta.env.MODE !== 'development') {
  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(UPDATE_CHECK);
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }

      navigator.serviceWorker.ready.then(async (registration) => {
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            // @ts-expect-error
            name: 'periodic-background-sync',
          });

          if (status.state === 'granted') {
            await registration.periodicSync.register(UPDATE_CHECK, {
              minInterval: 24 * 60 * 60 * 1000,
            });
          } else {
            navigator.serviceWorker.controller?.postMessage(UPDATE_CHECK);
          }
        } else {
          navigator.serviceWorker.controller?.postMessage(UPDATE_CHECK);
        }
      });
    }
  });
}
