import { getState, setState } from './store.js';
import { creditGameplayShells } from './economy.js';

export const CEFR_LEVELS = Object.freeze([
  { code: 'A1', rank: 1, material: 'bronze', icon: 'ph-compass', reward: 50, enabled: true, title: { de: 'Sprachentdecker', es: 'Explorador de idiomas', el: 'Εξερευνητής γλωσσών', en: 'Language Explorer' }, meaning: { de: 'Anfänger: erste Wörter und sehr einfache Alltagssätze.', es: 'Principiante: primeras palabras y frases cotidianas muy sencillas.', el: 'Αρχάριος: πρώτες λέξεις και πολύ απλές καθημερινές προτάσεις.', en: 'Beginner: first words and very simple everyday sentences.' } },
  { code: 'A2', rank: 2, material: 'iron', icon: 'ph-shield-star', reward: 100, enabled: false, title: { de: 'Wegfinder', es: 'Guía del camino', el: 'Οδηγός μονοπατιού', en: 'Pathfinder' }, meaning: { de: 'Grundkenntnisse: häufige Ausdrücke verstehen und einfach sprechen.', es: 'Conocimientos básicos: entender expresiones frecuentes y hablar de forma sencilla.', el: 'Βασικές γνώσεις: κατανόηση συχνών εκφράσεων και απλή ομιλία.', en: 'Basic knowledge: understand common expressions and communicate simply.' } },
  { code: 'B1', rank: 3, material: 'gold', icon: 'ph-star', reward: 150, enabled: false, title: { de: 'Alltagsheld', es: 'Héroe cotidiano', el: 'Ήρωας της καθημερινότητας', en: 'Everyday Hero' }, meaning: { de: 'Gute Alltagskenntnisse: vertraute Situationen selbstständig bewältigen.', es: 'Buen dominio cotidiano: desenvolverse en situaciones conocidas.', el: 'Καλή καθημερινή γνώση: ανεξάρτητη διαχείριση οικείων καταστάσεων.', en: 'Good everyday knowledge: handle familiar situations independently.' } },
  { code: 'B2', rank: 4, material: 'platinum', icon: 'ph-navigation-arrow', reward: 250, enabled: false, title: { de: 'Sprachnavigator', es: 'Navegante lingüístico', el: 'Γλωσσικός πλοηγός', en: 'Language Navigator' }, meaning: { de: 'Sicher und selbstständig: längere Inhalte verstehen und flüssig sprechen.', es: 'Seguro e independiente: comprender textos largos y hablar con fluidez.', el: 'Με αυτοπεποίθηση και ανεξαρτησία: κατανόηση μεγαλύτερων κειμένων και άνετη ομιλία.', en: 'Confident and independent: understand longer content and speak fluently.' } },
  { code: 'C1', rank: 5, material: 'diamond', icon: 'ph-diamond', reward: 400, enabled: false, title: { de: 'Sprachprofi', es: 'Profesional del idioma', el: 'Ειδικός γλώσσας', en: 'Language Pro' }, meaning: { de: 'Sehr gute Sprachkenntnisse: anspruchsvolle Inhalte flexibel und präzise nutzen.', es: 'Muy buen dominio: usar contenidos exigentes con flexibilidad y precisión.', el: 'Πολύ καλή γνώση: ευέλικτη και ακριβής χρήση απαιτητικού περιεχομένου.', en: 'Very good knowledge: use demanding language flexibly and precisely.' } },
  { code: 'C2', rank: 6, material: 'master', icon: 'ph-crown', reward: 600, enabled: false, title: { de: 'Sprachmeister', es: 'Maestro del idioma', el: 'Δάσκαλος γλώσσας', en: 'Language Master' }, meaning: { de: 'Fast muttersprachlich: nahezu alles verstehen und feinste Unterschiede ausdrücken.', es: 'Casi nativo: entender casi todo y expresar matices.', el: 'Σχεδόν μητρική γνώση: κατανόηση σχεδόν των πάντων και έκφραση λεπτών διαφορών.', en: 'Near-native: understand almost everything and express subtle differences.' } }
]);

export const A1_REQUIREMENTS = Object.freeze({
  discovered: 40,
  listeningCorrect: 24,
  listeningSessions: 4,
  listeningAccuracy: .75,
  sentenceCorrect: 12,
  sentenceUnique: 6,
  sentenceAccuracy: .75,
  stories: 3,
  dialogueCorrect: 6,
  dialogueAccuracy: .75,
  speaking: 6,
});

const unique = values => [...new Set((values || []).filter(Boolean).map(String))];
const accuracy = result => Number(result.total || 0) > 0 ? Number(result.correct || 0) / Number(result.total) : 0;
const level = code => CEFR_LEVELS.find(item => item.code === code) || CEFR_LEVELS[0];
const blankMetric = () => ({ correct: 0, total: 0, sessions: 0 });

const normalized = value => ({
  legacyDiscovered: Math.max(0, Number(value?.legacyDiscovered || 0)),
  discovered: unique(value?.discovered),
  activities: {
    listening: { ...blankMetric(), ...(value?.activities?.listening || {}) },
    sentence: { ...blankMetric(), unique: [], ...(value?.activities?.sentence || {}), unique: unique(value?.activities?.sentence?.unique) },
    stories: unique(value?.activities?.stories),
    dialogue: { ...blankMetric(), ...(value?.activities?.dialogue || {}) },
    speaking: unique(value?.activities?.speaking),
  },
  cefr: {
    earned: unique(value?.cefr?.earned),
    assessments: { ...(value?.cefr?.assessments || {}) },
  },
});

export function getLanguageProgress(language, state = getState()) {
  return normalized(state.progress.byLanguage?.[language]);
}

export function recordLanguageActivity(result = {}) {
  const language = String(result.language || getState().languages?.target || 'es');
  const skill = String(result.skill || '');
  const itemIds = unique(result.itemIds);
  setState(draft => {
    draft.progress.byLanguage ??= {};
    const current = normalized(draft.progress.byLanguage[language]);
    if (skill === 'discovery') current.discovered = unique([...current.discovered, ...itemIds]);
    if (skill === 'listening' || skill === 'sentence' || skill === 'dialogue') {
      const key = skill === 'dialogue' ? 'dialogue' : skill;
      const metric = current.activities[key];
      metric.correct += Math.max(0, Number(result.correct || 0));
      metric.total += Math.max(0, Number(result.total || 0));
      if (result.completed) metric.sessions++;
      if (skill === 'sentence') metric.unique = unique([...metric.unique, ...itemIds]);
    }
    if (skill === 'story') current.activities.stories = unique([...current.activities.stories, ...itemIds]);
    if (skill === 'speaking') current.activities.speaking = unique([...current.activities.speaking, ...itemIds]);

    const remediation = current.cefr.assessments.A1?.remediation;
    const section = { discovery: 'vocabulary', listening: 'listening', sentence: 'sentence', story: 'dialogue', dialogue: 'dialogue', speaking: 'vocabulary' }[skill];
    if (result.completed && remediation?.remaining > 0 && remediation.skills?.includes(section)) remediation.remaining--;
    draft.progress.byLanguage[language] = current;
    return draft;
  });
  return getCefrStatus(language, 'A1');
}

export function getCefrStatus(language, code = 'A1', state = getState()) {
  const progress = getLanguageProgress(language, state);
  const listening = progress.activities.listening;
  const sentence = progress.activities.sentence;
  const dialogue = progress.activities.dialogue;
  const discovered = Math.max(progress.legacyDiscovered, progress.discovered.length);
  const goals = [
    { id: 'vocabulary', value: discovered, target: A1_REQUIREMENTS.discovered, complete: discovered >= A1_REQUIREMENTS.discovered },
    { id: 'listening', value: listening.correct, target: A1_REQUIREMENTS.listeningCorrect, evidence: { sessions: listening.sessions, sessionsTarget: A1_REQUIREMENTS.listeningSessions, accuracy: accuracy(listening), accuracyTarget: A1_REQUIREMENTS.listeningAccuracy }, complete: listening.correct >= A1_REQUIREMENTS.listeningCorrect && listening.sessions >= A1_REQUIREMENTS.listeningSessions && accuracy(listening) >= A1_REQUIREMENTS.listeningAccuracy },
    { id: 'sentence', value: sentence.correct, target: A1_REQUIREMENTS.sentenceCorrect, evidence: { unique: sentence.unique.length, uniqueTarget: A1_REQUIREMENTS.sentenceUnique, accuracy: accuracy(sentence), accuracyTarget: A1_REQUIREMENTS.sentenceAccuracy }, complete: sentence.correct >= A1_REQUIREMENTS.sentenceCorrect && sentence.unique.length >= A1_REQUIREMENTS.sentenceUnique && accuracy(sentence) >= A1_REQUIREMENTS.sentenceAccuracy },
    { id: 'dialogue', value: progress.activities.stories.length + dialogue.correct, target: A1_REQUIREMENTS.stories + A1_REQUIREMENTS.dialogueCorrect, evidence: { stories: progress.activities.stories.length, storiesTarget: A1_REQUIREMENTS.stories, dialogues: dialogue.correct, dialoguesTarget: A1_REQUIREMENTS.dialogueCorrect, accuracy: accuracy(dialogue), accuracyTarget: A1_REQUIREMENTS.dialogueAccuracy }, complete: progress.activities.stories.length >= A1_REQUIREMENTS.stories && dialogue.correct >= A1_REQUIREMENTS.dialogueCorrect && accuracy(dialogue) >= A1_REQUIREMENTS.dialogueAccuracy },
    { id: 'speaking', value: progress.activities.speaking.length, target: A1_REQUIREMENTS.speaking, complete: progress.activities.speaking.length >= A1_REQUIREMENTS.speaking },
  ];
  const assessment = progress.cefr.assessments[code] || {};
  return {
    language,
    level: level(code),
    earned: progress.cefr.earned.includes(code),
    currentLevel: CEFR_LEVELS.filter(item => progress.cefr.earned.includes(item.code)).at(-1)?.code || null,
    goals,
    ready: goals.every(goal => goal.complete),
    remediationRemaining: Math.max(0, Number(assessment.remediation?.remaining || 0)),
    canAssess: level(code).enabled && goals.every(goal => goal.complete) && Number(assessment.remediation?.remaining || 0) <= 0,
    assessment,
  };
}

export function completeCefrAssessment(language, code, scores = {}) {
  const definition = level(code);
  if (!definition.enabled) return { ok: false, reason: 'level_unavailable' };
  const status = getCefrStatus(language, code);
  if (!status.canAssess) return { ok: false, reason: 'not_ready' };
  const sections = ['vocabulary', 'listening', 'sentence', 'dialogue'];
  const normalizedScores = Object.fromEntries(sections.map(section => {
    const score = scores[section] || {};
    return [section, { correct: Math.max(0, Number(score.correct || 0)), total: Math.max(1, Number(score.total || 0)) }];
  }));
  const totalCorrect = sections.reduce((sum, section) => sum + normalizedScores[section].correct, 0);
  const total = sections.reduce((sum, section) => sum + normalizedScores[section].total, 0);
  const passed = totalCorrect / total >= .8 && sections.every(section => accuracy(normalizedScores[section]) >= .6);
  const weakest = [...sections].sort((a, b) => accuracy(normalizedScores[a]) - accuracy(normalizedScores[b])).slice(0, 2);
  const alreadyEarned = status.earned;

  setState(draft => {
    draft.progress.byLanguage ??= {};
    const current = normalized(draft.progress.byLanguage[language]);
    const previous = current.cefr.assessments[code] || {};
    current.cefr.assessments[code] = {
      attempts: Math.max(0, Number(previous.attempts || 0)) + 1,
      bestPercent: Math.max(Number(previous.bestPercent || 0), Math.round(totalCorrect / total * 100)),
      lastScores: normalizedScores,
      passedAt: passed ? previous.passedAt || new Date().toISOString() : previous.passedAt || null,
      remediation: passed ? { remaining: 0, skills: [] } : { remaining: 3, skills: weakest },
    };
    if (passed && !current.cefr.earned.includes(code)) {
      current.cefr.earned.push(code);
      draft.progress.shells += definition.reward;
      draft.inventory.languageBadges ??= [];
      const badgeId = `${language}-${code}`;
      if (!draft.inventory.languageBadges.includes(badgeId)) draft.inventory.languageBadges.push(badgeId);
    }
    draft.progress.byLanguage[language] = current;
    return draft;
  });

  if (passed && !alreadyEarned) {
    creditGameplayShells(definition.reward, 'cefr-level', `cefr-${language}-${code}`).catch(() => {});
  }
  return { ok: true, passed, newlyEarned: passed && !alreadyEarned, reward: passed && !alreadyEarned ? definition.reward : 0, weakest };
}

export function meetsLanguageRequirement({ minLevel = 'A1', languageCount = 2 } = {}, state = getState()) {
  const minimum = level(minLevel).rank;
  const languages = Object.keys(state.progress.byLanguage || {}).filter(language =>
    getLanguageProgress(language, state).cefr.earned.some(code => level(code).rank >= minimum)
  );
  return { met: languages.length >= languageCount, count: languages.length, required: languageCount, languages };
}
