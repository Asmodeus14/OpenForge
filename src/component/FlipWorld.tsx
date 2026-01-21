"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface FlipWordProps {
  englishText: string
  japaneseText: string
}

export default function FlipWord({ englishText, japaneseText }: FlipWordProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const englishSpan = container.querySelector("[data-english]") as HTMLElement
    const japaneseSpan = container.querySelector("[data-japanese]") as HTMLElement

    // Create loop animation
    const timeline = gsap.timeline({ repeat: -1 })

    // Show English for 2 seconds
    timeline.to(englishSpan, { duration: 0, opacity: 1 })
    timeline.to(japaneseSpan, { duration: 0, opacity: 0 }, "<")
    timeline.to({}, { duration: 2 }) // Hold for 2 seconds

    // Flip to Japanese
    timeline.to(
      englishSpan,
      {
        rotationX: 90,
        duration: 0.6,
        ease: "power2.inOut",
      },
      "<",
    )
    timeline.to(
      japaneseSpan,
      {
        rotationX: 0,
        duration: 0.6,
        ease: "power2.inOut",
        opacity: 1,
      },
      "<",
    )

    // Hold Japanese for 2 seconds
    timeline.to({}, { duration: 2 })

    // Flip back to English
    timeline.to(
      japaneseSpan,
      {
        rotationX: -90,
        duration: 0.6,
        ease: "power2.inOut",
      },
      "<",
    )
    timeline.to(
      englishSpan,
      {
        rotationX: 0,
        duration: 0.6,
        ease: "power2.inOut",
        opacity: 1,
      },
      "<",
    )
  }, [])

  return (
    <div ref={containerRef} className="inline-block relative" style={{ perspective: "1000px" }}>
      <span
        data-english
        className="inline-block bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent"
        style={{
          transformStyle: "preserve-3d",
          opacity: 1,
        }}
      >
        {englishText}
      </span>
      <span
        data-japanese
        className="absolute inset-0 inline-block bg-gradient-to-r from-purple-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent"
        style={{
          transformStyle: "preserve-3d",
          opacity: 0,
        }}
      >
        {japaneseText}
      </span>
    </div>
  )
}
