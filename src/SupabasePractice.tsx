import { useRef, useState, type FormEvent } from 'react';

export function SupabasePractice() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!input.trim()) { setStatus('error'); setMessage('저장할 내용을 입력해 주세요.'); return; }
    pending.current = true;
    setStatus('saving'); setMessage('');
    try {
      const { savePracticeInput } = await import('./lib/supabase');
      await savePracticeInput(input);
      setInput(''); setStatus('saved'); setMessage('Supabase에 저장했어요. Table Editor의 input_db에서 확인할 수 있어요.');
    } catch (error) {
      setStatus('error'); setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally { pending.current = false; }
  }
  return <form className="practice-form" onSubmit={submit} aria-busy={status === 'saving'}>
    <p className="settings-help" id="practice-help">문장을 입력하고 저장하면 Supabase 데이터베이스에 추가돼요. 실습용 문장만 입력해 주세요.</p>
    <label htmlFor="practice-input">저장할 내용</label>
    <textarea id="practice-input" rows={4} maxLength={1000} required disabled={status === 'saving'} value={input}
      aria-describedby={`practice-help practice-count${status === 'error' ? ' practice-error' : ''}`}
      aria-invalid={status === 'error' || undefined}
      onChange={event => { setInput(event.target.value); setStatus('idle'); setMessage(''); }} />
    <p id="practice-count" className="settings-help">{input.length.toLocaleString()} / 1,000자</p>
    <div className="settings-actions"><button type="submit" className="settings-primary" disabled={status === 'saving' || !input.trim()}>{status === 'saving' ? '저장 중…' : 'Supabase에 저장하기'}</button></div>
    <p className="settings-feedback" role="status" aria-live="polite" hidden={status !== 'saved'}>{status === 'saved' ? message : ''}</p>
    {status === 'error' && <p id="practice-error" className="practice-error" role="alert">{message}</p>}
  </form>;
}
