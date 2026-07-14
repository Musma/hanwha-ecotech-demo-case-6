import type { Map as MapLibreMap } from 'maplibre-gl'

/** MapLibre attribution을 최초 렌더링부터 info 아이콘으로 접어 둔다. */
export function collapseMapAttribution(map: MapLibreMap): void {
  const collapse = () => {
    const attributionControl =
      map
        .getContainer()
        .querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib') ?? null

    attributionControl?.classList.remove('maplibregl-compact-show')
    attributionControl?.removeAttribute('open')
  }

  collapse()
  window.requestAnimationFrame(collapse)
  map.once('load', collapse)
}
