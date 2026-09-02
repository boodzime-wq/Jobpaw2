// Job Service - Handle job data loading and display

import { escapeHtml, truncateText } from './utils.js'
import { showSuccess } from './notificationService.js'

let lastJobsTotal = 0

export function getLastJobsTotal() {
  return lastJobsTotal
}

export async function loadJobs(keywords = 'praca', location = 'Polska') {
  try {
    const params = new URLSearchParams({ keywords, location })
    const response = await fetch(`/api/jobs?${params.toString()}`)

    if (response.ok) {
      const data = await response.json()
      const joobleJobs = parseJobsData(data.jobs || data)
      lastJobsTotal = Number(data.totalCount || data.total || data.count || joobleJobs.length) || joobleJobs.length
      return mergeWithDemoJobs(joobleJobs)
    }

    console.warn('Jooble API error:', response.status)
  } catch (error) {
    console.warn('Nie udało się pobrać ofert z Jooble:', error)
  }

  return getDemoJobs()
}

function mergeWithDemoJobs(joobleJobs) {
  const demoJobs = getDemoJobs()
  const seen = new Set()
  const combined = [...joobleJobs, ...demoJobs]

  return combined.filter(job => {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Parse jobs data from API response
function parseJobsData(data) {
  if (Array.isArray(data)) {
    return data.map(job => ({
      id: job.id || Math.random(),
      title: job.title || job.name || 'Brak tytułu',
      company: job.company || job.employer || 'Brak firmy',
      location: job.location || job.city || 'Brak lokalizacji',
      description: job.description || job.job_description || '',
      salary: job.salary || job.salary_min || 'Do negocjacji',
      salaryMax: job.salary_max || null,
      type: job.type || job.job_type || 'full-time',
      category: job.category || job.job_category || 'Inne',
      posted: job.posted_date || job.created_at || new Date().toISOString(),
      url: job.url || '#'
    }))
  }
  return []
}

// Display jobs on page
export function displayJobs(jobs, containerId = '#jobsList') {
  const container = document.querySelector(containerId)
  if (!container) return
  
  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>😔 Nie znaleziono ofert pracy</p>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Spróbuj zmienić filtry lub wyszukiwanie</p>
      </div>
    `
    return
  }
  
  container.innerHTML = jobs.map((job, index) => createJobCard(job, index)).join('')
  
  // Initialize favorited state from localStorage
  const favRaw = JSON.parse(localStorage.getItem('favorites') || '[]')
  const favorites = Array.isArray(favRaw) ? favRaw.map(n => Number(n)) : []
  container.querySelectorAll('.btn-favorite').forEach(btn => {
    const id = Number(btn.dataset.jobId)
    if (favorites.includes(id)) {
      btn.classList.add('favorited')
      const icon = btn.querySelector('.heart-icon')
      if (icon) icon.textContent = '❤️'
    }
    btn.addEventListener('click', toggleFavorite)
  })
  
  // Add event listeners to apply buttons
  container.querySelectorAll('.btn-apply').forEach(btn => {
    btn.addEventListener('click', handleApply)
  })
}

// Create individual job card HTML
function createJobCard(job, index) {
  const animationDelay = index * 0.1
  const salary = formatSalary(job.salary, job.salaryMax)
  const daysSincePosted = getDaysSincePosted(job.posted)
  const type = formatJobType(job.type)
  
  return `
    <div class="job-card" style="animation-delay: ${animationDelay}s;">
      <div class="job-header">
        <div>
          <h3 class="job-title">${escapeHtml(job.title)}</h3>
          <p class="job-company">${escapeHtml(job.company)}</p>
        </div>
        <button class="btn-favorite" data-job-id="${job.id}" title="Dodaj do ulubionych">
          <span class="heart-icon">♡</span>
        </button>
      </div>
      
      <div class="job-meta">
        <span class="job-location">📍 ${escapeHtml(job.location)}</span>
        <span class="job-type badge badge-primary">${type}</span>
        <span class="job-posted">🕐 ${daysSincePosted}</span>
      </div>
      
      <p class="job-description">${truncateText(escapeHtml(job.description), 150)}</p>
      
      <div class="job-footer">
        <div class="job-salary">${salary}</div>
        <button class="btn-apply" data-job-id="${job.id}" data-job-title="${escapeHtml(job.title)}">
          ✉️ Aplikuj
        </button>
      </div>
    </div>
  `
}

// Format salary display
function formatSalary(min, max) {
  if (!min) return '💰 Do negocjacji'
  
  if (typeof min === 'string') {
    return `💰 ${min}`
  }
  
  if (max) {
    return `💰 ${min.toLocaleString('pl-PL')} - ${max.toLocaleString('pl-PL')} PLN`
  }
  
  return `💰 ${min.toLocaleString('pl-PL')} PLN`
}

// Format job type
function formatJobType(type) {
  const types = {
    'full-time': 'Pełny etat',
    'part-time': 'Część etatu',
    'contract': 'Kontrakt',
    'freelance': 'Freelance',
    'temporary': 'Tymczasowa'
  }
  return types[type] || type || 'Pełny etat'
}

// Calculate days since posted
function getDaysSincePosted(date) {
  try {
    const posted = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now - posted)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Dzisiaj'
    if (diffDays === 1) return 'Wczoraj'
    if (diffDays < 7) return `${diffDays} dni temu`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tygodni temu`
    return `${Math.floor(diffDays / 30)} miesięcy temu`
  } catch (error) {
    return 'Niedawno'
  }
}

// Toggle favorite
function toggleFavorite(e) {
  e.preventDefault()
  const button = e.currentTarget
  const jobId = Number(button.dataset.jobId)
  
  button.classList.toggle('favorited')
  const icon = button.querySelector('.heart-icon')
  if (icon) icon.textContent = button.classList.contains('favorited') ? '❤️' : '♡'
  
  // Save to localStorage as numbers
  const raw = JSON.parse(localStorage.getItem('favorites') || '[]')
  const favorites = Array.isArray(raw) ? raw.map(n => Number(n)) : []
  if (button.classList.contains('favorited')) {
    if (!favorites.includes(jobId)) {
      favorites.push(jobId)
    }
  } else {
    const index = favorites.indexOf(jobId)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  localStorage.setItem('favorites', JSON.stringify(favorites))
}

// Handle apply
function handleApply(e) {
  e.preventDefault()
  const jobTitle = e.currentTarget.dataset.jobTitle
  showSuccess(`Dziękujemy! Twoja aplikacja do stanowiska "${jobTitle}" została wysłana.`)
  // Here you would send the application to a server
}

// Demo jobs data
function getDemoJobs() {
  return [
    {
      id: 1,
      title: 'Senior JavaScript Developer',
      company: 'TechCorp Sp. z o.o.',
      location: 'Warszawa',
      description: 'Szukamy doświadczonego programisty JavaScript do pracy nad nowoczesnymi aplikacjami webowymi. Wymagana znajomość React, Node.js i baz danych SQL.',
      salary: 12000,
      salaryMax: 16000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'StartupHub',
      location: 'Kraków',
      description: 'Dołącz do naszego zespołu jako Product Manager. Będziesz odpowiedzialny za strategię produktu i współpracę z zespołem dev. Wymagane doświadczenie 3+ lat.',
      salary: 10000,
      salaryMax: 14000,
      type: 'full-time',
      category: 'Zarządzanie',
      posted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: 'UX/UI Designer',
      company: 'Creative Studio',
      location: 'Wrocław',
      description: 'Szukamy kreatywnego designera do projektowania interfejsów użytkownika dla aplikacji mobilnych. Portfolio wymagane.',
      salary: 7000,
      salaryMax: 10000,
      type: 'full-time',
      category: 'Design',
      posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
    // ... (rest of demo items omitted for brevity in this commit)
  ]
}
