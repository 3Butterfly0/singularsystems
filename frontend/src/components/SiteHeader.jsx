import { Link, useLocation } from 'react-router-dom';

export function SiteHeader() {
  const location = useLocation();
  const linkBase = 'label text-ink/60 hover:text-ink transition-colors';
  const activeClass = 'label text-ink';

  const getLinkClass = (path) =>
    location.pathname === path ? activeClass : linkBase;

  return (
    <header className="sticky top-0 z-50 border-b border-surface/60 bg-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 lg:px-10 py-6">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-lg font-extrabold tracking-tighter uppercase">
            Singular<span className="text-electric">.</span>
          </Link>
          <nav className="hidden lg:flex gap-8">
            <Link to="/builder" className={getLinkClass('/builder')}>
              Builder
            </Link>
            <Link to="/prebuilts" className={getLinkClass('/prebuilts')}>
              Prebuilts
            </Link>
            <Link to="/about" className={getLinkClass('/about')}>
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="label text-ink/60 hover:text-ink transition-colors px-3 py-2"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-electric text-primary-foreground px-5 py-3 label hover:bg-ink transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
