const brands = [
  'INTEL', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'CORSAIR',
  'SAMSUNG', 'WESTERN DIGITAL', 'NZXT', 'LIAN LI', 'GIGABYTE', 'EVGA',
];

export function BrandMarquee() {
  return (
    <section className="border-y border-surface/60 bg-background overflow-hidden">
      <div className="px-6 lg:px-10 py-4 label text-ink/40 border-b border-surface/60">
        Hardware Partners — Tier 1 Authorized
      </div>
      <div className="relative overflow-hidden py-8">
        <div className="flex gap-16 animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          {[...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="text-2xl md:text-3xl font-extrabold tracking-tighter uppercase text-ink/30 hover:text-electric transition-colors"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
