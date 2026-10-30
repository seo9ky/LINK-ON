import { SelectField } from './FormControls';
import { useState, useEffect, type Dispatch } from 'react';
import { industries, reducer, type Action, type LinkState } from './model';

type SettingSection = 'matching' | 'date';
export function DemoTools({ state, dispatch, navigate, blocked = false }: { state: LinkState; dispatch: Dispatch<Action>; navigate: (route: string) => void; blocked?: boolean }) {
  const [section, setSection] = useState<SettingSection>('matching');
  const [date, setDate] = useState(state.date);
  const [limit, setLimit] = useState(String(state.limit));
  const [pattern, setPattern] = useState(state.patterns.join(','));
  const [feedback, setFeedback] = useState('');
  useEffect(() => { setDate(state.date); setLimit(String(state.limit)); setPattern(state.patterns.join(',')); }, [state.date, state.limit, state.patterns.join(',')]);
  const execute = (action: Action, message: string) => {
    const next = reducer(state, action); dispatch(action); setFeedback(next.notice || message); return next;
  };
  const sections: [SettingSection, string][] = [['matching', '맞춤 혜택 조건'], ['date', '행사 시점']];
  return <section className="demo-tools" inert={blocked} aria-labelledby="demo-settings-title">
    <h2 id="demo-settings-title" className="settings-heading">시연 설정</h2>
    <div className="settings-content">
      <div className="settings-tabs" role="tablist" aria-label="시연 설정 항목">{sections.map(([key, label], index) => <button key={key} id={`setting-tab-${key}`} role="tab" aria-selected={section === key} aria-controls={`setting-panel-${key}`} tabIndex={section === key ? 0 : -1} onClick={() => { setSection(key); setFeedback(''); }} onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % sections.length : event.key === 'ArrowLeft' ? (index + sections.length - 1) % sections.length : event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); setSection(sections[next][0]); setFeedback(''); document.getElementById(`setting-tab-${sections[next][0]}`)?.focus();
      }}>{label}</button>)}</div>
      <section className="settings-panel" id="setting-panel-matching" role="tabpanel" aria-labelledby="setting-tab-matching" hidden={section !== 'matching'}>
        <div className="settings-fields">
          <label>이용 패턴<SelectField value={pattern} onChange={e => setPattern(e.target.value)}><option value="">이용 이력 없음</option>{industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}<option value={industries.join(',')}>전체 업종</option>{state.patterns.length > 1 && state.patterns.length < industries.length && <option value={state.patterns.join(',')}>{state.patterns.join(' / ')}</option>}</SelectField></label>
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
        <p className="settings-help">현재 {state.date} · 11월과 12월 행사를 체험할 수 있어요.</p>
      </section>
      {feedback && <p className="settings-feedback" role="status" aria-live="polite">{feedback}</p>}
    </div>
  </section>;
}
