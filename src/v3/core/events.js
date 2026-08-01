const handlers=new Map();
let rootElement=null;

export function registerAction(name,handler){handlers.set(name,handler);return()=>handlers.delete(name)}
export function bindActions(root){if(rootElement){rootElement.removeEventListener('click',handleClick);rootElement.removeEventListener('change',handleChange)}rootElement=root;rootElement.addEventListener('click',handleClick);rootElement.addEventListener('change',handleChange)}
function dispatch(event,control){if(!control||!rootElement.contains(control)||control.disabled)return;const handler=handlers.get(control.dataset.action);if(!handler)return;handler({event,control,target:event.target,data:{...control.dataset}})}
function handleClick(event){const control=event.target.closest('[data-action]');if(!control)return;if(control.matches('input,select,textarea'))return;event.preventDefault();dispatch(event,control)}
function handleChange(event){const control=event.target.closest('[data-action]');dispatch(event,control)}
export function clearActions(){handlers.clear()}
