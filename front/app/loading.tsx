export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/65 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Yuklanmoqda"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-primary/20 blur-lg" />
          <div className="relative inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-primary/20 shadow-[0_0_40px_rgba(0,180,255,0.18)]">
            <img
              src="/logo.png"
              alt="YEC Market"
              className="h-24 w-24 object-contain animate-logo-3d-rtl motion-reduce:animate-none"
            />
          </div>
        </div>
        <p className="text-sm font-semibold text-ink/70">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
