import { useState, useEffect, type Dispatch } from 'react';
import { industries, campaigns, merchants, campaign, availableCampaigns, reducer, type Action, type Availability, type LinkState } from './model';

export function DemoTools({ state, dispatch, navigate, blocked = false }: { state: LinkState; dispatch: Dispatch<Action>; navigate: (route: string) => void; blocked?: boolean }) {
  const [date, setDate] = useState(state.date);
  const [limit, setLimit] = useState(String(state.limit));
  const [pattern, setPattern] = useState(state.patterns.join(','));
  const [id, setId] = useState(() => availableCampaigns(state)[0]?.id || campaigns[0].id);
  const [amount, setAmount] = useState('6500');
  const [other, setOther] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => { setDate(state.date); setLimit(String(state.limit)); setPattern(state.patterns.join(',')); }, [state.date, state.limit, state.patterns.join(',')]);
  useEffect(() => { setId(previous => availableCampaigns(state).find(c => c.merchant === campaign(previous)?.merchant)?.id || previous); }, [state.date]);
  const execute = (action: Action, message: string) => {
    const next = reducer(state, action); dispatch(action); setFeedback(next.notice || message); return next;
  };
  return <details className="demo-tools" inert={blocked}><summary>시연 도구 · 고객 앱 외부</summary>
    <p>가상의 고객·행사·결제로 동작을 확인합니다. 실제 결제와 금융 API 연결은 없습니다.</p>
    <div className="demo-grid">
      <section><h3>맞춤 혜택 선정</h3>
        <label>시연 이용 패턴<select value={pattern} onChange={e => setPattern(e.target.value)}><option value="">이용 이력 없음</option>{industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}<option value={industries.join(',')}>전체 업종</option>{state.patterns.length > 1 && state.patterns.length < industries.length && <option value={state.patterns.join(',')}>{state.patterns.join(' / ')}</option>}</select></label>
        <label>시연 한도 (확정 운영 수치 아님)<input type="number" min="0" max="20" step="1" value={limit} onInput={e => setLimit(e.currentTarget.value)} onChange={e => setLimit(e.target.value)} /></label>
        <button onClick={() => { if (limit === '' || !Number.isInteger(Number(limit)) || Number(limit) < 0 || Number(limit) > 20) { setFeedback('시연 한도는 0~20의 정수로 입력해 주세요.'); return; } execute({ type: 'CONFIGURE', limit: Number(limit), patterns: pattern ? pattern.split(',') : [] }, '시연 조건을 저장했어요.'); }}>시연 조건 저장</button>
        <button disabled={!state.enabled} onClick={() => execute({ type: 'SELECT' }, '현재 조건으로 선정했어요. 기존 연결은 유지하고 가능한 혜택만 추가해요.')}>새 혜택 선정 실행</button>
        <label>시연 날짜<input type="date" min={state.date} value={date} onInput={e => setDate(e.currentTarget.value)} onChange={e => setDate(e.target.value)} /></label>
        <button onClick={() => execute({ type: 'ADVANCE_DATE', date }, '날짜를 변경했어요. 만료 처리 후 LINK ON이 켜져 있으면 새 혜택을 선정해요.')}>날짜 적용</button>
        <small>현재 {state.date} · 11월/12월 행사를 제공합니다. 이전 날짜로 가려면 처음부터 다시 보기를 사용하세요. 한도 축소 시 기존 연결을 취소하지 않고 신규 연결을 제한합니다.</small>
      </section>
      <section><h3>시연 결제</h3>
        <label>결제 대상 행사<select value={id} onChange={e => { setId(e.target.value); setAmount(String((campaign(e.target.value)?.minimum || 5000) + 1500)); }}>{campaigns.map(c => <option key={c.id} value={c.id}>{merchants[c.merchant].name} · {c.start.slice(5, 7)}월</option>)}</select></label>
        <label>결제금액 (원)<input type="number" min="1" max="100000000" step="1" value={amount} onInput={e => setAmount(e.currentTarget.value)} onChange={e => setAmount(e.target.value)} /></label>
        <label className="demo-check"><input type="checkbox" checked={other} onChange={e => setOther(e.target.checked)} />다른 할인 적용 (시연 중복 조건)</label>
        <button onClick={() => { const next = execute({ type: 'PAY', id, amount: Number(amount), otherDiscount: other }, '결제를 접수했어요. 전표 접수 후 적용 여부를 확인해 보세요.'); if (next.payments.length > state.payments.length) navigate('/results/pending'); }}>시연 결제 접수</button>
        <button disabled={!state.payments.some(p => p.status === 'pending')} onClick={() => { const pending = state.payments.filter(p => p.status === 'pending'); pending.forEach(p => dispatch({ type: 'SETTLE', paymentId: p.id })); setFeedback('결제 당시 조건으로 전표 처리를 완료했어요.'); navigate(pending.at(-1)?.eligibleDiscount ? '/results/done' : '/results/failed'); }}>확인 중 결제 전표 접수</button>
        <label>선택한 행사 연결 상태<select aria-label="행사 예외 상황" value={state.availability[id] || 'available'} onChange={e => execute({ type: 'AVAILABILITY', id, value: e.target.value as Availability }, '예외 조건을 설정했어요. 이미 연결된 혜택에는 소급 적용하지 않아요.')}><option value="available">연결 가능</option><option value="soldout">예산 소진</option><option value="error">연결 오류</option></select></label>
      </section>
    </div><p role="status" aria-live="polite">{feedback}</p>
  </details>;
}
