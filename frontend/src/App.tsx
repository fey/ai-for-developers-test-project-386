import { Navigate, Route, Routes } from 'react-router-dom';

import { SiteNav } from './components/site-nav';
import { adminPath, bookPath, homePath } from './lib/routes';
import { AdminLayout } from './pages/admin-layout';
import { BookEventTypePage } from './pages/book-event-type-page';
import { BookPage } from './pages/book-page';
import { EventTypeEditPage } from './pages/event-type-edit-page';
import { EventTypeNewPage } from './pages/event-type-new-page';
import { EventTypesPage } from './pages/event-types-page';
import { EventsPage } from './pages/events-page';
import { HomePage } from './pages/home-page';

export const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SiteNav />
    <Routes>
      <Route element={<HomePage />} path={homePath()} />
      <Route element={<BookPage />} path={bookPath()} />
      <Route element={<BookEventTypePage />} path="/book/:slug" />
      <Route element={<AdminLayout />} path={adminPath()}>
        <Route element={<Navigate replace to="events" />} index />
        <Route element={<EventsPage />} path="events" />
        <Route element={<EventTypesPage />} path="event-types" />
        <Route element={<EventTypeNewPage />} path="event-types/new" />
        <Route element={<EventTypeEditPage />} path="event-types/:id" />
      </Route>
      <Route element={<Navigate replace to={homePath()} />} path="*" />
    </Routes>
  </div>
);
