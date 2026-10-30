import slides from './plan-slides.json';
import { ScrollDocument } from './ScrollDocument';

export function PlanViewer({ onClose }: { onClose: () => void }) {
  return <ScrollDocument title="LINK ON 기획서" subtitle="8장 · 위아래로 스크롤해 보세요" label="기획서 슬라이드" closeLabel="기획서 닫기" onClose={onClose}>
    {slides.map(slide => <figure key={slide.number} className="plan-slide" data-reveal>
      <figcaption><span>{slide.title}</span><span>{String(slide.number).padStart(2, '0')} / 08</span></figcaption>
      <img src={slide.src} width={slide.width} height={slide.height} alt={`${slide.number}장 · ${slide.title}`} loading="eager" decoding="async" />
      <p className="sr-only">{slide.text}</p>
    </figure>)}
  </ScrollDocument>;
}
