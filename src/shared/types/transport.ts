/** transport 도메인(차량 매칭)에서 사용하는 공통 타입. */

/** `/transport/resources/match`가 반환하는 매칭된 차량(리소스). */
export interface MatchedResource {
  id: string
  resourceCode: string
  vehicleNumber: string
  androidId: string
  createdAt: string
  updatedAt: string
}

/** `/transport/resources/match` 응답 형태. */
export interface MatchCheckResponse {
  matched: boolean
  resource: MatchedResource | null
}
