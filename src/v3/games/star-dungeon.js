import { collections } from '../content-multilingual.js';
import {
  getState, setState, registerAction, speak, grantReward,
  sourceLanguage, targetLanguage, languageMeta, languageValue, uiText,
  questStars, worldStarTotal, dungeonStatus, recordDungeonCompletion,
  DUNGEON_UNLOCK_STARS, DUNGEON_SECRET_STARS, DUNGEON_GOLD_STARS,
} from '../core/index.js?build=master-stars-1';
import { profileConfig } from '../screens/child-profile.js?build=cinematic-worlds-1';
import { assets } from '../../config/assets.js?build=cinematic-worlds-1';

const tr = (de, es, el = de, en = null) => uiText(de, es, el, en);
const shuffle = list => [...list].sort(() => Math.random() - .5);
const world = id => collections.find(item => item.id === id) || collections[0];
const currentWorld = () => world(getState().session.collectionId);

let dungeon = null;

function starImages(earned, total = 3) {
  return `<span class="master-star-strip" aria-label="${earned} ${tr(`von ${total} Meistersternen`, `de ${total} estrellas maestras`, `από ${total} αστέρια δεξιοτεχνίας`, `of ${total} mastery stars`)}">${Array.from({ length: total }, (_, index) => `<img class="${index < earned ? 'earned' : ''}" src="${assets.rewards.xpStar}" alt="">`).join('')}</span>`;
}

export function renderQuestStarBadge(worldId, questId) {
  return `<span class="quest-star-badge">${starImages(questStars(worldId, questId))}</span>`;
}

export function renderStarGate(current) {
  const status = dungeonStatus(current.id);
  const remaining = Math.max(0, DUNGEON_UNLOCK_STARS - status.stars);
  const title = status.unlocked
    ? tr('Das Sternentor ist offen', 'El portal estelar está abierto', 'Η πύλη των αστεριών είναι ανοιχτή', 'The Star Gate is open')
    : tr('Das Sternentor schläft noch', 'El portal estelar aún duerme', 'Η πύλη των αστεριών κοιμάται ακόμη', 'The Star Gate is still sleeping');
  const detail = status.unlocked
    ? tr('Drei Kammern und ein Wächter warten auf dich.', 'Tres cámaras y un guardián te esperan.', 'Τρεις αίθουσες και ένας φύλακας σε περιμένουν.', 'Three chambers and a guardian are waiting for you.')
    : tr(`Sammle noch ${remaining} Meistersterne in dieser Lernwelt.`, `Consigue ${remaining} estrellas maestras más en este mundo.`, `Μάζεψε ακόμη ${remaining} αστέρια δεξιοτεχνίας σε αυτόν τον κόσμο.`, `Earn ${remaining} more mastery stars in this world.`);
  return `<section class="star-gate ${status.unlocked ? 'is-open' : 'is-locked'}" aria-label="${tr('Sternen-Dungeon', 'Mazmorra estelar', 'Μπουντρούμι των αστεριών', 'Star Dungeon')}"><div class="star-gate-art"><img src="${assets.rewards.xpStar}" alt=""><i class="ph-bold ${status.unlocked ? 'ph-door-open' : 'ph-lock-key'}" aria-hidden="true"></i></div><div class="star-gate-copy"><h2>${title}</h2><p>${detail}</p><div class="star-gate-progress"><span><strong>${status.stars}</strong>/9</span><span class="star-gate-track" role="progressbar" aria-valuemin="0" aria-valuemax="9" aria-valuenow="${status.stars}"><i style="width:${status.stars / 9 * 100}%"></i></span></div><div class="star-gate-secrets"><span class="${status.stars >= DUNGEON_SECRET_STARS ? 'earned' : ''}"><i class="ph-bold ph-treasure-chest" aria-hidden="true"></i> 8</span><span class="${status.stars >= DUNGEON_GOLD_STARS ? 'earned' : ''}"><i class="ph-bold ph-seal-check" aria-hidden="true"></i> 9</span></div></div><button data-action="open-star-dungeon" data-world="${current.id}">${status.unlocked ? tr('Dungeon betreten', 'Entrar en la mazmorra', 'Μπες στο μπουντρούμι', 'Enter dungeon') : tr('Noch verschlossen', 'Aún cerrado', 'Ακόμη κλειστό', 'Still locked')}<i class="ph-bold ${status.unlocked ? 'ph-arrow-right' : 'ph-lock'}" aria-hidden="true"></i></button></section>`;
}

function weakestWords(current) {
  const mastery = getState().progress.mastery || {};
  return [...current.words].sort((left, right) => {
    const leftScore = Number(mastery[left.id]?.right || 0) - Number(mastery[left.id]?.wrong || 0);
    const rightScore = Number(mastery[right.id]?.right || 0) - Number(mastery[right.id]?.wrong || 0);
    return leftScore - rightScore;
  });
}

function startDungeon(worldId) {
  const current = world(worldId);
  const cfg = profileConfig();
  const pool = weakestWords(current);
  const echoItems = shuffle(pool).slice(0, 3);
  const runeLength = cfg.answers <= 2 ? 2 : 3;
  const runeWords = shuffle(pool).slice(0, runeLength * 2);
  const runeRounds = [0, 1].map(index => runeWords.slice(index * runeLength, (index + 1) * runeLength));
  const guardianItems = weakestWords(current).slice(0, 3);
  dungeon = {
    worldId: current.id,
    phase: 'echo',
    echoItems,
    echoStep: 0,
    runeRounds,
    runeStep: 0,
    runeBuilt: [],
    guardianItems,
    guardianStep: 0,
    attempted: false,
    firstTryCorrect: 0,
    totalChecks: echoItems.length + runeRounds.length + guardianItems.length,
    feedback: '',
    finished: false,
    reward: null,
  };
}

function progressValue() {
  if (!dungeon) return 0;
  const completed = dungeon.echoStep + dungeon.runeStep + dungeon.guardianStep;
  return Math.round(completed / dungeon.totalChecks * 100);
}

function dungeonTop(top, chamber) {
  return `${top('world')}<section class="dungeon-run-head"><button data-action="leave-star-dungeon" aria-label="${tr('Dungeon verlassen', 'Salir de la mazmorra', 'Έξοδος από το μπουντρούμι', 'Leave dungeon')}"><i class="ph-bold ph-x" aria-hidden="true"></i></button><div><strong>${chamber}</strong><span role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressValue()}"><i style="width:${progressValue()}%"></i></span></div><b>${worldStarTotal(dungeon.worldId)}/9</b></section>`;
}

function dungeonShell(top, body, className = '') {
  const current = world(dungeon.worldId);
  return `<div class="v3-shell page star-dungeon-page ${className}"><img class="star-dungeon-bg" src="${assets.backgrounds.worlds[current.id]}" alt="">${body}</div>`;
}

function answerOptions(current, correct, count) {
  return shuffle([correct, ...shuffle(current.words.filter(word => word.id !== correct.id)).slice(0, Math.max(1, count - 1))]);
}

function echoRoute(top) {
  const current = world(dungeon.worldId);
  const item = dungeon.echoItems[dungeon.echoStep];
  if (!item) {
    dungeon.phase = 'rune';
    dungeon.attempted = false;
    dungeon.feedback = '';
    return runeRoute(top);
  }
  const cfg = profileConfig();
  const target = targetLanguage();
  const source = sourceLanguage();
  const options = answerOptions(current, item, cfg.answers);
  setTimeout(() => speak(languageValue(item, target), languageMeta(target).voice, { rate: .72 }), 100);
  return dungeonShell(top, `${dungeonTop(top, tr('Echohöhle', 'Cueva del eco', 'Σπηλιά της ηχούς', 'Echo Cave'))}<section class="dungeon-stage" data-question-id="${item.id}"><img class="dungeon-tula" src="${assets.characters.tula.poses.listening}" alt="Tula"><div class="dungeon-stage-copy"><h1>${tr('Folge dem Echo', 'Sigue el eco', 'Ακολούθησε την ηχώ', 'Follow the echo')}</h1><p>${tr('Welches Bild gehört zum gehörten Wort?', '¿Qué imagen corresponde a la palabra?', 'Ποια εικόνα ταιριάζει στη λέξη;', 'Which picture matches the word?')}</p><button data-action="dungeon-repeat"><i class="ph-bold ph-speaker-high" aria-hidden="true"></i>${tr('Echo anhören', 'Escuchar eco', 'Άκου την ηχώ', 'Play echo')}</button></div></section>${dungeon.feedback ? `<p class="dungeon-feedback" role="status">${dungeon.feedback}</p>` : ''}<section class="dungeon-answer-grid">${options.map(word => `<button data-action="dungeon-echo-answer" data-word="${word.id}"><span>${word.emoji}</span><strong>${languageValue(word, source)}</strong></button>`).join('')}</section>`, 'dungeon-echo');
}

function runeRoute(top) {
  const round = dungeon.runeRounds[dungeon.runeStep];
  if (!round?.length) {
    dungeon.phase = 'guardian';
    dungeon.attempted = false;
    dungeon.feedback = '';
    return guardianRoute(top);
  }
  const source = sourceLanguage();
  const target = targetLanguage();
  const built = new Set(dungeon.runeBuilt);
  return dungeonShell(top, `${dungeonTop(top, tr('Runenbrücke', 'Puente de runas', 'Γέφυρα των ρούνων', 'Rune Bridge'))}<section class="dungeon-stage rune-stage"><img class="dungeon-tula" src="${assets.characters.tula.poses.thinking}" alt="Tula"><div class="dungeon-stage-copy"><h1>${tr('Baue die Brücke', 'Construye el puente', 'Χτίσε τη γέφυρα', 'Build the bridge')}</h1><p>${tr('Tippe die Übersetzungen in derselben Reihenfolge an.', 'Toca las traducciones en el mismo orden.', 'Πάτησε τις μεταφράσεις με την ίδια σειρά.', 'Tap the translations in the same order.')}</p></div></section><section class="rune-prompt">${round.map(word => `<span data-word-id="${word.id}"><b>${word.emoji}</b>${languageValue(word, source)}</span>`).join('<i class="ph-bold ph-arrow-right" aria-hidden="true"></i>')}</section><section class="rune-bridge-built">${dungeon.runeBuilt.length ? dungeon.runeBuilt.map(id => { const word = round.find(item => item.id === id); return `<button data-action="dungeon-rune-toggle" data-word="${word.id}">${languageValue(word, target)}</button>`; }).join('') : `<p>${tr('Deine Runen erscheinen hier.', 'Tus runas aparecerán aquí.', 'Οι ρούνοι σου θα εμφανιστούν εδώ.', 'Your runes will appear here.')}</p>`}</section>${dungeon.feedback ? `<p class="dungeon-feedback" role="status">${dungeon.feedback}</p>` : ''}<section class="rune-bank">${shuffle(round).filter(word => !built.has(word.id)).map(word => `<button data-action="dungeon-rune-toggle" data-word="${word.id}" data-word-id="${word.id}">${languageValue(word, target)}</button>`).join('')}</section><button class="primary dungeon-check" data-action="dungeon-rune-check" ${dungeon.runeBuilt.length !== round.length ? 'disabled' : ''}>${tr('Brücke prüfen', 'Comprobar puente', 'Έλεγχος γέφυρας', 'Check bridge')}<i class="ph-bold ph-check" aria-hidden="true"></i></button>`, 'dungeon-rune');
}

function guardianRoute(top) {
  const current = world(dungeon.worldId);
  const item = dungeon.guardianItems[dungeon.guardianStep];
  if (!item) {
    dungeon.phase = 'complete';
    return completeRoute(top);
  }
  const cfg = profileConfig();
  const source = sourceLanguage();
  const target = targetLanguage();
  const options = answerOptions(current, item, cfg.answers);
  return dungeonShell(top, `${dungeonTop(top, tr('Wächterkammer', 'Cámara del guardián', 'Αίθουσα του φύλακα', 'Guardian Chamber'))}<section class="guardian-stage" data-question-id="${item.id}"><img class="guardian-tula" src="${assets.characters.tula.poses.surprised}" alt="Tula"><div class="guardian-seal"><i class="ph-bold ph-shield-star" aria-hidden="true"></i></div><h1>${tr('Der Gartenwächter fragt', 'El guardián pregunta', 'Ο φύλακας ρωτά', 'The guardian asks')}</h1><strong>${languageValue(item, source)}</strong><p>${tr('Wähle die richtige Übersetzung.', 'Elige la traducción correcta.', 'Διάλεξε τη σωστή μετάφραση.', 'Choose the correct translation.')}</p></section>${dungeon.feedback ? `<p class="dungeon-feedback" role="status">${dungeon.feedback}</p>` : ''}<section class="guardian-options">${options.map(word => `<button data-action="dungeon-guardian-answer" data-word="${word.id}">${languageValue(word, target)}</button>`).join('')}</section>`, 'dungeon-guardian');
}

function completeRoute(top) {
  if (!dungeon.finished) {
    dungeon.finished = true;
    const score = dungeon.totalChecks ? Math.round(dungeon.firstTryCorrect / dungeon.totalChecks * 100) : 0;
    const completion = recordDungeonCompletion(dungeon.worldId, score);
    const reward = completion.ok
      ? grantReward({
        xp: completion.xp,
        shells: completion.shells,
        countDaily: completion.xp > 0,
        reason: 'star-dungeon',
        idempotencyKey: completion.idempotencyKey,
      })
      : { xp: 0, shells: 0 };
    dungeon.reward = { ...completion, ...reward, score };
  }
  const current = world(dungeon.worldId);
  const reward = dungeon.reward;
  const relicName = current.id === 'garden'
    ? tr('Sternensamen des Gartens', 'Semilla estelar del jardín', 'Αστερόσπορος του κήπου', 'Garden Star Seed')
    : tr(`Sternenrelikt: ${languageValue(current, sourceLanguage())}`, `Reliquia estelar: ${languageValue(current, sourceLanguage())}`, `Αστρικό κειμήλιο: ${languageValue(current, sourceLanguage())}`, `Star Relic: ${languageValue(current, sourceLanguage())}`);
  return dungeonShell(top, `${top('world')}<section class="dungeon-complete"><img class="dungeon-complete-tula" src="${assets.characters.tula.poses.celebrating}" alt="Tula"><h1>${tr('Der Wächter lässt dich passieren!', '¡El guardián te deja pasar!', 'Ο φύλακας σε αφήνει να περάσεις!', 'The guardian lets you pass!')}</h1><p>${tr(`${reward.score}% beim ersten Versuch`, `${reward.score}% al primer intento`, `${reward.score}% με την πρώτη προσπάθεια`, `${reward.score}% first-try score`)}</p><div class="dungeon-treasure"><img src="${assets.rewards.xpStar}" alt=""><div><strong>${relicName}</strong><small>${reward.firstClear ? tr('Neues Relikt für Tulas Zuhause', 'Nueva reliquia para la casa de Tula', 'Νέο κειμήλιο για το σπίτι της Τούλα', 'New relic for Tula’s Home') : tr('Dungeon erneut gemeistert', 'Mazmorra dominada de nuevo', 'Το μπουντρούμι ολοκληρώθηκε ξανά', 'Dungeon mastered again')}</small></div></div><div class="dungeon-reward-row"><span><img src="${assets.rewards.currencyShell}" alt=""><strong>+${reward.shells}</strong>${tr('Muscheln', 'Conchas', 'Κοχύλια', 'Shells')}</span>${reward.secretClaimed ? `<span><i class="ph-bold ph-treasure-chest" aria-hidden="true"></i><strong>${tr('Geheimtruhe', 'Cofre secreto', 'Μυστικό σεντούκι', 'Secret chest')}</strong></span>` : ''}${reward.goldClaimed ? `<span><i class="ph-bold ph-seal-check" aria-hidden="true"></i><strong>${tr('Goldabzeichen', 'Insignia dorada', 'Χρυσό σήμα', 'Gold badge')}</strong></span>` : ''}</div>${reward.shells === 0 ? `<p class="dungeon-reward-note">${tr('Die nächste Wiederholungsbelohnung wartet morgen.', 'La próxima recompensa de repetición espera mañana.', 'Η επόμενη ανταμοιβή επανάληψης περιμένει αύριο.', 'Your next replay reward will be ready tomorrow.')}</p>` : ''}<button class="primary" data-action="replay-star-dungeon">${tr('Dungeon nochmal spielen', 'Jugar la mazmorra otra vez', 'Παίξε ξανά το μπουντρούμι', 'Play dungeon again')}<i class="ph-bold ph-arrow-clockwise" aria-hidden="true"></i></button><button class="secondary dungeon-leave" data-action="leave-star-dungeon">${tr('Zurück zur Lernwelt', 'Volver al mundo', 'Πίσω στον κόσμο μάθησης', 'Back to learning world')}</button></section>`, 'dungeon-finish');
}

function renderDungeon(top) {
  if (!dungeon) return `<div class="v3-shell page">${top('world')}<section class="page-title"><h1>${tr('Kein Dungeon aktiv', 'No hay mazmorra activa', 'Δεν υπάρχει ενεργό μπουντρούμι', 'No active dungeon')}</h1></section></div>`;
  if (dungeon.phase === 'echo') return echoRoute(top);
  if (dungeon.phase === 'rune') return runeRoute(top);
  if (dungeon.phase === 'guardian') return guardianRoute(top);
  return completeRoute(top);
}

function updateMastery(wordId, correct) {
  setState(draft => {
    const mastery = draft.progress.mastery[wordId] || { right: 0, wrong: 0 };
    if (correct) mastery.right++;
    else mastery.wrong++;
    draft.progress.mastery[wordId] = mastery;
    return draft;
  });
}

export function registerStarDungeon(router, { top, showToast }) {
  router.register('star-dungeon', () => renderDungeon(top));

  registerAction('open-star-dungeon', ({ data }) => {
    const status = dungeonStatus(data.world);
    if (!status.unlocked) {
      showToast(tr(`Noch ${Math.max(0, DUNGEON_UNLOCK_STARS - status.stars)} Meistersterne bis zum Sternentor.`, `Faltan ${Math.max(0, DUNGEON_UNLOCK_STARS - status.stars)} estrellas maestras.`, `Απομένουν ${Math.max(0, DUNGEON_UNLOCK_STARS - status.stars)} αστέρια δεξιοτεχνίας.`, `${Math.max(0, DUNGEON_UNLOCK_STARS - status.stars)} more mastery stars to open the gate.`));
      return;
    }
    startDungeon(data.world);
    router.navigate('star-dungeon');
  });
  registerAction('leave-star-dungeon', () => {
    dungeon = null;
    router.navigate('world');
  });
  registerAction('replay-star-dungeon', () => {
    const worldId = dungeon?.worldId || getState().session.collectionId;
    startDungeon(worldId);
    router.renderCurrent();
  });
  registerAction('dungeon-repeat', () => {
    const item = dungeon?.echoItems[dungeon.echoStep];
    const target = targetLanguage();
    if (item) speak(languageValue(item, target), languageMeta(target).voice, { rate: .72 });
  });
  registerAction('dungeon-echo-answer', ({ data }) => {
    const item = dungeon.echoItems[dungeon.echoStep];
    const correct = data.word === item.id;
    updateMastery(item.id, correct);
    if (!correct) {
      dungeon.attempted = true;
      dungeon.feedback = tr('Das Echo klingt anders. Hör noch einmal hin.', 'El eco suena diferente. Escucha otra vez.', 'Η ηχώ ακούγεται διαφορετικά. Άκου ξανά.', 'That echo sounds different. Listen again.');
      router.renderCurrent();
      return;
    }
    if (!dungeon.attempted) dungeon.firstTryCorrect++;
    dungeon.echoStep++;
    dungeon.attempted = false;
    dungeon.feedback = '';
    if (dungeon.echoStep >= dungeon.echoItems.length) dungeon.phase = 'rune';
    router.renderCurrent();
  });
  registerAction('dungeon-rune-toggle', ({ data }) => {
    const index = dungeon.runeBuilt.indexOf(data.word);
    if (index >= 0) dungeon.runeBuilt.splice(index, 1);
    else dungeon.runeBuilt.push(data.word);
    router.renderCurrent();
  });
  registerAction('dungeon-rune-check', () => {
    const expected = dungeon.runeRounds[dungeon.runeStep].map(item => item.id);
    const correct = JSON.stringify(expected) === JSON.stringify(dungeon.runeBuilt);
    expected.forEach(id => updateMastery(id, correct));
    if (!correct) {
      dungeon.attempted = true;
      dungeon.runeBuilt = [];
      dungeon.feedback = tr('Die Brücke wackelt. Tula zeigt dir den Anfang noch einmal.', 'El puente tiembla. Tula te muestra el inicio otra vez.', 'Η γέφυρα κουνιέται. Η Τούλα σου δείχνει ξανά την αρχή.', 'The bridge wobbles. Tula shows you the start again.');
      router.renderCurrent();
      return;
    }
    if (!dungeon.attempted) dungeon.firstTryCorrect++;
    dungeon.runeStep++;
    dungeon.runeBuilt = [];
    dungeon.attempted = false;
    dungeon.feedback = '';
    if (dungeon.runeStep >= dungeon.runeRounds.length) dungeon.phase = 'guardian';
    router.renderCurrent();
  });
  registerAction('dungeon-guardian-answer', ({ data }) => {
    const item = dungeon.guardianItems[dungeon.guardianStep];
    const correct = data.word === item.id;
    updateMastery(item.id, correct);
    if (!correct) {
      dungeon.attempted = true;
      dungeon.feedback = tr('Der Wächter gibt dir einen neuen Versuch.', 'El guardián te da otro intento.', 'Ο φύλακας σου δίνει άλλη μία προσπάθεια.', 'The guardian gives you another try.');
      router.renderCurrent();
      return;
    }
    if (!dungeon.attempted) dungeon.firstTryCorrect++;
    dungeon.guardianStep++;
    dungeon.attempted = false;
    dungeon.feedback = '';
    if (dungeon.guardianStep >= dungeon.guardianItems.length) dungeon.phase = 'complete';
    router.renderCurrent();
  });
}
