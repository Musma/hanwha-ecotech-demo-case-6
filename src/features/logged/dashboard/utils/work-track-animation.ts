import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'

export const WORK_TRACK_FLOW_LAYER_ID = 'dashboard-work-track-flow'
export const WORK_TRACK_BASE_DASH_ARRAY = [1.2, 1.8]

const WORK_TRACK_ANIMATION_DURATION_MS = 2400
const WORK_TRACK_FRAME_INTERVAL_MS = 32
const WORK_TRACK_HEAD_START = 0.2
const WORK_TRACK_HEAD_END = 0.94
const WORK_TRACK_TRAIL_LENGTH = 0.18
const WORK_TRACK_GLOW_LENGTH = 0.08
const WORK_TRACK_BRIGHT_LENGTH = 0.025
const WORK_TRACK_FADE_LENGTH = 0.045
const TRANSPARENT_ORANGE = 'rgba(251, 181, 132, 0)'
const SOFT_ORANGE = 'rgba(251, 181, 132, 0.22)'
const GLOW_ORANGE = 'rgba(248, 155, 108, 0.72)'
const BRIGHT_HEAD = 'rgba(255, 255, 255, 0.98)'

export function createWorkTrackFlowGradient(
  headProgress: number,
): ExpressionSpecification {
  const tailStart = Math.max(0.001, headProgress - WORK_TRACK_TRAIL_LENGTH)
  const glowStart = Math.max(
    tailStart + 0.001,
    headProgress - WORK_TRACK_GLOW_LENGTH,
  )
  const brightStart = Math.max(
    glowStart + 0.001,
    headProgress - WORK_TRACK_BRIGHT_LENGTH,
  )
  const fadeEnd = Math.min(0.999, headProgress + WORK_TRACK_FADE_LENGTH)

  return [
    'interpolate',
    ['linear'],
    ['line-progress'],
    0,
    TRANSPARENT_ORANGE,
    tailStart,
    TRANSPARENT_ORANGE,
    glowStart,
    SOFT_ORANGE,
    brightStart,
    GLOW_ORANGE,
    headProgress,
    BRIGHT_HEAD,
    fadeEnd,
    TRANSPARENT_ORANGE,
    1,
    TRANSPARENT_ORANGE,
  ]
}

export const WORK_TRACK_INITIAL_FLOW_GRADIENT = createWorkTrackFlowGradient(
  WORK_TRACK_HEAD_START,
)

export function startWorkTrackAnimation(map: MapLibreMap) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined
  }

  let animationFrame: number | null = null
  let previousPaintAt = -WORK_TRACK_FRAME_INTERVAL_MS
  const animate = (timestamp: number) => {
    if (!map.getLayer(WORK_TRACK_FLOW_LAYER_ID)) {
      animationFrame = null
      return
    }

    if (timestamp - previousPaintAt >= WORK_TRACK_FRAME_INTERVAL_MS) {
      const cycleProgress =
        (timestamp % WORK_TRACK_ANIMATION_DURATION_MS) /
        WORK_TRACK_ANIMATION_DURATION_MS
      const headProgress =
        WORK_TRACK_HEAD_START +
        (WORK_TRACK_HEAD_END - WORK_TRACK_HEAD_START) * cycleProgress
      map.setPaintProperty(
        WORK_TRACK_FLOW_LAYER_ID,
        'line-gradient',
        createWorkTrackFlowGradient(headProgress),
      )
      previousPaintAt = timestamp
    }
    animationFrame = requestAnimationFrame(animate)
  }

  animationFrame = requestAnimationFrame(animate)
  return () => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}
