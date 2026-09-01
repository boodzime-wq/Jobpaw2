// Notification Service (accessible + dismissible)

export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.setAttribute('role', 'status')
  notification.setAttribute('aria-live', 'polite')
  notification.innerHTML = `
    <div class="notification-content" style="display:flex;align-items:center;gap:10px;">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-text">${escapeHtml(message)}</span>
      <button class="notification-close" aria-label="Zamknij powiadomienie" style="background:transparent;border:none;color:inherit;font-size:1.1rem;cursor:pointer;margin-left:auto">✕</button>
    </div>
  `

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${getNotificationBg(type)};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideInRight 0.4s ease-out;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 10px;
  `

  // close handler
  const closeBtn = notification.querySelector('.notification-close')
  let removed = false
  function removeNotification() {
    if (removed) return
    removed = true
    notification.style.animation = 'slideOutRight 0.4s ease-out'
    setTimeout(() => notification.remove(), 400)
  }

  closeBtn.addEventListener('click', removeNotification)

  document.body.appendChild(notification)

  const timeout = setTimeout(removeNotification, duration)

  // Clear timeout if user hovers (optional UX)
  notification.addEventListener('mouseenter', () => clearTimeout(timeout))

  return notification
}

function getNotificationIcon(type) {
  const icons = {
    'success': '✓',
    'error': '✕',
    'warning': '⚠',
    'info': 'ℹ'
  }
  return icons[type] || '•'
}

function getNotificationBg(type) {
  const backgrounds = {
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#3b82f6'
  }
  return backgrounds[type] || '#6366f1'
}

export function showSuccess(message) { showNotification(message, 'success') }
export function showError(message) { showNotification(message, 'error') }
export function showWarning(message) { showNotification(message, 'warning') }
export function showInfo(message) { showNotification(message, 'info') }

// small helper used in template but keep it local-safe
function escapeHtml(text) {
  if (text === undefined || text === null) return ''
  const div = document.createElement('div')
  div.textContent = String(text)
  return div.innerHTML
}
