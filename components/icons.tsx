// Small reusable SVG icons (all stroke-based, inherit color via currentColor).
// Paths are copied verbatim from the SVGs in medical_store2.html.

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function base({ size = 18, strokeWidth = 2, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
}

export function IconCheck({ size = 13, strokeWidth = 3, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function IconCheckCircle({ size = 30, strokeWidth = 2.4, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.5 2.6 2.6L16 9.5" />
    </svg>
  );
}

/** Medical cross / plus — used for the logo mark, loader and marquee */
export function IconCross({ size = 18, strokeWidth = 3.2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

export function IconPlus({ size = 15, strokeWidth = 2.6, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconArrow({ size = 17, strokeWidth = 2.4, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export function IconX({ size = 17, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconMenu({ size = 20, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function IconSearch({ size = 20, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconCart({ size = 20, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M6 7h12l1.2 12.2a1.5 1.5 0 0 1-1.5 1.8H6.3a1.5 1.5 0 0 1-1.5-1.8L6 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

export function IconHeart({ size = 18, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.5-6C8.4 5 10 6.4 12 8.4 14 6.4 15.6 5 17.5 5c2.9 0 4.7 3.3 3.5 6-2 4.4-9 9-9 9Z" />
    </svg>
  );
}

export function IconEye({ size = 15, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    </svg>
  );
}

/** Prescription / upload */
export function IconRx({ size = 16, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

export function IconChat({ size = 17, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M21 12a8 8 0 1 0-3.1 6.3L21 20l-.8-3.2A8 8 0 0 0 21 12Z" />
    </svg>
  );
}

export function IconTruck({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

export function IconThermo({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 3a2 2 0 0 1 2 2v8.5a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconShield({ size = 17, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 3 4.5 6v5c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

export function IconBell({ size = 15, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
    </svg>
  );
}

export function IconClock({ size = 23, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2.5" />
    </svg>
  );
}

export function IconSparkle({ size = 26, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 3v0l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M18.5 15.5 19 17l1.5.5L19 18l-.5 1.5L18 18l-1.5-.5L18 17l.5-1.5Z" />
    </svg>
  );
}

/** Chat bubble with three dots — "24/7 human support" feature */
export function IconChatDots({ size = 23, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M21 12a8 8 0 1 0-3.1 6.3L21 20l-.8-3.2A8 8 0 0 0 21 12Z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </svg>
  );
}

export function IconHome({ size = 23, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M4 20v-8l8-6 8 6v8h-5v-5h-6v5H4Z" />
    </svg>
  );
}

export function IconPack({ size = 23, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="m12 3 8 3v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6l8-3Z" />
      <path d="M12 8v5M9.5 10.5h5" />
    </svg>
  );
}

export function IconPhone({ size = 15, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M5 4h4l1.5 4L8 10a12 12 0 0 0 6 6l2-2.5 4 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function IconMail({ size = 15, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function IconPin({ size = 15, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function IconSend({ size = 17, strokeWidth = 2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" />
    </svg>
  );
}

export function IconUp({ size = 18, strokeWidth = 2.4, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  );
}

export function IconChevLeft({ size = 18, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M19 12H5m6 6-6-6 6-6" />
    </svg>
  );
}

export function IconChevRight({ size = 18, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M5 12h14m-6 6 6-6-6-6" />
    </svg>
  );
}

/** Lightning bolt — "Reorder in one tap" app feature */
export function IconBolt({ size = 15, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, className })}>
      <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
    </svg>
  );
}

/** Apple logo (filled) */
export function IconApple({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 12.54c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.46 7.82 1.3 10.38.87 1.25 1.9 2.66 3.25 2.61 1.31-.05 1.8-.85 3.39-.85 1.58 0 2.03.85 3.41.82 1.4-.02 2.29-1.27 3.15-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.74-1.05-2.8-4.18ZM14.46 4.9c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.29.69-3.03 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.33-.58 3.05-1.45Z" />
    </svg>
  );
}

/** Google Play logo (filled) */
export function IconPlay({ size = 21 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.6 2.3 13.4 12 3.6 21.7c-.36-.2-.6-.6-.6-1.1V3.4c0-.5.24-.9.6-1.1Zm11.2 8.3 2.5-2.5 3.4 2c.9.5.9 1.5 0 2l-3.4 2-2.5-2.5-.9-.5.9-.5ZM4.9 1.8l10.6 6.2-2.1 2.1L4.9 1.8Zm0 20.4 8.5-8.3 2.1 2.1L4.9 22.2Z" />
    </svg>
  );
}
