export type MerchantId = 'starbucks' | 'ssf' | 'gs25';
export type AutoId = Exclude<MerchantId, 'gs25'>;
export const merchants = {
  starbucks: { name: '스타벅스', discount: '1,000원 할인', minimum: '5,000원', image: 'starbucks.png', subtitle: '평소 즐기는 커피, 혜택도 챙겨요.', reason: '최근 카페 이용 패턴을 참고해' },
  ssf: { name: 'SSF SHOP', discount: '2,000원 할인', minimum: '30,000원', image: 'ssf.png', subtitle: '평소 즐기는 쇼핑, 혜택도 챙겨요.', reason: '최근 온라인 쇼핑 이용 패턴을 참고해' },
  gs25: { name: 'GS25', discount: '1,000원 할인', minimum: '5,000원', image: 'gs25.png', subtitle: '필요한 편의점 혜택을 직접 챙겨요.', reason: '' },
} as const;
export const industries = ['카페', '편의점', '온라인 쇼핑', '외식', '마트', '문화·여가'];
export interface LinkState {
  version: 1; optedIn: boolean; enabled: boolean; manualLinked: boolean;
  manualUnlinked: boolean; linkedAuto: AutoId[]; excluded: AutoId[];
  interests: string[]; demoResults: boolean;
}
export const initialState: LinkState = {
  version: 1, optedIn: false, enabled: false, manualLinked: false, manualUnlinked: false,
  linkedAuto: [], excluded: [], interests: ['카페', '편의점'], demoResults: false,
};
export type Action =
  | { type: 'SAVE_INTERESTS'; values: string[]; activate: boolean }
  | { type: 'LINK_MANUAL' } | { type: 'UNLINK_MANUAL' }
  | { type: 'DISABLE' } | { type: 'ENABLE' }
  | { type: 'EXCLUDE'; id: AutoId } | { type: 'LOAD_DEMO_RESULTS' } | { type: 'RESET' };
export function reducer(state: LinkState, action: Action): LinkState {
  switch (action.type) {
    case 'SAVE_INTERESTS': return {
      ...state, interests: [...action.values],
      ...(action.activate ? { optedIn: true, enabled: true,
        linkedAuto: (['starbucks', 'ssf'] as AutoId[]).filter(id => !state.excluded.includes(id)) } : {}),
    };
    case 'LINK_MANUAL': return { ...state, manualLinked: true, manualUnlinked: false };
    case 'UNLINK_MANUAL': return { ...state, manualLinked: false, manualUnlinked: true };
    case 'DISABLE': return { ...state, enabled: false };
    case 'ENABLE': return state.optedIn ? { ...state, enabled: true } : state;
    case 'EXCLUDE': return { ...state, linkedAuto: state.linkedAuto.filter(id => id !== action.id), excluded: [...new Set([...state.excluded, action.id])] };
    case 'LOAD_DEMO_RESULTS': return { ...state, demoResults: true };
    case 'RESET': return structuredClone(initialState);
  }
}
export const storageKey = 'link-on-demo-v1';
export function readState(): LinkState {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (data?.version !== 1 || !Array.isArray(data.linkedAuto) || !Array.isArray(data.interests) || !Array.isArray(data.excluded)) return structuredClone(initialState);
    return { ...initialState, ...data, linkedAuto: data.linkedAuto.filter((id: string) => id === 'starbucks' || id === 'ssf') };
  } catch { return structuredClone(initialState); }
}
