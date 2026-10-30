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
test('확인창을 열면 폰 외부 시연 도구와 초기화도 비활성화한다', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'GS25 혜택 링크', exact: true }).click();
  await details(page);
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await expect(page.locator('.demo-tools')).toHaveAttribute('inert', '');
  await expect(page.locator('.preview-tools')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: '연결 유지하기', exact: true }).click();
  await expect(page.locator('.demo-tools')).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true })).toBeVisible();
});
test('날짜 변경 시 결제 행사도 같은 가맹점의 현재 행사로 전환, 초기화는 입력까지 복구', async ({ page }) => {
  await ready(page); await enable(page);
  await page.getByRole('tab', { name: '예외 상황', exact: true }).click();
  await page.getByRole('combobox', { name: '대상 행사', exact: true }).selectOption('gs25-202611');
  await page.getByRole('tab', { name: '행사 시점', exact: true }).click();
  await page.getByLabel('시연 날짜', { exact: true }).fill('2026-12-01');
  await page.getByRole('button', { name: '날짜 적용하기', exact: true }).click();
  await page.getByRole('tab', { name: '예외 상황', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '대상 행사', exact: true })).toHaveValue('gs25-202612');
  await page.getByRole('checkbox', { name: '다른 할인 함께 적용', exact: true }).check();
  await page.getByRole('button', { name: '다시 체험하기', exact: true }).click();
  await page.getByRole('tab', { name: '예외 상황', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '대상 행사', exact: true })).toHaveValue('starbucks-202611');
  await expect(page.getByRole('checkbox', { name: '다른 할인 함께 적용', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'LINK ON 시작', exact: true })).toBeVisible();
});

test('시연 설정은 키보드로 항목을 이동하고 모바일에서도 입력 상태를 보존한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  await page.getByLabel('자동 연결 한도', { exact: true }).fill('4');
  await page.getByRole('tab', { name: '맞춤 혜택 조건', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '행사 시점', exact: true })).toBeFocused();
  await expect(page.getByLabel('시연 날짜', { exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: '입력값 저장', exact: true })).toBeFocused();
  await expect(page.getByLabel('이메일', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: '예외 상황', exact: true })).toBeFocused();
  await expect(page.getByRole('combobox', { name: '대상 행사', exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.getByLabel('자동 연결 한도', { exact: true })).toHaveValue('4');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  const overflow = await page.locator('.demo-tools').evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(overflow).toBe(false);
});
