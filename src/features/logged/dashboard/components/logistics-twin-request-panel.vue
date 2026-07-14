<script setup lang="ts">
import {
  type LogisticsTwinObstruction,
  getLogisticsTwinTone,
  getLogisticsTwinToneLabel,
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

      <div
        v-if="!selectedObstruction"
        class="flex min-h-48 flex-col items-center justify-center border-t border-hw-gray-lighter px-6 py-8 text-center"
      >
        <span
          class="mb-3 flex size-10 items-center justify-center rounded-full bg-hw-white-dark text-h5 text-hw-gray-main"
        >
          <i class="ti ti-hand-click" aria-hidden="true" />
        </span>
        <b class="text-s2 text-hw-text-primary">선택된 간섭물이 없습니다</b>
        <p class="mt-1 text-c1 text-hw-gray-dark">
          목록에서 이동을 요청할 간섭물을 선택하세요.
        </p>
      </div>

      <div v-else class="border-t border-hw-gray-lighter px-3 py-3">
        <div class="mb-2 flex items-center justify-between">
          <b class="text-s2 text-hw-text-primary">
            {{ selectedObstruction.id }}
          </b>
          <span
            class="rounded-sm bg-hw-green-lighter px-2 py-0.5 text-c1 font-bold text-hw-green-darker"
          >
            {{ selectedObstruction.status }}
          </span>
        </div>
        <img
          v-if="selectedObstruction.photo"
          :src="selectedObstruction.photo"
          :alt="`${selectedObstruction.name} 현장 사진`"
          class="mb-3 h-32 w-full rounded-md border border-hw-gray-lighter object-cover"
        />
        <div
          v-else
          class="mb-3 flex min-h-28 items-center justify-center rounded-md border border-dashed border-hw-gray-lighter bg-hw-white-lighter text-c1 text-hw-gray-dark"
        >
          <i class="ti ti-photo mr-1" aria-hidden="true" />
          현장 사진 (추후 등록)
        </div>
        <dl class="space-y-2 text-c1">
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">간섭물명</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ selectedObstruction.name }}
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">종류</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ selectedObstruction.kind }}
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">발견시기</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ selectedObstruction.foundAt }}
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">위치</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ selectedObstruction.jibun }}
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">간섭기간</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ selectedObstruction.days }}일 ({{
                getLogisticsTwinToneLabel(selectedObstruction.days)
              }})
            </dd>
          </div>
          <div class="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <dt class="text-hw-gray-dark">보고자</dt>
            <dd class="font-semibold text-hw-text-primary">
              {{ selectedObstruction.reporter }}
            </dd>
          </div>
        </dl>
        <p class="mt-3 text-b3 text-hw-gray-dark">
          {{ selectedObstruction.detail }}
        </p>
      </div>
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
