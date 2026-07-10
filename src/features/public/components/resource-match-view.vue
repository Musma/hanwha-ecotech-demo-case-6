<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { checkResourceMatch } from '@/features/public/api/transport-resource'
import { RESOURCE_MATCH_TEXT } from '@/features/public/constants/resource-match'
import { Button } from '@/shared/components/ui/button'
import { useSessionStore } from '@/shared/stores/session'

// 차량 매칭(연동) 대기 카드.
// 매칭 확인은 앱 시작 시 1회 실행되며, '연결 확인' 버튼으로 수동 재확인한다.
// 재확인해서 연동됐으면 로그인 화면으로 넘어간다.
const router = useRouter()
const session = useSessionStore()

const checking = ref(false)
const showStillNotMatched = ref(false)

const androidId = computed(() => session.androidId)

async function handleCheckConnection() {
  if (checking.value) return

  const id = session.androidId
  if (!id) {
    showStillNotMatched.value = true
    return
  }

  checking.value = true
  showStillNotMatched.value = false
  try {
    const result = await checkResourceMatch(id)
    session.setMatchedResource(
      result.matched && result.resource ? result.resource : null,
    )
    if (result.matched) {
      await router.push({ name: 'login' })
      return
    }
    showStillNotMatched.value = true
  } catch {
    showStillNotMatched.value = true
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div
    class="flex h-screen w-full items-center justify-center bg-hw-white-lighter px-6"
  >
    <div
      class="w-[420px] max-w-full rounded-3xl bg-hw-white-main px-10 py-9 shadow-[0_12px_44px_rgba(0,0,0,0.1)]"
    >
      <div class="flex items-center justify-center gap-2.5">
        <span
          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-hw-orange-main to-hw-green-main text-lg text-hw-white-main"
          aria-hidden="true"
        >
          <i class="ti ti-world" />
        </span>
        <span
          class="text-xl font-bold leading-[1.2] tracking-[-0.5px] text-hw-gray-darker"
          >{{ RESOURCE_MATCH_TEXT.brand }}</span
        >
      </div>

      <div class="mt-7 flex justify-center">
        <span
          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-hw-red-main text-xl font-bold text-hw-white-main"
          aria-hidden="true"
        >
          !
        </span>
      </div>

      <p class="mt-5 text-center text-[15px] leading-[1.55] text-hw-gray-dark">
        {{ RESOURCE_MATCH_TEXT.notConnectedTitle1 }}<br />
        {{ RESOURCE_MATCH_TEXT.notConnectedTitle2 }}
      </p>

      <div class="mt-6 rounded-2xl bg-hw-white-lighter px-5 py-4 text-center">
        <p class="text-[13px] font-semibold text-hw-gray-dark">
          {{ RESOURCE_MATCH_TEXT.androidIdLabel }}
        </p>
        <p class="mt-1.5 font-mono text-[15px] text-hw-gray-darker">
          {{ androidId ?? '-' }}
        </p>
      </div>

      <p class="mt-5 text-center text-[13px] text-hw-gray-main">
        {{ RESOURCE_MATCH_TEXT.adminContact }}
      </p>

      <p
        v-if="showStillNotMatched"
        class="mt-2 text-center text-[13px] text-hw-red-main"
      >
        {{ RESOURCE_MATCH_TEXT.stillNotMatched }}
      </p>

      <Button
        type="button"
        variant="brand"
        size="brand"
        class="mt-4 h-[52px] w-full rounded-md text-base font-bold tracking-[-0.3px]"
        :disabled="checking"
        @click="handleCheckConnection"
      >
        {{ RESOURCE_MATCH_TEXT.checkButton }}
      </Button>
    </div>
  </div>
</template>
