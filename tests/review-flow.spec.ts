import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page) { await page.goto('/'); }
async function details(page: Page) { await page.getByRole('button', { name: 'GS25 혜택 상세', exact: true }).click(); }
async function enable(page: Page) {
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await page.getByRole('checkbox', { name: '[필수] 자동 LINK 이용에 동의합니다.', exact: true }).check();
  await page.getByRole('button', { name: '동의하고 시작하기', exact: true }).click();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기', exact: true }).click();
  await expect(page.getByRole('switch')).toBeChecked();
}
test('온보딩 중 새로고침은 동의로 돌아가며 다시 시작할 수 있다', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await page.getByRole('checkbox', { name: '[필수] 자동 LINK 이용에 동의합니다.', exact: true }).check();
  await page.getByRole('button', { name: '동의하고 시작하기', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'LINK ON 시작', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '동의하고 시작하기', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: '[필수] 자동 LINK 이용에 동의합니다.', exact: true }).check();
  await page.getByRole('button', { name: '동의하고 시작하기', exact: true }).click();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기', exact: true }).click();
  await expect(page.getByRole('switch')).toBeChecked();
});
test('확인창을 열면 폰 외부 시연 도구와 탐색도 비활성화한다', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'GS25 혜택 링크', exact: true }).click();
  await details(page);
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await expect(page.locator('.demo-tools')).toHaveAttribute('inert', '');
  await expect(page.locator('.site-header')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: '연결 유지하기', exact: true }).click();
  await expect(page.locator('.demo-tools')).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true })).toBeVisible();
});
test('날짜를 변경하면 새 행사를 보여주고 기존 결제는 보존한다', async ({ page }) => {
  await ready(page); await enable(page);
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await page.getByRole('button', { name: '이 금액으로 결제 체험', exact: true }).click();
  await page.getByRole('tab', { name: '행사 시점', exact: true }).click();
  await page.getByLabel('시연 날짜', { exact: true }).fill('2026-12-01');
  await page.getByRole('button', { name: '날짜 적용하기', exact: true }).click();
  await page.getByRole('button', { name: '할인 결과 확인하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
  await page.getByRole('button', { name: 'LINK 메인으로', exact: true }).click();
  await expect(page.getByRole('button', { name: '스타벅스 혜택 상세', exact: true })).toContainText('12.31');
});

test('시연 설정은 키보드로 항목을 이동하고 모바일에서도 입력 상태를 보존한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  await page.getByLabel('자동 연결 한도', { exact: true }).fill('4');
  await page.getByRole('tab', { name: '맞춤 혜택 조건', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '행사 시점', exact: true })).toBeFocused();
  await expect(page.getByLabel('시연 날짜', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '맞춤 혜택 조건', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByLabel('자동 연결 한도', { exact: true })).toHaveValue('4');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  const overflow = await page.locator('.demo-tools').evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(overflow).toBe(false);
});
