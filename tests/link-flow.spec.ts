import { test, expect, type Page } from '@playwright/test';
import { initialState, storageKey } from '../src/model';

async function ready(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}
async function enable(page: Page) {
  await page.getByRole('button', { name: 'LINK ON 시작하기', exact: true }).click();
  await expect(page.getByRole('button', { name: '동의하고 시작하기' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '동의하고 시작하기' }).click();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기' }).click();
  await expect(page.getByRole('switch')).toBeChecked();
}
async function details(page: Page) { await page.getByRole('button', { name: 'GS25 혜택 상세' }).click(); }
async function home(page: Page) { await page.getByRole('button', { name: 'LINK 메인', exact: true }).click(); }
async function shot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.phone').screenshot({ path: `test-results/screens/${name}.png` });
}
test('직접 LINK → 취소 → 해제 → 재연결, 새로고침 후 유지', async ({ page }) => {
  await ready(page); await shot(page, '01-start');
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('0개');
  await details(page); await shot(page, '18-manual-detail');
  await page.getByRole('button', { name: '이 혜택 링크하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '혜택을 직접 연결했어요' })).toBeVisible();
  await shot(page, '07-linked');
  await page.getByRole('button', { name: 'LINK 메인으로' }).click();
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('1개');
  await details(page);
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await shot(page, '21-unlink-sheet');
  await page.getByRole('button', { name: '연결 유지하기' }).click();
  await expect(page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 해제', exact: true }).click();
  await expect(page.getByText('해제 완료', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '이 혜택 링크하기', exact: true })).toBeVisible();
  await home(page); await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('0개');
  await details(page); await page.getByRole('button', { name: '이 혜택 링크하기', exact: true }).click();
  await page.reload(); await home(page);
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('1개');
});

test('행은 상세, + 링크는 즉시 연결, 완료 화면 뒤로는 메인', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'GS25 혜택 링크', exact: true }).click();
  await expect(page.getByRole('heading', { name: '혜택을 직접 연결했어요' })).toBeVisible();
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('1개');
  await details(page);
  await expect(page.locator('.footer').getByRole('button', { name: 'LINK 메인으로' })).toBeVisible();
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 해제', exact: true }).click();
  await expect(page.getByText('해제 완료', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('0개');
});

test('완료 화면에서 상세·해제 후 뒤로가도 과거 완료 화면이 나오지 않음', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'GS25 혜택 링크', exact: true }).click();
  await details(page);
  await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('0개');
  await expect(page.getByRole('heading', { name: '직접 LINK를 해제했어요' })).toHaveCount(0);
});

test('상세 주소로 직접 진입해도 앱 뒤로가기는 메인으로 복귀', async ({ page }) => {
  await page.goto('/#/benefit/gs25');
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'LINK', exact: true })).toBeVisible();
});
test('자동 LINK와 직접 LINK가 서로 영향을 주지 않는다', async ({ page }) => {
  await ready(page); await enable(page); await shot(page, '05-main-on');
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('2개');
  await details(page); await page.getByRole('button', { name: '이 혜택 링크하기', exact: true }).click(); await home(page);
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('3개');
  await details(page); await page.getByRole('button', { name: '이 혜택 LINK 해제', exact: true }).click();
  await page.getByRole('button', { name: 'LINK 해제', exact: true }).click(); await home(page);
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('2개');
  await expect(page.getByRole('switch')).toBeChecked();
  await page.getByRole('switch').click(); await page.getByRole('button', { name: '자동 연결 유지하기' }).click();
  await expect(page.getByRole('switch')).toBeChecked();
  await page.getByRole('switch').click(); await page.getByRole('button', { name: '자동 연결 끄기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '자동 연결을 껐어요' })).toBeVisible();
  await expect(page.getByRole('button', { name: '스타벅스 혜택 상세' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'SSF SHOP 혜택 상세' })).toBeVisible();
  await page.getByRole('button', { name: 'LINK ON 다시 켜기', exact: true }).click();
  await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('2개');
});
test('개별 제외 후 재활성화해도 이번 행사 혜택이 복구되지 않는다', async ({ page }) => {
  await ready(page); await enable(page);
  await page.getByRole('button', { name: '스타벅스 혜택 상세' }).click();
  await shot(page, '06-auto-detail');
  await page.getByRole('button', { name: '이 혜택 제외하기', exact: true }).click();
  await page.getByRole('button', { name: '스타벅스 혜택 제외', exact: true }).click();
  await expect(page.getByRole('heading', { name: '스타벅스 혜택을 제외했어요' })).toBeVisible();
  await home(page); await expect(page.getByLabel('링크한 혜택 개수')).toHaveText('1개');
  await page.getByRole('button', { name: '관리 ›', exact: true }).click();
  await page.getByRole('button', { name: 'SSF SHOP 혜택 제외' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'SSF SHOP 혜택 제외' }).click();
  await home(page); await expect(page.getByRole('heading', { name: '지금은 자동으로 연결할 혜택이 없어요' })).toBeVisible();
  await page.getByRole('button', { name: '자동 LINK 관리', exact: true }).click();
  await page.getByRole('switch').click(); await page.getByRole('button', { name: '자동 연결 끄기', exact: true }).click();
  await page.getByRole('button', { name: 'LINK ON 다시 켜기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '지금은 자동으로 연결할 혜택이 없어요' })).toBeVisible();
});
test('관심 업종 변경 취소·저장, 이용 결과는 명시적으로 불러와야 반영', async ({ page }) => {
  await ready(page); await enable(page);
  await page.getByRole('button', { name: '관리 ›' }).click();
  await page.getByRole('button', { name: '관심 업종 변경 ›' }).click();
  await page.getByRole('button', { name: '카페', exact: true }).click(); await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await expect(page.locator('.interest-summary strong')).toHaveText('카페 · 편의점');
  await page.getByRole('button', { name: '관심 업종 변경 ›' }).click();
  await expect(page.getByRole('button', { name: '카페', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '온라인 쇼핑', exact: true }).click();
  await page.getByRole('button', { name: '저장하고 혜택 확인하기' }).click();
  await page.getByRole('button', { name: '받은 혜택 · 이용 결과 보기' }).click();
  await expect(page.getByRole('heading', { name: '아직 이용 내역이 없어요' })).toBeVisible(); await home(page);
  await expect(page.locator('.summary')).toContainText('0원');
  await page.getByRole('button', { name: '받은 혜택 · 이용 결과 보기' }).click();
  await page.getByRole('button', { name: '예시 결제 내역 불러오기' }).click();
  await expect(page.getByRole('heading', { name: '1,000원 혜택 적용' })).toBeVisible();
  await page.getByRole('tab', { name: '확인 중' }).click();
  await expect(page.getByRole('heading', { name: '결제 내역을 확인 중이에요' })).toBeVisible();
  await page.getByRole('tab', { name: '미적용' }).click();
  await expect(page.getByRole('heading', { name: '이번 결제는 적용되지 않았어요' })).toBeVisible();
  await home(page); await expect(page.locator('.summary')).toContainText('1,000원');
});
test('모달 키보드 포커스·Escape·브라우저 뒤로가기', async ({ page }) => {
  await ready(page); await details(page); await page.getByRole('button', { name: '이 혜택 링크하기' }).click(); await home(page); await details(page);
  await page.getByRole('button', { name: '이 혜택 LINK 해제' }).click();
  await expect(page.getByRole('button', { name: 'LINK 해제', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: '연결 유지하기' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'LINK 해제', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '이 혜택 LINK 해제' }).click(); await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '이 혜택 LINK 해제' })).toBeVisible();
});
test('화면별 이미지 로드와 모바일 가로 넘침 검사', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', err => errors.push(err.message));
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: { ...initialState, optedIn: true, enabled: true, linkedAuto: ['starbucks', 'ssf'], manualLinked: true, demoResults: true } });
  for (const size of [{ width: 440, height: 956 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(size);
    for (const route of ['/', '/consent', '/interests', '/benefit/gs25', '/benefit/starbucks', '/benefit/ssf', '/linked', '/manage', '/excluded/starbucks', '/manual', '/help', '/results/done', '/results/pending', '/results/failed']) {
      await page.goto(`/#${route}`); await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('h1')).toBeVisible();
      const failures = await page.evaluate(() => ({
        brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        contentOverflow: (() => { const c = document.querySelector('.content')!; return c.scrollWidth > c.clientWidth + 1; })(),
      }));
      expect(failures, `${route} at ${size.width}`).toEqual({ brokenImages: [], overflow: false, contentOverflow: false });
    }
  }
  expect(errors).toEqual([]);
});
