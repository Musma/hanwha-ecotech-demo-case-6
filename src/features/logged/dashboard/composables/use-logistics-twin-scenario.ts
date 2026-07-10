import { computed, shallowRef } from 'vue'

import {
  LOGISTICS_TWIN_DROP_ZONE,
  LOGISTICS_TWIN_OBSTRUCTIONS,
  type LogisticsTwinObstruction,
  type LogisticsTwinRecord,
  getLogisticsTwinTone,
} from '@/features/logged/dashboard/constants/logistics-twin-data'
import type { MapEntityMarkerItem } from '@/shared/types/map/yard-map'

export function useLogisticsTwinScenario() {
  const currentStep = shallowRef(1)
  const obstructions = shallowRef<LogisticsTwinObstruction[]>(
    LOGISTICS_TWIN_OBSTRUCTIONS.map((item) => ({ ...item })),
  )
  const selectedId = shallowRef(LOGISTICS_TWIN_OBSTRUCTIONS[0]?.id ?? '')
  const targetId = shallowRef('')
  const selectedDispatchResourceCodes = shallowRef<string[]>([])
  const dispatchConfirmed = shallowRef(false)
  const pendingLocation = shallowRef<{
    label: string
    phys: [number, number]
    lngLat: [number, number]
  } | null>(null)
  const records = shallowRef<LogisticsTwinRecord[]>([])
  const toastMessage = shallowRef('')

  const visibleObstructions = computed(() =>
    obstructions.value.filter((item) => item.status !== '완료'),
  )

  const selectedObstruction = computed(
    () =>
      visibleObstructions.value.find((item) => item.id === selectedId.value) ??
      visibleObstructions.value[0] ??
      null,
  )

  const targetObstruction = computed(
    () =>
      obstructions.value.find((item) => item.id === targetId.value) ??
      selectedObstruction.value,
  )

  const mapMarkers = computed<MapEntityMarkerItem[]>(() => {
    if (currentStep.value < 3) return []

    const obstructionMarkers = visibleObstructions.value.map((item) => ({
      id: item.id,
      label: item.label,
      name: item.name,
      phys: item.lngLat,
      selected: currentStep.value >= 4 && item.id === selectedId.value,
      tone:
        getLogisticsTwinTone(item.days) === 'danger'
          ? 'obstruction-danger'
          : 'obstruction-warn',
    }))

    if (currentStep.value !== 5) return obstructionMarkers

    const target = targetObstruction.value
    const waitingVehicleMarker: MapEntityMarkerItem[] =
      !dispatchConfirmed.value && target
        ? [
            {
              id: 'waiting-vehicle',
              label: '배차 대기',
              name: '대기 차량',
              phys: [
                target.lngLat[0] +
                  (LOGISTICS_TWIN_DROP_ZONE.lngLat[0] - target.lngLat[0]) * 0.3,
                target.lngLat[1] +
                  (LOGISTICS_TWIN_DROP_ZONE.lngLat[1] - target.lngLat[1]) * 0.3,
              ],
              tone: 'vehicle',
            },
          ]
        : []

    return [
      ...obstructionMarkers,
      {
        id: 'drop-zone',
        label: '집하',
        name: LOGISTICS_TWIN_DROP_ZONE.jibun,
        phys: LOGISTICS_TWIN_DROP_ZONE.lngLat,
        tone: 'drop-zone',
      },
      ...waitingVehicleMarker,
    ]
  })

  const trackCoordinates = computed<Array<[number, number]>>(() => {
    if (currentStep.value !== 5 || !targetObstruction.value) return []
    return [targetObstruction.value.lngLat, LOGISTICS_TWIN_DROP_ZONE.lngLat]
  })

  const livePosition = computed(() => {
    if (
      currentStep.value !== 5 ||
      !dispatchConfirmed.value ||
      !targetObstruction.value
    )
      return null
    const [lng, lat] = targetObstruction.value.lngLat
    return { lng, lat, label: '조치중' }
  })

  function updateObstructionStatus(
    id: string,
    status: LogisticsTwinObstruction['status'],
  ) {
    obstructions.value = obstructions.value.map((item) =>
      item.id === id ? { ...item, status } : item,
    )
  }

  function showToast(message: string) {
    toastMessage.value = message
    window.setTimeout(() => {
      if (toastMessage.value === message) toastMessage.value = ''
    }, 2400)
  }

  function unlockTablet() {
    currentStep.value = 3
    showToast('태블릿 잠금이 해제되었습니다')
  }

  function pickRegisterLocation() {
    pendingLocation.value = {
      label: '084, 011',
      phys: [84, 11],
      lngLat: [127.599214, 34.902932],
    }
    showToast('가시화 화면에서 간섭물 위치가 선택되었습니다')
  }

  function registerObstruction() {
    const pending = pendingLocation.value
    if (!pending) return

    const newItem: LogisticsTwinObstruction = {
      id: 'OBS-2605-101',
      label: 'OB51',
      name: '신규 적치 자재',
      kind: '자재(배관)',
      jibun: '1Y-도로-084-011',
      phys: pending.phys,
      lngLat: pending.lngLat,
      days: 0,
      foundAt: '2026.05.22 13:20',
      reporter: 'HSE 담당자',
      status: '확인',
      detail: '현장에서 등재된 도로 간섭물입니다.',
    }

    obstructions.value = [
      newItem,
      ...obstructions.value.filter((item) => item.id !== newItem.id),
    ]
    selectedId.value = newItem.id
    pendingLocation.value = null
    currentStep.value = 4
    showToast('도로 간섭물이 등재되었습니다')
  }

  function skipRegister() {
    pendingLocation.value = null
    currentStep.value = 4
    showToast('기존 도로 간섭물 조치요청으로 이동합니다')
  }

  function selectObstruction(item: LogisticsTwinObstruction) {
    selectedId.value = item.id
    currentStep.value = Math.max(currentStep.value, 4)
    dispatchConfirmed.value = false
    showToast(`${item.label} 간섭물을 선택했습니다`)
  }

  function requestMove(item: LogisticsTwinObstruction) {
    selectedId.value = item.id
    targetId.value = item.id
    updateObstructionStatus(item.id, '이동요청')
    currentStep.value = 5
    selectedDispatchResourceCodes.value = []
    dispatchConfirmed.value = false
    showToast('지번체계 기반 간섭물 이동을 요청하였습니다')
  }

  function toggleDispatchResource(code: string) {
    if (dispatchConfirmed.value) return

    selectedDispatchResourceCodes.value =
      selectedDispatchResourceCodes.value.includes(code)
        ? selectedDispatchResourceCodes.value.filter((item) => item !== code)
        : [...selectedDispatchResourceCodes.value, code]
  }

  function confirmDispatch() {
    if (selectedDispatchResourceCodes.value.length === 0) {
      showToast('배차 자원을 한 대 이상 선택해 주세요')
      return
    }

    if (targetId.value) updateObstructionStatus(targetId.value, '배차확정')
    dispatchConfirmed.value = true
    showToast('배차가 확정되어 모바일 오더를 전달하였습니다')
  }

  function completeRecord() {
    const target = targetObstruction.value
    if (target) {
      updateObstructionStatus(target.id, '완료')
      records.value = [
        {
          id: target.id,
          name: target.name,
          jibun: target.jibun,
          equip: selectedDispatchResourceCodes.value.join(', '),
          at: '2026.05.22 09:35',
        },
        ...records.value,
      ]
    }
    currentStep.value = 6
    dispatchConfirmed.value = false
    showToast('간섭물 이동 실적이 기록되었습니다')
  }

  function restartScenario() {
    currentStep.value = 1
    obstructions.value = LOGISTICS_TWIN_OBSTRUCTIONS.map((item) => ({
      ...item,
    }))
    selectedId.value = LOGISTICS_TWIN_OBSTRUCTIONS[0]?.id ?? ''
    targetId.value = ''
    selectedDispatchResourceCodes.value = []
    dispatchConfirmed.value = false
    pendingLocation.value = null
    records.value = []
    toastMessage.value = ''
  }

  return {
    completeRecord,
    confirmDispatch,
    currentStep,
    dispatchConfirmed,
    livePosition,
    mapMarkers,
    pendingLocation,
    pickRegisterLocation,
    records,
    registerObstruction,
    requestMove,
    restartScenario,
    selectObstruction,
    selectedDispatchResourceCodes,
    selectedObstruction,
    skipRegister,
    targetObstruction,
    toastMessage,
    toggleDispatchResource,
    trackCoordinates,
    unlockTablet,
    visibleObstructions,
  }
}
