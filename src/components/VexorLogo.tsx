// Vexor brand logo component — matches the official vexoritsolutions.site brand mark.
// Double-chevron V in cyan gradient + wordmark.

interface VexorLogoProps {
  /** Show just the mark, or mark + wordmark */
  variant?: 'mark' | 'full';
  /** Height of the mark icon in pixels */
  size?: number;
  className?: string;
}

export default function VexorLogo({ variant = 'full', size = 32, className = '' }: VexorLogoProps) {
  const Mark = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vxr-grad" x1="8" y1="16" x2="56" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* Outer V — dimmer */}
      <polyline
        points="8,18 32,46 56,18"
        stroke="url(#vxr-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* Inner V — bright */}
      <polyline
        points="17,18 32,37 47,18"
        stroke="url(#vxr-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <span className={className}>
        <Mark />
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mark />
      <span
        style={{ fontFamily: 'inherit', letterSpacing: '-0.02em' }}
        className="font-black text-foreground leading-none select-none"
      >
        vexor
      </span>
    </div>
  );
}
