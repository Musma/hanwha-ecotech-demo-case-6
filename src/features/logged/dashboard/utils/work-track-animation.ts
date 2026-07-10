import type { Map as MapLibreMap } from 'maplibre-gl'

export const WORK_TRACK_FLOW_LAYER_ID = 'dashboard-work-track-flow'
export const WORK_TRACK_BASE_DASH_ARRAY = [2, 2]

const WORK_TRACK_ANIMATION_INTERVAL_MS = 80
const WORK_TRACK_DASH_SEQUENCE = [
  [0, 4, 3],
  [0.5, 3.5, 3],
  [1, 3, 3],
  [1.5, 2.5, 3],
  [2, 2, 3],
  [2.5, 1.5, 3],
  [3, 1, 3],
  [3.5, 0.5, 3],
  [4, 0, 3],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
] as const

export const WORK_TRACK_INITIAL_FLOW_DASH_ARRAY = [
  ...WORK_TRACK_DASH_SEQUENCE[0],
]

export function startWorkTrackAnimation(map: MapLibreMap) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined
  }

  let animationFrame: number | null = null
  let previousDashIndex = -1
  const animate = (timestamp: number) => {
    if (!map.getLayer(WORK_TRACK_FLOW_LAYER_ID)) {
      animationFrame = null
      return
    }

    const dashIndex =
      Math.floor(timestamp / WORK_TRACK_ANIMATION_INTERVAL_MS) %
      WORK_TRACK_DASH_SEQUENCE.length
    if (dashIndex !== previousDashIndex) {
      map.setPaintProperty(WORK_TRACK_FLOW_LAYER_ID, 'line-dasharray', [
        ...WORK_TRACK_DASH_SEQUENCE[dashIndex],
      ])
      previousDashIndex = dashIndex
    }
    animationFrame = requestAnimationFrame(animate)
  }

  animationFrame = requestAnimationFrame(animate)
  return () => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}
