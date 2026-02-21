import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// Contact Icons
export function NOContactIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Vertical power rail line */}
      <line x1="10" y1="0" x2="10" y2="24" stroke="currentColor" strokeWidth="2" />
      {/* Top contact arm */}
      <line x1="10" y1="7" x2="28" y2="7" stroke="currentColor" strokeWidth="2" />
      {/* Bottom contact arm */}
      <line x1="10" y1="17" x2="28" y2="17" stroke="currentColor" strokeWidth="2" />
      {/* Right connection line */}
      <line x1="28" y1="7" x2="28" y2="17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function NCContactIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Vertical power rail line */}
      <line x1="10" y1="0" x2="10" y2="24" stroke="currentColor" strokeWidth="2" />
      {/* Top contact arm */}
      <line x1="10" y1="7" x2="28" y2="7" stroke="currentColor" strokeWidth="2" />
      {/* Bottom contact arm */}
      <line x1="10" y1="17" x2="28" y2="17" stroke="currentColor" strokeWidth="2" />
      {/* Right connection line */}
      <line x1="28" y1="7" x2="28" y2="17" stroke="currentColor" strokeWidth="2" />
      {/* Diagonal slash for normally closed */}
      <line x1="6" y1="5" x2="32" y2="19" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Coil Icons
export function OutputCoilIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Coil circle */}
      <circle cx="20" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Right connection line */}
      <line x1="30" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SetCoilIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Coil circle */}
      <circle cx="20" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* S label */}
      <text x="20" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">S</text>
      {/* Right connection line */}
      <line x1="30" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ResetCoilIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Coil circle */}
      <circle cx="20" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* R label */}
      <text x="20" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">R</text>
      {/* Right connection line */}
      <line x1="30" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Timer Icons
export function TONIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Timer box */}
      <rect x="8" y="4" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
      {/* TON label */}
      <text x="20" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">TON</text>
      {/* Right connection line */}
      <line x1="32" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function TOFIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Timer box */}
      <rect x="8" y="4" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
      {/* TOF label */}
      <text x="20" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">TOF</text>
      {/* Right connection line */}
      <line x1="32" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function TPIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Timer box */}
      <rect x="8" y="4" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
      {/* TP label */}
      <text x="20" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">TP</text>
      {/* Right connection line */}
      <line x1="32" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Counter Icons
export function CTUIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Counter box */}
      <rect x="8" y="4" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
      {/* CTU label */}
      <text x="20" y="13" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">CTU</text>
      {/* Up arrow */}
      <path d="M20 14 L17 17 L23 17 Z" fill="currentColor" />
      {/* Right connection line */}
      <line x1="32" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function CTDIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Left connection line */}
      <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Counter box */}
      <rect x="8" y="4" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
      {/* CTD label */}
      <text x="20" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">CTD</text>
      {/* Down arrow */}
      <path d="M20 13 L17 10 L23 10 Z" fill="currentColor" />
      {/* Right connection line */}
      <line x1="32" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Branch Icons
export function ORStartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Vertical line on left */}
      <line x1="10" y1="4" x2="10" y2="20" stroke="currentColor" strokeWidth="2" />
      {/* Horizontal line at top going right */}
      <line x1="10" y1="6" x2="30" y2="6" stroke="currentColor" strokeWidth="2" />
      {/* Corner bracket - top-right corner going down */}
      <path d="M26 6 L26 18 L18 18" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function OREndIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6" {...props}>
      {/* Horizontal line at top coming from left */}
      <line x1="10" y1="6" x2="30" y2="6" stroke="currentColor" strokeWidth="2" />
      {/* Corner bracket - from top going down then left */}
      <path d="M22 6 L22 18 L30 18" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Vertical line on far right */}
      <line x1="30" y1="4" x2="30" y2="20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
