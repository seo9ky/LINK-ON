import React, { useEffect, useLayoutEffect, useRef, useState, useReducer, type ReactNode, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { initialState, industries, merchants, readState, reducer, storageKey, type AutoId, type MerchantId } from './model';
import { initializeNavigation, useNavigation } from './navigation';
import './styles.css';

const asset = (name: string) => `/assets/${name}`;
function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return <span className="asset-icon" style={{ width: size, height: size }} aria-hidden="true"><img src={asset(name)} alt="" /></span>;
}
function LinkLogo({ size = 170 }: { size?: 128 | 170 | 180 | 190 }) {
  const ratio = size / 128;
  const base: CSSProperties = { width: size, height: 29.538 * ratio };
  const pos = (left: number, top: number, width: number, height: number): CSSProperties => ({ left: left * ratio, top: top * ratio, width: width * ratio, height: height * ratio });
  return <div className="link-on-logo" style={base} role="img" aria-label="LINK ON">
    <img src={asset(`logo-${size}-link.svg`)} style={pos(0, 1.56, 82.963, 26.413)} alt="" />
    <span className="logo-track" style={pos(87.37, 4.61, 40.635, 20.317)} />
    <span className="logo-on" style={{ ...pos(92.14, 8.98, 14.561, 11.578), fontSize: 8.8 * ratio, lineHeight: `${11.513 * ratio}px` }}>ON</span>
    <img src={asset(`logo-${size}-knob.svg`)} style={pos(110.05, 6.98, 15.577, 15.577)} alt="" />
    <img src={asset(`logo-${size}-dot.svg`)} style={pos(116.49, 13.41, 2.709, 2.709)} alt="" />
  </div>;
}
function StatusBarIPhone() {
  return <div className="status-bar" aria-hidden="true"><span className="status-time">9:41</span><span className="island" /><div className="status-levels"><span className="cellular"><i /><i /><i /><i /></span><img src={asset('wifi.svg')} alt="" /><img src={asset('battery.svg')} alt="" /></div></div>;
}
function HomeIndicator() { return <div className="home-indicator" aria-hidden="true"><span /></div>; }
function Button({ children, onClick, secondary, disabled = false }: { children: ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className={`button ${secondary ? 'secondary' : 'primary'}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Note({ children }: { children: ReactNode }) { return <aside className="note">{children}</aside>; }
function Pill({ children }: { children: ReactNode }) { return <span className="pill">{children}</span>; }
function Merchant({ id, large = false }: { id: MerchantId; large?: boolean }) {
  return <img className={`merchant ${id} ${large ? 'large' : ''}`} src={asset(merchants[id].image)} alt="" />;
}
function Benefit({ id, mode, onClick, onAction = onClick, retained = false }: { id: MerchantId; mode: 'link' | 'complete' | 'detail' | 'exclude'; onClick: () => void; onAction?: () => void; retained?: boolean }) {
  const item = merchants[id];
  const actionLabel = mode === 'link' ? '혜택 링크' : mode === 'exclude' ? '혜택 제외' : mode === 'complete' ? '연결 완료 · 상세 보기' : '상세 보기';
  return <div className="benefit">
    <button className="benefit-body" onClick={onClick} aria-label={`${item.name} 혜택 상세`}>
    <Merchant id={id} /><span className="benefit-info"><span className="merchant-name">{item.name}</span><strong>{item.discount}</strong><span className="condition">{retained ? '기존 연결 유지' : `${item.minimum} 이상 결제`} · 11.30까지</span></span>
    </button>
    <button className={`benefit-action ${mode}`} onClick={onAction} aria-label={`${item.name} ${actionLabel}`}>
      {mode === 'link' && <><Icon name="plus.svg" size={16} /><span>링크</span></>}
      {mode === 'complete' && <><Icon name="check-complete.svg" size={16} /><span>완료</span></>}
      {mode === 'detail' && <><span>상세</span><Icon name="right.svg" size={16} /></>}
      {mode === 'exclude' && '제외'}
    </button>
  </div>;
}
function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return <button className="toggle-hit" role="switch" aria-label="LINK ON 자동 연결" aria-checked={checked} onClick={onClick}>{checked ? <img src={asset('switch-on.svg')} width={54} height={32} alt="" /> : <span className="toggle-off"><span /></span>}</button>;
}
function Details({ rows }: { rows: [string, string][] }) { return <dl className="details">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>; }
function ServiceInfo({ help = false }: { help?: boolean }) {
  const rows = help ? [
    ['gift.svg', 'LINK ON으로 자동 연결', '동의 후 고객별 한도 내에서 맞는 혜택을 골라요.'],
    ['shield.svg', '원하는 혜택은 직접 LINK', '상세 조건을 확인하고 결제 전에 연결해요.'],
    ['settings.svg', '관리와 해제는 언제든', '개별 혜택을 제외하거나 자동 연결을 끌 수 있어요.'],
  ] : [
    ['gift.svg', '맞는 혜택만 자동 연결', '이용 패턴과 관심 업종을 바탕으로 골라요.'],
    ['shield.svg', '맞는 혜택이 없으면 연결하지 않아요', '적합한 혜택이 생기면 자동으로 연결해 드려요.'],
    ['settings.svg', '선택과 해제는 자유롭게', '나머지 혜택은 직접 선택하고, 언제든 끌 수 있어요.'],
  ];
  return <div className="card service-info">{rows.map(([icon, title, description]) => <div className="service-row" key={title}><Icon name={icon} /><div><strong>{title}</strong><p className="small muted">{description}</p></div></div>)}</div>;
}
function ConfirmSheet({ title, children, confirm, cancel, onConfirm, onClose, returnFocus }: { title: string; children: ReactNode; confirm: string; cancel: string; onConfirm: () => void; onClose: () => void; returnFocus: HTMLElement | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const saved = { position: body.style.position, top: body.style.top, width: body.style.width };
    Object.assign(body.style, { position: 'fixed', top: `${-scrollY}px`, width: '100%' });
    return () => { Object.assign(body.style, saved); window.scrollTo(0, scrollY); };
  }, []);
  useEffect(() => {
    const previous = returnFocus;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => { requestAnimationFrame(() => { (previous?.isConnected ? previous : document.querySelector<HTMLElement>('h1'))?.focus({ preventScroll: true }); }); };
  }, []);
  return <div className="modal-layer"><div className="scrim" onClick={onClose} /><div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'Tab') { const buttons = ref.current?.querySelectorAll('button'); if (!buttons) return; const first = buttons[0]; const last = buttons[buttons.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus({ preventScroll: true }); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus({ preventScroll: true }); } }
  }}><div className="sheet-handle" /><h2 id="confirm-title">{title}</h2><p className="muted">{children}</p><Button onClick={onConfirm}>{confirm}</Button><Button secondary onClick={onClose}>{cancel}</Button></div><HomeIndicator /></div>;
}

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, readState);
  const { hash, go, home, back: historyBack } = useNavigation();
  const [consent, setConsent] = useState(false);
  const [draft, setDraft] = useState(state.interests);
  const [scale, setScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modalOrigin = useRef<HTMLElement | null>(null);
  const [path, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);
  const requestedModal = params.get('confirm');
  const modal = requestedModal === 'unlink' ? (state.manualLinked ? requestedModal : null)
    : requestedModal === 'off' ? (state.enabled ? requestedModal : null)
    : requestedModal === 'exclude-starbucks' ? (state.linkedAuto.includes('starbucks') ? requestedModal : null)
    : requestedModal === 'exclude-ssf' ? (state.linkedAuto.includes('ssf') ? requestedModal : null) : null;
  const auto = state.linkedAuto;
  const count = auto.length + Number(state.manualLinked);
  const back = () => path === '/linked' ? home() : historyBack();
  const closeModal = historyBack;
  const openModal = (kind: string) => { modalOrigin.current = document.activeElement as HTMLElement | null; window.scrollTo(0, 0); go(`${path}?confirm=${kind}`); };
  const openDetail = (id: MerchantId) => go(`/benefit/${id}`, path === '/linked');
  const linkManual = () => { dispatch({ type: 'LINK_MANUAL' }); go('/linked', path === '/benefit/gs25'); };
  const openInterests = () => { setDraft([...state.interests]); go('/interests'); };
  const results = () => go('/results');
  const toggle = () => state.enabled ? openModal('off') : state.optedIn ? dispatch({ type: 'ENABLE' }) : go('/consent');
  useEffect(() => {
    if (requestedModal && !modal) go(path, true);
    if (path === '/linked' && !state.manualLinked) go('/benefit/gs25', true);
  }, [hash, state.manualLinked, modal]);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* The demo remains functional without browser storage. */ } }, [state]);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); window.scrollTo(0, 0); document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); }, [path]);
  useEffect(() => { const resize = () => setScale(window.innerWidth > 560 ? Math.min(1, Math.max(0.55, (window.innerHeight - 84) / 956)) : 1); resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);

  let title = 'LINK'; let content: ReactNode; let footer: ReactNode = null; let contentClass = 'standard';
  const linkHeader = <div className="link-header"><img src={asset('link.svg')} width={110} height={35.02} alt="LINK" /><button className="help-button" onClick={() => go('/help')}>이용방법</button></div>;
  const gs = <Benefit id="gs25" mode={state.manualLinked ? 'complete' : 'link'} onClick={() => openDetail('gs25')} onAction={state.manualLinked ? () => openDetail('gs25') : linkManual} />;
  const resultFooter = <Button secondary onClick={results}>받은 혜택 · 이용 결과 보기</Button>;
  const autoBenefits = (mode: 'detail' | 'complete' = 'detail') => auto.map(id => <Benefit key={id} id={id} mode={mode} retained={mode === 'complete'} onClick={() => openDetail(id)} />);
  const isMain = path === '/';

  if (isMain && !state.optedIn) {
    contentClass = 'start';
    content = <>{linkHeader}<div className="summary"><div><span>링크한 혜택</span><strong aria-label="링크한 혜택 개수">{count}개</strong></div><div><span>받은 혜택금액</span><strong>{state.demoResults ? '1,000' : '0'}원</strong></div></div><div className="card intro"><LinkLogo size={190} /><h2>나에게 맞는 혜택,<br />알아서 LINK!</h2><p className="muted intro-description">혜택을 찾고 연결하는 번거로움은 줄이고,<br />필요한 혜택은 직접 고를 수 있어요.</p><Button onClick={() => { setConsent(false); go('/consent'); }}>LINK ON 시작하기</Button></div><h3>일상을 채우는 혜택</h3>{gs}<Note>시연용 혜택 예시 · 실제 제공 조건과 다를 수 있어요.</Note></>;
  } else if (isMain && !state.enabled) {
    content = <><LinkLogo size={180} /><h2>자동 연결을 껐어요</h2><p className="muted">새 혜택은 자동 연결되지 않아요.<br />이미 연결된 혜택은 만료일까지 이용할 수 있어요.</p><h3>연결된 혜택</h3>{autoBenefits('complete')}{state.manualLinked && gs}<Note>다른 혜택은 기존 LINK처럼 직접 선택할 수 있어요.</Note></>;
    footer = <><div className="quick-actions"><Button secondary onClick={() => go('/manual')}>직접 고르는 혜택</Button><Button secondary onClick={results}>이용 결과</Button></div><Button onClick={() => dispatch({ type: 'ENABLE' })}>LINK ON 다시 켜기</Button></>;
  } else if (isMain && !auto.length) {
    content = <><LinkLogo size={180} /><div className="status-circle"><Icon name="gift-large.svg" size={52} /></div><h2>지금은 자동으로 연결할<br />혜택이 없어요</h2><p className="muted">고객님의 관심 업종과 이용 패턴에 맞는<br />혜택이 생기면 연결해 드려요.</p><Note>LINK ON은 켜져 있어요.<br />적합한 혜택만 고객별 한도 내에서 연결해요.</Note><h3>직접 고르는 혜택</h3>{gs}</>;
    footer = <><div className="quick-actions"><Button secondary onClick={() => go('/manage')}>자동 LINK 관리</Button><Button secondary onClick={results}>이용 결과</Button></div><Button secondary onClick={openInterests}>관심 업종 확인하기</Button></>;
  } else if (isMain) {
    contentClass = 'main-on';
    content = <>{linkHeader}<div className="summary"><div><span>링크한 혜택</span><strong aria-label="링크한 혜택 개수">{count}개</strong></div><div><span>받은 혜택금액</span><strong>{state.demoResults ? '1,000' : '0'}원</strong></div></div><div className="active-banner"><div><LinkLogo size={128} /><p className="small muted">고객님께 맞는 혜택 {auto.length}개를 연결했어요.</p></div><Toggle checked={state.enabled} onClick={toggle} /></div><div className="section-heading"><h3>자동으로 연결된 혜택</h3><button className="text-action" onClick={() => go('/manage')}>관리 ›</button></div>{autoBenefits()}<h3>직접 고르는 혜택</h3>{gs}</>;
    footer = resultFooter;
  } else if (path === '/consent' || path === '/help') {
    const help = path === '/help'; title = help ? 'LINK 이용방법' : 'LINK ON 시작';
    content = <><LinkLogo /><h2>{help ? '필요한 혜택을 편하게 챙겨요' : '자동 LINK를 시작할까요?'}</h2><p className="muted">{help ? <>맞춤 혜택은 자동으로,<br />나머지 혜택은 직접 선택할 수 있어요.</> : <>한 번 동의하면 맞춤 혜택을<br />고객별 한도 내에서 자동으로 연결해 드려요.</>}</p><ServiceInfo help={help} />{help ? <p className="small muted">연결 완료와 실제 할인 적용은 서로 다른 상태예요.</p> : <><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>[필수] 자동 LINK 이용에 동의합니다.</span></label><p className="small muted">혜택 적용 조건·연결 이유는 상세 화면에서 확인할 수 있습니다.</p></>}</>;
    footer = <Button disabled={!help && !consent} onClick={help ? back : () => { setDraft([...state.interests]); go('/interests'); }}>{help ? '확인' : '동의하고 시작하기'}</Button>;
  } else if (path === '/interests') {
    title = '관심 업종 설정';
    content = <><h2>자주 이용하는 업종을<br />알려주세요</h2><p className="muted">자주 이용하는 업종을 여러 개 선택할 수 있어요.</p><div className="industry-grid">{industries.map(name => <button key={name} aria-pressed={draft.includes(name)} className={`industry ${draft.includes(name) ? 'selected' : ''}`} onClick={() => setDraft(values => values.includes(name) ? values.filter(v => v !== name) : [...values, name])}>{name}</button>)}</div><Note>선택한 업종과 이용 패턴을 함께 참고해요.<br />변경한 업종은 다음 혜택 선정부터 반영돼요.</Note></>;
    footer = <Button disabled={!state.optedIn && !consent} onClick={() => { dispatch({ type: 'SAVE_INTERESTS', values: draft, activate: !state.optedIn && consent }); home(); }}>저장하고 혜택 확인하기</Button>;
  } else if (path.startsWith('/benefit/')) {
    title = '혜택 상세'; contentClass = 'detail';
    const requested = path.split('/')[2]; const id: MerchantId = requested in merchants ? requested as MerchantId : 'gs25';
    const item = merchants[id]; const manual = id === 'gs25'; const excluded = !manual && state.excluded.includes(id);
    content = <><Pill>{manual ? state.manualUnlinked ? '해제 완료' : '직접 LINK' : excluded ? '제외 완료' : '자동 LINK'}</Pill><div className="detail-merchant"><Merchant id={id} large /><div><p className="muted">{item.name}</p><h2>{item.discount}</h2></div></div><p className="muted">{item.subtitle}</p><div className="card reason"><strong><Icon name="gift.svg" />{manual ? '혜택 이용방법' : '이 혜택을 연결한 이유'}</strong><p className="muted">{manual ? <>결제 전에 링크하고 삼성카드로 결제하세요.<br />조건을 충족하면 혜택이 적용돼요.</> : <>{item.reason}<br />고객님께 맞는 혜택으로 골랐어요.</>}</p></div><Details rows={[
      ['결제 조건', `한 번에 ${item.minimum} 이상`], ['이용 기간', '2026.11.01–11.30'], ['이용 횟수', '기간 내 1회'], ['혜택 중복', '다른 카드 할인과 중복 적용되지 않아요.'],
    ]} />{manual && state.manualLinked && <button className="text-action left" onClick={() => openModal('unlink')}>이 혜택 LINK 해제</button>}{!manual && !excluded && <button className="text-action left" onClick={() => openModal(`exclude-${id}`)}>이 혜택 제외하기</button>}<Note>다른 할인과 조건이 겹치면 더 큰 할인 1건을 적용해요.</Note></>;
    footer = <Button onClick={manual ? state.manualLinked ? home : linkManual : () => go('/manage')}>{manual ? state.manualLinked ? 'LINK 메인으로' : '이 혜택 링크하기' : '연결된 혜택 확인하기'}</Button>;
  } else if (path === '/linked') {
    title = '직접 고른 혜택';
    content = <><div className="status-circle"><Icon name="check-success.svg" size={48} /></div><h2>{state.manualLinked ? '혜택을 직접 연결했어요' : '직접 LINK를 해제했어요'}</h2><p className="muted">자동 LINK 외에도 원하는 혜택을<br />직접 골라 이용할 수 있어요.</p>{gs}<Note>결제 전에 연결한 혜택입니다.<br />이용 조건을 충족하면 혜택이 적용됩니다.</Note></>;
    footer = <Button onClick={home}>LINK 메인으로</Button>;
  } else if (path === '/manage') {
    title = '자동 LINK 관리';
    content = <><h2>자동 연결을 관리하세요</h2><div className="manage-toggle"><h3>LINK ON {state.enabled ? '사용 중' : '꺼짐'}</h3><Toggle checked={state.enabled} onClick={toggle} /></div><div className="interest-summary"><div><p className="small muted">관심 업종</p><strong>{state.interests.length ? state.interests.join(' · ') : '선택한 업종 없음'}</strong></div><button className="text-action small" onClick={openInterests}>관심 업종 변경 ›</button></div><h3>자동 연결 혜택 {auto.length}개</h3>{auto.map(id => <Benefit key={id} id={id} mode="exclude" onClick={() => openDetail(id)} onAction={() => openModal(`exclude-${id}`)} />)}<Note>제외한 이번 행사 혜택은 다시 자동 연결하지 않아요.</Note><button className="text-action left" onClick={toggle}>{state.enabled ? 'LINK ON 전체 해제' : 'LINK ON 다시 켜기'}</button></>;
    footer = <Button onClick={home}>관리 완료</Button>;
  } else if (path.startsWith('/excluded/')) {
    title = '자동 LINK 관리'; const requested = path.split('/')[2]; const id = requested === 'ssf' ? 'ssf' : 'starbucks';
    content = <><Pill>제외 완료</Pill><h2>{merchants[id].name} 혜택을 제외했어요</h2><p className="muted">이 혜택의 연결을 취소했어요.<br />이번 행사 혜택은 다시 자동 연결하지 않아요.</p><h3>남은 자동 연결 혜택 {auto.length}개</h3>{autoBenefits()}<Note>{auto.length ? '다른 자동 LINK 혜택은 계속 이용할 수 있어요.' : '지금은 자동 연결된 혜택이 없어요. 다른 혜택은 직접 고를 수 있어요.'}</Note></>;
    footer = resultFooter;
  } else if (path === '/manual') {
    title = '직접 고르는 혜택'; contentClass = 'start';
    content = <>{linkHeader}<h3>일상을 채우는 혜택</h3>{gs}<Note>시연용 혜택 예시 · 실제 제공 조건과 다를 수 있어요.</Note></>; footer = <Button onClick={home}>LINK 메인으로</Button>;
  } else if (path.startsWith('/results')) {
    title = '이용 결과';
    const tab = path.split('/')[2] || 'done';
    if (!state.demoResults) {
      content = <><LinkLogo size={180} /><div className="status-circle"><Icon name="gift-large.svg" size={52} /></div><h2>아직 이용 내역이 없어요</h2><p className="muted">혜택을 연결한 뒤 조건에 맞게 결제하면<br />이곳에서 적용 결과를 확인할 수 있어요.</p><Note>시연용 예시 결제 내역을 불러와<br />적용 완료·확인 중·미적용 상태를 확인해 보세요.</Note></>;
      footer = <Button onClick={() => { dispatch({ type: 'LOAD_DEMO_RESULTS' }); go('/results/done', true); }}>예시 결제 내역 불러오기</Button>;
    } else {
      const pending = tab === 'pending'; const failed = tab === 'failed';
      const id: MerchantId = pending ? 'ssf' : failed ? 'gs25' : 'starbucks';
      const label = pending ? '확인 중' : failed ? '미적용' : '적용 완료';
      content = <><h2>내가 받은 LINK 혜택</h2><div className="result-tabs" role="tablist" aria-label="혜택 적용 상태">{[['done', '적용 완료'], ['pending', '확인 중'], ['failed', '미적용']].map(([value, text]) => <button key={value} role="tab" aria-selected={(tab === value) || (tab === '' && value === 'done')} className={label === text ? 'selected' : ''} onClick={() => go(`/results/${value}`, true)}>{text}</button>)}</div><div className="card result-card"><div className="result-icons"><Merchant id={id} /><Icon name={pending ? 'clock.svg' : failed ? 'info.svg' : 'check-result.svg'} size={40} /></div><h3>{pending ? '결제 내역을 확인 중이에요' : failed ? '이번 결제는 적용되지 않았어요' : '1,000원 혜택 적용'}</h3><p className="muted">{pending ? '매출전표가 접수되면 적용 여부를 확인해요.' : failed ? '최소 결제금액을 충족하지 않았어요.' : '자동 LINK로 챙긴 혜택이에요.'}</p></div><Details rows={[
        ['이용 가맹점', merchants[id].name], ['결제금액', pending ? '32,000원' : failed ? '4,500원' : '6,500원'], ['이용일', '2026.11.03'], ['연결 방식', failed ? '직접 LINK' : '자동 LINK'], ['혜택 상태', label],
      ]} /><Note>시연용 예시 결제 내역입니다. 실제 결제는 발생하지 않아요.</Note></>;
      footer = <Button onClick={home}>LINK 메인으로</Button>;
    }
  } else { content = <><h2>LINK 메인으로 돌아가세요</h2><Button onClick={home}>LINK 메인으로</Button></>; }

  const excludeId: AutoId = modal === 'exclude-ssf' ? 'ssf' : 'starbucks';
  return <div className="preview"><div className="preview-stage" style={{ zoom: scale } as CSSProperties}><div className="phone" data-screen={path}>
    <div className="screen-body" inert={!!modal}><StatusBarIPhone /><nav className="navigation" aria-label="화면 이동">{!isMain ? <button className="nav-icon" onClick={back} aria-label="뒤로"><Icon name="back.svg" /></button> : <span className="nav-placeholder" />}<h1 tabIndex={-1}>{title}</h1>{!isMain ? <button className="nav-icon" onClick={home} aria-label="LINK 메인"><Icon name="close.svg" size={20} /></button> : <span className="nav-placeholder" />}</nav><main className={`content ${contentClass}`} ref={scrollRef}>{content}</main>{footer && <footer className="footer">{footer}</footer>}<HomeIndicator /></div>
    {modal && <ConfirmSheet returnFocus={modalOrigin.current} title={modal === 'unlink' ? '직접 LINK를 해제할까요?' : modal === 'off' ? 'LINK ON을 끌까요?' : '이 혜택을 제외할까요?'} confirm={modal === 'unlink' ? 'LINK 해제' : modal === 'off' ? '자동 연결 끄기' : `${merchants[excludeId].name} 혜택 제외`} cancel={modal === 'unlink' ? '연결 유지하기' : modal === 'off' ? '자동 연결 유지하기' : '혜택 유지하기'} onClose={closeModal} onConfirm={() => {
      if (modal === 'unlink') { dispatch({ type: 'UNLINK_MANUAL' }); closeModal(); }
      else if (modal === 'off') { dispatch({ type: 'DISABLE' }); home(); }
      else { dispatch({ type: 'EXCLUDE', id: excludeId }); go(`/excluded/${excludeId}`, true); }
    }}>{modal === 'unlink' ? <>GS25 혜택의 연결이 해제돼요.<br />다른 혜택과 LINK ON 설정은 유지돼요.</> : modal === 'off' ? <>새 혜택의 자동 연결이 중단돼요.<br />이미 연결된 혜택은 만료일까지 유지됩니다.</> : <>{merchants[excludeId].name} 혜택의 연결이 취소돼요.<br />이번 행사 혜택은 다시 자동 연결하지 않아요.</>}</ConfirmSheet>}
  </div></div><div className="preview-tools"><span>LINK ON · 로컬 시연</span><button onClick={() => { dispatch({ type: 'RESET' }); setConsent(false); setDraft(initialState.interests); home(); requestAnimationFrame(() => { scrollRef.current?.scrollTo(0, 0); window.scrollTo(0, 0); document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); }); }}>처음부터 다시 보기</button></div></div>;
}

initializeNavigation();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
