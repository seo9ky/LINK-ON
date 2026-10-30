import { LinkLogo } from './LinkLogo';
import { ScrollDocument } from './ScrollDocument';

function ExampleBenefit({ image, name, caption, manual = false }: { image: string; name: string; caption: string; manual?: boolean }) {
  return <div className="overview-benefit"><img src={`/assets/${image}`} alt="" width="52" height="52" /><div><strong>{name}</strong><span>{caption}</span></div><span className={`overview-status ${manual ? 'manual' : ''}`}><img src={`/assets/${manual ? 'plus.svg' : 'check-complete.svg'}`} alt="" width="16" height="16" />{manual ? '직접 LINK' : '자동 LINK'}</span></div>;
}
export function ServiceOverview({ onClose }: { onClose: () => void }) {
  return <ScrollDocument title="LINK ON 서비스 소개" subtitle="필요한 혜택을 알아서 챙겨주는 맞춤 LINK" label="서비스 소개 내용" closeLabel="서비스 소개 닫기" className="service-overview" onClose={onClose}>
    <div className="overview-content">
      <section className="overview-hero" data-reveal>
        <LinkLogo size={190} />
        <h1>나에게 맞는 혜택,<br /><em>알아서 LINK!</em></h1>
        <p>자주 놓치는 혜택은 알아서 챙기고,<br />더 필요한 혜택은 직접 선택하세요.</p>
        <div className="overview-concept"><div><b>O</b><span>고객 맞춤</span></div><span className="concept-divider" aria-hidden="true" /><div><b>N</b><span>자동 연결 혜택의 한도</span></div></div>
      </section>
      <section className="overview-section" data-reveal>
        <div className="overview-copy"><span className="overview-step">01 · 맞춤 자동 연결</span><h2>매번 찾지 않아도,<br />내게 맞는 혜택부터</h2><p>처음 한 번 동의하고 관심 업종을 설정하면, 이용 패턴에 맞는 혜택을 고객별 한도 내에서 자동으로 연결해요.</p><p className="overview-detail">한도를 모두 채우는 방식은 아니에요.<br />적합한 혜택이 없으면 연결하지 않아요.</p></div>
        <figure className="overview-visual overview-auto"><div className="overview-interest"><img src="/assets/gift-large.svg" alt="" width="48" height="48" /><div><strong>나의 관심 업종과 이용 패턴</strong><span>나에게 필요한 혜택을 찾는 기준</span></div></div><div className="overview-connector" aria-hidden="true" /><ExampleBenefit image="starbucks.png" name="스타벅스" caption="자주 이용하는 외식 · 간식" /><ExampleBenefit image="gs25.png" name="GS25" caption="일상에서 이용하는 편의점" /><figcaption>맞춤 자동 연결 예시</figcaption></figure>
      </section>
      <section className="overview-section overview-reverse" data-reveal>
        <div className="overview-copy"><span className="overview-step">02 · 직접 선택</span><h2>자동으로 챙기고,<br />선택은 내가</h2><p>자동 연결되지 않은 혜택도 직접 고를 수 있어요. 이용 조건을 확인하고 결제 전에 LINK하세요.</p><p className="overview-detail">직접 연결한 혜택은 개별 해제할 수 있어요.<br />다른 혜택의 연결 상태는 그대로 유지돼요.</p></div>
        <figure className="overview-visual overview-select"><span className="overview-visual-label">내가 고르는 추가 혜택</span><ExampleBenefit image="ssf.png" name="SSF SHOP" caption="패션 · 스타일" manual /><ExampleBenefit image="oliveyoung.png" name="올리브영" caption="건강 · 화장품" manual /><ExampleBenefit image="coupang.png" name="쿠팡" caption="온라인쇼핑몰" manual /><figcaption>가맹점과 혜택은 시연용 예시입니다.</figcaption></figure>
      </section>
      <section className="overview-section" data-reveal>
        <div className="overview-copy"><span className="overview-step">03 · 결제와 이용 결과</span><h2>연결한 혜택을<br />결제 결과까지 확인</h2><p>연결 후 조건에 맞게 결제하면 혜택이 적용돼요. 이 웹에서는 결제 체험으로 확인 중부터 할인 결과까지 살펴볼 수 있어요.</p><p className="overview-detail">실제 결제는 발생하지 않아요.<br />연결 여부·결제 금액·행사 기간에 따라 결과가 달라져요.</p></div>
        <figure className="overview-visual overview-result"><img className="overview-result-icon" src="/assets/check-success.svg" alt="" width="64" height="64" /><h3>이용 결과 확인</h3><ol><li><span>1</span><div><strong>혜택 연결</strong><p>결제 전에 LINK</p></div></li><li><span>2</span><div><strong>결제 체험</strong><p>가맹점과 금액 선택</p></div></li><li><span>3</span><div><strong>할인 결과 확인</strong><p>적용 혜택 또는 미적용 사유</p></div></li></ol></figure>
      </section>
      <section className="overview-ending" data-reveal><span className="overview-step">고객 편의 · 선택 데이터 · 수익성</span><h2>필요한 만큼 자동으로,<br />원하는 만큼 직접 선택</h2><p>모든 혜택을 자동 연결하는 대신, 고객의 선택을 남겨두고<br className="overview-desktop-break" /> 이용 효과와 할인 비용을 함께 고려하는 서비스입니다.</p><div className="overview-control"><img src="/assets/settings.svg" alt="" width="24" height="24" /><p>관심 업종 변경과 개별 혜택 제외는 언제든 가능해요.<br />LINK ON을 꺼도 이미 연결된 혜택은 유지돼요.</p></div><button className="overview-return" onClick={onClose}>체험 화면으로 돌아가기 <span aria-hidden="true">→</span></button></section>
    </div>
  </ScrollDocument>;
}
