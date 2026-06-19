interface Props {
  height?: number;
  className?: string;
  onDark?: boolean; // kept for API compatibility, no longer changes behaviour
}

export default function Logo({ height = 44, className = '' }: Props) {
  return (
    <div className={`flex-shrink-0 select-none ${className}`} style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Podversal Studio"
        style={{ height, width: 'auto' }}
        draggable={false}
      />
    </div>
  );
}
