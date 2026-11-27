"use client"

import * as React from "react"
import { ThinkingPill } from "@/components/ui/thinking-pill"

const COOL = ["#0b5f8a", "#139fb8", "#2f7cf2", "#5a4cf0", "#3b1fa8"]
const WARM = ["#b8401a", "#d9792a", "#e0a640", "#d2507a", "#8a1f6e"]

// The layout is drawn for a fixed box and every size is multiplied by one scale, so the pills
// stay sharp and nothing spills past the frame.
const WIDE = { w: 640, h: 360 }
const TALL = { w: 340, h: 600 }

function measure() {
  if (typeof window === "undefined") return { scale: 1, tall: false }
  const tall = window.innerHeight > window.innerWidth * 1.2
  const box = tall ? TALL : WIDE
  const scale = Math.max(0.55, Math.min(window.innerWidth / box.w, window.innerHeight / box.h, 1.8))
  return { tall, scale: Math.round(scale * 20) / 20 }
}

// Measured before the first paint, and the pills are keyed by size below, so a new size mounts a
// fresh pill instead of resizing a running one.
function useFit() {
  const [fit, setFit] = React.useState(measure)
  React.useEffect(() => {
    const update = () => setFit((old) => {
      const next = measure()
      return next.scale === old.scale && next.tall === old.tall ? old : next
    })
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return fit
}

/**
 * The states of an assistant, all the same component: the default aurora with a pause switch,
 * then a cool fast "Searching", a warm slow "Writing" and a resting "Done". Every difference is a prop.
 */
export default function ThinkingPillDemo() {
  const { scale, tall } = useFit()
  const s = (n: number) => Math.round(n * scale)
  const [active, setActive] = React.useState(true)

  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: s(14) }}>
        <ThinkingPill key={`main-${s(330)}-${tall}`} width={s(tall ? 300 : 330)} active={active} />

        <button
          type="button"
          onClick={() => setActive((a) => !a)}
          aria-pressed={!active}
          className="rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ marginTop: s(18), padding: "0.45em 1.2em", fontSize: "0.93em", fontWeight: 500 }}
        >
          {active ? "Pause" : "Resume"}
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: tall ? "column" : "row",
            alignItems: "center",
            gap: s(tall ? 16 : 18),
            marginTop: s(tall ? 40 : 44),
          }}
        >
          <ThinkingPill key={`Searching-${s(180)}`} width={s(180)} label="Searching" colors={COOL} speed={1.6} />
          <ThinkingPill key={`Writing-${s(180)}`} width={s(180)} label="Writing" colors={WARM} speed={0.7} />
          <ThinkingPill key={`Done-${s(180)}`} width={s(180)} label="Done" active={false} dots={false} shimmer={false} />
        </div>
      </div>
    </main>
  )
}
