<script setup lang="ts">
import DashboardYardMap from '@/features/logged/dashboard/components/dashboard-yard-map.vue'
import LogisticsTwinScenarioCard from '@/features/logged/dashboard/components/logistics-twin-scenario-card.vue'
import TabletUnlockSlider from '@/features/logged/dashboard/components/tablet-unlock-slider.vue'
import { useDashboardMapState } from '@/features/logged/dashboard/composables/use-dashboard-map-state'
import { useLogisticsTwinScenario } from '@/features/logged/dashboard/composables/use-logistics-twin-scenario'
import { useTabletClock } from '@/features/logged/dashboard/composables/use-tablet-clock'
import { DASHBOARD_DEFAULT_MAP_STYLE } from '@/features/logged/dashboard/constants/dashboard-map-overlay'
import LoggedPageShell from '@/shared/components/logged-page-shell.vue'

const { jibunPolygons } = useDashboardMapState()
const { currentDate, currentTime } = useTabletClock()
const tabletBackgroundImage = `url(${import.meta.env.BASE_URL}login.webp)`
const {
  completeRecord,
  confirmDispatch,
  currentStep,
  dispatchConfirmed,
  mapMarkers,
  pendingLocation,
  pickRegisterLocation,
  records,
  registerObstruction,
  requestMove,
  restartScenario,
  selectObstruction,
  selectedDispatchResourceCodes,
  selectedObstruction,
  skipRegister,
  targetObstruction,
  toastMessage,
  trackCoordinates,
  toggleDispatchResource,
  unlockTablet,
  visibleObstructions,
} = useLogisticsTwinScenario()
</script>

<template>
  <LoggedPageShell>
    <section class="flex h-full min-h-0 flex-col gap-4">
      <div class="flex min-h-0 flex-1 items-center justify-center">
        <div
          class="relative aspect-[10/16] w-full max-w-sm rounded-3xl border-[10px] border-hw-gray-darker bg-hw-gray-darker shadow-2xl sm:aspect-[16/10] sm:max-w-6xl"
        >
          <span
            class="absolute left-1/2 top-2 z-10 h-1.5 w-24 -translate-x-1/2 rounded-full bg-hw-gray-main"
          />

          <div
            class="absolute inset-6 overflow-hidden rounded-2xl border border-hw-gray-dark bg-hw-white-lighter text-hw-text-primary"
          >
            <div
              class="flex h-11 items-center justify-between bg-hw-gray-darker px-4 text-c1 font-semibold text-hw-white-main"
            >
              <span>
                <i class="ti ti-device-tablet mr-1" aria-hidden="true" />
                에코텍 물류 · 현장 태블릿 PC
              </span>
              <span>
                <i class="ti ti-wifi mr-1" aria-hidden="true" />
                {{ currentTime }}
              </span>
            </div>

            <div class="relative h-[calc(100%-44px)] overflow-hidden">
              <DashboardYardMap
                class="absolute inset-0 rounded-none border-0"
                :fixed-overlay-visible="true"
                :map-style="DASHBOARD_DEFAULT_MAP_STYLE"
                :polygons="jibunPolygons"
                :map-markers="mapMarkers"
                :track-coordinates="trackCoordinates"
                :track-animated="dispatchConfirmed"
              >
                <div
                  class="pointer-events-none absolute right-4 top-4 z-10 rounded-md border border-hw-gray-lighter bg-hw-white-main/90 p-3 text-c1 font-semibold text-hw-text-primary shadow-sm"
                >
                  <p class="mb-2 text-c1 font-bold text-hw-gray-darker">
                    도로 간섭 현황
                  </p>
                  <div class="space-y-1">
                    <span class="flex items-center gap-2">
                      <span class="size-2 rounded-full bg-hw-orange-main" />
                      간섭기간 1일 이내
                    </span>
                    <span class="flex items-center gap-2">
                      <span class="size-2 rounded-full bg-hw-red-main" />
                      간섭기간 1일 초과
                    </span>
                  </div>
                </div>

                <div
                  class="pointer-events-none absolute left-4 top-4 z-10 rounded-md bg-hw-gray-darker/85 px-3 py-2 text-c1 font-semibold text-hw-white-main shadow-sm"
                >
                  <i class="ti ti-map-2 mr-1" aria-hidden="true" />
                  물류 Twin
                </div>
              </DashboardYardMap>

              <Transition
                mode="out-in"
                enter-active-class="transition duration-300 ease-smooth motion-reduce:transition-none"
                enter-from-class="opacity-0 scale-[0.99]"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-200 ease-smooth motion-reduce:transition-none"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-[0.99]"
              >
                <div
                  v-if="currentStep === 1"
                  key="locked"
                  class="main-scroll-style absolute inset-0 z-20 flex flex-col items-center justify-start overflow-y-auto bg-cover bg-center p-6 text-center text-hw-white-main lg:justify-center"
                  :style="{ backgroundImage: tabletBackgroundImage }"
                >
                  <div
                    class="absolute inset-0 bg-hw-gray-darker/55"
                    aria-hidden="true"
                  />
                  <p class="relative z-10 text-h1 font-light">
                    {{ currentTime }}
                  </p>
                  <p class="relative z-10 mt-1 text-c1 text-hw-gray-light">
                    {{ currentDate }}
                  </p>
                  <div
                    class="relative z-10 mt-6 w-full max-w-xl rounded-xl border border-hw-red-lighter bg-hw-white-main p-5 text-left text-hw-text-primary shadow-lg lg:mt-24"
                  >
                    <p class="text-c1 text-hw-gray-main">
                      에코텍 물류 · 현장 알림
                    </p>
                    <h2 class="mt-2 text-h5 font-bold text-hw-red-darker">
                      도로 간섭물이 발견되었습니다
                    </h2>
                    <p class="mt-2 text-b3 text-hw-gray-dark">
                      현장 작업 중 통행로에 적치된 간섭물을 확인했습니다.
                    </p>
                  </div>
                  <TabletUnlockSlider
                    class="relative z-10 mt-4 shrink-0 lg:mt-auto"
                    @unlock="unlockTablet"
                  />
                </div>

                <div
                  v-else
                  key="scenario"
                  class="absolute inset-y-4 left-4 z-20 w-[360px] max-w-[calc(100%-32px)]"
                >
                  <div
                    class="flex h-full flex-col overflow-hidden rounded-xl border border-hw-gray-lighter bg-hw-white-main shadow-lg"
                  >
                    <div
                      class="flex items-center justify-between border-b border-hw-gray-lighter px-4 py-3"
                    >
                      <div>
                        <p class="text-c1 font-semibold text-hw-orange-main">
                          물류 Twin
                        </p>
                        <h2 class="text-h6 font-bold text-hw-text-primary">
                          도로 간섭물 이동 요청
                        </h2>
                      </div>
                    </div>

                    <div
                      class="main-scroll-style min-h-0 flex-1 overflow-y-auto p-4"
                    >
                      <LogisticsTwinScenarioCard
                        :current-step="currentStep"
                        :obstructions="visibleObstructions"
                        :selected-obstruction="selectedObstruction"
                        :target-obstruction="targetObstruction"
                        :dispatch-confirmed="dispatchConfirmed"
                        :selected-resource-codes="selectedDispatchResourceCodes"
                        :pending-location="pendingLocation"
                        :records="records"
                        @pick-location="pickRegisterLocation"
                        @register-obstruction="registerObstruction"
                        @skip-register="skipRegister"
                        @select-obstruction="selectObstruction"
                        @request-move="requestMove"
                        @confirm-dispatch="confirmDispatch"
                        @toggle-resource="toggleDispatchResource"
                        @update-step="currentStep = $event"
                        @complete-record="completeRecord"
                        @restart="restartScenario"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 rounded-md bg-hw-gray-darker px-4 py-3 text-s2 font-semibold text-hw-white-main shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </section>
  </LoggedPageShell>
</template>
