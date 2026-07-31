import { getState, patch } from './src/core/store.js';

const rewardMap = {
  learn: { de: 'Belohnung: 🐚 4', es: 'Recompensa: 🐚 4' },
  quiz: { de: 'Belohnung: 🐚 4–20', es: 'Recompensa: 🐚 4–20' },
  match: { de: 'Belohnung: 🐚 4–20', es: 'Recompensa: 🐚 4–20' },
  sentence: { de: 'Belohnung: bis zu 🐚 30', es: 'Recompensa: hasta 🐚 30' },
  memory: { de: 'Belohnung: 🐚 16', es: 'Recompensa: 🐚 16' },
  speed: { de: 'Belohnung: 🐚 4–40+', es: 'Recompensa: 🐚 4–40+' }
};

function languageLabel(lang) {
  return lang === 'de' ? '🇩🇪 DE' : '🇪🇸 ES';
}

function enhanceLanguageSwitch() {
  const header = document.querySelector('.topbar');
  if (!header || header.querySelector('.language-switch')) return;

  const state = getState();
  const switcher = document.createElement('button');
  switcher.type = 'button';
  switcher.className = 'language-switch';
  switcher.textContent = languageLabel(state.lang);
  switcher.setAttribute('aria-label', state.lang === 'de' ? 'Auf Spanisch umstellen' : 'Cambiar a alemán');
  switcher.addEventListener('click', () => {
    const next = getState().lang === 'de' ? 'es' : 'de';
    patch({ lang: next });
    document.documentElement.lang = next;
    window.location.reload();
  });

  const shell = header.querySelector('.shell');
  if (shell) header.insertBefore(switcher, shell);
  else header.appendChild(switcher);
}

function enhanceModeRewards() {
  const state = getState();
  document.querySelectorAll('.mode-list [data-start]').forEach(button => {
    if (button.querySelector('.mode-reward')) return;
    const mode = button.dataset.start;
    const reward = rewardMap[mode];
    if (!reward) return;

    const badge = document.createElement('span');
    badge.className = 'mode-reward';
    badge.textContent = reward[state.lang];

    const textBlock = button.querySelector('div');
    if (textBlock) textBlock.appendChild(badge);
  });
}

function enhanceCurrentPage() {
  enhanceLanguageSwitch();
  enhanceModeRewards();
}

const observer = new MutationObserver(enhanceCurrentPage);
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
enhanceCurrentPage();
