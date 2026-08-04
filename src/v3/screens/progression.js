import {
  getState, setState, registerAction, levelFromXp, totalMasterStars, resetState,
  sourceLanguage, languageValue, uiText, getEconomyState, isNativeCommerce,
  purchaseShells, requestRewardedAd, spendEconomyShells, syncPurchases,
  creditGameplayShells
} from '../core/index.js?build=cinematic-worlds-1';
import { assets } from '../../config/assets.js?build=cinematic-worlds-1';
import {
  deleteAccount, dismissAuthPrompt, getAccountState, requestPasswordReset,
  resolveConflict, setAuthView, signIn, signOut, signUp, syncNow, updatePassword
} from '../core/account.js';
import { requestParentGate } from '../core/parent-gate.js';

const shopItems=[
{id:'memory',type:'mode',icon:'🏛️',cost:120,de:'Palast-Memory',es:'Memoria del palacio',el:'Μνήμη του παλατιού'},
{id:'speed',type:'mode',icon:'⏱️',cost:160,de:'Goldene Minute',es:'Minuto dorado',el:'Χρυσό λεπτό'},
{id:'doubleXp',type:'booster',icon:'⚡',cost:60,de:'Doppelfortschritt',es:'Progreso doble',el:'Διπλή πρόοδος',en:'Double progress'},
{id:'hints',type:'booster',icon:'💡',cost:25,de:'Hinweis',es:'Pista',el:'Υπόδειξη'},
{id:'jumps',type:'booster',icon:'🚀',cost:35,de:'Startsprung',es:'Salto inicial',el:'Αρχικό άλμα'}
];
const milestones=[3,5,7,10,15,20,30];
const tr=(de,es,el=de,en=null)=>uiText(de,es,el,en);
const currencyIcon=(className='currency-shell')=>`<img class="${className}" src="${assets.rewards.currencyShell}" alt="">`;
const currencyAmount=(amount,prefix='')=>`<span class="currency-amount">${currencyIcon()}<span>${prefix}${amount}</span></span>`;
const cinematicBackground=src=>`<img class="cinematic-subpage-bg" src="${src}" alt="">`;
const shopArt=item=>item.type==='mode'
 ? `<img class="shop-mode-art" src="${assets.cards.modes[item.id]}" alt="">`
 : `<span>${item.icon}</span>`;
const milestoneChest=level=>level<=3
 ? assets.rewards.chests.bronze
 : level<=7
   ? assets.rewards.chests.silver
   : level<=15
     ? assets.rewards.chests.gold
     : assets.rewards.chests.jewel;
const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const syncLabels={
 guest:{de:'Nur auf diesem Gerät',es:'Solo en este dispositivo',el:'Μόνο σε αυτή τη συσκευή'},
 offline:{de:'Offline · lokal gespeichert',es:'Sin conexión · guardado localmente',el:'Εκτός σύνδεσης · τοπικά αποθηκευμένο'},
 pending:{de:'Wartet auf Synchronisierung',es:'Esperando sincronización',el:'Αναμονή συγχρονισμού'},
 syncing:{de:'Wird synchronisiert …',es:'Sincronizando…',el:'Συγχρονισμός…'},
 synced:{de:'Cloud-Sicherung aktuell',es:'Copia en la nube actualizada',el:'Το cloud είναι ενημερωμένο'},
 conflict:{de:'Auswahl erforderlich',es:'Se requiere una selección',el:'Απαιτείται επιλογή'},
 error:{de:'Cloud momentan nicht erreichbar',es:'Nube no disponible',el:'Το cloud δεν είναι διαθέσιμο'}
};
const syncLabel=status=>languageValue(syncLabels[status]||{de:status,es:status,el:status},sourceLanguage());
const formatCloudTime=value=>{
 if(!value)return tr('Noch nicht synchronisiert','Aún no sincronizado','Δεν έχει συγχρονιστεί');
 try{return new Intl.DateTimeFormat(undefined,{dateStyle:'short',timeStyle:'short'}).format(new Date(value))}catch{return value}
};

function conflictMarkup(account){
 if(!account.conflict)return '';
 const cloudTime=formatCloudTime(account.conflict.cloud?.updated_at);
 return `<section class="account-conflict" role="dialog" aria-modal="true" aria-labelledby="account-conflict-title"><div class="account-conflict-card"><span class="eyebrow">${tr('SYNCHRONISIERUNG','SINCRONIZACIÓN','ΣΥΓΧΡΟΝΙΣΜΟΣ')}</span><h2 id="account-conflict-title">${tr('Welcher Fortschritt soll bleiben?','¿Qué progreso quieres conservar?','Ποια πρόοδο θέλεις να κρατήσεις;')}</h2><p>${tr('Auf diesem Gerät und in der Cloud gibt es unterschiedliche Änderungen. Es wird nichts automatisch überschrieben.','Hay cambios diferentes en este dispositivo y en la nube. Nada se sobrescribirá automáticamente.','Υπάρχουν διαφορετικές αλλαγές στη συσκευή και στο cloud. Τίποτα δεν αντικαθίσταται αυτόματα.')}</p><button class="primary" data-action="resolve-sync-conflict" data-choice="local"><i class="ph-bold ph-device-mobile"></i> ${tr('Diesen Geräte-Stand verwenden','Usar el progreso de este dispositivo','Χρήση προόδου συσκευής')}</button><button class="secondary" data-action="resolve-sync-conflict" data-choice="cloud"><i class="ph-bold ph-cloud"></i> ${tr(`Cloud-Stand verwenden (${cloudTime})`,`Usar el progreso de la nube (${cloudTime})`,`Χρήση προόδου cloud (${cloudTime})`)}</button></div></section>`;
}

function accountMarkup(){
 const account=getAccountState(),busy=account.authStatus==='busy';
 if(!account.configured)return `<section class="account-card account-unconfigured"><div class="account-heading"><i class="ph-bold ph-cloud-slash"></i><div><small>${tr('OPTIONALE CLOUD-SICHERUNG','COPIA OPCIONAL EN LA NUBE','ΠΡΟΑΙΡΕΤΙΚΟ CLOUD')}</small><h2>${tr('Elternkonto noch nicht verbunden','Cuenta parental aún no conectada','Ο γονικός λογαριασμός δεν έχει συνδεθεί')}</h2></div></div><p>${tr('Der Fortschritt bleibt sicher auf diesem Gerät. Für Login und Gerätesynchronisierung müssen noch die Supabase-Werte eingerichtet werden.','El progreso permanece guardado en este dispositivo. Faltan los datos de Supabase para iniciar sesión y sincronizar.','Η πρόοδος παραμένει στη συσκευή. Απαιτείται ρύθμιση Supabase για σύνδεση και συγχρονισμό.')}</p></section>`;
 if(account.user){
  const guestSnapshot=getState().economy?.guestSnapshot;
  const guestNote=guestSnapshot
   ? `<p class="account-message">${tr(
      `${Number(guestSnapshot.shells||0)} Gast-Muscheln bleiben sicher auf diesem Gerät und werden nach der Abmeldung wiederhergestellt.`,
      `${Number(guestSnapshot.shells||0)} conchas de invitado permanecen seguras en este dispositivo y se restauran al cerrar sesión.`,
      `${Number(guestSnapshot.shells||0)} κοχύλια επισκέπτη παραμένουν ασφαλή σε αυτή τη συσκευή και επανέρχονται μετά την αποσύνδεση.`
    )}</p>`
   :'';
  return `<section class="account-card"><div class="account-heading"><i class="ph-bold ph-cloud-check"></i><div><small>${tr('ELTERNKONTO','CUENTA PARENTAL','ΓΟΝΙΚΟΣ ΛΟΓΑΡΙΑΣΜΟΣ')}</small><h2>${safe(account.user.email)}</h2></div></div><div class="sync-status sync-${account.syncStatus}"><i class="ph-bold ${account.syncStatus==='synced'?'ph-check-circle':account.syncStatus==='offline'?'ph-wifi-slash':'ph-arrows-clockwise'}"></i><div><strong>${syncLabel(account.syncStatus)}</strong><small>${formatCloudTime(account.lastSyncedAt)}</small></div></div>${guestNote}${account.message?`<p class="account-message">${safe(account.message)}</p>`:''}${account.error?`<p class="account-error">${safe(account.error)}</p>`:''}<button class="primary" data-action="sync-account-now" ${busy?'disabled':''}><i class="ph-bold ph-arrows-clockwise"></i> ${tr('Jetzt synchronisieren','Sincronizar ahora','Συγχρονισμός τώρα')}</button><button class="secondary" data-action="account-sign-out" ${busy?'disabled':''}>${tr('Abmelden','Cerrar sesión','Αποσύνδεση')}</button><button class="account-delete" data-action="account-delete" ${busy?'disabled':''}>${tr('Elternkonto und Cloud-Daten löschen','Eliminar cuenta y datos de la nube','Διαγραφή λογαριασμού και δεδομένων cloud')}</button></section>${conflictMarkup(account)}`;
 }

 const tabs=`<div class="account-tabs"><button class="${account.authView==='signin'?'active':''}" data-action="account-auth-view" data-view="signin">${tr('Anmelden','Entrar','Σύνδεση')}</button><button class="${account.authView==='signup'?'active':''}" data-action="account-auth-view" data-view="signup">${tr('Konto erstellen','Crear cuenta','Δημιουργία λογαριασμού')}</button></div>`;
 let form='';
 if(account.authView==='reset')form=`<label><span>${tr('Eltern-E-Mail','Correo del adulto','Email γονέα')}</span><input type="email" data-account-email autocomplete="email"></label><button class="primary" data-action="account-reset-password" ${busy?'disabled':''}>${tr('Link senden','Enviar enlace','Αποστολή συνδέσμου')}</button><button class="text-button" data-action="account-auth-view" data-view="signin">${tr('Zur Anmeldung','Volver al inicio','Πίσω στη σύνδεση')}</button>`;
 else if(account.authView==='recovery'||account.recovery)form=`<label><span>${tr('Neues Passwort','Nueva contraseña','Νέος κωδικός')}</span><input type="password" data-account-password autocomplete="new-password" minlength="8"></label><button class="primary" data-action="account-update-password" ${busy?'disabled':''}>${tr('Neues Passwort speichern','Guardar nueva contraseña','Αποθήκευση νέου κωδικού')}</button>`;
 else form=`${tabs}<label><span>${tr('Eltern-E-Mail','Correo del adulto','Email γονέα')}</span><input type="email" data-account-email autocomplete="email"></label><label><span>${tr('Passwort (mindestens 8 Zeichen)','Contraseña (mínimo 8 caracteres)','Κωδικός (τουλάχιστον 8 χαρακτήρες)')}</span><input type="password" data-account-password autocomplete="${account.authView==='signup'?'new-password':'current-password'}" minlength="8"></label><button class="primary" data-action="account-submit" data-mode="${account.authView}" ${busy?'disabled':''}>${account.authView==='signup'?tr('Elternkonto erstellen','Crear cuenta parental','Δημιουργία γονικού λογαριασμού'):tr('Anmelden und sichern','Entrar y guardar','Σύνδεση και αποθήκευση')}</button>${account.authView==='signin'?`<button class="text-button" data-action="account-auth-view" data-view="reset">${tr('Passwort vergessen?','¿Olvidaste la contraseña?','Ξέχασες τον κωδικό;')}</button>`:''}`;
 return `<section class="account-card"><div class="account-heading"><i class="ph-bold ph-cloud-arrow-up"></i><div><small>${tr('OPTIONALE CLOUD-SICHERUNG','COPIA OPCIONAL EN LA NUBE','ΠΡΟΑΙΡΕΤΙΚΟ CLOUD')}</small><h2>${tr('Fortschritt mit Elternkonto sichern','Guardar progreso con cuenta parental','Αποθήκευση προόδου με γονικό λογαριασμό')}</h2></div></div><p>${tr('Ohne Anmeldung bleibt alles auf diesem Gerät spielbar. Mit Konto wird derselbe Stand zusätzlich in der Cloud gesichert.','Sin iniciar sesión, todo sigue disponible en este dispositivo. Con una cuenta, el progreso también se guarda en la nube.','Χωρίς σύνδεση όλα λειτουργούν στη συσκευή. Με λογαριασμό η πρόοδος αποθηκεύεται και στο cloud.')}</p>${account.message?`<p class="account-message">${safe(account.message)}</p>`:''}${account.error?`<p class="account-error">${safe(account.error)}</p>`:''}<div class="account-form">${form}</div></section>`;
}

function realMoneyShopMarkup(){
 const account=getAccountState(),economy=getEconomyState();
 if(!isNativeCommerce())return `<section class="mobile-shop-note"><i class="ph-bold ph-device-mobile"></i><div><strong>${tr('Muschelkäufe gibt es nur in der App','Las compras de conchas solo están en la app','Οι αγορές κοχυλιών είναι μόνο στην εφαρμογή')}</strong><small>${tr('Diese Browser-Version enthält weder Echtgeldkäufe noch Werbung.','Esta versión web no contiene compras ni publicidad.','Η έκδοση ιστού δεν περιέχει αγορές ή διαφημίσεις.')}</small></div></section>`;
 if(!account.user)return `<section class="real-money-section parent-account-required"><span class="eyebrow">${tr('ELTERNBEREICH','ZONA DE PADRES','ΠΕΡΙΟΧΗ ΓΟΝΕΩΝ')}</span><h2>${tr('Elternkonto erforderlich','Se necesita una cuenta parental','Απαιτείται γονικός λογαριασμός')}</h2><p>${tr('Echte Käufe und freiwillige Werbung werden erst nach Anmeldung eines Erwachsenen aktiviert.','Las compras y los anuncios voluntarios se activan después del inicio de sesión de un adulto.','Οι αγορές και οι προαιρετικές διαφημίσεις ενεργοποιούνται μετά τη σύνδεση ενήλικα.')}</p><button class="primary" data-action="open-settings">${tr('Elternkonto öffnen','Abrir cuenta parental','Άνοιγμα γονικού λογαριασμού')}</button></section>`;

 const products=economy.products||[];
 const adsEnabled=economy.platform==='ios'
  ?Boolean(economy.config.ios_rewarded_ads_enabled)
  :Boolean(economy.config.android_rewarded_ads_enabled);
 return `<section class="real-money-section"><div class="section-head"><div><span class="eyebrow">${tr('FÜR ERWACHSENE','PARA ADULTOS','ΓΙΑ ΕΝΗΛΙΚΕΣ')}</span><h2>${tr('Muscheln kaufen','Comprar conchas','Αγορά κοχυλιών')}</h2></div></div><p class="commercial-note">${tr('Echte Zahlung über deinen App Store. Gekaufte Muscheln verfallen nicht.','Pago real mediante tu tienda de aplicaciones. Las conchas compradas no caducan.','Πραγματική πληρωμή μέσω του καταστήματος. Τα αγορασμένα κοχύλια δεν λήγουν.')}</p><div class="shell-product-grid">${products.length?products.map(product=>`<article class="shell-product"><img src="${assets.rewards.currencyShell}" alt=""><strong>${product.shells} ${tr('Muscheln','Conchas','Κοχύλια')}</strong><button data-action="purchase-shells" data-product="${product.id}">${safe(product.displayPrice)}</button></article>`).join(''):`<p class="shop-unavailable">${tr('Store-Produkte werden geladen oder sind momentan nicht verfügbar.','Los productos se están cargando o no están disponibles.','Τα προϊόντα φορτώνονται ή δεν είναι διαθέσιμα.')}</p>`}</div><button class="text-button store-sync-button" data-action="sync-store-purchases"><i class="ph-bold ph-arrows-clockwise"></i> ${tr('Käufe synchronisieren','Sincronizar compras','Συγχρονισμός αγορών')}</button></section>
 <section class="real-money-section rewarded-section"><div class="section-head"><div><span class="eyebrow">${tr('FREIWILLIG','VOLUNTARIO','ΠΡΟΑΙΡΕΤΙΚΑ')}</span><h2>${tr('Muscheln verdienen','Ganar conchas','Κέρδισε κοχύλια')}</h2></div></div>${adsEnabled?`<p>${tr('Sieh freiwillig eine altersgerechte, nicht personalisierte Werbung und erhalte 15 Muscheln. Höchstens dreimal in 24 Stunden.','Mira voluntariamente un anuncio apropiado y no personalizado para recibir 15 conchas. Máximo tres veces en 24 horas.','Δες προαιρετικά μια κατάλληλη, μη εξατομικευμένη διαφήμιση και πάρε 15 κοχύλια. Έως τρεις φορές σε 24 ώρες.')}</p><div class="rewarded-value">${currencyAmount(15,'+')}<small>${economy.adRemaining} ${tr('von 3 heute verfügbar','de 3 disponibles hoy','από 3 διαθέσιμα σήμερα')}</small></div><button class="primary" data-action="watch-rewarded-ad" ${economy.adRemaining<=0?'disabled':''}><i class="ph-bold ph-play-circle"></i> ${tr('Freiwillige Werbung ansehen','Ver anuncio voluntario','Προβολή προαιρετικής διαφήμισης')}</button>`:`<p class="shop-unavailable">${tr('Altersgerechte Werbung ist auf diesem Gerät derzeit deaktiviert.','Los anuncios apropiados están desactivados en este dispositivo.','Οι κατάλληλες διαφημίσεις είναι απενεργοποιημένες σε αυτή τη συσκευή.')}</p>`}</section>`;
}

export function renderShop({top,nav}){
 const s=getState(),source=sourceLanguage();
 return `<div class="v3-shell page cinematic-subpage cinematic-shop">${cinematicBackground(assets.backgrounds.cinematic.shop)}${top()}<section class="shop-hero-v3"><img class="shop-hero-chest" src="${assets.rewards.chests.jewel}" alt=""><div><span class="eyebrow">${tr('MUSCHEL-BOUTIQUE','BOUTIQUE DE CONCHAS','ΚΑΤΑΣΤΗΜΑ ΚΟΧΥΛΙΩΝ')}</span><h1>${tr('Besondere Schätze','Tesoros especiales','Ξεχωριστοί θησαυροι')}</h1><p>${tr('Spielen, verdienen oder im geschützten Elternbereich kaufen.','Juega, gana o compra en la zona parental protegida.','Παίξε, κέρδισε ή αγόρασε στη γονική περιοχή.')}</p></div></section><section class="wallet-card"><img class="reward-art" src="${assets.rewards.currencyShell}" alt=""><div><strong>${s.progress.shells}</strong><small>${tr('verfügbare Muscheln','conchas disponibles','διαθέσιμα κοχύλια')}</small></div></section>${realMoneyShopMarkup()}<section class="shop-section"><div class="section-head"><div><span class="eyebrow">${tr('MIT MUSCHELN','CON CONCHAS','ΜΕ ΚΟΧΥΛΙΑ')}</span><h2>${tr('Schätze freischalten','Desbloquear tesoros','Ξεκλείδωσε θησαυρούς')}</h2></div></div>${shopItems.map(item=>{const owned=item.type==='mode'&&s.inventory.unlockedModes.includes(item.id);const count=item.type==='booster'?s.inventory.boosters[item.id]||0:0;return `<article class="shop-card-v3 ${owned?'owned':''}">${shopArt(item)}<div><strong>${languageValue(item,source)}</strong><small>${item.type==='mode'?tr('Neuen Spielmodus freischalten','Desbloquear un modo nuevo','Ξεκλείδωσε νέο παιχνίδι'):tr('Für kommende Aufgaben','Para próximas tareas','Για επόμενες ασκήσεις')}</small>${count?`<em>${tr('Vorrat','Inventario','Απόθεμα')}: ${count}</em>`:''}</div><button data-action="buy-item" data-item="${item.id}" ${owned?'disabled':''}>${owned?'✓':currencyAmount(item.cost)}</button></article>`}).join('')}</section></div>${nav('shop')}`;
}

export function renderProfile({top,nav,progressCard}){const s=getState(),lv=levelFromXp(s.progress.xp),stars=totalMasterStars(s);return `<div class="v3-shell page cinematic-subpage cinematic-profile">${cinematicBackground(assets.backgrounds.cinematic.profile)}${top()}<section class="profile-hero-v3"><img src="${assets.characters.tula.poses.profile}" alt="Tula"><h1>${s.profile.name||tr('Inselentdecker','Explorador','Εξερευνητής')}</h1><strong>${tr('Level','Nivel','Επίπεδο')} ${lv} · ${stars} ${tr('Meistersterne','estrellas maestras','αστέρια δεξιοτεχνίας','mastery stars')}</strong><button class="profile-settings-link" data-action="navigate" data-route="child-profile">${tr('Kinderprofil anpassen','Ajustar perfil infantil','Ρύθμιση παιδικού προφίλ')}</button><button class="profile-settings-link" data-action="navigate" data-route="language-select"><i class="ph-bold ph-translate" aria-hidden="true"></i> ${tr('Sprachpaar ändern','Cambiar idiomas','Αλλαγή γλωσσών')}</button></section>${progressCard()}<section class="profile-stats"><div><img class="reward-art" src="${assets.rewards.streak}" alt=""><strong>${s.progress.streak}</strong><small>${tr('Lerntage','Días','Ημέρες')}</small></div><div><img class="reward-art" src="${assets.rewards.currencyShell}" alt=""><strong>${s.progress.shells}</strong><small>${tr('Muscheln','Conchas','Κοχύλια')}</small></div><div><img class="reward-art" src="${assets.rewards.xpStar}" alt=""><strong>${stars}</strong><small>${tr('Meistersterne','estrellas maestras','αστέρια δεξιοτεχνίας','mastery stars')}</small></div></section><section class="milestone-list"><div class="section-head"><div><h2>${tr('Deine nächsten Schätze','Tus próximos tesoros','Οι επόμενοι θησαυροί σου')}</h2></div></div>${milestones.map(level=>{const reached=lv>=level,claimed=s.inventory.claimedMilestones.includes(level),focused=Number(s.session.focusMilestone)===level,claimReady=reached&&!claimed;return `<article class="milestone-card ${reached?'reached':''} ${claimReady?'claim-ready':''} ${focused?'milestone-focus':''}" data-milestone="${level}"><img class="milestone-chest" src="${milestoneChest(level)}" alt=""><div><small>LEVEL ${level}</small><strong>${tr('Meilenstein-Belohnung','Recompensa de nivel','Ανταμοιβή επιπέδου')}</strong><em>${currencyAmount(level*10,'+')}</em></div>${claimed?'<b><i class="ph-bold ph-check" aria-hidden="true"></i></b>':reached?`<button data-action="claim-milestone" data-level="${level}">${tr('Jetzt abholen','Recoger ahora','Πάρε τώρα','Claim now')}</button>`:'<b><i class="ph-bold ph-lock" aria-hidden="true"></i></b>'}</article>`}).join('')}</section><button class="secondary" data-action="open-settings"><i class="ph-bold ph-gear" aria-hidden="true"></i> ${tr('Eltern & Einstellungen','Padres y ajustes','Γονείς και ρυθμίσεις')}</button></div>${nav('profile')}`}

export function renderSettings({top,nav}){
 const s=getState();
 return `<div class="v3-shell page cinematic-subpage cinematic-profile">${cinematicBackground(assets.backgrounds.cinematic.profile)}${top('profile')}<section class="page-title"><span class="eyebrow">${tr('ELTERNBEREICH','ZONA DE PADRES','ΠΕΡΙΟΧΗ ΓΟΝΕΩΝ')}</span><h1>${tr('Lernumgebung','Entorno de aprendizaje','Περιβάλλον μάθησης')}</h1></section><section class="parent-summary"><div><strong>${levelFromXp(s.progress.xp)}</strong><small>${tr('Level','Nivel','Επίπεδο')}</small></div><div><strong>${s.progress.xp}</strong><small>XP</small></div><div><strong>${Math.min(3,s.progress.daily)}/3</strong><small>${tr('Tagesziel','Meta diaria','Ημερήσιος στόχος')}</small></div></section>${accountMarkup()}<section class="audience-setting"><strong>${tr('Wer nutzt dieses Profil?','¿Quién usa este perfil?','Ποιος χρησιμοποιεί αυτό το προφίλ;')}</strong><p>${tr('Es wird kein Geburtsdatum gespeichert. Kinderprofile erhalten immer die strengste Werbe- und Datenschutzbehandlung.','No se guarda ninguna fecha de nacimiento. Los perfiles infantiles reciben la protección más estricta.','Δεν αποθηκεύεται ημερομηνία γέννησης. Τα παιδικά προφίλ έχουν τη μέγιστη προστασία.')}</p><div><button class="${s.profile.audience!=='adult'?'active':''}" data-action="set-audience" data-audience="child">${tr('Kinderprofil','Perfil infantil','Παιδικό προφίλ')}</button><button class="${s.profile.audience==='adult'?'active':''}" data-action="set-audience" data-audience="adult">${tr('Erwachsener','Adulto','Ενήλικας')}</button></div></section><label class="setting-row"><span><i class="ph-bold ph-speaker-high" aria-hidden="true"></i> <b>${tr('Audio und Sprache','Audio y voz','Ήχος και φωνή')}</b></span><input type="checkbox" data-action="toggle-setting" data-setting="sound" ${s.settings.sound?'checked':''}></label><label class="setting-row"><span><i class="ph-bold ph-sparkle" aria-hidden="true"></i> <b>${tr('Animationen','Animaciones','Κινήσεις')}</b></span><input type="checkbox" data-action="toggle-setting" data-setting="motion" ${s.settings.motion?'checked':''}></label><section class="parent-note"><strong>${tr('Elternhinweis','Nota para padres','Σημείωση για γονείς')}</strong><p>${tr('Lernfortschritt wird lokal und mit Elternkonto zusätzlich in der Cloud gesichert. Echtgeldkäufe verwenden ausschließlich den App Store; Werbung ist freiwillig und nicht personalisiert.','El progreso se guarda localmente y, con cuenta parental, también en la nube. Las compras usan solo la tienda y los anuncios son voluntarios.','Η πρόοδος αποθηκεύεται τοπικά και στο cloud με γονικό λογαριασμό. Οι αγορές γίνονται μόνο μέσω του καταστήματος και οι διαφημίσεις είναι προαιρετικές.')}</p></section><button class="danger-soft" data-action="reset-progress">${tr('Testfortschritt zurücksetzen','Restablecer progreso','Επαναφορά προόδου')}</button></div>${nav('profile')}`;
}

export function registerProgressionActions(router){
 registerAction('buy-item',async({data})=>{const item=shopItems.find(x=>x.id===data.item);if(!item)return;const result=await spendEconomyShells(`${item.type}:${item.id}`,item.cost);if(!result.ok)return alert(tr('Nicht genug Muscheln oder der Shop ist gerade nicht erreichbar.','No hay suficientes conchas o la tienda no está disponible.','Δεν υπάρχουν αρκετά κοχύλια ή το κατάστημα δεν είναι διαθέσιμο.'));if(item.type==='mode')setState(d=>{if(!d.inventory.unlockedModes.includes(item.id))d.inventory.unlockedModes.push(item.id);return d});else setState(d=>{if(result.local)d.inventory.boosters[item.id]=(d.inventory.boosters[item.id]||0)+1;return d});router.renderCurrent()});
 registerAction('claim-milestone',({data})=>{const level=Number(data.level),s=getState();if(levelFromXp(s.progress.xp)<level||s.inventory.claimedMilestones.includes(level))return;setState(d=>{d.inventory.claimedMilestones.push(level);d.progress.shells+=level*10;d.session.focusMilestone=null;d.session.rewardNotices=(d.session.rewardNotices||[]).filter(notice=>notice.type!=='level'||notice.level!==level);return d});creditGameplayShells(level*10,'level-milestone',`level-${level}`).catch(()=>{});router.renderCurrent()});
 registerAction('open-settings',()=>router.navigate('settings'));
 registerAction('toggle-setting',({target,data})=>{setState(d=>{d.settings[data.setting]=Boolean(target.checked);return d})});
 registerAction('set-audience',({data})=>{setState(d=>{d.profile.audience=data.audience==='adult'?'adult':'child';return d});router.renderCurrent()});
 registerAction('reset-progress',()=>{if(confirm(tr('Fortschritt wirklich zurücksetzen?','¿Restablecer el progreso?','Θέλεις πραγματικά να επαναφέρεις την πρόοδο;'))){resetState();router.navigate('home')}});
 registerAction('account-auth-view',({data})=>{setAuthView(data.view);router.renderCurrent()});
 registerAction('account-submit',async({data})=>{
   const email=document.querySelector('[data-account-email]')?.value.trim()||'';
   const password=document.querySelector('[data-account-password]')?.value||'';
   if(!email||password.length<8){alert(tr('Bitte gib eine gültige E-Mail und ein Passwort mit mindestens 8 Zeichen ein.','Introduce un correo válido y una contraseña de al menos 8 caracteres.','Βάλε έγκυρο email και κωδικό τουλάχιστον 8 χαρακτήρων.'));return}
   if(data.mode==='signup')await signUp(email,password);else await signIn(email,password);
   router.renderCurrent();
 });
 registerAction('account-reset-password',async()=>{
   const email=document.querySelector('[data-account-email]')?.value.trim()||'';
   if(!email){alert(tr('Bitte gib deine Eltern-E-Mail ein.','Introduce el correo del adulto.','Βάλε το email του γονέα.'));return}
   await requestPasswordReset(email);router.renderCurrent();
 });
 registerAction('account-update-password',async()=>{
   const password=document.querySelector('[data-account-password]')?.value||'';
   if(password.length<8){alert(tr('Das Passwort braucht mindestens 8 Zeichen.','La contraseña necesita al menos 8 caracteres.','Ο κωδικός χρειάζεται τουλάχιστον 8 χαρακτήρες.'));return}
   await updatePassword(password);router.renderCurrent();
 });
 registerAction('sync-account-now',async()=>{await syncNow();router.renderCurrent()});
 registerAction('account-sign-out',async()=>{await signOut();router.renderCurrent()});
 registerAction('account-delete',async()=>{
   if(!confirm(tr('Elternkonto und alle Cloud-Daten wirklich löschen? Der Fortschritt auf diesem Gerät bleibt erhalten.','¿Eliminar la cuenta y todos los datos de la nube? El progreso de este dispositivo se conservará.','Να διαγραφεί ο λογαριασμός και όλα τα δεδομένα cloud; Η πρόοδος στη συσκευή θα παραμείνει.')))return;
   await deleteAccount();router.renderCurrent();
 });
 registerAction('resolve-sync-conflict',async({data})=>{await resolveConflict(data.choice);router.renderCurrent()});
 registerAction('continue-without-account',()=>dismissAuthPrompt());
 registerAction('open-account-settings',()=>{dismissAuthPrompt();router.navigate('settings')});
 registerAction('purchase-shells',async({data})=>{
   if(!await requestParentGate('purchase'))return;
   try{const result=await purchaseShells(data.product);alert(result.pending?tr('Der Kauf wartet auf Bestätigung.','La compra está pendiente.','Η αγορά εκκρεμεί.'):tr('Die Muscheln wurden gutgeschrieben.','Las conchas fueron añadidas.','Τα κοχύλια προστέθηκαν.'))}catch(error){if(error.code!=='purchase_cancelled')alert(tr('Der Kauf konnte nicht abgeschlossen werden.','No se pudo completar la compra.','Η αγορά δεν ολοκληρώθηκε.'))}router.renderCurrent();
 });
 registerAction('sync-store-purchases',async()=>{if(!await requestParentGate('purchase'))return;try{await syncPurchases();alert(tr('Käufe wurden synchronisiert.','Las compras se sincronizaron.','Οι αγορές συγχρονίστηκαν.'))}catch{alert(tr('Die Synchronisierung ist momentan nicht möglich.','La sincronización no está disponible.','Ο συγχρονισμός δεν είναι διαθέσιμος.'))}router.renderCurrent()});
 registerAction('watch-rewarded-ad',async()=>{
   const audience=getState().profile.audience==='adult'?'adult':'child';
   if(audience==='child'&&!await requestParentGate('ad',{force:true}))return;
   try{const result=await requestRewardedAd(audience);if(result.credited)alert(tr('15 Muscheln wurden gutgeschrieben.','Se añadieron 15 conchas.','Προστέθηκαν 15 κοχύλια.'))}catch(error){alert(error.message==='ad_daily_limit'?tr('Das Limit von drei Werbungen in 24 Stunden ist erreicht.','Se alcanzó el límite de tres anuncios en 24 horas.','Έφτασες το όριο τριών διαφημίσεων σε 24 ώρες.'):tr('Momentan ist keine geeignete Werbung verfügbar.','No hay un anuncio apropiado disponible.','Δεν υπάρχει κατάλληλη διαφήμιση τώρα.'))}router.renderCurrent();
 });
}
