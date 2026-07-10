import { http } from '@/shared/api'
import type { MatchCheckResponse } from '@/shared/types/transport'

/**
 * androidId로 매칭된 차량(리소스)이 있는지 조회한다.
 * matched=false여도 200으로 응답한다.
 */
export async function checkResourceMatch(
  androidId: string,
): Promise<MatchCheckResponse> {
  const response = await http.get<MatchCheckResponse>(
    '/transport/resources/match',
    { params: { androidId } },
  )
  return response.data
}
