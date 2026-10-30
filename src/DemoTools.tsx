import { SupabasePractice } from './SupabasePractice';
import { useState, useEffect, type Dispatch } from 'react';
import { industries, campaigns, merchants, campaign, availableCampaigns, reducer, type Action, type Availability, type LinkState } from './model';

type SettingSection = 'matching' | 'date' | 'exceptions' | 'database';
export function DemoTools({ state, dispatch, navigate, blocked = false }: { state: LinkState; dispatch: Dispatch<Action>; navigate: (route: string) => void; blocked?: boolean }) {
  const [section, setSection] = useState<SettingSection>('matching');
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
  const sections: [SettingSection, string][] = [['matching', '맞춤 혜택 조건'], ['date', '행사 시점'], ['exceptions', '예외 상황'], ['database', '입력값 저장']];
  return <details className="demo-tools" inert={blocked}>
    <summary><span>시연 설정</span><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m4.5 7 4.5 4.5L13.5 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></summary>
    <div className="settings-content">
      <p className="settings-intro">조건을 바꾸며 LINK ON의 동작을 살펴보세요.</p>
      <div className="settings-tabs" role="tablist" aria-label="시연 설정 항목">{sections.map(([key, label], index) => <button key={key} id={`setting-tab-${key}`} role="tab" aria-selected={section === key} aria-controls={`setting-panel-${key}`} tabIndex={section === key ? 0 : -1} onClick={() => { setSection(key); setFeedback(''); }} onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % sections.length : event.key === 'ArrowLeft' ? (index + sections.length - 1) % sections.length : event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); setSection(sections[next][0]); setFeedback(''); document.getElementById(`setting-tab-${sections[next][0]}`)?.focus();
      }}>{label}</button>)}</div>
      <section className="settings-panel" id="setting-panel-matching" role="tabpanel" aria-labelledby="setting-tab-matching" hidden={section !== 'matching'}>
        <div className="settings-fields">
          <label>이용 패턴<select value={pattern} onChange={e => setPattern(e.target.value)}><option value="">이용 이력 없음</option>{industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}<option value={industries.join(',')}>전체 업종</option>{state.patterns.length > 1 && state.patterns.length < industries.length && <option value={state.patterns.join(',')}>{state.patterns.join(' / ')}</option>}</select></label>
          <label>자동 연결 한도<input type="number" min="0" max="20" step="1" aria-describedby="limit-help" value={limit} onChange={e => setLimit(e.target.value)} /></label>
        </div>
        <p id="limit-help" className="settings-help">체험용 한도예요. 한도를 줄여도 이미 연결된 혜택은 유지돼요.</p>
        <div className="settings-actions"><button className="settings-primary" onClick={() => { if (limit === '' || !Number.isInteger(Number(limit)) || Number(limit) < 0 || Number(limit) > 20) { setFeedback('자동 연결 한도는 0~20의 정수로 입력해 주세요.'); return; } execute({ type: 'CONFIGURE', limit: Number(limit), patterns: pattern ? pattern.split(',') : [] }, '조건을 저장했어요. 다음 혜택 선정부터 반영돼요.'); }}>조건 저장하기</button>
          <button className="settings-secondary" disabled={!state.enabled} onClick={() => execute({ type: 'SELECT' }, '현재 조건으로 혜택을 선정했어요. 기존 연결은 유지돼요.')}>새 혜택 선정하기</button></div>
        {!state.enabled && <p className="settings-help">LINK ON을 켜면 새 혜택을 선정할 수 있어요.</p>}
      </section>
      <section className="settings-panel" id="setting-panel-date" role="tabpanel" aria-labelledby="setting-tab-date" hidden={section !== 'date'}>
        <p className="settings-help">다음 달로 이동해 혜택 만료와 새 행사 연결을 확인하세요.</p>
        <label>시연 날짜<input type="date" min={state.date} value={date} onChange={e => setDate(e.target.value)} /></label>
        <div className="settings-actions"><button className="settings-primary" onClick={() => execute({ type: 'ADVANCE_DATE', date }, '날짜를 변경했어요. LINK ON이 켜져 있으면 새 혜택도 선정해요.')}>날짜 적용하기</button></div>
        <p className="settings-help">현재 {state.date} · 11월과 12월 행사를 체험할 수 있어요.<br />이전 날짜로 돌아가려면 ‘다시 체험하기’를 눌러 주세요.</p>
      </section>
      <section className="settings-panel" id="setting-panel-exceptions" role="tabpanel" aria-labelledby="setting-tab-exceptions" hidden={section !== 'exceptions'}>
        <label>대상 행사<select value={id} onChange={e => { setId(e.target.value); setAmount(String((campaign(e.target.value)?.minimum || 5000) + 1500)); setFeedback(''); }}>{campaigns.map(c => <option key={c.id} value={c.id}>{merchants[c.merchant].name} · {c.start.slice(5, 7)}월</option>)}</select></label>
        <label>연결 상황<select value={state.availability[id] || 'available'} onChange={e => execute({ type: 'AVAILABILITY', id, value: e.target.value as Availability }, '연결 상황을 변경했어요. 이미 연결된 혜택은 유지돼요.')}><option value="available">연결 가능</option><option value="soldout">예산 소진</option><option value="error">연결 오류</option></select></label>
        <p className="settings-help">선택한 행사의 새 연결에 바로 적용돼요.</p>
        <div className="exception-payment"><h3>할인 조건 확인</h3><p className="settings-help">결제금액이나 중복 할인 여부에 따른 결과를 비교하세요.</p>
          <label>결제금액 (원)<input type="number" min="1" max="100000000" step="1" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label className="settings-check"><input type="checkbox" checked={other} onChange={e => setOther(e.target.checked)} />다른 할인 함께 적용</label>
          <div className="settings-actions"><button className="settings-primary" onClick={() => { const next = execute({ type: 'PAY', id, amount: Number(amount), otherDiscount: other }, '결제 체험을 접수했어요. 이용 결과에서 할인 여부를 확인하세요.'); if (next.payments.length > state.payments.length) navigate('/results/pending'); }}>이 조건으로 결제 체험</button>
            <button className="settings-secondary" disabled={!state.payments.some(p => p.status === 'pending')} onClick={() => { const pending = state.payments.filter(p => p.status === 'pending'); pending.forEach(p => dispatch({ type: 'SETTLE', paymentId: p.id })); setFeedback('확인 중인 결제의 할인 결과를 반영했어요.'); navigate(pending.at(-1)?.eligibleDiscount ? '/results/done' : '/results/failed'); }}>확인 중인 결과 모두 반영</button></div>
        </div>
      </section>
      <section className="settings-panel" id="setting-panel-database" role="tabpanel" aria-labelledby="setting-tab-database" hidden={section !== 'database'}><SupabasePractice /></section>
      {feedback && <p className="settings-feedback" role="status" aria-live="polite">{feedback}</p>}
    </div>
  </details>;
}
