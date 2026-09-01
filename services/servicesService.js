// Services & Gigs Service - Handle service data loading and display

import { escapeHtml, truncateText } from './utils.js'
import { showSuccess } from './notificationService.js'

export async function loadServices() {
  return getDemoServices()
}

// Display services on page
export function displayServices(services, containerId = '#servicesList') {
  const container = document.querySelector(containerId)
  if (!container) return
  
  if (services.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <p>🔍 Nie znaleziono usług</p>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Spróbuj zmienić filtry lub wyszukiwanie</p>
      </div>
    `
    return
  }
  
  container.innerHTML = services.map((service, index) => createServiceCard(service, index)).join('')
  
  // Initialize favorited state from localStorage
  const favRaw = JSON.parse(localStorage.getItem('serviceFavorites') || '[]')
  const favorites = Array.isArray(favRaw) ? favRaw.map(n => Number(n)) : []

  container.querySelectorAll('.btn-service-favorite').forEach(btn => {
    const id = Number(btn.dataset.serviceId)
    if (favorites.includes(id)) {
      btn.classList.add('favorited')
      const icon = btn.querySelector('.heart-icon')
      if (icon) icon.textContent = '❤️'
    }
    btn.addEventListener('click', toggleServiceFavorite)
  })
  
  container.querySelectorAll('.btn-service-contact').forEach(btn => {
    btn.addEventListener('click', handleServiceContact)
  })
}

// Create individual service card HTML
function createServiceCard(service, index) {
  const animationDelay = index * 0.08
  const ratingStars = createRatingStars(service.rating)
  
  return `
    <div class="service-card" style="animation-delay: ${animationDelay}s;">
      <div class="service-header">
        <div class="service-avatar">${service.avatar}</div>
        <div class="service-info-header">
          <h3 class="service-title">${escapeHtml(service.title)}</h3>
          <p class="service-provider">${escapeHtml(service.provider)}</p>
          <div class="service-rating">
            <span class="rating-stars">${ratingStars}</span>
            <span class="rating-count">(${service.reviews} opinii)</span>
          </div>
        </div>
        <button class="btn-service-favorite" data-service-id="${service.id}" title="Dodaj do ulubionych">
          <span class="heart-icon">♡</span>
        </button>
      </div>
      
      <p class="service-description">${truncateText(escapeHtml(service.description), 120)}</p>
      
      <div class="service-meta">
        <span class="service-type">${escapeHtml(service.type)}</span>
        <span class="service-location">📍 ${escapeHtml(service.location)}</span>
      </div>
      
      <div class="service-footer">
        <div class="service-price">${service.price} zł / ${service.unit}</div>
        <button class="btn-service-contact" data-service-id="${service.id}" data-service-title="${escapeHtml(service.title)}">
          💬 Skontaktuj się
        </button>
      </div>
    </div>
  `
}

// Create rating stars (round to nearest half)
function createRatingStars(rating) {
  if (typeof rating !== 'number') rating = Number(rating) || 0
  const rounded = Math.round(rating * 2) / 2
  const fullStars = Math.floor(rounded)
  const hasHalf = rounded % 1 !== 0
  let stars = ''

  for (let i = 0; i < fullStars; i++) stars += '★'
  if (hasHalf) stars += '⯨'
  for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) stars += '☆'

  return `<span aria-label="Ocena: ${rounded} na 5" title="${rounded} / 5">${stars}</span>`
}

// Toggle service favorite
function toggleServiceFavorite(e) {
  e.preventDefault()
  const button = e.currentTarget
  const serviceId = Number(button.dataset.serviceId)
  
  button.classList.toggle('favorited')
  const icon = button.querySelector('.heart-icon')
  if (icon) icon.textContent = button.classList.contains('favorited') ? '❤️' : '♡'
  
  // Save to localStorage as numbers
  const raw = JSON.parse(localStorage.getItem('serviceFavorites') || '[]')
  const favorites = Array.isArray(raw) ? raw.map(n => Number(n)) : []
  if (button.classList.contains('favorited')) {
    if (!favorites.includes(serviceId)) {
      favorites.push(serviceId)
    }
  } else {
    const index = favorites.indexOf(serviceId)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  localStorage.setItem('serviceFavorites', JSON.stringify(favorites))
}

// Handle service contact
function handleServiceContact(e) {
  e.preventDefault()
  const serviceTitle = e.currentTarget.dataset.serviceTitle
  showSuccess(`Dziękujemy! Wysłaliśmy zapytanie dotyczące usługi "${serviceTitle}". Pracodawca skontaktuje się z Tobą wkrótce.`)
}

// Demo services data
function getDemoServices() {
  return [
    { id: 1, title: 'Korepetycje z matematyki', provider: 'Anna Kowalska', type: 'Korepetycje', description: 'Doświadczona nauczycielka matematyki oferuje korepetycje dla uczniów klas 4-8. Przygotowanie do egzaminów, wyrównywanie zaległości, rozwijanie zainteresowań.', price: '50', unit: 'godzina', location: 'Online', avatar: '👩‍🏫', rating: 4.8, reviews: 47 },
    { id: 2, title: 'Konsultacje biznesowe', provider: 'Marek Nowak', type: 'Konsultacje', description: 'Specjalista ds. rozwoju biznesu pomogę w strategii, marketingu i ekspansji firmy. 15 lat doświadczenia w branży technologicznej.', price: '150', unit: 'godzina', location: 'Online/Warszawa', avatar: '👨‍💼', rating: 4.9, reviews: 63 },
    { id: 3, title: 'Tłumaczenia angielski-polski', provider: 'Julia Lewandowska', type: 'Tłumaczenia', description: 'Natywna anglistka z Polski. Tłumaczę dokumenty, artykuły, strony internetowe. Specjalizacja: tekst techniczny i medyczny.', price: '70', unit: 'strona', location: 'Online', avatar: '🌍', rating: 4.7, reviews: 52 }
    // ... (rest omitted for brevity)
  ]
}
