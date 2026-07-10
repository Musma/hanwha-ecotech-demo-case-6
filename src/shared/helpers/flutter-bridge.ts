import {
  FLUTTER_ANDROID_ID_EVENT,
  FLUTTER_ANDROID_ID_GLOBAL,
} from '@/shared/constants/flutter-bridge'

/**
 * Flutter WebView 브리지 헬퍼.
 * androidId 획득 우선순위:
 *   1. ?androidId= 쿼리(개발 override)
 *   2. window 전역(Flutter 주입) 또는 flutterAndroidId 이벤트
 *   3. (위가 대기 시간 내에 없을 때만) VITE_DEV_ANDROID_ID 개발 기본값
 * 실기기 WebView는 dev 서버를 로드하므로 env 기본값이 존재한다. env를 즉시 쓰면
 * Flutter의 실제 androidId 주입을 가릴 수 있어, 주입을 짧게 기다린 뒤에만 env로 폴백한다.
 */

const ANDROID_ID_WAIT_MS = 2500

function readGlobalAndroidId(): string | null {
  const value = (window as unknown as Record<string, unknown>)[
    FLUTTER_ANDROID_ID_GLOBAL
  ]
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readQueryAndroidId(): string | null {
  const value = new URLSearchParams(window.location.search).get('androidId')
  return value && value.length > 0 ? value : null
}

function readEnvAndroidId(): string | null {
  const value = import.meta.env.VITE_DEV_ANDROID_ID
  return typeof value === 'string' && value.length > 0 ? value : null
}

function extractEventAndroidId(event: Event): string | null {
  const detail = (event as CustomEvent).detail
  if (typeof detail === 'string') return detail.length > 0 ? detail : null
  if (detail && typeof detail.androidId === 'string') {
    return detail.androidId.length > 0 ? detail.androidId : null
  }
  return null
}

/**
 * androidId를 해석해 반환한다. 즉시 확인 가능하면 바로,
 * 아니면 Flutter의 주입 이벤트를 기다렸다가 반환한다. 끝내 없으면 null.
 */
export function resolveAndroidId(): Promise<string | null> {
  // 쿼리 override나 이미 주입된 전역이 있으면 즉시 사용한다.
  const direct = readQueryAndroidId() ?? readGlobalAndroidId()
  if (direct) return Promise.resolve(direct)

  return new Promise((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      window.removeEventListener(FLUTTER_ANDROID_ID_EVENT, onEvent)
      if (timer) clearTimeout(timer)
      resolve(value)
    }

    const onEvent = (event: Event) => {
      const value = extractEventAndroidId(event)
      if (value) finish(value)
    }

    window.addEventListener(FLUTTER_ANDROID_ID_EVENT, onEvent)

    // 리스너 등록과 즉시 확인 사이에 주입됐을 수 있어 한 번 더 확인한다.
    const injected = readGlobalAndroidId()
    if (injected) {
      finish(injected)
      return
    }

    // 대기 시간 내에 Flutter 주입이 없으면 그때 env 개발 기본값으로 폴백한다.
    timer = setTimeout(
      () => finish(readGlobalAndroidId() ?? readEnvAndroidId()),
      ANDROID_ID_WAIT_MS,
    )
  })
}
