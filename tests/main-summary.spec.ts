import { test, expect, type Page } from '@playwright/test';
async function enable(page:Page){await page.getByRole('button',{name:'LINK ON 시작하기',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'동의하고 시작하기'}).click();await page.getByRole('button',{name:'저장하고 혜택 확인하기'}).click();}
for(const width of [375,1366])test(`메인 요약 ${width}: 최초·직접 연결·ON·결제·OFF에서도 같은 상단 위치`,async({page})=>{
 await page.setViewportSize({width,height:width===375?812:768});await page.goto('/');
 const summary=page.locator('.summary');const start=await summary.boundingBox();
 const check=async()=>{await page.locator('.content').evaluate(e=>e.scrollTop=0);await expect(summary).toHaveCount(1);await expect(summary).toBeInViewport({ratio:1});expect(Math.abs((await summary.boundingBox())!.y-start!.y)).toBeLessThan(1);};
 await expect(summary).toContainText('0개');await expect(summary).toContainText('0원');
 await page.getByRole('button',{name:'GS25 혜택 링크',exact:true}).click();await page.getByRole('button',{name:'LINK 메인으로',exact:true}).click();await check();await expect(summary).toContainText('1개');
 await enable(page);await check();await expect(summary).toContainText('3개');
 await page.getByRole('button',{name:'결제 체험하기',exact:true}).click();await page.getByRole('button',{name:/원으로 결제 체험/}).click();await page.getByRole('button',{name:'할인 결과 확인하기'}).click();await page.getByRole('button',{name:'LINK 메인으로',exact:true}).click();await check();await expect(summary).toContainText('1,000원');
 await page.getByRole('switch').click();await page.getByRole('dialog').getByRole('button',{name:'자동 연결 끄기',exact:true}).click();await check();await expect(summary).toContainText('3개');await expect(summary).toContainText('1,000원');
 await page.getByRole('button',{name:'LINK ON 다시 켜기',exact:true}).click();await check();
});
test('자동 연결 없음 상태에서도 0개 요약을 유지한다',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/');const initial=(await page.locator('.summary').boundingBox())!.y;
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('0');await page.getByRole('button',{name:'한도 적용하기'}).click();await enable(page);
 await expect(page.getByRole('heading',{name:'지금은 자동으로 연결할 혜택이 없어요'})).toBeVisible();
 await expect(page.locator('.summary')).toContainText('0개');await expect(page.locator('.summary')).toBeInViewport({ratio:1});expect(Math.abs((await page.locator('.summary').boundingBox())!.y-initial)).toBeLessThan(1);
});
