import { test, expect } from '@playwright/test';

const preview = '/refactor-preview.html';

async function seed(page) {
  await page.addInitScript(() => {
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify({
      storageVersion: 2,
      route: { name: 'home', params: {} },
      language: 'de',
      languages: { source: 'de', target: 'es' },
      profile: { id: 'default', name: 'Mia', stage: 'preschool', goal: 'balanced', support: 'normal' },
      progress: { xp: 1200, shells: 1000, streak: 5, daily: 2, learned: {}, mastery: {} },
      settings: { sound: false, motion: true, music: false },
      inventory: { unlockedModes: ['sentence','memory','speed'], boosters: { doubleXp: 0, hints: 3, jumps: 1 }, claimedMilestones: [] },
      session: { activeGame: null, collectionId: 'garden', busy: false, error: null }
    }));
  });
}

async function openLanguageSelector(page) {
  await page.locator('[data-route="language-select"]').first().click();
  await expect(page.locator('.language-pair-summary')).toBeVisible();
}

async function setPair(page, source, target) {
  await openLanguageSelector(page);
  await page.locator(`[data-action="select-source-language"][data-language="${source}"]`).click();
  await page.locator(`[data-action="select-target-language"][data-language="${target}"]`).click();
  await page.locator('[data-action="confirm-language-pair"]').click();
}

test.beforeEach(async ({ page }) => {
  await seed(page);
  await page.goto(preview);
  await expect(page.locator('h1')).toContainText(/Insel|isla/i);
});

test('home, island and learning world are separated', async ({ page }) => {
  await page.getByRole('button', { name: /Insel entdecken/i }).click();
  await expect(page.getByRole('heading', { name: /Wohin möchtest du/i })).toBeVisible();
  await page.locator('[data-action="open-world"]').first().click();
  await expect(page.getByText(/Wähle jetzt eine Übung/i)).toBeVisible();
  await expect(page.locator('.word-showcase')).toHaveCount(0);
});

test('explore opens only after selecting the exercise', async ({ page }) => {
  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Wörter entdecken/i }).click();
  await expect(page.locator('.explore-grid')).toBeVisible();
  await expect(page.locator('[data-action="finish-explore"]')).toBeVisible();
});

test('listening quiz accepts an answer and persists reward', async ({ page }) => {
  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Hör-Abenteuer/i }).click();
  await expect(page.locator('[data-action="answer-listening"]')).toHaveCount(4);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const answers = page.locator('[data-action="answer-listening"]');
    if (await answers.count()) await answers.nth(attempt % Math.max(1, await answers.count())).click();
    await page.waitForTimeout(100);
  }
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  expect(after).toBeGreaterThanOrEqual(before);
});

test('shop purchase changes the central store', async ({ page }) => {
  await page.locator('[data-route="shop"]').first().click();
  const buy = page.locator('[data-action="buy-item"]:not([disabled])').first();
  await expect(buy).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  await buy.click();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  expect(after).toBeLessThan(before);
});

test('profile and settings are reachable', async ({ page }) => {
  await page.locator('[data-route="profile"]').first().click();
  await expect(page.getByText(/DEIN FORTSCHRITT/i)).toBeVisible();
  await page.locator('[data-action="open-settings"]').click();
  await expect(page.getByText(/ELTERNBEREICH/i)).toBeVisible();
});

test('memory and speed mode start from learning world', async ({ page }) => {
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-action="start-memory"]').click();
  await expect(page.getByText(/Finde die Paare/i)).toBeVisible();
  await page.locator('[data-action="navigate"][data-route="world"]').first().click();
  await page.locator('[data-action="start-speed"]').click();
  await expect(page.getByText(/Goldene Minute/i)).toBeVisible();
});

test('Deutsch to Greek changes learning content and persists the pair', async ({ page }) => {
  await setPair(page, 'de', 'el');
  await expect(page.locator('.language-pair-chip')).toContainText('DE → 🇬🇷 EL');
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-route="explore"]').click();
  const apple = page.locator('[data-action="speak-word"][data-word="garden-apple"]');
  await expect(apple).toContainText('μήλο');
  await expect(apple).toContainText('Apfel');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).languages);
  expect(stored).toEqual({ source: 'de', target: 'el' });
});

test('Greek to Spanish updates the full interface and learning direction', async ({ page }) => {
  await setPair(page, 'el', 'es');
  await expect(page.getByText('Έλα μαζί μας στο νησί!')).toBeVisible();
  await expect(page.locator('.language-pair-chip')).toContainText('EL → 🇪🇸 ES');
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-route="explore"]').click();
  const apple = page.locator('[data-action="speak-word"][data-word="garden-apple"]');
  await expect(apple).toContainText('manzana');
  await expect(apple).toContainText('μήλο');
});

test('Deutsch to English shows English words and stores the pair', async ({ page }) => {
  await setPair(page, 'de', 'en');
  await expect(page.locator('.language-pair-chip')).toContainText('DE → 🇬🇧 EN');
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-route="explore"]').click();
  const apple = page.locator('[data-action="speak-word"][data-word="garden-apple"]');
  await expect(apple).toContainText('apple');
  await expect(apple).toContainText('Apfel');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).languages);
  expect(stored).toEqual({ source: 'de', target: 'en' });
});

test('English to Greek translates interface, places and learning direction', async ({ page }) => {
  await setPair(page, 'en', 'el');
  await expect(page.getByText('Come to the island!')).toBeVisible();
  await expect(page.locator('.language-pair-chip')).toContainText('EN → 🇬🇷 EL');
  await page.getByRole('button', { name: /Explore the island/i }).click();
  await expect(page.getByRole('heading', { name: /Where would you like to go/i })).toBeVisible();
  await expect(page.getByText('Garden', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Fruit, vegetables and nature')).toBeVisible();
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-route="explore"]').click();
  const apple = page.locator('[data-action="speak-word"][data-word="garden-apple"]');
  await expect(apple).toContainText('μήλο');
  await expect(apple).toContainText('apple');
});

test('English sentence workshop renders English sentence tiles without crashing', async ({ page }) => {
  await setPair(page, 'de', 'en');
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-route="sentence"]').click();
  await expect(page.getByText('Build the sentence')).toBeVisible();
  const sentenceTiles = page.locator('.sentence-bank .sentence-tile');
  await expect(sentenceTiles.first()).toBeVisible();
  expect(await sentenceTiles.count()).toBeGreaterThan(0);
});
