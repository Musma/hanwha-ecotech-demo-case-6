import type { FixedImageOverlay } from '@/shared/helpers/map/map-geo-helpers'
import type {
  CircleShape,
  PolygonShape,
  RectangleShape,
  SelectedShape,
} from '@/shared/helpers/map/measurement-utils'

export interface FocusRequestBase {
  requestedAt: number
}

export interface MapEntityFocusRequest extends FocusRequestBase {
  no: string
  name?: string
  phys: number[]
  tone?: string
  popup?: unknown
}

export interface MapRouteFocusRequest extends FocusRequestBase {
  req: string
  from: { label: string; phys: number[] }
  to: { label: string; phys: number[] }
  popup?: unknown
}

export interface MapEntityMarkerMotion {
  stop: [number, number]
  destination: [number, number]
  approachDurationMs: number
  dwellDurationMs: number
  departureDurationMs: number
}

export interface MapEntityMarkerInfoRow {
  label: string
  value: string
}

export interface MapEntityMarkerInfo {
  label: string
  title: string
  status?: string
  imageSrc?: string
  imageAlt?: string
  rows: MapEntityMarkerInfoRow[]
  description?: string
}

export interface MapEntityMarkerItem {
  id?: string
  label?: string
  name?: string
  iconClass?: string
  phys?: number[]
  offset?: [number, number]
  selected?: boolean
  selectable?: boolean
  focusOnSelect?: boolean
  info?: MapEntityMarkerInfo
  showWave?: boolean
  tone?: string
  motion?: MapEntityMarkerMotion
  updatesTrack?: boolean
  popup?: unknown
}

export interface RectanglePlacementSpec {
  id: string
  name?: string
  phys?: number[]
  widthMeters?: number
  lengthMeters?: number
  imageSrc?: string
}

export interface YardMapProps {
  center: [number, number]
  bearing?: number
  gridRotationDeg?: number
  gridOffsetY?: number
  gridSizeMeters?: number
  boundaryCoordinates?: number[][]
  boundaryRotationDeg?: number
  polygons?: PolygonShape[]
  colorByKey?: Record<string, string> | null
  rectanglePlacements?: RectanglePlacementSpec[]
  imageOverlays?: FixedImageOverlay[]
  mapStyle?: string
  fixedOverlayVisible?: boolean
  gridVisible?: boolean
  parcelVisible?: boolean
  blockVisible?: boolean
  mapMarkers?: MapEntityMarkerItem[]
  livePosition?: { phys?: number[]; label?: string } | null
  selectedShapeId?: string | null
  focusRequest?: FocusRequestBase | null
  entityFocusRequest?: MapEntityFocusRequest | null
  routeFocusRequest?: MapRouteFocusRequest | null
  pickMode?: boolean
  showFixedOverlayLabels?: boolean
}

export interface MapPointEvent {
  point: {
    x: number
    y: number
  }
}

export interface OverlayItem {
  id: string
  type: SelectedShape['type']
  title: string
  color?: string
  imageSrc?: string
  width?: number
  height?: number
  diameter?: number
  area: number
}

export interface RectangleSize {
  width: number
  height: number
}

export type MapEditableShape = CircleShape | PolygonShape | RectangleShape
