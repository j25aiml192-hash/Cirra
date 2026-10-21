import { AppleGlobalNav } from "@/components/landing/AppleGlobalNav";
import { HeroTile } from "@/components/landing/HeroTile";
import { SentinelTile } from "@/components/landing/SentinelTile";
import { ActionCenterTile } from "@/components/landing/ActionCenterTile";
import { SavingsLedgerTile } from "@/components/landing/SavingsLedgerTile";
import { ConnectorsGrid } from "@/components/landing/ConnectorsGrid";
import { AppleAskCirraTile } from "@/components/landing/AppleAskCirraTile";
import { SpecsTile } from "@/components/landing/SpecsTile";
import { AppleAuditTile } from "@/components/landing/AppleAuditTile";
import { AppleFaqTile } from "@/components/landing/AppleFaqTile";
import { AppleFooter } from "@/components/landing/AppleFooter";

export default function HomePage() {
  return (
    <div className="cirra-bg-canvas min-h-screen text-[#0A192F] font-sans selection:bg-[#0062E0] selection:text-white flex flex-col">
      <AppleGlobalNav />

      {/* 2. Alternating Full-Bleed Product Tiles */}
      <main className="flex-1">
        <HeroTile />

        <SentinelTile />

        <ActionCenterTile />

        <SavingsLedgerTile />

        <ConnectorsGrid />

        <AppleAskCirraTile />

        <SpecsTile />

        <AppleAuditTile />

        <AppleFaqTile />
      </main>

      <AppleFooter />
    </div>
  );
}
