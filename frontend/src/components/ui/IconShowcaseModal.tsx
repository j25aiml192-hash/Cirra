"use client";

import * as React from "react";
import {
  ChalkBagIcon,
  ChalkCalendarIcon,
  ChalkMusicIcon,
  ChalkOuroborosIcon,
  ChalkStarIcon,
  ChalkPawIcon,
  ChalkCloudIcon,
  ChalkAiChipIcon,
  ChalkShieldIcon,
  ChalkAnomalyIcon,
  ChalkFlameIcon,
  ChalkKeyIcon,
  ChalkProcessIcon,
  ChalkTrendIcon,
  ChalkRobotIcon,
  ChalkChartIcon,
  ChalkWalletIcon,
  ChalkSparklesIcon,
  ChalkLayersIcon,
  ChalkReceiptIcon,
  ChalkCheckCircleIcon,
  ChalkClockIcon,
  ChalkPhoneIcon,
  ChalkSettingsIcon,
  ChalkTagIcon,
  ChalkChatIcon,
  ChalkFlagIcon,
  ChalkUserIcon,
  ChalkSunIcon,
} from "./chalk-icons";
import {
  DuotoneChatIcon,
  DuotoneTagIcon,
  DuotoneFlagIcon,
  DuotoneUserAdminIcon,
  DuotoneWalletIcon,
  DuotoneGlobeIcon,
  DuotoneHouseIcon,
  DuotonePhoneCallIcon,
  DuotoneCloudIcon,
  DuotoneAiChipIcon,
  DuotoneShieldIcon,
  DuotoneSparklesIcon,
  DuotoneRobotIcon,
  DuotoneAnomalyIcon,
  DuotoneSavingsIcon,
  DuotoneFlameIcon,
  DuotoneKeyIcon,
  DuotoneKeyAlertIcon,
  DuotoneProcessIcon,
  DuotoneTrendIcon,
} from "./duotone-icons";
import {
  CartIcon,
  BagIcon,
  DiscountStampIcon,
  PriceTagsIcon,
  StorefrontIcon,
  CreditCardIcon,
  CardSwipeIcon,
  ReceiptIcon,
  PackageIcon,
  PackageCheckIcon,
  PackageClockIcon,
  PackageReturnIcon,
  WalletIcon,
  BarcodeScannerIcon,
  LockKeypadIcon,
  StarBubbleIcon,
  ChatMessagesIcon,
  BarChartGrowthIcon,
  DollyCartIcon,
  WishlistIcon,
  CloudIcon,
  AiChipIcon,
  ShieldSecurityIcon,
  AnomalyTriangleIcon,
  SparklesAiIcon,
  UserRoundedIcon,
  SearchRoundedIcon,
  MailRoundedIcon,
  EyeRoundedIcon,
  CheckCircleRoundedIcon,
  SettingsCogIcon,
  KeyRoundedIcon,
  PhoneRoundedIcon,
  LayersRoundedIcon,
  RobotBotIcon,
  FlameFireIcon,
  KeyAlertIcon,
  ProcessLoopIcon,
  TrendSpikeIcon,
  GlobeCheckIcon,
  FlagIcon,
  HomeIcon,
  UserAdminIcon,
  PhoneCallBubbleIcon,
} from "./cirra-icons";

export function IconShowcaseModal() {
  const [open, setOpen] = React.useState(false);
  const [copiedName, setCopiedName] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"chalk" | "duotone" | "monoline">("chalk");

  const chalkList = [
    { name: "ChalkBagIcon", comp: ChalkBagIcon, label: "Bag (Reference #1)" },
    { name: "ChalkCalendarIcon", comp: ChalkCalendarIcon, label: "Calendar (Reference #2)" },
    { name: "ChalkMusicIcon", comp: ChalkMusicIcon, label: "Music (Reference #3)" },
    { name: "ChalkOuroborosIcon", comp: ChalkOuroborosIcon, label: "Ouroboros (Reference #4)" },
    { name: "ChalkStarIcon", comp: ChalkStarIcon, label: "Star (Reference #5)" },
    { name: "ChalkPawIcon", comp: ChalkPawIcon, label: "Paw Print (Reference #6)" },
    { name: "ChalkCloudIcon", comp: ChalkCloudIcon, label: "Cloud Spend" },
    { name: "ChalkAiChipIcon", comp: ChalkAiChipIcon, label: "AI Foundation Models" },
    { name: "ChalkShieldIcon", comp: ChalkShieldIcon, label: "Attribution Shield" },
    { name: "ChalkAnomalyIcon", comp: ChalkAnomalyIcon, label: "Spend Anomaly" },
    { name: "ChalkFlameIcon", comp: ChalkFlameIcon, label: "Live Scenario Flame" },
    { name: "ChalkKeyIcon", comp: ChalkKeyIcon, label: "AI API Key" },
    { name: "ChalkProcessIcon", comp: ChalkProcessIcon, label: "Runaway Loop" },
    { name: "ChalkTrendIcon", comp: ChalkTrendIcon, label: "Bill Surge Spike" },
    { name: "ChalkRobotIcon", comp: ChalkRobotIcon, label: "Bot Head" },
    { name: "ChalkChartIcon", comp: ChalkChartIcon, label: "Growth Chart" },
    { name: "ChalkWalletIcon", comp: ChalkWalletIcon, label: "Savings Wallet" },
    { name: "ChalkSparklesIcon", comp: ChalkSparklesIcon, label: "Ask Cirra Sparkles" },
    { name: "ChalkLayersIcon", comp: ChalkLayersIcon, label: "Allocation Layers" },
    { name: "ChalkReceiptIcon", comp: ChalkReceiptIcon, label: "Receipt Document" },
    { name: "ChalkCheckCircleIcon", comp: ChalkCheckCircleIcon, label: "Auto-Dismissed" },
    { name: "ChalkClockIcon", comp: ChalkClockIcon, label: "Resolution Time" },
    { name: "ChalkPhoneIcon", comp: ChalkPhoneIcon, label: "Voice Calls" },
    { name: "ChalkSettingsIcon", comp: ChalkSettingsIcon, label: "Settings Gear" },
    { name: "ChalkTagIcon", comp: ChalkTagIcon, label: "Cost Allocation Tag" },
    { name: "ChalkChatIcon", comp: ChalkChatIcon, label: "Chat Conversation" },
    { name: "ChalkFlagIcon", comp: ChalkFlagIcon, label: "Milestone Flag" },
    { name: "ChalkUserIcon", comp: ChalkUserIcon, label: "User Account" },
    { name: "ChalkSunIcon", comp: ChalkSunIcon, label: "Theme Light/Dark" },
  ];

  const duotoneList = [
    { name: "DuotoneChatIcon", comp: DuotoneChatIcon, label: "Chat Bubbles" },
    { name: "DuotoneTagIcon", comp: DuotoneTagIcon, label: "Price Tag" },
    { name: "DuotoneFlagIcon", comp: DuotoneFlagIcon, label: "Flag" },
    { name: "DuotoneUserAdminIcon", comp: DuotoneUserAdminIcon, label: "User Admin" },
    { name: "DuotoneWalletIcon", comp: DuotoneWalletIcon, label: "Wallet" },
    { name: "DuotoneGlobeIcon", comp: DuotoneGlobeIcon, label: "Globe & Check" },
    { name: "DuotoneHouseIcon", comp: DuotoneHouseIcon, label: "Home" },
    { name: "DuotonePhoneCallIcon", comp: DuotonePhoneCallIcon, label: "Phone Call" },
    { name: "DuotoneCloudIcon", comp: DuotoneCloudIcon, label: "Cloud Spend" },
    { name: "DuotoneAiChipIcon", comp: DuotoneAiChipIcon, label: "AI Chip" },
    { name: "DuotoneShieldIcon", comp: DuotoneShieldIcon, label: "Security Shield" },
    { name: "DuotoneSparklesIcon", comp: DuotoneSparklesIcon, label: "AI Sparkles" },
    { name: "DuotoneRobotIcon", comp: DuotoneRobotIcon, label: "Robot Bot" },
    { name: "DuotoneAnomalyIcon", comp: DuotoneAnomalyIcon, label: "Anomaly Alert" },
    { name: "DuotoneSavingsIcon", comp: DuotoneSavingsIcon, label: "Savings Growth" },
    { name: "DuotoneFlameIcon", comp: DuotoneFlameIcon, label: "Live Scenario Flame" },
    { name: "DuotoneKeyAlertIcon", comp: DuotoneKeyAlertIcon, label: "Leaked Key Alert" },
    { name: "DuotoneProcessIcon", comp: DuotoneProcessIcon, label: "Runaway Process" },
    { name: "DuotoneTrendIcon", comp: DuotoneTrendIcon, label: "Bill Spike Trend" },
    { name: "DuotoneKeyIcon", comp: DuotoneKeyIcon, label: "API Key" },
  ];

  const monolineList = [
    { name: "RobotBotIcon", comp: RobotBotIcon, label: "Robot Head" },
    { name: "FlameFireIcon", comp: FlameFireIcon, label: "Live Flame" },
    { name: "KeyAlertIcon", comp: KeyAlertIcon, label: "Leaked Key" },
    { name: "ProcessLoopIcon", comp: ProcessLoopIcon, label: "Runaway Loop" },
    { name: "TrendSpikeIcon", comp: TrendSpikeIcon, label: "Bill Spike" },
    { name: "CartIcon", comp: CartIcon, label: "Shopping Cart" },
    { name: "BagIcon", comp: BagIcon, label: "Shopping Bag" },
    { name: "DiscountStampIcon", comp: DiscountStampIcon, label: "Discount Stamp" },
    { name: "PriceTagsIcon", comp: PriceTagsIcon, label: "Price Tags" },
    { name: "StorefrontIcon", comp: StorefrontIcon, label: "Storefront" },
    { name: "CreditCardIcon", comp: CreditCardIcon, label: "Credit Card" },
    { name: "CardSwipeIcon", comp: CardSwipeIcon, label: "Card Swipe" },
    { name: "ReceiptIcon", comp: ReceiptIcon, label: "Receipt" },
    { name: "PackageIcon", comp: PackageIcon, label: "Package" },
    { name: "PackageCheckIcon", comp: PackageCheckIcon, label: "Delivered" },
    { name: "PackageClockIcon", comp: PackageClockIcon, label: "Scheduled" },
    { name: "PackageReturnIcon", comp: PackageReturnIcon, label: "Return" },
    { name: "WalletIcon", comp: WalletIcon, label: "Wallet" },
    { name: "BarcodeScannerIcon", comp: BarcodeScannerIcon, label: "Scanner" },
    { name: "LockKeypadIcon", comp: LockKeypadIcon, label: "Vault Lock" },
    { name: "StarBubbleIcon", comp: StarBubbleIcon, label: "Star Review" },
    { name: "ChatMessagesIcon", comp: ChatMessagesIcon, label: "Chat Message" },
    { name: "BarChartGrowthIcon", comp: BarChartGrowthIcon, label: "Growth Chart" },
    { name: "DollyCartIcon", comp: DollyCartIcon, label: "Dolly Trolley" },
    { name: "WishlistIcon", comp: WishlistIcon, label: "Wishlist" },
    { name: "CloudIcon", comp: CloudIcon, label: "Cloud" },
    { name: "AiChipIcon", comp: AiChipIcon, label: "AI Chip" },
    { name: "ShieldSecurityIcon", comp: ShieldSecurityIcon, label: "Shield" },
    { name: "AnomalyTriangleIcon", comp: AnomalyTriangleIcon, label: "Anomaly" },
    { name: "SparklesAiIcon", comp: SparklesAiIcon, label: "Sparkles" },
    { name: "UserRoundedIcon", comp: UserRoundedIcon, label: "User" },
    { name: "SearchRoundedIcon", comp: SearchRoundedIcon, label: "Search" },
    { name: "MailRoundedIcon", comp: MailRoundedIcon, label: "Mail" },
    { name: "EyeRoundedIcon", comp: EyeRoundedIcon, label: "Eye" },
    { name: "CheckCircleRoundedIcon", comp: CheckCircleRoundedIcon, label: "Check Circle" },
    { name: "SettingsCogIcon", comp: SettingsCogIcon, label: "Settings" },
    { name: "KeyRoundedIcon", comp: KeyRoundedIcon, label: "Key" },
    { name: "PhoneRoundedIcon", comp: PhoneRoundedIcon, label: "Phone" },
    { name: "LayersRoundedIcon", comp: LayersRoundedIcon, label: "Layers" },
    { name: "GlobeCheckIcon", comp: GlobeCheckIcon, label: "Globe Check" },
    { name: "FlagIcon", comp: FlagIcon, label: "Flag" },
    { name: "HomeIcon", comp: HomeIcon, label: "Home" },
    { name: "UserAdminIcon", comp: UserAdminIcon, label: "Admin" },
    { name: "PhoneCallBubbleIcon", comp: PhoneCallBubbleIcon, label: "Call Bubble" },
  ];

  const handleCopy = (name: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(`<${name} size={24} />`);
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 1800);
    }
  };

  return (
    <>
      {/* Floating Trigger Button on bottom left */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-[#D6E4F5] text-xs font-bold text-slate-800 shadow-lg hover:shadow-xl hover:border-blue-400 hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        title="Open Icon Kit Gallery"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-500 via-yellow-400 to-lime-400" />
        <span>Icon Kit ({tab === "duotone" ? "Duotone Pop" : "Monoline"})</span>
      </button>

      {/* Modal Backdrop & Dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl border border-[#D6E4F5] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-pink-500 via-yellow-400 to-lime-400" />
                  Cirra Custom Icon Kit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click any icon card to copy its React JSX tag (`&lt;IconName size=&#123;24&#125; /&gt;`)
                </p>
              </div>

              {/* Style Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTab("duotone")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tab === "duotone"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Duotone Pop (Colors)
                </button>
                <button
                  type="button"
                  onClick={() => setTab("monoline")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tab === "monoline"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monoline (Slate / Grey)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Icons Grid Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)]">
              {tab === "duotone" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {duotoneList.map((item) => {
                    const Icon = item.comp;
                    const isCopied = copiedName === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleCopy(item.name)}
                        className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between gap-3 transition-all cursor-pointer group ${
                          isCopied
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                            : "border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-blue-400 hover:shadow-md"
                        }`}
                      >
                        <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon size={40} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 tracking-tight">
                            {item.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {isCopied ? "✓ Copied!" : item.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {monolineList.map((item) => {
                    const Icon = item.comp;
                    const isCopied = copiedName === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleCopy(item.name)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-2.5 transition-all cursor-pointer group ${
                          isCopied
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                            : "border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-blue-400 hover:shadow-md"
                        }`}
                      >
                        <div className="w-9 h-9 flex items-center justify-center text-slate-700 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                          <Icon size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800 tracking-tight">
                            {item.label}
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5 truncate max-w-[100px]">
                            {isCopied ? "✓ Copied!" : item.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default IconShowcaseModal;

