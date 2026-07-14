import { computed, shallowRef } from 'vue'

import {
  LOGISTICS_TWIN_DISPATCH_RESOURCES,
  LOGISTICS_TWIN_NEW_OBSTRUCTION_ID,
  LOGISTICS_TWIN_OBSTRUCTIONS,
  type LogisticsTwinObstruction,
  type LogisticsTwinPendingLocation,
  type LogisticsTwinRecord,
  getLogisticsTwinDestination,
  getLogisticsTwinTone,
  getLogisticsTwinToneLabel,
} from '@/features/logged/dashboard/constants/logistics-twin-data'
import type { MapEntityMarkerItem } from '@/shared/types/map/yard-map'

const NEW_OBSTRUCTION_VEHICLE_MARKER_OFFSET_Y = -34
const NEW_OBSTRUCTION_VEHICLE_MARKER_OFFSET_X = 22

export function useLogisticsTwinScenario() {
  const currentStep = shallowRef(1)
  const obstructions = shallowRef<LogisticsTwinObstruction[]>(
    LOGISTICS_TWIN_OBSTRUCTIONS.map((item) => ({ ...item })),
  )
  const selectedId = shallowRef('')
  const markerInfoId = shallowRef('')
  const targetId = shallowRef('')
  const selectedDispatchResourceCodes = shallowRef<string[]>([])
  const dispatchConfirmed = shallowRef(false)
  const pendingLocation = shallowRef<LogisticsTwinPendingLocation | null>(null)
  const records = shallowRef<LogisticsTwinRecord[]>([])
  const toastMessage = shallowRef('')

  const visibleObstructions = computed(() =>
    obstructions.value.filter((item) => item.status !== '완료'),
  )

  const selectedObstruction = computed(
    () =>
      visibleObstructions.value.find((item) => item.id === selectedId.value) ??
      null,
  )

  const targetObstruction = computed(
    () =>
      obstructions.value.find((item) => item.id === targetId.value) ??
      selectedObstruction.value,
  )

  const mapMarkers = computed<MapEntityMarkerItem[]>(() => {
    if (currentStep.value < 3) return []

    const obstructionMarkers = visibleObstructions.value
      .filter(
        (item) =>
          !(
            currentStep.value === 5 &&
            dispatchConfirmed.value &&
            item.id === targetObstruction.value?.id
          ),
      )
      .map((item) => ({
        id: item.id,
        label: item.label,
        name: item.name,
        phys: item.lngLat,
        selected: currentStep.value >= 4 && item.id === selectedId.value,
        selectable: currentStep.value === 4,
        focusOnSelect: true,
        info:
          currentStep.value === 4 && item.id === markerInfoId.value
            ? {
                label: item.label,
                title: item.name,
                status: item.status,
                imageSrc: item.photo,
                imageAlt: `${item.name} 현장 사진`,
                rows: [
                  { label: '종류', value: item.kind },
                  { label: '위치', value: item.jibun },
                  { label: '발견시기', value: item.foundAt },
                  {
                    label: '간섭기간',
                    value: `${item.days}일 (${getLogisticsTwinToneLabel(item.days)})`,
                  },
                  { label: '보고자', value: item.reporter },
                ],
                description: item.detail,
              }
            : undefined,
        showWave: false,
        tone:
          getLogisticsTwinTone(item.days) === 'danger'
            ? 'obstruction-danger'
            : 'obstruction-warn',
      }))

    if (currentStep.value === 3 && pendingLocation.value) {
      return [
        ...obstructionMarkers,
        {
          id: 'pending-obstruction-location',
          label: '신규',
          name: `등재 위치 ${pendingLocation.value.label}`,
          phys: pendingLocation.value.lngLat,
          selected: true,
          showWave: false,
          tone: 'obstruction-warn',
        },
      ]
    }

    if (currentStep.value !== 5) return obstructionMarkers

    const target = targetObstruction.value
    const destination = getLogisticsTwinDestination(target)
    const isNewObstructionTarget =
      target?.id === LOGISTICS_TWIN_NEW_OBSTRUCTION_ID
    const selectedDispatchResources = LOGISTICS_TWIN_DISPATCH_RESOURCES.filter(
      (resource) => selectedDispatchResourceCodes.value.includes(resource.code),
    )
    const vehicleMarkers: MapEntityMarkerItem[] = target
      ? selectedDispatchResources.map((resource, index) => {
          const routeRatio = 0.25 + index * 0.1
          const waitingPosition: [number, number] = isNewObstructionTarget
            ? target.lngLat
            : [
                target.lngLat[0] +
                  (destination.lngLat[0] - target.lngLat[0]) * routeRatio,
                target.lngLat[1] +
                  (destination.lngLat[1] - target.lngLat[1]) * routeRatio,
              ]

          return {
            id: `scenario-vehicle-${resource.code}`,
            label: resource.code,
            name: `${resource.group} ${resource.code}`,
            iconClass:
              resource.group === '지게차' ? 'ti ti-forklift' : 'ti ti-truck',
            phys: waitingPosition,
            offset: isNewObstructionTarget
              ? ([
                  index % 2 === 0
                    ? -NEW_OBSTRUCTION_VEHICLE_MARKER_OFFSET_X
                    : NEW_OBSTRUCTION_VEHICLE_MARKER_OFFSET_X,
                  NEW_OBSTRUCTION_VEHICLE_MARKER_OFFSET_Y,
                ] as [number, number])
              : undefined,
            tone: 'vehicle',
            updatesTrack: index === 0,
            motion: dispatchConfirmed.value
              ? {
                  stop: target.lngLat,
                  destination: destination.lngLat,
                  approachDurationMs: 1800 + index * 300,
                  dwellDurationMs: 2000,
                  departureDurationMs: 5000 + index * 300,
                }
              : undefined,
          }
        })
      : []

    return [
      ...obstructionMarkers,
      {
        id: 'drop-zone',
        label: '목적지',
        name: destination.jibun,
        phys: destination.lngLat,
        tone: 'drop-zone',
      },
      ...vehicleMarkers,
    ]
  })

  const trackCoordinates = computed<Array<[number, number]>>(() => {
    if (currentStep.value !== 5 || !targetObstruction.value) return []
    return [
      targetObstruction.value.lngLat,
      getLogisticsTwinDestination(targetObstruction.value).lngLat,
    ]
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
    selectedId.value = ''
    markerInfoId.value = ''
    currentStep.value = 4
    showToast('태블릿 잠금이 해제되었습니다')
  }

  function startRegister() {
    pendingLocation.value = null
    markerInfoId.value = ''
    currentStep.value = 3
  }

  function showObstructionList() {
    pendingLocation.value = null
    selectedId.value = ''
    markerInfoId.value = ''
    currentStep.value = 4
  }

  function pickRegisterLocation(location: LogisticsTwinPendingLocation) {
    pendingLocation.value = location
    showToast('가시화 화면에서 간섭물 위치가 선택되었습니다')
  }

  function registerObstruction(photo: string | null) {
    const pending = pendingLocation.value
    if (!pending) return

    const newItem: LogisticsTwinObstruction = {
      id: LOGISTICS_TWIN_NEW_OBSTRUCTION_ID,
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
      photo: photo || undefined,
    }

    obstructions.value = [
      newItem,
      ...obstructions.value.filter((item) => item.id !== newItem.id),
    ]
    selectedId.value = newItem.id
    markerInfoId.value = newItem.id
    pendingLocation.value = null
    currentStep.value = 4
    showToast('도로 간섭물이 등재되었습니다')
  }

  function selectObstruction(item: LogisticsTwinObstruction) {
    selectedId.value = item.id
    markerInfoId.value = item.id
    currentStep.value = Math.max(currentStep.value, 4)
    dispatchConfirmed.value = false
    showToast(`${item.label} 간섭물을 선택했습니다`)
  }

  function selectObstructionById(id: string) {
    if (currentStep.value !== 4) return

    const item = visibleObstructions.value.find(
      (obstruction) => obstruction.id === id,
    )
    if (item) selectObstruction(item)
  }

  function closeObstructionInfo(id: string) {
    if (currentStep.value !== 4 || markerInfoId.value !== id) return
    markerInfoId.value = ''
  }

  function requestMove(item: LogisticsTwinObstruction) {
    selectedId.value = item.id
    markerInfoId.value = ''
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
    selectedId.value = ''
    markerInfoId.value = ''
    targetId.value = ''
    selectedDispatchResourceCodes.value = []
    dispatchConfirmed.value = false
    pendingLocation.value = null
    records.value = []
    toastMessage.value = ''
  }

  return {
    closeObstructionInfo,
    completeRecord,
    confirmDispatch,
    currentStep,
    dispatchConfirmed,
    mapMarkers,
    pendingLocation,
    pickRegisterLocation,
    records,
    registerObstruction,
    requestMove,
    restartScenario,
    selectObstruction,
    selectObstructionById,
    selectedDispatchResourceCodes,
    selectedObstruction,
    showObstructionList,
    startRegister,
    targetObstruction,
    toastMessage,
    toggleDispatchResource,
    trackCoordinates,
    unlockTablet,
    visibleObstructions,
  }
}
