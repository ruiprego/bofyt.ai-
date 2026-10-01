import { capabilityById, type CapabilityId } from './capabilities'
import { categoryById, type CategoryId } from './categories'

export type BofytReturnState =
  | { kind: 'home' }
  | { kind: 'capability'; capability: CapabilityId; overlay: boolean }
  | { kind: 'category'; category: CategoryId }

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>

const RETURN_ORIGIN = 'https://bofyt.internal'
export const BOFYT_FALLBACK_PATH = '/?view=home'

const isCapabilityId = (value: string | null): value is CapabilityId => Boolean(value && Object.hasOwn(capabilityById, value))
const isCategoryId = (value: string | null): value is CategoryId => Boolean(value && Object.hasOwn(categoryById, value))

function readParam(source: ParamSource, key: string) {
  if (source instanceof URLSearchParams) return source.get(key)
  const value = source[key]
  return typeof value === 'string' ? value : null
}

export function parseReturnState(source: ParamSource): BofytReturnState | null {
  const view = readParam(source, 'view')
  const id = readParam(source, 'id')

  if (view === 'home') return { kind: 'home' }
  if (view === 'capability' && isCapabilityId(id)) {
    return { kind: 'capability', capability: id, overlay: readParam(source, 'overlay') === '1' }
  }
  if (view === 'category' && isCategoryId(id)) return { kind: 'category', category: id }
  return null
}

export function returnStateToPath(state: BofytReturnState) {
  const params = new URLSearchParams({ view: state.kind })
  if (state.kind === 'capability') {
    params.set('id', state.capability)
    if (state.overlay) params.set('overlay', '1')
  } else if (state.kind === 'category') {
    params.set('id', state.category)
  }
  return `/?${params.toString()}`
}

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return BOFYT_FALLBACK_PATH

  try {
    const url = new URL(value, RETURN_ORIGIN)
    if (url.origin !== RETURN_ORIGIN || url.pathname !== '/') return BOFYT_FALLBACK_PATH
    const state = parseReturnState(url.searchParams)
    return state ? returnStateToPath(state) : BOFYT_FALLBACK_PATH
  } catch {
    return BOFYT_FALLBACK_PATH
  }
}

export function accountHrefFor(state: BofytReturnState) {
  return `/account?from=${encodeURIComponent(returnStateToPath(state))}`
}
