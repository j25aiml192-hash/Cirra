import { AuroraBackground } from "@/components/ui/aurora-background";

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground
      variant="sunset"
      className="flex h-[400px] w-full items-center justify-center rounded-xl"
      childrenClassName="flex flex-col items-center justify-center gap-4 text-center px-6"
    >
      <h1 className="text-4xl font-bold text-white drop-shadow-lg md:text-6xl">
        Aurora Background
      </h1>
      <p className="max-w-md text-lg text-white/80">
        A living, animated canvas backdrop with multiple color variants.
      </p>
    </AuroraBackground>
  );
}
