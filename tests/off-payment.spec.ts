import { test, expect, type Page } from '@playwright/test';
async function enable(page: Page) {
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '동의하고 시작하기' }).click();
  await expect(page.getByText(/관심 업종과 체험용 소비 패턴/)).toBeVisible();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기' }).click();
}
for (const width of [320, 375, 1366]) test(`OFF ${width}: 기존 혜택으로 결제하고 자동 연결은 꺼진 상태로 유지`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 320 ? 740 : width === 375 ? 812 : 768 });
  await page.goto('/'); await enable(page);
  await page.getByRole('switch').click();
  await page.getByRole('dialog').getByRole('button', { name: '자동 연결 끄기', exact: true }).click();
  await expect(page.getByRole('button', { name: '결제 체험하기', exact: true })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: '스타벅스 혜택 상세', exact: true })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: '스타벅스 혜택 상세', exact: true })).toContainText('5,000원 이상 결제');
  await expect(page.getByRole('button', { name: '스타벅스 연결 유지 · 상세 보기', exact: true })).toBeVisible();
  const manual = page.getByRole('button', { name: '혜택 직접 고르기', exact: true });
  expect(await manual.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: `test-results/off-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await page.getByRole('button', { name: /원으로 결제 체험/ }).click();
  await page.getByRole('button', { name: '할인 결과 확인하기' }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
  await expect(page.getByText('체험일', { exact: true })).toBeVisible();
  await expect(page.locator('.footer-note')).toHaveText('결제 체험 · 실제 결제 없음');
  await expect(page.locator('.footer-note')).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'LINK 메인으로', exact: true }).click();
  await expect(page.getByRole('heading', { name: '자동 연결을 껐어요' })).toBeVisible();
  await expect(page.locator('.summary')).toContainText('1,000원');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('link-on-demo-v2')!));
  expect(state.enabled).toBe(false);
});
test('자동 연결 0개에서도 직접 LINK한 혜택으로 메인에서 결제 체험', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('자동 연결 한도', { exact: true }).fill('0');
  await page.getByRole('button', { name: '한도 적용하기' }).click();
  await enable(page);
  await expect(page.getByRole('button', { name: '결제 체험하기', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'GS25 혜택 링크', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 메인으로', exact: true }).click();
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await expect(page.getByLabel('결제할 가맹점')).toHaveValue('gs25-202611');
  await page.getByRole('button', { name: /원으로 결제 체험/ }).click();
  await page.getByRole('button', { name: '할인 결과 확인하기' }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
});
