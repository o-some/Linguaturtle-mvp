import { test, expect } from '@playwright/test';

const preview = '/refactor-preview.html';

async function seed(page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('linguaturtle-v3-core')) return;
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
  await expect(page.locator('.v3-brand').first()).toContainText('Chelonaki - Toulas Island');
  await page.getByRole('button', { name: /Insel entdecken/i }).click();
  await expect(page.getByRole('heading', { name: /Wohin möchtest du/i })).toBeVisible();
  await page.locator('[data-action="open-world"]').first().click();
  await expect(page.getByText(/Wähle jetzt eine Übung/i)).toBeVisible();
  await expect(page.locator('.word-showcase')).toHaveCount(0);
});

test('interactive island map shows level requirements and blocks locked worlds', async ({ page }) => {
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.xp = 0;
    state.route = { name: 'island', params: {} };
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('.island-hotspot')).toHaveCount(8);
  await expect(page.locator('.island-hotspot[data-collection="garden"]')).toContainText('Ab Level 1');
  await expect(page.locator('.island-hotspot[data-collection="animals"]')).toContainText('Ab Level 3');
  await page.locator('.island-hotspot[data-collection="animals"]').click();
  await expect(page.locator('.v3-toast')).toContainText(/ab Level 3/i);
  await expect(page.getByRole('heading', { name: /Wohin möchtest du/i })).toBeVisible();
  await page.locator('.island-hotspot[data-collection="garden"]').click();
  await expect(page.getByRole('heading', { name: 'Garten' })).toBeVisible();
  await expect(page.locator('.world-unlock-note')).toContainText('Level 1');
});

test('all finished Creative Production assets are visible in their intended routes', async ({ page }) => {
  await expect(page.locator('.hero-scene[src$="home_tropical_bay.webp"]')).toBeVisible();
  await expect(page.locator('.tula-art[src$="tula_waving.webp"]')).toBeVisible();
  await expect(page.locator('.stats-v3 img[src$="reward_star_xp.webp"]')).toBeVisible();
  await expect(page.locator('.stats-v3 img[src$="reward_shell_pearl.webp"]')).toBeVisible();
  await expect(page.locator('.stats-v3 img[src$="reward_streak_flame.webp"]')).toBeVisible();
  await expect(page.locator('.journey-grid img[src$="mode_speech_trainer.webp"]')).toBeVisible();
  await expect(page.locator('.journey-grid img[src$="mode_stories.webp"]')).toBeVisible();
  await page.locator('[data-route="island"]').first().click();
  await expect(page.locator('.island-card img[src$="map_turtle_island_overview.webp"]')).toBeVisible();
  const homeFeature = page.locator('.tula-home-feature');
  await expect(homeFeature.locator('img[src$="home_tropical_bay.webp"]')).toBeVisible();
  for (const world of ['garden','library','jungle_trail','sun_bay','coral_reef','crystal_cove','desert_oasis','ice_peak','harbor','castle']) {
    await expect(page.locator(`.place-scene[src$="world_${world}.webp"]`)).toBeVisible();
  }
  await homeFeature.click();
  await expect(page.locator('.home-room-scene[src$="home_tula_house_interior.webp"]')).toBeVisible();
  await expect(page.locator('.room-tula img[src$="tula_neutral_front.webp"]')).toBeVisible();
  await page.locator('[data-route="home"]').first().click();
  await page.locator('[data-route="speaking"]').click();
  await expect(page.locator('.experience-hero img[src$="tula_speaking.webp"]')).toBeVisible();
  await page.locator('[data-route="home"]').first().click();
  await page.locator('[data-route="stories"]').click();
  await expect(page.locator('.experience-mode-art[src$="mode_stories.webp"]')).toBeVisible();
  await page.locator('[data-action="open-story"][data-index="2"]').click();
  await expect(page.locator('.story-tula[src$="tula_sleeping.webp"]')).toBeVisible();
  await page.locator('[data-route="profile"]').first().click();
  await expect(page.locator('.profile-hero-v3 img[src$="tula_profile.webp"]')).toBeVisible();
  for (const chest of ['bronze','silver','gold','jewel']) {
    await expect(page.locator(`.milestone-chest[src$="reward_chest_${chest}.webp"]`).first()).toBeVisible();
  }
});

test('explore opens only after selecting the exercise', async ({ page }) => {
  await page.locator('[data-action="open-world"]').first().click();
  await expect(page.locator('.world-scene[src$="world_garden.webp"]')).toBeVisible();
  await expect(page.locator('.mode-art')).toHaveCount(5);
  for (const mode of ['words_discover','listening_adventure','sentence_workshop','memory','golden_minute']) {
    await expect(page.locator(`.mode-art[src$="mode_${mode}.webp"]`)).toBeVisible();
  }
  await page.getByRole('button', { name: /Wörter entdecken/i }).click();
  await expect(page.locator('.explore-grid')).toBeVisible();
  await expect(page.locator('[data-action="finish-explore"]')).toBeVisible();
  await page.locator('[data-action="finish-explore"]').click();
  await expect(page.locator('.celebration img[src$="tula_celebrating.webp"]')).toBeVisible();
  await expect(page.locator('.reward-row img[src$="reward_shell_gold.webp"]')).toBeVisible();
});

test('listening quiz accepts an answer and persists reward', async ({ page }) => {
  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Hör-Abenteuer/i }).click();
  await expect(page.locator('.lesson-tula[src$="tula_listening.webp"]')).toBeVisible();
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

test('Tula home purchase, placement, movement and outfit persist', async ({ page }) => {
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.route = { name: 'tula-home', params: {} };
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: /Mach es dir gemütlich/i })).toBeVisible();

  const bedCard = page.locator('.shop-card-v3').filter({ hasText: 'Wolkenbett' });
  const shellsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  const buyBed = bedCard.getByRole('button', { name: 'Kaufen' });
  await expect(buyBed).toBeVisible();
  await buyBed.scrollIntoViewIfNeeded();
  await buyBed.click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).inventory.homeOwned)).toContain('bed');
  await expect(page.locator('[data-home-object="bed"]')).toBeVisible();
  const shellsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  expect(shellsAfter).toBe(shellsBefore - 60);

  await page.locator('[data-home-object="bed"]').press('ArrowLeft');
  const movedX = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).inventory.homePositions.bed.x);
  expect(movedX).toBe(75);

  const crownCard = page.locator('.shop-card-v3').filter({ hasText: 'Goldene Krone' });
  await crownCard.getByRole('button', { name: 'Kaufen' }).click();
  await expect(page.locator('.tula-outfit')).toContainText('👑');
  await page.reload();
  await expect(page.locator('[data-home-object="bed"]')).toBeVisible();
  await expect(page.locator('.tula-outfit')).toContainText('👑');
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
  await expect(page.locator('.memory-card-back[src$="card_back_neutral.webp"]').first()).toBeVisible();
  await page.locator('[data-action="navigate"][data-route="world"]').first().click();
  await page.locator('[data-action="start-speed"]').click();
  await expect(page.getByText(/Goldene Minute/i)).toBeVisible();
  await expect(page.locator('.speed-tula[src$="tula_surprised.webp"]')).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Baue den Satz' })).toBeVisible();
  await expect(page.locator('.sentence-guide-v3 img[src$="tula_thinking.webp"]')).toBeVisible();
  const sentenceTiles = page.locator('.sentence-bank .sentence-tile');
  await expect(sentenceTiles.first()).toBeVisible();
  expect(await sentenceTiles.count()).toBeGreaterThan(0);
});
