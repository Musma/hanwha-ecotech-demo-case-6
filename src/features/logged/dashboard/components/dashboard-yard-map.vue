<script setup lang="ts">
import maplibregl, {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map as MapLibreMap,
  type Marker,
} from 'maplibre-gl'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'

import 'maplibre-gl/dist/maplibre-gl.css'

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
import { normalizeGridBoundaryCoordinates } from '@/shared/helpers/map/map-geo-helpers'
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
}

const props = withDefaults(defineProps<Props>(), {
  gridVisible: false,
  mapMarkers: () => [],
  polygons: () => [],
  livePosition: null,
  trackCoordinates: () => [],
})

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
const INITIAL_ZOOM_OFFSET = 1
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
        'line-color': '#F97316',
        'line-width': 4,
        'line-opacity': 0.9,
      },
    })
  }
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

  // 트랙이 새로 그려지면 전체가 보이도록 지도를 맞춘다.
  if (coordinates.length >= 2) {
    const lngs = coordinates.map(([lng]) => lng)
    const lats = coordinates.map(([, lat]) => lat)
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, bearing: YARD_DEFAULT_BEARING, duration: 600 },
    )
  }
}

function clearMarkers() {
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
            : 'dashboard-map-marker--warning'
      el.className = `dashboard-map-marker ${markerToneClass}${marker.selected ? ' dashboard-map-marker--selected' : ''}`
      el.title = marker.name ?? marker.label ?? ''
      if (marker.selected) {
        const waves = Array.from({ length: 3 }, () => {
          const wave = document.createElement('span')
          wave.className = 'dashboard-map-marker__wave'
          return wave
        })
        el.append(...waves)
      }

      const tag = document.createElement('span')
      tag.className = 'dashboard-map-marker__tag'
      tag.textContent = marker.label ?? marker.name ?? ''
      el.append(tag)

      return new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([marker.phys[0], marker.phys[1]])
        .addTo(map)
    })
    .filter((marker): marker is Marker => Boolean(marker))
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
    // 첫 위치 수신 시 마커가 보이도록 해당 위치로 지도를 이동한다.
    map.easeTo({ center: [pos.lng, pos.lat], duration: 800 })
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
  })

  mapRef.value = map
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
    updateLiveMarker()
    updateWorkTrack()
    requestAnimationFrame(() => map.resize())
  })
}

function syncMapStyle() {
  const map = mapRef.value
  if (!map || !mapLoaded.value) return

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
    updateLiveMarker()
    updateWorkTrack()
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
  () => props.livePosition,
  () => updateLiveMarker(),
  { deep: true },
)

watch(
  () => props.trackCoordinates,
  () => updateWorkTrack(),
  { deep: true },
)

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
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
