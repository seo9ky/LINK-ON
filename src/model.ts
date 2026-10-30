export type MerchantId = 'starbucks' | 'gongcha' | 'baskinrobbins' | 'bbq' | 'dominos' | 'baemin' | 'coupang' | 'ssg' | 'elevenst' | 'ssf' | 'kream' | 'zigzag' | 'oliveyoung' | 'iherb' | 'doctornow' | 'gs25' | 'cu' | 'emart';
export const industries = ["외식 · 간식", "간편식 · 배달", "온라인쇼핑몰", "패션 · 스타일", "건강 · 화장품", "마트 · 슈퍼 · 편의점"];
export const merchants = {
  starbucks: {"name": "스타벅스", "industry": "외식 · 간식", "discount": "1,000원 할인", "minimum": "5,000원", "minimumAmount": 5000, "discountAmount": 1000, "image": "starbucks.png"},
  gongcha: {"name": "공차", "industry": "외식 · 간식", "discount": "1,000원 할인", "minimum": "5,000원", "minimumAmount": 5000, "discountAmount": 1000, "image": "gongcha.png"},
  baskinrobbins: {"name": "배스킨라빈스", "industry": "외식 · 간식", "discount": "1,000원 할인", "minimum": "10,000원", "minimumAmount": 10000, "discountAmount": 1000, "image": "baskinrobbins.png"},
  bbq: {"name": "BBQ", "industry": "간편식 · 배달", "discount": "2,000원 할인", "minimum": "20,000원", "minimumAmount": 20000, "discountAmount": 2000, "image": "bbq.png"},
  dominos: {"name": "도미노피자", "industry": "간편식 · 배달", "discount": "2,000원 할인", "minimum": "20,000원", "minimumAmount": 20000, "discountAmount": 2000, "image": "dominos.png"},
  baemin: {"name": "배달의민족", "industry": "간편식 · 배달", "discount": "1,000원 할인", "minimum": "15,000원", "minimumAmount": 15000, "discountAmount": 1000, "image": "baemin.png"},
  coupang: {"name": "쿠팡", "industry": "온라인쇼핑몰", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "coupang.png"},
  ssg: {"name": "SSG.COM", "industry": "온라인쇼핑몰", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "ssg.png"},
  elevenst: {"name": "11번가", "industry": "온라인쇼핑몰", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "elevenst.png"},
  ssf: {"name": "SSF SHOP", "industry": "패션 · 스타일", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "ssf.png"},
  kream: {"name": "KREAM", "industry": "패션 · 스타일", "discount": "2,000원 할인", "minimum": "50,000원", "minimumAmount": 50000, "discountAmount": 2000, "image": "kream.png"},
  zigzag: {"name": "지그재그", "industry": "패션 · 스타일", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "zigzag.png"},
  oliveyoung: {"name": "올리브영", "industry": "건강 · 화장품", "discount": "1,000원 할인", "minimum": "20,000원", "minimumAmount": 20000, "discountAmount": 1000, "image": "oliveyoung.png"},
  iherb: {"name": "아이허브", "industry": "건강 · 화장품", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "iherb.png"},
  doctornow: {"name": "닥터나우", "industry": "건강 · 화장품", "discount": "1,000원 할인", "minimum": "10,000원", "minimumAmount": 10000, "discountAmount": 1000, "image": "doctornow.png"},
  gs25: {"name": "GS25", "industry": "마트 · 슈퍼 · 편의점", "discount": "1,000원 할인", "minimum": "5,000원", "minimumAmount": 5000, "discountAmount": 1000, "image": "gs25.png"},
  cu: {"name": "CU", "industry": "마트 · 슈퍼 · 편의점", "discount": "1,000원 할인", "minimum": "5,000원", "minimumAmount": 5000, "discountAmount": 1000, "image": "cu.png"},
  emart: {"name": "이마트", "industry": "마트 · 슈퍼 · 편의점", "discount": "2,000원 할인", "minimum": "30,000원", "minimumAmount": 30000, "discountAmount": 2000, "image": "emart.png"},
} as const;
export const merchantIds = Object.keys(merchants) as MerchantId[];
export interface Campaign { id: string; merchant: MerchantId; industry: string; start: string; end: string; minimum: number; discount: number; autoEligible: boolean }
// Demo catalog and rules, not a live offer feed or a production recommendation algorithm.
export const campaigns: Campaign[] = ['11', '12'].flatMap(month => merchantIds.map(merchant => ({
  id: `${merchant}-2026${month}`, merchant, industry: merchants[merchant].industry,
  start: `2026-${month}-01`, end: `2026-${month}-${month === '11' ? '30' : '31'}`,
  minimum: merchants[merchant].minimumAmount, discount: merchants[merchant].discountAmount, autoEligible: true,
})));
// Preserve saved choices from the original three-merchant catalog without rewriting payment history.
const legacyIndustries: Record<string, string> = { '카페': industries[0], '외식': industries[0], '편의점': industries[5], '마트': industries[5], '온라인 쇼핑': industries[3] };
const restoreIndustries = (values: unknown[]) => [...new Set(values.filter((v): v is string => typeof v === 'string').map(v => legacyIndustries[v] || v).filter(v => industries.includes(v)))];
export type LinkMode = 'auto' | 'manual';
export interface Connection { campaignId: string; mode: LinkMode; linkedOn: string; reason: string; closedOn?: string; closedReason?: 'excluded' | 'unlinked' | 'expired' }
export interface Payment { id: number; campaignId: string; date: string; amount: number; mode: LinkMode | null; status: 'pending' | 'done' | 'failed'; eligibleDiscount: number; discount: number; reason: string }
export type Availability = 'available' | 'soldout' | 'error';
export interface LinkState {
  version: 2; optedIn: boolean; enabled: boolean; interests: string[];
  date: string; limit: number; patterns: string[]; connections: Connection[]; excluded: string[];
  payments: Payment[]; availability: Record<string, Availability>; notice: string;
}
export const initialState: LinkState = {
  version: 2, optedIn: false, enabled: false, interests: [industries[0], industries[3]],
  date: '2026-11-03', limit: 2, patterns: [industries[0]], connections: [], excluded: [], payments: [], availability: {}, notice: '',
};
export const money = (n: number) => `${n.toLocaleString('ko-KR')}원`;
export const campaign = (id: string) => campaigns.find(c => c.id === id);
export const inPeriod = (c: Campaign, date: string) => c.start <= date && date <= c.end;
export const activeLinks = (s: LinkState) => s.connections.filter(l => !l.closedOn && !!campaign(l.campaignId) && inPeriod(campaign(l.campaignId)!, s.date));
export const connection = (s: LinkState, id: string) => activeLinks(s).find(l => l.campaignId === id);
export const totalDiscount = (s: LinkState) => s.payments.reduce((sum, p) => sum + (p.status === 'done' ? p.discount : 0), 0);
export const availableCampaigns = (s: LinkState) => campaigns.filter(c => inPeriod(c, s.date));
export function resolveCampaign(s: LinkState, value: string) { return campaign(value) || availableCampaigns(s).find(c => c.merchant === value); }
export const usageLabel = (s: LinkState, id: string) => s.payments.some(p => p.campaignId === id && p.status === 'done') ? '이용 완료' : s.payments.some(p => p.campaignId === id && p.status === 'pending' && p.eligibleDiscount > 0) ? '확인 중' : '';
const used = (s: LinkState, id: string) => !!usageLabel(s, id);
export function selectionReason(s: LinkState, c: Campaign) {
  const selected = s.interests.includes(c.industry), pattern = s.patterns.includes(c.industry);
  return selected && pattern ? `관심 업종과 이용 패턴에 맞는 ${c.industry} 혜택이에요.` : selected ? `관심 업종으로 선택한 ${c.industry} 혜택이에요.` : pattern ? `${c.industry} 이용 패턴을 참고했어요.` : '';
}
export function emptyReason(s: LinkState) {
  const eligible = availableCampaigns(s).filter(c => c.autoEligible && selectionReason(s, c));
  if (!s.enabled) return '자동 연결이 꺼져 있어요. 기존 혜택은 만료일까지 유지돼요.';
  if (!availableCampaigns(s).length) return '현재 진행 중인 행사가 없어요. 새 행사를 기다려 주세요.';
  if (!s.limit) return '현재 고객별 자동 연결 한도가 없어요. 혜택은 직접 고를 수 있어요.';
  if (!eligible.length) return '현재 관심 업종과 이용 패턴에 맞는 혜택이 없어요. 관심 업종을 확인해 보세요.';
  if (eligible.every(c => connection(s, c.id)?.mode === 'manual')) return '맞춤 혜택은 이미 직접 연결되어 있어요. 같은 혜택을 중복 연결하지 않아요.';
  if (eligible.every(c => used(s, c.id))) return '맞춤 행사 혜택을 이미 이용했거나 결제를 확인 중이에요. 이용 결과를 확인해 주세요.';
  if (eligible.length && eligible.every(c => s.excluded.includes(c.id))) return '맞춤 행사 혜택을 모두 제외했어요. 새 행사는 별도로 선정해요.';
  if (eligible.some(c => s.availability[c.id] === 'error')) return '일부 혜택을 연결하지 못했어요. 잠시 후 다시 확인해 주세요.';
  if (eligible.length && eligible.every(c => s.availability[c.id] === 'soldout')) return '맞춤 행사 혜택의 예산이 소진됐어요. 다른 혜택을 직접 골라 보세요.';
  if (eligible.some(c => !connection(s, c.id) && !used(s, c.id) && !s.excluded.includes(c.id) && (!s.availability[c.id] || s.availability[c.id] === 'available'))) return '현재 조건을 다음 혜택 선정에 반영해요. 연결된 혜택은 여기에서 확인할 수 있어요.';
  return '현재 추가로 자동 연결할 수 있는 혜택이 없어요. 직접 연결·이용·제외 상태와 행사 조건을 확인해 주세요.';
}
function selectBenefits(s: LinkState): LinkState {
  if (!s.optedIn || !s.enabled) return s;
  const capacity = Math.max(0, s.limit - activeLinks(s).filter(l => l.mode === 'auto').length);
  const candidates = availableCampaigns(s).filter(c => c.autoEligible && !connection(s, c.id) && !s.excluded.includes(c.id) && !used(s, c.id) && (!s.availability[c.id] || s.availability[c.id] === 'available') && selectionReason(s, c));
  const score = (c: Campaign) => Number(s.interests.includes(c.industry)) * 2 + Number(s.patterns.includes(c.industry));
  // Prefer relevant industries not yet represented, then relevance and stable catalog order.
  // This is a transparent demo heuristic, not a production recommendation model.
  const selected: Campaign[] = [];
  const covered = new Set(activeLinks(s).filter(l => l.mode === 'auto').map(l => campaign(l.campaignId)!.industry));
  while (selected.length < capacity && candidates.length) {
    candidates.sort((a, b) => Number(covered.has(a.industry)) - Number(covered.has(b.industry)) || score(b) - score(a) || merchantIds.indexOf(a.merchant) - merchantIds.indexOf(b.merchant));
    const next = candidates.shift()!; selected.push(next); covered.add(next.industry);
  }
  const links = selected.map(c => ({ campaignId: c.id, mode: 'auto' as const, linkedOn: s.date, reason: selectionReason(s, c) }));
  return { ...s, connections: [...s.connections, ...links] };
}
export function selectionOutcome(before: LinkState, after: LinkState) {
  const previous = new Set(activeLinks(before).map(l => l.campaignId));
  const auto = activeLinks(after).filter(l => l.mode === 'auto');
  const added = auto.filter(l => !previous.has(l.campaignId)).map(l => merchants[campaign(l.campaignId)!.merchant].name);
  let message: string;
  if (!after.optedIn) message = '조건을 저장했어요. 앱에서 동의하고 LINK ON을 시작하면 자동 연결해요.';
  else if (!after.enabled) message = '조건을 저장했어요. LINK ON이 꺼져 있어 추가 연결하지 않았어요.';
  else if (added.length) message = `${added.length}개 혜택을 추가 연결했어요.`;
  else if (auto.length > after.limit) message = '기존 혜택은 유지돼요. 새 한도보다 많아 추가 연결하지 않았어요.';
  else if (after.limit === 0) message = '자동 연결 한도가 0개라 추가 연결하지 않았어요. 직접 LINK는 가능해요.';
  else if (auto.length >= after.limit) message = '자동 연결 한도에 도달해 추가 연결하지 않았어요.';
  else message = emptyReason(after);
  return { added, message };
}
export type Action =
  | { type: 'SAVE_INTERESTS'; values: string[]; activate: boolean }
  | { type: 'LINK_MANUAL' | 'UNLINK_MANUAL' | 'EXCLUDE'; id: string }
  | { type: 'DISABLE' | 'ENABLE' | 'SELECT' | 'RESET' }
  | { type: 'CONFIGURE' | 'APPLY_CONDITIONS'; limit: number; patterns: string[] }
  | { type: 'ADVANCE_DATE'; date: string }
  | { type: 'AVAILABILITY'; id: string; value: Availability }
  | { type: 'PAY'; id: string; amount: number; otherDiscount: boolean }
  | { type: 'SETTLE'; paymentId: number };
export function reducer(state: LinkState, action: Action): LinkState {
  let s = { ...state, notice: '' };
  switch (action.type) {
    case 'SAVE_INTERESTS': {
      s.interests = [...new Set(action.values.filter(v => industries.includes(v)))];
      if (action.activate && !s.optedIn) return selectBenefits({ ...s, optedIn: true, enabled: true });
      return { ...s, notice: '관심 업종을 저장했어요. 다음 혜택 선정부터 반영해요.' };
    }
    case 'SELECT': return selectBenefits(s);
    case 'APPLY_CONDITIONS': {
      if (!Number.isInteger(action.limit) || action.limit < 0 || action.limit > 20) return state;
      return selectBenefits({ ...s, limit: action.limit, patterns: action.patterns.filter(v => industries.includes(v)) });
    }
    case 'CONFIGURE': return Number.isInteger(action.limit) && action.limit >= 0 && action.limit <= 20 ? { ...s, limit: action.limit, patterns: action.patterns.filter(v => industries.includes(v)), notice: '시연 조건을 저장했어요. 기존 연결은 유지하고 다음 선정부터 적용해요.' } : state;
    case 'AVAILABILITY': return campaign(action.id) ? { ...s, availability: { ...s.availability, [action.id]: action.value } } : state;
    case 'ADVANCE_DATE': {
      if (action.date === s.date) return state;
      if (action.date < initialState.date || action.date > '2026-12-31') return { ...s, notice: '시연 날짜는 2026년 11월 3일부터 12월 31일까지 선택해 주세요.' };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(action.date) || !Number.isFinite(Date.parse(action.date)) || new Date(action.date).toISOString().slice(0, 10) !== action.date || action.date < s.date) return { ...s, notice: '시연 날짜는 현재 날짜 이후로만 바꿀 수 있어요.' };
      s.date = action.date;
      s.connections = s.connections.map(l => !l.closedOn && campaign(l.campaignId)!.end < s.date ? { ...l, closedOn: s.date, closedReason: 'expired' } : l);
      return selectBenefits(s);
    }
    case 'LINK_MANUAL': {
      const c = campaign(action.id);
      if (!c || !inPeriod(c, s.date)) return { ...s, notice: '현재 연결할 수 있는 행사 기간이 아니에요.' };
      if (connection(s, c.id)) return s;
      if (s.availability[c.id] === 'soldout') return { ...s, notice: '행사 예산이 소진되어 연결할 수 없어요.' };
      if (s.availability[c.id] === 'error') return { ...s, notice: '연결하지 못했어요. 잠시 후 다시 시도해 주세요.' };
      if (used(s, c.id)) return { ...s, notice: '이미 이용했거나 결제 확인 중인 행사 혜택이에요.' };
      return { ...s, connections: [...s.connections, { campaignId: c.id, mode: 'manual', linkedOn: s.date, reason: '고객이 직접 선택한 혜택이에요.' }] };
    }
    case 'UNLINK_MANUAL': case 'EXCLUDE': {
      const link = connection(s, action.id);
      if (!link || link.mode !== (action.type === 'EXCLUDE' ? 'auto' : 'manual')) return s;
      return { ...s, excluded: action.type === 'EXCLUDE' ? [...new Set([...s.excluded, action.id])] : s.excluded,
        connections: s.connections.map(l => l === link ? { ...l, closedOn: s.date, closedReason: action.type === 'EXCLUDE' ? 'excluded' : 'unlinked' } : l) };
    }
    case 'DISABLE': return { ...s, enabled: false };
    case 'ENABLE': return s.optedIn ? selectBenefits({ ...s, enabled: true }) : s;
    case 'PAY': {
      const c = campaign(action.id), link = connection(s, action.id);
      if (!c || !Number.isSafeInteger(action.amount) || action.amount <= 0 || action.amount > 100000000) return { ...s, notice: '결제금액은 1원부터 1억원까지 정수로 입력해 주세요.' };
      const reason = !inPeriod(c, s.date) ? '행사 이용 기간이 아니에요.' : !link ? '결제 전에 연결된 혜택이 아니에요.' : action.amount < c.minimum ? '최소 결제금액을 충족하지 않았어요.' : used(s, c.id) ? '기간 내 1회 이용했거나 먼저 접수한 결제를 확인 중이에요.' : action.otherDiscount ? '다른 할인이 적용된 결제예요. 이 시연 행사는 중복 적용하지 않아요.' : '';
      const p: Payment = { id: Math.max(0, ...s.payments.map(p => p.id)) + 1, campaignId: c.id, date: s.date, amount: action.amount, mode: link?.mode || null, status: 'pending', eligibleDiscount: reason ? 0 : c.discount, discount: 0, reason };
      return { ...s, payments: [...s.payments, p] };
    }
    case 'SETTLE': return { ...s, payments: s.payments.map(p => p.id === action.paymentId && p.status === 'pending' ? { ...p, status: p.eligibleDiscount ? 'done' : 'failed', discount: p.eligibleDiscount } : p) };
    case 'RESET': return structuredClone(initialState);
  }
}
export const storageKey = 'link-on-demo-v2';
export function restoreState(data: unknown): LinkState {
  const fresh = () => structuredClone(initialState);
  if (!data || typeof data !== 'object') return fresh();
  const d = data as Record<string, any>;
  if (d.version === 1) {
    const s = { ...fresh(), optedIn: d.optedIn === true, enabled: d.optedIn === true && d.enabled === true, interests: Array.isArray(d.interests) ? restoreIndustries(d.interests) : initialState.interests };
    s.excluded = Array.isArray(d.excluded) ? d.excluded.map((v: string) => `${v}-202611`).filter((id: string) => campaign(id)) : [];
    const ids = Array.isArray(d.linkedAuto) ? d.linkedAuto.filter((id: string) => ['starbucks', 'ssf'].includes(id) && !s.excluded.includes(`${id}-202611`)) : [];
    s.connections = [...ids.map((id: string) => ({ campaignId: `${id}-202611`, mode: 'auto' as const, linkedOn: s.date, reason: '이전 시연에서 연결한 혜택이에요.' })), ...(d.manualLinked ? [{ campaignId: 'gs25-202611', mode: 'manual' as const, linkedOn: s.date, reason: '고객이 직접 선택한 혜택이에요.' }] : [])];
    return { ...s, notice: '기존 연결·제외 설정을 가져왔어요. 이용 결과는 새 시연 결제로 확인해 주세요.' };
  }
  if (d.version !== 2 || !Array.isArray(d.connections) || !Array.isArray(d.payments) || !Array.isArray(d.interests) || !Array.isArray(d.patterns) || !Array.isArray(d.excluded) || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isFinite(Date.parse(d.date)) || !Number.isInteger(d.limit) || d.limit < 0 || d.limit > 20) return fresh();
  if (d.connections.some((l: Connection) => !l || !campaign(l.campaignId) || !['auto', 'manual'].includes(l.mode)) || d.payments.some((p: Payment) => !p || !campaign(p.campaignId) || !Number.isFinite(p.amount) || !Number.isFinite(p.discount) || !Number.isFinite(p.eligibleDiscount) || !['done', 'failed', 'pending'].includes(p.status))) return fresh();
  const availability = Object.fromEntries(Object.entries(d.availability && typeof d.availability === 'object' ? d.availability : {}).filter(([id, value]) => campaign(id) && ['available', 'soldout', 'error'].includes(value as string)));
  return { ...fresh(), ...d, availability, optedIn: d.optedIn === true, enabled: d.optedIn === true && d.enabled === true, interests: restoreIndustries(d.interests), patterns: restoreIndustries(d.patterns), excluded: d.excluded.filter((id: string) => campaign(id)), notice: '' } as LinkState;
}
export function readState(): LinkState {
  try { return restoreState(JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('link-on-demo-v1') || 'null')); }
  catch { return structuredClone(initialState); }
}
