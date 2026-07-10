import { http } from '@/shared/api'

/** `POST /transport/work/start`, `GET /transport/work/active`가 반환하는 작업 세션. */
export interface WorkSession {
  id: string
  resourceId: string
  startedAt: string
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

/** 작업 트랙의 개별 위치 포인트. */
export interface WorkTrackPoint {
  pointIndex: number
  recordedAt: string
  rawLat: number
  rawLng: number
  correctedLat: number | null
  correctedLng: number | null
  finalCorrectedLat: number | null
  finalCorrectedLng: number | null
  status: string | null
}

/** `POST /transport/work/end`, `GET /transport/work/:id/track` 응답. */
export interface WorkTrack {
  sessionId: string
  resourceId: string
  startedAt: string
  endedAt: string | null
  points: WorkTrackPoint[]
}

/** 작업을 시작한다. 이미 진행 중인 작업이 있으면 409. */
export async function startWork(androidId: string): Promise<WorkSession> {
  const response = await http.post<WorkSession>('/transport/work/start', {
    androidId,
  })
  return response.data
}

/** 진행 중인 작업을 종료하고 보정된 트랙을 받는다. 진행 중인 작업이 없으면 400. */
export async function endWork(androidId: string): Promise<WorkTrack> {
  const response = await http.post<WorkTrack>('/transport/work/end', {
    androidId,
  })
  return response.data
}

/** 진행 중인 작업을 조회한다(재진입 이어받기용). 없으면 null. */
export async function getActiveWork(
  androidId: string,
): Promise<WorkSession | null> {
  const response = await http.get<WorkSession | null>(
    '/transport/work/active',
    { params: { androidId } },
  )
  return response.data ?? null
}

/** 작업 세션의 트랙을 조회한다. */
export async function getWorkTrack(sessionId: string): Promise<WorkTrack> {
  const response = await http.get<WorkTrack>(
    `/transport/work/${sessionId}/track`,
  )
  return response.data
}
