import { useState, useEffect, useRef, type Dispatch } from 'react';
import { industries, campaigns, initialState, activeLinks, reducer, selectionOutcome, type Action, type LinkState } from './model';

type SettingSection = 'matching' | 'date';
type Result = { message: string; added: string[] };
export function DemoTools({ state, dispatch, onReset, blocked = false }: { state: LinkState; dispatch: Dispatch<Action>; onReset: () => void; blocked?: boolean }) {
  const [section, setSection] = useState<SettingSection>('matching');
  const [limit, setLimit] = useState(String(state.limit));
  const [patterns, setPatterns] = useState([...state.patterns]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const resultView = useRef<HTMLDivElement>(null);
  useEffect(() => { if (result) resultView.current?.scrollIntoView({ block: 'nearest' }); }, [result]);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const patternKey = state.patterns.join(',');
  useEffect(() => { setLimit(String(state.limit)); }, [state.limit]);
  useEffect(() => { setPatterns(patternKey ? patternKey.split(',') : []); }, [patternKey]);
  // A result describes only the last applied snapshot, never later app actions.
  useEffect(() => { setResult(null); }, [state]);
  const autoCount = activeLinks(state).filter(l => l.mode === 'auto').length;
  const dirty = limit !== String(state.limit) || industries.filter(v => patterns.includes(v)).join(',') !== industries.filter(v => state.patterns.includes(v)).join(',');
  const nextMonth = [...new Set(campaigns.map(c => c.start))].sort().find(start => start.slice(0, 7) > state.date.slice(0, 7));
  const currentMonthLabel = `${state.date.slice(0, 4)}년 ${Number(state.date.slice(5, 7))}월`;
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
  const sections: [SettingSection, string][] = [['matching', '맞춤 혜택 조건'], ['date', '다음 달 체험하기']];
  return <section className="demo-tools" inert={blocked} aria-labelledby="demo-settings-title">
    <h2 id="demo-settings-title" className="settings-heading">체험 조건 바꾸기</h2>
    <div className="settings-content">
      <p className="settings-intro">가상의 소비 조건을 바꾸거나 다음 달의 혜택을 체험해 보세요.</p>
      <div className="settings-tabs" role="tablist" aria-label="체험 조건 항목">{sections.map(([key, label], index) => <button key={key} id={`setting-tab-${key}`} role="tab" aria-selected={section === key} aria-controls={`setting-panel-${key}`} tabIndex={section === key ? 0 : -1} onClick={() => { setSection(key); clearFeedback(); }} onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % sections.length : event.key === 'ArrowLeft' ? (index + sections.length - 1) % sections.length : event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); setSection(sections[next][0]); clearFeedback(); document.getElementById(`setting-tab-${sections[next][0]}`)?.focus();
      }}>{label}</button>)}</div>
      <section className="settings-panel" id="setting-panel-matching" role="tabpanel" aria-labelledby="setting-tab-matching" hidden={section !== 'matching'}>
        <form onSubmit={event => { event.preventDefault(); clearFeedback(); if (!validLimit) { setError('자동 연결 한도는 0~20의 정수로 입력해 주세요.'); return; } execute({ type: 'APPLY_CONDITIONS', limit: Number(limit), patterns: industries.filter(v => patterns.includes(v)) }); }} noValidate>
          <fieldset className="settings-industries" aria-describedby="pattern-help">
            <legend>평소 소비 업종 <span>여러 개 선택</span></legend>
            <div className="settings-industry-grid">{industries.map(industry => <button key={industry} type="button" aria-pressed={patterns.includes(industry)} onClick={() => { setPatterns(values => values.includes(industry) ? values.filter(v => v !== industry) : [...values, industry]); clearFeedback(); }}><span aria-hidden="true">{patterns.includes(industry) ? '✓' : '+'}</span>{industry}</button>)}</div>
          </fieldset>
          <p id="pattern-help" className="settings-help">가상 결제 이력이에요. 앱에서 고른 관심 업종과 함께 참고해요.{patterns.length === 0 && ' 선택하지 않으면 관심 업종만 참고해요.'}</p>
          <label>자동으로 챙길 수 있는 혜택 수<input type="number" min="0" max="20" step="1" aria-describedby="limit-help settings-error" aria-invalid={!validLimit} value={limit} onChange={e => { setLimit(e.target.value); clearFeedback(); }} /></label>
          <p id="limit-help" className="settings-help">체험용 최대 개수예요. 줄여도 기존 연결은 유지돼요.</p>
          <div className="settings-actions"><button className="settings-primary" type="submit">조건 적용하기</button></div>
          {dirty && <p className="settings-help settings-draft">아직 적용하지 않은 조건이에요.</p>}
        </form>
      </section>
      <section className="settings-panel" id="setting-panel-date" role="tabpanel" aria-labelledby="setting-tab-date" hidden={section !== 'date'}>
        <div className="settings-month"><span>현재 체험 중</span><strong>{currentMonthLabel}</strong></div>
        {nextMonth ? <>
          <p className="settings-help">이번 달 혜택은 만료되고, LINK ON이 켜져 있으면 다음 달의 맞춤 혜택을 새로 연결해요. 결제 기록은 유지돼요.</p>
          <div className="settings-actions"><button className="settings-primary" onClick={() => { clearFeedback(); execute({ type: 'ADVANCE_DATE', date: nextMonth }, true); }}>다음 달로 이동 <span aria-hidden="true">→</span></button></div>
          <p className="settings-help">{Number(state.date.slice(5, 7))}월 → {Number(nextMonth.slice(5, 7))}월 · 마지막으로 적용한 조건을 사용해요.</p>
          {dirty && <p className="settings-help settings-draft">아직 적용하지 않은 맞춤 조건이 있어요. 새 조건으로 체험하려면 먼저 적용해 주세요.</p>}
        </> : <p className="settings-help">준비된 마지막 행사예요. 다시 살펴보려면 아래 ‘처음부터 체험’을 눌러 주세요.</p>}
      </section>
      <p id="settings-error" className="settings-error" role="alert">{error}</p>
      <div className="settings-state" aria-label="현재 적용 상태"><span>자동 연결 <strong>{autoCount}개</strong></span><span>적용 한도 <strong>{state.limit}개</strong></span><span>LINK ON <strong>{state.enabled ? '켜짐' : '꺼짐'}</strong></span></div>
      {autoCount > state.limit && <p className="settings-help">기존 {autoCount}개 유지 · 새 한도 {state.limit}개 · 추가 연결 없음</p>}
      {result && <div ref={resultView} className="settings-feedback" role="status" aria-live="polite"><strong>적용 결과</strong><p>{result.message}</p>{result.added.length > 0 && <p className="settings-added">{result.added.join(' · ')}</p>}</div>}
      <button className="settings-reset" onClick={() => resetDialog.current?.showModal()}>처음부터 체험</button>
      <dialog ref={resetDialog} className="settings-reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-description">
        <h2 id="reset-title">처음부터 체험할까요?</h2><p id="reset-description">이 브라우저의 연결·제외·결제 체험 기록과 설정이 초기화돼요. 시연 날짜는 2026년 11월 3일로 돌아가요.</p>
        <div className="settings-actions"><button autoFocus className="settings-secondary" onClick={() => resetDialog.current?.close()}>취소</button><button className="settings-primary" onClick={() => { resetDialog.current?.close(); clearFeedback(); setLimit(String(initialState.limit)); setPatterns([...initialState.patterns]); setSection('matching'); onReset(); }}>초기화하고 시작</button></div>
      </dialog>
    </div>
  </section>;
}
