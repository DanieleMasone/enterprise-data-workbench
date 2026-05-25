import { expect, test, type Page } from '@playwright/test';

const appPath = process.env.VITE_BASE_PATH ?? '/enterprise-data-workbench/';

function collectCriticalBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function openWorkbench(page: Page): Promise<void> {
  await page.goto(appPath);
  await expect(page.getByRole('heading', { name: 'Enterprise Data Workbench' })).toBeVisible();
}

test('loads the portfolio shell and exposes stable project links', async ({ page }) => {
  const criticalErrors = collectCriticalBrowserErrors(page);

  await openWorkbench(page);

  await expect(
    page.getByRole('heading', {
      name: 'A local-first enterprise data surface with visible state mechanics.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Data-heavy workbench' })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Workbench views' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub: Source repository' })).toHaveAttribute(
    'href',
    'https://github.com/danielemasone/enterprise-data-workbench',
  );
  await expect(page.getByRole('link', { name: 'TypeDoc: Generated API docs' })).toHaveAttribute(
    'href',
    `${appPath}docs/`,
  );
  await expect(page.getByRole('link', { name: 'Coverage: Generated test report' })).toHaveAttribute(
    'href',
    `${appPath}coverage/`,
  );

  const inertLinks = await page.locator('a').evaluateAll((links) =>
    links
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.length === 0 || href === '#'),
  );
  expect(inertLinks).toEqual([]);
  expect(criticalErrors).toEqual([]);
});

test('toggles dark mode and persists the chosen theme after reload', async ({ page }) => {
  await openWorkbench(page);

  const appShell = page.locator('.app-shell');
  const initialTheme = await appShell.getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();

  await expect(appShell).not.toHaveAttribute('data-theme', initialTheme ?? '');
  const chosenTheme = await appShell.getAttribute('data-theme');

  await page.reload();

  await expect(appShell).toHaveAttribute('data-theme', chosenTheme ?? '');
});

test('switches Table, Kanban and Calendar as accessible workbench tabs', async ({ page }) => {
  await openWorkbench(page);

  const tableTab = page.getByRole('tab', { name: 'Table' });
  const kanbanTab = page.getByRole('tab', { name: 'Kanban' });
  const calendarTab = page.getByRole('tab', { name: 'Calendar' });

  await expect(tableTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Table' })).toBeVisible();
  await expect(page.getByRole('grid')).toBeVisible();

  await kanbanTab.click();

  await expect(kanbanTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Kanban view')).toBeVisible();
  await expect(page.getByRole('grid')).toBeHidden();

  await calendarTab.click();

  await expect(calendarTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Calendar view')).toBeVisible();
  await expect(page.getByText('Analytics warehouse migration')).toBeVisible();
});

test('supports table editing, selection, sorting and sync inspection on desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-mobile', 'Dense table edit flow is covered on desktop.');
  await openWorkbench(page);

  await page.getByRole('checkbox', { name: 'Select Revenue cockpit dashboard' }).check();
  await expect(page.getByText('1 selected')).toBeVisible();

  await page.getByRole('gridcell', { name: 'Jon' }).dblclick();
  await page.getByLabel('Edit cell').fill('E2E Owner');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('gridcell', { name: 'E2E Owner' })).toBeVisible();
  await expect(page.getByLabel('1 pending operations')).toBeVisible();
  await expect(page.getByLabel('Operation log')).toContainText('cell.update');

  await page.getByRole('button', { name: 'Sort by Estimate' }).click();

  await expect(page.getByRole('button', { name: 'Sort by Estimate' })).toBeVisible();
});

test('opens the command palette from the keyboard and executes a view command', async ({ page }) => {
  await openWorkbench(page);

  await page.keyboard.press('Control+K');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  await expect(page.getByLabel('Search commands')).toBeFocused();
  await expect(page.getByRole('option', { name: 'Open calendar view' })).toBeVisible();

  await page.getByLabel('Search commands').fill('kanban');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('tab', { name: 'Kanban' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();

  await page.keyboard.press('Control+K');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();
});

test('syncs a pending edit, simulates a conflict and resolves it on desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-mobile', 'Conflict resolution detail is covered on desktop.');
  await openWorkbench(page);

  await page.getByRole('gridcell', { name: 'Maya' }).dblclick();
  await page.getByLabel('Edit cell').fill('E2E Sync Owner');
  await page.keyboard.press('Enter');

  await expect(page.getByLabel('1 pending operations')).toBeVisible();
  await page.getByRole('button', { name: 'Sync' }).click();
  await expect(page.getByLabel('0 pending operations')).toBeVisible();
  await expect(page.getByLabel('Operation log')).toContainText('acknowledged');

  await page.getByRole('button', { name: 'Conflict' }).click();

  await expect(page.getByLabel('Conflicts')).toContainText('Remote collaborator value');
  await page.getByRole('button', { name: 'Remote' }).click();
  await expect(page.getByLabel('Conflicts')).toContainText('No open conflicts');
});

test('keeps the mobile shell usable without page-level horizontal overflow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile layout is covered by the mobile project.');
  await openWorkbench(page);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible();
  await page.getByRole('tab', { name: 'Kanban' }).click();
  await expect(page.getByRole('tab', { name: 'Kanban' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Calendar' }).click();
  await expect(page.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-theme', /dark|light/);
  await expect(page.getByRole('link', { name: 'Coverage: Generated test report' })).toBeVisible();
});
