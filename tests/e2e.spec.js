import { test, expect } from '@playwright/test';

// Unique learner name per test so lesson-unlock state starts clean.
function learner() {
  return 'pw_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
}

// Sign in through the onboarding modal, then land on the lessons view.
async function signIn(page, name) {
  await page.goto('/#/lessons');
  await expect(page.locator('#user-modal')).toBeVisible();
  await page.fill('#user-input', name);
  await page.click('#user-form button[type="submit"]');
  await expect(page.locator('#user-modal')).toBeHidden();
}

// Reconstruct the exact target string from the rendered character spans.
async function targetText(page) {
  return page.$$eval('#display span', (els) => els.map((e) => e.textContent).join(''));
}

test('speed test runs and records a result', async ({ page }) => {
  await signIn(page, learner());
  await page.click('[data-nav="test"]');

  await expect(page.locator('#display span').first()).toBeVisible();
  const text = await targetText(page);
  expect(text.length).toBeGreaterThan(20);

  await page.click('#input');
  await page.keyboard.type(text, { delay: 0 });

  await expect(page.locator('#result-modal')).toBeVisible();
  await expect(page.locator('#r-wpm')).not.toHaveText('0');
  // Percentile line is populated once the result is saved server-side.
  await expect(page.locator('#r-pct')).toContainText('%');
});

test('lessons list shows units, unlock gating and progress bar', async ({ page }) => {
  await signIn(page, learner());

  await expect(page.locator('.unit')).toHaveCount(5);
  await expect(page.locator('.lesson-card')).toHaveCount(20);
  await expect(page.locator('.course-progress')).toContainText('0/20 lessons complete');

  // First lesson unlocked, a later lesson locked.
  const first = page.locator('.lesson-card').first();
  await expect(first.locator('.lc-start')).toBeEnabled();
  await expect(page.locator('.lesson-card.locked')).not.toHaveCount(0);
});

test('on-screen keyboard highlights the next key with finger guidance', async ({ page }) => {
  await signIn(page, learner());
  await page.locator('.lesson-card').first().locator('a.lc-start').click();

  await expect(page.locator('.keyboard')).toBeVisible();
  await expect(page.locator('.kb-key.next')).toHaveCount(1);
  await expect(page.locator('#hint')).toContainText('Next:');
  await expect(page.locator('#hint')).toContainText('finger');
});

test('hand-placement guide is shown on the lessons page and in the player', async ({ page }) => {
  await signIn(page, learner());
  // Lessons page: collapsible primer with home-row chips.
  await expect(page.locator('.hg-details')).toContainText('place your hands');
  await expect(page.locator('.hand-guide .hg-key')).not.toHaveCount(0);

  // Player: full guide + finger legend.
  await page.locator('.lesson-card').first().locator('a.lc-start').click();
  await expect(page.locator('.hand-guide')).toBeVisible();
  await expect(page.locator('.hand-guide')).toContainText('A S D F');
  await expect(page.locator('.finger-legend')).toContainText('left index finger');
});

test('completing a lesson earns stars and unlocks the next', async ({ page }) => {
  const name = learner();
  await signIn(page, name);

  // Open the first lesson.
  await page.locator('.lesson-card').first().locator('a.lc-start').click();
  await expect(page.locator('.keyboard')).toBeVisible();

  const text = await targetText(page);
  expect(text.length).toBeGreaterThan(10);

  await page.click('#display');
  await page.keyboard.type(text, { delay: 0 });

  // Result modal: typing the exact target must score 100% accuracy -> 3 stars.
  await expect(page.locator('#lesson-result')).toBeVisible();
  await expect(page.locator('#lr-acc')).toHaveText('100%');
  await expect(page.locator('#lr-stars .star.filled')).toHaveCount(3);

  // Back to lessons (via URL — the result modal overlays the nav): first lesson
  // done, second unlocked.
  await page.goto('/#/lessons');
  await expect(page.locator('.lesson-card').first()).toHaveClass(/done/);
  await expect(page.locator('.lesson-card').nth(1).locator('.lc-start')).toBeEnabled();
});

test('progress persists across reloads for the same learner', async ({ page }) => {
  const name = learner();
  await signIn(page, name);

  await page.locator('.lesson-card').first().locator('a.lc-start').click();
  await expect(page.locator('.keyboard')).toBeVisible();
  const text = await targetText(page);
  await page.click('#display');
  await page.keyboard.type(text, { delay: 0 });
  await expect(page.locator('#lesson-result')).toBeVisible();

  // Reload the app entirely; localStorage keeps the learner, DB keeps progress.
  await page.goto('/#/lessons');
  await expect(page.locator('#user-modal')).toBeHidden();
  await expect(page.locator('.lesson-card').first()).toHaveClass(/done/);
  await expect(page.locator('.course-progress')).toContainText('1/20 lessons complete');
});
