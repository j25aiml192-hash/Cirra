"use client";

import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

const defaultProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 1. Shopping Cart
export function CartIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M2.5 3.5h2.8l1.6 8.5a2.2 2.2 0 0 0 2.2 1.8h8.2a2.2 2.2 0 0 0 2.1-1.6l1.4-5.7H6.2" />
      <circle cx="9.5" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 2. Shopping Bag
export function BagIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M8.5 7.5a3.5 3.5 0 0 1 7 0" />
      <path d="M5.5 8h13a1.5 1.5 0 0 1 1.5 1.6l-1 9.5a3 3 0 0 1-3 2.9H8a3 3 0 0 1-3-2.9l-1-9.5A1.5 1.5 0 0 1 5.5 8z" />
    </svg>
  );
}

// 3. Discount / Promo Stamp
export function DiscountStampIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M12 2.5a2.5 2.5 0 0 1 2.3 1.5 2.5 2.5 0 0 0 2.7 1.4 2.5 2.5 0 0 1 2.5 1.8 2.5 2.5 0 0 0 2.2 2.1 2.5 2.5 0 0 1 1.4 2.7 2.5 2.5 0 0 0 1.5 2.5 2.5 2.5 0 0 1 0 3 2.5 2.5 0 0 0-1.5 2.5 2.5 2.5 0 0 1-1.4 2.7 2.5 2.5 0 0 0-2.2 2.1 2.5 2.5 0 0 1-2.5 1.8 2.5 2.5 0 0 0-2.7 1.4A2.5 2.5 0 0 1 12 21.5a2.5 2.5 0 0 1-2.3-1.5 2.5 2.5 0 0 0-2.7-1.4 2.5 2.5 0 0 1-2.5-1.8 2.5 2.5 0 0 0-2.2-2.1 2.5 2.5 0 0 1-1.4-2.7A2.5 2.5 0 0 0 1.4 12a2.5 2.5 0 0 1 0-3 2.5 2.5 0 0 0 1.5-2.5 2.5 2.5 0 0 1 1.4-2.7 2.5 2.5 0 0 0 2.2-2.1 2.5 2.5 0 0 1 2.5-1.8 2.5 2.5 0 0 0 2.7-1.4A2.5 2.5 0 0 1 12 2.5z" />
      <path d="M9 15L15 9" />
      <circle cx="9.5" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 4. Overlapping Price Tags
export function PriceTagsIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M6 8a3 3 0 0 1 3-3h1.8a3 3 0 0 1 2.1.9l5.2 5.2a3 3 0 0 1 0 4.2l-3.8 3.8a3 3 0 0 1-4.2 0L4.9 14A3 3 0 0 1 4 11.9V9a3 3 0 0 1 2-1z" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 5.5l5 5a2.5 2.5 0 0 1 0 3.5l-2.5 2.5" opacity="0.6" />
    </svg>
  );
}

// 5. Storefront / Awning
export function StorefrontIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 2 2 0 0 1-1-2.5z" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      <path d="M10 17h4" />
    </svg>
  );
}

// 6. Credit Card
export function CreditCardIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3.5" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

// 7. Card Insert / Swipe Terminal
export function CardSwipeIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 19h16" />
      <rect x="6" y="6" width="14" height="9" rx="2.5" transform="rotate(-25 13 10)" />
      <path d="M5.5 8.5l11.5-5.5" />
    </svg>
  );
}

// 8. Receipt / Perforated Invoice
export function ReceiptIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16.5l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V4z" />
      <path d="M9 7.5h6" />
      <path d="M9 11.5h4" />
      <circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 9. Package / Box
export function PackageIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="M9 4v3.2a1.3 1.3 0 0 0 1.3 1.3h3.4a1.3 1.3 0 0 0 1.3-1.3V4" />
      <path d="M10 15h4" />
    </svg>
  );
}

// 10. Package Delivered (Checkmark badge)
export function PackageCheckIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 15V7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5V13" />
      <path d="M9 4v3.2a1.3 1.3 0 0 0 1.3 1.3h3.4a1.3 1.3 0 0 0 1.3-1.3V4" />
      <circle cx="17" cy="17" r="4.2" />
      <path d="M15.2 17l1.3 1.3 2.5-2.5" />
    </svg>
  );
}

// 11. Package Scheduled / Pending (Clock badge)
export function PackageClockIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 15V7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5V13" />
      <path d="M9 4v3.2a1.3 1.3 0 0 0 1.3 1.3h3.4a1.3 1.3 0 0 0 1.3-1.3V4" />
      <circle cx="17" cy="17" r="4.2" />
      <path d="M17 15v2.2l1.5 1" />
    </svg>
  );
}

// 12. Package Return / Exchange (Cycle arrows)
export function PackageReturnIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <rect x="7.5" y="7.5" width="9" height="9" rx="2" />
      <path d="M10.5 7.5v2h3v-2" />
      <path d="M4 12a8 8 0 0 1 14.5-4.5l1.5-1.5" />
      <path d="M20 12a8 8 0 0 1-14.5 4.5L4 18" />
    </svg>
  );
}

// 13. Wallet
export function WalletIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3.5" />
      <path d="M15 10.5h4.2a1.3 1.3 0 0 1 1.3 1.3v2.4a1.3 1.3 0 0 1-1.3 1.3H15z" />
      <circle cx="18" cy="13" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 14. Barcode / QR Scanner
export function BarcodeScannerIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
      <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
      <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20H8" />
      <path d="M16 20h2.5a1.5 1.5 0 0 0 1.5-1.5V16" />
      <path d="M8 10v4" />
      <path d="M10.5 9v6" />
      <path d="M12.5 10.5v3" />
      <path d="M14.5 9v6" />
      <path d="M16.5 10v4" />
    </svg>
  );
}

// 15. Lock / Keypad Password Vault
export function LockKeypadIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M7.5 10V6.5a4.5 4.5 0 0 1 9 0V10" />
      <rect x="4.5" y="10" width="15" height="11" rx="3.5" />
      {/* 2 asterisks / keypad marks */}
      <path d="M8.5 16l2-2 M10.5 16l-2-2" />
      <path d="M13.5 16l2-2 M15.5 16l-2-2" />
    </svg>
  );
}

// 16. Star Review Bubble
export function StarBubbleIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M12 3a9 9 0 0 0-9 9c0 2.2.8 4.2 2.1 5.8L4 21l3.5-1.1A8.9 8.9 0 1 0 12 3z" />
      <path d="M12 8.5l1 2.3 2.5.2-1.9 1.6.6 2.4-2.2-1.3-2.2 1.3.6-2.4-1.9-1.6 2.5-.2z" />
    </svg>
  );
}

// 17. Chat Messages
export function ChatMessagesIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M17 14h1.5a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-9a3 3 0 0 0-3 3v1" opacity="0.6" />
      <path d="M14 8H5a3 3 0 0 0-3 3v4.5a3 3 0 0 0 3 3h1.5V21l3.5-2.5h4a3 3 0 0 0 3-3V11a3 3 0 0 0-3-3z" />
      <path d="M6 13.5h5" />
      <path d="M6 16.5h3" />
    </svg>
  );
}

// 18. Bar Chart Growth
export function BarChartGrowthIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M3 20.5h18" />
      <rect x="5.5" y="14" width="3.5" height="6.5" rx="1.75" />
      <rect x="10.5" y="9.5" width="3.5" height="11" rx="1.75" />
      <rect x="15.5" y="5" width="3.5" height="15.5" rx="1.75" />
    </svg>
  );
}

// 19. Dolly / Hand Truck
export function DollyCartIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 4l5.5 13.5L18 20" />
      <circle cx="9.5" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
      <rect x="10.5" y="7" width="7" height="7" rx="1.8" transform="rotate(22 14 10.5)" />
    </svg>
  );
}

// 20. Wishlist / Order Document
export function WishlistIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M13 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-6" />
      <path d="M17.5 3a2.5 2.5 0 0 1 3.5 3.5L19 8.5l-2-2 1.5-1.5z" />
      <circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <path d="M10 8h2" />
      <circle cx="7" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <path d="M10 12h4" />
      <circle cx="7" cy="16" r="0.8" fill="currentColor" stroke="none" />
      <path d="M10 16h6" />
    </svg>
  );
}

// 21. Cloud / Cloud Spend
export function CloudIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M6.5 19a4.5 4.5 0 0 1-.8-8.9 5.5 5.5 0 0 1 10.6-1.6 4.5 4.5 0 0 1 3.7 5.5A4 4 0 0 1 18 19H6.5z" />
    </svg>
  );
}

// 22. AI Chip / Core
export function AiChipIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <path d="M9 2.5v3 M15 2.5v3 M9 18.5v3 M15 18.5v3 M2.5 9h3 M2.5 15h3 M18.5 9h3 M18.5 15h3" />
    </svg>
  );
}

// 23. Shield Security / Guard
export function ShieldSecurityIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M12 3a9 9 0 0 0 7.5 4v6.5c0 4.5-3.5 7.5-7.5 8.5-4-1-7.5-4-7.5-8.5V7A9 9 0 0 0 12 3z" />
      <path d="M9.5 12l2 2 4-4" />
    </svg>
  );
}

// 24. Anomaly Warning Triangle
export function AnomalyTriangleIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M10.2 4.1a2 2 0 0 1 3.6 0l7.5 13.5A2 2 0 0 1 19.5 20.5H4.5a2 2 0 0 1-1.8-2.9l7.5-13.5z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 25. Sparkles / AI Assistant
export function SparklesAiIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M12 3c0 4.5 3.5 8 8 8-4.5 0-8 3.5-8 8 0-4.5-3.5-8-8-8 4.5 0 8-3.5 8-8z" />
      <path d="M19 3c0 1.5 1 2.5 2.5 2.5-1.5 0-2.5 1-2.5 2.5 0-1.5-1-2.5-2.5-2.5 1.5 0 2.5-1 2.5-2.5z" opacity="0.7" />
    </svg>
  );
}

// 26. User / Avatar
export function UserRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

// 27. Search / Magnifier
export function SearchRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L20.5 20.5" />
    </svg>
  );
}

// 28. Mail / Envelope
export function MailRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3.5" />
      <path d="M5.5 8.5L12 13l6.5-4.5" />
    </svg>
  );
}

// 29. Eye / Visibility
export function EyeRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M2.5 12c2.5-5 6-7.5 9.5-7.5s7 2.5 9.5 7.5c-2.5 5-6 7.5-9.5 7.5S5 17 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// 30. Checkmark Circle
export function CheckCircleRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12l2.5 2.5 5-5" />
    </svg>
  );
}

// 31. Settings Cog
export function SettingsCogIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </svg>
  );
}

// 32. Key
export function KeyRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="8" cy="12" r="4.5" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12.5 12H20v3h-2v-3" />
    </svg>
  );
}

// 33. Phone / Voice
export function PhoneRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M5.5 3.5h3.2a1.5 1.5 0 0 1 1.5 1.2l.6 3.2a1.5 1.5 0 0 1-.4 1.3L8.5 11a12 12 0 0 0 4.5 4.5l1.8-1.9a1.5 1.5 0 0 1 1.3-.4l3.2.6a1.5 1.5 0 0 1 1.2 1.5v3.2a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2z" />
    </svg>
  );
}

// 34. Layers / Stack Allocation
export function LayersRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M12 3.5L3 8.5l9 5 9-5-9-5z" />
      <path d="M3 13.5l9 5 9-5" />
      <path d="M3 18.5l9 5 9-5" />
    </svg>
  );
}

// 35. Arrow Right
export function ArrowRightRoundedIcon({ size = 20, className = "", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

// 36. Robot / Bot (AI Assistant & Agent Head)
export function RobotBotIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      {/* Antenna */}
      <path d="M12 7V4 M10 4h4" />
      {/* Head body */}
      <rect x="4.5" y="7" width="15" height="12" rx="4" />
      {/* Ear pins */}
      <path d="M2.5 13h2 M19.5 13h2" />
      {/* Pill eyes */}
      <rect x="8" y="11" width="2" height="3.5" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="11" width="2" height="3.5" rx="1" fill="currentColor" stroke="none" />
      {/* Friendly mouth */}
      <path d="M10.5 16h3" />
    </svg>
  );
}

// 37. Flame / Fire (Live Scenario)
export function FlameFireIcon({ size = 20, className = "text-amber-500", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M12 2.5c1.8 3 4.8 5 4.8 9.2a6.8 6.8 0 1 1-13.6 0c0-4.2 3.8-6.5 4.8-9.2 1.2 2.2 2.5 3 4 0z" />
      <path d="M12 18.5a3 3 0 0 0 3-3c0-1.8-1.5-3-2.2-4.2-.8 1.2-1.8 1.8-1.8 3.2a2 2 0 0 0 1 4z" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

// 38. Key Alert / Leaked Key
export function KeyAlertIcon({ size = 20, className = "text-purple-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="7.5" cy="12" r="4.5" />
      <circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 12h8v3h-2v-3" />
      <path d="M17 7l-2 2" strokeWidth={2.4} />
      <path d="M17 9l-2-2" strokeWidth={2.4} />
    </svg>
  );
}

// 39. Process Loop / Runaway Process
export function ProcessLoopIcon({ size = 20, className = "text-blue-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M20 12a8 8 0 0 1-14 5.3L4 19v-5h5" />
      <path d="M4 12a8 8 0 0 1 14-5.3L20 5v5h-5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// 40. Trend Spike / Bill Spike
export function TrendSpikeIcon({ size = 20, className = "text-orange-500", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M3.5 20.5h17" />
      <path d="M4 16l5-4 4 3 6.5-9" />
      <circle cx="19.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <path d="M16 6h3.5v3.5" />
    </svg>
  );
}

// 41. Globe Check (Regional Compliance)
export function GlobeCheckIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="11" cy="12" r="8" />
      <path d="M3.5 12h15" />
      <path d="M11 4a12 12 0 0 0 0 16" />
      <circle cx="18" cy="18" r="3.5" fill="#FFFFFF" />
      <path d="M16.5 18l1 1 2-2" strokeWidth={2.4} />
    </svg>
  );
}

// 42. Flag (Milestones / Benchmarks)
export function FlagIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h10.5a1.5 1.5 0 0 1 1.2 2.4L15 8.5l1.7 2.1A1.5 1.5 0 0 1 15.5 13H5" />
    </svg>
  );
}

// 43. Home / Overview
export function HomeIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4 11.5L12 4l8 7.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.5z" />
      <path d="M10 21v-5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5" />
      <path d="M17 7v-2h2v3.8" />
    </svg>
  );
}

// 44. User Admin (Profile with Gear)
export function UserAdminIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <circle cx="10" cy="8" r="4" />
      <path d="M3.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="18" cy="7" r="2.2" />
      <path d="M18 4v1M18 9v1M15 7h1M20 7h1" />
    </svg>
  );
}

// 45. Phone Call Bubble
export function PhoneCallBubbleIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M4.5 3.5h3a1.5 1.5 0 0 1 1.5 1.2l.5 2.8a1.5 1.5 0 0 1-.4 1.3L7.5 10a11 11 0 0 0 4.5 4.5l1.2-1.6a1.5 1.5 0 0 1 1.3-.4l2.8.5a1.5 1.5 0 0 1 1.2 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 3 4.7a2 2 0 0 1 2-2.2z" />
      <rect x="14" y="2.5" width="7" height="5" rx="1.5" />
      <circle cx="16" cy="5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 46. Chat Speech Bubble with Text Lines
export function ChatSpeechIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M19 14h1.5a2.5 2.5 0 0 0 2.5-2.5v-5A2.5 2.5 0 0 0 20.5 4h-10A2.5 2.5 0 0 0 8 6.5V7" opacity="0.5" />
      <path d="M16 8H5a3 3 0 0 0-3 3v4.5a3 3 0 0 0 3 3h1.5v3l3.5-3h6a3 3 0 0 0 3-3V11a3 3 0 0 0-3-3z" />
      <path d="M6.5 12h5" />
      <path d="M6.5 15h3.5" />
    </svg>
  );
}

// 47. Tilted Price Tag
export function TagTiltedIcon({ size = 20, className = "text-slate-600", strokeWidth = 2.2, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} strokeWidth={strokeWidth} className={className} {...props}>
      <path d="M6.5 7.5a2.5 2.5 0 0 1 2.5-2.5h2.5a2.5 2.5 0 0 1 1.8.8l6.2 6.2a2.5 2.5 0 0 1 0 3.5l-4.5 4.5a2.5 2.5 0 0 1-3.5 0L5.3 13.8A2.5 2.5 0 0 1 4.5 12V10a2.5 2.5 0 0 1 2-2.5z" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12.5 14.5l2-2" />
    </svg>
  );
}


