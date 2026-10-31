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
test('한도를 변경해도 기존 결제 판정은 보존한다', async ({ page }) => {
  await ready(page); await enable(page);
  await page.getByRole('button', { name: '결제 체험하기', exact: true }).click();
  await page.getByRole('button', { name: /원으로 결제 체험/, exact: true }).click();
  await page.getByLabel('자동 연결 한도',{exact:true}).fill('4');
  await page.getByRole('button',{name:'한도 적용하기'}).click();
  await page.getByRole('button', { name: '할인 결과 확인하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1,000원 할인 적용' })).toBeVisible();
  await page.getByRole('button', { name: 'LINK 메인으로', exact: true }).click();
  await expect(page.getByRole('button', { name: '스타벅스 혜택 상세', exact: true })).toContainText('11.30');
});

test('한도는 모바일에서 키보드로 적용할 수 있고 가로 넘침이 없다', async ({ page }) => {
 await page.setViewportSize({width:375,height:812});await ready(page);
 const input=page.getByLabel('자동 연결 한도',{exact:true});await input.fill('4');await input.press('Enter');
 await expect(page.getByRole('status')).toContainText('한도를 적용했어요');await page.reload();await expect(input).toHaveValue('4');
 expect(await page.locator('.demo-tools').evaluate(el=>el.scrollWidth>el.clientWidth+1)).toBe(false);
});
