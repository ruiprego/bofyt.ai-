import { BOFYT_FALLBACK_PATH } from '@/lib/bofyt/return-location'

// A bare "/" would replay the intro animation, so post-auth returns land on the restored home view instead.
export function safeNextPath(value: string | string[] | null | undefined) {
  const path = Array.isArray(value) ? value[0] : value
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path === '/') return BOFYT_FALLBACK_PATH
  return path
}
