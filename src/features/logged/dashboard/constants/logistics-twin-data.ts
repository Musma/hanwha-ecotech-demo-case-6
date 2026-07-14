import drumPhotoUrl from '@/features/logged/dashboard/assets/photos/drum.jpg'
import forkliftPhotoUrl from '@/features/logged/dashboard/assets/photos/forklift.jpg'
import pipePhotoUrl from '@/features/logged/dashboard/assets/photos/pipe.jpg'
import steelPhotoUrl from '@/features/logged/dashboard/assets/photos/steel.webp'
import wastePhotoUrl from '@/features/logged/dashboard/assets/photos/waste.png'

export interface LogisticsTwinStep {
  id: number
  label: string
  icon: string
}

export interface LogisticsTwinObstruction {
  id: string
  label: string
  name: string
  kind: string
  jibun: string
  phys: [number, number]
  lngLat: [number, number]
  days: number
  foundAt: string
  reporter: string
  status: '확인' | '이동요청' | '배차확정' | '완료'
  detail: string
  photo?: string
}

export interface LogisticsTwinPendingLocation {
  label: string
  phys: [number, number]
  lngLat: [number, number]
}

export interface LogisticsTwinDispatchResource {
  code: string
  group: string
  ton: string
  driver: string
  status: '대기' | '운행중'
}

export interface LogisticsTwinRecord {
  id: string
  name: string
  jibun: string
  equip: string
  at: string
}

export interface LogisticsTwinKpi {
  key: string
  label: string
  value: number
  tone: 'danger' | 'warn' | 'info'
}

export interface LogisticsTwinPinPosition {
  x: number
  y: number
}

export const LOGISTICS_TWIN_STEPS: LogisticsTwinStep[] = [
  { id: 1, label: '문제 발생', icon: 'ti ti-alert-triangle' },
  { id: 2, label: '시스템 접속', icon: 'ti ti-login-2' },
  { id: 3, label: '간섭물 등재', icon: 'ti ti-map-pin-plus' },
  { id: 4, label: '조치요청', icon: 'ti ti-map-pin-search' },
  { id: 5, label: '조치', icon: 'ti ti-truck-delivery' },
  { id: 6, label: '실적관리', icon: 'ti ti-clipboard-check' },
]

export const LOGISTICS_TWIN_OBSTRUCTIONS: LogisticsTwinObstruction[] = [
  {
    id: 'OBS-2605-014',
    label: 'OB14',
    name: '적치 배관 다발',
    kind: '자재(배관)',
    jibun: '1Y-도로-A14',
    phys: [84, 11],
    lngLat: [127.598642, 34.902502],
    days: 2,
    foundAt: '2026.05.22 08:10',
    reporter: '생산운영파트 김현수',
    status: '확인',
    detail: '도로 중앙에 적치된 배관 자재 다발로 트랜스포터 통행이 불가합니다.',
    photo: pipePhotoUrl,
  },
  {
    id: 'OBS-2605-009',
    label: 'OB09',
    name: '폐자재 더미',
    kind: '폐기물',
    jibun: '1Y-도로-B07',
    phys: [64, 25],
    lngLat: [127.596936, 34.900507],
    days: 3,
    foundAt: '2026.05.21 14:32',
    reporter: '생산운영파트 이몽룡',
    status: '확인',
    detail: '절단 폐자재가 도로변에 방치되어 보행과 통행에 지장이 있습니다.',
    photo: wastePhotoUrl,
  },
  {
    id: 'OBS-2605-018',
    label: 'OB18',
    name: '고장 정지 장비',
    kind: '장비',
    jibun: '1Y-도로-071-027',
    phys: [71, 27],
    lngLat: [127.59570229701602, 34.901882391068284],
    days: 4,
    foundAt: '2026.05.20 09:05',
    reporter: '생산운영파트 성춘향',
    status: '확인',
    detail: '고장으로 정지한 지게차가 교차로를 점유하고 있습니다.',
    photo: forkliftPhotoUrl,
  },
  {
    id: 'OBS-2605-021',
    label: 'OB21',
    name: '임시 적치 강재',
    kind: '자재(강재)',
    jibun: '1Y-도로-074-025',
    phys: [74, 25],
    lngLat: [127.59582636387162, 34.90218988351647],
    days: 0,
    foundAt: '2026.05.22 11:40',
    reporter: '생산운영파트 변학도',
    status: '확인',
    detail: '금일 임시 적치된 강재로, 단기 통행 우회가 필요합니다.',
    photo: steelPhotoUrl,
  },
  {
    id: 'OBS-2605-022',
    label: 'OB22',
    name: '방치 드럼통',
    kind: '기타',
    jibun: '1Y-도로-098-026',
    phys: [98, 26],
    lngLat: [127.59796527767313, 34.903446429029785],
    days: 1,
    foundAt: '2026.05.21 17:20',
    reporter: '생산운영파트 황비홍',
    status: '확인',
    detail: '드럼통 2기가 도로 갓길에 방치되어 있습니다.',
    photo: drumPhotoUrl,
  },
]

export const LOGISTICS_TWIN_KPIS: LogisticsTwinKpi[] = [
  { key: 'prod', label: '생산량 달성률', value: 60, tone: 'danger' },
  { key: 'plan', label: '계획 적중률', value: 70, tone: 'danger' },
  { key: 'load', label: '부하 평준화율', value: 85, tone: 'info' },
  { key: 'inbound', label: '적기 입고율', value: 90, tone: 'info' },
  { key: 'mat', label: '자재 준비율', value: 60, tone: 'warn' },
  { key: 'accident', label: '재해율', value: 77, tone: 'info' },
  { key: 'ltir', label: 'LTIR', value: 77, tone: 'info' },
]

export const LOGISTICS_TWIN_PIN_POSITIONS: Record<
  string,
  LogisticsTwinPinPosition
> = {
  'OBS-2605-014': { x: 47, y: 49 },
  'OBS-2605-009': { x: 38, y: 60 },
  'OBS-2605-018': { x: 29, y: 54 },
  'OBS-2605-021': { x: 61, y: 44 },
  'OBS-2605-022': { x: 60, y: 57 },
}

export const LOGISTICS_TWIN_NEW_OBSTRUCTION_ID = 'OBS-2605-101'

export const LOGISTICS_TWIN_DROP_ZONE = {
  label: '목적지',
  jibun: '1Y-집하-01',
  phys: [142, 6] as [number, number],
  lngLat: [127.602706, 34.904926] as [number, number],
}

export const LOGISTICS_TWIN_NEW_DESTINATION = {
  label: '목적지',
  jibun: '(082, 022)',
  phys: [82, 22] as [number, number],
  lngLat: [127.5963146493744, 34.902844506915244] as [number, number],
}

export function getLogisticsTwinDestination(
  obstruction?: LogisticsTwinObstruction | null,
) {
  return obstruction?.id === LOGISTICS_TWIN_NEW_OBSTRUCTION_ID
    ? LOGISTICS_TWIN_NEW_DESTINATION
    : LOGISTICS_TWIN_DROP_ZONE
}

export const LOGISTICS_TWIN_DISPATCH_RESOURCES: LogisticsTwinDispatchResource[] =
  [
    {
      code: 'TR-07',
      group: '트랜스포터',
      ton: '120T',
      driver: '김신호',
      status: '대기',
    },
    {
      code: 'FL-12',
      group: '지게차',
      ton: '16T',
      driver: '박운행',
      status: '대기',
    },
  ]

export function getLogisticsTwinTone(days: number) {
  return Number(days) <= 1 ? 'warn' : 'danger'
}

export function getLogisticsTwinToneLabel(days: number) {
  return Number(days) <= 1 ? '간섭기간 1일 이내' : '간섭기간 1일 초과'
}
