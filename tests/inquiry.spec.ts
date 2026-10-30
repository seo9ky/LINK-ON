import { test, expect } from '@playwright/test';

test('문의는 내용만 접수하며 중복 전송을 막고 성공 후 새 문의를 작성할 수 있다', async ({ page }) => {
  const requests: any[] = [];
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/inquiries', async route => {
    requests.push(route.request().postDataJSON());
    await pending;
    await route.fulfill({ status: 201, body: '' });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '문의하기', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '문의 보내기' })).toBeDisabled();
  await page.getByLabel('문의 내용', { exact: false }).fill('  혜택 이용에 관해 문의합니다.  ');
  await page.getByRole('button', { name: '문의 보내기' }).click();
  await expect(page.getByRole('button', { name: '보내는 중…' })).toBeDisabled();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toMatchObject({ message: '혜택 이용에 관해 문의합니다.', email: null });
  expect(requests[0].id).toMatch(/^[a-f0-9-]{36}$/);
  release();
  await expect(page.getByRole('heading', { name: '문의가 접수되었습니다.' })).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByRole('button', { name: '문의하기', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '문의하기', exact: true }).click();
  await expect(page.getByLabel('문의 내용', { exact: false })).toHaveValue('');
});

test('문의 접수 실패 시 내용과 요청 번호를 유지하고 재시도한다', async ({ page }) => {
  const requests: any[] = [];
  await page.route('**/rest/v1/inquiries', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: requests.length === 1 ? 503 : 409, contentType: 'application/json', body: JSON.stringify(requests.length === 1 ? {message:'unavailable'} : {code:'23505',message:'duplicate'}) });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '문의하기', exact: true }).click();
  await page.getByLabel('문의 내용', { exact: false }).fill('답변 부탁드립니다.');
  await page.getByLabel('답변받을 이메일', { exact: false }).fill('test@example.com');
  await page.getByRole('button', { name: '문의 보내기' }).click();
  await expect(page.getByRole('alert')).toContainText('접수를 확인하지 못했어요');
  await expect(page.getByLabel('문의 내용', { exact: false })).toHaveValue('답변 부탁드립니다.');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '문의하기', exact: true }).click();
  await expect(page.getByLabel('답변받을 이메일', { exact: false })).toHaveValue('test@example.com');
  await page.getByRole('button', { name: '문의 보내기' }).click();
  await expect(page.getByRole('heading', { name: '문의가 접수되었습니다.' })).toBeVisible();
  expect(requests[1]).toEqual(requests[0]);
});

test('모바일 문의 창은 가로 넘침이 없고 닫으면 앱 상태를 유지한다', async ({ page }) => {
  await page.setViewportSize({width:320,height:740});
  await page.goto('/');
  await page.getByRole('button', {name:'GS25 혜택 링크',exact:true}).click();
  await page.getByRole('button', {name:'문의하기',exact:true}).click();
  await expect(page.locator('.site-shell')).toHaveAttribute('inert','');
  const dialog = page.locator('.inquiry-dialog');
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.getByRole('button', {name:'문의 창 닫기',exact:true}).click();
  await expect(page.getByRole('heading',{name:'혜택을 직접 연결했어요'})).toBeVisible();
  await expect(page.locator('.site-shell')).not.toHaveAttribute('inert','');
});
