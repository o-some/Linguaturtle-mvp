import { collections } from '../content-multilingual.js';
import { A1_DIALOGUES, A1_SENTENCES } from '../cefr-content.js';
import {
  CEFR_LEVELS, LANGUAGE_CODES, completeCefrAssessment, flagImage,
  getCefrStatus, getLanguageProgress, getState, languageMeta, languageValue,
  registerAction, setState, sourceLanguage, speak, targetLanguage, uiText
} from '../core/index.js?build=cefr-1';
import { assets } from '../../config/assets.js?build=cinematic-worlds-1';

const tr = (de, es, el = de, en = null) => uiText(de, es, el, en);
const local = item => languageValue(item, sourceLanguage());
const shuffle = list => [...list].sort(() => Math.random() - .5);
const uniqueOptions = (answer, pool) => shuffle([...new Set([answer, ...shuffle(pool.filter(value => value !== answer)).slice(0, 3)])]);
const allWords = () => collections.flatMap(collection => collection.words);

let assessment = null;
let passportLanguage = null;

export function renderCefrBadge(code = 'A1', { locked = false, compact = false } = {}) {
  const definition = CEFR_LEVELS.find(item => item.code === code) || CEFR_LEVELS[0];
  const label = `${definition.code} · ${local(definition.title)}`;
  return `<span class="cefr-badge cefr-${definition.material} ${locked ? 'locked' : ''} ${compact ? 'compact' : ''}" role="img" aria-label="${locked ? `${label} · ${tr('gesperrt', 'bloqueado', 'κλειδωμένο', 'locked')}` : label}">
    <i class="ph-bold ${locked ? 'ph-lock' : definition.icon}" aria-hidden="true"></i>
    <b>${definition.code}</b>
  </span>`;
}

export function renderProfileLanguageSection() {
  const current = targetLanguage();
  return `<section class="profile-languages">
    <div class="section-head"><div><h2>${tr('Meine Sprachen', 'Mis idiomas', 'Οι γλώσσες μου', 'My languages')}</h2><p>${tr('Jede Sprache hat ihr eigenes Lernwappen.', 'Cada idioma tiene su propio emblema.', 'Κάθε γλώσσα έχει το δικό της έμβλημα.', 'Every language has its own learning crest.')}</p></div></div>
    <div class="profile-language-grid">${LANGUAGE_CODES.map(language => {
      const status = getCefrStatus(language);
      const code = status.currentLevel || 'A1';
      return `<button class="profile-language-card ${language === current ? 'current' : ''}" data-action="open-language-passport" data-language="${language}">
        ${renderCefrBadge(code, { locked: !status.earned, compact: true })}
        <span>${flagImage(language, 'language-mini-flag')}<strong>${languageMeta(language).nativeName}</strong><small>${status.earned ? `${code} · ${local(status.level.title)}` : tr('A1 beginnt hier', 'A1 empieza aquí', 'Το A1 αρχίζει εδώ', 'A1 starts here')}</small></span>
        <i class="ph-bold ph-caret-right" aria-hidden="true"></i>
      </button>`;
    }).join('')}</div>
    <button class="secondary language-passport-open" data-action="open-language-passport" data-language="${current}"><i class="ph-bold ph-passport" aria-hidden="true"></i> ${tr('Meinen Sprachenpass öffnen', 'Abrir mi pasaporte de idiomas', 'Άνοιγμα γλωσσικού διαβατηρίου', 'Open my language passport')}</button>
  </section>`;
}

export function renderLanguageWall() {
  const badges = LANGUAGE_CODES.flatMap(language =>
    getLanguageProgress(language).cefr.earned.map(code => ({ language, code }))
  );
  if (!badges.length) return '';
  return `<section class="language-wall"><div><i class="ph-bold ph-certificate" aria-hidden="true"></i><span><strong>${tr('Tulas Sprachenwand', 'Muro de idiomas de Tula', 'Ο γλωσσικός τοίχος της Τούλα', "Tula's language wall")}</strong><small>${tr('Deine verdienten Lernwappen', 'Tus emblemas ganados', 'Τα εμβλήματα που κέρδισες', 'Your earned learning crests')}</small></span></div><div>${badges.map(({ language, code }) => `<span>${renderCefrBadge(code, { compact: true })}${flagImage(language, 'language-mini-flag')}</span>`).join('')}</div></section>`;
}

const goalCopy = {
  vocabulary: ['Wortschatz', 'Vocabulario', 'Λεξιλόγιο', 'Vocabulary'],
  listening: ['Hören', 'Escuchar', 'Ακρόαση', 'Listening'],
  sentence: ['Sätze bauen', 'Construir frases', 'Δημιουργία προτάσεων', 'Build sentences'],
  dialogue: ['Geschichten & Dialoge', 'Historias y diálogos', 'Ιστορίες και διάλογοι', 'Stories & dialogues'],
  speaking: ['Sprechen üben', 'Practicar el habla', 'Εξάσκηση ομιλίας', 'Speaking practice'],
};
const goalLabel = id => tr(...goalCopy[id]);
const percent = value => `${Math.round(Number(value || 0) * 100)}%`;
const goalEvidence = goal => {
  const evidence = goal.evidence;
  if (!evidence) return '';
  if (goal.id === 'listening') return tr(
    `${evidence.sessions}/${evidence.sessionsTarget} Runden · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} richtig`,
    `${evidence.sessions}/${evidence.sessionsTarget} rondas · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} correcto`,
    `${evidence.sessions}/${evidence.sessionsTarget} γύροι · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} σωστά`,
    `${evidence.sessions}/${evidence.sessionsTarget} rounds · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} correct`
  );
  if (goal.id === 'sentence') return tr(
    `${evidence.unique}/${evidence.uniqueTarget} verschiedene Sätze · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} richtig`,
    `${evidence.unique}/${evidence.uniqueTarget} frases distintas · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} correcto`,
    `${evidence.unique}/${evidence.uniqueTarget} διαφορετικές προτάσεις · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} σωστά`,
    `${evidence.unique}/${evidence.uniqueTarget} unique sentences · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} correct`
  );
  return tr(
    `${evidence.stories}/${evidence.storiesTarget} Geschichten · ${evidence.dialogues}/${evidence.dialoguesTarget} Dialoge · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} richtig`,
    `${evidence.stories}/${evidence.storiesTarget} historias · ${evidence.dialogues}/${evidence.dialoguesTarget} diálogos · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} correcto`,
    `${evidence.stories}/${evidence.storiesTarget} ιστορίες · ${evidence.dialogues}/${evidence.dialoguesTarget} διάλογοι · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} σωστά`,
    `${evidence.stories}/${evidence.storiesTarget} stories · ${evidence.dialogues}/${evidence.dialoguesTarget} dialogues · ${percent(evidence.accuracy)}/${percent(evidence.accuracyTarget)} correct`
  );
};
const materialLabel = material => ({
  bronze: tr('Bronze-Wappen', 'Emblema de bronce', 'Χάλκινο έμβλημα', 'Bronze crest'),
  iron: tr('Eisen-Wappen', 'Emblema de hierro', 'Σιδερένιο έμβλημα', 'Iron crest'),
  gold: tr('Gold-Wappen', 'Emblema de oro', 'Χρυσό έμβλημα', 'Gold crest'),
  platinum: tr('Platin-Wappen', 'Emblema de platino', 'Πλατινένιο έμβλημα', 'Platinum crest'),
  diamond: tr('Diamant-Wappen', 'Emblema de diamante', 'Διαμαντένιο έμβλημα', 'Diamond crest'),
  master: tr('Meister-Wappen', 'Emblema maestro', 'Έμβλημα κυριαρχίας', 'Master crest'),
}[material] || material);
const selectedLanguage = () => LANGUAGE_CODES.includes(passportLanguage) ? passportLanguage : targetLanguage();

function passportRoute({ top, nav }) {
  const language = selectedLanguage();
  const status = getCefrStatus(language);
  const percent = Math.round(status.goals.filter(goal => goal.complete).length / status.goals.length * 100);
  return `<div class="v3-shell page cinematic-subpage cinematic-profile language-passport-page">
    <img class="cinematic-subpage-bg" src="${assets.backgrounds.cinematic.profile}" alt="">
    ${top('profile')}
    <section class="passport-hero">
      <div class="passport-hero-copy"><h1>${tr('Mein Sprachenpass', 'Mi pasaporte de idiomas', 'Το γλωσσικό μου διαβατήριο', 'My language passport')}</h1><p>${tr('Sammle für jede Sprache ein eigenes Tula-Wappen.', 'Consigue un emblema de Tula para cada idioma.', 'Συγκέντρωσε ένα έμβλημα της Τούλα για κάθε γλώσσα.', 'Earn a Tula crest for every language.')}</p></div>
      ${renderCefrBadge(status.currentLevel || 'A1', { locked: !status.earned })}
    </section>
    <div class="passport-language-tabs" role="group" aria-label="${tr('Lernsprache', 'Idioma de aprendizaje', 'Γλώσσα μάθησης', 'Learning language')}">${LANGUAGE_CODES.map(code => `<button class="${code === language ? 'active' : ''}" data-action="select-passport-language" data-language="${code}" aria-pressed="${code === language}">${flagImage(code, 'language-mini-flag')} ${languageMeta(code).short}</button>`).join('')}</div>
    <section class="passport-current">
      <div class="passport-current-head"><span>${flagImage(language)}<strong>${languageMeta(language).nativeName}</strong></span><b>${status.earned ? `A1 · ${local(status.level.title)}` : `${percent}% ${tr('bereit', 'listo', 'έτοιμο', 'ready')}`}</b></div>
      <div class="passport-goals">${status.goals.map(goal => {
        const value = Math.min(goal.target, goal.value);
        return `<div class="${goal.complete ? 'complete' : ''}"><i class="ph-bold ${goal.complete ? 'ph-check-circle' : 'ph-circle'}" aria-hidden="true"></i><span><strong>${goalLabel(goal.id)}</strong><small>${value}/${goal.target}</small></span><progress max="${goal.target}" value="${value}" aria-label="${goalLabel(goal.id)}"></progress>${!goal.complete && goalEvidence(goal) ? `<small class="passport-goal-evidence">${goalEvidence(goal)}</small>` : ''}</div>`;
      }).join('')}</div>
      ${status.earned
        ? `<div class="passport-earned"><i class="ph-bold ph-seal-check" aria-hidden="true"></i><strong>${tr('A1 bestanden – dein Bronze-Wappen gehört dir!', 'A1 aprobado: ¡tu emblema de bronce es tuyo!', 'Πέρασες το A1 – το χάλκινο έμβλημα είναι δικό σου!', 'A1 passed — your bronze crest is yours!')}</strong></div>`
        : status.remediationRemaining > 0
          ? `<div class="passport-focus"><strong>${tr('Tulas Fokuspfad', 'Camino de enfoque de Tula', 'Διαδρομή εστίασης της Τούλα', "Tula's focus path")}</strong><p>${tr(`Noch ${status.remediationRemaining} passende Übungen, dann kannst du erneut antreten.`, `Faltan ${status.remediationRemaining} ejercicios para volver a intentarlo.`, `Απομένουν ${status.remediationRemaining} ασκήσεις πριν ξαναδοκιμάσεις.`, `${status.remediationRemaining} matching exercises left before you can try again.`)}</p>${(status.assessment.remediation?.skills || []).map(skill => `<button data-action="start-cefr-practice" data-skill="${skill}">${goalLabel(skill === 'vocabulary' ? 'vocabulary' : skill === 'dialogue' ? 'dialogue' : skill)} <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></button>`).join('')}</div>`
          : `<button class="primary passport-assessment-start" data-action="start-cefr-assessment" data-language="${language}" ${status.canAssess ? '' : 'disabled'}><i class="ph-bold ph-flag-banner" aria-hidden="true"></i> ${status.canAssess ? tr('A1-Abschlussabenteuer starten', 'Empezar la aventura final A1', 'Έναρξη τελικής περιπέτειας A1', 'Start the A1 final adventure') : tr('Erst alle Lernziele abschließen', 'Completa primero todos los objetivos', 'Ολοκλήρωσε πρώτα όλους τους στόχους', 'Complete all learning goals first')}</button>`}
    </section>
    <section class="cefr-ladder"><h2>${tr('Dein Weg von A1 bis C2', 'Tu camino de A1 a C2', 'Η πορεία σου από A1 έως C2', 'Your path from A1 to C2')}</h2>${CEFR_LEVELS.map(definition => {
      const earned = getLanguageProgress(language).cefr.earned.includes(definition.code);
      return `<article class="${earned ? 'earned' : ''}">${renderCefrBadge(definition.code, { locked: !earned && !definition.enabled, compact: true })}<div><strong>${definition.code} · ${materialLabel(definition.material)} · ${local(definition.title)}</strong><p>${local(definition.meaning)}</p><small>${definition.enabled ? tr('GER-orientierte Lernstufe', 'Nivel de aprendizaje orientado al MCER', 'Επίπεδο μάθησης με βάση το ΚΕΠΑ', 'CEFR-oriented learning level') : tr('In Vorbereitung', 'En preparación', 'Σε προετοιμασία', 'In preparation')}</small></div></article>`;
    }).join('')}</section>
    <p class="cefr-disclaimer"><i class="ph-bold ph-info" aria-hidden="true"></i>${tr('LinguaTurtle-Lernstufen orientieren sich am GER, sind aber kein offizielles Sprachzertifikat.', 'Los niveles de LinguaTurtle se orientan al MCER, pero no son un certificado oficial.', 'Τα επίπεδα LinguaTurtle βασίζονται στο ΚΕΠΑ, αλλά δεν είναι επίσημο πιστοποιητικό.', 'LinguaTurtle levels are CEFR-oriented but are not an official language certificate.')}</p>
  </div>${nav('profile')}`;
}

function buildQuestions() {
  const target = selectedLanguage();
  const source = sourceLanguage() === target ? LANGUAGE_CODES.find(code => code !== target) : sourceLanguage();
  const words = shuffle(allWords()).slice(0, 10);
  const wordTargetPool = words.map(word => languageValue(word, target));
  const wordSourcePool = words.map(word => languageValue(word, source));
  const vocabulary = words.slice(0, 5).map(word => ({
    section: 'vocabulary', prompt: languageValue(word, source),
    hint: tr('Wähle die passende Übersetzung.', 'Elige la traducción correcta.', 'Διάλεξε τη σωστή μετάφραση.', 'Choose the correct translation.'),
    answer: languageValue(word, target), options: uniqueOptions(languageValue(word, target), wordTargetPool),
  }));
  const listening = words.slice(5, 10).map(word => ({
    section: 'listening', prompt: tr('Hör gut zu', 'Escucha con atención', 'Άκου προσεκτικά', 'Listen closely'),
    hint: tr('Welches Wort hast du gehört?', '¿Qué palabra escuchaste?', 'Ποια λέξη άκουσες;', 'Which word did you hear?'),
    audio: languageValue(word, target), answer: languageValue(word, source), options: uniqueOptions(languageValue(word, source), wordSourcePool),
  }));
  const sentencePool = A1_SENTENCES.map(item => item[target].join(' '));
  const sentence = shuffle(A1_SENTENCES).slice(0, 5).map(item => ({
    section: 'sentence', prompt: item[source].join(' '),
    hint: tr('Welcher Satz passt?', '¿Qué frase corresponde?', 'Ποια πρόταση ταιριάζει;', 'Which sentence matches?'),
    answer: item[target].join(' '), options: uniqueOptions(item[target].join(' '), sentencePool),
  }));
  const dialoguePool = A1_DIALOGUES.map(item => languageValue(item, target));
  const dialogue = shuffle(A1_DIALOGUES).slice(0, 5).map(item => ({
    section: 'dialogue', prompt: languageValue(item, source),
    hint: tr('Was antwortet Tula?', '¿Qué responde Tula?', 'Τι απαντά η Τούλα;', 'What does Tula answer?'),
    answer: languageValue(item, target), options: uniqueOptions(languageValue(item, target), dialoguePool),
  }));
  return [...vocabulary, ...listening, ...sentence, ...dialogue];
}

function assessmentRoute({ top }) {
  assessment ||= getState().session.cefrAssessment || null;
  if (!assessment) return `<div class="v3-shell page">${top('language-passport')}<section class="cefr-result"><h1>${tr('Kein Abenteuer aktiv', 'No hay aventura activa', 'Δεν υπάρχει ενεργή περιπέτεια', 'No active adventure')}</h1><button class="primary" data-action="finish-cefr-assessment">${tr('Zum Sprachenpass', 'Ir al pasaporte', 'Στο γλωσσικό διαβατήριο', 'Go to language passport')}</button></section></div>`;
  if (assessment.finished) {
    const result = assessment.result;
    return `<div class="v3-shell page cefr-assessment-page">${top('language-passport')}<section class="cefr-result ${result.passed ? 'passed' : 'retry'}">${renderCefrBadge('A1', { locked: !result.passed })}<h1>${result.passed ? tr('A1 geschafft!', '¡A1 completado!', 'Το A1 ολοκληρώθηκε!', 'A1 complete!') : tr('Fast geschafft!', '¡Casi lo tienes!', 'Σχεδόν τα κατάφερες!', 'Almost there!')}</h1><p>${result.passed ? tr('Dein Bronze-Wappen und 50 Muscheln warten in deinem Sprachenpass.', 'Tu emblema de bronce y 50 conchas te esperan.', 'Το χάλκινο έμβλημα και 50 κοχύλια σε περιμένουν.', 'Your bronze crest and 50 shells are waiting in your passport.') : tr('Tula hat drei passende Fokusübungen für dich ausgewählt.', 'Tula ha elegido tres ejercicios para ti.', 'Η Τούλα διάλεξε τρεις κατάλληλες ασκήσεις.', 'Tula picked three matching focus exercises for you.')}</p><button class="primary" data-action="finish-cefr-assessment">${tr('Zum Sprachenpass', 'Ir al pasaporte', 'Στο γλωσσικό διαβατήριο', 'Go to language passport')} <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></button></section></div>`;
  }
  const question = assessment.questions[assessment.step];
  const percent = Math.round(assessment.step / assessment.questions.length * 100);
  return `<div class="v3-shell page cefr-assessment-page">${top('language-passport')}<section class="cefr-quiz-head"><div><strong>${tr('A1-Abschlussabenteuer', 'Aventura final A1', 'Τελική περιπέτεια A1', 'A1 final adventure')}</strong><span>${assessment.step + 1}/${assessment.questions.length}</span></div><progress max="100" value="${percent}" aria-label="${tr('Prüfungsfortschritt', 'Progreso de la prueba', 'Πρόοδος δοκιμασίας', 'Assessment progress')}"></progress></section><section class="cefr-question"><i class="ph-bold ${question.section === 'listening' ? 'ph-speaker-high' : question.section === 'sentence' ? 'ph-text-aa' : question.section === 'dialogue' ? 'ph-chats' : 'ph-book-open-text'}" aria-hidden="true"></i><h1>${question.prompt}</h1><p>${question.hint}</p>${question.audio ? `<button class="cefr-listen" data-action="speak-cefr-question"><i class="ph-bold ph-speaker-high" aria-hidden="true"></i> ${tr('Noch einmal hören', 'Escuchar otra vez', 'Άκουσε ξανά', 'Listen again')}</button>` : ''}</section><div class="cefr-answer-grid">${question.options.map(option => `<button data-action="answer-cefr-question" data-answer="${String(option).replace(/"/g, '&quot;')}">${option}</button>`).join('')}</div></div>`;
}

export function registerLanguagePassport(router, ui) {
  router.register('language-passport', () => passportRoute(ui));
  router.register('cefr-assessment', () => assessmentRoute(ui));
  registerAction('open-language-passport', ({ data }) => { passportLanguage = data.language || targetLanguage(); router.navigate('language-passport'); });
  registerAction('select-passport-language', ({ data }) => { passportLanguage = data.language; router.renderCurrent(); });
  registerAction('start-cefr-assessment', ({ data }) => {
    passportLanguage = data.language || targetLanguage();
    if (!getCefrStatus(selectedLanguage()).canAssess) return ui.showToast(tr('Schließe zuerst alle A1-Lernziele ab.', 'Completa primero los objetivos A1.', 'Ολοκλήρωσε πρώτα τους στόχους A1.', 'Complete the A1 learning goals first.'));
    assessment = { language: selectedLanguage(), questions: buildQuestions(), step: 0, scores: {}, finished: false, result: null };
    assessment.questions.forEach(question => { assessment.scores[question.section] ||= { correct: 0, total: 0 }; });
    setState(draft => { draft.session.cefrAssessment = assessment; return draft; });
    router.navigate('cefr-assessment');
  });
  registerAction('speak-cefr-question', () => {
    assessment ||= getState().session.cefrAssessment || null;
    const question = assessment?.questions[assessment.step];
    if (question?.audio) speak(question.audio, languageMeta(assessment.language).voice, { rate: .78 });
  });
  registerAction('answer-cefr-question', ({ data }) => {
    assessment ||= getState().session.cefrAssessment || null;
    const question = assessment?.questions[assessment.step];
    if (!question) return;
    const score = assessment.scores[question.section];
    score.total++;
    if (data.answer === question.answer) score.correct++;
    assessment.step++;
    if (assessment.step >= assessment.questions.length) {
      assessment.result = completeCefrAssessment(assessment.language, 'A1', assessment.scores);
      assessment.finished = true;
    }
    setState(draft => { draft.session.cefrAssessment = assessment; return draft; });
    router.renderCurrent();
  });
  registerAction('finish-cefr-assessment', () => {
    assessment = null;
    setState(draft => { draft.session.cefrAssessment = null; return draft; });
    router.navigate('language-passport');
  });
  registerAction('start-cefr-practice', ({ data }) => {
    const route = { vocabulary: 'explore', listening: 'listening', sentence: 'sentence', dialogue: 'stories' }[data.skill] || 'world';
    setState(draft => { draft.session.collectionId = 'garden'; return draft; });
    router.navigate(route);
  });
}
