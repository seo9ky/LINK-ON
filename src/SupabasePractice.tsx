import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { PracticeInput } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { PracticeLogin } from './PracticeLogin';

export function SupabasePractice({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState(active);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => { if (active) setEnabled(true); }, [active]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void import('./lib/supabase').then(({ getSupabase }) => {
      if (cancelled) return;
      const auth = getSupabase().auth;
      const { data } = auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        setUser(session?.user ?? null); setChecking(false); setAuthError('');
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void auth.getSession().then(({ error }) => {
        if (error && !cancelled) { setAuthError('로그인 상태를 확인하지 못했어요. 페이지를 새로고침해 주세요.'); setChecking(false); }
      });
    }).catch(() => { if (!cancelled) { setAuthError('로그인 연결 설정을 확인해 주세요.'); setChecking(false); } });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [enabled]);
  async function logout() {
    setSigningOut(true); setAuthError('');
    try { const { signOutPractice } = await import('./lib/supabase'); await signOutPractice(); }
    catch (error) { setAuthError(error instanceof Error ? error.message : '로그아웃하지 못했어요.'); }
    finally { setSigningOut(false); }
  }
  if (checking) return <p className="settings-help" role="status">로그인 상태를 확인하는 중…</p>;
  return <>
    {authError && <p className="practice-error" role="alert">{authError}</p>}
    {user ? <>
      <div className="practice-account"><p><strong>내 문장 보관함</strong><span>{user.email}</span></p><button type="button" className="practice-refresh" onClick={() => void logout()} disabled={signingOut}>{signingOut ? '로그아웃 중…' : '로그아웃'}</button></div>
      <p className="settings-help">이 브라우저에 로그인 상태가 유지돼요. 공용 기기에서는 사용 후 로그아웃해 주세요.</p>
      <PrivatePracticeInputs key={user.id} active={active} />
    </> : <PracticeLogin />}
  </>;
}

function PrivatePracticeInputs({ active }: { active: boolean }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const [items, setItems] = useState<PracticeInput[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setListError('');
    try {
      const { listPracticeInputs } = await import('./lib/supabase');
      if (controller.signal.aborted) return;
      const rows = await listPracticeInputs(controller.signal);
      if (!controller.signal.aborted) setItems(rows);
    } catch (error) {
      if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : '목록을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (active) void refresh();
    return () => { request.current?.abort(); };
  }, [active, refresh]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!input.trim()) { setStatus('error'); setMessage('저장할 내용을 입력해 주세요.'); return; }
    pending.current = true;
    setStatus('saving'); setMessage('');
    try {
      const { savePracticeInput } = await import('./lib/supabase');
      await savePracticeInput(input);
      setInput(''); setStatus('saved'); setMessage('Supabase에 저장했어요. 아래 목록에서 확인해 보세요.');
      void refresh();
    } catch (error) {
      setStatus('error'); setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally { pending.current = false; }
  }
  return <><form className="practice-form" onSubmit={submit} aria-busy={status === 'saving'}>
    <p className="settings-help" id="practice-help">로그인한 본인이 저장한 문장만 볼 수 있어요. 실습용 문장을 입력해 주세요.</p>
    <label htmlFor="practice-input">저장할 내용</label>
    <textarea id="practice-input" rows={4} maxLength={1000} required disabled={status === 'saving'} value={input}
      aria-describedby={`practice-help practice-count${status === 'error' ? ' practice-error' : ''}`}
      aria-invalid={status === 'error' || undefined}
      onChange={event => { setInput(event.target.value); setStatus('idle'); setMessage(''); }} />
    <p id="practice-count" className="settings-help">{input.length.toLocaleString()} / 1,000자</p>
    <div className="settings-actions"><button type="submit" className="settings-primary" disabled={status === 'saving' || !input.trim()}>{status === 'saving' ? '저장 중…' : 'Supabase에 저장하기'}</button></div>
    <p className="settings-feedback" role="status" aria-live="polite" hidden={status !== 'saved'}>{status === 'saved' ? message : ''}</p>
    {status === 'error' && <p id="practice-error" className="practice-error" role="alert">{message}</p>}
  </form>
    <section className="practice-history" aria-labelledby="practice-history-title">
      <div className="practice-history-heading">
        <h3 id="practice-history-title">내가 저장한 문장</h3>
        <button type="button" className="practice-refresh" aria-label="목록 새로고침" disabled={loading || status === 'saving'} onClick={() => void refresh()}>새로고침</button>
      </div>
      <p className="settings-help">최근 20개를 최신순으로 보여드려요.</p>
      <p className="settings-help" role="status" aria-live="polite">{loading ? '목록을 불러오는 중…' : items && !listError ? `${items.length}개의 문장을 불러왔어요.` : ''}</p>
      {listError && <p className="practice-error" role="alert">{listError}{items !== null && ' 아래는 마지막으로 불러온 목록이에요.'}</p>}
      {!loading && !listError && items?.length === 0 && <p className="practice-empty">아직 저장한 문장이 없어요. 위에서 첫 문장을 남겨보세요.</p>}
      {items && items.length > 0 && <ol className="practice-list" aria-label="저장된 문장" aria-busy={loading}>
        {items.map(item => <li key={item.id}>
          <p>{item.input}</p>
          <time dateTime={item.created_at}>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.created_at))}</time>
        </li>)}
      </ol>}
    </section>
  </>;
}
