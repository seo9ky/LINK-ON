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
for (const width of [1280, 1366]) test(`PC ${width}: 한도 설정은 폰보다 작고 적용 결과와 조절 버튼이 보인다`, async ({ page }) => {
  await page.setViewportSize({ width, height: 720 });await enable(page);
  const phone=await page.locator('.phone').boundingBox(), panel=await page.locator('.demo-tools').boundingBox();
  expect(panel!.height).toBeLessThan(phone!.height);expect(panel!.width).toBeLessThanOrEqual(280);
  await page.getByRole('button',{name:'한도 1개 늘리기'}).click();await page.getByRole('button',{name:'한도 적용하기'}).click();
  await expect(page.getByRole('status')).toContainText('1개 혜택을 추가 연결');
  await expect(page.getByRole('button',{name:'한도 1개 줄이기'})).toBeInViewport({ratio:1});
  await expect(page.getByRole('status')).toBeInViewport({ratio:1});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
for (const width of [375, 320]) test(`모바일 ${width}: 결과에서 앱으로 돌아가도 조건과 결제 기록은 유지된다`, async ({ page }) => {
  await page.setViewportSize({ width, height: 812 });
  await enable(page);
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await page.getByRole('button', { name: /원으로 결제 체험/ }).click();
  await page.getByLabel('자동 연결 한도',{exact:true}).fill('3');
  await page.getByRole('button',{name:'한도 적용하기'}).click();
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
  await page.getByRole('button', { name: '한도 적용하기' }).click();
  await expect(page.getByRole('status')).toContainText('동의하고 LINK ON을 시작');
  await page.getByRole('button', { name: '앱 화면으로 돌아가기' }).click();
  await expect(page.getByRole('button', { name: 'LINK ON 시작하기', exact: true })).toBeInViewport();
  expect((await saved(page)).optedIn).toBe(false);
});
