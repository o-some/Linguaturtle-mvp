import { getState, setState } from './store.js';

const routes = new Map();
let root = null;
let notFound = null;
let renderDepth = 0;

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
  const routeAtStart = getState().route;
  const renderer = routes.get(routeAtStart.name) || notFound;
  if (!renderer) throw new Error(`No renderer for route: ${routeAtStart.name}`);
  renderDepth += 1;
  const output = renderer({ state: getState(), params: routeAtStart.params, navigate });
  renderDepth -= 1;
  const routeAfterRender = getState().route;
  if (typeof output === 'string' && routeAfterRender.name === routeAtStart.name) root.innerHTML = output;
  if (renderDepth === 0) root.dispatchEvent(new CustomEvent('linguaturtle:route-rendered', { bubbles: true, detail: routeAfterRender }));
}
