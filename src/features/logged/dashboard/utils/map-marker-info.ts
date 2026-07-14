import type { MapEntityMarkerInfo } from '@/shared/types/map/yard-map'

export function createDashboardMapMarkerInfoElement(
  info: MapEntityMarkerInfo,
  onClose: () => void,
) {
  const container = document.createElement('div')
  container.className = 'dashboard-map-marker__info'
  container.setAttribute(
    'aria-label',
    `${info.label} ${info.title} 간섭물 상세 정보`,
  )

  const header = document.createElement('div')
  header.className = 'dashboard-map-marker__info-header'

  const heading = document.createElement('div')
  heading.className = 'dashboard-map-marker__info-heading'
  const label = document.createElement('span')
  label.className = 'dashboard-map-marker__info-label'
  label.textContent = info.label
  const title = document.createElement('strong')
  title.className = 'dashboard-map-marker__info-title'
  title.textContent = info.title
  heading.append(label, title)
  header.append(heading)

  if (info.status) {
    const status = document.createElement('button')
    status.className = 'dashboard-map-marker__info-status'
    status.type = 'button'
    status.textContent = info.status
    status.setAttribute('aria-label', `${info.label} 상세 정보 닫기`)
    status.addEventListener('click', (event) => {
      event.stopPropagation()
      onClose()
    })
    status.addEventListener('keydown', (event) => event.stopPropagation())
    header.append(status)
  }

  container.append(header)

  if (info.imageSrc) {
    const image = document.createElement('img')
    image.className = 'dashboard-map-marker__info-image'
    image.src = info.imageSrc
    image.alt = info.imageAlt ?? `${info.title} 현장 사진`
    image.loading = 'lazy'
    container.append(image)
  }

  const list = document.createElement('dl')
  list.className = 'dashboard-map-marker__info-list'
  info.rows.forEach((row) => {
    const item = document.createElement('div')
    item.className = 'dashboard-map-marker__info-row'
    const term = document.createElement('dt')
    term.textContent = row.label
    const description = document.createElement('dd')
    description.textContent = row.value
    item.append(term, description)
    list.append(item)
  })

  container.append(list)
  if (info.description) {
    const description = document.createElement('p')
    description.className = 'dashboard-map-marker__info-description'
    description.textContent = info.description
    container.append(description)
  }

  return container
}
