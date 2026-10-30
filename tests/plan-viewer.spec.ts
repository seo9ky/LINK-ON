import { test, expect } from '@playwright/test';

test('기획서 8장을 순서대로 스크롤하고 닫으면 앱 상태와 포커스를 유지한다', async ({ page }) => {
  await page.setViewportSize({ width:1366, height:768 });
  await page.goto('/');
  await expect(page.getByText('기반 서비스', { exact:true })).toHaveCount(0);
  await page.getByRole('button', { name:'GS25 혜택 링크', exact:true }).click();
  const route=page.url();
  await page.getByRole('button', { name:'기획서', exact:true }).click();
  const viewer=page.getByRole('dialog', { name:'LINK ON 기획서' });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('figure')).toHaveCount(8);
  await expect(page.locator('.site-shell')).toHaveAttribute('inert','');
  for(let i=0;i<8;i++) {
    const img=viewer.locator('figure img').nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete && el.naturalWidth===1920)).toBe(true);
    await expect(viewer.locator('figcaption').nth(i)).toContainText(`${String(i+1).padStart(2,'0')} / 08`);
  }
  expect(await viewer.locator('.plan-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
  await expect(page).toHaveURL(route);
  await expect(page.getByRole('heading', {name:'혜택을 직접 연결했어요'})).toBeVisible();
  await expect(page.getByRole('button', {name:'기획서',exact:true})).toBeFocused();
  await page.getByRole('button', {name:'기획서',exact:true}).click();
  await expect(page.getByRole('region',{name:'기획서 슬라이드'})).toBeFocused();
  expect(await page.locator('.plan-scroll').evaluate(el=>el.scrollTop)).toBe(0);
  await page.keyboard.press('PageDown');
  await expect.poll(()=>page.locator('.plan-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'기획서 닫기'}).click();
});

test('모바일 기획서에는 가로 넘침이 없고 마지막 장까지 접근할 수 있다', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'기획서',exact:true}).click();
  await page.locator('.plan-slide').last().scrollIntoViewIfNeeded();
  const img=page.locator('.plan-slide img').last();
  await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete && el.naturalWidth===1920)).toBe(true);
  await expect(page.getByRole('button',{name:'기획서 닫기'})).toBeInViewport({ratio:1});
  expect(await page.locator('.plan-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.getByRole('button',{name:'기획서 닫기'}).click();
  await expect(page.locator('.site-shell')).not.toHaveAttribute('inert','');
});
