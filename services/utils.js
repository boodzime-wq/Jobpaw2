// Utils shared across services

export function escapeHtml(text) {
  if (text === undefined || text === null) return ''
  const div = document.createElement('div')
  div.textContent = String(text)
  return div.innerHTML
}

export function truncateText(text, maxLength) {
  if (text === undefined || text === null) return ''
  const str = String(text)
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}
