<script setup lang="ts">
import LogisticsTwinDispatchPanel from '@/features/logged/dashboard/components/logistics-twin-dispatch-panel.vue'
import LogisticsTwinRecordPanel from '@/features/logged/dashboard/components/logistics-twin-record-panel.vue'
import LogisticsTwinRegisterPanel from '@/features/logged/dashboard/components/logistics-twin-register-panel.vue'
import LogisticsTwinRequestPanel from '@/features/logged/dashboard/components/logistics-twin-request-panel.vue'
import type {
  LogisticsTwinObstruction,
  LogisticsTwinPendingLocation,
  LogisticsTwinRecord,
} from '@/features/logged/dashboard/constants/logistics-twin-data'

defineProps<{
  currentStep: number
  obstructions: LogisticsTwinObstruction[]
  selectedObstruction: LogisticsTwinObstruction | null
  targetObstruction: LogisticsTwinObstruction | null
  dispatchConfirmed: boolean
  selectedResourceCodes: string[]
  pendingLocation: LogisticsTwinPendingLocation | null
  records: LogisticsTwinRecord[]
}>()

const emit = defineEmits<{
  registerObstruction: [photo: string | null]
  skipRegister: []
  selectObstruction: [item: LogisticsTwinObstruction]
  requestMove: [item: LogisticsTwinObstruction]
  confirmDispatch: []
  toggleResource: [code: string]
  updateStep: [step: number]
  completeRecord: []
  restart: []
}>()
</script>

<template>
  <LogisticsTwinRegisterPanel
    v-if="currentStep === 3"
    :pending-location="pendingLocation"
    @register-obstruction="emit('registerObstruction', $event)"
    @skip-register="emit('skipRegister')"
  />

  <LogisticsTwinRequestPanel
    v-else-if="currentStep === 4 && selectedObstruction"
    :obstructions="obstructions"
    :selected-obstruction="selectedObstruction"
    @select-obstruction="emit('selectObstruction', $event)"
    @request-move="emit('requestMove', $event)"
  />

  <LogisticsTwinDispatchPanel
    v-else-if="currentStep === 5 && targetObstruction"
    :target-obstruction="targetObstruction"
    :dispatch-confirmed="dispatchConfirmed"
    :selected-resource-codes="selectedResourceCodes"
    @toggle-resource="emit('toggleResource', $event)"
    @confirm-dispatch="emit('confirmDispatch')"
    @complete-record="emit('completeRecord')"
  />

  <LogisticsTwinRecordPanel
    v-else
    :records="records"
    @restart="emit('restart')"
  />
</template>
