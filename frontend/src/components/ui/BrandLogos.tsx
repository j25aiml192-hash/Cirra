import React from "react";

// Official Real Brand Logos for Cloud & AI Providers matching authentic brand identities

export function AwsLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="AWS">
      <text x="50" y="52" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="34" fill="#232F3E" textAnchor="middle" letterSpacing="-1">
        aws
      </text>
      <path d="M22 65 C40 78, 60 78, 78 65" fill="none" stroke="#FF9900" strokeWidth="6" strokeLinecap="round" />
      <polygon points="76,60 83,67 74,70" fill="#FF9900" />
    </svg>
  );
}

export function GcpCloudLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Google Cloud">
      <g transform="translate(18, 22) scale(0.64)">
        <path fill="#EA4335" d="M68.5 35.8c-2.4-7.5-8.6-13.4-16.2-16.2l-10 17.3 26.2-1.1z" />
        <path fill="#4285F4" d="M52.3 19.6C44.7 16.8 36.2 18 29.8 22.8L39.8 40l12.5-20.4z" />
        <path fill="#FBBC05" d="M29.8 22.8c-6.4 4.8-10.1 12.3-10.1 20.3 0 2.2.3 4.4.9 6.5L39.8 40 29.8 22.8z" />
        <path fill="#34A853" d="M20.6 49.6c2.4 7.5 8.6 13.4 16.2 16.2l10-17.3-26.2 1.1z" />
        <path fill="#4285F4" d="M36.8 65.8c7.6 2.8 16.1 1.6 22.5-3.2L49.3 45.4 36.8 65.8z" />
        <path fill="#EA4335" d="M59.3 62.6c6.4-4.8 10.1-12.3 10.1-20.3 0-2.2-.3-4.4-.9-6.5L49.3 45.4l10 17.2z" />
      </g>
    </svg>
  );
}

export function AzureBlockLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Microsoft Azure">
      <path fill="#0078D4" d="M54.5 20L25 73h21l15.5-29L76 73h15L54.5 20z" />
      <path fill="#50E6FF" d="M23 74l-9 9h66l-8-9H23z" />
    </svg>
  );
}

export function KubernetesWheelLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Kubernetes">
      <g transform="translate(14, 14) scale(0.72)">
        <polygon points="50,6 88,23 98,64 74,94 26,94 2,64 12,23" fill="none" stroke="#326CE5" strokeWidth="7" />
        <circle cx="50" cy="50" r="14" fill="#326CE5" />
        <line x1="50" y1="14" x2="50" y2="36" stroke="#326CE5" strokeWidth="6" />
        <line x1="78" y1="28" x2="62" y2="42" stroke="#326CE5" strokeWidth="6" />
        <line x1="86" y1="62" x2="64" y2="54" stroke="#326CE5" strokeWidth="6" />
        <line x1="66" y1="86" x2="56" y2="64" stroke="#326CE5" strokeWidth="6" />
        <line x1="34" y1="86" x2="44" y2="64" stroke="#326CE5" strokeWidth="6" />
        <line x1="14" y1="62" x2="36" y2="54" stroke="#326CE5" strokeWidth="6" />
        <line x1="22" y1="28" x2="38" y2="42" stroke="#326CE5" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function OpenAiRosetteLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="OpenAI">
      <path
        fill="#10a37f"
        d="M83.8 38.8a22.2 22.2 0 0 0-1.9-18.2 22.5 22.5 0 0 0-24.2-10.8 22.6 22.6 0 0 0-38.3 8.1 22.2 22.2 0 0 0-15 10.8 22.5 22.5 0 0 0 2.8 26.3 22.2 22.2 0 0 0 1.9 18.2 22.5 22.5 0 0 0 24.2 10.8 22.6 22.6 0 0 0 38.3-8.1 22.2 22.2 0 0 0 15-10.8 22.5 22.5 0 0 0-2.8-26.3zm-33.6 47a16.7 16.7 0 0 1-10.7-3.9l.5-.3 17.8-10.3a3 3 0 0 0 1.5-2.5v-25.1l7.5 4.3a.3.3 0 0 1 .1.2v20.8a16.8 16.8 0 0 1-16.7 16.8zm-36-15.4a16.7 16.7 0 0 1-2-11.2l.5.3 17.8 10.3a3 3 0 0 0 2.9 0l21.8-12.6v8.7a.3.3 0 0 1-.1.2L37 77.2a16.8 16.8 0 0 1-22.9-6.8zM8.8 29.5a16.7 16.7 0 0 1 8.8-7.4v21.2a3 3 0 0 0 1.4 2.5l21.7 12.5-7.5 4.4a.3.3 0 0 1-.3 0L15 52.3a16.8 16.8 0 0 1-6.2-22.8zm62 14.3l-21.8-12.6 7.5-4.3a.3.3 0 0 1 .3 0l18 10.4a16.8 16.8 0 0 1-2.5 30.2v-21.2a3 3 0 0 0-1.5-2.5zm7.5-11.2l-.5-.3-17.8-10.4a3 3 0 0 0-2.9 0L15.3 34.5v-8.7a.3.3 0 0 1 .1-.2L33.4 15a16.8 16.8 0 0 1 24.9 17.4zm-47.3 19l-7.5-4.3a.3.3 0 0 1-.1-.2v-20.8a16.8 16.8 0 0 1 27.5-12.9l-.5.3-17.8 10.3a3 3 0 0 0-1.5 2.5v25.1zm4.1-8.8l9.7-5.6 9.7 5.6v11.2l-9.7 5.6-9.7-5.6z"
      />
    </svg>
  );
}

export function AnthropicAiLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Anthropic Claude">
      <g transform="translate(10, 15) scale(0.8)">
        <path fill="#CC785C" d="M60 18h16L42 78H26l18-34.5h.3L60 18z" />
        <path fill="#1D1D1F" d="M76 78H60L41 43.5h16L76 78z" />
      </g>
    </svg>
  );
}

export function VertexAiLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Google Cloud Vertex AI">
      <g fill="#1D1D1F">
        <circle cx="26" cy="24" r="4.5" />
        <circle cx="38" cy="24" r="4.5" />
        <circle cx="50" cy="24" r="4.5" />
        <circle cx="62" cy="24" r="4.5" />
        <circle cx="74" cy="24" r="4.5" />
        <circle cx="32" cy="38" r="4.5" />
        <circle cx="44" cy="38" r="4.5" />
        <circle cx="56" cy="38" r="4.5" />
        <circle cx="68" cy="38" r="4.5" />
        <circle cx="38" cy="52" r="4.5" />
        <circle cx="50" cy="52" r="4.5" />
        <circle cx="62" cy="52" r="4.5" />
        <circle cx="44" cy="66" r="4.5" />
        <circle cx="56" cy="66" r="4.5" />
        <circle cx="50" cy="80" r="4.5" />
      </g>
    </svg>
  );
}

export function BedrockGlyphLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Amazon Bedrock">
      <g fill="none" stroke="#232F3E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="50" r="32" />
        <line x1="50" y1="18" x2="50" y2="82" />
        <path d="M50 34 C38 36, 28 42, 24 50" />
        <path d="M50 48 C38 52, 30 58, 26 64" />
        <path d="M50 34 C62 36, 72 42, 76 50" />
        <path d="M50 48 C62 52, 70 58, 74 64" />
      </g>
    </svg>
  );
}

export function NvidiaEyeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="NVIDIA GPUs">
      <rect x="16" y="16" width="68" height="68" rx="16" fill="#76B900" />
      <g transform="translate(20, 20) scale(0.6)">
        <path fill="white" d="M35 50c0-8.3 6.7-15 15-15 6.6 0 12.3 4.3 14.3 10.4-2.8-3-6.8-4.9-11.3-4.9-8.6 0-15.5 7-15.5 15.5 0 4.5 1.9 8.5 4.9 11.3-4.4-3-7.4-8-7.4-13.8v-3.5z" />
        <path fill="white" d="M50 40c-5.5 0-10 4.5-10 10 0 3.6 1.9 6.7 4.7 8.4-2.3-1.9-3.7-4.9-3.7-8.4 0-5.8 4.7-10.5 10.5-10.5 3.9 0 7.3 2.1 9.2 5.3-2.6-3-6.4-4.8-10.7-4.8z" />
        <circle cx="50" cy="50" r="4" fill="white" />
      </g>
    </svg>
  );
}

export function GitHubMarkLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="GitHub">
      <path
        fill="#24292e"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 16C31.2 16 16 31.2 16 50c0 15 9.7 27.8 23.2 32.3 1.7.3 2.3-.7 2.3-1.6 0-.8 0-3.5-.1-6.5-9.5 2.1-11.5-4-11.5-4-1.6-3.9-3.8-5-3.8-5-3.1-2.1.2-2.1.2-2.1 3.4.2 5.2 3.5 5.2 3.5 3 5.2 8 3.7 9.9 2.8.3-2.2 1.2-3.7 2.2-4.6-7.6-.9-15.5-3.8-15.5-16.8 0-3.7 1.3-6.7 3.5-9.1-.3-.9-1.5-4.3.3-9 0 0 2.8-.9 9.3 3.5 2.7-.8 5.6-1.1 8.5-1.1s5.8.4 8.5 1.1c6.4-4.4 9.2-3.5 9.2-3.5 1.9 4.7.7 8.1.4 9 2.2 2.4 3.5 5.4 3.5 9.1 0 13.1-8 15.9-15.6 16.8 1.2 1.1 2.3 3.1 2.3 6.3 0 4.6-.1 8.2-.1 9.4 0 .9.6 2 2.4 1.6C74.3 77.8 84 65 84 50c0-18.8-15.2-34-34-34z"
      />
    </svg>
  );
}

export function SnowflakeMarkLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Snowflake Data Cloud">
      <g stroke="#29B5E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="50" y1="12" x2="50" y2="88" />
        <line x1="17" y1="31" x2="83" y2="69" />
        <line x1="17" y1="69" x2="83" y2="31" />
        <path d="M50 26 L42 18 M50 26 L58 18" />
        <path d="M50 74 L42 82 M50 74 L58 82" />
        <path d="M29 38 L22 30 M29 38 L30 48" />
        <path d="M71 62 L70 52 M71 62 L78 70" />
        <path d="M29 62 L22 70 M29 62 L30 52" />
        <path d="M71 38 L70 48 M71 38 L78 30" />
        <circle cx="50" cy="50" r="4.5" fill="#29B5E8" />
      </g>
    </svg>
  );
}

export function DatadogMarkLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Datadog">
      <rect x="12" y="12" width="76" height="76" rx="20" fill="#632CA6" />
      <g transform="translate(18, 18) scale(0.64)">
        <path
          fill="#FFFFFF"
          d="M32 24c-6 0-11 5-11 11 0 9 10 16 29 31 19-15 29-22 29-31 0-6-5-11-11-11-5 0-9 3-11 7l-7 9-7-9c-2-4-6-7-11-7z"
        />
        <circle cx="42" cy="40" r="3.5" fill="#632CA6" />
        <circle cx="58" cy="40" r="3.5" fill="#632CA6" />
        <ellipse cx="50" cy="49" rx="5" ry="3.5" fill="#632CA6" />
      </g>
    </svg>
  );
}

// High-fidelity real brand data URLs for OrbitImages
export const BRAND_DATA_URLS = [
  {
    name: "OpenAI GPT-4o",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><path fill='%2310a37f' d='M83.8 38.8a22.2 22.2 0 0 0-1.9-18.2 22.5 22.5 0 0 0-24.2-10.8 22.6 22.6 0 0 0-38.3 8.1 22.2 22.2 0 0 0-15 10.8 22.5 22.5 0 0 0 2.8 26.3 22.2 22.2 0 0 0 1.9 18.2 22.5 22.5 0 0 0 24.2 10.8 22.6 22.6 0 0 0 38.3-8.1 22.2 22.2 0 0 0 15-10.8 22.5 22.5 0 0 0-2.8-26.3zm-33.6 47a16.7 16.7 0 0 1-10.7-3.9l.5-.3 17.8-10.3a3 3 0 0 0 1.5-2.5v-25.1l7.5 4.3a.3.3 0 0 1 .1.2v20.8a16.8 16.8 0 0 1-16.7 16.8zm-36-15.4a16.7 16.7 0 0 1-2-11.2l.5.3 17.8 10.3a3 3 0 0 0 2.9 0l21.8-12.6v8.7a.3.3 0 0 1-.1.2L37 77.2a16.8 16.8 0 0 1-22.9-6.8zM8.8 29.5a16.7 16.7 0 0 1 8.8-7.4v21.2a3 3 0 0 0 1.4 2.5l21.7 12.5-7.5 4.4a.3.3 0 0 1-.3 0L15 52.3a16.8 16.8 0 0 1-6.2-22.8zm62 14.3l-21.8-12.6 7.5-4.3a.3.3 0 0 1 .3 0l18 10.4a16.8 16.8 0 0 1-2.5 30.2v-21.2a3 3 0 0 0-1.5-2.5zm7.5-11.2l-.5-.3-17.8-10.4a3 3 0 0 0-2.9 0L15.3 34.5v-8.7a.3.3 0 0 1 .1-.2L33.4 15a16.8 16.8 0 0 1 24.9 17.4zm-47.3 19l-7.5-4.3a.3.3 0 0 1-.1-.2v-20.8a16.8 16.8 0 0 1 27.5-12.9l-.5.3-17.8 10.3a3 3 0 0 0-1.5 2.5v25.1zm4.1-8.8l9.7-5.6 9.7 5.6v11.2l-9.7 5.6-9.7-5.6z'/></svg>",
    alt: "OpenAI GPT-4o",
  },
  {
    name: "Anthropic Claude 3.5",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g transform='translate(10, 15) scale(0.8)'><path fill='%23CC785C' d='M60 18h16L42 78H26l18-34.5h.3L60 18z'/><path fill='%231D1D1F' d='M76 78H60L41 43.5h16L76 78z'/></g></svg>",
    alt: "Anthropic Claude",
  },
  {
    name: "Amazon Web Services",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><text x='50' y='52' font-family='system-ui, -apple-system, sans-serif' font-weight='900' font-size='34' fill='%23232F3E' text-anchor='middle' letter-spacing='-1'>aws</text><path d='M22 65 C40 78, 60 78, 78 65' fill='none' stroke='%23FF9900' stroke-width='6' stroke-linecap='round'/><polygon points='76,60 83,67 74,70' fill='%23FF9900'/></svg>",
    alt: "AWS Cloud",
  },
  {
    name: "Google Cloud",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g transform='translate(18, 22) scale(0.64)'><path fill='%23EA4335' d='M68.5 35.8c-2.4-7.5-8.6-13.4-16.2-16.2l-10 17.3 26.2-1.1z'/><path fill='%234285F4' d='M52.3 19.6C44.7 16.8 36.2 18 29.8 22.8L39.8 40l12.5-20.4z'/><path fill='%23FBBC05' d='M29.8 22.8c-6.4 4.8-10.1 12.3-10.1 20.3 0 2.2.3 4.4.9 6.5L39.8 40 29.8 22.8z'/><path fill='%2334A853' d='M20.6 49.6c2.4 7.5 8.6 13.4 16.2 16.2l10-17.3-26.2 1.1z'/><path fill='%234285F4' d='M36.8 65.8c7.6 2.8 16.1 1.6 22.5-3.2L49.3 45.4 36.8 65.8z'/><path fill='%23EA4335' d='M59.3 62.6c6.4-4.8 10.1-12.3 10.1-20.3 0-2.2-.3-4.4-.9-6.5L49.3 45.4l10 17.2z'/></g></svg>",
    alt: "Google Cloud",
  },
  {
    name: "Microsoft Azure",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><path fill='%230078D4' d='M54.5 20L25 73h21l15.5-29L76 73h15L54.5 20z'/><path fill='%2350E6FF' d='M23 74l-9 9h66l-8-9H23z'/></svg>",
    alt: "Microsoft Azure",
  },
  {
    name: "GitHub Actions",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><path fill='%2324292e' fill-rule='evenodd' clip-rule='evenodd' d='M50 16C31.2 16 16 31.2 16 50c0 15 9.7 27.8 23.2 32.3 1.7.3 2.3-.7 2.3-1.6 0-.8 0-3.5-.1-6.5-9.5 2.1-11.5-4-11.5-4-1.6-3.9-3.8-5-3.8-5-3.1-2.1.2-2.1.2-2.1 3.4.2 5.2 3.5 5.2 3.5 3 5.2 8 3.7 9.9 2.8.3-2.2 1.2-3.7 2.2-4.6-7.6-.9-15.5-3.8-15.5-16.8 0-3.7 1.3-6.7 3.5-9.1-.3-.9-1.5-4.3.3-9 0 0 2.8-.9 9.3 3.5 2.7-.8 5.6-1.1 8.5-1.1s5.8.4 8.5 1.1c6.4-4.4 9.2-3.5 9.2-3.5 1.9 4.7.7 8.1.4 9 2.2 2.4 3.5 5.4 3.5 9.1 0 13.1-8 15.9-15.6 16.8 1.2 1.1 2.3 3.1 2.3 6.3 0 4.6-.1 8.2-.1 9.4 0 .9.6 2 2.4 1.6C74.3 77.8 84 65 84 50c0-18.8-15.2-34-34-34z'/></svg>",
    alt: "GitHub Actions",
  },
  {
    name: "Snowflake Data",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g transform='translate(18, 18) scale(0.64)' stroke='%2329B5E8' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'><line x1='50' y1='10' x2='50' y2='90'/><line x1='15' y1='30' x2='85' y2='70'/><line x1='15' y1='70' x2='85' y2='30'/><path d='M50 25 L40 15 M50 25 L60 15'/><path d='M50 75 L40 85 M50 75 L60 85'/><path d='M28 37 L20 28 M28 37 L30 48'/><path d='M72 63 L70 52 M72 63 L80 72'/><path d='M28 63 L20 72 M28 63 L30 52'/><path d='M72 37 L70 48 M72 37 L80 28'/><circle cx='50' cy='50' r='5' fill='%2329B5E8'/></g></svg>",
    alt: "Snowflake Data Cloud",
  },
  {
    name: "Google Vertex AI",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g fill='%231D1D1F'><circle cx='26' cy='24' r='4.5'/><circle cx='38' cy='24' r='4.5'/><circle cx='50' cy='24' r='4.5'/><circle cx='62' cy='24' r='4.5'/><circle cx='74' cy='24' r='4.5'/><circle cx='32' cy='38' r='4.5'/><circle cx='44' cy='38' r='4.5'/><circle cx='56' cy='38' r='4.5'/><circle cx='68' cy='38' r='4.5'/><circle cx='38' cy='52' r='4.5'/><circle cx='50' cy='52' r='4.5'/><circle cx='62' cy='52' r='4.5'/><circle cx='44' cy='66' r='4.5'/><circle cx='56' cy='66' r='4.5'/><circle cx='50' cy='80' r='4.5'/></g></svg>",
    alt: "Vertex AI",
  },
  {
    name: "Datadog",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g transform='translate(14, 14) scale(0.72)'><rect width='100' height='100' rx='20' fill='%23632CA6'/><path fill='%23FFFFFF' d='M32 24c-6 0-11 5-11 11 0 9 10 16 29 31 19-15 29-22 29-31 0-6-5-11-11-11-5 0-9 3-11 7l-7 9-7-9c-2-4-6-7-11-7z'/><circle cx='42' cy='40' r='3.5' fill='%23632CA6'/><circle cx='58' cy='40' r='3.5' fill='%23632CA6'/><ellipse cx='50' cy='49' rx='5' ry='3.5' fill='%23632CA6'/></g></svg>",
    alt: "Datadog",
  },
  {
    name: "Amazon Bedrock",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g fill='none' stroke='%23232F3E' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'><circle cx='50' cy='50' r='32'/><line x1='50' y1='18' x2='50' y2='82'/><path d='M50 34 C38 36, 28 42, 24 50'/><path d='M50 48 C38 52, 30 58, 26 64'/><path d='M50 34 C62 36, 72 42, 76 50'/><path d='M50 48 C62 52, 70 58, 74 64'/></g></svg>",
    alt: "Amazon Bedrock",
  },
  {
    name: "NVIDIA Compute",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><rect x='16' y='16' width='68' height='68' rx='16' fill='%2376B900'/><g transform='translate(20, 20) scale(0.6)'><path fill='white' d='M35 50c0-8.3 6.7-15 15-15 6.6 0 12.3 4.3 14.3 10.4-2.8-3-6.8-4.9-11.3-4.9-8.6 0-15.5 7-15.5 15.5 0 4.5 1.9 8.5 4.9 11.3-4.4-3-7.4-8-7.4-13.8v-3.5z'/><path fill='white' d='M50 40c-5.5 0-10 4.5-10 10 0 3.6 1.9 6.7 4.7 8.4-2.3-1.9-3.7-4.9-3.7-8.4 0-5.8 4.7-10.5 10.5-10.5 3.9 0 7.3 2.1 9.2 5.3-2.6-3-6.4-4.8-10.7-4.8z'/><circle cx='50' cy='50' r='4' fill='white'/></g></svg>",
    alt: "NVIDIA GPUs",
  },
  {
    name: "Kubernetes Engine",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23ffffff' stroke='%23e0e0e0' stroke-width='3'/><g transform='translate(14, 14) scale(0.72)'><polygon points='50,6 88,23 98,64 74,94 26,94 2,64 12,23' fill='none' stroke='%23326CE5' stroke-width='7'/><circle cx='50' cy='50' r='14' fill='%23326CE5'/><line x1='50' y1='14' x2='50' y2='36' stroke='%23326CE5' stroke-width='6'/><line x1='78' y1='28' x2='62' y2='42' stroke='%23326CE5' stroke-width='6'/><line x1='86' y1='62' x2='64' y2='54' stroke='%23326CE5' stroke-width='6'/><line x1='66' y1='86' x2='56' y2='64' stroke='%23326CE5' stroke-width='6'/><line x1='34' y1='86' x2='44' y2='64' stroke='%23326CE5' stroke-width='6'/><line x1='14' y1='62' x2='36' y2='54' stroke='%23326CE5' stroke-width='6'/><line x1='22' y1='28' x2='38' y2='42' stroke='%23326CE5' stroke-width='6'/></g></svg>",
    alt: "Kubernetes",
  },
];

export const GcpLogo = GcpCloudLogo;
export const AzureLogo = AzureBlockLogo;
export const KubernetesLogo = KubernetesWheelLogo;
export const OpenAiLogo = OpenAiRosetteLogo;
export const AnthropicLogo = AnthropicAiLogo;
export const BedrockLogo = BedrockGlyphLogo;
export const NvidiaLogo = NvidiaEyeLogo;
export const GitHubLogo = GitHubMarkLogo;
export const SnowflakeLogo = SnowflakeMarkLogo;
export const DatadogLogo = DatadogMarkLogo;

