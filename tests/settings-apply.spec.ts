import { test, expect, type Page } from '@playwright/test';
async function enable(page: Page) {
 await page.goto('/'); await page.getByRole('button',{name:'LINK ON 시작하기',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'동의하고 시작하기'}).click();await page.getByRole('button',{name:'저장하고 혜택 확인하기'}).click();
}
const saved = (page: Page) => page.evaluate(()=>JSON.parse(localStorage.getItem('link-on-demo-v2')!));

test('입력값을 바로 적용하고 추가 연결·한도 축소·추가 없음 결과를 구분한다', async({page})=>{
 await enable(page);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('5');
 await page.getByRole('button',{name:'조건 적용하기',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('3개 혜택을 추가 연결');
 expect((await saved(page)).limit).toBe(5);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('1');await page.getByRole('button',{name:'조건 적용하기'}).click();
 await expect(page.getByRole('status')).toContainText('새 한도보다 많아');
 await expect(page.locator('.settings-content')).toContainText('기존 5개 유지 · 새 한도 1개 · 추가 연결 없음');
 await page.getByRole('button',{name:'조건 적용하기'}).click();await expect(page.getByRole('status')).not.toContainText('추가 연결했어요');
});

test('미동의 조건 적용은 자동 연결하지 않고 잘못된 한도는 적용하지 않는다',async({page})=>{
 await page.goto('/');await page.getByLabel('자동 연결 한도',{exact:true}).fill('4');await page.getByRole('button',{name:'조건 적용하기'}).click();
 await expect(page.getByRole('status')).toContainText('동의하고 LINK ON을 시작');expect((await saved(page)).connections).toHaveLength(0);
 for(const value of ['', '1.5', '-1', '21']){
  await page.getByLabel('자동 연결 한도',{exact:true}).fill(value);await page.getByRole('button',{name:'조건 적용하기'}).click();await expect(page.locator('#settings-error')).toContainText('0~20');expect((await saved(page)).limit).toBe(4);
 }
});

test('다음 달 이동은 기존 조건을 사용하고 미적용 입력과 과거 기록을 보존한다',async({page})=>{
 await enable(page);await page.getByLabel('자동 연결 한도',{exact:true}).fill('4');
 const choice=page.locator('.settings-industry-grid').getByRole('button',{name:'건강 · 화장품',exact:true});await choice.click();
 await page.getByRole('tab',{name:'다음 달 체험하기',exact:true}).click();
 await expect(page.locator('.settings-month')).toContainText('2026년 11월');
 await page.getByRole('button',{name:'다음 달로 이동'}).click();
 await expect(page.getByRole('status')).toContainText('11월 혜택 2개가 만료');expect((await saved(page)).limit).toBe(2);
 await expect(page.locator('.settings-month')).toContainText('2026년 12월');
 await expect(page.getByRole('button',{name:'다음 달로 이동'})).toHaveCount(0);
 await expect(page.getByRole('tabpanel')).toContainText('마지막 행사');
 await page.getByRole('tab',{name:'맞춤 혜택 조건',exact:true}).click();await expect(page.getByLabel('자동 연결 한도',{exact:true})).toHaveValue('4');
 await expect(choice).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'조건 적용하기'}).click();await expect(page.getByRole('status')).toContainText('2개 혜택을 추가 연결');
 expect((await saved(page)).patterns).toContain('건강 · 화장품');
});

test('평소 소비 업종은 복수·전체·미선택을 저장하며 앱 관심 업종은 유지한다',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/');
 const grid=page.locator('.settings-industry-grid');
 await grid.getByRole('button',{name:'패션 · 스타일',exact:true}).click();await grid.getByRole('button',{name:'건강 · 화장품',exact:true}).click();
 await page.getByRole('button',{name:'조건 적용하기'}).click();
 expect((await saved(page)).patterns).toEqual(['외식 · 간식','패션 · 스타일','건강 · 화장품']);
 expect((await saved(page)).interests).toEqual(['외식 · 간식','패션 · 스타일']);
 await page.reload();await expect(grid.locator('[aria-pressed=true]')).toHaveCount(3);
 for(const button of await grid.getByRole('button').all()) { if(await button.getAttribute('aria-pressed') === 'false') await button.click(); }
 await page.getByRole('button',{name:'조건 적용하기'}).click();expect((await saved(page)).patterns).toHaveLength(6);
 for(const button of await grid.getByRole('button').all()) await button.click();
 await expect(page.locator('#pattern-help')).toContainText('관심 업종만');
 await page.getByRole('button',{name:'조건 적용하기'}).click();expect((await saved(page)).patterns).toHaveLength(0);
 expect((await saved(page)).interests).toHaveLength(2);
 expect(await grid.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
});

test('OFF에서 다음 달로 이동하면 기존 행사는 만료되고 새 자동 연결은 없다',async({page})=>{
 await enable(page);await page.getByRole('switch').click();await page.getByRole('dialog').getByRole('button',{name:'자동 연결 끄기',exact:true}).click();
 await page.getByRole('tab',{name:'다음 달 체험하기'}).click();await page.getByRole('button',{name:'다음 달로 이동'}).click();
 await expect(page.getByRole('status')).toContainText('꺼져 있어');
 const s=await saved(page);expect(s.enabled).toBe(false);expect(s.connections.filter((l:any)=>!l.closedOn)).toHaveLength(0);
});

test('처음부터 체험은 취소 시 보존하고 확인 시 기록·설정·앱 시작 상태를 초기화한다',async({page})=>{
 await enable(page);await page.getByRole('button',{name:'결제 체험하기',exact:true}).click();await page.getByRole('button',{name:/원으로 결제 체험/}).click();
 const before=await saved(page);await page.getByRole('button',{name:'처음부터 체험',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'처음부터 체험할까요?'});await expect(dialog.getByRole('button',{name:'취소',exact:true})).toBeFocused();
 await page.keyboard.press('Escape');expect(await saved(page)).toEqual(before);
 await page.getByRole('button',{name:'처음부터 체험',exact:true}).click();await dialog.getByRole('button',{name:'초기화하고 시작'}).click();
 await expect(page.getByRole('button',{name:'LINK ON 시작하기',exact:true})).toBeVisible();
 const after=await saved(page);expect(after.payments).toHaveLength(0);expect(after.connections).toHaveLength(0);expect(after.optedIn).toBe(false);expect(after.date).toBe('2026-11-03');
 await page.getByRole('button',{name:'LINK ON 시작하기',exact:true}).click();await expect(page.getByRole('checkbox')).not.toBeChecked();
});
