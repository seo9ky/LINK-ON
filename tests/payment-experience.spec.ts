import { test, expect } from '@playwright/test';

test('QR 첫 방문에서 화면 안의 안내만으로 자동 연결과 할인 적용을 체험한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'LINK ON 시작하기', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '동의하고 시작하기' }).click();
  await expect(page.getByText(/체험용으로 2개 업종/)).toBeVisible();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기' }).click();
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await expect(page.getByLabel('결제할 가맹점')).toHaveValue('starbucks-202611');
  await page.getByRole('button', { name: /원으로 결제 체험/, exact: true }).click();
  await expect(page.getByRole('tab', { name: '확인 중', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: '할인 결과 확인하기', exact: true })).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: '할인 결과 확인하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
  await page.getByRole('button', { name: 'LINK 메인으로', exact: true }).click();
  await expect(page.locator('.summary')).toContainText('1,000원');
  await expect(page.getByRole('button', { name: '스타벅스 혜택 상세', exact: true })).toContainText('이용 완료');
  await page.getByRole('button', { name: '스타벅스 이용 결과 보기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '자동 연결 한도 체험', exact: true })).toBeVisible();
});

test('결제 체험은 최소 금액 미충족을 안내하고 같은 혜택을 조건에 맞게 재시도할 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'GS25 혜택 링크', exact: true }).click();
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await expect(page.getByLabel('결제할 가맹점')).toHaveValue('gs25-202611');
  await page.getByLabel('결제금액 (원)', { exact: true }).first().fill('1000');
  await page.getByRole('button', { name: /원으로 결제 체험/, exact: true }).click();
  await page.getByRole('button', { name: '할인 결과 확인하기', exact: true }).click();
  await expect(page.getByText('최소 결제금액을 충족하지 않았어요.')).toBeVisible();
  await page.getByRole('button', { name: '금액 바꿔 다시 체험하기', exact: true }).click();
  await expect(page.getByLabel('결제할 가맹점')).toHaveValue('gs25-202611');
  await page.getByRole('button', { name: /원으로 결제 체험/, exact: true }).click();
  await page.getByRole('button', { name: '할인 결과 확인하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
});

test('PC에서 폰 비율을 유지하며 화면 높이에 맞춘다', async ({ page }) => {
  for (const height of [720, 900]) {
    await page.setViewportSize({ width: 1280, height });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'LINK ON 시작하기', exact: true })).toBeInViewport({ ratio: 1 });
    const phone = await page.locator('.phone').boundingBox();
    expect(phone!.height / phone!.width).toBeCloseTo(956 / 440, 2);
    expect(phone!.y + phone!.height).toBeLessThan(height);
  }
});
