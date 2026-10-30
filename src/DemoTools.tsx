import { SelectField } from './FormControls';
import { useState, useEffect, useRef, type Dispatch } from 'react';
import { industries, initialState, activeLinks, reducer, selectionOutcome, type Action, type LinkState } from './model';

type SettingSection = 'matching' | 'date';
type Result = { message: string; added: string[] };
export function DemoTools({ state, dispatch, onReset, blocked = false }: { state: LinkState; dispatch: Dispatch<Action>; onReset: () => void; blocked?: boolean }) {
  const [section, setSection] = useState<SettingSection>('matching');
  const [date, setDate] = useState(state.date);
  const [limit, setLimit] = useState(String(state.limit));
  const [pattern, setPattern] = useState(state.patterns.join(','));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const resetDialog = useRef<HTMLDialogElement>(null);
  const patternKey = state.patterns.join(',');
  useEffect(() => { setDate(state.date); }, [state.date]);
  useEffect(() => { setLimit(String(state.limit)); }, [state.limit]);
  useEffect(() => { setPattern(patternKey); }, [patternKey]);
  // A result describes only the last applied snapshot, never later app actions.
  useEffect(() => { setResult(null); }, [state]);
  const autoCount = activeLinks(state).filter(l => l.mode === 'auto').length;
  const dirty = limit !== String(state.limit) || pattern !== patternKey;
  const validLimit = limit.trim() !== '' && Number.isInteger(Number(limit)) && Number(limit) >= 0 && Number(limit) <= 20;
  const clearFeedback = () => { setError(''); setResult(null); };
  const execute = (action: Action, dateChange = false) => {
    const next = reducer(state, action);
    if (next === state || next.notice) { setError(next.notice || '입력값을 확인해 주세요.'); return; }
    const outcome = selectionOutcome(state, next);
    const expired = next.connections.filter(l => l.closedReason === 'expired' && !state.connections.some(old => old.campaignId === l.campaignId && old.closedOn === l.closedOn)).length;
    dispatch(action);
    // Keep feedback associated with this applied state after the parent renders.
    pendingResult.current = { ...outcome, message: dateChange ? `${expired ? `${expired}개 혜택이 만료됐어요. ` : '날짜를 적용했어요. '}${outcome.message}` : outcome.message };
  };
  const pendingResult = useRef<Result | null>(null);
  useEffect(() => { if (pendingResult.current) { setResult(pendingResult.current); pendingResult.current = null; } }, [state]);
  const sections: [SettingSection, string][] = [['matching', '맞춤 혜택 조건'], ['date', '행사 시점']];
  return <section className="demo-tools" inert={blocked} aria-labelledby="demo-settings-title">
    <h2 id="demo-settings-title" className="settings-heading">시연 설정</h2>
    <div className="settings-content">
      <div className="settings-tabs" role="tablist" aria-label="시연 설정 항목">{sections.map(([key, label], index) => <button key={key} id={`setting-tab-${key}`} role="tab" aria-selected={section === key} aria-controls={`setting-panel-${key}`} tabIndex={section === key ? 0 : -1} onClick={() => { setSection(key); clearFeedback(); }} onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % sections.length : event.key === 'ArrowLeft' ? (index + sections.length - 1) % sections.length : event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); setSection(sections[next][0]); clearFeedback(); document.getElementById(`setting-tab-${sections[next][0]}`)?.focus();
      }}>{label}</button>)}</div>
      <section className="settings-panel" id="setting-panel-matching" role="tabpanel" aria-labelledby="setting-tab-matching" hidden={section !== 'matching'}>
        <form onSubmit={event => { event.preventDefault(); clearFeedback(); if (!validLimit) { setError('자동 연결 한도는 0~20의 정수로 입력해 주세요.'); return; } execute({ type: 'APPLY_CONDITIONS', limit: Number(limit), patterns: pattern ? pattern.split(',') : [] }); }} noValidate>
          <div className="settings-fields">
            <label>자주 이용하는 업종<SelectField value={pattern} aria-describedby="pattern-help" onChange={e => { setPattern(e.target.value); clearFeedback(); }}><option value="">이용 이력 없음</option>{industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}<option value={industries.join(',')}>전체 업종</option>{state.patterns.length > 1 && state.patterns.length < industries.length && <option value={patternKey}>{state.patterns.join(' / ')}</option>}</SelectField></label>
            <label>자동 연결 한도<input type="number" min="0" max="20" step="1" aria-describedby="limit-help settings-error" aria-invalid={!validLimit} value={limit} onChange={e => { setLimit(e.target.value); clearFeedback(); }} /></label>
          </div>
          <p id="pattern-help" className="settings-help">가상의 소비 이력이에요. 앱의 관심 업종과 함께 참고해요.</p>
          <p id="limit-help" className="settings-help">한도는 최대 개수예요. 줄여도 기존 연결은 유지돼요.</p>
          <div className="settings-actions"><button className="settings-primary" type="submit">조건 적용하기</button></div>
          {dirty && <p className="settings-help settings-draft">아직 적용하지 않은 조건이에요.</p>}
        </form>
      </section>
      <section className="settings-panel" id="setting-panel-date" role="tabpanel" aria-labelledby="setting-tab-date" hidden={section !== 'date'}>
        <p className="settings-help">다음 달에는 기존 행사가 만료돼요. LINK ON이 켜져 있으면 적용된 조건으로 새 혜택을 연결해요.</p>
        <form onSubmit={event => { event.preventDefault(); clearFeedback(); execute({ type: 'ADVANCE_DATE', date }, true); }}>
          <label>시연 날짜<input type="date" min={state.date} max="2026-12-31" required value={date} onChange={e => { setDate(e.target.value); clearFeedback(); }} /></label>
          <div className="settings-actions"><button type="submit" className="settings-primary" disabled={date === state.date}>날짜 적용하기</button></div>
        </form>
        <p className="settings-help">현재 {state.date} · 12월 31일까지 이동할 수 있어요.</p>
        {dirty && <p className="settings-help settings-draft">맞춤 조건에 미적용 입력이 있어요. 날짜를 바꾸면 마지막으로 적용한 조건을 사용해요.</p>}
      </section>
      <p id="settings-error" className="settings-error" role="alert">{error}</p>
      <div className="settings-state" aria-label="현재 적용 상태"><span>자동 연결 <strong>{autoCount}개</strong></span><span>적용 한도 <strong>{state.limit}개</strong></span><span>LINK ON <strong>{state.enabled ? '켜짐' : '꺼짐'}</strong></span></div>
      {autoCount > state.limit && <p className="settings-help">기존 {autoCount}개 유지 · 새 한도 {state.limit}개 · 추가 연결 없음</p>}
      {result && <div className="settings-feedback" role="status" aria-live="polite"><strong>적용 결과</strong><p>{result.message}</p>{result.added.length > 0 && <p className="settings-added">{result.added.join(' · ')}</p>}</div>}
      <button className="settings-reset" onClick={() => resetDialog.current?.showModal()}>처음부터 체험</button>
      <dialog ref={resetDialog} className="settings-reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-description">
        <h2 id="reset-title">처음부터 체험할까요?</h2><p id="reset-description">이 브라우저의 연결·제외·결제 체험 기록과 설정이 초기화돼요. 시연 날짜는 2026년 11월 3일로 돌아가요.</p>
        <div className="settings-actions"><button autoFocus className="settings-secondary" onClick={() => resetDialog.current?.close()}>취소</button><button className="settings-primary" onClick={() => { resetDialog.current?.close(); clearFeedback(); setDate(initialState.date); setLimit(String(initialState.limit)); setPattern(initialState.patterns.join(',')); setSection('matching'); onReset(); }}>초기화하고 시작</button></div>
      </dialog>
    </div>
  </section>;
}
