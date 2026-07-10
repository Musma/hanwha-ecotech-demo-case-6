<script setup lang="ts">
import {
  LOGISTICS_TWIN_DISPATCH_RESOURCES,
  LOGISTICS_TWIN_DROP_ZONE,
  type LogisticsTwinObstruction,
} from '@/features/logged/dashboard/constants/logistics-twin-data'

defineProps<{
  targetObstruction: LogisticsTwinObstruction
  dispatchConfirmed: boolean
}>()

const emit = defineEmits<{
  confirmDispatch: []
  completeRecord: []
}>()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
      <div>
        <p class="text-s2 font-bold text-hw-text-primary">조치</p>
        <p class="mt-2 text-b3 text-hw-gray-dark">
          {{ targetObstruction.name }}을
          {{ LOGISTICS_TWIN_DROP_ZONE.jibun }}으로 이동합니다.
        </p>
      </div>

      <dl class="space-y-2 rounded-lg bg-hw-white-lighter p-3 text-c1">
        <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
          <dt class="text-hw-gray-dark">이동 대상</dt>
          <dd class="font-semibold text-hw-text-primary">
            {{ targetObstruction.id }} · {{ targetObstruction.name }}
          </dd>
        </div>
        <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
          <dt class="text-hw-gray-dark">출발</dt>
          <dd class="font-semibold text-hw-text-primary">
            {{ targetObstruction.jibun }}
          </dd>
        </div>
        <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
          <dt class="text-hw-gray-dark">도착</dt>
          <dd class="font-semibold text-hw-text-primary">
            {{ LOGISTICS_TWIN_DROP_ZONE.jibun }} ·
            {{ LOGISTICS_TWIN_DROP_ZONE.label }}
          </dd>
        </div>
      </dl>

      <div>
        <p class="mb-2 text-c1 font-bold text-hw-gray-darker">
          추천 배차 자원 {{ LOGISTICS_TWIN_DISPATCH_RESOURCES.length }}대
        </p>
        <ul class="space-y-2">
          <li
            v-for="resource in LOGISTICS_TWIN_DISPATCH_RESOURCES"
            :key="resource.code"
            class="flex items-center gap-2 rounded-md border border-hw-gray-lighter bg-hw-white-main p-2"
          >
            <i class="ti ti-truck text-h5 text-hw-gray-dark" />
            <span class="min-w-0 flex-1">
              <b class="block truncate text-s2 text-hw-text-primary">
                {{ resource.code }}
              </b>
              <span class="block truncate text-c1 text-hw-gray-dark">
                {{ resource.group }} · {{ resource.ton }} ·
                {{ resource.driver }}
              </span>
            </span>
            <span
              class="rounded-sm px-2 py-0.5 text-c1 font-bold"
              :class="
                resource.status === '대기'
                  ? 'bg-hw-green-lighter text-hw-green-darker'
                  : 'bg-hw-blue-lighter text-hw-blue-darker'
              "
            >
              {{ resource.status }}
            </span>
          </li>
        </ul>
      </div>

      <div
        v-if="dispatchConfirmed"
        class="overflow-hidden rounded-lg border border-hw-blue-lighter bg-hw-white-lighter"
      >
        <div
          class="bg-hw-blue-dark px-3 py-2 text-c1 font-bold text-hw-white-main"
        >
          <i class="ti ti-device-mobile mr-1" aria-hidden="true" />
          모바일 오더 · 신호수/운전자 수신
        </div>
        <div class="space-y-2 p-3 text-c1">
          <div
            class="flex items-center justify-between gap-2 rounded-md border border-hw-gray-lighter bg-hw-white-main p-2"
          >
            <span>{{ targetObstruction.jibun }}</span>
            <i class="ti ti-arrow-right text-hw-orange-main" />
            <span>{{ LOGISTICS_TWIN_DROP_ZONE.jibun }}</span>
          </div>
          <p>
            배차 장비:
            {{
              LOGISTICS_TWIN_DISPATCH_RESOURCES.map(
                (resource) => resource.code,
              ).join(', ')
            }}
          </p>
          <p class="font-bold text-hw-green-dark">
            <i class="ti ti-circle-check mr-1" aria-hidden="true" />
            신호수·운전자 수신 확인
          </p>
        </div>
      </div>
    </div>

    <div
      class="-mx-4 -mb-4 mt-4 shrink-0 border-t border-hw-gray-lighter bg-hw-white-lighter p-3"
    >
      <button
        type="button"
        class="w-full rounded-md bg-hw-orange-main px-4 py-3 text-s2 font-bold text-hw-white-main transition-colors hover:bg-hw-orange-dark"
        @click="
          dispatchConfirmed ? emit('completeRecord') : emit('confirmDispatch')
        "
      >
        <i
          :class="dispatchConfirmed ? 'ti ti-flag-check' : 'ti ti-checkbox'"
          class="mr-1"
          aria-hidden="true"
        />
        {{ dispatchConfirmed ? '이동 완료 처리' : '배차 확정' }}
      </button>
    </div>
  </div>
</template>
