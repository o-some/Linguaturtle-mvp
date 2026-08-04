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
      inventory: { unlockedModes: ['sentence','memory','speed'], boosters: { doubleXp: 0, hints: 3, jumps: 1 }, claimedMilestones: [], dailyGoalClaimed: false },
      session: { activeGame: null, collectionId: 'garden', busy: false, error: null, rewardNotices: [], focusMilestone: null }
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

async function expectPair(page, source, target) {
  const chip = page.locator('.language-pair-chip');
  await expect(chip.locator(`img[src$="/${source}.svg"]`)).toBeVisible();
  await expect(chip.locator(`img[src$="/${target}.svg"]`)).toBeVisible();
  await expect(chip).toContainText(source.toUpperCase());
  await expect(chip).toContainText(target.toUpperCase());
}

test.beforeEach(async ({ page }) => {
  await seed(page);
  await page.goto(preview);
  await expect(page.locator('h1')).toContainText(/Hallo|Hola|Γεια/i);
});

test('home, island and learning world are separated', async ({ page }) => {
  await expect(page.locator('.v3-brand').first()).toContainText('Tulas Island');
  await expect(page).toHaveTitle('Tulas Island');
  await expect(page.locator('.home-goal-claim')).toHaveCount(0);
  await page.locator('[data-route="island"]').first().click();
  await expect(page.getByRole('heading', { name: /Wohin möchtest du/i })).toBeVisible();
  await page.locator('[data-action="open-world"]').first().click();
  await expect(page.getByText(/Sammle Meistersterne/i)).toBeVisible();
  await expect(page.locator('.word-showcase')).toHaveCount(0);
});

test('level 3 stays synchronized while XP remain hidden from the child UI', async ({ page }) => {
  await page.evaluate(async () => {
    const { currentDayKey, currentWeekKey } = await import('/src/v3/core/rewards.js');
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.xp = 250;
    state.progress.daily = 1;
    state.progress.dailyDate = currentDayKey();
    state.progress.weekly = { weekKey: currentWeekKey(), completed: 7 };
    state.route = { name: 'home', params: {} };
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();

  await expect(page.locator('.home-level-label')).toContainText('Level 3');
  await expect(page.locator('.home-level-value')).toHaveText('50%');
  await expect(page.locator('.home-level-track')).toHaveAttribute('aria-valuenow', '50');
  await expect(page.locator('.cinematic-home')).not.toContainText('XP');
  await expect(page.locator('.home-goal-bar')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('.home-weekly-track')).toHaveAttribute('aria-valuenow', '7');

  await page.locator('[data-route="profile"]').first().click();
  await expect(page.locator('.profile-hero-v3')).toContainText('Level 3 · 0 Meistersterne');
  await expect(page.locator('.progress-card .bar')).toHaveAttribute('aria-valuenow', '50');
  await expect(page.locator('.progress-card')).toContainText('Jedes Abenteuer bringt dich weiter');
  await expect(page.locator('.cinematic-profile')).not.toContainText('XP');

  await page.locator('[data-action="open-settings"]').click();
  await expect(page.locator('.parent-summary')).toContainText('3');
  await expect(page.locator('.parent-summary')).toContainText('250');

  await page.locator('[data-route="island"]').first().click();
  await expect(page.locator('.island-hotspot[data-collection="animals"]')).not.toHaveClass(/locked/);
  await expect(page.locator('.island-hotspot[data-collection="home"]')).toHaveClass(/locked/);
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
  await expect(page.locator('.island-hotspot[data-collection="library"]')).toContainText('Ab Level 2');
  await expect(page.locator('.island-hotspot[data-collection="animals"]')).toContainText('Ab Level 3');
  const hotspotBoxes = await page.locator('.island-hotspot').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, height: box.height };
  }));
  hotspotBoxes.forEach(box => expect(box.height).toBeGreaterThanOrEqual(44));
  for (let left = 0; left < hotspotBoxes.length; left += 1) {
    for (let right = left + 1; right < hotspotBoxes.length; right += 1) {
      const a = hotspotBoxes[left];
      const b = hotspotBoxes[right];
      const overlaps = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      expect(overlaps).toBe(false);
    }
  }
  await page.locator('.island-hotspot[data-collection="animals"]').click();
  await expect(page.locator('.v3-toast')).toContainText(/ab Level 3/i);
  await expect(page.getByRole('heading', { name: /Wohin möchtest du/i })).toBeVisible();
  await page.locator('.island-hotspot[data-collection="garden"]').click();
  await expect(page.getByRole('heading', { name: 'Garten' })).toBeVisible();
  await expect(page.locator('.world-unlock-note')).toContainText('Level 1');
});

test('all finished Creative Production assets are visible in their intended routes', async ({ page }) => {
  await expect(page.locator('.cinematic-home-bg[src$="home_cinematic_island.webp"]')).toBeVisible();
  await expect(page.locator('.cinematic-home-tula[src$="tula_waving.webp"]')).toBeVisible();
  await expect(page.locator('.home-goal-panel img[src$="reward_star_xp.webp"]')).toBeVisible();
  await expect(page.locator('.wallet-mini img[src$="reward_shell_pearl.webp"]')).toBeVisible();
  await expect(page.locator('.home-goal-panel img[src$="reward_streak_flame.webp"]')).toBeVisible();
  await page.locator('[data-route="island"]').first().click();
  await expect(page.locator('.cinematic-subpage-bg[src$="island_cinematic_map.webp"]')).toBeVisible();
  await expect(page.locator('.island-adventure-grid img[src$="mode_speech_trainer.webp"]')).toBeVisible();
  await expect(page.locator('.island-adventure-grid img[src$="mode_stories.webp"]')).toBeVisible();
  await expect(page.locator('.island-card img[src$="map_turtle_island_overview.webp"]')).toBeVisible();
  const homeFeature = page.locator('.tula-home-feature');
  await expect(homeFeature.locator('img[src$="home_tropical_bay.webp"]')).toBeVisible();
  for (const world of ['garden','library','jungle_trail','sun_bay','coral_reef','crystal_cove','desert_oasis','ice_peak','harbor','castle']) {
    await expect(page.locator(`.place-scene[src$="world_${world}.webp"]`)).toBeVisible();
  }
  await homeFeature.click();
  await expect(page.locator('.home-room-scene[src$="home_tula_house_interior.webp"]')).toBeVisible();
  await expect(page.locator('.room-tula img[src$="tula_neutral_front.webp"]')).toBeVisible();
  await page.locator('[data-route="island"]').first().click();
  await page.locator('[data-route="speaking"]').click();
  await expect(page.locator('.experience-hero img[src$="tula_speaking.webp"]')).toBeVisible();
  await page.locator('[data-route="island"]').first().click();
  await page.locator('[data-route="stories"]').click();
  await expect(page.locator('.experience-mode-art[src$="mode_stories.webp"]')).toBeVisible();
  await page.locator('[data-action="open-story"][data-index="2"]').click();
  await expect(page.locator('.story-tula[src$="tula_sleeping.webp"]')).toBeVisible();
  await page.locator('[data-route="profile"]').first().click();
  await expect(page.locator('.cinematic-subpage-bg[src$="profile_cinematic_sanctuary.webp"]')).toBeVisible();
  await expect(page.locator('.profile-hero-v3 img[src$="tula_profile.webp"]')).toBeVisible();
  for (const chest of ['bronze','silver','gold','jewel']) {
    await expect(page.locator(`.milestone-chest[src$="reward_chest_${chest}.webp"]`).first()).toBeVisible();
  }
  await page.locator('[data-route="words"]').first().click();
  await expect(page.locator('.cinematic-subpage-bg[src$="words_cinematic_library.webp"]')).toBeVisible();
  await page.locator('[data-route="shop"]').first().click();
  await expect(page.locator('.cinematic-subpage-bg[src$="shop_cinematic_boutique.webp"]')).toBeVisible();
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
  await expect(page.locator('.reward-row img[src$="reward_shell_pearl.webp"]')).toBeVisible();
});

test('mastery stars only improve, unlock at six and require a later day for the third star', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const {
      recordQuestCompletion, questStars, worldStarTotal, dungeonStatus,
    } = await import('/src/v3/core/master-stars.js');
    const firstDay = new Date(2026, 7, 4, 12);
    const nextDay = new Date(2026, 7, 5, 12);
    const explore = recordQuestCompletion({
      worldId: 'garden', questId: 'explore', accuracy: 1, allWordsHeard: true,
    }, firstDay);
    const duplicate = recordQuestCompletion({
      worldId: 'garden', questId: 'explore', accuracy: 1, allWordsHeard: true,
    }, firstDay);
    const poorLaterRun = recordQuestCompletion({
      worldId: 'garden', questId: 'explore', accuracy: 0, allWordsHeard: false,
    }, nextDay);
    const mastery = recordQuestCompletion({
      worldId: 'garden', questId: 'explore', accuracy: 1, allWordsHeard: true,
    }, nextDay);
    recordQuestCompletion({ worldId: 'garden', questId: 'listening', accuracy: .8 }, firstDay);
    const beforeUnlock = recordQuestCompletion({ worldId: 'garden', questId: 'sentence', accuracy: 0 }, firstDay);
    const unlock = recordQuestCompletion({ worldId: 'garden', questId: 'sentence', accuracy: .8 }, firstDay);
    return {
      explore, duplicate, poorLaterRun, mastery, beforeUnlock, unlock,
      exploreStars: questStars('garden', 'explore'),
      total: worldStarTotal('garden'),
      dungeon: dungeonStatus('garden'),
    };
  });

  expect(result.explore.questStars).toBe(2);
  expect(result.duplicate.starsGained).toBe(0);
  expect(result.poorLaterRun.questStars).toBe(2);
  expect(result.mastery.questStars).toBe(3);
  expect(result.exploreStars).toBe(3);
  expect(result.beforeUnlock.totalWorldStars).toBe(6);
  expect(result.beforeUnlock.dungeonUnlocked).toBe(true);
  expect(result.unlock.totalWorldStars).toBe(7);
  expect(result.unlock.dungeonUnlocked).toBe(false);
  expect(result.total).toBe(7);
  expect(result.dungeon.unlocked).toBe(true);
});

test('dungeon rewards are idempotent and secret states follow eight and nine stars', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { setState } = await import('/src/v3/core/store.js');
    const { recordDungeonCompletion, dungeonStatus } = await import('/src/v3/core/master-stars.js');
    const quest = earned => ({ earned, bestAccuracy: 1, completedAt: '2026-08-01T10:00:00.000Z', masteryConfirmedAt: earned === 3 ? '2026-08-02T10:00:00.000Z' : null });
    setState(draft => {
      draft.progress.stars.garden = { explore: quest(2), listening: quest(2), sentence: quest(2) };
      return draft;
    });
    const first = recordDungeonCompletion('garden', 88, new Date(2026, 7, 4, 12));
    const replay = recordDungeonCompletion('garden', 90, new Date(2026, 7, 4, 14));
    const duplicateReplay = recordDungeonCompletion('garden', 95, new Date(2026, 7, 4, 16));
    const nextDay = recordDungeonCompletion('garden', 96, new Date(2026, 7, 5, 12));
    setState(draft => {
      draft.progress.stars.garden.explore.earned = 3;
      draft.progress.stars.garden.listening.earned = 3;
      return draft;
    });
    const eight = dungeonStatus('garden');
    setState(draft => { draft.progress.stars.garden.sentence.earned = 3; return draft; });
    const nine = dungeonStatus('garden');
    return { first, replay, duplicateReplay, nextDay, eight, nine };
  });

  expect(result.first).toMatchObject({ firstClear: true, xp: 60, shells: 50 });
  expect(result.replay).toMatchObject({ dailyReplay: true, xp: 15, shells: 5 });
  expect(result.duplicateReplay).toMatchObject({ xp: 0, shells: 0 });
  expect(result.nextDay).toMatchObject({ dailyReplay: true, xp: 15, shells: 5 });
  expect(result.eight.secretAvailable).toBe(true);
  expect(result.eight.goldAvailable).toBe(false);
  expect(result.nine.goldAvailable).toBe(true);
});

test('the garden Star Dungeon runs through all three chambers and grants its relic', async ({ page }) => {
  await page.evaluate(async () => {
    const { recordQuestCompletion } = await import('/src/v3/core/master-stars.js');
    const day = new Date(2026, 7, 4, 12);
    recordQuestCompletion({ worldId: 'garden', questId: 'explore', accuracy: 1, allWordsHeard: true }, day);
    recordQuestCompletion({ worldId: 'garden', questId: 'listening', accuracy: 1 }, day);
    recordQuestCompletion({ worldId: 'garden', questId: 'sentence', accuracy: 1 }, day);
  });
  await page.locator('[data-route="island"]').first().click();
  await page.locator('[data-action="open-world"][data-collection="garden"]').first().click();
  await expect(page.locator('.star-gate.is-open')).toContainText('6/9');
  await page.locator('[data-action="open-star-dungeon"]').click();

  for (let index = 0; index < 3; index += 1) {
    const questionId = await page.locator('.dungeon-stage[data-question-id]').getAttribute('data-question-id');
    await page.locator(`[data-action="dungeon-echo-answer"][data-word="${questionId}"]`).click();
  }
  await expect(page.locator('.dungeon-rune')).toBeVisible();

  for (let round = 0; round < 2; round += 1) {
    const ids = await page.locator('.rune-prompt [data-word-id]').evaluateAll(nodes => nodes.map(node => node.dataset.wordId));
    for (const id of ids) await page.locator(`.rune-bank [data-word-id="${id}"]`).click();
    await page.locator('[data-action="dungeon-rune-check"]').click();
  }
  await expect(page.locator('.dungeon-guardian')).toBeVisible();

  for (let index = 0; index < 3; index += 1) {
    const questionId = await page.locator('.guardian-stage[data-question-id]').getAttribute('data-question-id');
    await page.locator(`[data-action="dungeon-guardian-answer"][data-word="${questionId}"]`).click();
  }

  await expect(page.locator('.dungeon-complete')).toBeVisible();
  await expect(page.locator('.dungeon-treasure')).toContainText('Sternensamen des Gartens');
  await expect(page.locator('.dungeon-reward-row')).toContainText('+50');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(state.inventory.relics).toContain('garden-star-relic');
  expect(state.inventory.homePlaced).toContain('garden-star-relic');
  expect(state.progress.dungeons.garden.firstClearedAt).toBeTruthy();
});

test('words area lists real words and unlocks one with the shared shell currency', async ({ page }) => {
  await page.locator('[data-route="words"]').first().click();
  await expect(page.getByRole('heading', { name: /Neue Wörter lernen/i })).toBeVisible();
  await expect(page.locator('.word-shop-card')).toHaveCount(18);
  await expect(page.locator('.word-shop-card').first()).toContainText(/manzana|Apfel/i);
  await expect(page.locator('.word-shop-card .word-buy').first().locator('img[src$="reward_shell_pearl.webp"]')).toBeVisible();

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  const lockedCard = page.locator('.word-shop-card.locked').first();
  const wordId = await lockedCard.getAttribute('data-word-card');
  await lockedCard.locator('[data-action="buy-word"]').click();
  await expect(page.locator(`[data-word-card="${wordId}"]`)).toHaveClass(/owned/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(stored.progress.shells).toBe(before - 1);
  expect(stored.inventory.unlockedWords).toContain(wordId);
  await expect(page.locator('.wallet-mini img[src$="reward_shell_pearl.webp"]')).toBeVisible();
});

test('language selector shows a flag for every available language', async ({ page }) => {
  await expectPair(page, 'de', 'es');
  await openLanguageSelector(page);
  for (const code of ['de', 'es', 'el', 'en']) {
    await expect(page.locator(`.language-option img[src$="/${code}.svg"]`).first()).toBeVisible();
  }
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
  await expect(page.locator('[data-action="buy-item"][data-item="sentence"]')).toHaveCount(0);
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
  await expect(page.locator('.profile-hero-v3 h1')).toContainText('Mia');
  await page.locator('[data-action="open-settings"]').click();
  await expect(page.getByText(/ELTERNBEREICH/i)).toBeVisible();
  await expect(page.getByText(/Elternkonto noch nicht verbunden/i)).toBeVisible();
});

test('guest progress stays local and only durable changes mark cloud sync dirty', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('linguaturtle-v3-sync-meta', JSON.stringify({
    ownerUserId: null,
    lastSyncedRevision: 0,
    dirty: false,
    authPromptDismissed: true,
  })));
  await page.locator('[data-route="profile"]').first().click();
  const afterNavigation = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-sync-meta') || 'null'));
  expect(afterNavigation?.dirty || false).toBe(false);

  await page.locator('[data-action="open-settings"]').click();
  const soundToggle = page.locator('[data-action="toggle-setting"][data-setting="sound"]');
  await soundToggle.click();

  const beforeReload = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('linguaturtle-v3-core')),
    meta: JSON.parse(localStorage.getItem('linguaturtle-v3-sync-meta')),
  }));
  expect(beforeReload.meta.dirty).toBe(true);
  expect(beforeReload.state.settings.sound).toBe(true);

  await page.reload();
  const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(afterReload.settings.sound).toBe(true);
  await expect(page.getByText(/Elternkonto noch nicht verbunden/i)).toBeVisible();
});

test('cloud serializer excludes route and active session data', async ({ page }) => {
  const payload = await page.evaluate(async () => {
    const { serializeDurableState } = await import('/src/v3/core/storage.js');
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.route = { name: 'speed', params: { test: true } };
    state.session.activeGame = 'speed';
    return serializeDurableState(state);
  });
  expect(payload.route).toBeUndefined();
  expect(payload.session).toBeUndefined();
  expect(payload.progress.xp).toBe(1200);
  expect(payload.profile.name).toBe('Mia');
});

test('cloud serializer excludes wallet and purchasable entitlements', async ({ page }) => {
  const payload = await page.evaluate(async () => {
    const { serializeDurableState } = await import('/src/v3/core/storage.js');
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.shells = 98765;
    state.inventory.unlockedModes = ['server-only-mode'];
    state.inventory.unlockedWords = ['server-only-word'];
    state.inventory.boosters = { doubleXp: 99 };
    state.inventory.homeOwned = ['server-only-home'];
    return serializeDurableState(state);
  });
  expect(payload.progress.shells).toBeUndefined();
  expect(payload.inventory.unlockedModes).toBeUndefined();
  expect(payload.inventory.unlockedWords).toBeUndefined();
  expect(payload.inventory.boosters).toBeUndefined();
  expect(payload.inventory.homeOwned).toBeUndefined();
});

test('cloud hydration cannot overwrite the economy cache', async ({ page }) => {
  const hydrated = await page.evaluate(async () => {
    const { initialState } = await import('/src/v3/core/store.js');
    const { hydrateDurableState } = await import('/src/v3/core/storage.js');
    const current = structuredClone(initialState);
    current.progress.shells = 777;
    current.inventory.unlockedModes = ['memory'];
    current.inventory.unlockedWords = ['garden-apple'];
    current.inventory.boosters.hints = 4;
    current.inventory.homeOwned = ['plant', 'bed'];
    return hydrateDurableState(current, {
      progress: { xp: 42, shells: 1 },
      inventory: {
        unlockedModes: ['speed'],
        unlockedWords: [],
        boosters: { hints: 0 },
        homeOwned: ['plant'],
      },
    }, initialState);
  });
  expect(hydrated.progress.xp).toBe(42);
  expect(hydrated.progress.shells).toBe(777);
  expect(hydrated.inventory.unlockedModes).toEqual(['memory']);
  expect(hydrated.inventory.unlockedWords).toEqual(['garden-apple']);
  expect(hydrated.inventory.boosters.hints).toBe(4);
  expect(hydrated.inventory.homeOwned).toEqual(['plant', 'bed']);
});

test('legacy 5000-shell test grant is reset and not imported', async ({ page }) => {
  const migrated = await page.evaluate(async () => {
    const { initialState } = await import('/src/v3/core/store.js');
    const { migrateStorage } = await import('/src/v3/core/storage.js');
    return migrateStorage({
      storageVersion: 2,
      testShellGrantVersion: 1,
      progress: { shells: 5000 },
    }, initialState);
  });
  expect(migrated.progress.shells).toBe(150);
  expect(migrated.testShellGrantVersion).toBeUndefined();
});

test('version 4 progress migrates discovered words into at most two explorer stars', async ({ page }) => {
  const migrated = await page.evaluate(async () => {
    const { initialState } = await import('/src/v3/core/store.js');
    const { migrateStorage, STORAGE_VERSION } = await import('/src/v3/core/storage.js');
    const state = migrateStorage({
      storageVersion: 4,
      updatedAt: Date.UTC(2026, 7, 3, 10),
      progress: { xp: 850, learned: { garden: 4, library: 1 } },
    }, initialState);
    return { state, version: STORAGE_VERSION };
  });
  expect(migrated.version).toBe(5);
  expect(migrated.state.progress.xp).toBe(850);
  expect(migrated.state.progress.stars.garden.explore.earned).toBe(2);
  expect(migrated.state.progress.stars.library.explore.earned).toBe(1);
  expect(migrated.state.progress.stars.garden.explore.masteryConfirmedAt).toBeNull();
});

test('browser shop contains neither real-money purchases nor ads', async ({ page }) => {
  await page.locator('[data-route="shop"]').first().click();
  await expect(page.locator('.mobile-shop-note')).toContainText(/weder Echtgeldkäufe noch Werbung/i);
  await expect(page.locator('.cinematic-shop')).not.toContainText('XP');
  await expect(page.locator('[data-action="purchase-shells"]')).toHaveCount(0);
  await expect(page.locator('[data-action="watch-rewarded-ad"]')).toHaveCount(0);
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
  await expectPair(page, 'de', 'el');
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
  await expect(page.getByRole('heading', { name: 'Γεια σου, Mia!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Συνέχισε' })).toBeVisible();
  await expectPair(page, 'el', 'es');
  await page.locator('[data-action="open-world"]').first().click();
  await page.locator('[data-route="explore"]').click();
  const apple = page.locator('[data-action="speak-word"][data-word="garden-apple"]');
  await expect(apple).toContainText('manzana');
  await expect(apple).toContainText('μήλο');
});

test('Deutsch to English shows English words and stores the pair', async ({ page }) => {
  await setPair(page, 'de', 'en');
  await expectPair(page, 'de', 'en');
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
  await expect(page.getByRole('heading', { name: 'Hello Mia!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue learning' })).toBeVisible();
  await expectPair(page, 'en', 'el');
  await page.getByRole('button', { name: 'Open island' }).click();
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

test('daily goal completion opens a claim modal and grants the daily treasure', async ({ page }) => {
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Wörter entdecken/i }).click();
  await page.locator('[data-action="finish-explore"]').click();

  const modal = page.locator('.reward-notice-modal[data-reward-notice="daily"]');
  await expect(modal.getByRole('heading', { name: /Tagesziel geschafft/i })).toBeVisible();
  await expect(modal.locator('img[src$="reward_chest_gold.webp"]')).toBeVisible();
  await expect(modal.locator('.reward-notice-close')).toHaveCount(0);
  await expect(modal.locator('.reward-notice-later')).toHaveCount(0);
  await modal.getByRole('button', { name: /Belohnung abholen/i }).click();

  await expect(modal).toHaveCount(0);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(after.progress.shells).toBe(before + 31);
  expect(after.inventory.dailyGoalClaimed).toBe(true);
});

test('a new calendar day resets the daily goal and advances the streak only once', async ({ page }) => {
  await page.evaluate(() => {
    const localKey = date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.daily = 3;
    state.progress.dailyDate = localKey(yesterday);
    state.progress.lastLearningDate = localKey(yesterday);
    state.progress.streak = 4;
    state.inventory.dailyGoalClaimed = true;
    state.session.rewardNotices = [{ type: 'daily', shells: 25 }];
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();

  await expect(page.locator('.home-goal-copy')).toContainText('0 / 3');
  await expect(page.locator('.home-goal-meta')).toContainText('4');
  await expect(page.locator('.reward-notice-modal[data-reward-notice="daily"]')).toHaveCount(0);
  const reset = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(reset.progress.daily).toBe(0);
  expect(reset.inventory.dailyGoalClaimed).toBe(false);

  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Wörter entdecken/i }).click();
  await page.locator('[data-action="finish-explore"]').click();
  let after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(after.progress.daily).toBe(1);
  expect(after.progress.streak).toBe(5);

  await page.evaluate(async () => {
    const { grantReward } = await import('/src/v3/core/rewards.js');
    grantReward({ xp: 1, shells: 0 });
  });
  after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(after.progress.daily).toBe(2);
  expect(after.progress.streak).toBe(5);
});

test('the streak expires after a missed calendar day', async ({ page }) => {
  await page.evaluate(() => {
    const localKey = date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const staleDay = new Date();
    staleDay.setDate(staleDay.getDate() - 2);
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.daily = 2;
    state.progress.dailyDate = localKey(staleDay);
    state.progress.lastLearningDate = localKey(staleDay);
    state.progress.streak = 8;
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(after.progress.daily).toBe(0);
  expect(after.progress.streak).toBe(0);
  await expect(page.locator('.home-goal-copy')).toContainText('0 / 3');
  await expect(page.locator('.home-goal-meta')).toContainText('0');
});

test('guest economy is preserved locally while an account wallet is active', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { getState, setState } = await import('/src/v3/core/store.js');
    const { preserveGuestEconomy, restoreGuestEconomy } = await import('/src/v3/core/economy.js');
    setState(draft => {
      draft.progress.shells = 777;
      draft.inventory.unlockedModes = ['memory'];
      draft.inventory.unlockedWords = ['apple'];
      draft.inventory.boosters.hints = 4;
      draft.inventory.homeOwned = ['plant', 'bed'];
      draft.inventory.relics = ['garden-star-relic'];
      draft.inventory.homePlaced = ['plant', 'bed', 'garden-star-relic'];
      return draft;
    });
    preserveGuestEconomy('parent-test');
    setState(draft => {
      draft.progress.shells = 150;
      draft.inventory.unlockedModes = [];
      draft.inventory.unlockedWords = [];
      draft.inventory.boosters.hints = 0;
      draft.inventory.homeOwned = ['plant'];
      draft.inventory.homePlaced = ['plant'];
      return draft;
    });
    restoreGuestEconomy();
    return getState();
  });

  expect(result.progress.shells).toBe(777);
  expect(result.inventory.unlockedModes).toContain('memory');
  expect(result.inventory.unlockedWords).toContain('apple');
  expect(result.inventory.boosters.hints).toBe(4);
  expect(result.inventory.homeOwned).toContain('bed');
  expect(result.inventory.homePlaced).toContain('garden-star-relic');
  expect(result.economy.guestSnapshot).toBeNull();
});

test('weekly goal opens a popup and grants 250 shells', async ({ page }) => {
  await page.evaluate(async () => {
    const { currentWeekKey, WEEKLY_GOAL_TARGET } = await import('/src/v3/core/rewards.js');
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.daily = 0;
    state.progress.weekly = { weekKey: currentWeekKey(), completed: WEEKLY_GOAL_TARGET - 1 };
    state.inventory.dailyGoalClaimed = true;
    state.inventory.weeklyGoalClaimed = false;
    state.session.rewardNotices = [];
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  await expect(page.locator('.home-weekly-goal')).toContainText('14/15');
  await expect(page.locator('.home-weekly-reward')).toContainText('+250');

  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Wörter entdecken/i }).click();
  await page.locator('[data-action="finish-explore"]').click();

  const modal = page.locator('.reward-notice-modal[data-reward-notice^="weekly-"]');
  await expect(modal.getByRole('heading', { name: /Wochenziel geschafft/i })).toBeVisible();
  await expect(modal).toContainText('+250');
  await modal.getByRole('button', { name: /Belohnung abholen/i }).click();

  await expect(modal).toHaveCount(0);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(after.progress.shells).toBe(before + 256);
  expect(after.progress.weekly.completed).toBe(15);
  expect(after.inventory.weeklyGoalClaimed).toBe(true);
});

test('reaching a milestone opens the profile reward path and allows claiming it', async ({ page }) => {
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('linguaturtle-v3-core'));
    state.progress.xp = 190;
    state.progress.daily = 0;
    state.inventory.claimedMilestones = [];
    state.inventory.dailyGoalClaimed = false;
    state.session.rewardNotices = [];
    state.session.focusMilestone = null;
    localStorage.setItem('linguaturtle-v3-core', JSON.stringify(state));
  });
  await page.reload();
  const shellsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')).progress.shells);
  await page.locator('[data-action="open-world"]').first().click();
  await page.getByRole('button', { name: /Wörter entdecken/i }).click();
  await page.locator('[data-action="finish-explore"]').click();

  const modal = page.locator('.reward-notice-modal[data-reward-notice="level-3"]');
  await expect(modal.getByRole('heading', { name: /Level 3 erreicht/i })).toBeVisible();
  await modal.getByRole('button', { name: /Zum Profil-Schatz/i }).click();

  const milestone = page.locator('[data-milestone="3"]');
  await expect(milestone).toHaveClass(/milestone-focus/);
  await milestone.getByRole('button', { name: /Abholen/i }).click();
  await expect(milestone).not.toHaveClass(/milestone-focus/);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('linguaturtle-v3-core')));
  expect(after.inventory.claimedMilestones).toContain(3);
  expect(after.progress.shells).toBe(shellsBefore + 36);
});
