import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';

import { adminPath, bookPath, homePath } from '../lib/routes';
import { cn } from '../lib/utils';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
  );

export const SiteNav = () => {
  const { t } = useTranslation();

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link className="flex items-center gap-2 font-semibold text-foreground" to={homePath()}>
          <CalendarClock className="h-5 w-5 text-primary" />
          {t('nav.brand')}
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink className={linkClass} to={bookPath()}>
            {t('nav.book')}
          </NavLink>
          <NavLink className={linkClass} to={adminPath()}>
            {t('nav.admin')}
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
