/**
 * Flutter WebView 브리지에서 공유하는 상수.
 * Flutter는 아래 전역/이벤트 이름으로 web 쪽에 값을 주입한다.
 */

/** Flutter가 로드 시 window에 주입하는 androidId 전역 키. */
export const FLUTTER_ANDROID_ID_GLOBAL = '__ANDROID_ID__'

/** Flutter가 androidId를 전달할 때 dispatch 하는 CustomEvent 이름. */
export const FLUTTER_ANDROID_ID_EVENT = 'flutterAndroidId'

/** Flutter가 위치 권한 상태를 전달할 때 dispatch 하는 CustomEvent 이름. */
export const FLUTTER_LOCATION_PERMISSION_EVENT = 'flutterLocationPermission'

/** Flutter가 gps2 저장 성공 후 위치 포인트를 전달하는 CustomEvent 이름. */
export const FLUTTER_POINT_SAVED_EVENT = 'flutterPointSaved'
