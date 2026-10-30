import type { CSSProperties } from 'react';
const asset = (name: string) => `/assets/${name}`;
export function LinkLogo({ size = 170 }: { size?: 128 | 170 | 180 | 190 }) {
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
