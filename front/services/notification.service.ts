import { api } from './api';

const VAPID_PUBLIC_KEY = 'BBD1ys8EMvdjNGQm23bdPVc1LU35I-Mr8wJcgZdlK2g9y2vlWQgOQjk-1Hm3bEZgmWv5Yu0R7Ail0OeMfBfwkiM';

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  return null;
}

export async function subscribeUserToPush() {
  const registration = await registerServiceWorker();
  if (!registration) return;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('User is subscribed:', subscription);
    const subJson = JSON.parse(JSON.stringify(subscription));
    
    // Send to backend
    await api.post('/notifications/subscribe', {
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
    });
  } catch (error) {
    console.error('Failed to subscribe the user:', error);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
