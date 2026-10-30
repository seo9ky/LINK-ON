import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, activeLinks, connection, totalDiscount, emptyReason, restoreState } from '../src/model.ts';
const fresh = () => structuredClone(initialState);
const step = (s, type, props = {}) => reducer(s, { type, ...props });
const on = (values = ['카페', '온라인 쇼핑'], config = {}) => step({ ...fresh(), ...config }, 'SAVE_INTERESTS', { values, activate: true });
const pay = (s, id = 'starbucks-202611', amount = 6500, otherDiscount = false) => step(s, 'PAY', { id, amount, otherDiscount });
const settle = s => s.payments.reduce((state, p) => step(state, 'SETTLE', { paymentId: p.id }), s);
test('동의 없이 자동 연결하지 않는다', () => {
  assert.equal(activeLinks(step(fresh(), 'ENABLE')).length, 0);
  assert.equal(activeLinks(step(fresh(), 'SELECT')).length, 0);
});
test('관심 업종·패턴에 맞는 혜택만 한도 내 선정하고 채우기를 강제하지 않는다', () => {
  assert.deepEqual(activeLinks(on(['온라인 쇼핑'], { patterns: [], limit: 5 })).map(x => x.campaignId), ['ssf-202611']);
  assert.equal(activeLinks(on([], { patterns: [], limit: 5 })).length, 0);
  assert.match(emptyReason(on([], { patterns: [] })), /맞는 혜택이 없어요/);
  assert.equal(activeLinks(on(undefined, { limit: 1 })).length, 1);
  assert.equal(activeLinks(on(undefined, { limit: 0 })).length, 0);
});
test('이용 패턴으로도 선정하며 관심 업종 변경은 다음 선정부터 반영한다', () => {
  let s = on([], { patterns: ['카페'] });
  assert.match(connection(s, 'starbucks-202611').reason, /이용 패턴/);
  s = step(s, 'SAVE_INTERESTS', { values: ['온라인 쇼핑'], activate: false });
  assert.equal(activeLinks(s).length, 1);
  s = step(s, 'SELECT');
  assert.equal(activeLinks(s).length, 2);
  assert.equal(activeLinks(step(s, 'SELECT')).length, 2);
});
test('직접 연결은 자동 한도와 별개이며 해제·재연결은 타 혜택을 유지한다', () => {
  let s = step(on(undefined, { limit: 1 }), 'LINK_MANUAL', { id: 'gs25-202611' });
  assert.equal(activeLinks(s).length, 2);
  s = step(s, 'UNLINK_MANUAL', { id: 'gs25-202611' });
  assert.equal(activeLinks(s).length, 1); assert.equal(s.enabled, true);
  s = step(s, 'LINK_MANUAL', { id: 'gs25-202611' });
  assert.equal(activeLinks(s).length, 2);
  assert.equal(activeLinks(step(s, 'LINK_MANUAL', { id: 'gs25-202611' })).length, 2);
});
test('이번 행사 제외는 재활성화해도 유지, 다음 달 같은 가맹점은 다시 선정 가능', () => {
  let s = step(on(), 'EXCLUDE', { id: 'starbucks-202611' });
  s = step(step(s, 'DISABLE'), 'ENABLE');
  assert.equal(connection(s, 'starbucks-202611'), undefined);
  s = step(s, 'ADVANCE_DATE', { date: '2026-12-01' });
  assert.ok(connection(s, 'starbucks-202612'));
  assert.equal(connection(s, 'ssf-202611'), undefined);
  assert.ok(s.connections.some(l => l.closedReason === 'expired'));
});
test('OFF 시 기존 연결 보존, 만료 시 종료하며 신규 자동 연결은 중단', () => {
  let s = step(on(), 'DISABLE');
  assert.equal(activeLinks(s).length, 2);
  s = step(s, 'ADVANCE_DATE', { date: '2026-12-01' });
  assert.equal(activeLinks(s).length, 0);
  assert.equal(activeLinks(step(s, 'ENABLE')).length, 2);
});
test('잘못된 날짜·금액 입력은 결제나 행사 상태를 바꾸지 않는다', () => {
  let s = on();
  for (const date of ['2026-02-30', '2026-10-01', 'abc']) assert.equal(step(s, 'ADVANCE_DATE', { date }).date, s.date);
  for (const amount of [0, -1, 1.5, NaN, 100000001]) assert.equal(pay(s, undefined, amount).payments.length, 0);
});
test('예산 소진과 연결 오류는 신규 연결을 차단, 기존 연결에는 소급 적용하지 않는다', () => {
  let s = step(fresh(), 'AVAILABILITY', { id: 'starbucks-202611', value: 'soldout' });
  s = step(s, 'SAVE_INTERESTS', { values: ['카페'], activate: true });
  assert.equal(activeLinks(s).length, 0);
  assert.match(emptyReason(s), /예산이 소진/);
  assert.equal(connection(step(s, 'LINK_MANUAL', { id: 'starbucks-202611' }), 'starbucks-202611'), undefined);
  s = step(on(), 'AVAILABILITY', { id: 'starbucks-202611', value: 'error' });
  assert.equal(totalDiscount(settle(pay(s))), 1000);
});
test('연결 전 결제는 사후 연결해도 미적용, 새 결제는 적용', () => {
  let s = pay(fresh(), 'gs25-202611');
  s = step(s, 'LINK_MANUAL', { id: 'gs25-202611' });
  s = settle(s);
  assert.equal(s.payments[0].status, 'failed');
  assert.match(s.payments[0].reason, /결제 전에/);
  s = settle(pay(s, 'gs25-202611'));
  assert.equal(totalDiscount(s), 1000);
  assert.equal(s.payments[1].mode, 'manual');
});
test('연결 → 결제 확인 중 → 해제 → 전표 접수에도 결제 당시 혜택 보존', () => {
  let s = pay(on());
  assert.equal(totalDiscount(s), 0);
  s = step(s, 'EXCLUDE', { id: 'starbucks-202611' });
  s = step(s, 'ADVANCE_DATE', { date: '2026-12-01' });
  s = settle(s);
  assert.equal(s.payments[0].status, 'done');
  assert.equal(totalDiscount(s), 1000);
  assert.equal(totalDiscount(settle(s)), 1000);
});
test('미달·중복 할인·이미 사용한 행사·기간 외 결제의 사유가 각각 다르다', () => {
  assert.match(settle(pay(on(), undefined, 4000)).payments[0].reason, /최소 결제/);
  assert.match(settle(pay(on(), undefined, 6500, true)).payments[0].reason, /다른 할인/);
  const twice = settle(pay(pay(on())));
  assert.equal(totalDiscount(twice), 1000); assert.equal(twice.payments[1].status, 'failed');
  assert.match(twice.payments[1].reason, /먼저 접수/);
  assert.match(settle(pay(on(), 'starbucks-202612')).payments[0].reason, /이용 기간/);
});
test('해제 이후 새 결제는 미적용이며 받은 혜택 합계는 보존한다', () => {
  let s = step(fresh(), 'LINK_MANUAL', { id: 'gs25-202611' });
  s = settle(pay(s, 'gs25-202611'));
  s = step(s, 'UNLINK_MANUAL', { id: 'gs25-202611' });
  s = settle(pay(s, 'gs25-202611'));
  assert.equal(totalDiscount(s), 1000);
  assert.equal(s.payments[1].status, 'failed');
  assert.equal(connection(step(s, 'LINK_MANUAL', { id: 'gs25-202611' }), 'gs25-202611'), undefined);
});
test('관심·한도 변경은 기존 연결을 강제로 해제하지 않는다', () => {
  const s = step(on(), 'CONFIGURE', { limit: 1, patterns: [] });
  assert.equal(activeLinks(step(s, 'SELECT')).length, 2);
  assert.equal(activeLinks(step(s, 'ADVANCE_DATE', { date: '2026-12-01' })).length, 1);
});
test('v1 연결·제외는 이전, 고정 결과는 제거하고 v2 결제 이력은 복원', () => {
  const s = restoreState({ version: 1, optedIn: true, enabled: true, linkedAuto: ['starbucks','ssf'], excluded: ['starbucks'], manualLinked: true, demoResults: true });
  assert.equal(activeLinks(s).length, 2); assert.equal(s.payments.length, 0);
  assert.ok(s.excluded.includes('starbucks-202611'));
  const paid = settle(pay(on()));
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(paid))).payments, paid.payments);
  assert.equal(restoreState(null).version, 2);
  assert.equal(restoreState({ ...paid, availability: null }).availability instanceof Object, true);
});
test('직접 연결된 맞춤 혜택을 적합한 혜택 없음으로 안내하지 않는다', () => {
  let s = step(fresh(), 'LINK_MANUAL', { id: 'starbucks-202611' });
  s = step(s, 'SAVE_INTERESTS', { values: ['카페'], activate: true });
  assert.match(emptyReason(s), /이미 직접 연결/);
  assert.equal(activeLinks(s).filter(l => l.mode === 'auto').length, 0);
});
test('이용 완료와 확인 중, 여러 제외 사유가 섞여도 적합성 부족으로 오안내하지 않는다', () => {
  let s = on(['카페']);
  s = pay(s);
  s = step(s, 'EXCLUDE', { id: 'starbucks-202611' });
  assert.match(emptyReason(s), /이미 이용했거나 결제를 확인 중/);
  s = step(s, 'SAVE_INTERESTS', { values: ['카페', '온라인 쇼핑'], activate: false });
  s = step(s, 'AVAILABILITY', { id: 'ssf-202611', value: 'soldout' });
  assert.match(emptyReason(s), /행사 조건을 확인/);
  assert.doesNotMatch(emptyReason(s), /업종을 확인/);
});
test('관심 업종 저장 후 선정 대기와 한도 0을 구분한다', () => {
  let s = on([], { patterns: [] });
  s = step(s, 'SAVE_INTERESTS', { values: ['카페'], activate: false });
  assert.match(emptyReason(s), /다음 혜택 선정/);
  s = step(s, 'CONFIGURE', { limit: 0, patterns: [] });
  assert.match(emptyReason(s), /한도가 없어요/);
});
