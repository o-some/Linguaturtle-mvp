const appRoot = document.querySelector('#app');
const STORAGE_KEYS = [
  'linguaturtle-v2',
  'linguaturtle-premium-v4',
  'linguaturtle-v3'
];

function showRecovery(error) {
  console.error('LinguaTurtle konnte nicht gestartet werden:', error);
  appRoot.innerHTML = `
    <section style="max-width:520px;margin:48px auto;padding:24px;font-family:system-ui;text-align:center;color:#073f67">
      <div style="font-size:72px">🐢</div>
      <h1 style="font-family:Georgia,serif">Tula braucht kurz Hilfe</h1>
      <p>Die gespeicherten App-Daten konnten nicht geladen werden.</p>
      <button id="repairApp" style="border:0;border-radius:18px;padding:14px 20px;background:#073f67;color:white;font-weight:800;font-size:16px">App reparieren und neu starten</button>
    </section>`;
  document.querySelector('#repairApp')?.addEventListener('click', async () => {
    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.filter(key => key.startsWith('linguaturtle-')).map(key => caches.delete(key)));
    window.location.reload();
  });
}

import('./app.js?v=8').catch(showRecovery);
