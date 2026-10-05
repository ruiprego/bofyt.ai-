import { BriefcaseBusiness } from 'lucide-react'
import { Logo } from './logo'
import type { SheetKind } from './info-sheet'

interface BrandHeaderProps {
  progressCount: number
  onOpenSheet: (kind: SheetKind) => void
  onOpenCareer: () => void
}

export function BrandHeader({ progressCount, onOpenSheet, onOpenCareer }: BrandHeaderProps) {
  return (
    <header className="relative z-20 grid grid-cols-1 items-start px-6 pt-7 lg:grid-cols-[1fr_auto_1fr] lg:px-10 lg:pt-8">
      <p className="hidden border-l border-tech-cyan/35 pl-4 text-[10px] uppercase leading-[1.9] tracking-[0.35em] text-white/70 lg:block">
        A smarter you
        <br />a brighter tomorrow
        <span aria-hidden className="mt-3 block h-px w-4 bg-white/50" />
      </p>

      <div className="flex flex-col items-center text-center">
        <Logo className="text-[2.1rem] lg:text-5xl" />
        <p className="mt-3 text-[10px] uppercase tracking-[0.5em] text-white/70 lg:mt-4 lg:text-[11px]">
          Turn your goals into progress
        </p>
        <button
          type="button"
          onClick={onOpenCareer}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-tech-cyan/25 bg-tech-navy/60 px-5 text-[11px] font-medium uppercase tracking-[0.3em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-colors active:border-tech-cyan/60 active:text-white lg:hidden"
        >
          <BriefcaseBusiness aria-hidden className="size-4 text-tech-cyan" />
          Career
        </button>
      </div>

      <div className="hidden flex-col items-end gap-4 text-right lg:flex">
        <p className="text-[10px] uppercase leading-[1.9] tracking-[0.35em] text-white/80">
          Powered by
          <br />
          artificial intelligence
        </p>
        <nav aria-label="Account" className="flex gap-5 text-[11px] uppercase tracking-[0.25em]">
          <button type="button" onClick={onOpenCareer} className="text-tech-cyan/85 transition-colors hover:text-tech-cyan">
            Career
          </button>
          <button type="button" onClick={() => onOpenSheet('progress')} className="text-white/55 transition-colors hover:text-gold-light">
            Progress{progressCount > 0 && <span className="ml-1.5 text-gold">{progressCount}</span>}
          </button>
          <button type="button" onClick={() => onOpenSheet('profile')} className="text-white/55 transition-colors hover:text-gold-light">
            Profile
          </button>
        </nav>
      </div>
    </header>
  )
}
