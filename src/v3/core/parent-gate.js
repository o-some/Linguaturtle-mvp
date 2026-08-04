let unlockedUntil = 0;

function challengeText(reason, left, right) {
  const context = reason === 'purchase'
    ? 'Diese Aufgabe schützt den Echtgeld-Shop.'
    : 'Diese Aufgabe schützt die freiwillige Werbung.';
  return `${context}\n\nNur für Erwachsene: Wie viel ist ${left} × ${right}?`;
}

export async function requestParentGate(reason = 'purchase', options = {}) {
  const force = Boolean(options.force);
  if (!force && Date.now() < unlockedUntil) return true;

  const left = 4 + Math.floor(Math.random() * 6);
  const right = 3 + Math.floor(Math.random() * 7);
  const answer = window.prompt(challengeText(reason, left, right));
  if (answer === null) return false;
  if (Number(answer.trim()) !== left * right) {
    window.alert('Die Antwort war nicht richtig. Der Elternbereich bleibt geschlossen.');
    return false;
  }
  unlockedUntil = Date.now() + 5 * 60 * 1000;
  return true;
}

export function lockParentGate() {
  unlockedUntil = 0;
}
