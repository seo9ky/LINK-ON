import { useEffect, useRef, type ReactNode } from 'react';

export function ScrollDocument({ title, subtitle, label, closeLabel, className = '', onClose, children }: {
  title: string; subtitle: string; label: string; closeLabel: string; className?: string; onClose: () => void; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollArea.current;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    root?.focus({ preventScroll: true });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    // Content stays visible without motion or IntersectionObserver support.
    const observer = root && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer?.unobserve(entry.target);
        if (motion.matches) return;
        const animation = entry.target.animate([
          { opacity: 0.35, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { root, threshold: 0.08 }) : null;
    root?.querySelectorAll('[data-reveal]').forEach(node => observer?.observe(node));
    const stopMotion = () => { if (motion.matches) { animations.forEach(a => a.cancel()); animations.clear(); } };
    motion.addEventListener('change', stopMotion);
    return () => {
      observer?.disconnect();
      animations.forEach(a => a.cancel());
      motion.removeEventListener('change', stopMotion);
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return <dialog ref={dialog} className={`plan-viewer ${className}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="plan-header">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      <button type="button" onClick={onClose} className="plan-close" aria-label={closeLabel}><span>닫기</span><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></button>
    </header>
    <div ref={scrollArea} className="plan-scroll" role="region" aria-label={label} tabIndex={0}>{children}</div>
  </dialog>;
}
