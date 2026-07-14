<script setup lang="ts">
import {
  type LogisticsTwinObstruction,
  getLogisticsTwinTone,
} from '@/features/logged/dashboard/constants/logistics-twin-data'

defineProps<{
  obstructions: LogisticsTwinObstruction[]
  selectedObstruction: LogisticsTwinObstruction | null
}>()

const emit = defineEmits<{
  selectObstruction: [item: LogisticsTwinObstruction]
  requestMove: [item: LogisticsTwinObstruction]
}>()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="main-scroll-style min-h-0 flex-1 overflow-y-auto">
      <div
        class="flex items-center justify-between border-b border-hw-gray-lighter bg-hw-white-lighter px-3 py-2"
      >
        <span class="text-c1 font-semibold text-hw-gray-dark">
          조치할 간섭물을 선택하세요
        </span>
        <span
          class="rounded-full bg-hw-white-dark px-2 py-0.5 text-c1 font-bold text-hw-gray-darker"
        >
          전체 {{ obstructions.length }}건
        </span>
      </div>
      <button
        v-for="item in obstructions"
        :key="item.id"
        type="button"
        class="flex w-full items-center gap-2 border-l-4 px-3 py-2 text-left transition-colors"
        :class="
          item.id === selectedObstruction?.id
            ? 'border-l-hw-orange-main bg-hw-orange-lighter/20'
            : 'border-l-transparent bg-hw-white-main hover:bg-hw-white-lighter'
        "
        @click="emit('selectObstruction', item)"
      >
        <span
          class="flex w-10 shrink-0 justify-center rounded-sm px-1 py-1 text-c1 font-bold"
          :class="
            getLogisticsTwinTone(item.days) === 'danger'
              ? 'bg-hw-red-main text-hw-white-main'
              : 'bg-hw-orange-lighter text-hw-orange-darker'
          "
        >
          {{ item.label }}
        </span>
        <span class="min-w-0 flex-1">
          <b class="block truncate text-s2 text-hw-text-primary">
            {{ item.name }}
          </b>
          <span class="block truncate text-c1 text-hw-gray-dark">
            {{ item.jibun }} · {{ item.kind }}
          </span>
        </span>
        <span class="rounded-sm bg-hw-white-dark px-2 py-0.5 text-c1">
          {{ item.days }}일
        </span>
      </button>
    </div>

    <div
      class="-mx-4 -mb-4 mt-4 grid shrink-0 grid-cols-1 border-t border-hw-gray-lighter bg-hw-white-lighter p-3"
    >
      <button
        type="button"
        class="rounded-md bg-hw-orange-main px-3 py-3 text-s2 font-bold text-hw-white-main transition-colors hover:bg-hw-orange-dark disabled:cursor-not-allowed disabled:bg-hw-gray-main"
        :disabled="!selectedObstruction"
        @click="selectedObstruction && emit('requestMove', selectedObstruction)"
      >
        <i class="ti ti-send mr-1" aria-hidden="true" />
        간섭물 이동 요청
      </button>
    </div>
  </div>
</template>
