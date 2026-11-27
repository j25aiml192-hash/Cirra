import * as React from "react";
import { Cloud } from "lucide-react";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function AwsLogo({ size = 20, className = "", ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* High-visibility bold 'aws' lettering */}
      <text
        x="50"
        y="46"
        fontFamily="Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="#FFFFFF"
        textAnchor="middle"
        letterSpacing="-1.5"
      >
        aws
      </text>
      {/* Iconic Amazon bright orange smile arrow */}
      <path
        d="M20 62 C38 78, 62 78, 80 62"
        fill="none"
        stroke="#FF9900"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <polygon points="77,54 88,63 76,70" fill="#FF9900" />
    </svg>
  );
}

export function GcpLogo({ size = 20, className = "", ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.44-4 1.2l2.67 4.62c.49-.52.89-.68 1.33-.68 2.21 0 4 1.79 4 4 0 .34-.04.67-.13.98l4.48 2.59c.63-.82 1-1.84 1-2.95 0-2.64-2.05-4.78-4.65-4.96z"
        fill="#4285F4"
      />
      <path
        d="M12 4c-3.64 0-6.67 2.59-7.35 6.04-.52.04-1.02.16-1.5.34l3.18 5.51c.54-.54 1.28-.89 2.1-.89.28 0 .55.04.8.11L12 4z"
        fill="#EA4335"
      />
      <path
        d="M5.35 8.04C2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h6.5l-3.32-5.75A3.996 3.996 0 0 1 6 14c0-1.63.97-3.03 2.37-3.67L5.35 8.04z"
        fill="#FBBC05"
      />
      <path
        d="M12.5 20H19c2.76 0 5-2.24 5-5 0-1.57-.72-2.97-1.85-3.89l-4.47 2.58c.2.41.32.87.32 1.36 0 1.86-1.27 3.43-3 3.87V20z"
        fill="#34A853"
      />
    </svg>
  );
}

export function OpenAiLogo({ size = 20, className = "", ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.61a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .4-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.59a4.5 4.5 0 0 1-4.5 4.49zm-9.66-4.13a4.47 4.47 0 0 1-.53-3.01l.14.08 4.78 2.76a.77.77 0 0 0 .78 0l5.85-3.37v2.33a.08.08 0 0 1-.04.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.98V11.6c0 .28.15.54.39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.9zm16.6 3.85L13.1 8.38l2.02-1.17a.08.08 0 0 1 .07 0l4.83 2.8a4.5 4.5 0 0 1-.67 8.1v-5.68a.8.8 0 0 0-.41-.68zm2.01-3.02l-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.15.08-4.78 2.76a.8.8 0 0 0-.39.68zm1.1-2.36l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z"
        fill="#10A37F"
      />
    </svg>
  );
}

export function AnthropicLogo({ size = 20, className = "", ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Official Anthropic / Claude Signature Geometric Mark */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"
        fill="#D97757"
      />
    </svg>
  );
}

export function AzureLogo({ size = 20, className = "", ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M13.05 4.24l-5.3 9.42L3 17.52h5.18l2.97-5.46 4.73 7.7h5.12L13.05 4.24z" fill="#0078D4" />
      <path d="M13.4 12.56l2.36-4.21 4.72 8.41h-2.92l-4.16-4.2z" fill="#50E6FF" />
    </svg>
  );
}

export function GroqLogo({ size = 20, className = "", ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="24" height="24" rx="5" fill="#F55036" />
      <text
        x="12"
        y="14"
        fontFamily="Arial, system-ui, sans-serif"
        fontWeight="900"
        fontSize="14"
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        g
      </text>
    </svg>
  );
}

export function ProviderLogo({
  provider,
  name,
  size = 20,
  className = "",
}: {
  provider?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const p = (provider || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (p.includes("groq") || n.includes("groq")) {
    return <GroqLogo size={size} className={className} />;
  }
  if (p.includes("anthropic") || p.includes("claude") || n.includes("anthropic") || n.includes("claude")) {
    return <AnthropicLogo size={size} className={className} />;
  }
  if (p.includes("openai") || p.includes("gpt") || n.includes("openai") || n.includes("gpt")) {
    return <OpenAiLogo size={size} className={className} />;
  }
  if (
    p.includes("aws") ||
    p.includes("amazon") ||
    n.includes("aws") ||
    n.includes("amazon") ||
    n.includes("ec2") ||
    n.includes("rds") ||
    n.includes("s3") ||
    n.includes("cur")
  ) {
    return <AwsLogo size={size} className={className} />;
  }
  if (
    p.includes("gcp") ||
    p.includes("google") ||
    n.includes("gcp") ||
    n.includes("google") ||
    n.includes("bigquery") ||
    n.includes("cloud run")
  ) {
    return <GcpLogo size={size} className={className} />;
  }
  if (p.includes("azure") || p.includes("microsoft") || n.includes("azure")) {
    return <AzureLogo size={size} className={className} />;
  }

  return <Cloud className={className} style={{ width: size, height: size }} />;
}
