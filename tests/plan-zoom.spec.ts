import { test, expect } from '@playwright/test';
for (const width of [375,1366]) test(`슬라이드 확대 ${width}: 확대·이동·닫기 후 목록 위치와 앱 상태 보존`, async ({ page }) => {
  await page.setViewportSize({width,height:812});await page.goto('/');
  await page.getByRole('button',{name:'GS25 혜택 링크',exact:true}).click();
  const appUrl=page.url();const state=await page.evaluate(()=>localStorage.getItem('link-on-demo-v2'));
  await page.getByRole('button',{name:'기획서',exact:true}).click();
  const list=page.getByRole('region',{name:'기획서 슬라이드',exact:true});
  const target=page.locator('.plan-slide-open').nth(3);
  await target.scrollIntoViewIfNeeded();
  await target.evaluate(async e => {
    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
    await Promise.all(e.parentElement!.getAnimations().map(a => a.finished.catch(() => {})));
  });
  const scroll=await list.evaluate(e=>e.scrollTop),box=(await target.boundingBox())!;
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  const zoom=page.locator('.slide-zoom');await expect(zoom).toBeVisible();
  const area=page.getByRole('region',{name:'확대한 슬라이드',exact:true});await expect(area).toBeFocused();
  await expect(zoom.locator('output')).toHaveText('300%');
  await expect.poll(()=>area.locator('img').evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
  expect(await area.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);
  await area.evaluate(e=>{e.scrollLeft=200;e.scrollTop=120;});expect(await area.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
  await zoom.getByRole('button',{name:'슬라이드 확대',exact:true}).click();await expect(zoom.locator('output')).toHaveText('400%');
  await expect(zoom.getByRole('button',{name:'슬라이드 확대',exact:true})).toBeDisabled();
  await zoom.getByRole('button',{name:'슬라이드 축소',exact:true}).click();await expect(zoom.locator('output')).toHaveText('300%');
  await zoom.getByRole('button',{name:'화면 맞춤',exact:true}).click();await expect(zoom.locator('output')).toHaveText('100%');
  await expect.poll(()=>area.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
  await zoom.getByRole('button',{name:'확대 보기 닫기',exact:true}).click();await expect(zoom).toHaveCount(0);
  await expect(target).toBeFocused();expect(Math.abs((await list.evaluate(e=>e.scrollTop))-scroll)).toBeLessThan(2);
  await page.keyboard.press('Enter');await expect(zoom).toBeVisible();await page.keyboard.press('Escape');await expect(zoom).toHaveCount(0);await expect(list).toBeVisible();
  await page.getByRole('button',{name:'기획서 닫기',exact:true}).click();await expect(page).toHaveURL(appUrl);expect(await page.evaluate(()=>localStorage.getItem('link-on-demo-v2'))).toBe(state);
});

test.describe('모바일 터치', () => {
  test.use({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true });
  test('스와이프와 반복 확대 후 8장 모두 보던 위치로 돌아간다', async ({ page }) => {
    await page.goto('/');await page.getByRole('button',{name:'기획서',exact:true}).tap();
    const list=page.locator('.plan-scroll');
    for(let i=0;i<8;i++) {
      const target=page.locator('.plan-slide-open').nth(i);await target.scrollIntoViewIfNeeded();
      await target.evaluate(async e => {
        await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
        await Promise.all(e.parentElement!.getAnimations().map(a => a.finished.catch(() => {})));
      });
      const position=await list.evaluate(e=>e.scrollTop),targetBox=(await target.boundingBox())!;
      // Tap the visible coordinates without the locator's automatic pre-tap scrolling.
      await page.touchscreen.tap(targetBox.x+targetBox.width/2,targetBox.y+targetBox.height/2);
      const area=page.locator('.zoom-scroll'),zoom=page.locator('.slide-zoom');
      await zoom.getByRole('button',{name:'슬라이드 확대',exact:true}).tap();
      if(i===6) {
        await area.evaluate(e=>{e.scrollLeft=0;e.scrollTop=0;});
        const session=await page.context().newCDPSession(page),box=(await area.boundingBox())!;
        const x=box.x+box.width*.65,y=box.y+box.height*.65;
        for(const [dx,dy] of [[-140,0],[0,-100]]) {
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
          for(let k=1;k<=8;k++) {await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*k/8,y:y+dy*k/8}]});await page.waitForTimeout(16);}
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        }
        await expect.poll(()=>area.evaluate(e=>e.scrollLeft)).toBeGreaterThan(20);
        await expect.poll(()=>area.evaluate(e=>e.scrollTop)).toBeGreaterThan(10);await session.detach();
      }
      await zoom.getByRole('button',{name:'화면 맞춤'}).tap();
      await zoom.getByRole('button',{name:'확대 보기 닫기'}).tap();
      await expect(zoom).toHaveCount(0);await expect(target).toBeFocused();
      await expect.poll(async()=>Math.abs((await list.evaluate(e=>e.scrollTop))-position)).toBeLessThan(2);
    }
    await page.getByRole('button',{name:'기획서 닫기'}).tap();
    await page.locator('.demo-tools').scrollIntoViewIfNeeded();
    expect(await page.locator('.demo-tools').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    await expect(page.locator('.settings-state')).toContainText('자동 연결 0개');
  });
});
