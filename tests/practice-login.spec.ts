import { test, expect } from '@playwright/test';
import { storageKey, testSession } from './practice-auth-fixture';

test('로그인 전에는 문장을 요청하지 않고 이메일 링크를 중복 발송하지 않는다', async ({ page }) => {
  let reads = 0;
  let sends = 0;
  await page.route('**/rest/v1/input_db*', route => { reads++; return route.fulfill({ json: [] }); });
  await page.route('**/auth/v1/otp*', async route => {
    sends++;
    expect(route.request().postDataJSON().email).toBe('practice@example.test');
    expect(route.request().postDataJSON().code_challenge_method).toBe('s256');
    await route.fulfill({ json: {} });
  });
  await page.goto('/');
  await page.locator('.demo-tools > summary').click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
  await page.getByLabel('이메일', { exact: true }).fill('practice@example.test');
  await page.getByRole('button', { name: '이메일 로그인 링크 받기' }).click();
  await expect(page.getByRole('status')).toContainText('로그인 링크를 보냈어요');
  await expect(page.getByRole('button', { name: /초 후 다시 받기/ })).toBeDisabled();
  expect(sends).toBe(1);
  expect(reads).toBe(0);
  await expect(page.getByLabel('저장할 내용', { exact: true })).toHaveCount(0);
});

test('메일 발송 오류는 주소를 유지하고 로그인 성공으로 표시하지 않는다', async ({ page }) => {
  await page.route('**/auth/v1/otp*', route => route.fulfill({ status: 429, json: { code: 'over_email_send_rate_limit', msg: 'rate limit' } }));
  await page.goto('/');
  await page.locator('.demo-tools > summary').click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
  await page.getByLabel('이메일', { exact: true }).fill('practice@example.test');
  await page.getByRole('button', { name: '이메일 로그인 링크 받기' }).click();
  await expect(page.getByRole('alert')).toContainText('인증 요청이 많아요');
  await expect(page.getByLabel('이메일', { exact: true })).toHaveValue('practice@example.test');
  await expect(page.getByRole('heading', { name: '내가 저장한 문장' })).toHaveCount(0);
});

test('메일 복귀 시 PKCE 인증을 마치고 개인 목록을 자동으로 연다', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key + '-code-verifier', JSON.stringify('test-verifier')), storageKey);
  await page.route('**/auth/v1/token*', async route => {
    expect(new URL(route.request().url()).searchParams.get('grant_type')).toBe('pkce');
    expect(route.request().postDataJSON().auth_code).toBe('test-callback-code');
    await route.fulfill({ json: testSession() });
  });
  await page.route('**/rest/v1/input_db*', route => route.fulfill({ json: [] }));
  await page.goto('/?code=test-callback-code');
  await expect(page.getByRole('tab', { name: '입력값 저장' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '내가 저장한 문장' })).toBeVisible();
  await expect(page.getByText('아직 저장한 문장이 없어요. 위에서 첫 문장을 남겨보세요.')).toBeVisible();
  await expect(page).not.toHaveURL(/code=/);
});
