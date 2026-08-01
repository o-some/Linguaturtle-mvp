const app = document.querySelector('#app');
const BUILD='v3.0.4-navigation';
const params=new URLSearchParams(location.search);

function recoveryScreen(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unbekannter Fehler');
  app.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(180deg,#eaf8ff,#fffdf8);font-family:system-ui,sans-serif;color:#17354a">
      <section style="width:min(100%,520px);background:white;border:1px solid #cfe1ea;border-radius:28px;padding:28px;text-align:center;box-shadow:0 18px 45px rgba(7,63,103,.16)">
        <div style="font-size:72px">🐢</div>
        <p style="font-size:12px;font-weight:900;letter-spacing:.18em;color:#d3ad51">LINGUATURTLE 3.0</p>
        <h1 style="font-family:Georgia,serif;color:#073f67">Tula braucht kurz Hilfe</h1>
        <p>Die App konnte nicht vollständig gestartet werden. Dein Fortschritt bleibt erhalten.</p>
        <details style="margin:18px 0;text-align:left"><summary>Technische Information</summary><code style="display:block;white-space:pre-wrap;margin-top:10px">${message.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</code></details>
        <button id="retryV3" style="width:100%;border:0;border-radius:18px;padding:15px;background:#073f67;color:white;font-weight:900">Erneut starten</button>
        <button id="repairV3" style="width:100%;margin-top:10px;border:1px solid #cfe1ea;border-radius:18px;padding:15px;background:white;color:#073f67;font-weight:900">V3-Daten reparieren</button>
      </section>
    </main>`;
  document.querySelector('#retryV3')?.addEventListener('click', () => location.reload());
  document.querySelector('#repairV3')?.addEventListener('click', () => {
    localStorage.removeItem('linguaturtle-v3-preview');
    localStorage.removeItem('linguaturtle-v3-mastery');
    localStorage.removeItem('linguaturtle-v3-child-profile');
    location.reload();
  });
}

window.addEventListener('error', event => console.error('[V3 runtime error]', event.error || event.message));
window.addEventListener('unhandledrejection', event => console.error('[V3 rejected promise]', event.reason));

async function load(path){return import(`${path}?build=${encodeURIComponent(BUILD)}`)}

function showQaLauncher(){
  if(params.get('qa')!=='1') return;
  document.querySelector('#qaLauncher')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<button id="qaLauncher" style="position:fixed;right:14px;top:max(14px,env(safe-area-inset-top));z-index:99998;border:0;border-radius:999px;background:#073f67;color:white;padding:12px 16px;font:800 13px system-ui;box-shadow:0 12px 28px rgba(7,63,103,.28)">QA-Test starten</button>`);
  document.querySelector('#qaLauncher')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('linguaturtle:run-qa')));
}

async function boot() {
  try {
    if (!app) throw new Error('App-Container fehlt.');
    app.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;background:linear-gradient(180deg,#eaf8ff,#fffdf8);font:700 18px system-ui;color:#073f67"><div style="text-align:center"><div style="font-size:76px;animation:v3boot 1.6s ease-in-out infinite">🐢</div><p>Turtle Island wird geladen …</p></div></div><style>@keyframes v3boot{50%{transform:translateY(-8px)}}</style>';

    await load('./app.js');

    const optionalModules = [
      './navigation-architecture.js',
      './child-profiles.js',
      './advanced-games.js',
      './gamification.js',
      './island-expansion.js',
      './tula-home.js',
      './adaptive-learning.js',
      './speaking-stories.js',
      './health-check.js',
      './qa-smoke.js'
    ];
    const results = await Promise.allSettled(optionalModules.map(load));
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length) {
      console.warn(`[V3] ${failed.length} optionale Module konnten nicht geladen werden.`, failed);
      document.body.insertAdjacentHTML('beforeend', '<button type="button" id="v3ModuleWarning" style="position:fixed;right:12px;top:12px;z-index:999;background:#fff4cf;color:#6b4d00;border:1px solid #e3c66b;border-radius:999px;padding:8px 12px;font:700 12px system-ui">V3: Teilmodule werden geprüft</button>');
      document.querySelector('#v3ModuleWarning')?.addEventListener('click',()=>console.table(failed));
    }
    showQaLauncher();
  } catch (error) {
    console.error('[V3 boot failed]', error);
    recoveryScreen(error);
  }
}

boot();
