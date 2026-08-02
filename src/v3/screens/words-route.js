import { register, getState } from '../core/index.js';

register('words',()=>{
 const s=getState();
 const tr=(de,es)=>s.language==='es'?es:de;
 return `<div class="v3-shell page"><header class="v3-top"><button class="icon" data-action="navigate" data-route="home">←</button><div class="v3-brand"><i>🐢</i><strong>Chelonaki - Language</strong></div><span class="wallet-mini">🐚 ${s.progress.shells}</span></header><section class="page-title"><span class="eyebrow">${tr('WÖRTER','PALABRAS')}</span><h1>${tr('Deine Wortwelten','Tus mundos de palabras')}</h1><p>${tr('Öffne die Bibliothek und wähle dort eine Übung.','Abre la biblioteca y elige un ejercicio.')}</p></section><section class="journey-grid"><button data-action="open-world" data-collection="library"><span>📚</span><div><strong>${tr('Bibliothek','Biblioteca')}</strong><small>${tr('Wörter, Hören und Sätze','Palabras, escucha y frases')}</small></div><b>→</b></button></section></div>`;
});
