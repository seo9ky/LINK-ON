import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../vite.config.ts';

test('실제 공개용 설정으로 Vite 설정을 불러올 수 있다', () => {
  assert.doesNotThrow(() => config({ mode: 'development', command: 'serve' }));
});

test('다른 VITE 변수에 들어간 secret key도 빌드 전에 차단한다', () => {
  process.env.VITE_TEST_UNSAFE = 'sb_secret_test_fixture_only';
  try {
    assert.throws(() => config({ mode: 'production', command: 'build' }), /Remove the secret key from VITE_TEST_UNSAFE/);
  } finally { delete process.env.VITE_TEST_UNSAFE; }
});

test('legacy service_role JWT도 브라우저 변수에 넣을 수 없다', () => {
  process.env.VITE_TEST_UNSAFE = `fixture.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.fixture`;
  try {
    assert.throws(() => config({ mode: 'production', command: 'build' }), /Remove the service_role key from VITE_TEST_UNSAFE/);
  } finally { delete process.env.VITE_TEST_UNSAFE; }
});
