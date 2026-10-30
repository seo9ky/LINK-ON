import { test, expect } from '@playwright/test';

test('공식 로고 링크와 문의창 로고를 표시한다', async ({page}) => {
  await page.goto('/');
  for (const [name,url] of [
    ['삼성카드 공식 사이트 (새 탭)','https://www.samsungcard.com/personal/main/UHPPCO0101M0.jsp'],
    ['모니모 공식 사이트 (새 탭)','https://www.monimo.com/monimo/homepage/main/PGIFPCCHomepageMainIndex001'],
  ]) {
    const link=page.getByRole('link',{name,exact:true});
    await expect(link).toHaveAttribute('href',url);await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel','noopener noreferrer');
  }
  await page.getByRole('button',{name:'문의하기',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'문의하기',exact:true});
  await expect(dialog.getByRole('img',{name:'LINK ON',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'문의 창 닫기'}).click();
});

test('서비스 소개는 앱 경로와 연결 상태를 보존하며 별도 창에서 스크롤된다', async ({page}) => {
  await page.setViewportSize({width:1366,height:768});await page.goto('/');
  await page.getByRole('button',{name:'GS25 혜택 링크',exact:true}).click();const url=page.url();
  await page.getByRole('button',{name:'서비스 소개',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'LINK ON 서비스 소개',exact:true});
  await expect(dialog).toBeVisible();await expect(page).toHaveURL(url);
  await expect(dialog.locator('.phone')).toHaveCount(0);
  for (const section of await dialog.locator('section').all()) {
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeInViewport();
    await expect.poll(()=>section.evaluate(e=>e.getAnimations().length)).toBe(0);
    await expect(section).toHaveCSS('opacity','1');
  }
  await expect(page.getByRole('button',{name:'서비스 소개 닫기'})).toBeInViewport({ratio:1});
  await page.getByRole('button',{name:'체험 화면으로 돌아가기'}).click();
  await expect(dialog).toHaveCount(0);await expect(page).toHaveURL(url);
  await expect(page.getByRole('heading',{name:'혜택을 직접 연결했어요'})).toBeVisible();
  await expect(page.getByRole('button',{name:'서비스 소개',exact:true})).toBeFocused();
});

test('작은 화면과 동작 줄이기에서도 모든 소개 내용에 접근한다', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});await page.goto('/');
    await page.getByRole('button',{name:'서비스 소개',exact:true}).click();
    const area=page.getByRole('region',{name:'서비스 소개 내용'});
    expect(await area.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    await area.locator('section').last().scrollIntoViewIfNeeded();
    expect(await area.evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
    await expect(page.getByRole('button',{name:'서비스 소개 닫기'})).toBeInViewport({ratio:1});
    await page.keyboard.press('Escape');await expect(area).toHaveCount(0);
    await page.getByRole('button',{name:'기획서',exact:true}).click();
    await page.locator('.plan-slide').last().scrollIntoViewIfNeeded();
    expect(await page.locator('.plan-scroll').evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
    await page.keyboard.press('Escape');
  }
});
