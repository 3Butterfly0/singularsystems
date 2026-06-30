import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="border-t border-surface/60 bg-background mt-24">
      <div className="px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="text-2xl font-extrabold tracking-tighter uppercase mb-4">
            Singular<span className="text-electric">.</span>
          </div>
          <p className="text-sm text-ink/60 max-w-sm leading-relaxed">
            Engineered in cleanroom conditions. Calibrated to absolute zero
            tolerance. Each machine is a singular act of computation.
          </p>
        </div>
        <div>
          <div className="label text-ink/40 mb-4">Catalog</div>
          <ul className="space-y-3 text-sm">
            <li><Link to="/builder" className="hover:text-electric">Builder</Link></li>
            <li><Link to="/prebuilts" className="hover:text-electric">Prebuilts</Link></li>
            <li><Link to="/product/s-type-monolith" className="hover:text-electric">Components</Link></li>
          </ul>
        </div>
        <div>
          <div className="label text-ink/40 mb-4">Company</div>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="hover:text-electric">About</Link></li>
            <li><a href="#" className="hover:text-electric">Press</a></li>
            <li><a href="#" className="hover:text-electric">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-surface/60 px-6 lg:px-10 py-6 flex justify-between label text-ink/40">
        <span>© {new Date().getFullYear()} Singular Systems</span>
        <span>ISO 9001 · Cleanroom Class 5</span>
      </div>
    </footer>
  );
}
