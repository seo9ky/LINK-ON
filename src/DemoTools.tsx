import { useState, useEffect, useRef, type Dispatch } from 'react';
import { initialState, activeLinks, reducer, selectionOutcome, type Action, type LinkState } from './model';

type Result = { message: string; added: string[] };
export function DemoTools({ state, dispatch, onReset, onViewBenefits, blocked = false }: { state: LinkState; dispatch: Dispatch<Action>; onReset: () => void; onViewBenefits: () => void; blocked?: boolean }) {
  const [limit, setLimit] = useState(String(state.limit));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const resultView = useRef<HTMLDivElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const pendingResult = useRef<Result | null>(null);
  useEffect(() => { setLimit(String(state.limit)); }, [state.limit]);
  useEffect(() => { setResult(pendingResult.current); pendingResult.current = null; }, [state]);
  useEffect(() => { if (result) resultView.current?.scrollIntoView({ block: 'nearest' }); }, [result]);
  const autoCount = activeLinks(state).filter(l => l.mode === 'auto').length;
  const dirty = limit !== String(state.limit);
  const validLimit = limit.trim() !== '' && Number.isInteger(Number(limit)) && Number(limit) >= 0 && Number(limit) <= 20;
  const clearFeedback = () => { setError(''); setResult(null); };
  const adjust = (delta: number) => { setLimit(String(Math.max(0, Math.min(20, (validLimit ? Number(limit) : state.limit) + delta)))); clearFeedback(); };
  const apply = () => {
    clearFeedback();
    if (!validLimit) { setError('자동 연결 한도는 0~20의 정수로 입력해 주세요.'); return; }
    const action: Action = { type: 'APPLY_CONDITIONS', limit: Number(limit), patterns: state.patterns };
    const next = reducer(state, action);
    const outcome = selectionOutcome(state, next);
    pendingResult.current = { ...outcome, message: outcome.message.replace(/^조건을 저장했어요\. /, '') };
    dispatch(action);
  };
  return <section className="demo-tools limit-tools" inert={blocked} aria-labelledby="demo-settings-title">
    <h2 id="demo-settings-title" className="settings-heading">자동 연결 한도 체험</h2>
    <div className="settings-content">
      <p className="settings-intro">맞춤 혜택을 자동으로 연결할 개수를 정해보세요.</p>
      <div className="settings-panel">
        <form onSubmit={event => { event.preventDefault(); apply(); }} noValidate>
          <label htmlFor="auto-link-limit">자동 연결 한도</label>
          <div className="limit-stepper">
            <button type="button" aria-label="한도 1개 줄이기" disabled={validLimit && Number(limit) === 0} onClick={() => adjust(-1)}>−</button>
            <div className="limit-value"><input id="auto-link-limit" aria-label="자동 연결 한도" type="number" inputMode="numeric" min="0" max="20" step="1" aria-describedby="limit-help settings-error" aria-invalid={!validLimit} value={limit} onChange={e => { setLimit(e.target.value); clearFeedback(); }} /><span aria-hidden="true">개</span></div>
            <button type="button" aria-label="한도 1개 늘리기" disabled={validLimit && Number(limit) === 20} onClick={() => adjust(1)}>+</button>
          </div>
          <p id="limit-help" className="settings-help">맞는 혜택만 연결해요. 한도를 줄여도<br />이미 연결된 혜택은 유지돼요.</p>
          <div className="settings-actions"><button className="settings-primary" type="submit">한도 적용하기</button></div>
          {dirty && <p className="settings-help settings-draft">아직 적용하지 않은 한도예요.</p>}
        </form>
      </div>
      <p id="settings-error" className="settings-error" role="alert">{error}</p>
      <div className="settings-state" aria-label="현재 적용 상태"><span>자동 연결 <strong>{autoCount}개</strong></span><span>한도 <strong>{state.limit}개</strong></span></div>
      {autoCount > state.limit && <p className="settings-help">기존 {autoCount}개 유지 · 추가 연결 없음</p>}
      {result && <div ref={resultView} className="settings-feedback" role="status" aria-live="polite"><strong>한도를 적용했어요</strong><p>{result.message}</p>{result.added.length > 0 && <p className="settings-added">{result.added.join(' · ')}</p>}<button className="settings-view-benefits" onClick={onViewBenefits}>{activeLinks(state).length ? '연결된 혜택 보기' : '앱 화면으로 돌아가기'} <span aria-hidden="true">↑</span></button></div>}
      <button className="settings-reset" onClick={() => resetDialog.current?.showModal()}>처음부터 체험</button>
      <dialog ref={resetDialog} className="settings-reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-description">
        <h2 id="reset-title">처음부터 체험할까요?</h2><p id="reset-description">이 브라우저의 연결·제외·결제 체험 기록과 설정이 초기화돼요.</p>
        <div className="settings-actions"><button autoFocus className="settings-secondary" onClick={() => resetDialog.current?.close()}>취소</button><button className="settings-primary" onClick={() => { resetDialog.current?.close(); clearFeedback(); setLimit(String(initialState.limit)); onReset(); }}>초기화하고 시작</button></div>
      </dialog>
    </div>
  </section>;
}
