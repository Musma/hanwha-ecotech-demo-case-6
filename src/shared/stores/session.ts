import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import type { MatchedResource } from '@/shared/types/transport'

/**
 * 앱 세션 store.
 * - androidId: Flutter가 주입한 단말 식별자
 * - matchedResource: `/transport/resources/match`로 확인된 차량
 * - isLoggedIn: (테스트) 로그인 완료 여부
 * - locationPermission: Flutter가 전달한 위치 권한 상태
 * 상태는 localStorage에 지속되어 WebView 새로고침/재시작에도 유지된다.
 */

const STORAGE_KEY = 'hw.session'

export type LocationPermission = 'granted' | 'denied' | 'unknown'

interface PersistedSession {
  androidId: string | null
  matchedResource: MatchedResource | null
  isLoggedIn: boolean
}

function readPersisted(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedSession) : null
  } catch {
    return null
  }
}

export const useSessionStore = defineStore('session', () => {
  const persisted = readPersisted()

  const androidId = ref<string | null>(persisted?.androidId ?? null)
  const matchedResource = ref<MatchedResource | null>(
    persisted?.matchedResource ?? null,
  )
  const isLoggedIn = ref<boolean>(persisted?.isLoggedIn ?? false)
  const locationPermission = ref<LocationPermission>('unknown')

  const isMatched = computed(() => matchedResource.value !== null)

  function setAndroidId(value: string | null) {
    androidId.value = value
  }

  function setMatchedResource(value: MatchedResource | null) {
    matchedResource.value = value
  }

  function setLocationPermission(value: LocationPermission) {
    locationPermission.value = value
  }

  /** (테스트) 로그인 완료 처리. */
  function login() {
    isLoggedIn.value = true
  }

  /**
   * 로그아웃: 로그인 세션만 해제한다.
   * 매칭 정보(matchedResource)와 androidId는 유지하므로, 여전히 매칭된 상태면
   * 로그인 화면으로 돌아간다(미연동 카드로 가지 않는다). 매칭 해제는 모니터가 관리한다.
   */
  function logout() {
    isLoggedIn.value = false
    locationPermission.value = 'unknown'
  }

  watch(
    [androidId, matchedResource, isLoggedIn],
    () => {
      const data: PersistedSession = {
        androidId: androidId.value,
        matchedResource: matchedResource.value,
        isLoggedIn: isLoggedIn.value,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // 저장 실패는 무시한다.
      }
    },
    { deep: true },
  )

  return {
    androidId,
    matchedResource,
    isLoggedIn,
    locationPermission,
    isMatched,
    setAndroidId,
    setMatchedResource,
    setLocationPermission,
    login,
    logout,
  }
})
