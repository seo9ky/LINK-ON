import { useEffect, useRef, useState, type FormEvent } from 'react';

export function PracticeLogin() {
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (pending.current || cooldown) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const { sendPracticeLink } = await import('./lib/supabase');
      await sendPracticeLink(sentEmail || email);
      setSentEmail(sentEmail || email.trim()); setCooldown(60);
    } catch (err) { setError(err instanceof Error ? err.message : '인증 메일을 보내지 못했어요.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className="practice-login">
    <h3>내 문장을 안전하게 보관하세요</h3>
    <p className="settings-help">이메일로 받은 링크로 로그인하면 본인의 문장만 저장하고 볼 수 있어요. 처음 이용하는 이메일은 인증 후 계정이 만들어져요.</p>
    {!sentEmail ? <form className="practice-form" onSubmit={send} aria-busy={busy}>
      <label htmlFor="practice-email">이메일</label>
      <input id="practice-email" type="email" required autoComplete="email" value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
      <div className="settings-actions"><button className="settings-primary" disabled={busy || !email.trim() || cooldown > 0}>{busy ? '메일 보내는 중…' : cooldown ? `${cooldown}초 후 다시 요청` : '이메일 로그인 링크 받기'}</button></div>
    </form> : <div className="practice-form" aria-busy={busy}>
      <p className="settings-help" role="status">{sentEmail}로 로그인 링크를 보냈어요. 받은편지함과 스팸함을 확인해 주세요.</p>
      <p className="settings-help">링크는 요청한 기기의 같은 브라우저에서 열어 주세요. 돌아오면 내 문장 보관함이 열려요.</p>
      <div className="practice-login-actions"><button type="button" className="practice-refresh" disabled={busy || cooldown > 0} onClick={() => void send()}>{cooldown ? `${cooldown}초 후 다시 받기` : '로그인 링크 다시 받기'}</button><button type="button" className="practice-refresh" disabled={busy} onClick={() => { setSentEmail(''); setError(''); }}>이메일 변경</button></div>
    </div>}
    {error && <p className="practice-error" role="alert">{error}</p>}
  </div>;
}
