export default function CRTOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] will-change-transform transform-gpu"
      aria-hidden="true"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 crt-scanlines-bg" />

      {/* Vignette */}
      <div className="absolute inset-0 crt-vignette-bg" />
    </div>
  );
}
