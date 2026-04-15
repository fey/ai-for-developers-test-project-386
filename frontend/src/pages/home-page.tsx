import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { bookPath } from '../lib/routes';

export const HomePage = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[radial-gradient(circle_at_15%_20%,rgba(10,99,255,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,122,24,0.2),transparent_40%),linear-gradient(180deg,#f9fafb,#f2f4f7)] px-4 py-14">
      <section className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('home.badge')}
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl" data-testid="home-title">
            {t('home.title')}
          </h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            {t('home.description')}
          </p>
          <Link className="inline-flex w-fit" to={bookPath()}>
            <Button size="lg" data-testid="home-cta-button">
              {t('home.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Card className="bg-white/80">
          <h2 className="text-xl font-semibold text-foreground">{t('home.featuresTitle')}</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• {t('home.features.slots')}</li>
            <li>• {t('home.features.conflict')}</li>
            <li>• {t('home.features.events')}</li>
          </ul>
        </Card>
      </section>
    </main>
  );
};
