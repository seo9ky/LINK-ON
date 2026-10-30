import { test, expect } from '@playwright/test';
import { mockSignedIn } from './practice-auth-fixture';

const savedRow = { id: 8, input: '기존에 저장한 실습 문장', created_at: '2026-10-30T07:10:19+00:00' };

test.beforeEach(async ({ page }) => {
  await mockSignedIn(page);
  await page.route('**/rest/v1/input_db*', async route => {
    expect(route.request().method()).toBe('GET');
    const query = new URL(route.request().url()).searchParams;
    expect(query.get('select')).toBe('id,input,created_at');
    expect(query.get('order')).toBe('id.desc');
    expect(query.get('limit')).toBe('20');
    await route.fulfill({ json: [savedRow] });
  });
  await page.goto('/');
  await page.locator('.demo-tools > summary').click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
  await expect(page.getByRole('list', { name: '저장된 문장' })).toContainText(savedRow.input);
});

test('빈 입력 차단, trim된 값 1회 저장, 대기 상태 및 성공 안내', async ({ page }) => {
  let posts = 0;
  let complete!: () => void;
  const gate = new Promise<void>(resolve => { complete = resolve; });
  await page.route('**/rest/v1/input_db*', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [{ ...savedRow, id: 9, input: 'LINK ON 저장 테스트' }, savedRow] });
      return;
    }
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
  await expect(page.locator('.practice-form [role=status]')).toContainText('Supabase에 저장했어요.');
  await expect(page.getByRole('list', { name: '저장된 문장' }).getByRole('listitem').first()).toContainText('LINK ON 저장 테스트');
  await expect(input).toHaveValue('');
  await expect(submit).toBeDisabled();
  expect(posts).toBe(1);
});

test('RLS 오류에서는 입력 유지, 재시도 성공 후에만 초기화', async ({ page }) => {
  let posts = 0;
  await page.route('**/rest/v1/input_db*', async route => {
    if (route.request().method() === 'GET') return route.fallback();
    posts++;
    await route.fulfill(posts === 1
      ? { status: 403, contentType: 'application/json', body: JSON.stringify({ code: '42501', message: 'row-level security policy' }) }
      : { status: 201, contentType: 'application/json', body: '' });
  });
  const input = page.getByLabel('저장할 내용', { exact: true });
  await input.fill('실패 후 재시도');
  await page.getByRole('button', { name: 'Supabase에 저장하기', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('다시 로그인');
  await expect(input).toHaveValue('실패 후 재시도');
  await page.getByRole('button', { name: 'Supabase에 저장하기', exact: true }).click();
  await expect(page.locator('.practice-form [role=status]')).toContainText('Supabase에 저장했어요.');
  await expect(input).toHaveValue('');
  expect(posts).toBe(2);
});

test('모바일에서 폼이 넘치지 않고 내용과 입력 길이 제한 유지', async ({ page }) => {
  const longText = '<img src=x onerror=alert(1)>\n' + '긴문장'.repeat(300);
  await page.route('**/rest/v1/input_db*', route => route.fulfill({ json: [{ ...savedRow, input: longText }] }));
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
  const list = page.getByRole('list', { name: '저장된 문장' });
  await expect(list).toContainText(longText);
  await expect(list.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.reload();
  await page.locator('.demo-tools > summary').click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
  await expect(list).toContainText(longText);
});

test('조회 실패 시 기존 목록 보존, 새로고침으로 빈 목록 복구', async ({ page }) => {
  let reads = 0;
  await page.route('**/rest/v1/input_db*', route => {
    reads++;
    return route.fulfill(reads === 1
      ? { status: 403, json: { code: '42501' } }
      : { json: [] });
  });
  await page.getByRole('button', { name: '목록 새로고침' }).click();
  await expect(page.getByRole('alert')).toContainText('로그인 상태를 확인');
  await expect(page.getByRole('list', { name: '저장된 문장' })).toContainText(savedRow.input);
  await page.getByRole('button', { name: '목록 새로고침' }).click();
  await expect(page.getByText('아직 저장한 문장이 없어요. 위에서 첫 문장을 남겨보세요.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('list', { name: '저장된 문장' })).toHaveCount(0);
});

test('로그아웃하면 개인 목록과 입력 내용을 지우고 새로고침해도 비로그인 상태', async ({ page }) => {
  await page.getByLabel('저장할 내용', { exact: true }).fill('화면에서 지워야 하는 개인 초안');
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page.getByRole('button', { name: '이메일 로그인 링크 받기' })).toBeVisible();
  await expect(page.getByRole('list', { name: '저장된 문장' })).toHaveCount(0);
  await expect(page.getByText(savedRow.input)).toHaveCount(0);
  await page.reload();
  await page.locator('.demo-tools > summary').click();
  await page.getByRole('tab', { name: '입력값 저장', exact: true }).click();
  await expect(page.getByLabel('이메일', { exact: true })).toBeVisible();
  await expect(page.getByLabel('저장할 내용', { exact: true })).toHaveCount(0);
});

test('저장 후 목록 통신 실패는 저장 실패로 표시하지 않고 조회만 재시도', async ({ page }) => {
  let posts = 0;
  let offline = true;
  await page.route('**/rest/v1/input_db*', async route => {
    if (route.request().method() === 'POST') {
      posts++;
      return route.fulfill({ status: 201, body: '' });
    }
    if (offline) return route.abort('failed');
    return route.fulfill({ json: [{ ...savedRow, id: 9, input: '저장은 완료된 문장' }, savedRow] });
  });
  await page.getByLabel('저장할 내용', { exact: true }).fill('저장은 완료된 문장');
  await page.getByRole('button', { name: 'Supabase에 저장하기', exact: true }).click();
  await expect(page.locator('.practice-form [role=status]')).toContainText('Supabase에 저장했어요.');
  await expect(page.getByRole('alert')).toContainText('목록을 불러오지 못했어요.', { timeout: 20000 });
  await expect(page.getByLabel('저장할 내용', { exact: true })).toHaveValue('');
  offline = false;
  await page.getByRole('button', { name: '목록 새로고침' }).click();
  await expect(page.getByRole('list', { name: '저장된 문장' })).toContainText('저장은 완료된 문장');
  expect(posts).toBe(1);
});

test('늦게 도착한 이전 조회 결과가 저장 후 목록을 덮어쓰지 않는다', async ({ page }) => {
  let reads = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/input_db*', async route => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 201, body: '' });
    reads++;
    if (reads === 1) {
      await gate;
      await route.fulfill({ json: [savedRow] });
    } else await route.fulfill({ json: [{ ...savedRow, id: 9, input: '더 최신 문장' }, savedRow] });
  });
  await page.getByRole('button', { name: '목록 새로고침' }).click();
  await expect(page.getByRole('button', { name: '목록 새로고침' })).toBeDisabled();
  await expect.poll(() => reads).toBe(1);
  await page.getByLabel('저장할 내용', { exact: true }).fill('더 최신 문장');
  await page.getByRole('button', { name: 'Supabase에 저장하기', exact: true }).click();
  const latest = page.getByRole('list', { name: '저장된 문장' }).getByRole('listitem').first();
  await expect(latest).toContainText('더 최신 문장');
  release();
  await expect(latest).toContainText('더 최신 문장');
});
