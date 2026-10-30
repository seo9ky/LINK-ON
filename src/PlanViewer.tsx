import { useEffect, useRef } from 'react';
import slides from './plan-slides.json';

export function PlanViewer({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    scrollArea.current?.focus({ preventScroll: true });
    return () => {
      dialog.current?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return <dialog ref={dialog} className="plan-viewer" aria-labelledby="plan-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="plan-header">
      <div><h2 id="plan-title">LINK ON 기획서</h2><p>8장 · 위아래로 스크롤해 보세요</p></div>
      <button type="button" onClick={onClose} className="plan-close" aria-label="기획서 닫기"><span>닫기</span><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></button>
    </header>
    <div ref={scrollArea} className="plan-scroll" role="region" aria-label="기획서 슬라이드" tabIndex={0}>
      {slides.map(slide => <figure key={slide.number} className="plan-slide">
        <figcaption><span>{slide.title}</span><span>{String(slide.number).padStart(2, '0')} / 08</span></figcaption>
        <img src={slide.src} width={slide.width} height={slide.height} alt={`${slide.number}장 · ${slide.title}`} loading="eager" decoding="async" />
        <p className="sr-only">{slide.text}</p>
      </figure>)}
    </div>
  </dialog>;
}
