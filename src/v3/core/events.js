const handlers = new Map();
let rootElement = null;

export function registerAction(name, handler) {
  handlers.set(name, handler);
  return () => handlers.delete(name);
}

export function bindActions(root) {
  if (rootElement) rootElement.removeEventListener('click', handleClick);
  rootElement = root;
  rootElement.addEventListener('click', handleClick);
}

function handleClick(event) {
  const control = event.target.closest('[data-action]');
  if (!control || !rootElement.contains(control) || control.disabled) return;
  const handler = handlers.get(control.dataset.action);
  if (!handler) return;
  event.preventDefault();
  handler({ event, control, data: { ...control.dataset } });
}

export function clearActions() {
  handlers.clear();
}
