import { test, expect, type Page } from '@playwright/test';
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('link-on-demo-v2')!));
async function enable(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '동의하고 시작하기' }).click();
  await expect(page.locator('.content')).toContainText('혜택을 받고 싶은');
  await page.getByRole('button', { name: '저장하고 혜택 확인하기' }).click();
}
for (const width of [1280, 1366]) test(`PC ${width}: 적용 결과를 본 뒤에도 탭 전체가 보이고 클릭된다`, async ({ page }) => {
  await page.setViewportSize({ width, height: 720 });
  await enable(page);
  const before = await saved(page);
  await page.locator('.settings-industry-grid').getByRole('button', { name: '건강 · 화장품', exact: true }).click();
  await page.getByRole('button', { name: '조건 적용하기' }).click();
  await expect(page.getByRole('status')).toContainText('체험 조건을 저장했어요');
  await expect(page.getByRole('status')).toContainText('다음 혜택 선정에 반영');
  const after = await saved(page);
  expect(after.connections).toEqual(before.connections);
  expect(after.interests).toEqual(before.interests);
  expect(after.patterns).toContain('건강 · 화장품');
  const tab = page.getByRole('tab', { name: '다음 달 체험하기' });
  await expect(tab).toBeInViewport({ ratio: 1 });
  expect(await tab.evaluate(el => { const r = el.getBoundingClientRect(); return [2, r.height / 2, r.height - 2].every(y => el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + y))); })).toBe(true);
  await tab.click();
  await expect(page.getByRole('tabpanel')).toContainText('11월·12월');
  await page.getByRole('button', { name: '다음 달로 이동' }).click();
  await expect(page.getByRole('status')).toContainText('12월 체험으로 바뀌었어요');
  await expect(page.getByRole('status')).toContainText('11월 혜택 2개가 만료');
  await expect(page.getByRole('status')).toContainText('12월 혜택 2개를 새로 연결');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
for (const width of [375, 320]) test(`모바일 ${width}: 결과에서 앱으로 돌아가도 조건과 결제 기록은 유지된다`, async ({ page }) => {
  await page.setViewportSize({ width, height: 812 });
  await enable(page);
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await page.getByRole('button', { name: /원으로 결제 체험/ }).click();
  await page.getByRole('tab', { name: '다음 달 체험하기' }).click();
  await page.getByRole('button', { name: '다음 달로 이동' }).click();
  const before = await saved(page);
  expect(before.payments).toHaveLength(1);
  await page.getByRole('button', { name: '연결된 혜택 보기' }).click();
  await expect(page.locator('.phone')).toHaveAttribute('data-screen', '/');
  await expect(page.locator('.navigation h1')).toBeFocused();
  await expect(page.getByRole('heading', { name: '자동으로 연결된 혜택' })).toBeInViewport();
  expect(await saved(page)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('미동의 결과에서 앱으로 돌아가도 자동 동의하거나 켜지지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/');
  await page.getByRole('button', { name: '조건 적용하기' }).click();
  await expect(page.getByRole('status')).toContainText('동의하고 LINK ON을 시작');
  await page.getByRole('button', { name: '앱 화면으로 돌아가기' }).click();
  await expect(page.getByRole('button', { name: 'LINK ON 시작하기', exact: true })).toBeInViewport();
  expect((await saved(page)).optedIn).toBe(false);
});
