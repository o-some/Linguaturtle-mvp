import { getState, setState } from './store.js';

const routes = new Map();
let root = null;
let notFound = null;

export function createRouter(target) {
  root = target;
  return { register, navigate, renderCurrent, setNotFound };
}

export function register(name, renderer) {
  if (typeof renderer !== 'function') throw new TypeError(`Route ${name} needs a renderer`);
  routes.set(name, renderer);
}

export function setNotFound(renderer) { notFound = renderer; }

export function navigate(name, params = {}, options = {}) {
  if (!routes.has(name) && !notFound) throw new Error(`Unknown route: ${name}`);
  setState(draft => { draft.route = { name, params }; return draft; }, { persist: options.persist !== false });
  renderCurrent();
  if (options.scroll !== false) window.scrollTo({ top: 0, behavior: options.smooth ? 'smooth' : 'auto' });
}

export function renderCurrent() {
  if (!root) throw new Error('Router root is not configured');
  const { route } = getState();
  const renderer = routes.get(route.name) || notFound;
  if (!renderer) throw new Error(`No renderer for route: ${route.name}`);
  const output = renderer({ state: getState(), params: route.params, navigate });
  root.innerHTML = typeof output === 'string' ? output : '';
  root.dispatchEvent(new CustomEvent('linguaturtle:route-rendered', { bubbles: true, detail: route }));
}
