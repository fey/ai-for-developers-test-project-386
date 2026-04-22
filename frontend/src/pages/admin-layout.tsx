import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';

import { adminEventTypesPath, adminEventsPath } from '../lib/routes';
import { cn } from '../lib/utils';

const sidebarLinkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
  );

export const AdminLayout = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-4 shadow-xs" data-testid="admin-sidebar">
          <h1 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('admin.sidebar.title')}</h1>
          <nav className="flex gap-2 md:flex-col">
            <NavLink className={sidebarLinkClass} data-testid="admin-nav-events" to={adminEventsPath()}>
              {t('admin.sidebar.events')}
            </NavLink>
            <NavLink className={sidebarLinkClass} data-testid="admin-nav-event-types" to={adminEventTypesPath()}>
              {t('admin.sidebar.eventTypes')}
            </NavLink>
          </nav>
        </aside>

        <section className="min-w-0" data-testid="admin-content">
          <Outlet />
        </section>
      </div>
    </main>
  );
};
