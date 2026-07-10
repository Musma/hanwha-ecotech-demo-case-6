import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { checkResourceMatch } from '@/features/public/api/transport-resource'
import { resolveAndroidId } from '@/shared/helpers/flutter-bridge'
import { useSessionStore } from '@/shared/stores/session'

/**
 * 앱 시작 시 매칭 상태를 1회 확인한다(폴링 없음).
 * - androidId를 확보한 뒤 `/transport/resources/match`를 한 번 호출해 store를 갱신한다.
 * - 매칭되면(미로그인·매칭 화면) 자동으로 로그인 화면으로 이동한다.
 * - 매칭이 아니면(또는 저장된 매칭이 무효면) 로그아웃하고 매칭 화면으로 되돌린다.
 * 이후 재확인은 매칭 화면의 '연결 확인' 버튼으로 수동으로 한다.
 */
export function useMatchMonitor() {
  const router = useRouter()
  const route = useRoute()
  const session = useSessionStore()

  async function checkOnce() {
    const id = session.androidId
    if (!id) {
      session.setMatchedResource(null)
      return
    }

    try {
      const result = await checkResourceMatch(id)
      session.setMatchedResource(
        result.matched && result.resource ? result.resource : null,
      )
    } catch {
      // 확인 실패 시 직전(저장된) 상태를 유지한다.
    }
  }

  // 매칭 상태 변화에 반응한다.
  watch(
    () => session.isMatched,
    (matched) => {
      if (matched) {
        // 매칭되면 미로그인 상태에서 자동으로 로그인 화면으로 이동한다.
        if (!session.isLoggedIn && route.name === 'auth-match') {
          void router.replace({ name: 'login' })
        }
        return
      }
      // 매칭이 아니면 로그아웃하고 매칭 화면으로 복귀한다.
      if (session.isLoggedIn) session.logout()
      if (route.name !== 'auth-match') {
        void router.replace({ name: 'auth-match' })
      }
    },
  )

  onMounted(async () => {
    const id = await resolveAndroidId()
    session.setAndroidId(id)
    void checkOnce()
  })
}
