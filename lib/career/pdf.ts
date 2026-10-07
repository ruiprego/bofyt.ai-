import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import type { CareerProfile, CvDocument } from './types'

const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = 48
const CONTENT_WIDTH = PAGE.width - MARGIN * 2
const INK = rgb(0.08, 0.09, 0.11)
const MUTED = rgb(0.38, 0.4, 0.45)
const ACCENT = rgb(0.6, 0.44, 0.19)
const RULE = rgb(0.86, 0.84, 0.8)

const REPLACEMENTS: Record<string, string> = {
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2015': '-', '\u2212': '-',
  '\u2192': '->', '\u2190': '<-', '\u2022': '\u2022', '\u00a0': ' ', '\u200b': '',
}
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''))

export function toPdfSafe(value: string) {
  return Array.from(value.replace(/\r/g, ''))
    .map((char) => {
      if (char in REPLACEMENTS) return REPLACEMENTS[char]
      const code = char.charCodeAt(0)
      if (char === '\n' || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(char)) return char
      return ''
    })
    .join('')
}

class Writer {
  page: PDFPage
  y = PAGE.height - MARGIN

  constructor(
    private doc: PDFDocument,
    public regular: PDFFont,
    public bold: PDFFont,
  ) {
    this.page = doc.addPage([PAGE.width, PAGE.height])
  }

  ensure(height: number) {
    if (this.y - height >= MARGIN) return
    this.page = this.doc.addPage([PAGE.width, PAGE.height])
    this.y = PAGE.height - MARGIN
  }

  wrap(text: string, font: PDFFont, size: number, width: number) {
    const lines: string[] = []
    for (const paragraph of toPdfSafe(text).split('\n')) {
      let line = ''
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate
        else {
          lines.push(line)
          line = word
        }
      }
      lines.push(line)
    }
    return lines
  }

  text(text: string, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const { font = this.regular, size = 10, color = INK, indent = 0, gap = 2 } = options
    const lineHeight = size * 1.4
    for (const line of this.wrap(text, font, size, CONTENT_WIDTH - indent)) {
      this.ensure(lineHeight)
      this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color })
      this.y -= lineHeight
    }
    this.y -= gap
  }

  row(left: string, right: string, size = 10.5) {
    this.ensure(size * 1.5)
    const safeRight = toPdfSafe(right)
    const rightWidth = this.regular.widthOfTextAtSize(safeRight, size - 1)
    const leftLines = this.wrap(left, this.bold, size, CONTENT_WIDTH - rightWidth - 12)
    this.page.drawText(leftLines[0] ?? '', { x: MARGIN, y: this.y - size, size, font: this.bold, color: INK })
    if (safeRight) this.page.drawText(safeRight, { x: MARGIN + CONTENT_WIDTH - rightWidth, y: this.y - size, size: size - 1, font: this.regular, color: MUTED })
    this.y -= size * 1.45
    for (const extra of leftLines.slice(1)) this.text(extra, { font: this.bold, size, gap: 0 })
  }

  section(title: string) {
    this.y -= 8
    this.ensure(30)
    this.page.drawText(toPdfSafe(title.toUpperCase()), { x: MARGIN, y: this.y - 9, size: 9, font: this.bold, color: ACCENT })
    this.y -= 15
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + CONTENT_WIDTH, y: this.y }, thickness: 0.6, color: RULE })
    this.y -= 9
  }
}

export async function renderCvPdf(cv: CvDocument, profile: Pick<CareerProfile, 'fullName' | 'email' | 'phone' | 'location' | 'website' | 'github' | 'linkedin'>) {
  const doc = await PDFDocument.create()
  doc.setTitle(toPdfSafe(`${profile.fullName || 'Candidate'} — CV`))
  doc.setAuthor(toPdfSafe(profile.fullName))
  doc.setCreator('BOFYT')
  const writer = new Writer(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold))

  writer.text(profile.fullName || 'Your name', { font: writer.bold, size: 22, gap: 2 })
  if (cv.headline) writer.text(cv.headline, { size: 11.5, color: ACCENT, gap: 4 })
  const contact = [profile.email, profile.phone, profile.location].filter(Boolean).join('   ·   ')
  if (contact) writer.text(contact, { size: 9, color: MUTED, gap: 0 })
  const links = [profile.website, profile.linkedin, profile.github].filter(Boolean).join('   ·   ')
  if (links) writer.text(links, { size: 9, color: MUTED, gap: 0 })

  if (cv.summary) {
    writer.section('Profile')
    writer.text(cv.summary, { size: 10 })
  }
  if (cv.skills.length) {
    writer.section('Skills')
    writer.text(cv.skills.join('  ·  '), { size: 10 })
  }
  if (cv.experience.length) {
    writer.section('Experience')
    for (const entry of cv.experience) {
      writer.row([entry.title, entry.company].filter(Boolean).join(' — '), entry.period)
      if (entry.location) writer.text(entry.location, { size: 9, color: MUTED, gap: 1 })
      for (const bullet of entry.bullets) writer.text(`•  ${bullet}`, { size: 10, indent: 6, gap: 1 })
      writer.y -= 5
    }
  }
  if (cv.projects.length) {
    writer.section('Projects')
    for (const project of cv.projects) {
      writer.row(project.name, project.url.replace(/^https?:\/\//, ''))
      if (project.description) writer.text(project.description, { size: 10, gap: 5 })
    }
  }
  if (cv.education.length) {
    writer.section('Education')
    for (const entry of cv.education) {
      writer.row(entry.degree || entry.school, entry.period)
      if (entry.degree && entry.school) writer.text(entry.school, { size: 9.5, color: MUTED, gap: 4 })
    }
  }
  if (cv.languages.length) {
    writer.section('Languages')
    writer.text(cv.languages.join('  ·  '), { size: 10 })
  }

  return doc.save()
}

export function cvFileName(fullName: string) {
  const base = toPdfSafe(fullName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return `${base || 'BOFYT'}_CV.pdf`
}
