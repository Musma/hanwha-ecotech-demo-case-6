<script setup lang="ts">
import type { LogisticsTwinRecord } from '@/features/logged/dashboard/constants/logistics-twin-data'

defineProps<{
  records: LogisticsTwinRecord[]
}>()

const emit = defineEmits<{
  restart: []
}>()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
      <div
        class="flex gap-3 rounded-md border border-hw-green-lighter bg-hw-green-lighter p-3"
      >
        <i class="ti ti-circle-check text-h4 text-hw-green-darker" />
        <div>
          <p class="text-s2 font-bold text-hw-green-darker">
            간섭물 이동이 완료되었습니다.
          </p>
          <p class="mt-1 text-b3 text-hw-gray-dark">
            간섭물 등재 시스템에 도로 간섭현황 및 조치 실적이 기록되었습니다.
          </p>
        </div>
      </div>

      <p class="text-c1 font-bold text-hw-gray-darker">
        조치 실적 {{ records.length }}건
      </p>

      <div
        v-for="record in records"
        :key="`${record.id}-${record.at}`"
        class="rounded-md border border-hw-gray-lighter bg-hw-white-main p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <b class="text-s2 text-hw-text-primary">{{ record.id }}</b>
          <span
            class="rounded-sm bg-hw-gray-darker px-2 py-0.5 text-c1 font-bold text-hw-white-main"
          >
            이동완료
          </span>
        </div>
        <p class="mt-2 text-b3 font-semibold text-hw-text-primary">
          {{ record.name }}
        </p>
        <dl class="mt-3 space-y-2 text-c1">
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">위치</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ record.jibun }}
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">배차 장비</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ record.equip }}
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">완료시각</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ record.at }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div
      class="-mx-4 -mb-4 mt-4 shrink-0 border-t border-hw-gray-lighter bg-hw-white-lighter p-3"
    >
      <button
        type="button"
        class="w-full rounded-md border border-hw-gray-lighter bg-hw-white-main px-4 py-3 text-s2 font-bold text-hw-gray-darker transition-colors hover:bg-hw-btn-hover"
        @click="emit('restart')"
      >
        <i class="ti ti-refresh mr-1" aria-hidden="true" />
        시나리오 다시 시작
      </button>
    </div>
  </div>
</template>
