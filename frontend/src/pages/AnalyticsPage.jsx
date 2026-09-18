import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import {
  getCurrentMonthString,
  getMonthStringForDate,
} from '../utils/monthlyReset';
import {
  formatCurrency,
  convertCurrency,
  getSelectedCurrency,
} from '../utils/currency';
import { getTransactions } from '../utils/api';

export function AnalyticsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [error, setError] = useState('');

  const [convertedAnalytics, setConvertedAnalytics] = useState(null);

  const selectedCurrency = getSelectedCurrency();

  useEffect(() => {
    let ignore = false;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getTransactions();

        if (!ignore) {
          setTransactions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setTransactions([]);
          setError(err?.message || 'Failed to load transaction data.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      ignore = true;
    };
  }, []);

  /*
   * First calculate everything in the database's base currency (INR).
   * Conversion is applied only after the calculations are complete.
   */
  const analytics = useMemo(() => {
    const totals = {
      income: 0,
      expense: 0,
    };

    const counts = {
      total: 0,
      income: 0,
      expense: 0,
    };

    const byCategory = {};
    const monthly = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;

      counts.total += 1;

      if (tx.type === 'income') {
        totals.income += amt;
        counts.income += 1;
      } else {
        totals.expense += amt;
        counts.expense += 1;

        const cat = tx.category || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + amt;
      }

      const key = getMonthStringForDate(tx.date);

      if (key) {
        if (!monthly[key]) {
          monthly[key] = {
            income: 0,
            expense: 0,
          };
        }

        if (tx.type === 'income') {
          monthly[key].income += amt;
        } else {
          monthly[key].expense += amt;
        }
      }
    });

    const net = totals.income - totals.expense;

    let topCategory = null;
    let topAmount = 0;

    Object.entries(byCategory).forEach(([cat, val]) => {
      if (val > topAmount) {
        topAmount = val;
        topCategory = cat;
      }
    });

    let monthlyArray = Object.keys(monthly)
      .sort()
      .map((key) => ({
        month: key,
        ...monthly[key],
      }));

    const currentKey = getCurrentMonthString();

    if (!monthly[currentKey]) {
      monthlyArray.push({
        month: currentKey,
        income: 0,
        expense: 0,
      });

      monthlyArray = monthlyArray.sort((a, b) =>
        a.month > b.month ? 1 : -1
      );
    }

    return {
      totals,
      net,
      counts,
      byCategory,
      topCategory,
      topAmount,
      monthly: monthlyArray,
    };
  }, [transactions]);

  /*
   * Convert all monetary values from INR to the selected currency.
   * Percentages and transaction counts are NOT converted.
   */
  useEffect(() => {
    let ignore = false;

    const convertAnalytics = async () => {
      if (!analytics) return;

      try {
        setConversionLoading(true);

        // No conversion required when INR is selected.
        if (selectedCurrency === 'INR') {
          if (!ignore) {
            setConvertedAnalytics(analytics);
          }
          return;
        }

        const convertedIncome = await convertCurrency(
          analytics.totals.income,
          'INR',
          selectedCurrency
        );

        const convertedExpense = await convertCurrency(
          analytics.totals.expense,
          'INR',
          selectedCurrency
        );

        const convertedNet = convertedIncome - convertedExpense;

        const convertedTopAmount = analytics.topCategory
          ? await convertCurrency(
              analytics.topAmount,
              'INR',
              selectedCurrency
            )
          : 0;

        const convertedCategories = {};

        for (const [category, amount] of Object.entries(
          analytics.byCategory
        )) {
          convertedCategories[category] = await convertCurrency(
            amount,
            'INR',
            selectedCurrency
          );
        }

        const convertedMonthly = await Promise.all(
          analytics.monthly.map(async (month) => ({
            month: month.month,
            income: await convertCurrency(
              month.income,
              'INR',
              selectedCurrency
            ),
            expense: await convertCurrency(
              month.expense,
              'INR',
              selectedCurrency
            ),
          }))
        );

        if (!ignore) {
          setConvertedAnalytics({
            ...analytics,
            totals: {
              income: convertedIncome,
              expense: convertedExpense,
            },
            net: convertedNet,
            byCategory: convertedCategories,
            topAmount: convertedTopAmount,
            monthly: convertedMonthly,
          });
        }
      } catch (err) {
        console.error('Currency conversion failed:', err);

        if (!ignore) {
          // Fall back to original INR values rather than showing broken data.
          setConvertedAnalytics(analytics);
        }
      } finally {
        if (!ignore) {
          setConversionLoading(false);
        }
      }
    };

    convertAnalytics();

    return () => {
      ignore = true;
    };
  }, [analytics, selectedCurrency]);

  const displayAnalytics = convertedAnalytics || analytics;

  const totalExpenses = displayAnalytics.totals.expense;
  const hasData = transactions.length > 0;

  if (loading) {
    return (
      <>
        <header>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Analytics
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Financial performance, trends, and category distribution insights
          </p>
        </header>

        <Card className="flex flex-col gap-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loading analytics...
          </p>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Analytics
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Financial performance, trends, and category distribution insights
          </p>
        </header>

        <Card className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-primary">
            Unable to load analytics
          </h2>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {error}
          </p>
        </Card>
      </>
    );
  }

  if (conversionLoading || !convertedAnalytics) {
    return (
      <>
        <header>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Analytics
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Financial performance, trends, and category distribution insights
          </p>
        </header>

        <Card className="flex flex-col gap-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Converting amounts to {selectedCurrency}...
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <header>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
          Analytics
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
          Financial performance, trends, and category distribution insights
        </p>
      </header>

      {!hasData ? (
        <Card className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-primary">
            Analytics
          </h2>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            No transaction data available yet.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {/* Spending Over Time */}
          <Card className="flex flex-col gap-md">
            <h2 className="font-headline-md text-headline-md text-primary">
              Spending Over Time
            </h2>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Monthly spending trends overview
            </p>

            <div className="mt-md grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Total Income
                </span>

                <div className="text-headline-md font-bold text-on-tertiary-container">
                  {formatCurrency(displayAnalytics.totals.income)}
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Total Expenses
                </span>

                <div className="text-headline-md font-bold text-primary">
                  {formatCurrency(displayAnalytics.totals.expense)}
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Net Balance
                </span>

                <div
                  className={`text-headline-md font-bold ${
                    displayAnalytics.net >= 0
                      ? 'text-on-tertiary-container'
                      : 'text-error'
                  }`}
                >
                  {displayAnalytics.net >= 0
                    ? formatCurrency(displayAnalytics.net)
                    : `-${formatCurrency(
                        Math.abs(displayAnalytics.net)
                      )}`}
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Transactions
                </span>

                <div className="text-headline-md font-bold text-primary">
                  {displayAnalytics.counts.total}
                </div>
              </div>
            </div>

            <div className="mt-md">
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                Monthly
              </h3>

              <div className="mt-sm space-y-3">
                {displayAnalytics.monthly.map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center justify-between"
                  >
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {m.month}
                    </div>

                    <div className="flex items-center gap-sm min-w-0 ml-4">
                      {m.income > 0 && (
                        <div className="text-body-sm font-semibold text-on-tertiary-container">
                          +{formatCurrency(m.income)}
                        </div>
                      )}

                      {m.expense > 0 && (
                        <div className="text-body-sm font-semibold text-error">
                          -{formatCurrency(m.expense)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Category Breakdown */}
          <Card className="flex flex-col gap-md">
            <h2 className="font-headline-md text-headline-md text-primary">
              Category Breakdown
            </h2>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Expense distribution by category
            </p>

            <div className="mt-md flex flex-col gap-sm">
              {Object.keys(displayAnalytics.byCategory).length === 0 ? (
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  No expense categories yet.
                </div>
              ) : (
                Object.entries(displayAnalytics.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct =
                      totalExpenses > 0
                        ? Math.round((amount / totalExpenses) * 100)
                        : 0;

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between gap-md"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-body-sm text-body-sm font-semibold text-primary truncate">
                              {cat}
                            </div>

                            <div className="font-body-sm text-body-sm text-on-surface-variant">
                              {formatCurrency(amount)}
                            </div>
                          </div>

                          <div className="mt-xs w-full bg-surface-container-low rounded-full h-2">
                            <div
                              className="bg-primary-container h-2 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="w-12 text-right font-body-sm text-body-sm text-on-surface-variant">
                          {pct}%
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {displayAnalytics.topCategory && (
              <div className="mt-md">
                <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                  Top Spending Category
                </h3>

                <div className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
                  {displayAnalytics.topCategory} —{' '}
                  {formatCurrency(displayAnalytics.topAmount)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}