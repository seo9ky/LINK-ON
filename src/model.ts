export type MerchantId = 'starbucks' | 'ssf' | 'gs25';
export const merchants = {
  starbucks: { name: '스타벅스', discount: '1,000원 할인', minimum: '5,000원', image: 'starbucks.png', subtitle: '평소 즐기는 커피, 혜택도 챙겨요.' },
  ssf: { name: 'SSF SHOP', discount: '2,000원 할인', minimum: '30,000원', image: 'ssf.png', subtitle: '평소 즐기는 쇼핑, 혜택도 챙겨요.' },
  gs25: { name: 'GS25', discount: '1,000원 할인', minimum: '5,000원', image: 'gs25.png', subtitle: '필요한 편의점 혜택을 직접 챙겨요.' },
} as const;
export const industries = ['카페', '편의점', '온라인 쇼핑', '외식', '마트', '문화·여가'];
export interface Campaign { id: string; merchant: MerchantId; industry: string; start: string; end: string; minimum: number; discount: number; autoEligible: boolean }
// Demo catalog and rules, not a live offer feed or a production recommendation algorithm.
export const campaigns: Campaign[] = ['11', '12'].flatMap(month => (['starbucks', 'ssf', 'gs25'] as MerchantId[]).map(merchant => ({
  id: `${merchant}-2026${month}`, merchant, industry: merchant === 'starbucks' ? '카페' : merchant === 'ssf' ? '온라인 쇼핑' : '편의점',
  start: `2026-${month}-01`, end: `2026-${month}-${month === '11' ? '30' : '31'}`,
  minimum: merchant === 'ssf' ? 30000 : 5000, discount: merchant === 'ssf' ? 2000 : 1000, autoEligible: merchant !== 'gs25',
})));
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
  version: 2, optedIn: false, enabled: false, interests: ['카페', '온라인 쇼핑'],
  date: '2026-11-03', limit: 2, patterns: ['카페'], connections: [], excluded: [], payments: [], availability: {}, notice: '',
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
  return selected && pattern ? `선택한 ${c.industry} 업종과 시연 이용 패턴을 함께 참고했어요.` : selected ? `관심 업종으로 선택한 ${c.industry} 혜택이에요.` : pattern ? `시연 고객의 ${c.industry} 이용 패턴을 참고했어요.` : '';
}
export function emptyReason(s: LinkState) {
  const eligible = availableCampaigns(s).filter(c => c.autoEligible && selectionReason(s, c));
  if (!s.enabled) return '자동 연결이 꺼져 있어요. 기존 혜택은 만료일까지 유지돼요.';
  if (!availableCampaigns(s).length) return '현재 진행 중인 행사가 없어요. 새 행사를 기다려 주세요.';
  if (eligible.length && eligible.every(c => s.excluded.includes(c.id))) return '맞춤 행사 혜택을 모두 제외했어요. 새 행사는 별도로 선정해요.';
  if (eligible.some(c => s.availability[c.id] === 'error')) return '일부 혜택을 연결하지 못했어요. 잠시 후 다시 확인해 주세요.';
  if (eligible.length && eligible.every(c => s.availability[c.id] === 'soldout')) return '맞춤 행사 혜택의 예산이 소진됐어요. 다른 혜택을 직접 골라 보세요.';
  if (!s.limit) return '현재 고객별 자동 연결 한도가 없어요. 혜택은 직접 고를 수 있어요.';
  return '현재 관심 업종과 시연 이용 패턴에 맞는 혜택이 없어요. 관심 업종을 확인해 보세요.';
}
function selectBenefits(s: LinkState): LinkState {
  if (!s.optedIn || !s.enabled) return s;
  const capacity = Math.max(0, s.limit - activeLinks(s).filter(l => l.mode === 'auto').length);
  const candidates = availableCampaigns(s).filter(c => c.autoEligible && !connection(s, c.id) && !s.excluded.includes(c.id) && !used(s, c.id) && (!s.availability[c.id] || s.availability[c.id] === 'available') && selectionReason(s, c));
  const score = (c: Campaign) => Number(s.interests.includes(c.industry)) * 2 + Number(s.patterns.includes(c.industry));
  candidates.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  const links = candidates.slice(0, capacity).map(c => ({ campaignId: c.id, mode: 'auto' as const, linkedOn: s.date, reason: selectionReason(s, c) }));
  return { ...s, connections: [...s.connections, ...links] };
}
export type Action =
  | { type: 'SAVE_INTERESTS'; values: string[]; activate: boolean }
  | { type: 'LINK_MANUAL' | 'UNLINK_MANUAL' | 'EXCLUDE'; id: string }
  | { type: 'DISABLE' | 'ENABLE' | 'SELECT' | 'RESET' }
  | { type: 'CONFIGURE'; limit: number; patterns: string[] }
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
    case 'CONFIGURE': return Number.isInteger(action.limit) && action.limit >= 0 && action.limit <= 20 ? { ...s, limit: action.limit, patterns: action.patterns.filter(v => industries.includes(v)), notice: '시연 조건을 저장했어요. 기존 연결은 유지하고 다음 선정부터 적용해요.' } : state;
    case 'AVAILABILITY': return campaign(action.id) ? { ...s, availability: { ...s.availability, [action.id]: action.value } } : state;
    case 'ADVANCE_DATE': {
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
    const s = { ...fresh(), optedIn: d.optedIn === true, enabled: d.optedIn === true && d.enabled === true, interests: Array.isArray(d.interests) ? d.interests.filter((v: string) => industries.includes(v)) : initialState.interests };
    s.excluded = Array.isArray(d.excluded) ? d.excluded.map((v: string) => `${v}-202611`).filter((id: string) => campaign(id)) : [];
    const ids = Array.isArray(d.linkedAuto) ? d.linkedAuto.filter((id: string) => ['starbucks', 'ssf'].includes(id) && !s.excluded.includes(`${id}-202611`)) : [];
    s.connections = [...ids.map((id: string) => ({ campaignId: `${id}-202611`, mode: 'auto' as const, linkedOn: s.date, reason: '이전 시연에서 연결한 혜택이에요.' })), ...(d.manualLinked ? [{ campaignId: 'gs25-202611', mode: 'manual' as const, linkedOn: s.date, reason: '고객이 직접 선택한 혜택이에요.' }] : [])];
    return { ...s, notice: '기존 연결·제외 설정을 가져왔어요. 이용 결과는 새 시연 결제로 확인해 주세요.' };
  }
  if (d.version !== 2 || !Array.isArray(d.connections) || !Array.isArray(d.payments) || !Array.isArray(d.interests) || !Array.isArray(d.patterns) || !Array.isArray(d.excluded) || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isFinite(Date.parse(d.date)) || !Number.isInteger(d.limit) || d.limit < 0 || d.limit > 20) return fresh();
  if (d.connections.some((l: Connection) => !l || !campaign(l.campaignId) || !['auto', 'manual'].includes(l.mode)) || d.payments.some((p: Payment) => !p || !campaign(p.campaignId) || !Number.isFinite(p.amount) || !Number.isFinite(p.discount) || !Number.isFinite(p.eligibleDiscount) || !['done', 'failed', 'pending'].includes(p.status))) return fresh();
  const availability = Object.fromEntries(Object.entries(d.availability && typeof d.availability === 'object' ? d.availability : {}).filter(([id, value]) => campaign(id) && ['available', 'soldout', 'error'].includes(value as string)));
  return { ...fresh(), ...d, availability, optedIn: d.optedIn === true, enabled: d.optedIn === true && d.enabled === true, interests: d.interests.filter((v: string) => industries.includes(v)), patterns: d.patterns.filter((v: string) => industries.includes(v)), excluded: d.excluded.filter((id: string) => campaign(id)), notice: '' } as LinkState;
}
export function readState(): LinkState {
  try { return restoreState(JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('link-on-demo-v1') || 'null')); }
  catch { return structuredClone(initialState); }
}
