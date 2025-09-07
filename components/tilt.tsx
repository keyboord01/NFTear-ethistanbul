'use client'

import { useEffect, useRef } from 'react'

interface TiltProps {
  children: React.ReactNode
  className?: string
  maxTiltDeg?: number
  perspectivePx?: number
  scale?: number
}

export function Tilt({
  children,
  className,
  maxTiltDeg = 8,
  perspectivePx = 1000,
  scale = 1.02,
}: TiltProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const targetRot = useRef({ x: 0, y: 0 })
  const currentRot = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const hovering = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const animate = () => {
      currentRot.current.x = lerp(currentRot.current.x, targetRot.current.x, 0.12)
      currentRot.current.y = lerp(currentRot.current.y, targetRot.current.y, 0.12)
      el.style.transform = `perspective(${perspectivePx}px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg) scale(${hovering.current ? scale : 1})`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const rotX = (0.5 - py) * maxTiltDeg
      const rotY = (px - 0.5) * maxTiltDeg
      targetRot.current = { x: rotX, y: rotY }
    }

    const onEnter = () => {
      hovering.current = true
    }

    const onLeave = () => {
      hovering.current = false
      targetRot.current = { x: 0, y: 0 }
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.style.transform = ''
    }
  }, [maxTiltDeg, perspectivePx, scale])

  return (
    <div ref={containerRef} className={className} style={{ willChange: 'transform', transition: 'transform 180ms ease-out' }}>
      {children}
    </div>
  )
}


