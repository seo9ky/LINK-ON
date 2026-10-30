import { test, expect } from '@playwright/test';

test('처음 소개를 읽고 시작하면 동의로 이동하고 진행 중에는 그대로 이어본다', async ({page}) => {
 await page.goto('/');await page.getByRole('button',{name:'서비스 소개',exact:true}).click();
 await expect(page.locator('.overview-concept')).toHaveCount(0);
 await page.getByRole('button',{name:'LINK ON 체험 시작하기',exact:true}).click();
 await expect(page.getByRole('heading',{name:'LINK ON 시작',exact:true})).toBeVisible();
 await expect(page.getByRole('checkbox')).not.toBeChecked();
 await expect(page.getByRole('button',{name:'동의하고 시작하기'})).toBeDisabled();
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'동의하고 시작하기'}).click();
 const selected=await page.locator('.industry[aria-pressed=true]').allTextContents();
 await page.getByRole('button',{name:'서비스 소개',exact:true}).click();await page.getByRole('button',{name:'체험 이어보기',exact:true}).click();
 await expect(page.getByRole('heading',{name:'관심 업종 설정',exact:true})).toBeVisible();
 expect(await page.locator('.industry[aria-pressed=true]').allTextContents()).toEqual(selected);
 await expect(page.getByRole('button',{name:'저장하고 혜택 확인하기'})).toBeEnabled();
});

test('모바일 첫 화면에서 동의·연결된 혜택·입력 금액을 확인할 수 있다',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/');
 await page.getByRole('button',{name:'LINK ON 시작하기',exact:true}).click();
 await expect(page.getByRole('checkbox')).toBeInViewport({ratio:1});
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'동의하고 시작하기'}).click();await page.getByRole('button',{name:'저장하고 혜택 확인하기'}).click();
 await expect(page.getByRole('button',{name:'스타벅스 혜택 상세',exact:true})).toBeInViewport({ratio:1});
 await page.getByRole('button',{name:'SSF SHOP 혜택 상세',exact:true}).scrollIntoViewIfNeeded();
 await expect(page.getByRole('button',{name:'SSF SHOP 혜택 상세',exact:true})).toBeInViewport({ratio:1});
 await page.getByRole('button',{name:'결제 체험하기',exact:true}).click();
 await expect(page.getByLabel('결제금액 (원)',{exact:true})).toBeInViewport({ratio:1});
 await expect(page.getByRole('button',{name:'6,500원으로 결제 체험',exact:true})).toBeVisible();
 await page.getByLabel('결제금액 (원)',{exact:true}).fill('7500');
 await page.getByRole('button',{name:'7,500원으로 결제 체험',exact:true}).click();
 await expect(page.getByRole('heading',{name:'결제 체험이 접수됐어요'})).toBeVisible();
 await page.getByRole('button',{name:'할인 결과 확인하기'}).click();
 await expect(page.getByRole('heading',{name:'1,000원 할인 적용'})).toBeVisible();await expect(page.locator('.details')).toContainText('7,500원');
});
