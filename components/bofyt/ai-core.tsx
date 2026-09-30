'use client'

import { useEffect, useId } from 'react'
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { cn } from '@/lib/utils'

export type CoreMode = 'idle' | 'typing' | 'selected' | 'activating'

const BASE_GLOW: Record<CoreMode, number> = {
  idle: 0.6,
  typing: 0.8,
  selected: 0.9,
  activating: 1,
}

interface AiCoreProps {
  mode: CoreMode
  energy: number
  typingTick: number
  pulseKey: number
  onActivate?: () => void
  particles?: boolean
  className?: string
}

export function AiCore({ mode, energy, typingTick, pulseKey, onActivate, particles = false, className }: AiCoreProps) {
  const reduceMotion = useReducedMotion()
  const gradientId = useId().replace(/:/g, '')

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 50, damping: 18 })
  const smoothY = useSpring(pointerY, { stiffness: 50, damping: 18 })

  const irisX = useTransform(smoothX, (v) => v * 7)
  const irisY = useTransform(smoothY, (v) => v * 5)
  const tiltY = useTransform(smoothX, (v) => v * 10)
  const tiltX = useTransform(smoothY, (v) => v * -8)

  const glow = useSpring(BASE_GLOW[mode], { stiffness: 40, damping: 16 })
  const pulse = useMotionValue(0)
  const intensity = useTransform([glow, pulse], ([g, p]: number[]) => Math.min(g + p, 1.4))

  const haloOpacity = useTransform(intensity, (v) => 0.25 + v * 0.55)
  const haloScale = useTransform(intensity, (v) => 0.9 + v * 0.18)
  const shadowBlur = useTransform(intensity, (v) => 6 + v * 22)
  const shadowAlpha = useTransform(intensity, (v) => 0.35 + v * 0.4)
  const eyeFilter = useMotionTemplate`drop-shadow(0 0 ${shadowBlur}px rgba(226, 184, 101, ${shadowAlpha}))`

  useEffect(() => {
    glow.set(BASE_GLOW[mode] + energy * 0.2)
  }, [mode, energy, glow])

  useEffect(() => {
    if (pulseKey === 0) return
    animate(pulse, [0.55, 0], { duration: 1.1, ease: [0.22, 1, 0.36, 1] })
  }, [pulseKey, pulse])

  useEffect(() => {
    if (typingTick === 0) return
    animate(pulse, [0.12, 0], { duration: 0.5, ease: 'easeOut' })
  }, [typingTick, pulse])

  useEffect(() => {
    if (reduceMotion) return
    const handleMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [pointerX, pointerY, reduceMotion])

  const spin = (duration: number, reverse = false) =>
    reduceMotion
      ? {}
      : {
          animate: { rotate: reverse ? -360 : 360 },
          transition: { duration: mode === 'activating' ? duration / 6 : duration, repeat: Infinity, ease: 'linear' as const },
        }

  return (
    <motion.button
      type="button"
      onClick={onActivate}
      aria-label="BOFYT AI Core. Activate to describe your goal"
      className={cn(
        'group relative isolate shrink-0 cursor-pointer rounded-full outline-none [perspective:900px] focus-visible:ring-2 focus-visible:ring-gold/60',
        className,
      )}
      whileTap={{ scale: 0.97 }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-[6%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(246,221,161,0.55)_0%,rgba(226,184,101,0.25)_35%,rgba(226,184,101,0)_70%)] blur-2xl"
        style={{ opacity: haloOpacity, scale: haloScale }}
      />
      <motion.span
        aria-hidden
        className="absolute inset-[18%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,240,205,0.35),transparent_65%)]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: reduceMotion ? 0 : 5, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
      />

      <motion.span
        aria-hidden
        className="absolute inset-0 block [transform-style:preserve-3d]"
        style={{ rotateX: tiltX, rotateY: tiltY }}
      >
        <motion.span className="absolute inset-0 block" {...spin(80)}>
          <svg viewBox="0 0 400 400" className="size-full overflow-visible">
            <ellipse cx="200" cy="200" rx="196" ry="70" transform="rotate(-18 200 200)" fill="none" stroke="rgba(226,184,101,0.35)" strokeWidth="0.8" strokeDasharray="2 6" />
            <circle cx="386" cy="140" r="7" fill={`url(#${gradientId}-sphere)`} />
          </svg>
        </motion.span>
        <motion.span className="absolute inset-0 block" {...spin(55, true)}>
          <svg viewBox="0 0 400 400" className="size-full overflow-visible">
            <ellipse cx="200" cy="200" rx="170" ry="120" transform="rotate(24 200 200)" fill="none" stroke="rgba(226,184,101,0.22)" strokeWidth="0.8" />
            <circle cx="52" cy="258" r="5" fill={`url(#${gradientId}-sphere)`} />
          </svg>
        </motion.span>
        <motion.span className="absolute inset-0 block" {...spin(120)}>
          <svg viewBox="0 0 400 400" className="size-full overflow-visible">
            <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(246,221,161,0.12)" strokeWidth="0.6" />
            <circle cx="200" cy="50" r="2.5" fill="#F6DDA1" />
          </svg>
        </motion.span>

        <motion.svg viewBox="0 0 400 400" className="absolute inset-0 size-full" style={{ filter: eyeFilter }}>
          <defs>
            <linearGradient id={`${gradientId}-gold`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBE7B5" />
              <stop offset="45%" stopColor="#E2B865" />
              <stop offset="100%" stopColor="#9A7130" />
            </linearGradient>
            <radialGradient id={`${gradientId}-iris`} cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="rgba(255,236,190,0.35)" />
              <stop offset="60%" stopColor="rgba(226,184,101,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id={`${gradientId}-sphere`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FBE7B5" />
              <stop offset="55%" stopColor="#8A6420" />
              <stop offset="100%" stopColor="#1a1208" />
            </radialGradient>
          </defs>

          <g transform="translate(200 200) scale(1.28) translate(-200 -200)">
          <path
            d="M 78 200 Q 200 96 322 200 Q 200 304 78 200 Z"
            fill="none"
            stroke={`url(#${gradientId}-gold)`}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          <motion.g style={{ x: irisX, y: irisY }}>
            <circle cx="200" cy="200" r="54" fill={`url(#${gradientId}-iris)`} />
            <circle cx="200" cy="200" r="54" fill="none" stroke={`url(#${gradientId}-gold)`} strokeWidth="1.6" />
            <g transform="rotate(180 200 201)">
              <path
                d="M 184 182 C 184 166 216 166 216 184 C 216 198 200 198 200 214"
                fill="none"
                stroke={`url(#${gradientId}-gold)`}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="200" cy="230" r="4.6" fill="#F6DDA1" />
            </g>
          </motion.g>
          </g>
        </motion.svg>
      </motion.span>

      {(particles || mode === 'activating') && (
        <CoreParticles fast={mode === 'activating'} reducedMotion={reduceMotion === true} />
      )}

      {mode === 'activating' && (
        <motion.span
          aria-hidden
          className="absolute inset-[22%] rounded-full border border-gold/70"
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 1.2, repeat: reduceMotion ? 0 : Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}

const PARTICLES = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2 + (index % 3) * 0.35
  const radius = 34 + (index % 4) * 4
  return {
    left: 50 + Math.cos(angle) * radius,
    top: 50 + Math.sin(angle) * radius * 0.8,
    size: index % 3 === 0 ? 3 : 2,
    delay: (index % 7) * 0.35,
    drift: index % 2 === 0 ? -10 : 10,
  }
})

function CoreParticles({ fast, reducedMotion }: { fast: boolean; reducedMotion: boolean }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {PARTICLES.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-gold-light shadow-[0_0_8px_rgba(246,221,161,0.9)]"
          style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: particle.size, height: particle.size }}
          animate={reducedMotion ? { opacity: 0 } : { opacity: [0, 0.9, 0], y: [0, particle.drift, particle.drift * 2], scale: [0.6, 1, 0.4] }}
          transition={{ duration: reducedMotion ? 0 : fast ? 1.4 : 3.6, delay: reducedMotion ? 0 : particle.delay * (fast ? 0.4 : 1), repeat: reducedMotion ? 0 : Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}
