export function safeNextPath(value: string | string[] | null | undefined) {
  const path = Array.isArray(value) ? value[0] : value
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/'
}
