import { useEffect, useRef, useState, type FormEvent } from 'react';

export function InquiryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const submission = useRef<{ id: string; payload: string } | null>(null);
  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      dialog.current?.close();
      previous?.focus({ preventScroll: true });
    };
  }, [open]);
  function close() {
    if (status === 'sent') { setStatus('idle'); submission.current = null; }
    onClose();
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (!message.trim()) { setError('문의 내용을 입력해 주세요.'); setStatus('error'); return; }
    if (website) { setError('입력 내용을 확인해 주세요.'); setStatus('error'); return; }
    const payload = JSON.stringify([message.trim(), email.trim()]);
    if (submission.current?.payload !== payload) submission.current = { id: crypto.randomUUID(), payload };
    pending.current = true; setStatus('sending'); setError('');
    try {
      const { submitInquiry } = await import('./lib/supabase');
      await submitInquiry(submission.current.id, message, email);
      setStatus('sent'); setMessage(''); setEmail('');
    } catch {
      setStatus('error');
      setError('접수를 확인하지 못했어요. 입력 내용은 그대로 남아 있습니다. 잠시 후 다시 시도해 주세요.');
    } finally { pending.current = false; }
  }
  return <dialog ref={dialog} className="inquiry-dialog" aria-labelledby="inquiry-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="inquiry-heading"><span className="inquiry-eyebrow">LINK ON</span><button type="button" className="inquiry-close" onClick={close} aria-label="문의 창 닫기"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></button></div>
    {status === 'sent' ? <div className="inquiry-success"><span className="inquiry-check" aria-hidden="true">✓</span><h2 id="inquiry-title">문의가 접수되었습니다.</h2><p>남겨주신 내용을 확인하겠습니다.</p><button className="inquiry-submit" onClick={close}>확인</button></div> : <>
      <h2 id="inquiry-title">문의하기</h2><p className="inquiry-intro">궁금한 점이나 의견을 남겨 주세요.</p>
      <form onSubmit={send} className="inquiry-form" aria-busy={status === 'sending'}>
        <label htmlFor="inquiry-message">문의 내용 <span>필수</span></label>
        <textarea id="inquiry-message" autoFocus required maxLength={2000} rows={5} disabled={status === 'sending'} value={message} onChange={event => { setMessage(event.target.value); setError(''); }} aria-describedby="inquiry-count" />
        <p id="inquiry-count" className="inquiry-count">{message.length.toLocaleString()} / 2,000</p>
        <label htmlFor="inquiry-email">답변받을 이메일 <span>선택</span></label>
        <input id="inquiry-email" type="email" autoComplete="email" maxLength={254} disabled={status === 'sending'} value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" />
        <div className="inquiry-trap" aria-hidden="true"><label>웹사이트<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label></div>
        <p className="inquiry-privacy">답변을 원하시면 이메일을 남겨 주세요.<br />입력한 정보는 문의 확인과 답변에만 사용합니다.</p>
        {error && <p className="inquiry-error" role="alert">{error}</p>}
        <button className="inquiry-submit" type="submit" disabled={status === 'sending' || !message.trim()}>{status === 'sending' ? '보내는 중…' : '문의 보내기'}</button>
      </form>
    </>}
  </dialog>;
}
