import React, { useEffect, useLayoutEffect, useRef, useState, useReducer, type ReactNode, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { initialState, industries, merchants, campaigns, campaign, availableCampaigns, connection, activeLinks, resolveCampaign, inPeriod, usageLabel, emptyReason, money, totalDiscount, readState, reducer, storageKey, type Campaign, type MerchantId } from './model';
import { DemoTools } from './DemoTools';
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
function Benefit({ offer, mode, onClick, onAction = onClick, retained = false, unavailable = '' }: { unavailable?: string; offer: Campaign; mode: 'link' | 'complete' | 'detail' | 'exclude'; onClick: () => void; onAction?: () => void; retained?: boolean }) {
  const id = offer.merchant;
  const item = merchants[id];
  const actionLabel = mode === 'link' ? '혜택 링크' : mode === 'exclude' ? '혜택 제외' : mode === 'complete' ? '연결 완료 · 상세 보기' : '상세 보기';
  return <div className="benefit">
    <button className="benefit-body" onClick={onClick} aria-label={`${item.name} 혜택 상세`}>
    <Merchant id={id} /><span className="benefit-info"><span className="merchant-name">{item.name}</span><strong>{item.discount}</strong><span className="condition">{retained ? '기존 연결 유지' : `${item.minimum} 이상 결제`} · {offer.end.slice(5).replace('-', '.')}까지</span></span>
    </button>
    <button className={`benefit-action ${unavailable ? 'complete' : mode}`} disabled={!!unavailable} onClick={onAction} aria-label={`${item.name} ${unavailable || actionLabel}`}>
      {unavailable || null}{!unavailable && mode === 'link' && <><Icon name="plus.svg" size={16} /><span>링크</span></>}
      {!unavailable && mode === 'complete' && <><Icon name="check-complete.svg" size={16} /><span>완료</span></>}
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
  const modalOffer = campaign(params.get('id') || '');
  const modalLink = modalOffer && connection(state, modalOffer.id);
  const requestedModal = params.get('confirm');
  const modal = requestedModal === 'off' && state.enabled ? 'off'
    : requestedModal === 'unlink' && modalLink?.mode === 'manual' ? 'unlink'
    : requestedModal === 'exclude' && modalLink?.mode === 'auto' ? 'exclude' : null;
  const auto = activeLinks(state).filter(l => l.mode === 'auto');
  const manualOffers = availableCampaigns(state).filter(c => connection(state, c.id)?.mode !== 'auto');
  const count = activeLinks(state).length;
  const isMain = path === '/';
  const detailOffer = path.startsWith('/benefit/') ? resolveCampaign(state, path.split('/')[2]) : undefined;
  const completed = path.startsWith('/linked/') ? campaign(path.split('/')[2]) : undefined;
  const back = () => path.startsWith('/linked/') ? home() : historyBack();
  const openModal = (kind: string, id?: string) => {
    modalOrigin.current = document.activeElement as HTMLElement | null;
    window.scrollTo(0, 0); go(`${path}?confirm=${kind}${id ? '&id=' + id : ''}`);
  };
  const openDetail = (id: string) => go(`/benefit/${id}`, path.startsWith('/linked/'));
  const linkManual = (id: string) => {
    const action = { type: 'LINK_MANUAL' as const, id };
    const next = reducer(state, action);
    dispatch(action);
    if (connection(next, id)) go(`/linked/${id}`, path.startsWith('/benefit/'));
  };
  const openInterests = () => { setDraft([...state.interests]); go('/interests'); };
  const results = () => go('/results');
  const toggle = () => state.enabled ? openModal('off') : state.optedIn ? dispatch({ type: 'ENABLE' }) : go('/consent');
  useEffect(() => {
    if (requestedModal && !modal) go(path, true);
    if (completed && connection(state, completed.id)?.mode !== 'manual') go(`/benefit/${completed.id}`, true);
  }, [hash, state.connections, modal]);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* In-memory demo still works. */ } }, [state]);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); window.scrollTo(0, 0); document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); }, [path]);
  useEffect(() => { const resize = () => setScale(window.innerWidth > 560 ? Math.min(1, Math.max(0.55, (window.innerHeight - 84) / 956)) : 1); resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);

  let title = 'LINK'; let content: ReactNode; let footer: ReactNode = null; let contentClass = 'standard';
  const linkHeader = <div className="link-header"><img src={asset('link.svg')} width={110} height={35.02} alt="LINK" /><button className="help-button" onClick={() => go('/help')}>이용방법</button></div>;
  const resultFooter = <Button secondary onClick={results}>받은 혜택 · 이용 결과 보기</Button>;
  const summary = <div className="summary"><div><span>링크한 혜택</span><strong aria-label="링크한 혜택 개수">{count}개</strong></div><div><span>받은 혜택금액</span><strong>{money(totalDiscount(state))}</strong></div></div>;
  const manualRow = (c: Campaign) => <Benefit key={c.id} offer={c} unavailable={!connection(state, c.id) ? usageLabel(state, c.id) || (state.availability[c.id] === 'soldout' ? '예산 소진' : '') : ''} mode={connection(state, c.id) ? 'complete' : 'link'} onClick={() => openDetail(c.id)} onAction={connection(state, c.id) ? () => openDetail(c.id) : () => linkManual(c.id)} />;
  const manualList = manualOffers.length ? manualOffers.map(manualRow) : <Note>지금은 직접 연결할 행사 혜택이 없어요.</Note>;
  const autoBenefits = (mode: 'detail' | 'complete' | 'exclude' = 'detail') => auto.map(l => <Benefit key={l.campaignId} offer={campaign(l.campaignId)!} mode={mode} retained={!state.enabled} onClick={() => openDetail(l.campaignId)} onAction={mode === 'exclude' ? () => openModal('exclude', l.campaignId) : () => openDetail(l.campaignId)} />);

  if (isMain && !state.optedIn) {
    contentClass = 'start';
    content = <>{linkHeader}{summary}<div className="card intro"><LinkLogo size={190} /><h2>나에게 맞는 혜택,<br />알아서 LINK!</h2><p className="muted intro-description">혜택을 찾고 연결하는 번거로움은 줄이고,<br />필요한 혜택은 직접 고를 수 있어요.</p><Button onClick={() => { setConsent(false); go('/consent'); }}>LINK ON 시작하기</Button></div><h3>일상을 채우는 혜택</h3>{manualList}<Note>시연용 혜택 예시 · 실제 제공 조건과 다를 수 있어요.</Note></>;
    footer = resultFooter;
  } else if (isMain && !state.enabled) {
    content = <><LinkLogo size={180} /><h2>자동 연결을 껐어요</h2><p className="muted">새 혜택은 자동 연결되지 않아요.<br />이미 연결된 혜택은 만료일까지 이용할 수 있어요.</p><h3>연결된 혜택</h3>{autoBenefits('complete')}{manualOffers.filter(c => connection(state, c.id)).map(manualRow)}{count === 0 && <Note>현재 연결된 혜택이 없어요. 다른 혜택은 직접 고를 수 있어요.</Note>}</>;
    footer = <><div className="quick-actions"><Button secondary onClick={() => go('/manual')}>직접 고르는 혜택</Button><Button secondary onClick={results}>이용 결과</Button></div><Button onClick={() => dispatch({ type: 'ENABLE' })}>LINK ON 다시 켜기</Button></>;
  } else if (isMain && !auto.length) {
    content = <><LinkLogo size={180} /><div className="status-circle"><Icon name="gift-large.svg" size={52} /></div><h2>지금은 자동으로 연결할<br />혜택이 없어요</h2><p className="muted">{emptyReason(state)}</p><Note>LINK ON은 켜져 있어요.<br />적합한 혜택만 고객별 한도 내에서 연결해요.</Note><h3>직접 고르는 혜택</h3>{manualList}</>;
    footer = <><div className="quick-actions"><Button secondary onClick={() => go('/manage')}>자동 LINK 관리</Button><Button secondary onClick={results}>이용 결과</Button></div><Button secondary onClick={openInterests}>관심 업종 확인하기</Button></>;
  } else if (isMain) {
    contentClass = 'main-on';
    content = <>{linkHeader}{summary}<div className="active-banner"><div><LinkLogo size={128} /><p className="small muted">고객님께 맞는 혜택 {auto.length}개를 연결했어요.</p></div><Toggle checked={state.enabled} onClick={toggle} /></div><div className="section-heading"><h3>자동으로 연결된 혜택</h3><button className="text-action" onClick={() => go('/manage')}>관리 ›</button></div>{autoBenefits()}<h3>직접 고르는 혜택</h3>{manualList}</>;
    footer = resultFooter;
  } else if (path === '/consent' || path === '/help') {
    const help = path === '/help'; title = help ? 'LINK 이용방법' : 'LINK ON 시작';
    content = <><LinkLogo /><h2>{help ? '필요한 혜택을 편하게 챙겨요' : '자동 LINK를 시작할까요?'}</h2><p className="muted">{help ? <>맞춤 혜택은 자동으로,<br />나머지 혜택은 직접 선택할 수 있어요.</> : <>한 번 동의하면 맞춤 혜택을<br />고객별 한도 내에서 자동으로 연결해 드려요.</>}</p><ServiceInfo help={help} />{help ? <p className="small muted">연결 완료와 실제 할인 적용은 서로 다른 상태예요.</p> : <><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>[필수] 자동 LINK 이용에 동의합니다.</span></label><p className="small muted">혜택 적용 조건·연결 이유는 상세 화면에서 확인할 수 있습니다.</p></>}</>;
    footer = <Button disabled={!help && !consent} onClick={help ? back : () => { setDraft([...state.interests]); go('/interests'); }}>{help ? '확인' : '동의하고 시작하기'}</Button>;
  } else if (path === '/interests') {
    title = '관심 업종 설정';
    content = <><h2>자주 이용하는 업종을<br />알려주세요</h2><p className="muted">자주 이용하는 업종을 여러 개 선택할 수 있어요.</p><div className="industry-grid">{industries.map(name => <button key={name} aria-pressed={draft.includes(name)} className={`industry ${draft.includes(name) ? 'selected' : ''}`} onClick={() => setDraft(values => values.includes(name) ? values.filter(v => v !== name) : [...values, name])}>{name}</button>)}</div><Note>선택한 업종과 이용 패턴을 함께 참고해요.<br />변경한 업종은 다음 혜택 선정부터 반영돼요.<br />업종을 선택하지 않으면 이용 패턴만 참고해요.</Note></>;
    footer = <Button disabled={!state.optedIn && !consent} onClick={() => { dispatch({ type: 'SAVE_INTERESTS', values: draft, activate: !state.optedIn && consent }); home(); }}>저장하고 혜택 확인하기</Button>;
  } else if (path.startsWith('/benefit/') && detailOffer) {
    title = '혜택 상세'; contentClass = 'detail';
    const c = detailOffer, item = merchants[c.merchant], link = connection(state, c.id);
    const closed = [...state.connections].reverse().find(l => l.campaignId === c.id && l.closedOn);
    const usage = usageLabel(state, c.id);
    const label = !inPeriod(c, state.date) ? (c.end < state.date ? '기간 종료' : '시작 전') : link ? link.mode === 'auto' ? '자동 LINK' : '직접 LINK' : state.excluded.includes(c.id) ? '제외 완료' : closed?.closedReason === 'unlinked' ? '해제 완료' : '연결 전';
    content = <><Pill>{label}</Pill><div className="detail-merchant"><Merchant id={c.merchant} large /><div><p className="muted">{item.name}</p><h2>{money(c.discount)} 할인</h2></div></div><p className="muted">{item.subtitle}</p><div className="card reason"><strong><Icon name="gift.svg" />{link?.mode === 'auto' ? '이 혜택을 연결한 이유' : '혜택 이용방법'}</strong><p className="muted">{link?.mode === 'auto' ? link.reason : <>결제 전에 링크하고 삼성카드로 결제하세요.<br />조건을 충족하면 혜택이 적용돼요.</>}</p></div><Details rows={[
      ['결제 조건', `한 번에 ${money(c.minimum)} 이상`], ['이용 기간', `${c.start.replaceAll('-', '.')}–${c.end.replaceAll('-', '.')}`], ['이용 횟수', '행사 기간 내 1회'], ['혜택 중복', '시연 조건: 다른 할인 적용 결제는 제외'],
    ]} />{link && <button className="text-action left" onClick={() => openModal(link.mode === 'auto' ? 'exclude' : 'unlink', c.id)}>{link.mode === 'auto' ? '이 혜택 제외하기' : '이 혜택 LINK 해제'}</button>}{state.availability[c.id] === 'soldout' && !link && <Note>행사 예산이 소진되어 지금은 연결할 수 없어요.</Note>}<Note>시연용 행사 조건입니다. 실제 제공 조건과 다를 수 있어요.{state.excluded.includes(c.id) && !link && <><br />이번 행사의 자동 연결은 제외됐어요. 원하면 직접 연결할 수 있어요.</>}</Note></>;
    footer = link ? <Button onClick={link.mode === 'auto' ? () => go('/manage') : home}>{link.mode === 'auto' ? '연결된 혜택 확인하기' : 'LINK 메인으로'}</Button> : <Button disabled={!inPeriod(c, state.date) || !!usage || state.availability[c.id] === 'soldout'} onClick={() => linkManual(c.id)}>{!inPeriod(c, state.date) ? '이용 기간이 아니에요' : usage || (state.availability[c.id] === 'soldout' ? '예산 소진' : '이 혜택 링크하기')}</Button>;
  } else if (completed && connection(state, completed.id)?.mode === 'manual') {
    title = '직접 고른 혜택';
    content = <><div className="status-circle"><Icon name="check-success.svg" size={48} /></div><h2>혜택을 직접 연결했어요</h2><p className="muted">자동 LINK 외에도 원하는 혜택을<br />직접 골라 이용할 수 있어요.</p>{manualRow(completed)}<Note>결제 전에 연결한 혜택입니다.<br />이용 조건을 충족하면 혜택이 적용됩니다.</Note></>;
    footer = <Button onClick={home}>LINK 메인으로</Button>;
  } else if (path === '/manage') {
    title = '자동 LINK 관리';
    content = <><h2>자동 연결을 관리하세요</h2><div className="manage-toggle"><h3>LINK ON {state.enabled ? '사용 중' : '꺼짐'}</h3><Toggle checked={state.enabled} onClick={toggle} /></div><div className="interest-summary"><div><p className="small muted">관심 업종</p><strong>{state.interests.length ? state.interests.join(' · ') : '선택한 업종 없음'}</strong></div><button className="text-action small" onClick={openInterests}>관심 업종 변경 ›</button></div><h3>자동 연결 혜택 {auto.length}개</h3>{autoBenefits('exclude')}{!auto.length && <Note>{emptyReason(state)}</Note>}<Note>제외한 이번 행사 혜택은 다시 자동 연결하지 않아요. 같은 가맹점의 새 행사는 별도로 선정해요.</Note><button className="text-action left" onClick={toggle}>{state.enabled ? '자동 연결 끄기' : 'LINK ON 다시 켜기'}</button></>;
    footer = <Button onClick={home}>관리 완료</Button>;
  } else if (path.startsWith('/excluded/') && campaign(path.split('/')[2]) && state.excluded.includes(path.split('/')[2]) && !connection(state, path.split('/')[2])) {
    title = '자동 LINK 관리'; const c = campaign(path.split('/')[2])!;
    content = <><Pill>제외 완료</Pill><h2>{merchants[c.merchant].name} 혜택을 제외했어요</h2><p className="muted">이 혜택의 연결을 취소했어요.<br />이번 행사 혜택은 다시 자동 연결하지 않아요.</p><h3>남은 자동 연결 혜택 {auto.length}개</h3>{autoBenefits()}<Note>{auto.length ? '다른 자동 LINK 혜택은 계속 이용할 수 있어요.' : emptyReason(state)}</Note></>;
    footer = resultFooter;
  } else if (path === '/manual') {
    title = '직접 고르는 혜택'; contentClass = 'start';
    content = <>{linkHeader}<h3>일상을 채우는 혜택</h3>{manualList}<Note>시연용 혜택 예시 · 실제 제공 조건과 다를 수 있어요.</Note></>;
    footer = resultFooter;
  } else if (path.startsWith('/results')) {
    title = '이용 결과';
    const requested = path.split('/')[2]; const tab = ['done', 'pending', 'failed'].includes(requested) ? requested : 'done';
    const list = state.payments.filter(p => p.status === tab).slice().reverse();
    content = <><h2>내가 받은 LINK 혜택</h2><div className="result-tabs" role="tablist" aria-label="혜택 적용 상태">{[['done', '적용 완료'], ['pending', '확인 중'], ['failed', '미적용']].map(([value, text]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? 'selected' : ''} onClick={() => go(`/results/${value}`, true)}>{text}</button>)}</div>
      {!state.payments.length ? <><div className="status-circle"><Icon name="gift-large.svg" size={52} /></div><h2>아직 이용 내역이 없어요</h2><p className="muted">혜택을 연결한 뒤 조건에 맞게 결제하면<br />이곳에서 적용 결과를 확인할 수 있어요.</p><Note>폰 화면 아래의 시연 도구에서 결제와 전표 접수를 진행해 보세요.</Note></> : !list.length ? <Note>{tab === 'pending' ? '확인 중인 결제가 없어요.' : tab === 'failed' ? '미적용된 결제가 없어요.' : '아직 적용 완료된 혜택이 없어요.'} 다른 상태의 내역도 확인해 보세요.</Note> : list.map(p => {
        const c = campaign(p.campaignId)!; const pending = p.status === 'pending'; const failed = p.status === 'failed';
        return <section className="payment-entry" key={p.id}><div className="card result-card"><div className="result-icons"><Merchant id={c.merchant} /><Icon name={pending ? 'clock.svg' : failed ? 'info.svg' : 'check-result.svg'} size={40} /></div><h3>{pending ? '결제 내역을 확인 중이에요' : failed ? '이번 결제는 적용되지 않았어요' : `${money(p.discount)} 혜택 적용`}</h3><p className="muted">{pending ? '매출전표가 접수되면 적용 여부를 확인해요.' : failed ? p.reason : `${p.mode === 'auto' ? '자동' : '직접'} LINK로 챙긴 혜택이에요.`}</p></div><Details rows={[
          ['이용 가맹점', merchants[c.merchant].name], ['대상 행사', `${c.start.slice(0, 7).replace('-', '.')} 행사`], ['결제금액', money(p.amount)], ['할인금액', pending ? '확인 중 (미확정)' : money(p.discount)], ['이용일', p.date.replaceAll('-', '.')], ['연결 방식', p.mode ? p.mode === 'auto' ? '자동 LINK' : '직접 LINK' : '연결 없음'], ['혜택 상태', pending ? '확인 중' : failed ? '미적용' : '적용 완료'],
        ]} /><button className="text-action left" onClick={() => openDetail(c.id)}>행사 혜택 상세 ›</button></section>;
      })}<Note>시연 결제 내역입니다. 실제 결제는 발생하지 않아요.</Note></>;
    footer = <Button onClick={home}>LINK 메인으로</Button>;
  } else {
    content = <><h2>현재 상태에서 볼 수 없는 화면이에요</h2><p className="muted">행사와 연결 상태를 다시 확인해 주세요.</p></>;
    footer = <Button onClick={home}>LINK 메인으로</Button>;
  }
  const modalName = modalOffer ? merchants[modalOffer.merchant].name : '';
  return <div className="preview"><div className="preview-stage" style={{ zoom: scale } as CSSProperties}><div className="phone" data-screen={path}>
    <div className="screen-body" inert={!!modal}><StatusBarIPhone /><nav className="navigation" aria-label="화면 이동">{!isMain ? <button className="nav-icon" onClick={back} aria-label="뒤로"><Icon name="back.svg" /></button> : <span className="nav-placeholder" />}<h1 tabIndex={-1}>{title}</h1>{!isMain ? <button className="nav-icon" onClick={home} aria-label="LINK 메인"><Icon name="close.svg" size={20} /></button> : <span className="nav-placeholder" />}</nav><main className={`content ${contentClass}`} ref={scrollRef}>{state.notice && <div className="inline-notice" role="status">{state.notice}</div>}{content}</main>{footer && <footer className="footer">{footer}</footer>}<HomeIndicator /></div>
    {modal && <ConfirmSheet returnFocus={modalOrigin.current} title={modal === 'unlink' ? '직접 LINK를 해제할까요?' : modal === 'off' ? 'LINK ON을 끌까요?' : '이 혜택을 제외할까요?'} confirm={modal === 'unlink' ? 'LINK 해제' : modal === 'off' ? '자동 연결 끄기' : `${modalName} 혜택 제외`} cancel={modal === 'unlink' ? '연결 유지하기' : modal === 'off' ? '자동 연결 유지하기' : '혜택 유지하기'} onClose={historyBack} onConfirm={() => {
      if (modal === 'unlink' && modalOffer) { dispatch({ type: 'UNLINK_MANUAL', id: modalOffer.id }); historyBack(); }
      else if (modal === 'off') { dispatch({ type: 'DISABLE' }); home(); }
      else if (modalOffer) { dispatch({ type: 'EXCLUDE', id: modalOffer.id }); go(`/excluded/${modalOffer.id}`, true); }
    }}>{modal === 'unlink' ? <>{modalName} 혜택의 연결이 해제돼요.<br />다른 혜택과 LINK ON 설정은 유지돼요.</> : modal === 'off' ? <>새 혜택의 자동 연결이 중단돼요.<br />이미 연결된 혜택은 만료일까지 유지됩니다.</> : <>{modalName} 혜택의 연결이 취소돼요.<br />이번 행사 혜택은 다시 자동 연결하지 않아요.</>}</ConfirmSheet>}
  </div></div><div className="preview-tools"><span>LINK ON · 로컬 시연 · {state.date}</span><button onClick={() => { dispatch({ type: 'RESET' }); setConsent(false); setDraft(initialState.interests); home(); requestAnimationFrame(() => { scrollRef.current?.scrollTo(0, 0); window.scrollTo(0, 0); }); }}>처음부터 다시 보기</button></div><DemoTools state={state} dispatch={dispatch} navigate={route => go(route)} /></div>;
}

initializeNavigation();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
