<script setup lang="ts">
import maplibregl, {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map as MapLibreMap,
  type MapMouseEvent,
  type Marker,
} from 'maplibre-gl'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'

import 'maplibre-gl/dist/maplibre-gl.css'

import type { LogisticsTwinPendingLocation } from '@/features/logged/dashboard/constants/logistics-twin-data'
import { createDashboardMapMarkerInfoElement } from '@/features/logged/dashboard/utils/map-marker-info'
import { startVehicleRouteAnimation } from '@/features/logged/dashboard/utils/vehicle-route-animation'
import {
  WORK_TRACK_BASE_DASH_ARRAY,
  WORK_TRACK_FLOW_LAYER_ID,
  WORK_TRACK_INITIAL_FLOW_GRADIENT,
  startWorkTrackAnimation,
} from '@/features/logged/dashboard/utils/work-track-animation'
import { getMapLibreStyle } from '@/shared/constants/map'
import { DEFAULT_GRID_SIZE_METERS } from '@/shared/constants/map-common'
import {
  YARD_DEFAULT_BEARING,
  YARD_DEFAULT_CENTER,
  YARD_DEFAULT_GRID_ROTATION,
  YARD_GRID_BOUNDARY_COORDINATES,
  YARD_GRID_BOUNDARY_ROTATION_DEG,
  YARD_JIBUN_KIND_COLORS,
} from '@/shared/constants/map-yard'
import { buildGridGeoJson } from '@/shared/helpers/map/grid-utils'
import { collapseMapAttribution } from '@/shared/helpers/map/map-control-utils'
import { normalizeGridBoundaryCoordinates } from '@/shared/helpers/map/map-geo-helpers'
import { getPhysicalGridAddress } from '@/shared/helpers/map/physical-address'
import type {
  MapEntityMarkerItem,
  YardMapProps,
} from '@/shared/types/map/yard-map'

import type { FeatureCollection, Geometry } from 'geojson'

type DashboardGeoJsonFeatureCollection = FeatureCollection<
  Geometry,
  Record<string, unknown>
>

interface LivePosition {
  lng: number
  lat: number
  label?: string
}

interface Props {
  fixedOverlayVisible: boolean
  gridVisible?: boolean
  mapStyle: string
  mapMarkers?: MapEntityMarkerItem[]
  polygons?: YardMapProps['polygons']
  /** 실시간 현재 위치(WGS84). null이면 마커를 표시하지 않는다. */
  livePosition?: LivePosition | null
  /** 작업 종료 후 보정된 트랙 좌표([lng, lat]). 비어 있으면 궤적선을 표시하지 않는다. */
  trackCoordinates?: Array<[number, number]>
  /** true이면 이동 경로 위에 방향성 애니메이션을 표시한다. */
  trackAnimated?: boolean
  /** true이면 지도 클릭 좌표를 물리지번으로 변환해 전달한다. */
  pickMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  gridVisible: false,
  mapMarkers: () => [],
  polygons: () => [],
  livePosition: null,
  trackCoordinates: () => [],
  trackAnimated: false,
  pickMode: false,
})

const emit = defineEmits<{
  pickLocation: [location: LogisticsTwinPendingLocation]
}>()

const MAP_VIEW_COORDINATES: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [127.587555, 34.899999],
  [127.600754, 34.908457],
  [127.605362, 34.90362],
  [127.592163, 34.895162],
]

const FIT_BOUNDS_PADDING = 20
const WORK_TRACK_FIT_BOUNDS_PADDING = {
  top: 48,
  right: 48,
  bottom: 48,
  // 이동 요청 패널(360px)과 패널의 좌측 여백(16px) 뒤에서 경로가 보이도록 한다.
  left: 424,
}
const INITIAL_ZOOM_OFFSET = 1
const SELECTED_MARKER_FOCUS_ZOOM_INCREMENT = 1
const SELECTED_MARKER_MAX_FOCUS_ZOOM = 17
const SELECTED_MARKER_FOCUS_DURATION_MS = 650
const SELECTED_MARKER_FOCUS_OFFSET: [number, number] = [0, 100]
const YARD_GRID_SOURCE_ID = 'dashboard-yard-grid'
const YARD_GRID_LAYER_ID = 'dashboard-yard-grid'
const JIBUN_POLYGON_SOURCE_ID = 'dashboard-jibun-polygons'
const JIBUN_POLYGON_FILL_LAYER_ID = 'dashboard-jibun-polygon-fill'
const JIBUN_POLYGON_LINE_LAYER_ID = 'dashboard-jibun-polygon-line'
const WORK_TRACK_SOURCE_ID = 'dashboard-work-track'
const WORK_TRACK_LAYER_ID = 'dashboard-work-track'

type ImageOverlayCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
]

const YARD_GRID_ORIGIN = {
  lat: YARD_DEFAULT_CENTER[1],
  lng: YARD_DEFAULT_CENTER[0],
}

const YARD_GRID_BOUNDARY = normalizeGridBoundaryCoordinates(
  YARD_GRID_BOUNDARY_COORDINATES,
  YARD_GRID_ORIGIN,
  YARD_GRID_BOUNDARY_ROTATION_DEG,
)

function updatePickModeCursor() {
  const map = mapRef.value
  if (!map) return
  map.getCanvas().style.cursor = props.pickMode ? 'crosshair' : ''
}

function handleLocationPick(event: MapMouseEvent) {
  if (!props.pickMode) return

  const label = getPhysicalGridAddress(
    event.lngLat,
    YARD_GRID_ORIGIN,
    DEFAULT_GRID_SIZE_METERS,
    DEFAULT_GRID_SIZE_METERS,
    YARD_GRID_BOUNDARY,
  )
  const matched = /^\((\d+),\s*(\d+)\)$/.exec(label)
  if (!matched) return

  emit('pickLocation', {
    label,
    phys: [Number(matched[1]), Number(matched[2])],
    lngLat: [event.lngLat.lng, event.lngLat.lat],
  })
}

const YARD_CAD_IMAGE_OVERLAYS = [
  {
    sourceId: 'yard-cad-image-2yard',
    layerId: 'yard-cad-image-2yard',
    label: '2YARD',
    url: '/yard2.png',
    coordinates: [
      [127.587585, 34.899842],
      [127.590244, 34.901574],
      [127.594853, 34.896818],
      [127.592158, 34.895121],
    ] satisfies ImageOverlayCoordinates,
  },
  {
    sourceId: 'yard-cad-image-1yard',
    layerId: 'yard-cad-image-1yard',
    label: '1YARD',
    url: '/yard1.png',
    coordinates: [
      [127.590772, 34.901531],
      [127.601043, 34.90818],
      [127.603523, 34.905675],
      [127.593202, 34.899038],
    ] satisfies ImageOverlayCoordinates,
  },
]

function createGridFeatureCollection(): DashboardGeoJsonFeatureCollection {
  const corners = YARD_GRID_BOUNDARY.map(([lng, lat]) => ({ lat, lng }))
  const { data } = buildGridGeoJson({
    corners,
    origin: YARD_GRID_ORIGIN,
    gridWidth: DEFAULT_GRID_SIZE_METERS,
    gridHeight: DEFAULT_GRID_SIZE_METERS,
    rotationDeg: YARD_DEFAULT_GRID_ROTATION,
    maskPolygons: YARD_GRID_BOUNDARY.length >= 4 ? [YARD_GRID_BOUNDARY] : [],
  })
  return data as DashboardGeoJsonFeatureCollection
}

const mapRootRef = shallowRef<HTMLDivElement | null>(null)
const mapRef = shallowRef<MapLibreMap | null>(null)
const markerRefs = shallowRef<Marker[]>([])
const labelMarkerRefs = shallowRef<Marker[]>([])
const liveMarkerRef = shallowRef<Marker | null>(null)
const mapLoaded = shallowRef(false)
let stopWorkTrackAnimation: (() => void) | null = null
let stopMarkerAnimations: Array<() => void> = []

const mapBounds = computed<LngLatBoundsLike>(() => {
  const lngs = MAP_VIEW_COORDINATES.map(([lng]) => lng)
  const lats = MAP_VIEW_COORDINATES.map(([, lat]) => lat)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
})

function createEmptyFeatureCollection(): DashboardGeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

function createPolygonFeatureCollection(): DashboardGeoJsonFeatureCollection {
  const features: DashboardGeoJsonFeatureCollection['features'] = []

  for (const polygon of props.polygons) {
    if (polygon.points.length < 3) continue
    const coordinates = polygon.points.map((point) => [point.lng, point.lat])
    coordinates.push(coordinates[0])
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      properties: {
        id: polygon.id,
        name: polygon.name ?? '',
        fill: YARD_JIBUN_KIND_COLORS[polygon.colorKey ?? ''] ?? '#94A3B8',
      },
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

function ensureDashboardOverlayLayers() {
  const map = mapRef.value
  if (!map) return

  for (const overlay of YARD_CAD_IMAGE_OVERLAYS) {
    if (!map.getSource(overlay.sourceId)) {
      map.addSource(overlay.sourceId, {
        type: 'image',
        url: overlay.url,
        coordinates: overlay.coordinates,
      })
    }
    if (!map.getLayer(overlay.layerId)) {
      map.addLayer({
        id: overlay.layerId,
        type: 'raster',
        source: overlay.sourceId,
        paint: {
          'raster-opacity': 1,
        },
      })
    }
  }

  if (!map.getSource(YARD_GRID_SOURCE_ID)) {
    map.addSource(YARD_GRID_SOURCE_ID, {
      type: 'geojson',
      data: createGridFeatureCollection(),
    })
  }
  if (!map.getLayer(YARD_GRID_LAYER_ID)) {
    map.addLayer({
      id: YARD_GRID_LAYER_ID,
      type: 'line',
      source: YARD_GRID_SOURCE_ID,
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': 'rgba(77, 240, 222, 0.58)',
        'line-width': 1.4,
      },
    })
  }
}

function updateCadVisibility() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  for (const overlay of YARD_CAD_IMAGE_OVERLAYS) {
    if (!map.getLayer(overlay.layerId)) continue
    map.setLayoutProperty(
      overlay.layerId,
      'visibility',
      props.fixedOverlayVisible ? 'visible' : 'none',
    )
  }
}

function updateGridVisibility() {
  const map = mapRef.value
  if (!map || !mapLoaded.value || !map.getLayer(YARD_GRID_LAYER_ID)) return
  map.setLayoutProperty(
    YARD_GRID_LAYER_ID,
    'visibility',
    props.gridVisible ? 'visible' : 'none',
  )
}

function ensureJibunLayers() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  if (!map.getSource(JIBUN_POLYGON_SOURCE_ID)) {
    map.addSource(JIBUN_POLYGON_SOURCE_ID, {
      type: 'geojson',
      data: createEmptyFeatureCollection(),
    })
  }
  if (!map.getLayer(JIBUN_POLYGON_FILL_LAYER_ID)) {
    map.addLayer({
      id: JIBUN_POLYGON_FILL_LAYER_ID,
      type: 'fill',
      source: JIBUN_POLYGON_SOURCE_ID,
      paint: {
        'fill-color': ['get', 'fill'],
        'fill-opacity': 0.22,
      },
    })
  }
  if (!map.getLayer(JIBUN_POLYGON_LINE_LAYER_ID)) {
    map.addLayer({
      id: JIBUN_POLYGON_LINE_LAYER_ID,
      type: 'line',
      source: JIBUN_POLYGON_SOURCE_ID,
      paint: {
        'line-color': ['get', 'fill'],
        'line-opacity': 0.9,
        'line-width': 1.5,
      },
    })
  }
}

function updateJibunLayers() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  ensureJibunLayers()
  ;(
    map.getSource(JIBUN_POLYGON_SOURCE_ID) as GeoJSONSource | undefined
  )?.setData(createPolygonFeatureCollection())
  updateLabelMarkers()
}

function ensureWorkTrackLayer() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  if (!map.getSource(WORK_TRACK_SOURCE_ID)) {
    map.addSource(WORK_TRACK_SOURCE_ID, {
      type: 'geojson',
      data: createEmptyFeatureCollection(),
      lineMetrics: true,
    })
  }
  if (!map.getLayer(WORK_TRACK_LAYER_ID)) {
    map.addLayer({
      id: WORK_TRACK_LAYER_ID,
      type: 'line',
      source: WORK_TRACK_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#F37321',
        'line-width': 3,
        'line-opacity': 0.68,
        'line-dasharray': WORK_TRACK_BASE_DASH_ARRAY,
      },
    })
  }
  if (!map.getLayer(WORK_TRACK_FLOW_LAYER_ID)) {
    map.addLayer({
      id: WORK_TRACK_FLOW_LAYER_ID,
      type: 'line',
      source: WORK_TRACK_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: 'none',
      },
      paint: {
        'line-width': 7,
        'line-opacity': 1,
        'line-blur': 1.8,
        'line-gradient': WORK_TRACK_INITIAL_FLOW_GRADIENT,
      },
    })
  }
}

function stopCurrentWorkTrackAnimation() {
  stopWorkTrackAnimation?.()
  stopWorkTrackAnimation = null
}

function updateWorkTrackAnimation() {
  const map = mapRef.value
  if (!map || !mapLoaded.value || !map.getLayer(WORK_TRACK_FLOW_LAYER_ID))
    return

  stopCurrentWorkTrackAnimation()
  const shouldAnimate =
    props.trackAnimated && props.trackCoordinates.length >= 2
  map.setLayoutProperty(
    WORK_TRACK_FLOW_LAYER_ID,
    'visibility',
    shouldAnimate ? 'visible' : 'none',
  )
  if (shouldAnimate) stopWorkTrackAnimation = startWorkTrackAnimation(map)
}

function updateWorkTrack() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  ensureWorkTrackLayer()

  const coordinates = props.trackCoordinates
  const data: DashboardGeoJsonFeatureCollection =
    coordinates.length >= 2
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates },
              properties: {},
            },
          ],
        }
      : createEmptyFeatureCollection()

  ;(map.getSource(WORK_TRACK_SOURCE_ID) as GeoJSONSource | undefined)?.setData(
    data,
  )

  updateWorkTrackAnimation()

  // 트랙이 새로 그려지면 전체가 보이도록 지도를 맞춘다.
  if (coordinates.length >= 2) {
    const lngs = coordinates.map(([lng]) => lng)
    const lats = coordinates.map(([, lat]) => lat)
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: WORK_TRACK_FIT_BOUNDS_PADDING,
        bearing: YARD_DEFAULT_BEARING,
        duration: 600,
      },
    )
  }
}

function updateWorkTrackStart(
  position: [number, number],
  destination: [number, number],
) {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  const source = map.getSource(WORK_TRACK_SOURCE_ID) as
    | GeoJSONSource
    | undefined
  source?.setData({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [position, destination],
        },
        properties: {},
      },
    ],
  })
}

function clearMarkers() {
  stopMarkerAnimations.forEach((stopAnimation) => stopAnimation())
  stopMarkerAnimations = []
  markerRefs.value.forEach((marker) => marker.remove())
  markerRefs.value = []
}

function clearLabelMarkers() {
  labelMarkerRefs.value.forEach((marker) => marker.remove())
  labelMarkerRefs.value = []
}

function updateLabelMarkers() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  clearLabelMarkers()
  labelMarkerRefs.value = props.polygons
    .map((polygon) => {
      if (polygon.points.length === 0 || !polygon.name) return null
      const centroid = polygon.points.reduce(
        (acc, point) => ({
          lat: acc.lat + point.lat,
          lng: acc.lng + point.lng,
        }),
        { lat: 0, lng: 0 },
      )
      const el = document.createElement('div')
      el.className =
        'rounded-sm bg-hw-gray-darker/75 px-1.5 py-0.5 text-c1 font-bold text-hw-white-main shadow-sm'
      el.textContent = polygon.name
      return new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([
          centroid.lng / polygon.points.length,
          centroid.lat / polygon.points.length,
        ])
        .addTo(map)
    })
    .filter((marker): marker is Marker => Boolean(marker))
}

function updateMarkers() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  clearMarkers()
  markerRefs.value = props.mapMarkers
    .map((marker) => {
      if (!Array.isArray(marker.phys) || marker.phys.length < 2) return null
      const el = document.createElement('div')
      const markerToneClass =
        marker.tone === 'obstruction-danger'
          ? 'dashboard-map-marker--danger'
          : marker.tone === 'drop-zone'
            ? 'dashboard-map-marker--drop-zone'
            : marker.tone === 'vehicle'
              ? 'dashboard-map-marker--vehicle'
              : 'dashboard-map-marker--warning'
      el.className = `dashboard-map-marker ${markerToneClass}${marker.selected ? ' dashboard-map-marker--selected' : ''}`
      el.title = marker.name ?? marker.label ?? ''

      if (marker.selected && marker.info) {
        el.append(createDashboardMapMarkerInfoElement(marker.info))
      }

      const showWave =
        marker.showWave ?? (marker.selected || marker.tone === 'vehicle')
      if (showWave) {
        const waves = Array.from({ length: 3 }, () => {
          const wave = document.createElement('span')
          wave.className = 'dashboard-map-marker__wave'
          return wave
        })
        el.append(...waves)
      }

      const tag = document.createElement('span')
      tag.className = 'dashboard-map-marker__tag'
      if (marker.tone === 'vehicle') {
        const icon = document.createElement('i')
        icon.className = 'ti ti-truck'
        icon.setAttribute('aria-hidden', 'true')
        tag.append(icon)
        tag.append(marker.label ?? marker.name ?? '')
      } else {
        tag.textContent = marker.label ?? marker.name ?? ''
      }
      el.append(tag)

      const mapMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([marker.phys[0], marker.phys[1]])
        .addTo(map)
      const motion = marker.motion
      if (motion) {
        stopMarkerAnimations.push(
          startVehicleRouteAnimation(
            mapMarker,
            [marker.phys[0], marker.phys[1]],
            motion,
            (position) => updateWorkTrackStart(position, motion.destination),
          ),
        )
      }
      return mapMarker
    })
    .filter((marker): marker is Marker => Boolean(marker))
}

function focusSelectedMarker() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  const marker = props.mapMarkers.find(
    (item) => item.selected && item.focusOnSelect,
  )
  if (!marker || !Array.isArray(marker.phys) || marker.phys.length < 2) return

  const [lng, lat] = marker.phys
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

  const currentZoom = map.getZoom()
  map.easeTo({
    center: [lng, lat],
    offset: SELECTED_MARKER_FOCUS_OFFSET,
    zoom: Math.max(
      currentZoom,
      Math.min(
        currentZoom + SELECTED_MARKER_FOCUS_ZOOM_INCREMENT,
        SELECTED_MARKER_MAX_FOCUS_ZOOM,
      ),
    ),
    duration: SELECTED_MARKER_FOCUS_DURATION_MS,
  })
}

function updateLiveMarker() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  const pos = props.livePosition
  if (!pos || !Number.isFinite(pos.lng) || !Number.isFinite(pos.lat)) {
    liveMarkerRef.value?.remove()
    liveMarkerRef.value = null
    return
  }

  if (!liveMarkerRef.value) {
    const el = document.createElement('div')
    el.className = 'live-marker'
    // 시차를 둔 여러 파동 링으로 연속적인 레이더 효과를 낸다.
    const waves = Array.from({ length: 3 }, () => {
      const wave = document.createElement('div')
      wave.className = 'live-marker__wave'
      return wave
    })
    const dot = document.createElement('div')
    dot.className = 'live-marker__dot'
    const label = document.createElement('div')
    label.className = 'live-marker__label'
    label.textContent = pos.label ?? '현재위치'
    el.append(...waves, dot, label)
    liveMarkerRef.value = new maplibregl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([pos.lng, pos.lat])
      .addTo(map)
    // 표시 중인 이동 경로의 카메라 구도를 유지하고, 단독 위치일 때만 중심을 이동한다.
    if (props.trackCoordinates.length < 2) {
      map.easeTo({ center: [pos.lng, pos.lat], duration: 800 })
    }
    return
  }

  liveMarkerRef.value.setLngLat([pos.lng, pos.lat])
  if (pos.label) {
    const labelEl = liveMarkerRef.value
      .getElement()
      .querySelector('.live-marker__label')
    if (labelEl) labelEl.textContent = pos.label
  }
}

function initializeMap() {
  if (!mapRootRef.value) return

  const map = new maplibregl.Map({
    container: mapRootRef.value,
    style: getMapLibreStyle(props.mapStyle),
    bounds: mapBounds.value,
    fitBoundsOptions: {
      bearing: YARD_DEFAULT_BEARING,
      padding: FIT_BOUNDS_PADDING,
    },
    bearing: YARD_DEFAULT_BEARING,
    pitch: 0,
    dragRotate: false,
    touchZoomRotate: true,
    attributionControl: { compact: true },
  })

  collapseMapAttribution(map)
  mapRef.value = map
  map.on('click', handleLocationPick)
  // 핀치 줌(확대/축소)은 허용하되, 야드 정렬 유지를 위해 두 손가락 회전은 비활성화한다.
  map.touchZoomRotate.disableRotation()
  map.once('load', () => {
    map.jumpTo({
      bearing: YARD_DEFAULT_BEARING,
      pitch: 0,
      zoom: map.getZoom() + INITIAL_ZOOM_OFFSET,
    })
    mapLoaded.value = true
    ensureDashboardOverlayLayers()
    updateCadVisibility()
    updateGridVisibility()
    updateJibunLayers()
    updateMarkers()
    focusSelectedMarker()
    updateLiveMarker()
    updateWorkTrack()
    updatePickModeCursor()
    requestAnimationFrame(() => map.resize())
  })
}

function syncMapStyle() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

  stopCurrentWorkTrackAnimation()
  mapLoaded.value = false
  map.setStyle(getMapLibreStyle(props.mapStyle))
  map.once('style.load', () => {
    map.jumpTo({
      bearing: YARD_DEFAULT_BEARING,
      pitch: 0,
      zoom: map.getZoom(),
    })
    mapLoaded.value = true
    ensureDashboardOverlayLayers()
    updateCadVisibility()
    updateGridVisibility()
    updateJibunLayers()
    updateMarkers()
    focusSelectedMarker()
    updateLiveMarker()
    updateWorkTrack()
    updatePickModeCursor()
    requestAnimationFrame(() => map.resize())
  })
}

watch(
  () => props.fixedOverlayVisible,
  () => updateCadVisibility(),
)

watch(
  () => props.mapStyle,
  () => syncMapStyle(),
)

watch(
  () => props.gridVisible,
  () => updateGridVisibility(),
)

watch(
  () => props.polygons,
  () => updateJibunLayers(),
  { deep: true },
)

watch(
  () => props.mapMarkers,
  () => updateMarkers(),
  { deep: true },
)

watch(
  () =>
    props.mapMarkers.find((marker) => marker.selected && marker.focusOnSelect)
      ?.id,
  () => focusSelectedMarker(),
)

watch(
  () => props.livePosition,
  () => updateLiveMarker(),
  { deep: true },
)

watch(
  () => props.trackCoordinates,
  () => updateWorkTrack(),
  { deep: true },
)

watch(
  () => props.trackAnimated,
  () => updateWorkTrackAnimation(),
)

watch(
  () => props.pickMode,
  () => updatePickModeCursor(),
)

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  stopCurrentWorkTrackAnimation()
  clearMarkers()
  clearLabelMarkers()
  liveMarkerRef.value?.remove()
  liveMarkerRef.value = null
  mapRef.value?.remove()
  mapRef.value = null
  mapLoaded.value = false
})
</script>

<template>
  <div
    class="relative min-w-0 min-h-0 h-full w-full overflow-hidden rounded-sm border border-hw-white-darker bg-hw-gray-darker"
  >
    <div ref="mapRootRef" class="absolute inset-0 h-full w-full" />

    <slot />
  </div>
</template>
