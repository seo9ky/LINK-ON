import { useEffect, useRef, useState } from 'react';
import slides from './plan-slides.json';
import { ScrollDocument } from './ScrollDocument';

type Slide = typeof slides[number];
function SlideZoom({ slide, onClose, returnFocus }: { slide: Slide; onClose: () => void; returnFocus: HTMLButtonElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(3);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    area.current?.focus({ preventScroll: true });
    return () => { element?.close(); returnFocus?.focus({ preventScroll: true }); };
  }, [returnFocus]);
  const resize = (next: number) => {
    const element = area.current;
    if (!element) return;
    const centerX = (element.scrollLeft + element.clientWidth / 2) / zoom;
    const centerY = (element.scrollTop + element.clientHeight / 2) / zoom;
    setZoom(next);
    requestAnimationFrame(() => {
      element.scrollLeft = next === 1 ? 0 : centerX * next - element.clientWidth / 2;
      element.scrollTop = next === 1 ? 0 : centerY * next - element.clientHeight / 2;
    });
  };
  return <dialog ref={dialog} className="slide-zoom" aria-label={`${slide.number}장 ${slide.title} 확대 보기`} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="plan-header"><h2>{slide.title}<span className="zoom-page">{String(slide.number).padStart(2, '0')} / 08</span></h2><button className="plan-close" onClick={onClose} aria-label="확대 보기 닫기">닫기 <span aria-hidden="true">×</span></button></header>
    <div className="zoom-toolbar" role="group" aria-label="슬라이드 확대 조절">
      <button onClick={() => resize(Math.max(1, zoom - 1))} disabled={zoom === 1} aria-label="슬라이드 축소">−</button><output aria-live="polite">{zoom * 100}%</output><button onClick={() => resize(Math.min(4, zoom + 1))} disabled={zoom === 4} aria-label="슬라이드 확대">+</button><button className="zoom-fit" onClick={() => resize(1)}>화면 맞춤</button>
    </div>
    <div ref={area} className="zoom-scroll" tabIndex={0} role="region" aria-label="확대한 슬라이드">
      <img src={slide.src} width={slide.width} height={slide.height} style={{ width: `${zoom * 100}%` }} alt={`${slide.number}장 · ${slide.title}`} draggable={false} />
      <p className="sr-only">{slide.text}</p>
    </div>
  </dialog>;
}
export function PlanViewer({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Slide | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  return <><ScrollDocument title="LINK ON 기획서" label="기획서 슬라이드" closeLabel="기획서 닫기" onClose={onClose}>
    {slides.map(slide => <figure key={slide.number} className="plan-slide" data-reveal>
      <figcaption><span>{slide.title}</span><span>{String(slide.number).padStart(2, '0')} / 08</span></figcaption>
      <button className="plan-slide-open" aria-label={`${slide.number}장 ${slide.title} 확대 보기`} aria-haspopup="dialog" onClick={event => { opener.current = event.currentTarget; setSelected(slide); }}>
        <img src={slide.src} width={slide.width} height={slide.height} alt={`${slide.number}장 · ${slide.title}`} loading="eager" decoding="async" />
      </button>
      <p className="sr-only">{slide.text}</p>
    </figure>)}
  </ScrollDocument>{selected && <SlideZoom slide={selected} onClose={() => setSelected(null)} returnFocus={opener.current} />}</>;
}
