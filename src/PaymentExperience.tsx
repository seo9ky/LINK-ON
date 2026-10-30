import { SelectField } from './FormControls';
import { useEffect, useState, type Dispatch } from 'react';
import { availableCampaigns, connection, merchants, money, reducer, usageLabel, type Action, type LinkState } from './model';

export function PaymentExperience({ state, dispatch, requestedId, onSubmitted, onAmountChange }: {
  state: LinkState; dispatch: Dispatch<Action>; requestedId?: string; onSubmitted: () => void; onAmountChange: (amount: string) => void;
}) {
  const offers = availableCampaigns(state);
  const first = offers.find(c => c.id === requestedId)
    || offers.find(c => connection(state, c.id) && !usageLabel(state, c.id)) || offers[0];
  const [id, setId] = useState(first?.id || '');
  const selected = offers.find(c => c.id === id);
  const [amount, setAmount] = useState(String((first?.minimum || 5000) + 1500));
  const [error, setError] = useState('');
  useEffect(() => onAmountChange(amount), [amount, onAmountChange]);
  const linked = selected && connection(state, selected.id);

  return <>
    <h2>가맹점과 금액을 확인해 주세요</h2>

    <form id="payment-experience" className="payment-form" onSubmit={event => {
      event.preventDefault();
      const action: Action = { type: 'PAY', id, amount: Number(amount), otherDiscount: false };
      const next = reducer(state, action);
      if (next.payments.length === state.payments.length) { setError(next.notice); return; }
      dispatch(action); onSubmitted();
    }}>
      <label htmlFor="experience-merchant">결제할 가맹점</label>
      <SelectField id="experience-merchant" value={id} onChange={event => {
        const c = offers.find(c => c.id === event.target.value)!;
        setId(c.id); setAmount(String(c.minimum + 1500)); setError('');
      }}>
        {[{ label: '연결된 혜택', items: offers.filter(c => connection(state, c.id) && !usageLabel(state, c.id)) },
          { label: '이용 완료 · 확인 중', items: offers.filter(c => usageLabel(state, c.id)) },
          { label: '연결하지 않은 혜택', items: offers.filter(c => !connection(state, c.id) && !usageLabel(state, c.id)) }]
          .filter(group => group.items.length).map(group => <optgroup key={group.label} label={group.label}>{group.items.map(c => <option key={c.id} value={c.id}>{merchants[c.merchant].name}{usageLabel(state, c.id) ? ` · ${usageLabel(state, c.id)}` : connection(state, c.id) ? ' · 연결됨' : ''}</option>)}</optgroup>)}
      </SelectField>
      <label htmlFor="experience-amount">결제금액 (원)</label>
      <input id="experience-amount" type="number" inputMode="numeric" min="1" max="100000000" step="1" required value={amount} aria-invalid={!!error} aria-describedby="payment-help payment-error" onChange={event => { setAmount(event.target.value); setError(''); }} />
      {selected ? <div className="payment-condition">
        <strong>{money(selected.minimum)} 이상 결제 시 {money(selected.discount)} 할인</strong>
        <p className="small muted">{usageLabel(state, id) ? '이미 이용했거나 확인 중인 혜택이에요. 다시 결제해도 중복 할인되지 않아요.' : linked ? `${linked.mode === 'auto' ? '자동' : '직접'} LINK로 연결된 혜택이에요.` : '연결하지 않은 혜택이에요. 지금 결제하면 할인이 적용되지 않아요.'}</p>
      </div> : <p className="small muted">현재 체험할 수 있는 행사가 없어요.</p>}
      <p id="payment-help" className="small muted">금액을 바꿔 할인 조건을 비교해 보세요.<br />이 체험에는 다른 할인이 적용되지 않아요.</p>
      <p id="payment-error" className="form-error" role="alert">{error}</p>
    </form>
  </>;
}
