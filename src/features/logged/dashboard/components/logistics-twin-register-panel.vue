<script setup lang="ts">
import { ref, watch } from 'vue'

import type { LogisticsTwinPendingLocation } from '@/features/logged/dashboard/constants/logistics-twin-data'

const props = defineProps<{
  pendingLocation: LogisticsTwinPendingLocation | null
}>()

const emit = defineEmits<{
  registerObstruction: [photo: string | null]
  skipRegister: []
}>()

const photo = ref<string | null>(null)
const photoError = ref('')

const SUPPORTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png'])
const SUPPORTED_PHOTO_NAME_PATTERN = /\.(jpe?g|png)$/i

watch(
  () => props.pendingLocation?.label,
  () => {
    photo.value = null
    photoError.value = ''
  },
)

function handlePhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (
    !SUPPORTED_PHOTO_TYPES.has(file.type) &&
    !SUPPORTED_PHOTO_NAME_PATTERN.test(file.name)
  ) {
    photo.value = null
    photoError.value = 'JPG 또는 PNG 형식의 이미지만 업로드할 수 있습니다.'
    input.value = ''
    return
  }

  photoError.value = ''
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    photo.value = typeof reader.result === 'string' ? reader.result : null
  })
  reader.addEventListener('error', () => {
    photo.value = null
    photoError.value = '사진을 불러오지 못했습니다. 다른 파일을 선택해 주세요.'
  })
  reader.readAsDataURL(file)
  input.value = ''
}

function removePhoto() {
  photo.value = null
  photoError.value = ''
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="main-scroll-style min-h-0 flex-1 space-y-3 overflow-y-auto">
      <div
        class="flex items-start gap-2 rounded-md border border-dashed border-hw-gray-lighter bg-hw-white-lighter p-3 text-b3 text-hw-gray-dark"
      >
        <i class="ti ti-map-pin-plus mt-0.5 text-hw-orange-main" />
        <span>
          디지털트윈 가시화 화면에서 도로 간섭물이 위치한 지번을 클릭하면 해당
          위치가 자동으로 선택됩니다.
        </span>
      </div>

      <div
        aria-live="polite"
        class="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors"
        :class="
          pendingLocation
            ? 'border-hw-orange-main bg-hw-orange-main/10'
            : 'border-hw-gray-lighter bg-hw-white-main'
        "
      >
        <i class="ti ti-click text-h5 text-hw-orange-main" />
        <span class="min-w-0">
          <b class="block text-s2 text-hw-text-primary">
            {{
              pendingLocation
                ? `선택 위치(물리지번) ${pendingLocation.label}`
                : '지도에서 위치 선택'
            }}
          </b>
          <span class="block text-c1 text-hw-gray-dark">
            {{
              pendingLocation
                ? '신규 간섭물 등재 위치가 선택되었습니다'
                : '오른쪽 지도에서 간섭물이 위치한 지번을 클릭하십시오'
            }}
          </span>
        </span>
      </div>

      <div
        v-if="photo"
        class="overflow-hidden rounded-md border border-hw-gray-lighter"
      >
        <img
          :src="photo"
          alt="현장 사진 미리보기"
          class="h-36 w-full object-cover"
        />
        <div class="grid grid-cols-2 border-t border-hw-gray-lighter">
          <div
            class="relative px-3 py-2 text-center text-c1 font-semibold text-hw-gray-darker transition-colors hover:bg-hw-btn-hover"
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              aria-label="현장 사진 다시 선택"
              class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              @change="handlePhotoChange"
            />
            <i class="ti ti-refresh mr-1" aria-hidden="true" />
            다시 선택
          </div>
          <button
            type="button"
            class="border-l border-hw-gray-lighter px-3 py-2 text-c1 font-semibold text-hw-red-dark transition-colors hover:bg-hw-red-lighter"
            @click="removePhoto"
          >
            <i class="ti ti-trash mr-1" aria-hidden="true" />
            제거
          </button>
        </div>
      </div>
      <div
        v-else-if="pendingLocation"
        class="relative flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-hw-gray-lighter bg-hw-white-lighter p-4 text-center text-hw-gray-dark transition-colors hover:border-hw-orange-main hover:bg-hw-orange-lighter/20"
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          aria-label="현장 사진 업로드"
          class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          @change="handlePhotoChange"
        />
        <i
          class="pointer-events-none ti ti-camera-plus text-h3 text-hw-orange-main"
        />
        <span class="pointer-events-none text-s2 font-semibold">
          현장 사진 업로드
        </span>
        <small class="pointer-events-none text-c1">
          클릭하여 JPG 또는 PNG 이미지를 첨부합니다
        </small>
      </div>
      <div
        v-else
        aria-disabled="true"
        class="flex w-full cursor-not-allowed flex-col items-center gap-1 rounded-md border border-dashed border-hw-gray-lighter bg-hw-white-lighter p-4 text-center text-hw-gray-dark"
      >
        <i class="ti ti-camera-plus text-h3 text-hw-gray-main" />
        <span class="text-s2 font-semibold">현장 사진 업로드</span>
        <small id="logistics-twin-photo-help" class="text-c1">
          먼저 지번을 선택하십시오
        </small>
      </div>
      <p v-if="photoError" role="alert" class="text-c1 text-hw-red-dark">
        {{ photoError }}
      </p>

      <div class="space-y-2">
        <label class="block text-c1 font-semibold text-hw-gray-dark">
          간섭물명
          <input
            value="신규 적치 자재"
            readonly
            :disabled="!pendingLocation"
            class="mt-1 w-full rounded-md border border-hw-gray-lighter bg-hw-white-main px-3 py-2 text-b3 text-hw-text-primary disabled:bg-hw-white-dark disabled:text-hw-gray-main"
          />
        </label>
        <label class="block text-c1 font-semibold text-hw-gray-dark">
          간섭물 종류
          <select
            disabled
            class="mt-1 w-full rounded-md border border-hw-gray-lighter bg-hw-white-main px-3 py-2 text-b3 text-hw-text-primary disabled:bg-hw-white-dark disabled:text-hw-gray-main"
          >
            <option>자재(배관)</option>
          </select>
        </label>
        <label class="block text-c1 font-semibold text-hw-gray-dark">
          상세 내용
          <textarea
            readonly
            :disabled="!pendingLocation"
            rows="3"
            class="mt-1 w-full resize-none rounded-md border border-hw-gray-lighter bg-hw-white-main px-3 py-2 text-b3 text-hw-text-primary disabled:bg-hw-white-dark disabled:text-hw-gray-main"
            value="현장에서 등재된 도로 간섭물입니다."
          />
        </label>
        <p class="text-c1 text-hw-gray-dark">
          간섭기간 1일 이내는 주황색, 1일 초과는 붉은색으로 가시화 화면에
          표시됩니다.
        </p>
      </div>
    </div>

    <div
      class="-mx-4 -mb-4 mt-4 flex shrink-0 flex-col gap-2 border-t border-hw-gray-lighter bg-hw-white-lighter p-3"
    >
      <button
        type="button"
        class="w-full rounded-md border border-hw-gray-lighter bg-hw-white-main px-4 py-3 text-s2 font-bold text-hw-gray-darker transition-colors hover:bg-hw-btn-hover"
        @click="emit('skipRegister')"
      >
        <i class="ti ti-list-search mr-1" aria-hidden="true" />
        등재 없이 기존 간섭물 조치요청
      </button>
      <button
        type="button"
        class="w-full rounded-md bg-hw-orange-main px-4 py-3 text-s2 font-bold text-hw-white-main transition-colors hover:bg-hw-orange-dark disabled:bg-hw-gray-main"
        :disabled="!pendingLocation"
        @click="emit('registerObstruction', photo)"
      >
        <i class="ti ti-circle-plus mr-1" aria-hidden="true" />
        간섭물 등록
      </button>
    </div>
  </div>
</template>
