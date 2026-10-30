import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('.demo-tools > summary').click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
});

test('빈 입력 차단, trim된 값 1회 저장, 대기 상태 및 성공 안내', async ({ page }) => {
  let posts = 0;
  let complete!: () => void;
  const gate = new Promise<void>(resolve => { complete = resolve; });
  await page.route('**/rest/v1/input_db*', async route => {
    if (route.request().method() !== 'POST') throw new Error('Unexpected request');
    posts++;
    expect(route.request().postDataJSON()).toEqual({ input: 'LINK ON 저장 테스트' });
    expect(route.request().url()).not.toContain('select=');
    await gate;
    await route.fulfill({ status: 201, contentType: 'application/json', body: '' });
  });
  const input = page.getByLabel('저장할 내용', { exact: true });
  const submit = page.getByRole('button', { name: 'Supabase에 저장하기', exact: true });
  await expect(submit).toBeDisabled();
  await input.fill('   ');
  await expect(submit).toBeDisabled();
  await input.fill('  LINK ON 저장 테스트  ');
  await submit.click();
  await expect(page.getByRole('button', { name: '저장 중…', exact: true })).toBeDisabled();
  await expect(input).toBeDisabled();
  await expect.poll(() => posts).toBe(1);
  complete();
  await expect(page.getByRole('status')).toContainText('Supabase에 저장했어요.');
  await expect(input).toHaveValue('');
  await expect(submit).toBeDisabled();
  expect(posts).toBe(1);
});

test('RLS 오류에서는 입력 유지, 재시도 성공 후에만 초기화', async ({ page }) => {
  let posts = 0;
  await page.route('**/rest/v1/input_db*', async route => {
    posts++;
    await route.fulfill(posts === 1
      ? { status: 403, contentType: 'application/json', body: JSON.stringify({ code: '42501', message: 'row-level security policy' }) }
      : { status: 201, contentType: 'application/json', body: '' });
  });
  const input = page.getByLabel('저장할 내용', { exact: true });
  await input.fill('실패 후 재시도');
  await page.getByRole('button', { name: 'Supabase에 저장하기', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('INSERT 권한과 RLS 정책');
  await expect(input).toHaveValue('실패 후 재시도');
  await page.getByRole('button', { name: 'Supabase에 저장하기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Supabase에 저장했어요.');
  await expect(input).toHaveValue('');
  expect(posts).toBe(2);
});

test('모바일에서 폼이 넘치지 않고 내용과 입력 길이 제한 유지', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const input = page.getByLabel('저장할 내용', { exact: true });
  await input.fill('작성 중인 내용');
  await expect(input).toHaveAttribute('maxlength', '1000');
  await page.getByRole('tab', { name: '맞춤 혜택 조건', exact: true }).click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
  await expect(input).toHaveValue('작성 중인 내용');
  const box = await input.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});
