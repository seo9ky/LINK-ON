import { test, expect } from '@playwright/test';

test('업종 필터는 연결 상태를 바꾸지 않고 상세 왕복 뒤에도 선택을 유지한다', async ({ page }) => {
  await page.goto('/');
  const filter = page.getByRole('combobox', { name: '업종별 보기', exact: true });
  await expect(page.locator('.benefit-category .benefit')).toHaveCount(18);
  await filter.selectOption('마트 · 슈퍼 · 편의점');
  await expect(page.locator('.benefit-category .benefit')).toHaveCount(3);
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('0개');
  await page.getByRole('button', { name: 'CU 혜택 링크', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 메인으로', exact: true }).click();
  await expect(filter).toHaveValue('마트 · 슈퍼 · 편의점');
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('1개');
  await page.getByRole('button', { name: 'CU 연결 완료 · 상세 보기', exact: true }).click();
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 메인', exact: true }).click();
  await filter.selectOption('전체');
  await expect(page.locator('.benefit-category .benefit')).toHaveCount(18);
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('0개');
});
