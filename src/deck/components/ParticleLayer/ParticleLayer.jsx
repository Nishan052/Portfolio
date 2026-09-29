/**
 * Where the WebGL engine mounts its canvas, plus the SVG filter the engine applies for the brief
 * chromatic-aberration punch on a scene change. Empty in simple mode: nothing is ever mounted.
 */
export default function ParticleLayer() {
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <filter id="dk-chroma" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feOffset id="dk-chroma-r" in="SourceGraphic" dx="0" dy="0" result="rOff" />
          <feColorMatrix in="rOff" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rCh" />
          <feOffset id="dk-chroma-b" in="SourceGraphic" dx="0" dy="0" result="bOff" />
          <feColorMatrix in="bOff" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bCh" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gCh" />
          <feBlend in="rCh" in2="gCh" mode="screen" result="rg" />
          <feBlend in="rg" in2="bCh" mode="screen" />
        </filter>
      </svg>
      <div className="dk-gl-mount" />
    </>
  );
}
