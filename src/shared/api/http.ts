import { create } from 'axios'

const DEFAULT_API_BASE_URL = 'https://api-playground.musma.net'

function resolveBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL
  if (explicit && explicit.length > 0) return explicit

  // VITE_API_BASE_URL이 없으면 배포된 백엔드 도메인을 사용한다.
  // LAN IP 등 다른 백엔드로 붙이려면 VITE_API_BASE_URL로 override 한다.
  return DEFAULT_API_BASE_URL
}

export const http = create({
  baseURL: resolveBaseUrl(),
  // 백엔드 transport/gps2 엔드포인트는 공개(androidId 기반)이며 CORS가 열려 있어
  // credentials를 보내지 않는다.
  withCredentials: false,
})
