import type { Page } from '@playwright/test';
export const storageKey = 'sb-prfkzeynkrreafoqablj-auth-token';
export const testUser = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'practice@example.test', email_confirmed_at: '2026-10-30T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-10-30T00:00:00Z' };
export function testSession() {
  const expires_at = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return { access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: testUser.id, aud: 'authenticated', role: 'authenticated', exp: expires_at })}.test-signature`, refresh_token: 'test-refresh-token', expires_at, expires_in: 3600, token_type: 'bearer', user: testUser };
}
export async function mockSignedIn(page: Page) {
  await page.addInitScript(({ key, session }) => {
    if (!localStorage.getItem('practice-test-initialized')) {
      localStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem('practice-test-initialized', 'true');
    }
  }, { key: storageKey, session: testSession() });
  await page.route('**/auth/v1/user', route => route.fulfill({ json: testUser }));
  await page.route('**/auth/v1/logout*', route => route.fulfill({ status: 204 }));
}
