import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useSessionStore } from '@/shared/stores/session'

/** 로그인 폼의 입력 상태와 제출 흐름을 담당하는 composable. */
export function useLoginForm() {
  const router = useRouter()
  const session = useSessionStore()

  const username = ref('')
  const password = ref('')
  const passwordVisible = ref(false)
  const submitting = ref(false)

  const canSubmit = computed(
    () => username.value.trim().length > 0 && password.value.length > 0,
  )

  function togglePasswordVisible() {
    passwordVisible.value = !passwordVisible.value
  }

  async function submit() {
    if (!canSubmit.value || submitting.value) return

    submitting.value = true
    try {
      // 테스트용: 실제 인증 없이 아이디·비밀번호가 비어있지 않으면 통과시킨다.
      session.login()
      await router.replace({ name: 'dashboard' })
    } finally {
      submitting.value = false
    }
  }

  return {
    username,
    password,
    passwordVisible,
    submitting,
    canSubmit,
    togglePasswordVisible,
    submit,
  }
}
