import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  FLUTTER_LOCATION_PERMISSION_EVENT,
  FLUTTER_POINT_SAVED_EVENT,
} from '@/shared/constants/flutter-bridge'
import {
  type LocationPermission,
  useSessionStore,
} from '@/shared/stores/session'

/** 지도에 표시할 실시간 현재 위치(WGS84). */
export interface LiveLocation {
  lng: number
  lat: number
  accuracy?: number
}

/**
 * Flutter가 dispatch 하는 위치 관련 이벤트를 구독한다.
 * - flutterPointSaved: gps2 저장 성공 포인트(lat/lng) → livePosition 갱신, 권한 granted로 간주
 * - flutterLocationPermission: 위치 권한 상태 → store 반영, denied면 마커 제거
 */
export function useFlutterLocationBridge() {
  const session = useSessionStore()
  const livePosition = ref<LiveLocation | null>(null)

  function handlePointSaved(event: Event) {
    const detail = (event as CustomEvent).detail
    if (!detail || typeof detail !== 'object') return

    const lat = Number((detail as Record<string, unknown>).lat)
    const lng = Number((detail as Record<string, unknown>).lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const accuracy = Number((detail as Record<string, unknown>).accuracy)
    livePosition.value = {
      lat,
      lng,
      accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
    }
    // 포인트가 도착했다는 것은 권한이 허용된 상태라는 의미다.
    session.setLocationPermission('granted')
  }

  function handlePermission(event: Event) {
    const status = normalizePermission((event as CustomEvent).detail)
    session.setLocationPermission(status)
    if (status === 'denied') {
      livePosition.value = null
    }
  }

  onMounted(() => {
    window.addEventListener(FLUTTER_POINT_SAVED_EVENT, handlePointSaved)
    window.addEventListener(FLUTTER_LOCATION_PERMISSION_EVENT, handlePermission)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(FLUTTER_POINT_SAVED_EVENT, handlePointSaved)
    window.removeEventListener(
      FLUTTER_LOCATION_PERMISSION_EVENT,
      handlePermission,
    )
  })

  return { livePosition }
}

/** Flutter가 보내는 권한 값을 granted/denied/unknown으로 정규화한다. */
function normalizePermission(detail: unknown): LocationPermission {
  let raw = ''
  if (typeof detail === 'string') {
    raw = detail
  } else if (detail && typeof detail === 'object') {
    const record = detail as Record<string, unknown>
    if (typeof record.status === 'string') raw = record.status
    else if (typeof record.permission === 'string') raw = record.permission
    else if (typeof record.granted === 'boolean')
      raw = record.granted ? 'granted' : 'denied'
  }

  const value = raw.toLowerCase()
  if (
    value.includes('grant') ||
    value === 'true' ||
    value === 'always' ||
    value === 'whileinuse'
  ) {
    return 'granted'
  }
  if (
    value.includes('den') ||
    value === 'false' ||
    value.includes('restrict')
  ) {
    return 'denied'
  }
  return 'unknown'
}
