import { useEffect, useState } from 'react';

import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { formatTotalTime } from '@/features/typing/domain/metrics';
import {
  EMPTY_STATS,
  aggregate,
  getAllResults,
  getDailyEntries,
  type AggregateStats,
} from '@/services/storage/resultsRepository';
import type { TestResult } from '@/features/typing/domain/types';

interface StatisticsDashboardProps {
  readonly locale: Locale;
}

/**
 * Reads history from IndexedDB and renders the aggregate view.
 *
 * Loading is tracked explicitly so an empty database renders the empty state
 * rather than a flash of zeroes that looks like lost data.
 */
export function StatisticsDashboard({ locale }: StatisticsDashboardProps) {
  const [stats, setStats] = useState<AggregateStats>(EMPTY_STATS);
  const [recent, setRecent] = useState<readonly TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [results, entries] = await Promise.all([getAllResults(), getDailyEntries()]);
      if (cancelled) return;

      setStats(aggregate(results, entries));
      setRecent(
        [...results].sort((a, b) => b.completedAt - a.completedAt).slice(0, 10),
      );
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div
        className="h-64 animate-pulse rounded-2xl border border-border bg-surface"
        aria-busy="true"
        aria-label="Loading statistics"
      />
    );
  }

  if (stats.testsCompleted === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-fg-muted">{t(locale, 'stats.empty')}</p>
        <a
          href="/typing-test/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-[filter] hover:brightness-110"
        >
          {t(locale, 'common.startTyping')}
        </a>
      </div>
    );
  }

  const tiles: readonly { label: string; value: string }[] = [
    { label: t(locale, 'stats.testsCompleted'), value: String(stats.testsCompleted) },
    { label: t(locale, 'stats.averageWpm'), value: String(Math.round(stats.averageWpm)) },
    { label: t(locale, 'stats.bestWpm'), value: String(Math.round(stats.bestWpm)) },
    {
      label: t(locale, 'stats.averageAccuracy'),
      value: `${Math.round(stats.averageAccuracy)}%`,
    },
    { label: t(locale, 'stats.timeTyping'), value: formatTotalTime(stats.totalTimeMs) },
  ];

  const dateFormatter = new Intl.DateTimeFormat(locale === 'pt-br' ? 'pt-BR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="flex flex-col gap-10">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-surface p-5">
            <dt className="text-xs uppercase tracking-wide text-fg-subtle">{tile.label}</dt>
            <dd className="mt-2 font-mono text-3xl font-bold tabular-nums text-fg">
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="text-xl font-semibold">{t(locale, 'stats.history')}</h2>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-fg-muted">
                  {t(locale, 'common.published')}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-fg-muted">
                  {t(locale, 'test.wpm')}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-fg-muted">
                  {t(locale, 'test.accuracy')}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-fg-muted">
                  {t(locale, 'test.mode')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {recent.map((result) => (
                <tr key={result.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {dateFormatter.format(new Date(result.completedAt))}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-fg">
                    {Math.round(result.wpm)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-fg">
                    {`${Math.round(result.accuracy)}%`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {result.mode === 'time' ? `${result.limit}s` : `${result.limit}w`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-fg-subtle">{t(locale, 'results.saveHint')}</p>
    </div>
  );
}
