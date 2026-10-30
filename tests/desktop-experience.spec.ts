import { test, expect } from '@playwright/test';

test('노트북에서 폰과 설정을 나란히 보여주고 선택 컨트롤에 반응한다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '시연 설정', exact: true })).toBeVisible();
  const phone = await page.locator('.phone').boundingBox();
  expect(Math.abs(phone!.y + phone!.height / 2 - 360)).toBeLessThan(30);
  const side = await page.locator('.experience-tools').boundingBox();
  const brand = await page.locator('.brand-signature').boundingBox();
  expect(brand!.x + brand!.width).toBeLessThan(phone!.x);
  expect(phone!.width).toBeGreaterThan(260);
  await expect(page.getByRole('button', { name: '원본 크기로 보기', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '다시 체험하기', exact: true })).toHaveCount(0);
  await expect(page.locator('.settings-tabs [role=tab]')).toHaveCount(2);
  await expect(page.locator('.demo-tools summary')).toHaveCount(0);
  expect(phone!.y + phone!.height).toBeLessThanOrEqual(720);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(720);
  expect(side!.x).toBeGreaterThan(phone!.x + phone!.width);
  const pattern = page.getByRole('combobox', { name: '이용 패턴', exact: true });
  const arrow = page.locator('.settings-fields label').filter({ hasText: '이용 패턴' }).locator('.select-indicator');
  const before = await arrow.evaluate(el => getComputedStyle(el).backgroundColor);
  const field = await pattern.boundingBox();
  await pattern.hover({ position: { x: field!.width - 26, y: field!.height / 2 } });
  await expect.poll(() => arrow.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(before);
  await pattern.selectOption('패션 · 스타일');
  await expect(pattern).toHaveValue('패션 · 스타일');
  await pattern.focus();
  await expect(pattern).toBeFocused();
  await page.getByRole('tab', { name: '행사 시점', exact: true }).click();
  await page.getByLabel('시연 날짜', { exact: true }).fill('2026-12-01');
  await expect(page.getByLabel('시연 날짜', { exact: true })).toHaveValue('2026-12-01');
});

test('앱 버튼의 호버·누름 피드백과 화면 이동이 함께 작동한다', async ({ page }) => {
  await page.goto('/');
  const start = page.getByRole('button', { name: 'LINK ON 시작하기', exact: true });
  const initial = await start.evaluate(el => getComputedStyle(el).filter);
  await start.hover();
  await expect.poll(() => start.evaluate(el => getComputedStyle(el).filter)).not.toBe(initial);
  await page.mouse.down();
  await expect.poll(() => start.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'LINK ON 시작', exact: true })).toBeVisible();
  const consent = page.getByRole('checkbox', { name: '[필수] 자동 LINK 이용에 동의합니다.', exact: true });
  await consent.check();
  await page.mouse.move(0, 0);
  await expect(consent).toHaveCSS('background-color', 'rgb(22, 119, 255)');
  await consent.hover();
  await expect(consent).toHaveCSS('background-color', 'rgb(22, 119, 255)');
  await expect(consent).toBeChecked();
  const card = page.locator('.service-info');
  const staticShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
  await card.hover();
  await expect(card).toHaveCSS('box-shadow', staticShadow);
  const back = page.getByRole('button', { name: '뒤로', exact: true });
  await back.hover();
  await page.mouse.down();
  await expect(back).toHaveCSS('transform', 'none');
  await page.mouse.up();
});

test('화면 폭에 따라 3열·2열·세로 배치로 바뀌며 가로 넘침 없이 폰 비율을 유지한다', async ({ page }) => {
  for (const [width, height] of [[1200, 900], [1366, 768], [1920, 1080], [1024, 768], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'LINK ON 시작하기', exact: true })).toBeInViewport({ ratio: 1 });
    const brand = await page.locator('.brand-signature').boundingBox();
    const phone = await page.locator('.phone').boundingBox();
    if (width >= 1200) expect(brand!.x + brand!.width).toBeLessThan(phone!.x);
    else expect(brand!.y + brand!.height).toBeLessThanOrEqual(phone!.y);
    if (width > 560) expect(phone!.height / phone!.width).toBeCloseTo(956 / 440, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test('동작 줄이기 설정에서는 버튼 크기를 움직이지 않는다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'LINK ON 시작하기', exact: true });
  await start.hover();
  await page.mouse.down();
  await expect(start).toHaveCSS('transform', 'none');
  await expect(start).toHaveCSS('transition-duration', '0s');
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'LINK ON 시작', exact: true })).toBeVisible();
});

test('관리와 상세 이동 버튼은 동일한 반응 영역을 사용한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '동의하고 시작하기' }).click();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기' }).click();
  const buttons = [page.locator('.inline-nav'), page.locator('.benefit-action.detail').first()];
  const styles = [];
  for (const button of buttons) {
    await button.hover();
    await expect.poll(() => button.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(await page.locator(':root').evaluate(el => getComputedStyle(el).getPropertyValue('--tint').trim()).then(hex => { const match = hex.replace('#',''); return `rgb(${parseInt(match.slice(0,2),16)}, ${parseInt(match.slice(2,4),16)}, ${parseInt(match.slice(4,6),16)})`; }));
    styles.push(await button.evaluate(el => { const c = getComputedStyle(el); return [c.width,c.height,c.borderRadius,c.padding,c.gap]; }));
  }
  expect(styles[0]).toEqual(styles[1]);
  await buttons[1].click();
  await expect(page.getByRole('button', { name: '이 혜택 제외하기', exact: true })).toBeVisible();
});
