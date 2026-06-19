// Shows only the P-icon portion of the logo, cropped to a square
interface Props {
  size?: number;
  className?: string;
}

export default function LogoIcon({ size = 36, className = '' }: Props) {
  // Image: 4028×2267. P icon spans roughly x:17%-42%, y:20%-90% of the canvas.
  // Scale image so P icon fills the container height, then crop horizontally.
  const imgH   = size / 0.70;                          // scale so P-height (70%) = size
  const imgW   = imgH * (4028 / 2267);                 // maintain aspect ratio
  const left   = -(imgW * 0.17) + (size - imgW * 0.25) / 2; // center P horizontally
  const top    = -(imgH * 0.20);                        // align P icon top to container top

  return (
    <div
      className={`overflow-hidden flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size, position: 'relative' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Podversal"
        style={{ position: 'absolute', width: imgW, height: imgH, top, left }}
        draggable={false}
      />
    </div>
  );
}
