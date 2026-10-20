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
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] font-sans selection:bg-[#0066cc] selection:text-[#ffffff] flex flex-col">
      {/* 1. Global Navigation (44px, Pure Black #000000) */}
      <AppleGlobalNav />

      {/* 2. Alternating Full-Bleed Product Tiles */}
      <main className="flex-1">
        {/* Tile 1: Pure White Canvas Hero Tile */}
        <HeroTile />

        {/* Tile 2: Near-Black Tile 1 (#272729) Sentinel Anomaly Detection */}
        <SentinelTile />

        {/* Tile 3: Signature Parchment (#f5f5f7) Action Center */}
        <ActionCenterTile />

        {/* Tile 4: Near-Black Tile 2 (#2a2a2c) Audited Savings Ledger */}
        <SavingsLedgerTile />

        {/* Tile 5: Pure White Canvas Utility Grid (Connectors & Hyperscalers) */}
        <ConnectorsGrid />

        {/* Tile 6: Signature Parchment (#f5f5f7) Ask Cirra */}
        <AppleAskCirraTile />

        {/* Tile 7: Near-Black Tile 3 (#252527) Technical Specs */}
        <SpecsTile />

        {/* Tile 8: Pure White Canvas Free Cost Audit Pill Bar */}
        <AppleAuditTile />

        {/* Tile 9: Signature Parchment (#f5f5f7) Frequently Asked Questions */}
        <AppleFaqTile />
      </main>

      {/* 4. Apple Dense Footer */}
      <AppleFooter />
    </div>
  );
}
