import { computed, ref } from 'vue'

import {
  endWork,
  getActiveWork,
  startWork,
  type WorkSession,
  type WorkTrack,
} from '@/features/logged/dashboard/api/work-session'
import { useSessionStore } from '@/shared/stores/session'

/** 작업 트랙 포인트를 지도 폴리라인용 [lng, lat] 배열로 변환한다. */
function toTrackCoordinates(track: WorkTrack): Array<[number, number]> {
  const coordinates: Array<[number, number]> = []
  for (const point of track.points) {
    // 최종 스무딩 좌표를 우선 사용하고, 없으면 칼만 보정, 그것도 없으면 raw를 쓴다.
    const lat = point.finalCorrectedLat ?? point.correctedLat ?? point.rawLat
    const lng = point.finalCorrectedLng ?? point.correctedLng ?? point.rawLng
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      coordinates.push([lng, lat])
    }
  }
  return coordinates
}

/**
 * 작업(운행) 세션 상태를 관리한다.
 * - resume(): 재진입 시 진행 중 작업 이어받기
 * - start()/end(): 작업 시작/종료. 종료 시 보정된 트랙을 폴리라인 좌표로 노출
 * 위치 포인트 전송은 Flutter가 직접 담당하므로 여기서는 보내지 않는다.
 */
export function useWorkSession() {
  const session = useSessionStore()

  const activeSession = ref<WorkSession | null>(null)
  const trackCoordinates = ref<Array<[number, number]>>([])
  const busy = ref(false)
  const errorMessage = ref<string | null>(null)

  const isWorking = computed(() => activeSession.value !== null)

  function resolveAndroidId(): string | null {
    return session.androidId
  }

  /** 재진입 시 진행 중인 작업이 있으면 이어받는다. */
  async function resume(): Promise<void> {
    const androidId = resolveAndroidId()
    if (!androidId) return

    try {
      activeSession.value = await getActiveWork(androidId)
    } catch {
      // 조회 실패 시 상태를 바꾸지 않는다.
    }
  }

  /** 작업을 시작한다. 종료 후 남아 있던 트랙은 지운다. */
  async function start(): Promise<void> {
    const androidId = resolveAndroidId()
    if (!androidId || busy.value) return

    busy.value = true
    errorMessage.value = null
    try {
      activeSession.value = await startWork(androidId)
      trackCoordinates.value = []
    } catch {
      errorMessage.value = '작업을 시작하지 못했습니다.'
    } finally {
      busy.value = false
    }
  }

  /** 작업을 종료하고 보정된 트랙을 지도에 표시한다. */
  async function end(): Promise<void> {
    const androidId = resolveAndroidId()
    if (!androidId || busy.value) return

    busy.value = true
    errorMessage.value = null
    try {
      const track = await endWork(androidId)
      activeSession.value = null
      trackCoordinates.value = toTrackCoordinates(track)
    } catch {
      errorMessage.value = '작업을 종료하지 못했습니다.'
    } finally {
      busy.value = false
    }
  }

  return {
    activeSession,
    isWorking,
    trackCoordinates,
    busy,
    errorMessage,
    resume,
    start,
    end,
  }
}
