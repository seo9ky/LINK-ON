import { test, expect, type Page } from '@playwright/test';
async function enable(page: Page) {
 await page.goto('/'); await page.getByRole('button',{name:'LINK ON 시작하기',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'동의하고 시작하기'}).click();await page.getByRole('button',{name:'저장하고 혜택 확인하기'}).click();
}
const saved = (page: Page) => page.evaluate(()=>JSON.parse(localStorage.getItem('link-on-demo-v2')!));

test('입력값을 바로 적용하고 추가 연결·한도 축소·추가 없음 결과를 구분한다', async({page})=>{
 await enable(page);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('5');
 await page.getByRole('button',{name:'한도 적용하기',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('3개 혜택을 추가 연결');
 expect((await saved(page)).limit).toBe(5);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('1');await page.getByRole('button',{name:'한도 적용하기'}).click();
 await expect(page.getByRole('status')).toContainText('새 한도보다 많아');
 await expect(page.locator('.settings-content')).toContainText('기존 5개 유지 · 추가 연결 없음');
 await page.getByRole('button',{name:'한도 적용하기'}).click();await expect(page.getByRole('status')).not.toContainText('추가 연결했어요');
});

test('미동의 조건 적용은 자동 연결하지 않고 잘못된 한도는 적용하지 않는다',async({page})=>{
 await page.goto('/');await page.getByLabel('자동 연결 한도',{exact:true}).fill('4');await page.getByRole('button',{name:'한도 적용하기'}).click();
 await expect(page.getByRole('status')).toContainText('동의하고 LINK ON을 시작');expect((await saved(page)).connections).toHaveLength(0);
 for(const value of ['', '1.5', '-1', '21']){
  await page.getByLabel('자동 연결 한도',{exact:true}).fill(value);await page.getByRole('button',{name:'한도 적용하기'}).click();await expect(page.locator('#settings-error')).toContainText('0~20');expect((await saved(page)).limit).toBe(4);
 }
});

test('한도만 변경하며 소비 이력·관심 업종·날짜·직접 연결을 유지한다',async({page})=>{
 await enable(page);await page.getByRole('button',{name:'GS25 혜택 링크',exact:true}).click();
 const before=await saved(page);
 await expect(page.locator('.settings-tabs')).toHaveCount(0);
 await expect(page.locator('.settings-industries')).toHaveCount(0);
 await page.getByRole('button',{name:'한도 1개 늘리기'}).click();
 expect((await saved(page)).limit).toBe(2);
 await page.getByRole('button',{name:'한도 적용하기'}).click();
 const after=await saved(page);expect(after.limit).toBe(3);
 for(const key of ['patterns','interests','date','payments']) expect(after[key]).toEqual(before[key]);
 expect(after.connections.filter((l:any)=>l.mode==='manual')).toEqual(before.connections.filter((l:any)=>l.mode==='manual'));
 await page.reload();await expect(page.getByLabel('자동 연결 한도',{exact:true})).toHaveValue('3');
});

test('OFF 및 0개에서는 추가 연결하지 않고 한도 조절의 경계를 지킨다',async({page})=>{
 await enable(page);await page.getByRole('switch').click();await page.getByRole('dialog').getByRole('button',{name:'자동 연결 끄기',exact:true}).click();
 const before=await saved(page);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('5');await page.getByRole('button',{name:'한도 적용하기'}).click();
 await expect(page.getByRole('status')).toContainText('꺼져 있어');expect((await saved(page)).connections).toEqual(before.connections);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('0');await expect(page.getByRole('button',{name:'한도 1개 줄이기'})).toBeDisabled();await page.getByRole('button',{name:'한도 적용하기'}).click();
 expect((await saved(page)).limit).toBe(0);expect((await saved(page)).connections).toEqual(before.connections);
 await page.getByLabel('자동 연결 한도',{exact:true}).fill('20');await expect(page.getByRole('button',{name:'한도 1개 늘리기'})).toBeDisabled();
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
